import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGemini } from "../contexts/GeminiContext";
import { getUserProjects, getProject, getAssets, createAsset, getCharacters, duplicateAsset, moveAsset, getUserSeries, getSeries, createSeriesAsset, getSeriesAssets, moveProjectAssetToSeries } from "../lib/firestore";
import { generateImage, editImageWithReference, buildStylePrompt } from "../lib/gemini";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

// ─── Constants ────────────────────────────────────────────────────────────────

const ASSET_TYPES = [
  { key: "illustration", label: "Illustration", icon: "brush" },
  { key: "cover",        label: "Cover",         icon: "menu_book" },
  { key: "character",    label: "Character",      icon: "person" },
];

const EDIT_MODES = [
  { key: "default",  label: "General edit",         icon: "edit",             tip: "General prompt-driven edits" },
  { key: "removebg", label: "Remove background",    icon: "format_color_reset", tip: "Strip background, keep subject" },
  { key: "bgswap",   label: "Swap background",      icon: "landscape",         tip: 'Replace background (describe it in the prompt)' },
  { key: "add",      label: "Add element",          icon: "add_photo_alternate", tip: "Inpaint a new object or element" },
  { key: "style",    label: "Style transfer",       icon: "palette",           tip: "Apply a new art style" },
];

const STYLES = [
  "Colorful children's book illustration",
  "Watercolor painting",
  "Digital cartoon art",
  "Flat vector illustration",
  "Pencil sketch style",
  "3D rendered character",
];

const RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const POSES = [
  { id: 'standing',  label: 'Standing',  icon: '🧍' },
  { id: 'running',   label: 'Running',   icon: '🏃' },
  { id: 'sitting',   label: 'Sitting',   icon: '🪑' },
  { id: 'jumping',   label: 'Jumping',   icon: '🤸' },
  { id: 'waving',    label: 'Waving',    icon: '👋' },
  { id: 'reading',   label: 'Reading',   icon: '📖' },
  { id: 'sleeping',  label: 'Sleeping',  icon: '😴' },
  { id: 'praying',   label: 'Praying',   icon: '🙏' },
  { id: 'kneeling',  label: 'Kneeling',  icon: '🧎' },
  { id: 'fighting',  label: 'Fighting',  icon: '⚔️' },
  { id: 'celebrating', label: 'Celebrating', icon: '🎉' },
  { id: 'crying',    label: 'Crying',    icon: '😢' },
];

const PROPS = [
  'sword', 'shield', 'crown', 'harp', 'staff', 'scroll',
  'flower bouquet', 'lantern', 'book', 'basket', 'lamb',
  'torch', 'bow & arrow', 'cloak', 'treasure chest',
  'candle', 'slingshot', 'golden coin bag', 'dove',
];

const SKIN_TONES = [
  { id: 'light', label: 'Light', hex: '#FDDBB4' },
  { id: 'medium', label: 'Medium', hex: '#C68642' },
  { id: 'olive', label: 'Olive', hex: '#8D5524' },
  { id: 'dark', label: 'Dark', hex: '#4A2912' },
];

const TYPE_COLORS = {
  cover:        "bg-amber-500 text-white",
  character:    "bg-purple-500 text-white",
  illustration: "bg-primary/80 text-white",
};

// ─── Helper ────────────────────────────────────────────────────────────────────

