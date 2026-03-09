import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGemini } from "../contexts/GeminiContext";
import { useAgent } from "../contexts/AgentProvider";
import { getProject, getChapters, updateChapter, createAsset, getAssets } from "../lib/firestore";
import { suggestNextSentence, generateImage, buildStylePrompt } from "../lib/gemini";
import { KDP_TRIM_SIZES } from "../lib/kdpFormats";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

// ─── Layout Presets ──────────────────────────────────────────────────────────
const LAYOUT_PRESETS = [
  {
    id: "image-top", label: "Image Top",
    apply: (imgUrl, text) => [
      { id: `img-${Date.now()}`, type: "image", x: 0, y: 0, w: 100, h: 58, src: imgUrl, objectFit: "cover", borderRadius: 0, zIndex: 1 },
      { id: `txt-${Date.now() + 1}`, type: "text", x: 5, y: 60, w: 90, h: 37, content: text, fontSize: 18, fontFamily: "Georgia, serif", color: "#1a1a2e", textAlign: "center", fontWeight: "normal", fontStyle: "normal", backgroundColor: "transparent", zIndex: 2 },
    ],
  },
  {
    id: "image-bottom", label: "Image Bottom",
    apply: (imgUrl, text) => [
      { id: `txt-${Date.now()}`, type: "text", x: 5, y: 3, w: 90, h: 35, content: text, fontSize: 18, fontFamily: "Georgia, serif", color: "#1a1a2e", textAlign: "center", fontWeight: "normal", fontStyle: "normal", backgroundColor: "transparent", zIndex: 2 },
      { id: `img-${Date.now() + 1}`, type: "image", x: 0, y: 40, w: 100, h: 60, src: imgUrl, objectFit: "cover", borderRadius: 0, zIndex: 1 },
    ],
  },
  {
    id: "full-bleed", label: "Full Bleed",
    apply: (imgUrl, text) => [
      { id: `img-${Date.now()}`, type: "image", x: 0, y: 0, w: 100, h: 100, src: imgUrl, objectFit: "cover", borderRadius: 0, zIndex: 1 },
      { id: `txt-${Date.now() + 1}`, type: "text", x: 5, y: 70, w: 90, h: 28, content: text, fontSize: 20, fontFamily: "Georgia, serif", color: "#ffffff", textAlign: "center", fontWeight: "bold", fontStyle: "normal", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2 },
    ],
  },
  {
    id: "split-left", label: "Split Left",
    apply: (imgUrl, text) => [
      { id: `img-${Date.now()}`, type: "image", x: 0, y: 0, w: 48, h: 100, src: imgUrl, objectFit: "cover", borderRadius: 0, zIndex: 1 },
      { id: `txt-${Date.now() + 1}`, type: "text", x: 52, y: 15, w: 44, h: 70, content: text, fontSize: 17, fontFamily: "Georgia, serif", color: "#1a1a2e", textAlign: "left", fontWeight: "normal", fontStyle: "normal", backgroundColor: "transparent", zIndex: 2 },
    ],
  },
  {
    id: "text-only", label: "Text Only",
    apply: (_imgUrl, text) => [
      { id: `txt-${Date.now()}`, type: "text", x: 8, y: 15, w: 84, h: 70, content: text, fontSize: 22, fontFamily: "Georgia, serif", color: "#1a1a2e", textAlign: "center", fontWeight: "normal", fontStyle: "italic", backgroundColor: "transparent", zIndex: 1 },
    ],
  },
];

const FONTS = [
  "Georgia, serif", "Palatino, serif", "Times New Roman, serif",
  "Arial, sans-serif", "Gill Sans, sans-serif", "Verdana, sans-serif",
  "Comic Sans MS, cursive", "Trebuchet MS, sans-serif",
];

function getCanvasDimensions(trimSizeId) {
  const size = KDP_TRIM_SIZES?.[trimSizeId] || { width: 8.5, height: 8.5, label: "8.5\" × 8.5\" Square" };
  return { w: size.width * 70, h: size.height * 70, label: size.label };
}

function makeDefaultLayout(imgUrl, text) {
  return {
    backgroundColor: "#ffffff",
    elements: LAYOUT_PRESETS[0].apply(imgUrl, text),
  };
}

function newTextElement(content = "Add your text here...") {
  return {
    id: `txt-${Date.now()}`,
    type: "text",
    x: 10, y: 10, w: 80, h: 30,
    content,
    fontSize: 18,
    fontFamily: "Georgia, serif",
    color: "#1a1a2e",
    textAlign: "center",
    fontWeight: "normal",
    fontStyle: "normal",
    backgroundColor: "transparent",
    zIndex: 10,
  };
}

