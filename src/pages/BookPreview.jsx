import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getProject, getChapters, getAssets } from "../lib/firestore";
import { KDP_TRIM_SIZES } from "../lib/kdpFormats";

// KDP size → display dimensions (scaled to fit screen nicely)
const DISPLAY_SCALE = 72; // px per inch

function getPageDimensions(trimSizeId) {
  const size = KDP_TRIM_SIZES[trimSizeId] || KDP_TRIM_SIZES["8.5x8.5"];
  const w = Math.round(size.width * DISPLAY_SCALE);
  const h = Math.round(size.height * DISPLAY_SCALE);
  const aspect = size.width / size.height;
  return { w, h, aspect, label: size.label };
}

const VIEW_MODES = [
  { id: "flipbook", label: "Flipbook", icon: "auto_stories" },
  { id: "spread", label: "Spread View", icon: "chrome_reader_mode" },
  { id: "grid", label: "All Pages", icon: "grid_view" },
];

export default function BookPreview() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project");

  const [project, setProject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(-1); // -1 = cover
  const [viewMode, setViewMode] = useState("flipbook");
  const [flipping, setFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState("next");

  const loadData = useCallback(async () => {
    if (!user || !projectId) return;
    setLoading(true);
    const [p, chs, assets] = await Promise.all([
      getProject(user.uid, projectId),
      getChapters(user.uid, projectId),
      getAssets(user.uid, projectId),
    ]);
    setProject(p);

    // Build a page-number → illustrationUrl map from assets (fallback for older books)
    const assetByPage = {};
    for (const asset of assets) {
      if (asset.type === 'illustration' && asset.url) {
        if (asset.pageNumber) {
          assetByPage[asset.pageNumber] = asset.url;
        } else if (asset.name) {
          const match = asset.name.match(/Page\s+(\d+)/i);
          if (match) {
            const num = Number(match[1]);
            if (!assetByPage[num]) assetByPage[num] = asset.url;
          }
        }
      }
    }

    // Merge illustrationUrl onto chapters
    const enriched = chs
      .sort((a, b) => a.number - b.number)
      .map(ch => ({
        ...ch,
        illustrationUrl: ch.illustrationUrl || assetByPage[ch.number] || '',
      }));

    setChapters(enriched);
    setLoading(false);
  }, [user, projectId]);

  useEffect(() => { 
    loadData().catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, user]);

  const totalPages = chapters.length; // -1 = cover, 0..N-1 = pages
  const dims = getPageDimensions(project?.trimSize);
  const isSquare = dims.aspect >= 0.95 && dims.aspect <= 1.05;

  const goTo = (dir) => {
    setFlipDir(dir);
    setFlipping(true);
    setTimeout(() => {
      if (dir === "next" && currentPage < totalPages - 1) setCurrentPage(p => p + 1);
      if (dir === "prev" && currentPage > -1) setCurrentPage(p => p - 1);
      setFlipping(false);
    }, 200);
  };

  const currentChapter = currentPage >= 0 ? chapters[currentPage] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center text-white">
          <div className="animate-spin size-12 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg font-bold">Loading your book...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Project not found.</p>
        <button onClick={() => navigate("/")} className="mt-4 text-primary underline">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate(`/story-outline?project=${projectId}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back
        </button>
        <div className="flex-1">
          <h1 className="text-white font-black text-lg">{project.title}</h1>
          <p className="text-slate-400 text-xs">{dims.label} · {totalPages} pages · {project.interiorType || "Premium Color"}</p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
          {VIEW_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === mode.id
                  ? "bg-purple-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{mode.icon}</span>
              {mode.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/book-canvas?project=${projectId}`)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-bold hover:bg-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">palette</span>
            Edit Layout
          </button>
          <button
            onClick={() => navigate(`/story-studio?project=${projectId}`)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">brush</span>
            Edit in Studio
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-bold hover:bg-slate-600 transition-colors">
            <span className="material-symbols-outlined text-sm">download</span>
            Export PDF
          </button>
        </div>
      </div>

      {/* ─── FLIPBOOK VIEW ─── */}
      {viewMode === "flipbook" && (
        <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
          {/* Page indicator */}
          <div className="mb-6 flex items-center gap-3">
            <span className="text-slate-400 text-sm">
              {currentPage === -1 ? "Cover" : `Page ${currentPage + 1} of ${totalPages}`}
            </span>
            <div className="flex gap-1">
              {[-1, ...Array(totalPages).keys()].map((i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`size-2 rounded-full transition-all ${
                    i === currentPage ? "bg-purple-400 scale-125" : "bg-slate-600 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Book page */}
          <div className="relative flex items-center gap-8">
            {/* Prev button */}
            <button
              onClick={() => goTo("prev")}
              disabled={currentPage === -1}
              className="size-12 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 disabled:opacity-20 transition-all hover:scale-110"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            {/* The page itself */}
            <div
              className={`relative bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-200 ${
                flipping
                  ? flipDir === "next"
                    ? "scale-x-0 opacity-0"
                    : "scale-x-0 opacity-0"
                  : "scale-x-100 opacity-100"
              }`}
              style={{
                width: `${dims.w}px`,
                height: `${dims.h}px`,
                maxWidth: "min(90vw, 650px)",
                maxHeight: "calc(100vh - 280px)",
                aspectRatio: `${dims.w} / ${dims.h}`,
              }}
            >
              {/* Cover page */}
              {currentPage === -1 && (
                <div className="absolute inset-0 flex flex-col">
                  {project.coverImageUrl ? (
                    <div className="relative flex-1">
                      <img
                        src={project.coverImageUrl}
                        alt="Book Cover"
                        className="w-full h-full object-cover"
                      />
                      {/* Title overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-6">
                        <h2 className="text-white font-black text-2xl leading-tight drop-shadow-lg">{project.title}</h2>
                        {project.targetAge && (
                          <p className="text-white/80 text-sm mt-1">Ages {project.targetAge}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex-1 flex flex-col items-center justify-center text-white p-8"
                      style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)" }}
                    >
                      <span className="material-symbols-outlined text-6xl mb-4 opacity-60">auto_stories</span>
                      <h2 className="font-black text-2xl text-center leading-tight">{project.title}</h2>
                      {project.targetAge && (
                        <p className="text-white/70 text-sm mt-3">Ages {project.targetAge}</p>
                      )}
                      <p className="text-white/50 text-xs mt-6">{dims.label}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Content page */}
              {currentPage >= 0 && currentChapter && (
                <ContentPage
                  chapter={currentChapter}
                  pageNumber={currentPage + 1}
                  isSquare={isSquare}
                />
              )}

              {/* Page number stamp */}
              {currentPage >= 0 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <span className="text-slate-300 text-xs font-medium">{currentPage + 1}</span>
                </div>
              )}
            </div>

            {/* Next button */}
            <button
              onClick={() => goTo("next")}
              disabled={currentPage >= totalPages - 1}
              className="size-12 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 disabled:opacity-20 transition-all hover:scale-110"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-slate-600 text-xs mt-6">Use arrow keys or click arrows to navigate</p>
        </div>
      )}

      {/* ─── SPREAD VIEW ─── */}
      {viewMode === "spread" && (
        <SpreadView
          project={project}
          chapters={chapters}
          dims={dims}
          isSquare={isSquare}
          navigate={navigate}
          projectId={projectId}
        />
      )}

      {/* ─── GRID VIEW ─── */}
      {viewMode === "grid" && (
        <GridView
          project={project}
          chapters={chapters}
          dims={dims}
          onPageClick={(i) => {
            setCurrentPage(i);
            setViewMode("flipbook");
          }}
        />
      )}
    </div>
  );
}

// ── Content Page Component ──────────────────────────────────────
function ContentPage({ chapter, pageNumber, isSquare }) {
  // If chapter has a saved canvasLayout, render it
  if (chapter.canvasLayout) {
    const { backgroundColor, elements } = chapter.canvasLayout;
    return (
      <div
        className="absolute inset-0"
        style={{ backgroundColor: backgroundColor || "#ffffff" }}
      >
        {elements.map(el => (
          <div
            key={el.id}
            className="absolute overflow-hidden"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.w}%`,
              height: `${el.h}%`,
            }}
          >
            {el.type === "image" && el.src && (
              <img
                src={el.src}
                alt={`Page ${pageNumber}`}
                className="w-full h-full"
                style={{
                  objectFit: el.objectFit || "cover",
                  borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
                }}
              />
            )}
            {el.type === "text" && (
              <div
                className="w-full h-full flex items-center overflow-hidden"
                style={{
                  backgroundColor: el.backgroundColor || "transparent",
                  padding: "6px 10px",
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
          </div>
        ))}
      </div>
    );
  }

  // Fallback: default image-top / text-bottom layout
  const hasImage = !!chapter.illustrationUrl;
  const hasText = !!chapter.content;

  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {hasImage ? (
        <>
          <div className={`relative ${isSquare ? "h-[58%]" : "h-[55%]"} shrink-0`}>
            <img
              src={chapter.illustrationUrl}
              alt={`Page ${pageNumber} illustration`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 flex items-center justify-center px-6 py-4 bg-white">
            <p className="text-center text-slate-800 leading-relaxed font-medium"
               style={{ fontSize: "clamp(12px, 2.2cqi, 16px)" }}>
              {chapter.content}
            </p>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="h-[55%] bg-linear-to-b from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-400 border-b border-slate-200">
            <span className="material-symbols-outlined text-4xl mb-2">image</span>
            <p className="text-xs font-medium">Illustration</p>
            {chapter.sceneDescription && (
              <p className="text-[10px] text-slate-300 mt-2 px-6 text-center line-clamp-3">
                {chapter.sceneDescription}
              </p>
            )}
          </div>
          {hasText && (
            <div className="flex-1 flex items-center justify-center px-6 py-4">
              <p className="text-center text-slate-700 leading-relaxed font-medium"
                 style={{ fontSize: "clamp(11px, 2cqi, 15px)" }}>
                {chapter.content}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Spread View ─────────────────────────────────────────────────
function SpreadView({ project, chapters, dims, isSquare }) {
  const [spreadIndex, setSpreadIndex] = useState(0); // 0 = cover + page 1, 1 = page 2+3, etc.
  const spreads = [];
  // Cover alone
  spreads.push({ left: null, right: chapters[0] || null, type: "cover-spread" });
  // Pages in pairs
  for (let i = 1; i < chapters.length; i += 2) {
    spreads.push({ left: chapters[i], right: chapters[i + 1] || null });
  }

  const spread = spreads[spreadIndex];

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 gap-6">
      <div className="flex items-center gap-6">
        <button
          onClick={() => setSpreadIndex(i => Math.max(0, i - 1))}
          disabled={spreadIndex === 0}
          className="size-12 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 disabled:opacity-20"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        {/* Two-page spread */}
        <div className="flex shadow-2xl rounded-lg overflow-hidden" style={{ height: "min(70vh, 500px)" }}>
          {/* Left page */}
          <div className="bg-white border-r border-slate-200 flex-1" style={{ aspectRatio: `${dims.w}/${dims.h}`, height: "100%" }}>
            {spread.type === "cover-spread" && project.coverImageUrl ? (
              <img src={project.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : spread.type === "cover-spread" ? (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4f46e5, #a855f7)" }}>
                <h2 className="text-white font-black text-lg text-center p-4">{project.title}</h2>
              </div>
            ) : spread.left ? (
              <ContentPage chapter={spread.left} pageNumber={spread.left.number} isSquare={isSquare} />
            ) : (
              <div className="w-full h-full bg-slate-50" />
            )}
          </div>
          {/* Right page */}
          <div className="bg-white flex-1 relative" style={{ aspectRatio: `${dims.w}/${dims.h}`, height: "100%" }}>
            {spread.right ? (
              <ContentPage chapter={spread.right} pageNumber={spread.right.number} isSquare={isSquare} />
            ) : (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                <span className="material-symbols-outlined text-4xl">auto_stories</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setSpreadIndex(i => Math.min(spreads.length - 1, i + 1))}
          disabled={spreadIndex >= spreads.length - 1}
          className="size-12 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 disabled:opacity-20"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <p className="text-slate-500 text-sm">
        Spread {spreadIndex + 1} of {spreads.length}
      </p>
    </div>
  );
}

// ── Grid View ───────────────────────────────────────────────────
function GridView({ project, chapters, onPageClick }) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-white font-black text-xl mb-6">All Pages — {chapters.length} total</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {/* Cover thumbnail */}
          <button
            onClick={() => onPageClick(-1)}
            className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-400 transition-all"
          >
            {project.coverImageUrl ? (
              <img src={project.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4f46e5, #a855f7)" }}>
                <span className="text-white font-black text-xs text-center p-2 leading-tight">{project.title}</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-bold text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Cover
            </div>
          </button>

          {/* Page thumbnails */}
          {chapters.map((ch, i) => (
            <button
              key={ch.id}
              onClick={() => onPageClick(i)}
              className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-400 transition-all bg-white"
            >
              {ch.illustrationUrl ? (
                <img src={ch.illustrationUrl} alt={`Page ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 p-2">
                  <span className="material-symbols-outlined text-slate-300 text-2xl mb-1">image</span>
                  <p className="text-slate-400 text-[9px] text-center line-clamp-3">{ch.content?.slice(0, 60)}</p>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-bold text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Page {i + 1}
              </div>
              {!ch.illustrationUrl && (
                <div className="absolute top-1 right-1 size-4 bg-amber-400 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[10px] text-white">priority_high</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="size-3 bg-amber-400 rounded-full" />
            <span>Missing illustration</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 border-2 border-purple-400 rounded-sm" />
            <span>Click to jump to page</span>
          </div>
        </div>
      </div>
    </div>
  );
}
