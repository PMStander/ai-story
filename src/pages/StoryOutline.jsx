import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGemini } from "../contexts/GeminiContext";
import { getProject, updateProject, getChapters, createChapter, deleteChapter } from "../lib/firestore";
import { generateOutline } from "../lib/gemini";
import { KDP_TRIM_SIZES, BOOK_TYPES } from "../lib/kdpFormats";
import { getCategoryConfig, getPageTerminology } from "../lib/bookGenres";
import StyleGuide from "../components/StyleGuide";

export default function StoryOutline() {
  const { user } = useAuth();
  const { apiKey, hasApiKey } = useGemini();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project");

  const [project, setProject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genre, setGenre] = useState("");
  const [targetAge, setTargetAge] = useState("3-6");
  const [styleGuide, setStyleGuide] = useState({});
  const [showStyleGuide, setShowStyleGuide] = useState(false);

  // Derived from project
  const [bookCategory, setBookCategory] = useState('children');
  const catConfig = getCategoryConfig(bookCategory);
  const terminology = getPageTerminology(bookCategory);

  const loadProject = useCallback(async () => {
    if (!user || !projectId) return;
    setLoading(true);
    const p = await getProject(user.uid, projectId);
    if (p) {
      setProject(p);
      setTitle(p.title || "");
      setSynopsis(p.synopsis || "");
      setGenre(p.genre || "");
      setTargetAge(p.targetAge || "3-6");
      setStyleGuide(p.styleGuide || {});
      setBookCategory(p.bookCategory || 'children');
    }
    const ch = await getChapters(user.uid, projectId);
    setChapters(ch);
    setLoading(false);
  }, [user, projectId]);

  useEffect(() => { loadProject(); }, [loadProject]);

  const handleSaveProject = async () => {
    if (!user || !projectId) return;
    setSaving(true);
    await updateProject(user.uid, projectId, { title, synopsis, genre, targetAge, styleGuide });
    setSaving(false);
  };

  const handleGenerateOutline = async () => {
    if (!hasApiKey) { setError("Set your Gemini API key in Settings first."); return; }
    setGenerating(true);
    setError("");
    try {
      const outline = await generateOutline(apiKey, { topic: title, genre, targetAge, bookCategory });
      // Create chapters/pages from the outline
      for (const page of outline) {
        await createChapter(user.uid, projectId, {
          title: `${terminology.page} ${page.pageNumber}`,
          number: page.pageNumber,
          content: page.text,
          sceneDescription: page.sceneDescription,
        });
      }
      // Update synopsis from first few pages
      const synopsisText = outline.slice(0, 3).map((p) => p.text).join(" ");
      await updateProject(user.uid, projectId, { synopsis: synopsisText, status: "outline", progress: 15 });
      await loadProject();
    } catch (err) {
      setError(err.message || "Outline generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddChapter = async () => {
    if (!user || !projectId) return;
    const nextNumber = chapters.length + 1;
    await createChapter(user.uid, projectId, { title: `Page ${nextNumber}`, number: nextNumber });
    await loadProject();
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!user || !projectId) return;
    await deleteChapter(user.uid, projectId, chapterId);
    await loadProject();
  };

  if (!projectId) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center py-20">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">description</span>
        <h2 className="text-2xl font-black mb-2">No Project Selected</h2>
        <p className="text-slate-500 mb-6">Select a project from the dashboard or create a new one.</p>
        <button onClick={() => navigate("/")} className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90">
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const totalWords = chapters.reduce((sum, ch) => sum + (ch.content?.split(/\s+/).filter(Boolean).length || 0), 0);
  const doneChapters = chapters.filter((ch) => ch.status === "complete" || (ch.content && ch.content.length > 50)).length;
  const progressPct = chapters.length > 0 ? Math.round((doneChapters / chapters.length) * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            Story {terminology.outline}
            {catConfig && (
              <span className="text-sm font-bold px-3 py-1 bg-primary/10 text-primary rounded-full">
                {catConfig.emoji} {catConfig.label}
              </span>
            )}
          </h2>
          <p className="text-slate-500 mt-1">AI-powered story structuring and {terminology.outline.toLowerCase()} planning.</p>
        </div>
        <button
          onClick={handleGenerateOutline}
          disabled={generating || !hasApiKey}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {generating ? (
            <>
              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">auto_awesome</span>
              AI Generate Outline
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <span className="material-symbols-outlined text-red-500">error</span>
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => setError("")} className="ml-auto text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Story Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-primary/10 p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">book</span>
            Story Overview
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Synopsis</label>
              <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary min-h-[120px] resize-none" placeholder="Describe your book's story..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Genre</label>
                <input value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Target Age</label>
                <input value={targetAge} onChange={(e) => setTargetAge(e.target.value)} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary" />
              </div>
            </div>
            <button onClick={handleSaveProject} disabled={saving} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-primary/10 p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            Progress
          </h3>
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-5xl font-black text-primary">{progressPct}%</p>
              <p className="text-sm text-slate-500 mt-1">Overall Complete</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Words</span>
                <span className="font-bold">{totalWords.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Target Words</span>
                <span className="font-bold">{(project?.targetWordCount || 2000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Pages Done</span>
                <span className="font-bold">{doneChapters} / {chapters.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KDP Format & Style Guide */}
      {project && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* KDP Format Info */}
          {project.trimSize && (
            <div className="bg-white rounded-xl border border-primary/10 p-6">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_stories</span>
                KDP Format
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-400">Trim Size</p>
                  <p className="text-sm font-bold">{KDP_TRIM_SIZES[project.trimSize]?.label || project.trimSize}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Book Type</p>
                  <p className="text-sm font-bold">{BOOK_TYPES[project.bookType]?.label || project.bookType || 'Picture Book'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Pages</p>
                  <p className="text-sm font-bold">{project.pageCount || chapters.length || '32'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Interior</p>
                  <p className="text-sm font-bold capitalize">{(project.interiorType || 'premium-color').replace('-', ' ')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Style Guide */}
          <div className="bg-white rounded-xl border border-primary/10 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">palette</span>
                Style Guide
              </h3>
              <button onClick={() => setShowStyleGuide(!showStyleGuide)} className="text-primary text-xs font-bold hover:underline">
                {showStyleGuide ? 'Close' : (styleGuide?.artStyle ? 'Edit' : 'Set Up')}
              </button>
            </div>
            {showStyleGuide ? (
              <StyleGuide styleGuide={styleGuide} onChange={setStyleGuide} compact={true} />
            ) : styleGuide?.artStyle ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {styleGuide.artStyle && <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">🎨 {styleGuide.artStyle.slice(0, 35)}...</span>}
                  {styleGuide.colorPalette && <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{styleGuide.colorPalette}</span>}
                </div>
                {(styleGuide.characters || []).map((c, i) => (
                  <p key={i} className="text-xs text-slate-600"><strong>{c.name}:</strong> {c.visualDescription?.slice(0, 50)}...</p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No style guide. Set one for consistent illustrations.</p>
            )}
          </div>
        </div>
      )}

      {/* Chapters */}
      <div className="bg-white rounded-xl border border-primary/10 overflow-hidden">
        <div className="p-6 border-b border-primary/5 flex items-center justify-between">
          <h3 className="font-bold">{terminology.outline} ({chapters.length} {terminology.plural.toLowerCase()})</h3>
          <button onClick={handleAddChapter} className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
            <span className="material-symbols-outlined text-sm">add</span>
            Add {terminology.page}
          </button>
        </div>
        {chapters.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">description</span>
            <p className="text-slate-500 mb-2">No pages yet.</p>
            <p className="text-sm text-slate-400">Click "AI Generate Outline" to create your book structure, or add pages manually.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {chapters.map((ch) => (
              <div key={ch.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {ch.number}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm">{ch.title}</p>
                    {ch.content && <p className="text-xs text-slate-500 truncate">{ch.content.slice(0, 100)}...</p>}
                    {ch.sceneDescription && <p className="text-[11px] text-primary/60 mt-0.5 truncate">🎨 {ch.sceneDescription.slice(0, 80)}...</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                    ch.content && ch.content.length > 50 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {ch.content && ch.content.length > 50 ? "Written" : "Planned"}
                  </span>
                  <button
                    onClick={() => navigate(`/story-studio?project=${projectId}&chapter=${ch.id}`)}
                    className="text-primary text-xs font-bold hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteChapter(ch.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