function newImageElement(src = "") {
  return {
    id: `img-${Date.now()}`,
    type: "image",
    x: 5, y: 5, w: 90, h: 55,
    src,
    objectFit: "cover",
    borderRadius: 0,
    zIndex: 10,
  };
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function StoryStudio() {
  const { user } = useAuth();
  const { apiKey, hasApiKey } = useGemini();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project");
  const chapterId = searchParams.get("chapter");
  const { setPageContext, registerActionHandler } = useAgent();

  const [project, setProject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(null);
  const [layout, setLayout] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [allAssets, setAllAssets] = useState([]);
  const [imagePrompt, setImagePrompt] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const autoSaveTimer = useRef(null);
  const canvasRef = useRef(null);
  const dragState = useRef(null);

  const canvasDims = getCanvasDimensions(project?.trimSize);

  // ── AI Agent Context ───────────────────────────────────────────────────────
  useEffect(() => {
    setPageContext(prev => ({
      ...prev,
      currentPage: "Story Studio (Canvas)",
      projectTitle: project?.title || "",
      chapterTitle: activeChapter?.title || "",
      pageContent: layout?.elements?.filter(e => e.type === "text").map(e => e.content).join("\n\n") || "",
    }));
  }, [project, activeChapter, layout, setPageContext]);

  useEffect(() => {
    const unsubs = [
      registerActionHandler("update_content", (action) => {
        setLayout(prev => {
          if (!prev) return prev;
          const txtEls = prev.elements.filter(e => e.type === "text");
          if (txtEls.length > 0) {
            return {
              ...prev,
              elements: prev.elements.map(e =>
                e.id === txtEls[0].id ? { ...e, content: action.content } : e
              ),
            };
          }
          return { ...prev, elements: [...prev.elements, newTextElement(action.content)] };
        });
      }),
      registerActionHandler("add_image", async (action) => {
        if (action.imageUrl) {
          setLayout(prev => prev ? {
            ...prev,
            elements: [...prev.elements, newImageElement(action.imageUrl)],
          } : prev);
        }
      }),
    ];
    return () => unsubs.forEach(fn => fn());
  }, [registerActionHandler]);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user || !projectId) return;
    setLoading(true);
    const [p, chs, assets] = await Promise.all([
      getProject(user.uid, projectId),
      getChapters(user.uid, projectId),
      getAssets(user.uid, projectId),
    ]);
    setProject(p);

    const assetByPage = {};
    for (const asset of assets) {
      if (asset.type === "illustration" && asset.url) {
        if (asset.pageNumber) assetByPage[asset.pageNumber] = asset.url;
        else if (asset.name) {
          const m = asset.name.match(/Page\s+(\d+)/i);
          if (m && !assetByPage[Number(m[1])]) assetByPage[Number(m[1])] = asset.url;
        }
      }
    }
    // Store all assets for picker
    setAllAssets(assets.filter(a => a.url));
    const enriched = chs.sort((a, b) => a.number - b.number).map(ch => ({
      ...ch,
      illustrationUrl: ch.illustrationUrl || assetByPage[ch.number] || "",
    }));
    setChapters(enriched);

    const target = chapterId
      ? enriched.find(c => c.id === chapterId)
      : enriched[0];
    if (target) activatePage(target);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, projectId, chapterId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Activate a page ────────────────────────────────────────────────────────
  function activatePage(ch) {
    setActiveChapter(ch);
    setSelectedId(null);
    setImagePrompt(ch.sceneDescription || "");
    if (ch.canvasLayout) {
      // Backfill empty image elements with the chapter's illustrationUrl
      const els = ch.canvasLayout.elements.map(el =>
        el.type === "image" && !el.src && ch.illustrationUrl
          ? { ...el, src: ch.illustrationUrl }
          : el
      );
      setLayout({ ...ch.canvasLayout, elements: els });
    } else {
      setLayout(makeDefaultLayout(ch.illustrationUrl || "", ch.content || ""));
    }
  }

  async function switchChapter(ch) {
    // Cancel any pending debounced save — we save immediately below
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    if (layout && activeChapter) await saveLayout(layout, activeChapter);
    activatePage(ch);
  }

  // ── Save layout ────────────────────────────────────────────────────────────
  const saveLayout = useCallback(async (layoutToSave, chapter) => {
    if (!user || !chapter) return;
    setSaving(true);
    try {
      // Also persist the first text element as `content` for backwards compatibility
      const firstText = layoutToSave.elements?.find(e => e.type === "text")?.content || "";
      await updateChapter(user.uid, projectId, chapter.id, {
        canvasLayout: layoutToSave,
        content: firstText,
      });
      // ✅ Update chapters state so returning to this page gets fresh data
      setChapters(prev => prev.map(c =>
        c.id === chapter.id ? { ...c, canvasLayout: layoutToSave, content: firstText } : c
      ));
    } finally {
      setSaving(false);
    }
  }, [user, projectId]);

  function scheduleAutoSave(newLayout, chapter) {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    // Capture chapter at schedule time to avoid stale closure bug
    autoSaveTimer.current = setTimeout(() => saveLayout(newLayout, chapter), 1500);
  }

  function updateLayout(newLayout) {
    setLayout(newLayout);
    scheduleAutoSave(newLayout, activeChapter);
  }

  // ── Element management ─────────────────────────────────────────────────────
  function updateElement(id, changes) {
    const newLayout = { ...layout, elements: layout.elements.map(el => el.id === id ? { ...el, ...changes } : el) };
    updateLayout(newLayout);
  }

  function addTextElement() {
    const el = newTextElement();
    const newLayout = { ...layout, elements: [...layout.elements, el] };
    updateLayout(newLayout);
    setSelectedId(el.id);
  }

  function addImageElement(src = "") {
    const el = newImageElement(src);
    const newLayout = { ...layout, elements: [...layout.elements, el] };
    updateLayout(newLayout);
    setSelectedId(el.id);
  }

  function placeAssetOnCanvas(asset) {
    // If there's a selected empty image element, fill it; otherwise add new
    const emptyImg = selectedEl?.type === "image" && !selectedEl.src ? selectedEl : null;
    if (emptyImg) {
      updateElement(emptyImg.id, { src: asset.url });
    } else {
      addImageElement(asset.url);
    }
    setShowAssetPicker(false);
  }

  function deleteElement(id) {
    const newLayout = { ...layout, elements: layout.elements.filter(el => el.id !== id) };
    updateLayout(newLayout);
    setSelectedId(null);
  }

  function bringForward(id) {
    const el = layout.elements.find(e => e.id === id);
    if (!el) return;
    updateElement(id, { zIndex: (el.zIndex || 1) + 1 });
  }

  function sendBackward(id) {
    const el = layout.elements.find(e => e.id === id);
    if (!el) return;
    updateElement(id, { zIndex: Math.max(0, (el.zIndex || 1) - 1) });
  }

  function applyPreset(preset) {
    const imgEl = layout?.elements?.find(e => e.type === "image");
    const txtEl = layout?.elements?.find(e => e.type === "text");
    const imgUrl = imgEl?.src || activeChapter?.illustrationUrl || "";
    const text = txtEl?.content || activeChapter?.content || "";
    updateLayout({ ...layout, elements: preset.apply(imgUrl, text) });
    setSelectedId(null);
  }

  // ── Drag Move ─────────────────────────────────────────────────────────────
  function onMouseDownElement(e, el) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(el.id);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    dragState.current = { id: el.id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y, cW: rect.width, cH: rect.height };

    function onMove(me) {
      if (!dragState.current) return;
      const dx = ((me.clientX - dragState.current.startX) / dragState.current.cW) * 100;
      const dy = ((me.clientY - dragState.current.startY) / dragState.current.cH) * 100;
      setLayout(prev => ({
        ...prev,
        elements: prev.elements.map(e2 =>
          e2.id === dragState.current.id
            ? { ...e2, x: Math.max(0, Math.min(95, dragState.current.origX + dx)), y: Math.max(0, Math.min(95, dragState.current.origY + dy)) }
            : e2
        ),
      }));
    }
    function onUp() {
      if (!dragState.current) return;
      scheduleAutoSave({ ...layout });
      dragState.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // ── Resize ────────────────────────────────────────────────────────────────
  function onMouseDownResize(e, el) {
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY, w: el.w, h: el.h, cW: rect.width, cH: rect.height };
    function onMove(me) {
      const dw = ((me.clientX - start.x) / start.cW) * 100;
      const dh = ((me.clientY - start.y) / start.cH) * 100;
      setLayout(prev => ({
        ...prev,
        elements: prev.elements.map(e2 =>
          e2.id === el.id
            ? { ...e2, w: Math.max(10, Math.min(100, start.w + dw)), h: Math.max(8, Math.min(100, start.h + dh)) }
            : e2
        ),
      }));
    }
    function onUp() {
      scheduleAutoSave(layout);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // ── Generate image and add to canvas ──────────────────────────────────────
  async function handleGenerateImage() {
    if (!hasApiKey || !imagePrompt.trim()) return;
    setGeneratingImage(true);
    try {
      const stylePrefix = project?.styleGuide ? buildStylePrompt(project.styleGuide) : "";
      const fullPrompt = `${stylePrefix} ${imagePrompt}`.trim();
      const dataUrl = await generateImage(apiKey, fullPrompt, {
        aspectRatio: project?.trimSize === "8.5x8.5" ? "1:1" : "3:4",
      });
      // Upload to storage
      const filename = `page_${activeChapter?.number || 0}_${Date.now()}.png`;
      const storageRef = ref(storage, `users/${user.uid}/projects/${projectId}/${filename}`);
      await uploadString(storageRef, dataUrl, "data_url");
      const downloadUrl = await getDownloadURL(storageRef);
      await createAsset(user.uid, projectId, {
        name: `Page ${activeChapter?.number || "??"} Illustration`,
        type: "illustration",
        pageNumber: activeChapter?.number,
        url: downloadUrl,
        storagePath: storageRef.fullPath,
        prompt: fullPrompt,
        style: project?.styleGuide?.artStyle || "",
      });
      // Find existing image element or add a new one
      const existingImg = layout?.elements?.find(e => e.type === "image");
      if (existingImg) {
        updateElement(existingImg.id, { src: downloadUrl });
      } else {
        addImageElement(downloadUrl);
      }
      // Update chapter illustrationUrl
      await updateChapter(user.uid, projectId, activeChapter.id, { illustrationUrl: downloadUrl });
      setChapters(prev => prev.map(c => c.id === activeChapter.id ? { ...c, illustrationUrl: downloadUrl } : c));
    } catch (e) {
      console.error("Image gen failed:", e);
    }
    setGeneratingImage(false);
  }

  async function handleSuggestText() {
    const textEls = layout?.elements?.filter(e => e.type === "text");
    if (!hasApiKey || !textEls?.length) return;
    setSuggesting(true);
    try {
      const currentText = textEls[textEls.length - 1].content;
      const suggestion = await suggestNextSentence(apiKey, currentText, project?.title);
      const last = textEls[textEls.length - 1];
      updateElement(last.id, { content: currentText + " " + suggestion });
    } catch (e) {
      console.error("Suggest failed:", e);
    }
    setSuggesting(false);
  }

  const selectedEl = layout?.elements?.find(e => e.id === selectedId);
  const sortedElements = layout ? [...layout.elements].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1)) : [];

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="size-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
    </div>
  );

  if (!projectId) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">edit_note</span>
        <h2 className="text-2xl font-black mb-2">No Project Selected</h2>
        <button onClick={() => navigate("/")} className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 mt-4">Dashboard</button>
      </div>
    </div>
  );

  return (
    <>
    <div className="flex h-full overflow-hidden bg-slate-900 text-white">

      {/* ── LEFT: Page List ───────────────────────────────────────────────── */}
      <div className="w-48 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-700">
          <button
            onClick={() => navigate(`/story-outline?project=${projectId}`)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-2 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span> Outline
          </button>
          <h2 className="text-xs font-black text-white truncate">{project?.title}</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">{chapters.length} pages · {canvasDims.label}</p>
        </div>

        {/* Cover thumbnail */}
        <div className="px-2 pt-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 px-1">Cover</p>
          <button
            onClick={() => navigate(`/book-preview?project=${projectId}`)}
            className="w-full rounded-lg overflow-hidden border-2 border-slate-600 hover:border-purple-400 transition-colors mb-2"
            style={{ aspectRatio: "1/1" }}
          >
            {project?.coverImageUrl ? (
              <img src={project.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-b from-purple-800 to-purple-900">
                <span className="material-symbols-outlined text-purple-300 text-xl">auto_stories</span>
              </div>
            )}
          </button>
        </div>

        {/* Pages */}
        <div className="px-2 overflow-y-auto flex-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 px-1">Pages</p>
          <div className="space-y-1.5">
            {chapters.map(ch => (
              <button
                key={ch.id}
                onClick={() => switchChapter(ch)}
                className={`w-full rounded-lg overflow-hidden border-2 transition-all ${
                  activeChapter?.id === ch.id
                    ? "border-purple-400 shadow-lg shadow-purple-500/20"
                    : "border-slate-600 hover:border-slate-400"
                }`}
                style={{ aspectRatio: "1/1" }}
              >
                {ch.illustrationUrl ? (
                  <div className="relative w-full h-full">
                    <img src={ch.illustrationUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5">{ch.number}</div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-700 gap-1">
                    <span className="material-symbols-outlined text-slate-400 text-base">image</span>
                    <span className="text-[9px] text-slate-400 font-bold">{ch.number}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom nav */}
        <div className="p-3 border-t border-slate-700 space-y-1.5">
          <button
            onClick={() => navigate(`/book-preview?project=${projectId}`)}
            className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">auto_stories</span> Preview
          </button>
        </div>
      </div>

      {/* ── CENTER: Canvas ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-3 gap-2 shrink-0 overflow-x-auto">
          <span className="text-xs font-bold text-slate-300 mr-1 whitespace-nowrap">
            {activeChapter ? `Page ${activeChapter.number}` : "Select a page"}
          </span>

          {/* Separator */}
          <div className="w-px h-5 bg-slate-600" />

          {/* Layout presets */}
          <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1 shrink-0">
            {LAYOUT_PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                title={p.label}
                className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 hover:bg-slate-600 hover:text-white transition-colors whitespace-nowrap"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-slate-600" />

          {/* Add elements */}
          <button
            onClick={addTextElement}
            className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-colors whitespace-nowrap"
            title="Add text block"
          >
            <span className="material-symbols-outlined text-sm">text_fields</span> + Text
          </button>
          {/* + Image now opens asset picker */}
          <button
            onClick={() => setShowAssetPicker(true)}
            className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-colors whitespace-nowrap"
            title="Add image from asset library"
          >
            <span className="material-symbols-outlined text-sm">add_photo_alternate</span> + Image
          </button>

          {/* Delete selected */}
          {selectedId && (
            <button
              onClick={() => deleteElement(selectedId)}
              className="flex items-center gap-1 px-2 py-1 bg-red-900/60 hover:bg-red-700 rounded-lg text-xs font-bold text-red-300 hover:text-white transition-colors whitespace-nowrap"
              title="Delete selected element"
            >
              <span className="material-symbols-outlined text-sm">delete</span> Delete
            </button>
          )}

          {/* Z-order */}
          {selectedId && (
            <>
              <button onClick={() => bringForward(selectedId)} className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-400 hover:text-white" title="Bring forward">
                <span className="material-symbols-outlined text-sm">flip_to_front</span>
              </button>
              <button onClick={() => sendBackward(selectedId)} className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-400 hover:text-white" title="Send backward">
                <span className="material-symbols-outlined text-sm">flip_to_back</span>
              </button>
            </>
          )}

          {/* BG color */}
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <label className="text-[10px] text-slate-400 font-bold uppercase">BG</label>
            <input
              type="color"
              value={layout?.backgroundColor || "#ffffff"}
              onChange={e => updateLayout({ ...layout, backgroundColor: e.target.value })}
              className="size-6 rounded border border-slate-600 cursor-pointer bg-transparent"
            />
          </div>

          {/* Save indicator */}
          <div className="text-[10px] text-slate-500 flex items-center gap-1 shrink-0">
            {saving
              ? <><div className="size-2.5 border-2 border-purple-400/40 border-t-purple-400 rounded-full animate-spin" />Saving</>
              : <><span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>Saved</>
            }
          </div>

          {/* AI panel toggle */}
          <button
            onClick={() => setAiPanelOpen(o => !o)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${aiPanelOpen ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span> AI
          </button>

          {/* Preview button */}
          <button
            onClick={() => navigate(`/book-preview?project=${projectId}`)}
            className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-sm">auto_stories</span> Preview
          </button>
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-8 bg-slate-900">
          {layout && activeChapter ? (
            <div
              ref={canvasRef}
              className="relative shadow-2xl select-none"
              style={{
                width: Math.min(canvasDims.w, 580),
                height: Math.min(canvasDims.h, 580 * (canvasDims.h / canvasDims.w)),
                backgroundColor: layout.backgroundColor || "#ffffff",
              }}
              onMouseDown={() => setSelectedId(null)}
            >
              {sortedElements.map(el => (
                <CanvasElement
                  key={el.id}
                  el={el}
                  selected={selectedId === el.id}
                  onMouseDown={onMouseDownElement}
                  onResizeDown={onMouseDownResize}
                />
              ))}
            </div>
          ) : (
            <div className="text-slate-600 text-center">
              <span className="material-symbols-outlined text-5xl mb-3">touch_app</span>
              <p className="text-sm">Select a page from the left panel</p>
            </div>
          )}
        </div>

        {/* Page navigation */}
        {chapters.length > 0 && activeChapter && (
          <div className="h-10 bg-slate-800 border-t border-slate-700 flex items-center justify-center gap-4 shrink-0">
            <button
              onClick={() => { const i = chapters.findIndex(c => c.id === activeChapter.id); if (i > 0) switchChapter(chapters[i - 1]); }}
              disabled={chapters.findIndex(c => c.id === activeChapter.id) === 0}
              className="text-slate-400 hover:text-white disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="text-xs text-slate-400">Page {activeChapter.number} of {chapters.length}</span>
            <button
              onClick={() => { const i = chapters.findIndex(c => c.id === activeChapter.id); if (i < chapters.length - 1) switchChapter(chapters[i + 1]); }}
              disabled={chapters.findIndex(c => c.id === activeChapter.id) === chapters.length - 1}
              className="text-slate-400 hover:text-white disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT: Properties Panel ──────────────────────────────────────── */}
      <div className="w-60 bg-slate-800 border-l border-slate-700 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-3 border-b border-slate-700">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            {selectedEl ? (selectedEl.type === "image" ? "🖼 Image" : "✏️ Text") : "Properties"}
          </h3>
        </div>

        {!selectedEl && !aiPanelOpen && (
          <div className="p-4 text-center text-slate-600">
            <span className="material-symbols-outlined text-3xl mb-2">touch_app</span>
            <p className="text-xs">Click an element to edit it. Use + Text / + Image to add new elements.</p>
          </div>
        )}

        {/* Text properties */}
        {selectedEl?.type === "text" && (
          <div className="p-3 space-y-3 overflow-y-auto">
            <div>
              <label className="prop-label">Content</label>
              <textarea
                value={selectedEl.content}
                onChange={e => updateElement(selectedEl.id, { content: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-xs text-white resize-none min-h-[90px] focus:border-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="prop-label">Font</label>
              <select
                value={selectedEl.fontFamily}
                onChange={e => updateElement(selectedEl.id, { fontFamily: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-xs text-white focus:border-purple-400 focus:outline-none"
              >
                {FONTS.map(f => <option key={f} value={f}>{f.split(",")[0]}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="prop-label">Size</label>
                <input type="number" min={8} max={72} value={selectedEl.fontSize}
                  onChange={e => updateElement(selectedEl.id, { fontSize: Number(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-xs text-white focus:border-purple-400 focus:outline-none" />
              </div>
              <div>
                <label className="prop-label">Color</label>
                <input type="color" value={selectedEl.color?.match(/^#/) ? selectedEl.color : "#1a1a2e"}
                  onChange={e => updateElement(selectedEl.id, { color: e.target.value })}
                  className="w-full h-9 bg-slate-700 border border-slate-600 rounded-lg p-1 cursor-pointer" />
              </div>
            </div>
            <div>
              <label className="prop-label">Alignment</label>
              <div className="flex gap-1">
                {["left", "center", "right"].map(a => (
                  <button key={a} onClick={() => updateElement(selectedEl.id, { textAlign: a })}
                    className={`flex-1 py-1 rounded text-[10px] font-bold capitalize transition-colors ${selectedEl.textAlign === a ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => updateElement(selectedEl.id, { fontWeight: selectedEl.fontWeight === "bold" ? "normal" : "bold" })}
                className={`flex-1 py-1 rounded text-xs font-black transition-colors ${selectedEl.fontWeight === "bold" ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>B</button>
              <button onClick={() => updateElement(selectedEl.id, { fontStyle: selectedEl.fontStyle === "italic" ? "normal" : "italic" })}
                className={`flex-1 py-1 rounded text-xs italic font-bold transition-colors ${selectedEl.fontStyle === "italic" ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>I</button>
            </div>
            <div>
              <label className="prop-label">Text Background</label>
              <div className="flex gap-2">
                <input type="color"
                  value={selectedEl.backgroundColor?.startsWith("rgba") ? "#000000" : (selectedEl.backgroundColor || "#ffffff")}
                  onChange={e => updateElement(selectedEl.id, { backgroundColor: e.target.value })}
                  className="h-8 w-9 bg-slate-700 border border-slate-600 rounded cursor-pointer p-0.5" />
                <button onClick={() => updateElement(selectedEl.id, { backgroundColor: "transparent" })}
                  className="flex-1 text-xs bg-slate-700 border border-slate-600 text-slate-400 rounded hover:bg-slate-600 transition-colors">None</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="prop-label">W%</label>
                <input type="number" min={10} max={100} value={Math.round(selectedEl.w)}
                  onChange={e => updateElement(selectedEl.id, { w: Number(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded p-1.5 text-xs text-white focus:border-purple-400 focus:outline-none" />
              </div>
              <div><label className="prop-label">H%</label>
                <input type="number" min={8} max={100} value={Math.round(selectedEl.h)}
                  onChange={e => updateElement(selectedEl.id, { h: Number(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded p-1.5 text-xs text-white focus:border-purple-400 focus:outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* Image properties */}
        {selectedEl?.type === "image" && (
          <div className="p-3 space-y-3">
            {selectedEl.src && (
              <img src={selectedEl.src} alt="" className="w-full rounded-lg object-cover aspect-square border border-slate-600" />
            )}
            {!selectedEl.src && (
              <div className="w-full aspect-square rounded-lg bg-slate-700 flex items-center justify-center text-slate-500">
                <span className="material-symbols-outlined text-3xl">image</span>
              </div>
            )}
            <div>
              <label className="prop-label">Fit</label>
              <div className="flex gap-1">
                {["cover", "contain", "fill"].map(fit => (
                  <button key={fit} onClick={() => updateElement(selectedEl.id, { objectFit: fit })}
                    className={`flex-1 py-1 rounded text-[10px] font-bold capitalize transition-colors ${selectedEl.objectFit === fit ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>
                    {fit}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="prop-label">Rounded</label>
              <input type="range" min={0} max={50} value={selectedEl.borderRadius || 0}
                onChange={e => updateElement(selectedEl.id, { borderRadius: Number(e.target.value) })}
                className="w-full accent-purple-500" />
              <p className="text-[10px] text-slate-500">{selectedEl.borderRadius || 0}px</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="prop-label">W%</label>
                <input type="number" min={10} max={100} value={Math.round(selectedEl.w)}
                  onChange={e => updateElement(selectedEl.id, { w: Number(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded p-1.5 text-xs text-white focus:border-purple-400 focus:outline-none" /></div>
              <div><label className="prop-label">H%</label>
                <input type="number" min={8} max={100} value={Math.round(selectedEl.h)}
                  onChange={e => updateElement(selectedEl.id, { h: Number(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded p-1.5 text-xs text-white focus:border-purple-400 focus:outline-none" /></div>
            </div>
          </div>
        )}

        {/* AI Panel */}
        {aiPanelOpen && (
          <div className="border-t border-slate-700 p-3 space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">auto_awesome</span> AI Tools
            </p>

            {/* Image generation */}
            <div>
              <label className="prop-label">Scene Prompt</label>
              <textarea
                value={imagePrompt}
                onChange={e => setImagePrompt(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-xs text-white resize-none min-h-[60px] focus:border-purple-400 focus:outline-none"
                placeholder="Describe the scene to illustrate..."
              />
              <button
                onClick={handleGenerateImage}
                disabled={generatingImage || !hasApiKey || !imagePrompt.trim()}
                className="w-full mt-1.5 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generatingImage
                  ? <><div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</>
                  : <><span className="material-symbols-outlined text-sm">brush</span>Generate & Add Image</>
                }
              </button>
            </div>

            {/* Text suggestion */}
            <div>
              <button
                onClick={handleSuggestText}
                disabled={suggesting || !hasApiKey}
                className="w-full py-2 bg-slate-700 text-white rounded-lg text-xs font-bold hover:bg-slate-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {suggesting
                  ? <><div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Thinking...</>
                  : <><span className="material-symbols-outlined text-sm">auto_awesome</span>Suggest Next Sentence</>
                }
              </button>
            </div>

            {/* API key status */}
            <div className={`p-2.5 rounded-lg text-[10px] ${hasApiKey ? "bg-green-900/50 text-green-400" : "bg-amber-900/50 text-amber-400"}`}>
              {hasApiKey ? "✓ Gemini connected" : "⚠ Set API key in Settings"}
            </div>
          </div>
        )}

        {/* Elements list at bottom */}
        {layout && layout.elements.length > 0 && (
          <div className="mt-auto border-t border-slate-700 p-3">
            <p className="prop-label mb-2">Elements ({layout.elements.length})</p>
            <div className="space-y-1">
              {[...layout.elements].sort((a, b) => (b.zIndex || 1) - (a.zIndex || 1)).map(el => (
                <button
                  key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-bold transition-colors ${selectedId === el.id ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}
                >
                  <span className="material-symbols-outlined text-xs">{el.type === "image" ? "image" : "text_fields"}</span>
                  <span className="truncate flex-1 text-left">
                    {el.type === "image" ? (el.src ? "Image" : "Image (empty)") : el.content?.slice(0, 20) + "..."}
                  </span>
                  <span className="text-[8px] opacity-50">z:{el.zIndex || 1}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ── Asset Picker Modal ────────────────────────────────────────────── */}
    {showAssetPicker && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
        <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-700">
            <div>
              <h2 className="text-lg font-black text-white">Asset Library</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Click an image to add it to the canvas</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { addImageElement(""); setShowAssetPicker(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span> Add blank placeholder
              </button>
              <button
                onClick={() => setShowAssetPicker(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Asset grid */}
          <div className="flex-1 overflow-y-auto p-5">
            {allAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-3">image_not_supported</span>
                <p className="text-sm">No assets yet. Generate one with the AI panel →</p>
                <button
                  onClick={() => { setShowAssetPicker(false); setAiPanelOpen(true); }}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700"
                >
                  Open AI Panel
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {/* Show chapter illustration first if present */}
                {activeChapter?.illustrationUrl && (
                  <button
                    onClick={() => placeAssetOnCanvas({ url: activeChapter.illustrationUrl })}
                    className="group relative aspect-square rounded-xl overflow-hidden border-2 border-purple-400 hover:border-purple-300 transition-all"
                    title="Current page illustration"
                  >
                    <img src={activeChapter.illustrationUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 font-bold">This page</div>
                  </button>
                )}
                {allAssets.map((asset) => (
                  <button
                    key={asset.id || asset.url}
                    onClick={() => placeAssetOnCanvas(asset)}
                    className="group relative aspect-square rounded-xl overflow-hidden border-2 border-slate-600 hover:border-purple-400 transition-all"
                    title={asset.name || "Asset"}
                  >
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
                    </div>
                    {asset.pageNumber && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5">P.{asset.pageNumber}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ─── Canvas Element ──────────────────────────────────────────────────────────
function CanvasElement({ el, selected, onMouseDown, onResizeDown }) {
  return (
    <div
      onMouseDown={e => onMouseDown(e, el)}
      className={`absolute group ${selected ? "ring-2 ring-purple-400" : "hover:ring-1 hover:ring-purple-300/60"}`}
      style={{
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.w}%`,
        height: `${el.h}%`,
        zIndex: el.zIndex || 1,
        cursor: "move",
        userSelect: "none",
      }}
    >
      {el.type === "image" && (
        el.src ? (
          <img src={el.src} alt="" draggable={false} className="w-full h-full pointer-events-none"
            style={{ objectFit: el.objectFit || "cover", borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0 }} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 border-2 border-dashed border-slate-400 text-slate-400 pointer-events-none" style={{ borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0 }}>
            <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
            <p className="text-[10px] mt-1 font-medium">Generate image →</p>
          </div>
        )
      )}

      {el.type === "text" && (
        <div className="w-full h-full overflow-hidden flex items-center pointer-events-none"
          style={{ backgroundColor: el.backgroundColor || "transparent", padding: "6px 10px" }}>
          <p className="w-full"
            style={{
              fontSize: `${el.fontSize || 16}px`,
              fontFamily: el.fontFamily || "Georgia, serif",
              color: el.color || "#1a1a2e",
              textAlign: el.textAlign || "center",
              fontWeight: el.fontWeight || "normal",
              fontStyle: el.fontStyle || "normal",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}>
            {el.content}
          </p>
        </div>
      )}

      {selected && (
        <>
          <div onMouseDown={e => onResizeDown(e, el)}
            className="absolute bottom-0 right-0 size-4 bg-purple-500 rounded-tl cursor-se-resize flex items-center justify-center z-50">
            <span className="material-symbols-outlined text-white text-[10px]">open_in_full</span>
          </div>
          <div className="absolute -top-5 left-0 bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded-t font-bold uppercase pointer-events-none">
            {el.type}
          </div>
        </>
      )}
    </div>
  );
}
