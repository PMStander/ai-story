import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useGemini } from "../contexts/GeminiContext";
import { onProjectsSnapshot, createProject, deleteProject } from "../lib/firestore";
import { useNavigate } from "react-router-dom";
import { KDP_TRIM_SIZES, BOOK_TYPES } from "../lib/kdpFormats";

export default function Dashboard() {
  const { user } = useAuth();
  const { hasApiKey } = useGemini();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newGenre, setNewGenre] = useState("Children's Fiction");
  const [newBookType, setNewBookType] = useState("picture-book");
  const [newTrimSize, setNewTrimSize] = useState("8.5x8.5");
  const [newTargetAge, setNewTargetAge] = useState("3-6");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onProjectsSnapshot(user.uid, (data) => {
      setProjects(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const handleCreateProject = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const selectedType = BOOK_TYPES[newBookType];
    const id = await createProject(user.uid, {
      title: newTitle.trim(),
      genre: newGenre,
      targetAge: newTargetAge,
      bookType: newBookType,
      trimSize: newTrimSize,
      interiorType: selectedType?.interiorType || "premium-color",
      pageCount: selectedType?.recommendedPages?.[Math.floor(selectedType.recommendedPages.length / 2)] || 32,
    });
    setCreating(false);
    setShowNewProject(false);
    setNewTitle("");
    navigate(`/story-outline?project=${id}`);
  };

  const handleDeleteProject = async (projectId) => {
    if (confirm("Delete this project? This cannot be undone.")) {
      await deleteProject(user.uid, projectId);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-slate-100 text-slate-600",
      outline: "bg-blue-100 text-blue-700",
      writing: "bg-amber-100 text-amber-700",
      illustrating: "bg-purple-100 text-purple-700",
      review: "bg-cyan-100 text-cyan-700",
      published: "bg-green-100 text-green-700",
    };
    return colors[status] || colors.draft;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - d;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* API Key Warning */}
      {!hasApiKey && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
          <span className="material-symbols-outlined text-amber-500">warning</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Gemini API key not configured</p>
            <p className="text-xs text-amber-600">AI features (writing, illustrations, research) need your API key to work.</p>
          </div>
          <button onClick={() => navigate("/settings")} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600">
            Set Up
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Active Projects</h2>
          <p className="text-slate-500 mt-1">
            {projects.length === 0 ? "Start your first book project." : `You have ${projects.length} book${projects.length !== 1 ? "s" : ""} in development.`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/book-wizard")}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20 hover:bg-primary/90"
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            ✨ AI Create Book
          </button>
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-primary/20 text-primary rounded-xl hover:bg-primary/5 font-bold text-sm transition-all"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Manual Project
          </button>
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_stories</span>
              New Book Project
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Book Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  placeholder="e.g., Timmy's Potty Adventure"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Genre</label>
                <select
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  {["Children's Fiction", "Educational", "Bedtime Stories", "Activity Book", "Non-Fiction", "Potty Training", "Social Skills", "Feelings & Emotions"].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Book Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Book Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(BOOK_TYPES).slice(0, 4).map(([id, type]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setNewBookType(id);
                        setNewTrimSize(type.recommendedSizes[0]);
                      }}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                        newBookType === id ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`material-symbols-outlined text-sm ${newBookType === id ? "text-primary" : "text-slate-400"}`}>{type.icon}</span>
                        <span className="text-xs font-bold">{type.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trim Size & Age */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">KDP Trim Size</label>
                  <select
                    value={newTrimSize}
                    onChange={(e) => setNewTrimSize(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  >
                    {(BOOK_TYPES[newBookType]?.recommendedSizes || Object.keys(KDP_TRIM_SIZES)).map((sizeId) => {
                      const size = KDP_TRIM_SIZES[sizeId];
                      return size ? <option key={sizeId} value={sizeId}>{size.label}</option> : null;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Target Age</label>
                  <select
                    value={newTargetAge}
                    onChange={(e) => setNewTargetAge(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  >
                    <option value="0-2">0–2 (Board Book)</option>
                    <option value="3-6">3–6 (Picture Book)</option>
                    <option value="5-8">5–8 (Early Reader)</option>
                    <option value="7-12">7–12 (Chapter Book)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowNewProject(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
              <button
                onClick={handleCreateProject}
                disabled={creating || !newTitle.trim()}
                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-lg">rocket_launch</span>}
                {creating ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="size-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      )}

      {/* Project Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer"
              onClick={() => navigate(`/story-outline?project=${project.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{project.genre}</p>
              <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{project.title}</h3>
              {project.synopsis && (
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{project.synopsis}</p>
              )}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Target: ages {project.targetAge}</span>
                <span>{formatDate(project.updatedAt)}</span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">{project.progress}% Complete</span>
                </div>
                <div className="w-full h-1.5 bg-primary/10 rounded-full">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
            </div>
          ))}

          {/* New Project Card */}
          <div
            onClick={() => setShowNewProject(true)}
            className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-xl flex flex-col items-center justify-center gap-3 min-h-[200px] hover:bg-primary/10 transition-all cursor-pointer group"
          >
            <div className="size-14 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">add</span>
            </div>
            <p className="text-base font-bold text-primary">Start New Project</p>
            <p className="text-xs text-slate-400">AI-assisted book creation</p>
          </div>
        </div>
      )}

      {/* Quick Insights - only show when there are projects */}
      {!loading && projects.length > 0 && (
        <section>
          <h3 className="text-xl font-bold mb-4">Quick Insights</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Books", value: projects.length, icon: "menu_book" },
              { label: "In Progress", value: projects.filter((p) => p.status !== "published").length, icon: "edit_note" },
              { label: "Published", value: projects.filter((p) => p.status === "published").length, icon: "check_circle" },
              { label: "Total Words", value: "—", icon: "text_fields" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-5 border border-primary/5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-lg">{s.icon}</span>
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
                <p className="text-2xl font-black">{s.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