// Canvas-based conversion — avoids CORS/fetch issues for Firebase Storage URLs
async function urlToBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function IllustrationStudio() {
  const { user } = useAuth();
  const { apiKey, hasApiKey } = useGemini();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const dropRef = useRef(null);
  const fileInputRef = useRef(null);

  // Project & character data
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(projectId || "");
  const [projectData, setProjectData] = useState(null);
  const [characters, setCharacters] = useState([]);

  // Generation options
  const [assetType, setAssetType] = useState("illustration");
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(STYLES[0]);
  const [ratio, setRatio] = useState("1:1");
  const [styleGuideActive, setStyleGuideActive] = useState(false);

  // Character builder state
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [selectedSeriesData, setSelectedSeriesData] = useState(null);
  const [selectedStyleCharacter, setSelectedStyleCharacter] = useState(null); // from series style guide
  const [selectedPose, setSelectedPose] = useState([]);
  const [selectedProps, setSelectedProps] = useState([]);
  const [transparentBg, setTransparentBg] = useState(true);
  const [charNotes, setCharNotes] = useState("");

  // Reference image + edit mode
  const [referenceImage, setReferenceImage] = useState(null); // { url, base64, name }
  const [editMode, setEditMode] = useState("default");
  const [isDragOver, setIsDragOver] = useState(false);
  const [pickingFromGallery, setPickingFromGallery] = useState(false);

  // UI state
  const [generating, setGenerating] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [seriesGallery, setSeriesGallery] = useState([]); // series-level character assets
  const [error, setError] = useState("");
  const [movingAssetId, setMovingAssetId] = useState(null);

  // ── Data loading ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    getUserProjects(user.uid).then(setProjects);
    getUserSeries(user.uid).then(setSeriesList);
  }, [user]);

  useEffect(() => {
    if (!user || !selectedProject) { setProjectData(null); setCharacters([]); setSelectedCharacterId(""); return; }
    getProject(user.uid, selectedProject).then((p) => {
      setProjectData(p);
      if (p?.styleGuide?.artStyle) { setStyle(p.styleGuide.artStyle); setStyleGuideActive(true); }
    });
    getCharacters(user.uid, selectedProject).then(setCharacters);
  }, [user, selectedProject]);

  useEffect(() => {
    if (assetType !== "illustration") setSelectedCharacterId("");
    if (assetType !== "character") {
      setSelectedStyleCharacter(null);
      setSelectedPose([]);
      setSelectedProps([]);
      setCharNotes("");
    }
  }, [assetType]);

  // Load series data when series is selected in character builder
  useEffect(() => {
    if (!user || !selectedSeriesId) { setSelectedSeriesData(null); setSelectedStyleCharacter(null); setSeriesGallery([]); return; }
    getSeries(user.uid, selectedSeriesId).then((s) => {
      setSelectedSeriesData(s);
      setSelectedStyleCharacter(null);
      if (s?.styleGuide?.artStyle) setStyle(s.styleGuide.artStyle);
    });
    getSeriesAssets(user.uid, selectedSeriesId).then(setSeriesGallery);
  }, [user, selectedSeriesId]);

  useEffect(() => {
    if (!user || !selectedProject) { setGallery([]); return; }
    getAssets(user.uid, selectedProject).then(setGallery);
  }, [user, selectedProject]);

  // ── Auto-assembled character prompt ──────────────────────────────────────────

  const buildCharacterPrompt = (pose = "") => {
    if (!selectedStyleCharacter) return "";
    const parts = [];
    const sg = selectedSeriesData?.styleGuide;
    // Art style
    if (sg?.artStyle) parts.push(`Art style: ${sg.artStyle}.`);
    // Color palette
    if (sg?.colorPalette) parts.push(`Color palette: ${sg.colorPalette}.`);
    // Character description
    parts.push(`Character: ${selectedStyleCharacter.name} — ${selectedStyleCharacter.visualDescription}.`);
    // Pose
    if (pose) parts.push(`Pose: ${pose}.`);
    // Props
    if (selectedProps.length > 0) parts.push(`Holding/accompanied by: ${selectedProps.join(", ")}.`);
    // Series additional rules (e.g. "no text", "rounded shapes")
    if (sg?.additionalRules) parts.push(`Style rules: ${sg.additionalRules}.`);
    // User notes
    if (charNotes.trim()) parts.push(charNotes.trim() + ".");
    // Background & framing
    parts.push(
      `Full body visible, no cropping. Isolated character on a ${
        transparentBg ? "transparent" : "plain white"
      } background. Children's book illustration style, consistent and expressive.`
    );
    return parts.join(" ");
  };


  // Preview prompt — show for first selected pose (or no pose)
  const charPrompt = assetType === "character"
    ? buildCharacterPrompt(selectedPose[0] ?? "")
    : "";

  // ── Drag & drop ──────────────────────────────────────────────────────────────

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const base64 = await fileToBase64(file);
    setReferenceImage({ base64, name: file.name, url: URL.createObjectURL(file) });
    setPickingFromGallery(false);
  }, []);

  const handleFileInput = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setReferenceImage({ base64, name: file.name, url: URL.createObjectURL(file) });
    setPickingFromGallery(false);
    e.target.value = "";
  };

  // Immediately store the reference by URL — base64 resolved lazily at generate time.
  const handleUseFromGallery = (asset) => {
    setPickingFromGallery(false);
    setError("");
    setReferenceImage({
      url: asset.url,
      base64: null,
      name: asset.name || asset.prompt?.slice(0, 30) || "asset",
    });
  };

  const clearReference = () => { setReferenceImage(null); setPickingFromGallery(false); };

  // ── Duplicate ─────────────────────────────────────────────────────────────────

  const handleDuplicate = async (asset) => {
    await duplicateAsset(user.uid, selectedProject, asset);
    const updated = await getAssets(user.uid, selectedProject);
    setGallery(updated);
  };

  const handleMoveToSeries = async (asset, seriesId) => {
    if (!seriesId || !selectedProject) return;
    setMovingAssetId(asset.id);
    try {
      await moveProjectAssetToSeries(user.uid, selectedProject, seriesId, asset);
      // Refresh both galleries
      const [updated, seriesUpdated] = await Promise.all([
        getAssets(user.uid, selectedProject),
        getSeriesAssets(user.uid, seriesId),
      ]);
      setGallery(updated);
      if (seriesId === selectedSeriesId) setSeriesGallery(seriesUpdated);
    } finally {
      setMovingAssetId(null);
    }
  };

  const handleMove = async (asset, toProjectId) => {

    if (!toProjectId || toProjectId === selectedProject) return;
    setMovingAssetId(asset.id);
    try {
      await moveAsset(user.uid, selectedProject, toProjectId, asset);
      const updated = await getAssets(user.uid, selectedProject);
      setGallery(updated);
    } finally {
      setMovingAssetId(null);
    }
  };



  // ── Derived state ─────────────────────────────────────────────────────────────

  const hasStyleGuide = projectData?.styleGuide?.artStyle;
  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

  const styleGuidePrefix = () => (styleGuideActive && projectData?.styleGuide) ? buildStylePrompt(projectData.styleGuide) : "";
  const characterPrefix  = selectedCharacter ? `Character: ${selectedCharacter.name} — ${selectedCharacter.description}. ` : "";
  const effectivePrompt  = `${styleGuidePrefix()}${characterPrefix}${prompt}`.trim();

  // ── Generate ──────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    const posesToRun = assetType === "character" && selectedPose.length > 0
      ? selectedPose
      : assetType === "character" ? [""] : null; // null = non-character flow

    const firstPrompt = assetType === "character"
      ? buildCharacterPrompt(posesToRun[0] ?? "")
      : effectivePrompt;
    if (!hasApiKey || (!firstPrompt.trim() && !referenceImage)) return;

    setGenerating(true);
    setError("");
    try {
      const effectiveRatio = (assetType === "cover") ? "3:4" : (assetType === "character" ? "1:1" : ratio);
      const effectiveStyle = assetType === "cover"
        ? "professional children's book cover illustration, vibrant, eye-catching"
        : style;

      // Character mode: generate one image per selected pose → saved to SERIES
      if (assetType === "character" && posesToRun) {
        const storageBase = `users/${user.uid}/series/${selectedSeriesId}`;
        for (const pose of posesToRun) {
          const posePrompt = buildCharacterPrompt(pose);
          const dataUrl = await generateImage(apiKey, posePrompt, { style: effectiveStyle, aspectRatio: effectiveRatio });
          const charName = selectedStyleCharacter?.name ?? null;
          const poseLabel = pose ? `_${pose}` : "";
          const filename = `character_${Date.now()}${poseLabel}.png`;
          const storageRef = ref(storage, `${storageBase}/${filename}`);
          await uploadString(storageRef, dataUrl, "data_url");
          const downloadUrl = await getDownloadURL(storageRef);
          await createSeriesAsset(user.uid, selectedSeriesId, {
            name: `${charName ?? "Character"}${pose ? ` — ${pose}` : ""}`,
            type: "character",
            url: downloadUrl,
            storagePath: storageRef.fullPath,
            prompt: posePrompt,
            style: effectiveStyle,
            characterName: charName,
            pose: pose || null,
          });
        }
        // Refresh series gallery
        const updated = await getSeriesAssets(user.uid, selectedSeriesId);
        setSeriesGallery(updated);
        return;
      }


      // Illustration / cover flow
      const activePrompt = effectivePrompt;
      let dataUrl;
      if (referenceImage) {
        // Lazily resolve base64 if we only have a URL (gallery pick case)
        let refBase64 = referenceImage.base64;
        if (!refBase64) {
          refBase64 = await urlToBase64(referenceImage.url);
        }
        dataUrl = await editImageWithReference(apiKey, refBase64, activePrompt, editMode, { aspectRatio: effectiveRatio });
      } else {
        dataUrl = await generateImage(apiKey, activePrompt, { style: effectiveStyle, aspectRatio: effectiveRatio });
      }

      const charName = assetType === "character" && selectedStyleCharacter
        ? selectedStyleCharacter.name
        : selectedCharacter?.name || null;
      const charId = assetType === "character" ? null : selectedCharacter?.id || null;

      if (selectedProject) {
        const filename = `${assetType}_${Date.now()}.png`;
        const storageRef = ref(storage, `users/${user.uid}/projects/${selectedProject}/${filename}`);
        await uploadString(storageRef, dataUrl, "data_url");
        const downloadUrl = await getDownloadURL(storageRef);
        await createAsset(user.uid, selectedProject, {
          name: (assetType === "character" && selectedStyleCharacter ? selectedStyleCharacter.name : prompt).slice(0, 50),
          type: assetType,
          url: downloadUrl,
          storagePath: storageRef.fullPath,
          prompt: activePrompt,
          style: effectiveStyle,
          characterId:   charId,
          characterName: charName,
        });
        const updated = await getAssets(user.uid, selectedProject);
        setGallery(updated);
      } else {
        setGallery((prev) => [{ id: Date.now().toString(), url: dataUrl, prompt: activePrompt, style, type: assetType, createdAt: new Date() }, ...prev]);
      }
    } catch (err) {
      setError(err.message || "Image generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Illustration Studio</h2>
          <p className="text-slate-500 mt-1">AI-powered illustration generation & editing using Imagen.</p>
        </div>
      </div>

      {!hasApiKey && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
          <span className="material-symbols-outlined text-amber-500">warning</span>
          <p className="text-sm text-amber-700">Gemini API key required for image generation.</p>
          <button onClick={() => navigate("/settings")} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold ml-auto">Set Up</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left panel ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">

          {/* Project */}
          <div className="bg-white rounded-xl border border-primary/10 p-5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary"
            >
              <option value="">No project (standalone)</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            {selectedProject && (
              <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${hasStyleGuide ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-400 border border-slate-200"}`}>
                <span className="material-symbols-outlined text-sm">{hasStyleGuide ? "check_circle" : "info"}</span>
                {hasStyleGuide ? `Style guide: ${projectData.styleGuide.artStyle.slice(0, 38)}` : "No style guide set"}
                {hasStyleGuide && (
                  <button onClick={() => setStyleGuideActive((v) => !v)} className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold ${styleGuideActive ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                    {styleGuideActive ? "ON" : "OFF"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Asset Type */}
          <div className="bg-white rounded-xl border border-primary/10 p-5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Asset Type</label>
            <div className="flex gap-2">
              {ASSET_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setAssetType(t.key)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-[11px] font-bold transition-all ${assetType === t.key ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-500"}`}
                >
                  <span className="material-symbols-outlined text-base">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
            {assetType === "cover" && <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-sm">info</span>Cover ratio auto-set to 3:4</p>}
          </div>

          {/* ── Reference Image ───────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-primary/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">photo_library</span>
                Reference Image
                <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-[9px]">optional</span>
              </label>
              {referenceImage && (
                <button onClick={clearReference} className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">close</span>Clear
                </button>
              )}
            </div>

            {referenceImage ? (
              /* Reference preview */
              <div className="relative rounded-xl overflow-hidden border-2 border-primary aspect-square bg-slate-100 shadow-lg shadow-primary/10">
                <img src={referenceImage.url} alt="reference" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-primary text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wide">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  Reference set
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-3 py-2">
                  <p className="text-[10px] text-white truncate">{referenceImage.name}</p>
                </div>
              </div>
            ) : (
              /* Drop zone */
              <div
                ref={dropRef}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragOver ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"}`}
              >
                <span className="material-symbols-outlined text-3xl text-slate-300 mb-2 block">upload_file</span>
                <p className="text-xs text-slate-500 font-medium">Drop an image here</p>
                <p className="text-[10px] text-slate-400 mt-0.5">or click to browse</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
              </div>
            )}

            {/* Pick from gallery button */}
            {gallery.length > 0 && !referenceImage && (
              <button
                onClick={() => setPickingFromGallery((v) => !v)}
                className={`w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold border-2 transition-all ${
                  pickingFromGallery
                    ? "bg-primary text-white border-primary animate-pulse shadow-lg shadow-primary/30"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-sm">{pickingFromGallery ? "close" : "grid_view"}</span>
                {pickingFromGallery ? "Cancel selection" : "Pick from gallery"}
              </button>
            )}
          </div>

          {/* Edit Mode — only when reference is set */}
          {referenceImage && (
            <div className="bg-white rounded-xl border border-primary/10 p-5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Edit Mode</label>
              <div className="space-y-1.5">
                {EDIT_MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setEditMode(m.key)}
                    title={m.tip}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all ${editMode === m.key ? "bg-primary text-white shadow shadow-primary/20" : "bg-slate-50 hover:bg-primary/5 text-slate-600 border border-slate-100"}`}
                  >
                    <span className="material-symbols-outlined text-base">{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Character Selector (illustration mode) */}
          {assetType === "illustration" && characters.length > 0 && (
            <div className="bg-white rounded-xl border border-primary/10 p-5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Feature Character</label>
              <select
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary"
              >
                <option value="">None</option>
                {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {selectedCharacter && (
                <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                  <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wide mb-1">Injected into prompt</p>
                  <p className="text-[11px] text-purple-600 line-clamp-3">{selectedCharacter.description}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Character Builder (character mode) ───────────────────────────── */}
          {assetType === "character" && (
            <div className="space-y-4">

              {/* 1. Series selector */}
              <div className="bg-white rounded-xl border border-purple-200 p-5">
                <label className="text-xs font-bold uppercase tracking-wider text-purple-500 mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">library_books</span>
                  Series
                </label>
                <select
                  value={selectedSeriesId}
                  onChange={(e) => setSelectedSeriesId(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-purple-400 focus:border-purple-400"
                >
                  <option value="">Select a series…</option>
                  {seriesList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* 2. Character cards from style guide */}
              {selectedSeriesData && (
                <div className="bg-white rounded-xl border border-purple-200 p-5">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-500 mb-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">person</span>
                    Character
                  </label>
                  {(selectedSeriesData.styleGuide?.characters || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No characters in this series yet. Add them via the Series Manager.</p>
                  ) : (
                    <div className="space-y-2">
                      {(selectedSeriesData.styleGuide?.characters || []).map((char, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedStyleCharacter(
                            selectedStyleCharacter?.name === char.name ? null : char
                          )}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                            selectedStyleCharacter?.name === char.name
                              ? "border-purple-500 bg-purple-50 shadow-md"
                              : "border-slate-200 hover:border-purple-300 bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`size-7 rounded-full flex items-center justify-center shrink-0 ${
                              selectedStyleCharacter?.name === char.name ? "bg-purple-500" : "bg-slate-200"
                            }`}>
                              <span className={`material-symbols-outlined text-sm ${
                                selectedStyleCharacter?.name === char.name ? "text-white" : "text-slate-500"
                              }`}>person</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-700">{char.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{char.visualDescription?.slice(0, 60)}…</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Pose picker */}
              {selectedStyleCharacter && (
                <div className="bg-white rounded-xl border border-purple-200 p-5">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-500 mb-3 block">
                    Pose
                    {selectedPose.length > 1 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[9px]">
                        {selectedPose.length} poses → {selectedPose.length} images
                      </span>
                    )}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {POSES.map((pose) => (
                      <button
                        key={pose.id}
                        onClick={() => setSelectedPose((prev) =>
                          prev.includes(pose.id)
                            ? prev.filter((p) => p !== pose.id)
                            : [...prev, pose.id]
                        )}
                        className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${
                          selectedPose.includes(pose.id)
                            ? "bg-purple-500 text-white shadow-md ring-2 ring-purple-300"
                            : "bg-slate-50 text-slate-500 border border-slate-200 hover:border-purple-300"
                        }`}
                      >
                        <span className="text-lg leading-none">{pose.icon}</span>
                        {pose.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Props */}
              {selectedStyleCharacter && (
                <div className="bg-white rounded-xl border border-purple-200 p-5">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-500 mb-3 block">Props / Items</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PROPS.map((prop) => (
                      <button
                        key={prop}
                        onClick={() => setSelectedProps((prev) =>
                          prev.includes(prop) ? prev.filter((p) => p !== prop) : [...prev, prop]
                        )}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          selectedProps.includes(prop)
                            ? "bg-purple-500 text-white shadow"
                            : "bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-700"
                        }`}
                      >
                        {prop}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Transparent bg + extra notes + generate */}
              {selectedStyleCharacter && (
                <div className="bg-white rounded-xl border border-purple-200 p-5 space-y-4">
                  {/* Transparent BG */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Transparent Background</p>
                      <p className="text-[10px] text-slate-400">Ideal for reusing in illustrations &amp; layouts</p>
                    </div>
                    <button
                      onClick={() => setTransparentBg((v) => !v)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        transparentBg ? "bg-purple-500" : "bg-slate-200"
                      }`}
                    >
                      <span className={`absolute top-0.5 size-5 bg-white rounded-full shadow transition-all ${
                        transparentBg ? "left-[22px]" : "left-0.5"
                      }`} />
                    </button>
                  </div>

                  {/* Extra notes */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Additional Notes</label>
                    <textarea
                      value={charNotes}
                      onChange={(e) => setCharNotes(e.target.value)}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-xs resize-none min-h-[56px] focus:ring-purple-400 focus:border-purple-400"
                      placeholder="e.g. smiling warmly, golden sunset lighting, showing kindness…"
                    />
                  </div>

                  {/* Auto-assembled prompt preview */}
                  {charPrompt && (
                    <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
                      <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wide mb-1">Auto-assembled prompt</p>
                      <p className="text-[10px] text-purple-600 line-clamp-4 leading-relaxed">{charPrompt}</p>
                    </div>
                  )}

                  {/* Generate button */}
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !hasApiKey || !charPrompt}
                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 disabled:opacity-40 shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <><div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
                    ) : selectedPose.length > 1 ? (
                      <><span className="material-symbols-outlined">auto_awesome</span> Generate {selectedPose.length} Poses</>
                    ) : (
                      <><span className="material-symbols-outlined">person_add</span> Generate Character</>
                    )}
                  </button>
                </div>
              )}

              {/* Prompt to select something */}
              {!selectedStyleCharacter && selectedSeriesData && (
                <div className="flex flex-col items-center text-center py-6 px-4 bg-purple-50 rounded-xl border border-purple-100">
                  <span className="material-symbols-outlined text-4xl text-purple-300 mb-2">touch_app</span>
                  <p className="text-xs text-purple-500 font-medium">Select a character above to begin building</p>
                </div>
              )}

              {!selectedSeriesId && (
                <div className="flex flex-col items-center text-center py-6 px-4 bg-purple-50 rounded-xl border border-purple-100">
                  <span className="material-symbols-outlined text-4xl text-purple-300 mb-2">library_books</span>
                  <p className="text-xs text-purple-500 font-medium">Select a series to load its characters</p>
                </div>
              )}
            </div>
          )}

          {/* Style picker (non-character) */}
          {assetType !== "cover" && assetType !== "character" && (
            <div className="bg-white rounded-xl border border-primary/10 p-5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Art Style</label>
              {styleGuideActive && hasStyleGuide ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-xs text-emerald-700">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Style locked by project style guide
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((s) => (
                    <button key={s} onClick={() => setStyle(s)}
                      className={`px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${style === s ? "bg-primary text-white" : "bg-slate-100 hover:bg-primary/20 hover:text-primary"}`}>
                      {s.replace("children's book illustration","cartoon").replace(" painting","").replace(" illustration","").replace(" character","").trim()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aspect Ratio (non-character, non-cover) */}
          {assetType !== "cover" && assetType !== "character" && (
            <div className="bg-white rounded-xl border border-primary/10 p-5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Aspect Ratio</label>
              <div className="flex gap-2 flex-wrap">
                {RATIOS.map((r) => (
                  <button key={r} onClick={() => setRatio(r)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium ${ratio === r ? "bg-primary text-white" : "bg-slate-100 hover:bg-primary/20"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prompt + Generate (non-character) */}
          {assetType !== "character" && (
            <div className="bg-white rounded-xl border border-primary/10 p-5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                {referenceImage ? "What to change" : assetType === "cover" ? "Cover Scene" : "Scene / Prompt"}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary min-h-[90px] resize-none"
                placeholder={
                  referenceImage
                    ? EDIT_MODES.find(m => m.key === editMode)?.tip || "Describe the edit…"
                    : assetType === "cover"
                    ? "A brave girl standing at the edge of an enchanted forest at dusk…"
                    : "A brave little dragon sharing toys with friends in a magical forest…"
                }
              />

              {((styleGuideActive && hasStyleGuide) || selectedCharacter) && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Effective prompt</p>
                  <p className="text-[11px] text-slate-600 line-clamp-4">{effectivePrompt || <span className="italic text-slate-400">Type a prompt above…</span>}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating || !hasApiKey || !prompt.trim()}
                className="w-full mt-4 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <><div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {referenceImage ? "Editing…" : "Generating…"}</>
                ) : (
                  <><span className="material-symbols-outlined">{referenceImage ? "auto_fix_high" : "auto_awesome"}</span>
                    {referenceImage ? `Edit Image` : `Generate ${ASSET_TYPES.find(t => t.key === assetType)?.label}`}</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Gallery ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <span className="material-symbols-outlined text-red-500">error</span>
              <p className="text-sm text-red-600">{error}</p>
              <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-sm">close</span></button>
            </div>
          )}

          {pickingFromGallery && (
            <div className="p-4 mb-4 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined animate-bounce">touch_app</span>
              Click any image to use it as your reference
            </div>
          )}

          <div className="bg-white rounded-xl border border-primary/10 p-6">

            {/* Gallery heading: series or project */}
            {assetType === "character" && selectedSeriesId ? (
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-500">library_books</span>
                Series Character Library ({seriesGallery.length})
                <span className="ml-auto text-[10px] text-slate-400 font-normal">Shared across all books in this series</span>
              </h3>
            ) : (
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">photo_library</span>
                Gallery ({gallery.length})
              </h3>
            )}

            {/* Series character gallery */}
            {assetType === "character" && selectedSeriesId ? (
              seriesGallery.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">person_add</span>
                  <p className="text-slate-500 mb-1">No character assets yet.</p>
                  <p className="text-sm text-slate-400">Generate characters above to build your series library.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {seriesGallery.map((asset) => (
                    <div key={asset.id} className="group rounded-xl overflow-hidden border border-slate-100 hover:shadow-md transition-all">
                      <div className="aspect-square bg-slate-100 relative">
                        <img src={asset.url} alt={asset.name || "character"} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500 text-white capitalize">
                          {asset.pose || "character"}
                        </span>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-center opacity-0 group-hover:opacity-100 pb-3">
                          <div className="flex gap-1.5">
                            <a href={asset.url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-white rounded-lg text-[10px] font-bold shadow hover:scale-105 transition-transform">
                              <span className="material-symbols-outlined text-xs">open_in_new</span>Open
                            </a>
                            <button
                              onClick={() => handleUseFromGallery(asset)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold shadow hover:scale-105 transition-transform">
                              <span className="material-symbols-outlined text-xs">edit</span>Use as ref
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-semibold text-slate-700 truncate">{asset.name}</p>
                        {asset.characterName && (
                          <span className="text-[10px] text-purple-600 font-medium">{asset.characterName}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : gallery.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">image</span>
                <p className="text-slate-500 mb-1">No assets yet.</p>
                <p className="text-sm text-slate-400">Generate your first asset using the panel on the left.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {gallery.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => pickingFromGallery && handleUseFromGallery(asset)}

                    className={`group rounded-xl overflow-hidden border transition-all ${
                      pickingFromGallery
                        ? "border-primary cursor-pointer hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02]"
                        : "border-slate-100 hover:shadow-md"
                    }`}
                  >
                    <div className="aspect-square bg-slate-100 relative">
                      <img src={asset.url} alt={asset.prompt || "illustration"} className="w-full h-full object-cover" />

                      {/* Type badge */}
                      <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${TYPE_COLORS[asset.type] || TYPE_COLORS.illustration}`}>
                        {asset.type}
                      </span>

                      {/* Hover overlay — hidden during gallery-pick mode */}
                      {!pickingFromGallery && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col items-center justify-end opacity-0 group-hover:opacity-100 pb-3 gap-2 px-2">
                          {/* Moving spinner */}
                          {movingAssetId === asset.id && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 rounded-xl">
                              <div className="flex flex-col items-center gap-2">
                                <div className="size-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span className="text-white text-[11px] font-bold">Moving…</span>
                              </div>
                            </div>
                          )}

                          {/* Move to series (character assets) */}
                          {selectedProject && seriesList.length > 0 && (
                            <div className="flex items-center gap-1 w-full justify-center">
                              <span className="material-symbols-outlined text-purple-300 text-sm">library_books</span>
                              <select
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  if (e.target.value) handleMoveToSeries(asset, e.target.value);
                                  e.target.value = "";
                                }}
                                defaultValue=""
                                className="flex-1 bg-white/90 text-slate-700 text-[10px] font-bold rounded-lg px-2 py-1 max-w-[160px] focus:outline-none cursor-pointer shadow"
                              >
                                <option value="" disabled>Move to series…</option>
                                {seriesList.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Move to project */}

                          {selectedProject && projects.filter(p => p.id !== selectedProject).length > 0 && (
                            <div className="flex items-center gap-1 w-full justify-center">
                              <span className="material-symbols-outlined text-white text-sm">drive_file_move</span>
                              <select
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  if (e.target.value) handleMove(asset, e.target.value);
                                  e.target.value = "";
                                }}
                                defaultValue=""
                                className="flex-1 bg-white/90 text-slate-700 text-[10px] font-bold rounded-lg px-2 py-1 max-w-[160px] focus:outline-none cursor-pointer shadow"
                              >
                                <option value="" disabled>Move to…</option>
                                {projects
                                  .filter((p) => p.id !== selectedProject)
                                  .map((p) => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                  ))}
                              </select>
                            </div>
                          )}

                          {/* Bottom row: Open / Use as ref / Copy */}
                          <div className="flex gap-1.5">
                            <a href={asset.url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-white rounded-lg text-[10px] font-bold shadow hover:scale-105 transition-transform">
                              <span className="material-symbols-outlined text-xs">open_in_new</span>Open
                            </a>
                            <button
                              onClick={() => handleUseFromGallery(asset)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold shadow hover:scale-105 transition-transform">
                              <span className="material-symbols-outlined text-xs">edit</span>Use as ref
                            </button>
                            {selectedProject && (
                              <button
                                onClick={() => handleDuplicate(asset)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-white rounded-lg text-[10px] font-bold shadow hover:scale-105 transition-transform text-slate-600">
                                <span className="material-symbols-outlined text-xs">content_copy</span>Copy
                              </button>
                            )}
                          </div>
                        </div>
                      )}


                      {/* Gallery-pick overlay — bold and obvious */}
                      {pickingFromGallery && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-all group-hover:bg-primary/70">
                          <div className="flex flex-col items-center gap-2">
                            <div className="size-14 rounded-full bg-white/20 group-hover:bg-white flex items-center justify-center transition-all">
                              <span className="material-symbols-outlined text-3xl text-white group-hover:text-primary transition-all">check_circle</span>
                            </div>
                            <span className="text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all">Use as reference</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <p className="text-xs text-slate-600 line-clamp-2">{asset.prompt || asset.name}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        {asset.characterName && (
                          <span className="flex items-center gap-0.5 text-[10px] text-purple-600 font-medium bg-purple-50 px-1.5 py-0.5 rounded-full">
                            <span className="material-symbols-outlined text-xs">person</span>
                            {asset.characterName}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 truncate">{asset.style}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
