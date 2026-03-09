import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGemini } from "../contexts/GeminiContext";
import { getProject, getChapters, getAssets, updateChapter } from "../lib/firestore";
import { generateImage, buildStylePrompt } from "../lib/gemini";
import { KDP_TRIM_SIZES } from "../lib/kdpFormats";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";
import { createAsset } from "../lib/firestore";

// ─── Layout Presets ──────────────────────────────────────────────────────────
const LAYOUT_PRESETS = [
  {
    id: "image-top", label: "Image Top", icon: "image",
    elements: (imgUrl, text) => [
      { id: "img-1", type: "image", x: 0, y: 0, w: 100, h: 58, src: imgUrl, objectFit: "cover", borderRadius: 0 },
      { id: "txt-1", type: "text", x: 5, y: 60, w: 90, h: 38, content: text, fontSize: 18, fontFamily: "Georgia, serif", color: "#1a1a2e", textAlign: "center", fontWeight: "normal", fontStyle: "normal", backgroundColor: "transparent" },
    ],
  },
  {
    id: "image-bottom", label: "Image Bottom", icon: "image",
    elements: (imgUrl, text) => [
      { id: "txt-1", type: "text", x: 5, y: 3, w: 90, h: 35, content: text, fontSize: 18, fontFamily: "Georgia, serif", color: "#1a1a2e", textAlign: "center", fontWeight: "normal", fontStyle: "normal", backgroundColor: "transparent" },
      { id: "img-1", type: "image", x: 0, y: 40, w: 100, h: 60, src: imgUrl, objectFit: "cover", borderRadius: 0 },
    ],
  },
  {
    id: "full-bleed", label: "Full Bleed", icon: "fullscreen",
    elements: (imgUrl, text) => [
      { id: "img-1", type: "image", x: 0, y: 0, w: 100, h: 100, src: imgUrl, objectFit: "cover", borderRadius: 0 },
      { id: "txt-1", type: "text", x: 5, y: 70, w: 90, h: 28, content: text, fontSize: 20, fontFamily: "Georgia, serif", color: "#ffffff", textAlign: "center", fontWeight: "bold", fontStyle: "normal", backgroundColor: "rgba(0,0,0,0.45)" },
    ],
  },
  {
    id: "split-left", label: "Split Left", icon: "view_column",
    elements: (imgUrl, text) => [
      { id: "img-1", type: "image", x: 0, y: 0, w: 48, h: 100, src: imgUrl, objectFit: "cover", borderRadius: 0 },
      { id: "txt-1", type: "text", x: 52, y: 15, w: 44, h: 70, content: text, fontSize: 17, fontFamily: "Georgia, serif", color: "#1a1a2e", textAlign: "left", fontWeight: "normal", fontStyle: "normal", backgroundColor: "transparent" },
    ],
  },
  {
    id: "split-right", label: "Split Right", icon: "view_column",
    elements: (imgUrl, text) => [
      { id: "txt-1", type: "text", x: 4, y: 15, w: 44, h: 70, content: text, fontSize: 17, fontFamily: "Georgia, serif", color: "#1a1a2e", textAlign: "left", fontWeight: "normal", fontStyle: "normal", backgroundColor: "transparent" },
      { id: "img-1", type: "image", x: 52, y: 0, w: 48, h: 100, src: imgUrl, objectFit: "cover", borderRadius: 0 },
    ],
  },
  {
    id: "text-only", label: "Text Only", icon: "text_fields",
    elements: (_imgUrl, text) => [
      { id: "txt-1", type: "text", x: 8, y: 15, w: 84, h: 70, content: text, fontSize: 22, fontFamily: "Georgia, serif", color: "#1a1a2e", textAlign: "center", fontWeight: "normal", fontStyle: "italic", backgroundColor: "transparent" },
    ],
  },
];

const FONTS = [
  "Georgia, serif", "Palatino, serif", "Times New Roman, serif",
  "Arial, sans-serif", "Gill Sans, sans-serif", "Verdana, sans-serif",
  "Comic Sans MS, cursive", "Trebuchet MS, sans-serif",
];

const DISPLAY_SCALE = 70;

function getCanvasDimensions(trimSizeId) {
  const size = KDP_TRIM_SIZES[trimSizeId] || KDP_TRIM_SIZES["8.5x8.5"];
  return { w: size.width * DISPLAY_SCALE, h: size.height * DISPLAY_SCALE, label: size.label };
}

