import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useGemini } from "../contexts/GeminiContext";
import { getUserProjects, getAssets, getCharacters, deleteAsset } from "../lib/firestore";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  { key: "all", label: "All", icon: "grid_view" },
  { key: "illustration", label: "Illustrations", icon: "brush" },
  { key: "cover", label: "Covers", icon: "menu_book" },
  { key: "character", label: "Characters", icon: "person" },
];

const TYPE_COLORS = {
  cover: "bg-amber-500 text-white",
  character: "bg-purple-500 text-white",
  illustration: "bg-primary/80 text-white",
};

export default function AssetLibrary() {
  const { user } = useAuth();
  const { hasApiKey } = useGemini();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [assets, setAssets] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [characterFilter, setCharacterFilter] = useState("");

  // Load projects
  useEffect(() => {
    if (!user) return;
    getUserProjects(user.uid).then((p) => {
      setProjects(p);
      if (p.length > 0) setSelectedProject(p[0].id);
      setLoading(false);
    });
  }, [user]);

  // Load assets + characters when project changes
  useEffect(() => {
    if (!user || !selectedProject) { setAssets([]); setCharacters([]); return; }
    setLoading(true);
    setCharacterFilter(""); // reset character filter on project change
    Promise.all([
      getAssets(user.uid, selectedProject),
      getCharacters(user.uid, selectedProject),
    ]).then(([a, c]) => {
      setAssets(a);
      setCharacters(c);
      setLoading(false);
    });
  }, [user, selectedProject]);

  const handleDelete = async (assetId) => {
    if (!confirm("Delete this asset?")) return;
    await deleteAsset(user.uid, selectedProject, assetId);
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
  };

  // Apply filters
  const filtered = assets.filter((a) => {
    const matchesType = typeFilter === "all" || a.type === typeFilter;
    const matchesChar = !characterFilter || a.characterId === characterFilter;
    return matchesType && matchesChar;
  });

  // Characters that actually have assets (for the filter dropdown)
  const charactersWithAssets = characters.filter((c) =>
    assets.some((a) => a.characterId === c.id)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Asset Library</h2>
          <p className="text-slate-500 mt-1">All AI-generated illustrations, covers, and characters.</p>
        </div>
        <button
          onClick={() => navigate(`/illustration-studio${selectedProject ? `?project=${selectedProject}` : ""}`)}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined">add</span>
          Generate New
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Project */}
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="rounded-xl border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-primary focus:border-primary"
        >
          <option value="">Select project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>

        {/* Type filter */}
        <div className="flex gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setTypeFilter(c.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                typeFilter === c.key ? "bg-primary text-white" : "bg-white border border-slate-200 hover:bg-primary/5"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Character filter — only shown when there are tagged characters */}
        {charactersWithAssets.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="material-symbols-outlined text-sm text-slate-400">person</span>
            <select
              value={characterFilter}
              onChange={(e) => setCharacterFilter(e.target.value)}
              className="rounded-xl border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-primary focus:border-primary"
            >
              <option value="">All characters</option>
              {charactersWithAssets.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Results info */}
      <p className="text-xs text-slate-400 mb-4">
        {filtered.length} asset{filtered.length !== 1 ? "s" : ""}
        {typeFilter !== "all" ? ` · ${typeFilter}` : ""}
        {characterFilter ? ` · ${characters.find(c => c.id === characterFilter)?.name}` : ""}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">image</span>
          <p className="text-slate-500 font-medium mb-1">No assets found</p>
          <p className="text-sm text-slate-400">
            {typeFilter !== "all" || characterFilter
              ? "Try adjusting the filters above."
              : "Generate illustrations in the Illustration Studio."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((asset) => (
            <div key={asset.id} className="bg-white rounded-xl border border-primary/10 overflow-hidden group hover:shadow-lg transition-all">
              <div className="aspect-square bg-slate-100 relative">
                <img src={asset.url} alt={asset.name || ""} className="w-full h-full object-cover" />

                {/* Type badge */}
                <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${TYPE_COLORS[asset.type] || TYPE_COLORS.illustration}`}>
                  {asset.type}
                </span>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <a href={asset.url} target="_blank" rel="noreferrer" className="size-10 bg-white rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-lg">open_in_new</span>
                    </a>
                    <button onClick={() => handleDelete(asset.id)} className="size-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3">
                <p className="text-xs font-medium truncate">{asset.name || asset.prompt?.slice(0, 40) || "Untitled"}</p>
                <div className="flex items-center gap-1 mt-1">
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
  );
}
