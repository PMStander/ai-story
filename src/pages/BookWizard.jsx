import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGemini } from "../contexts/GeminiContext";
import { createProject, createChapter, updateProject, getChapters, updateChapter, createAsset } from "../lib/firestore";
import { generateFullBookContent, generateConsistentIllustrations, generateBookCover } from "../lib/gemini";
import { KDP_TRIM_SIZES, BOOK_TYPES, ART_STYLES, estimateKdpPricing } from "../lib/kdpFormats";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

const STEPS = [
  { id: "concept", label: "Concept", icon: "lightbulb" },
  { id: "format", label: "Format", icon: "auto_stories" },
  { id: "style", label: "Style", icon: "palette" },
  { id: "generate", label: "Generate", icon: "auto_awesome" },
];

export default function BookWizard() {
  const { user } = useAuth();
  const { apiKey, hasApiKey } = useGemini();
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState(0);

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

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [genPhase, setGenPhase] = useState(""); // "content" | "illustrations" | "cover" | "saving"
  const [genProgress, setGenProgress] = useState(0);
  const [genTotal, setGenTotal] = useState(0);
  const [genLog, setGenLog] = useState([]);
  const [generatedBook, setGeneratedBook] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});

  const [error, setError] = useState("");
  const [createdProjectId, setCreatedProjectId] = useState(null);

  const selectedStyle = ART_STYLES.find(s => s.id === artStyle);
  const selectedSize = KDP_TRIM_SIZES[trimSize];
  const selectedType = BOOK_TYPES[bookType];
  const pricing = estimateKdpPricing(pageCount, interiorType, trimSize);

  const addLog = useCallback((msg) => {
    setGenLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  }, []);

  // Generate entire book
  const handleGenerate = async () => {
    if (!hasApiKey || !topic.trim()) return;
    setGenerating(true);
    setError("");
    setGenLog([]);
    setGenProgress(0);

    try {
      // Phase 1: Generate content
      setGenPhase("content");
      addLog("🧠 Generating story content...");
      const book = await generateFullBookContent(apiKey, {
        topic: topic.trim(),
        genre,
        targetAge,
        pageCount,
        bookType,
        synopsis: synopsis.trim() || undefined,
      });
      setGeneratedBook(book);
      addLog(`✅ Story "${book.title}" created with ${book.pages.length} pages`);
      addLog(`📖 Main character: ${book.mainCharacter?.name || 'N/A'}`);
      addLog(`💡 Lesson: ${book.lesson || 'N/A'}`);

      // Phase 2: Generate illustrations
      setGenPhase("illustrations");
      setGenTotal(book.pages.length);
      addLog(`🎨 Starting illustration generation (${book.pages.length} pages)...`);

      const styleGuide = {
        artStyle: selectedStyle?.prompt || "colorful children's book illustration",
        colorPalette,
        characters: book.mainCharacter ? [{
          name: book.mainCharacter.name,
          visualDescription: book.mainCharacter.description,
        }] : [],
        environmentRules: "",
      };

      const images = {};
      const generator = generateConsistentIllustrations(apiKey, book.pages, styleGuide, {
        aspectRatio: selectedSize?.imageAspectRatio || "1:1",
      });
      for await (const result of generator) {
        if (result.status === "success") {
          images[result.pageNumber] = result.imageUrl;
          addLog(`✅ Page ${result.pageNumber} illustration complete`);
        } else {
          addLog(`⚠️ Page ${result.pageNumber} failed: ${result.error}`);
        }
        setGenProgress(prev => prev + 1);
        setGeneratedImages({ ...images });
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
        synopsis: book.lesson || synopsis,
        trimSize,
        bookType,
        interiorType,
        pageCount,
        styleGuide: {
          artStyle: selectedStyle?.prompt || "",
          colorPalette,
          characters: book.mainCharacter ? [{
            name: book.mainCharacter.name,
            visualDescription: book.mainCharacter.description,
          }] : [],
          environmentRules: "",
          additionalRules: "",
        },
      });
      setCreatedProjectId(projectId);

      // Save chapters with illustration URLs
      const pageImageMap = {};
      for (const page of book.pages) {
        const chId = await createChapter(user.uid, projectId, {
          title: `Page ${page.pageNumber}`,
          number: page.pageNumber,
          content: page.text,
          sceneDescription: page.sceneDescription,
          illustrationUrl: '', // will be updated after upload
        });
        pageImageMap[page.pageNumber] = chId;
      }

      // Save images as assets AND link to chapters
      const savedChapters = await getChapters(user.uid, projectId);
      for (const [pageNum, dataUrl] of Object.entries(images)) {
        try {
          const filename = `page_${pageNum}_${Date.now()}.png`;
          const storageRef = ref(storage, `users/${user.uid}/projects/${projectId}/${filename}`);
          await uploadString(storageRef, dataUrl, "data_url");
          const downloadUrl = await getDownloadURL(storageRef);
          await createAsset(user.uid, projectId, {
            name: `Page ${pageNum} Illustration`,
            type: "illustration",
            pageNumber: Number(pageNum),
            url: downloadUrl,
            storagePath: storageRef.fullPath,
            prompt: book.pages[pageNum - 1]?.sceneDescription || "",
            style: selectedStyle?.label || "",
          });
          // Also update the chapter with the illustration URL
          const chapter = savedChapters.find(c => c.number === Number(pageNum));
          if (chapter) {
            await updateChapter(user.uid, projectId, chapter.id, { illustrationUrl: downloadUrl });
          }
        } catch {
          // Continue saving other images
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
          addLog("✅ Cover saved to project!");
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

  const canProceed = step === 0 ? topic.trim().length > 0 : true;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <span className="text-primary">✨</span>
            Book Wizard
          </h2>
          <p className="text-slate-500 mt-1">AI generates your entire book — topic to illustrations in minutes.</p>
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
        {STEPS.map((s, i) => (
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
            {i < STEPS.length - 1 && (
              <div className={`w-12 h-0.5 mx-1 ${i < step ? "bg-primary" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
        {/* Step 1: Concept */}
        {step === 0 && (
          <div className="p-8">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">lightbulb</span>
              What's your book about?
            </h3>
            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Topic / Title Idea</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold focus:ring-primary focus:border-primary"
                  placeholder="e.g., A brave bunny learns to share..."
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
                  <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <option value="adventure">Adventure</option>
                    <option value="educational">Educational</option>
                    <option value="bedtime">Bedtime Story</option>
                    <option value="social-skills">Social Skills</option>
                    <option value="emotions">Emotions & Feelings</option>
                    <option value="animals">Animals & Nature</option>
                    <option value="fantasy">Fantasy</option>
                    <option value="humor">Humor</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Target Age</label>
                  <select value={targetAge} onChange={(e) => setTargetAge(e.target.value)} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <option value="0-2">0–2 (Board Book)</option>
                    <option value="3-6">3–6 (Picture Book)</option>
                    <option value="5-8">5–8 (Early Reader)</option>
                    <option value="7-12">7–12 (Chapter Book)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Format */}
        {step === 1 && (
          <div className="p-8">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_stories</span>
              Book Format & Size
            </h3>

            {/* Book Type */}
            <div className="mb-8">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Book Type</label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(BOOK_TYPES).map(([id, type]) => (
                  <button
                    key={id}
                    onClick={() => {
                      setBookType(id);
                      setTrimSize(type.recommendedSizes[0]);
                      setPageCount(type.recommendedPages[Math.floor(type.recommendedPages.length / 2)]);
                      setInteriorType(type.interiorType);
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
                        trimSize === sizeId
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 hover:border-primary/30"
                      }`}
                    >
                      {/* Visual size preview */}
                      <div className="flex justify-center mb-2">
                        <div
                          className={`border-2 rounded ${trimSize === sizeId ? "border-primary bg-primary/10" : "border-slate-300 bg-slate-50"}`}
                          style={{
                            width: `${size.width * 4}px`,
                            height: `${size.height * 4}px`,
                            maxWidth: '60px',
                            maxHeight: '60px',
                          }}
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

            {/* Page Count & Interior */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Page Count</label>
                <select value={pageCount} onChange={(e) => setPageCount(Number(e.target.value))} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  {(selectedType?.recommendedPages || [24, 28, 32, 36, 40, 48, 64]).map((pc) => (
                    <option key={pc} value={pc}>{pc} pages</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Min: {selectedSize?.minPages || 24} | Max: {selectedSize?.maxPages || 80}
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
                  <div>
                    <p className="text-[10px] text-green-600 font-bold uppercase">Print Cost</p>
                    <p className="text-sm font-black text-green-800">${pricing.printingCost}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-green-600 font-bold uppercase">Min Price</p>
                    <p className="text-sm font-black text-green-800">${pricing.minimumPrice}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-green-600 font-bold uppercase">Recommended</p>
                    <p className="text-sm font-black text-green-800">${pricing.recommendedPrice}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-green-600 font-bold uppercase">Royalty/Sale</p>
                    <p className="text-sm font-black text-green-800">${pricing.royaltyPerSale}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Style */}
        {step === 2 && (
          <div className="p-8">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">palette</span>
              Art Style & Visual Consistency
            </h3>

            <div className="mb-8">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Art Style</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {ART_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setArtStyle(style.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      artStyle === style.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-slate-200 hover:border-primary/30"
                    }`}
                  >
                    <p className="font-bold text-sm">{style.label}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{style.description}</p>
                  </button>
                ))}
              </div>
            </div>

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
                  {["Vibrant & Colorful", "Warm Pastels", "Cool Blues & Greens", "Earthy & Natural", "Bold Primary Colors", "Soft Watercolor Tones"].map((p) => (
                    <button key={p} onClick={() => setColorPalette(p.toLowerCase())} className="px-2 py-1 rounded-full bg-slate-100 text-[10px] font-medium hover:bg-primary/20 hover:text-primary transition-colors">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Main Character Description (optional)</label>
                <textarea
                  value={characterDesc}
                  onChange={(e) => setCharacterDesc(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary min-h-[100px] resize-none"
                  placeholder="e.g., A small brown bunny with big floppy ears, wearing a red jacket and blue scarf..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Generate */}
        {step === 3 && (
          <div className="p-8">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              {generating ? "Generating Your Book..." : createdProjectId ? "Book Created! 🎉" : "Ready to Generate"}
            </h3>

            {!generating && !createdProjectId && (
              <>
                {/* Summary */}
                <div className="bg-slate-50 rounded-xl p-6 mb-6">
                  <h4 className="font-bold text-sm mb-3">Book Summary</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-xs text-slate-400">Topic</p><p className="font-bold">{topic}</p></div>
                    <div><p className="text-xs text-slate-400">Type</p><p className="font-bold">{BOOK_TYPES[bookType]?.label}</p></div>
                    <div><p className="text-xs text-slate-400">Size</p><p className="font-bold">{KDP_TRIM_SIZES[trimSize]?.label}</p></div>
                    <div><p className="text-xs text-slate-400">Pages</p><p className="font-bold">{pageCount}</p></div>
                    <div><p className="text-xs text-slate-400">Art Style</p><p className="font-bold">{selectedStyle?.label}</p></div>
                    <div><p className="text-xs text-slate-400">Colors</p><p className="font-bold">{colorPalette}</p></div>
                    <div><p className="text-xs text-slate-400">Age</p><p className="font-bold">{targetAge}</p></div>
                    <div><p className="text-xs text-slate-400">Genre</p><p className="font-bold capitalize">{genre}</p></div>
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!hasApiKey}
                  className="w-full py-4 bg-linear-to-r from-primary to-purple-700 text-white rounded-xl font-black text-lg hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                  Generate Entire Book with AI
                </button>
                <p className="text-xs text-center text-slate-400 mt-3">
                  This will generate {pageCount} pages of story content, {pageCount} illustrations, and a cover. This may take a few minutes.
                </p>
              </>
            )}

            {/* Generation Progress */}
            {(generating || genLog.length > 0) && (
              <div className="space-y-4">
                {/* Phase indicator */}
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
                        {phase === "content" ? "Story" : phase === "illustrations" ? "Images" : phase === "cover" ? "Cover" : "Save"}
                      </span>
                      {i < 3 && <div className="w-6 h-0.5 bg-slate-200 mx-1" />}
                    </div>
                  ))}
                </div>

                {/* Illustration progress bar */}
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

                {/* Log */}
                <div className="bg-slate-900 rounded-xl p-4 max-h-60 overflow-y-auto font-mono text-xs">
                  {genLog.map((log, i) => (
                    <div key={i} className="text-slate-300 py-0.5">
                      <span className="text-slate-600">[{log.time}]</span> {log.msg}
                    </div>
                  ))}
                  {generating && (
                    <div className="text-primary animate-pulse">▍</div>
                  )}
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
                      {generatedBook?.title} — {pageCount} pages, {Object.keys(generatedImages).length} illustrations
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/book-preview?project=${createdProjectId}`)}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">auto_stories</span>
                    Preview Book
                  </button>
                  <button
                    onClick={() => navigate(`/story-outline?project=${createdProjectId}`)}
                    className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">edit_note</span>
                    Edit Story
                  </button>
                  <button
                    onClick={() => navigate(`/story-studio?project=${createdProjectId}`)}
                    className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 flex items-center justify-center gap-2"
                  >
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
          {step < STEPS.length - 1 && (
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
