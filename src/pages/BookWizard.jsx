import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGemini } from "../contexts/GeminiContext";
import { createProject, createChapter, updateProject, getChapters, updateChapter, createAsset, getUserSeries } from "../lib/firestore";
import { generateFullBookContent, generateConsistentIllustrations, generateBookCover, generatePuzzleBook } from "../lib/gemini";
import { KDP_TRIM_SIZES, BOOK_TYPES, ART_STYLES, estimateKdpPricing, getArtStylesForCategory } from "../lib/kdpFormats";
import { BOOK_CATEGORIES, COMIC_PANEL_LAYOUTS, getCategoryConfig, getPageTerminology } from "../lib/bookGenres";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

const BASE_STEPS = [
  { id: "category", label: "Category", icon: "category" },
  { id: "concept", label: "Concept", icon: "lightbulb" },
  { id: "format", label: "Format", icon: "auto_stories" },
  { id: "style", label: "Style", icon: "palette" },
  { id: "generate", label: "Generate", icon: "auto_awesome" },
];

export default function BookWizard() {
  const { user } = useAuth();
  const { apiKey, hasApiKey } = useGemini();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);

  // Category step
  const [bookCategory, setBookCategory] = useState("children");

  // Concept step
  const [topic, setTopic] = useState("");
  const [genre, setGenre] = useState("adventure");
  const [targetAge, setTargetAge] = useState("3-6");
  const [synopsis, setSynopsis] = useState("");

  // Format step
  const [bookType, setBookType] = useState("picture-book");
  const [trimSize, setTrimSize] = useState("8.5x8.5");
  const [pageCount, setPageCount] = useState(32);
  const [interiorType, setInteriorType] = useState("premium-color");

  // Style step
  const [artStyle, setArtStyle] = useState("cartoon");
  const [colorPalette, setColorPalette] = useState("vibrant and colorful");
  const [characterDesc, setCharacterDesc] = useState("");

  // Comic-specific
  const [panelLayout, setPanelLayout] = useState("5-panel");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [genPhase, setGenPhase] = useState("");
  const [genProgress, setGenProgress] = useState(0);
  const [genTotal, setGenTotal] = useState(0);
  const [genLog, setGenLog] = useState([]);
  const [generatedBook, setGeneratedBook] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});
  const [error, setError] = useState("");
  const [createdProjectId, setCreatedProjectId] = useState(null);
  const [userSeries, setUserSeries] = useState([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState("");

  const catConfig = getCategoryConfig(bookCategory);
  const terminology = getPageTerminology(bookCategory);
  const filteredArtStyles = getArtStylesForCategory(bookCategory);
  const selectedStyle = ART_STYLES.find((s) => s.id === artStyle) || filteredArtStyles[0];
  const selectedSize = KDP_TRIM_SIZES[trimSize];
  const selectedType = BOOK_TYPES[bookType];
  const pricing = selectedType ? estimateKdpPricing(pageCount, interiorType, trimSize) : null;

  // When category changes, reset dependent fields
  const handleCategoryChange = useCallback((catId) => {
    const cat = getCategoryConfig(catId);
    setBookCategory(catId);
    setGenre(cat.defaultGenre);
    setTargetAge(cat.defaultAgeRange);
    setTopic("");
    setSynopsis("");
    // Set sensible default book type & format for this category
    const defaultType = cat.recommendedBookTypes?.[0] || "picture-book";
    setBookType(defaultType);
    const typeInfo = BOOK_TYPES[defaultType];
    if (typeInfo?.recommendedSizes?.[0]) setTrimSize(typeInfo.recommendedSizes[0]);
    if (typeInfo?.recommendedPages) setPageCount(typeInfo.recommendedPages[Math.floor(typeInfo.recommendedPages.length / 2)]);
    if (typeInfo?.interiorType) setInteriorType(typeInfo.interiorType);
    // Reset style to first valid for this category
    const validStyles = getArtStylesForCategory(catId);
    if (validStyles.length > 0) setArtStyle(validStyles[0].id);
    if (catId === 'comic') setPanelLayout('5-panel');
  }, []);

  useEffect(() => {
    if (!user) return;
    getUserSeries(user.uid).then(setUserSeries).catch(console.error);
  }, [user]);

  const addLog = useCallback((msg) => {
    setGenLog((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  }, []);

  const isTextOnly = selectedStyle?.textOnly === true;

  const handleGenerate = async () => {
    if (!hasApiKey || !topic.trim()) return;
    setGenerating(true);
    setError("");
    setGenLog([]);
    setGenProgress(0);

    try {
      // — PUZZLE BOOK SPECIAL PATH —
      if (bookCategory === 'puzzle') {
        setGenPhase("content");
        addLog(`🧩 Generating ${genre === 'word-search' ? 'word search' : 'crossword'} puzzle book...`);

        const puzzles = [];

        // Create project first
        const projectId = await createProject(user.uid, {
          title: topic.trim(),
          genre,
          targetAge,
          bookCategory,
          synopsis: synopsis.trim() || topic.trim(),
          trimSize,
          bookType,
          interiorType,
          pageCount,
          styleGuide: { artStyle: '', colorPalette: '', textOnly: true, characters: [], environmentRules: '', additionalRules: '' },
          seriesId: selectedSeriesId || null,
        });
        setCreatedProjectId(projectId);

        // Stream puzzle generation
        setGenTotal(pageCount);
        let bookTitle = topic;
        const generator = generatePuzzleBook(apiKey, { topic: topic.trim(), genre, targetAge, pageCount, synopsis: synopsis.trim() || undefined });

        for await (const event of generator) {
          if (event.type === 'meta') {
            bookTitle = event.book.title;
            addLog(`📚 Book: "${event.book.title}"`);
            addLog(`✨ ${event.book.tagline}`);
            await updateProject(user.uid, projectId, { title: event.book.title });
          } else if (event.type === 'puzzle') {
            const { puzzleNumber, title: puzzleTitle, svgPuzzle, svgAnswer, text: puzzleText, sceneDescription, placedCount, totalWords } = event;
            addLog(`✅ ${puzzleTitle} — ${placedCount}/${totalWords} words placed`);

            // Save puzzle and answer key as assets
            let puzzleUrl = svgPuzzle;
            let answerUrl = svgAnswer;

            try {
              const pRef = ref(storage, `users/${user.uid}/projects/${projectId}/puzzle_${puzzleNumber}_${Date.now()}.png`);
              await uploadString(pRef, svgPuzzle, 'data_url');
              puzzleUrl = await getDownloadURL(pRef);

              const aRef = ref(storage, `users/${user.uid}/projects/${projectId}/answer_${puzzleNumber}_${Date.now()}.png`);
              await uploadString(aRef, svgAnswer, 'data_url');
              answerUrl = await getDownloadURL(aRef);
            } catch { /* use data URL fallback */ }

            // Save as chapter
            const chId = await createChapter(user.uid, projectId, {
              title: puzzleTitle,
              number: puzzleNumber,
              content: puzzleText,
              sceneDescription,
              illustrationUrl: puzzleUrl,
              answerKeyUrl: answerUrl,
            });

            // Save as assets
            await createAsset(user.uid, projectId, { name: puzzleTitle, type: 'puzzle', pageNumber: puzzleNumber, url: puzzleUrl, storagePath: '', prompt: sceneDescription, style: genre });
            await createAsset(user.uid, projectId, { name: `${puzzleTitle} — Answer Key`, type: 'answer-key', pageNumber: puzzleNumber, url: answerUrl, storagePath: '', prompt: 'Answer key', style: genre });

            puzzles.push({ ...event, puzzleUrl, answerUrl, chId });
            setGenProgress(puzzleNumber);
            setGeneratedImages((prev) => ({ ...prev, [puzzleNumber]: puzzleUrl }));
          } else if (event.type === 'error') {
            addLog(`⚠️ Puzzle ${event.puzzleNumber} failed: ${event.error}`);
            setGenProgress((p) => p + 1);
          } else if (event.type === 'done') {
            addLog(`🎉 ${event.total} puzzles generated! Answer keys included.`);
          }
        }

        // Generate cover
        setGenPhase('cover');
        addLog('📕 Generating cover...');
        try {
          const cover = await generateBookCover(apiKey, { title: bookTitle, synopsis: topic, style: '', trimSize, bookCategory });
          const coverRef = ref(storage, `users/${user.uid}/projects/${projectId}/cover_${Date.now()}.png`);
          await uploadString(coverRef, cover, 'data_url');
          const coverUrl = await getDownloadURL(coverRef);
          await updateProject(user.uid, projectId, { coverImageUrl: coverUrl, status: 'complete', progress: 100, title: bookTitle });
          addLog('✅ Cover saved!');
        } catch (e) {
          addLog(`⚠️ Cover failed: ${e.message}`);
          await updateProject(user.uid, projectId, { status: 'complete', progress: 100, title: bookTitle });
        }

        addLog('🎉 Puzzle book complete! Puzzles + answer keys ready.');
        setGenerating(false);
        return;
      }

      // — STANDARD BOOK PATH —
      addLog(`🧠 Generating ${catConfig.label} content...`);
      const book = await generateFullBookContent(apiKey, {
        topic: topic.trim(),
        genre,
        targetAge,
        pageCount,
        bookType,
        synopsis: synopsis.trim() || undefined,
        bookCategory,
      });
      setGeneratedBook(book);
      addLog(`✅ "${book.title}" created with ${book.pages.length} ${terminology.plural.toLowerCase()}`);
      if (book.mainCharacter?.name && book.mainCharacter.name !== 'None') {
        addLog(`📖 Main character: ${book.mainCharacter.name}`);
      }
      addLog(`💡 Theme: ${book.lesson || 'N/A'}`);

      const images = {};

      if (!isTextOnly) {
        // Phase 2: Generate illustrations
        setGenPhase("illustrations");
        setGenTotal(book.pages.length);
        addLog(`🎨 Generating ${terminology.plural.toLowerCase()} illustrations (${book.pages.length})...`);

        const styleGuide = {
          artStyle: selectedStyle?.prompt || "professional book illustration",
          colorPalette,
          genre,
          textOnly: isTextOnly,
          characters: book.mainCharacter && book.mainCharacter.name !== 'None'
            ? [{ name: book.mainCharacter.name, visualDescription: book.mainCharacter.description }]
            : [],
          environmentRules: "",
        };

        const generator = generateConsistentIllustrations(apiKey, book.pages, styleGuide, {
          aspectRatio: selectedSize?.imageAspectRatio || "1:1",
          bookCategory,
          panelLayout,
        });
        for await (const result of generator) {
          if (result.status === "success") {
            images[result.pageNumber] = result.imageUrl;
            addLog(`✅ ${terminology.page} ${result.pageNumber} illustration complete`);
          } else {
            addLog(`⚠️ ${terminology.page} ${result.pageNumber} failed: ${result.error}`);
          }
          setGenProgress((prev) => prev + 1);
          setGeneratedImages({ ...images });
        }
      } else {
        addLog(`📝 Text-only style selected — skipping illustration generation`);
      }

      // Phase 3: Generate cover
      setGenPhase("cover");
      addLog("📕 Generating book cover...");
      let cover = null;
      try {
        cover = await generateBookCover(apiKey, {
          title: book.title,
          synopsis: book.lesson || synopsis,
          style: selectedStyle?.prompt,
          trimSize,
          bookCategory,
        });
        addLog("✅ Cover generated!");
      } catch (coverErr) {
        addLog(`⚠️ Cover generation failed: ${coverErr.message}`);
      }

      // Phase 4: Save to Firestore
      setGenPhase("saving");
      addLog("💾 Creating project...");

      const projectId = await createProject(user.uid, {
        title: book.title,
        genre,
        targetAge,
        bookCategory,
        synopsis: book.lesson || synopsis,
        trimSize,
        bookType,
        interiorType,
        pageCount,
        styleGuide: {
          artStyle: selectedStyle?.prompt || "",
          colorPalette,
          textOnly: isTextOnly,
          characters: book.mainCharacter && book.mainCharacter.name !== 'None'
            ? [{ name: book.mainCharacter.name, visualDescription: book.mainCharacter.description }]
            : [],
          environmentRules: "",
          additionalRules: "",
        },
        seriesId: selectedSeriesId || null,
      });
      setCreatedProjectId(projectId);

      // Save chapters
      const pageImageMap = {};
      for (const page of book.pages) {
        const chId = await createChapter(user.uid, projectId, {
          title: `${terminology.page} ${page.pageNumber}`,
          number: page.pageNumber,
          content: page.text,
          sceneDescription: page.sceneDescription,
          illustrationUrl: "",
        });
        pageImageMap[page.pageNumber] = chId;
      }

      // Save images as assets and link to chapters
      if (!isTextOnly) {
        const savedChapters = await getChapters(user.uid, projectId);
        for (const [pageNum, dataUrl] of Object.entries(images)) {
          try {
            const filename = `page_${pageNum}_${Date.now()}.png`;
            const storageRef = ref(storage, `users/${user.uid}/projects/${projectId}/${filename}`);
            await uploadString(storageRef, dataUrl, "data_url");
            const downloadUrl = await getDownloadURL(storageRef);
            await createAsset(user.uid, projectId, {
              name: `${terminology.page} ${pageNum} Illustration`,
              type: "illustration",
              pageNumber: Number(pageNum),
              url: downloadUrl,
              storagePath: storageRef.fullPath,
              prompt: book.pages[pageNum - 1]?.sceneDescription || "",
              style: selectedStyle?.label || "",
            });
            const chapter = savedChapters.find((c) => c.number === Number(pageNum));
            if (chapter) {
              await updateChapter(user.uid, projectId, chapter.id, { illustrationUrl: downloadUrl });
            }
          } catch {
            // Continue saving other images
          }
        }
      }

      // Save cover
      if (cover) {
        try {
          const coverRef = ref(storage, `users/${user.uid}/projects/${projectId}/cover_${Date.now()}.png`);
          await uploadString(coverRef, cover, "data_url");
          const coverUrl = await getDownloadURL(coverRef);
          await updateProject(user.uid, projectId, {
            coverImageUrl: coverUrl,
            status: "illustrating",
            progress: 60,
          });
          addLog("✅ Cover saved!");
        } catch (e) {
          addLog(`⚠️ Cover save failed: ${e.message}`);
        }
      } else {
        await updateProject(user.uid, projectId, { status: "illustrating", progress: 60 });
      }
      addLog("🎉 Book creation complete! Ready for review.");
    } catch (err) {
      setError(err.message || "Generation failed.");
      addLog(`❌ Error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const canProceed =
    step === 0 ? true :
    step === 1 ? topic.trim().length > 0 :
    true;

  // Book types filtered to the current category
  const filteredBookTypes = Object.entries(BOOK_TYPES).filter(
    ([, t]) => !t.category || t.category === bookCategory
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <span className="text-primary">✨</span>
            Book Wizard
          </h2>
          <p className="text-slate-500 mt-1">
            {catConfig.emoji} Creating a <strong>{catConfig.label}</strong> — AI generates your entire book in minutes.
          </p>
        </div>
      </div>

      {/* No API Key */}
      {!hasApiKey && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
          <span className="material-symbols-outlined text-amber-500">warning</span>
          <p className="text-sm text-amber-700">Set your Gemini API key in Settings to use the Book Wizard.</p>
          <button onClick={() => navigate("/settings")} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 ml-auto">Settings</button>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-0 mb-10">
        {BASE_STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button
              onClick={() => !generating && i <= step && setStep(i)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                i === step
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : i < step
                  ? "bg-primary/10 text-primary"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {i < step ? "check_circle" : s.icon}
              </span>
              {s.label}
            </button>
            {i < BASE_STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${i < step ? "bg-primary" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">

        {/* Step 0: Category */}
        {step === 0 && (
          <div className="p-8">
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">category</span>
              What type of book are you creating?
            </h3>
            <p className="text-sm text-slate-500 mb-8">Choose a category to tailor the wizard, AI prompts, and art styles.</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(BOOK_CATEGORIES).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                    bookCategory === cat.id
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-slate-200 hover:border-primary/40"
                  }`}
                >
                  <div className="text-3xl mb-3">{cat.emoji}</div>
                  <p className="font-black text-base mb-1">{cat.label}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{cat.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Concept */}
        {step === 1 && (
          <div className="p-8">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">lightbulb</span>
              {catConfig.emoji} What's your {catConfig.label.toLowerCase()} about?
            </h3>
            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                  Topic / Title Idea
                </label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold focus:ring-primary focus:border-primary"
                  placeholder={
                    bookCategory === 'comic' ? "e.g., A masked hero defends the city from a shadowy force..." :
                    bookCategory === 'fiction' ? "e.g., A detective who can smell lies is hired for an impossible case..." :
                    bookCategory === 'christian' ? "e.g., Finding peace in the storms of life..." :
                    bookCategory === 'humor' ? "e.g., Things my cat thinks about while judging me..." :
                    bookCategory === 'puzzle' ? "e.g., Ocean animals themed puzzle book..." :
                    "e.g., A brave bunny learns to share..."
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Synopsis (optional)</label>
                <textarea
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary min-h-[100px] resize-none"
                  placeholder="Brief description of your story idea... Leave blank and AI will create one!"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Genre</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  >
                    {catConfig.genres.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Target Audience</label>
                  <select
                    value={targetAge}
                    onChange={(e) => setTargetAge(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  >
                    {catConfig.ageRanges.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Link to Series (optional)</label>
                <select
                  value={selectedSeriesId}
                  onChange={(e) => setSelectedSeriesId(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                >
                  <option value="">No series (standalone book)</option>
                  {userSeries.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Format */}
        {step === 2 && (
          <div className="p-8">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_stories</span>
              Book Format & Size
            </h3>

            {/* Book Type */}
            <div className="mb-8">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Book Type</label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredBookTypes.map(([id, type]) => (
                  <button
                    key={id}
                    onClick={() => {
                      setBookType(id);
                      if (type.recommendedSizes?.[0]) setTrimSize(type.recommendedSizes[0]);
                      if (type.recommendedPages) setPageCount(type.recommendedPages[Math.floor(type.recommendedPages.length / 2)]);
                      if (type.interiorType) setInteriorType(type.interiorType);
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      bookType === id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-slate-200 hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`material-symbols-outlined ${bookType === id ? "text-primary" : "text-slate-400"}`}>{type.icon}</span>
                      <span className="font-bold text-sm">{type.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{type.description}</p>
                    <p className="text-[10px] text-primary font-bold mt-2">{type.priceRange}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Trim Size */}
            <div className="mb-8">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Trim Size (Amazon KDP)</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(selectedType?.recommendedSizes || Object.keys(KDP_TRIM_SIZES)).map((sizeId) => {
                  const size = KDP_TRIM_SIZES[sizeId];
                  if (!size) return null;
                  return (
                    <button
                      key={sizeId}
                      onClick={() => setTrimSize(sizeId)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        trimSize === sizeId ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex justify-center mb-2">
                        <div
                          className={`border-2 rounded ${trimSize === sizeId ? "border-primary bg-primary/10" : "border-slate-300 bg-slate-50"}`}
                          style={{ width: `${size.width * 4}px`, height: `${size.height * 4}px`, maxWidth: "60px", maxHeight: "60px" }}
                        />
                      </div>
                      <p className="text-xs font-bold">{size.label}</p>
                      <p className="text-[10px] text-slate-400">{size.description}</p>
                      {size.popular && <span className="inline-block mt-1 text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Popular</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comic panel layout (comic category only) */}
            {bookCategory === 'comic' && (
              <div className="mb-8">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Comic Panel Layout</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.values(COMIC_PANEL_LAYOUTS).map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setPanelLayout(layout.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        panelLayout === layout.id ? "border-primary bg-primary/5 shadow-md" : "border-slate-200 hover:border-primary/30"
                      }`}
                    >
                      <p className="font-bold text-sm">{layout.label}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{layout.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Page Count & Interior */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">{terminology.page} Count</label>
                <select value={pageCount} onChange={(e) => setPageCount(Number(e.target.value))} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  {(selectedType?.recommendedPages || [24, 28, 32, 36, 40, 48, 64]).map((pc) => (
                    <option key={pc} value={pc}>{pc} {terminology.plural.toLowerCase()}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Min: {selectedSize?.minPages || 24} | Max: {selectedSize?.maxPages || 828}
                </p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Interior Type</label>
                <select value={interiorType} onChange={(e) => setInteriorType(e.target.value)} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <option value="premium-color">Premium Color</option>
                  <option value="standard-color">Standard Color</option>
                  <option value="black-white">Black & White</option>
                </select>
              </div>
            </div>

            {/* Pricing Estimate */}
            {pricing && (
              <div className="mt-6 p-4 bg-linear-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <h4 className="font-bold text-sm text-green-800 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600">payments</span>
                  KDP Pricing Estimate
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div><p className="text-[10px] text-green-600 font-bold uppercase">Print Cost</p><p className="text-sm font-black text-green-800">${pricing.printingCost}</p></div>
                  <div><p className="text-[10px] text-green-600 font-bold uppercase">Min Price</p><p className="text-sm font-black text-green-800">${pricing.minimumPrice}</p></div>
                  <div><p className="text-[10px] text-green-600 font-bold uppercase">Recommended</p><p className="text-sm font-black text-green-800">${pricing.recommendedPrice}</p></div>
                  <div><p className="text-[10px] text-green-600 font-bold uppercase">Royalty/Sale</p><p className="text-sm font-black text-green-800">${pricing.royaltyPerSale}</p></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Style */}
        {step === 3 && (
          <div className="p-8">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">palette</span>
              Art Style & Visual Consistency
            </h3>

            <div className="mb-8">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Art Style</label>
              {isTextOnly && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl mb-4 text-sm text-blue-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500">info</span>
                  Text-only mode selected — no illustrations will be generated.
                </div>
              )}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredArtStyles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setArtStyle(s.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      artStyle === s.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-slate-200 hover:border-primary/30"
                    }`}
                  >
                    <p className="font-bold text-sm">{s.label}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{s.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {!isTextOnly && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Color Palette</label>
                  <input
                    value={colorPalette}
                    onChange={(e) => setColorPalette(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary"
                    placeholder="e.g., warm pastels, vibrant primary colors"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Vibrant & Colorful", "Warm Pastels", "Cool Blues & Greens", "Earthy & Natural", "Bold Primary Colors", "High Contrast B&W"].map((p) => (
                      <button key={p} onClick={() => setColorPalette(p.toLowerCase())} className="px-2 py-1 rounded-full bg-slate-100 text-[10px] font-medium hover:bg-primary/20 hover:text-primary transition-colors">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                    Main Character Description (optional)
                  </label>
                  <textarea
                    value={characterDesc}
                    onChange={(e) => setCharacterDesc(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary min-h-[100px] resize-none"
                    placeholder={
                      bookCategory === 'comic'
                        ? "e.g., A tall hero in a blue and silver suit, short dark hair, chiselled jawline, determined blue eyes..."
                        : "e.g., A small brown bunny with big floppy ears, wearing a red jacket and blue scarf..."
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Generate */}
        {step === 4 && (
          <div className="p-8">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              {generating
                ? `Generating Your ${catConfig.label}...`
                : createdProjectId
                ? "Book Created! 🎉"
                : "Ready to Generate"}
            </h3>

            {!generating && !createdProjectId && (
              <>
                {/* Summary */}
                <div className="bg-slate-50 rounded-xl p-6 mb-6">
                  <h4 className="font-bold text-sm mb-3">Book Summary</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-xs text-slate-400">Category</p><p className="font-bold">{catConfig.emoji} {catConfig.label}</p></div>
                    <div><p className="text-xs text-slate-400">Topic</p><p className="font-bold">{topic}</p></div>
                    <div><p className="text-xs text-slate-400">Type</p><p className="font-bold">{BOOK_TYPES[bookType]?.label}</p></div>
                    <div><p className="text-xs text-slate-400">Size</p><p className="font-bold">{KDP_TRIM_SIZES[trimSize]?.label}</p></div>
                    <div><p className="text-xs text-slate-400">{terminology.plural}</p><p className="font-bold">{pageCount}</p></div>
                    <div><p className="text-xs text-slate-400">Art Style</p><p className="font-bold">{selectedStyle?.label}</p></div>
                    <div><p className="text-xs text-slate-400">Audience</p><p className="font-bold">{targetAge}</p></div>
                    <div><p className="text-xs text-slate-400">Genre</p><p className="font-bold capitalize">{genre}</p></div>
                    {bookCategory === 'comic' && (
                      <div><p className="text-xs text-slate-400">Panel Layout</p><p className="font-bold">{COMIC_PANEL_LAYOUTS[panelLayout]?.label}</p></div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!hasApiKey}
                  className="w-full py-4 bg-linear-to-r from-primary to-purple-700 text-white rounded-xl font-black text-lg hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                  Generate Entire {catConfig.label} with AI
                </button>
                <p className="text-xs text-center text-slate-400 mt-3">
                  This will generate {pageCount} {terminology.plural.toLowerCase()} of content
                  {!isTextOnly ? `, ${pageCount} illustrations` : ''}, and a cover.
                  This may take a few minutes.
                </p>
              </>
            )}

            {/* Generation Progress */}
            {(generating || genLog.length > 0) && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  {["content", "illustrations", "cover", "saving"].map((phase, i) => (
                    <div key={phase} className="flex items-center gap-1">
                      <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        genPhase === phase ? "bg-primary text-white animate-pulse" :
                        ["content", "illustrations", "cover", "saving"].indexOf(genPhase) > i ? "bg-green-500 text-white" :
                        "bg-slate-200 text-slate-400"
                      }`}>
                        {["content", "illustrations", "cover", "saving"].indexOf(genPhase) > i ? "✓" : i + 1}
                      </div>
                      <span className={`text-xs font-medium ${genPhase === phase ? "text-primary" : "text-slate-400"}`}>
                        {phase === "content" ? "Content" : phase === "illustrations" ? "Images" : phase === "cover" ? "Cover" : "Save"}
                      </span>
                      {i < 3 && <div className="w-6 h-0.5 bg-slate-200 mx-1" />}
                    </div>
                  ))}
                </div>

                {genPhase === "illustrations" && genTotal > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Generating illustrations...</span>
                      <span>{genProgress}/{genTotal}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(genProgress / genTotal) * 100}%` }} />
                    </div>
                  </div>
                )}

                <div className="bg-slate-900 rounded-xl p-4 max-h-60 overflow-y-auto font-mono text-xs">
                  {genLog.map((log, i) => (
                    <div key={i} className="text-slate-300 py-0.5">
                      <span className="text-slate-600">[{log.time}]</span> {log.msg}
                    </div>
                  ))}
                  {generating && <div className="text-primary animate-pulse">▍</div>}
                </div>
              </div>
            )}

            {/* Completion */}
            {createdProjectId && !generating && (
              <div className="space-y-4 mt-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
                  <div>
                    <p className="font-bold text-green-800">Book created successfully!</p>
                    <p className="text-xs text-green-600">
                      {generatedBook?.title} — {pageCount} {terminology.plural.toLowerCase()}
                      {!isTextOnly ? `, ${Object.keys(generatedImages).length} illustrations` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => navigate(`/book-preview?project=${createdProjectId}`)} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">auto_stories</span>
                    Preview Book
                  </button>
                  <button onClick={() => navigate(`/story-outline?project=${createdProjectId}`)} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">edit_note</span>
                    Edit Outline
                  </button>
                  <button onClick={() => navigate(`/story-studio?project=${createdProjectId}`)} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">brush</span>
                    Open Studio
                  </button>
                  <button
                    onClick={() => {
                      setStep(0);
                      setGenerating(false);
                      setGenLog([]);
                      setGeneratedBook(null);
                      setGeneratedImages({});
                      setCreatedProjectId(null);
                      setTopic("");
                      setSynopsis("");
                    }}
                    className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">add</span>
                    New
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0 || generating}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-white hover:text-slate-700 disabled:opacity-30 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back
          </button>
          {step < BASE_STEPS.length - 1 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1"
            >
              Next
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