function makeDefaultLayout(imgUrl, text) {
  return {
    backgroundColor: "#ffffff",
    elements: LAYOUT_PRESETS[0].elements(imgUrl, text),
  };
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function BookCanvas() {
  const { user } = useAuth();
  const { apiKey, hasApiKey } = useGemini();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project");

  const [project, setProject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(null);
  const [layout, setLayout] = useState(null); // { backgroundColor, elements: [] }
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const autoSaveTimer = useRef(null);
  const canvasRef = useRef(null);

  const canvasDims = getCanvasDimensions(project?.trimSize);

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
        if (asset.pageNumber) {
          assetByPage[asset.pageNumber] = asset.url;
        } else if (asset.name) {
          const m = asset.name.match(/Page\s+(\d+)/i);
          if (m && !assetByPage[Number(m[1])]) assetByPage[Number(m[1])] = asset.url;
        }
      }
    }
    const enriched = chs.sort((a, b) => a.number - b.number).map(ch => ({
      ...ch,
      illustrationUrl: ch.illustrationUrl || assetByPage[ch.number] || "",
    }));
    setChapters(enriched);
    if (enriched.length > 0) activatePage(enriched[0]);
    setLoading(false);
  }, [user, projectId]);

  useEffect(() => { loadData().catch(console.error); }, [loadData]);

  // ── Activate a page ────────────────────────────────────────────────────────
  function activatePage(ch) {
    setActiveChapter(ch);
    setSelectedId(null);
    if (ch.canvasLayout) {
      setLayout(ch.canvasLayout);
    } else {
      setLayout(makeDefaultLayout(ch.illustrationUrl || "", ch.content || ""));
    }
  }

  // ── Auto save ──────────────────────────────────────────────────────────────
  const saveLayout = useCallback(async (layoutToSave, chapter) => {
    if (!user || !chapter) return;
    setSaving(true);
    try {
      await updateChapter(user.uid, projectId, chapter.id, { canvasLayout: layoutToSave });
    } finally {
      setSaving(false);
    }
  }, [user, projectId]);

  function scheduleAutoSave(newLayout) {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveLayout(newLayout, activeChapter), 1500);
  }

  function updateLayout(newLayout) {
    setLayout(newLayout);
    scheduleAutoSave(newLayout);
  }

  // ── Element helpers ────────────────────────────────────────────────────────
  function updateElement(id, changes) {
    const newLayout = {
      ...layout,
      elements: layout.elements.map(el => el.id === id ? { ...el, ...changes } : el),
    };
    updateLayout(newLayout);
  }

  function applyPreset(preset) {
    const imgEl = layout?.elements?.find(e => e.type === "image");
    const txtEl = layout?.elements?.find(e => e.type === "text");
    const imgUrl = imgEl?.src || activeChapter?.illustrationUrl || "";
    const text = txtEl?.content || activeChapter?.content || "";
    const newLayout = {
      ...layout,
      elements: preset.elements(imgUrl, text),
    };
    updateLayout(newLayout);
    setSelectedId(null);
  }

  // ── Drag to move element ───────────────────────────────────────────────────
  const dragState = useRef(null);

  function onMouseDownElement(e, el) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(el.id);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    dragState.current = {
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
      canvasW: rect.width,
      canvasH: rect.height,
    };

    function onMove(me) {
      if (!dragState.current) return;
      const dx = ((me.clientX - dragState.current.startX) / dragState.current.canvasW) * 100;
      const dy = ((me.clientY - dragState.current.startY) / dragState.current.canvasH) * 100;
      const newX = Math.max(0, Math.min(95, dragState.current.origX + dx));
      const newY = Math.max(0, Math.min(95, dragState.current.origY + dy));
      setLayout(prev => ({
        ...prev,
        elements: prev.elements.map(e2 =>
          e2.id === dragState.current.id ? { ...e2, x: newX, y: newY } : e2
        ),
      }));
    }
    function onUp() {
      if (!dragState.current) return;
      const finalLayout = { ...layout };
      scheduleAutoSave(finalLayout);
      dragState.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // ── Resize handle ─────────────────────────────────────────────────────────
  function onMouseDownResize(e, el) {
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY, w: el.w, h: el.h, canvasW: rect.width, canvasH: rect.height };
    function onMove(me) {
      const dw = ((me.clientX - start.x) / start.canvasW) * 100;
      const dh = ((me.clientY - start.y) / start.canvasH) * 100;
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

  // ── Regenerate illustration ────────────────────────────────────────────────
  async function handleRegenerateImage() {
    if (!hasApiKey || !activeChapter) return;
    setGeneratingImage(true);
    try {
      const stylePrefix = project?.styleGuide ? buildStylePrompt(project.styleGuide) : "";
      const prompt = `${stylePrefix} ${activeChapter.sceneDescription || activeChapter.content}`.trim();
      const dataUrl = await generateImage(apiKey, prompt, {
        aspectRatio: "1:1",
      });
      // Upload to storage
      const filename = `page_${activeChapter.number}_regen_${Date.now()}.png`;
      const storageRef = ref(storage, `users/${user.uid}/projects/${projectId}/${filename}`);
      await uploadString(storageRef, dataUrl, "data_url");
      const downloadUrl = await getDownloadURL(storageRef);
      await createAsset(user.uid, projectId, {
        name: `Page ${activeChapter.number} Illustration`,
        type: "illustration",
        pageNumber: activeChapter.number,
        url: downloadUrl,
        storagePath: storageRef.fullPath,
        prompt,
        style: project?.styleGuide?.artStyle || "",
      });
      await updateChapter(user.uid, projectId, activeChapter.id, { illustrationUrl: downloadUrl });
      // Update image element in layout
      const newLayout = {
        ...layout,
        elements: layout.elements.map(el =>
          el.type === "image" ? { ...el, src: downloadUrl } : el
        ),
      };
      updateLayout(newLayout);
      setChapters(prev => prev.map(c => c.id === activeChapter.id ? { ...c, illustrationUrl: downloadUrl } : c));
      setActiveChapter(prev => ({ ...prev, illustrationUrl: downloadUrl }));
    } catch (e) {
      console.error("Image gen failed:", e);
    }
    setGeneratingImage(false);
  }

  const selectedEl = layout?.elements?.find(e => e.id === selectedId);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="text-center text-white">
        <div className="animate-spin size-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="font-bold text-lg">Loading Canvas...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-white">

      {/* ── LEFT: Page List ───────────────────────────────────────────────── */}
      <div className="w-52 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-3 border-b border-slate-700">
          <button
            onClick={() => navigate(`/book-preview?project=${projectId}`)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-2 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Preview
          </button>
          <h2 className="text-xs font-black text-white truncate">{project?.title}</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">{chapters.length} pages · {getCanvasDimensions(project?.trimSize).label}</p>
        </div>

        {/* Cover entry */}
        <div className="px-2 pt-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 px-1">Cover</p>
          <button
            onClick={() => navigate(`/book-preview?project=${projectId}`)}
            className="w-full rounded-lg overflow-hidden border-2 border-slate-600 hover:border-purple-400 transition-colors mb-3"
            style={{ aspectRatio: "1/1" }}
          >
            {project?.coverImageUrl ? (
              <img src={project.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-b from-purple-800 to-purple-900">
                <span className="material-symbols-outlined text-purple-300 text-2xl">auto_stories</span>
              </div>
            )}
          </button>
        </div>

        {/* Pages */}
        <div className="px-2 overflow-y-auto flex-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 px-1">Pages</p>
          <div className="space-y-1.5">
            {chapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => activatePage(ch)}
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
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5">
                      {ch.number}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-700 gap-1">
                    <span className="material-symbols-outlined text-slate-400 text-lg">image</span>
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
            onClick={() => navigate(`/story-studio?project=${projectId}`)}
            className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">edit_note</span>
            Text Editor
          </button>
        </div>
      </div>

      {/* ── CENTER: Canvas ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-3 shrink-0">
          <h3 className="text-sm font-bold text-slate-300 mr-2">
            {activeChapter ? `Page ${activeChapter.number}` : "Select a page"}
          </h3>

          {/* Layout presets */}
          <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
            {LAYOUT_PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                title={p.label}
                className="px-2 py-1 rounded-md text-[10px] font-bold text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Background color */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-[10px] text-slate-400 font-bold uppercase">BG</label>
            <input
              type="color"
              value={layout?.backgroundColor || "#ffffff"}
              onChange={e => updateLayout({ ...layout, backgroundColor: e.target.value })}
              className="size-7 rounded border border-slate-600 cursor-pointer bg-transparent"
            />
          </div>

          {/* Save indicator */}
          <div className="text-[10px] text-slate-500 flex items-center gap-1 min-w-[60px]">
            {saving ? (
              <><div className="size-2.5 border-2 border-purple-400/40 border-t-purple-400 rounded-full animate-spin" />Saving</>
            ) : (
              <><span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>Saved</>
            )}
          </div>

          <button
            onClick={() => navigate(`/book-preview?project=${projectId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">auto_stories</span>
            Preview
          </button>
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-8 bg-slate-900">
          {layout && activeChapter ? (
            <div
              ref={canvasRef}
              className="relative shadow-2xl select-none"
              style={{
                width: Math.min(canvasDims.w, 600),
                height: Math.min(canvasDims.h, 600 * (canvasDims.h / canvasDims.w)),
                backgroundColor: layout.backgroundColor || "#ffffff",
                cursor: "default",
              }}
              onMouseDown={() => setSelectedId(null)}
            >
              {layout.elements.map(el => (
                <CanvasElement
                  key={el.id}
                  el={el}
                  selected={selectedId === el.id}
                  onMouseDown={onMouseDownElement}
                  onResizeDown={onMouseDownResize}
                  onChange={changes => updateElement(el.id, changes)}
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
              onClick={() => {
                const i = chapters.findIndex(c => c.id === activeChapter.id);
                if (i > 0) activatePage(chapters[i - 1]);
              }}
              disabled={chapters.findIndex(c => c.id === activeChapter.id) === 0}
              className="text-slate-400 hover:text-white disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="text-xs text-slate-400">
              Page {activeChapter.number} of {chapters.length}
            </span>
            <button
              onClick={() => {
                const i = chapters.findIndex(c => c.id === activeChapter.id);
                if (i < chapters.length - 1) activatePage(chapters[i + 1]);
              }}
              disabled={chapters.findIndex(c => c.id === activeChapter.id) === chapters.length - 1}
              className="text-slate-400 hover:text-white disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT: Properties Panel ──────────────────────────────────────── */}
      <div className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            {selectedEl ? (selectedEl.type === "image" ? "🖼 Image Properties" : "✏️ Text Properties") : "Properties"}
          </h3>
        </div>

        {!selectedEl && (
          <div className="p-4 text-center text-slate-600">
            <span className="material-symbols-outlined text-3xl mb-2">touch_app</span>
            <p className="text-xs">Click an element on the canvas to edit its properties</p>
          </div>
        )}

        {/* Text properties */}
        {selectedEl?.type === "text" && (
          <div className="p-4 space-y-4">
            <div>
              <label className="prop-label">Text Content</label>
              <textarea
                value={selectedEl.content}
                onChange={e => updateElement(selectedEl.id, { content: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-xs text-white resize-none min-h-[80px] focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="prop-label">Font Family</label>
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
                <input
                  type="number"
                  min={8} max={72}
                  value={selectedEl.fontSize}
                  onChange={e => updateElement(selectedEl.id, { fontSize: Number(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="prop-label">Color</label>
                <input
                  type="color"
                  value={selectedEl.color?.replace(/rgba?\([^)]+\)/, "#000000") || "#1a1a2e"}
                  onChange={e => updateElement(selectedEl.id, { color: e.target.value })}
                  className="w-full h-9 bg-slate-700 border border-slate-600 rounded-lg p-1 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="prop-label">Alignment</label>
              <div className="flex gap-1">
                {["left", "center", "right"].map(align => (
                  <button
                    key={align}
                    onClick={() => updateElement(selectedEl.id, { textAlign: align })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      selectedEl.textAlign === align
                        ? "bg-purple-600 text-white"
                        : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">format_align_{align}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => updateElement(selectedEl.id, { fontWeight: selectedEl.fontWeight === "bold" ? "normal" : "bold" })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  selectedEl.fontWeight === "bold" ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                }`}
              >
                <strong>B</strong>
              </button>
              <button
                onClick={() => updateElement(selectedEl.id, { fontStyle: selectedEl.fontStyle === "italic" ? "normal" : "italic" })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  selectedEl.fontStyle === "italic" ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                }`}
              >
                <em>I</em>
              </button>
            </div>

            <div>
              <label className="prop-label">Background</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedEl.backgroundColor?.startsWith("rgba") ? "#000000" : (selectedEl.backgroundColor || "#ffffff")}
                  onChange={e => updateElement(selectedEl.id, { backgroundColor: e.target.value })}
                  className="h-8 w-10 bg-slate-700 border border-slate-600 rounded cursor-pointer p-0.5"
                />
                <button
                  onClick={() => updateElement(selectedEl.id, { backgroundColor: "transparent" })}
                  className="flex-1 text-xs bg-slate-700 border border-slate-600 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  None
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="prop-label">Width %</label>
                <input type="number" min={10} max={100} value={Math.round(selectedEl.w)}
                  onChange={e => updateElement(selectedEl.id, { w: Number(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-xs text-white focus:border-purple-400 focus:outline-none" />
              </div>
              <div>
                <label className="prop-label">Height %</label>
                <input type="number" min={8} max={100} value={Math.round(selectedEl.h)}
                  onChange={e => updateElement(selectedEl.id, { h: Number(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-xs text-white focus:border-purple-400 focus:outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* Image properties */}
        {selectedEl?.type === "image" && (
          <div className="p-4 space-y-4">
            {selectedEl.src && (
              <img src={selectedEl.src} alt="" className="w-full rounded-lg object-cover aspect-square border border-slate-600" />
            )}

            <button
              onClick={handleRegenerateImage}
              disabled={generatingImage || !hasApiKey}
              className="w-full py-2.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {generatingImage ? (
                <><div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</>
              ) : (
                <><span className="material-symbols-outlined text-sm">refresh</span>Regenerate Image</>
              )}
            </button>

            <div>
              <label className="prop-label">Fit</label>
              <div className="flex gap-1">
                {["cover", "contain", "fill"].map(fit => (
                  <button
                    key={fit}
                    onClick={() => updateElement(selectedEl.id, { objectFit: fit })}
                    className={`flex-1 py-1 rounded text-[10px] font-bold capitalize transition-colors ${
                      selectedEl.objectFit === fit
                        ? "bg-purple-600 text-white"
                        : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                    }`}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="prop-label">Border Radius</label>
              <input
                type="range" min={0} max={50}
                value={selectedEl.borderRadius || 0}
                onChange={e => updateElement(selectedEl.id, { borderRadius: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">{selectedEl.borderRadius || 0}px</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="prop-label">Width %</label>
                <input type="number" min={10} max={100} value={Math.round(selectedEl.w)}
                  onChange={e => updateElement(selectedEl.id, { w: Number(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-xs text-white focus:border-purple-400 focus:outline-none" />
              </div>
              <div>
                <label className="prop-label">Height %</label>
                <input type="number" min={8} max={100} value={Math.round(selectedEl.h)}
                  onChange={e => updateElement(selectedEl.id, { h: Number(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-xs text-white focus:border-purple-400 focus:outline-none" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Canvas Element ──────────────────────────────────────────────────────────
function CanvasElement({ el, selected, onMouseDown, onResizeDown }) {
  return (
    <div
      onMouseDown={e => onMouseDown(e, el)}
      className={`absolute group ${selected ? "ring-2 ring-purple-400 ring-offset-0" : "hover:ring-1 hover:ring-purple-300"}`}
      style={{
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.w}%`,
        height: `${el.h}%`,
        cursor: "move",
        userSelect: "none",
      }}
    >
      {el.type === "image" && (
        <img
          src={el.src}
          alt=""
          draggable={false}
          className="w-full h-full pointer-events-none"
          style={{
            objectFit: el.objectFit || "cover",
            borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
          }}
        />
      )}

      {el.type === "text" && (
        <div
          className="w-full h-full overflow-hidden flex items-center"
          style={{
            backgroundColor: el.backgroundColor || "transparent",
            padding: "8px 12px",
          }}
        >
          <p
            className="w-full"
            style={{
              fontSize: `${el.fontSize || 16}px`,
              fontFamily: el.fontFamily || "Georgia, serif",
              color: el.color || "#1a1a2e",
              textAlign: el.textAlign || "center",
              fontWeight: el.fontWeight || "normal",
              fontStyle: el.fontStyle || "normal",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {el.content}
          </p>
        </div>
      )}

      {/* Selection handles */}
      {selected && (
        <>
          {/* Resize handle — bottom right */}
          <div
            onMouseDown={e => onResizeDown(e, el)}
            className="absolute bottom-0 right-0 size-4 bg-purple-500 rounded-tl-md cursor-se-resize flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-white text-[10px]">open_in_full</span>
          </div>
          {/* Element type label */}
          <div className="absolute -top-5 left-0 bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded-t font-bold uppercase tracking-wide">
            {el.type}
          </div>
        </>
      )}
    </div>
  );
}
