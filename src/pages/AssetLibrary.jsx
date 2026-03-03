export default function AssetLibrary() {
  const assets = [
    { name: "Elara Portrait", type: "Character", format: "PNG", size: "2.4 MB", date: "Oct 2" },
    { name: "Obsidian Peaks", type: "Background", format: "PNG", size: "3.1 MB", date: "Oct 1" },
    { name: "Magic Forest", type: "Scene", format: "PNG", size: "2.8 MB", date: "Sep 28" },
    { name: "Book Cover v3", type: "Cover", format: "PNG", size: "4.2 MB", date: "Sep 25" },
    { name: "Kael Character Sheet", type: "Character", format: "PNG", size: "1.9 MB", date: "Sep 22" },
    { name: "Castle Interior", type: "Background", format: "PNG", size: "3.5 MB", date: "Sep 20" },
  ];

  const categories = ["All", "Characters", "Backgrounds", "Scenes", "Covers", "Icons"];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Asset Library</h2>
          <p className="text-slate-500 mt-1">Manage all your generated images, covers, and illustrations.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">upload</span>
          Upload Asset
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {categories.map((cat) => (
          <button key={cat} className={`px-4 py-2 rounded-xl text-sm font-medium ${cat === "All" ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-primary/50 hover:text-primary"} transition-colors`}>
            {cat}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex gap-2">
          <button className="p-2 rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined">grid_view</span>
          </button>
          <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary">
            <span className="material-symbols-outlined">view_list</span>
          </button>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {assets.map((asset) => (
          <div key={asset.name} className="bg-white rounded-xl border border-primary/10 overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer">
            <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative">
              <span className="material-symbols-outlined text-6xl text-primary/30">image</span>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button className="p-1.5 bg-white/90 backdrop-blur rounded-lg text-slate-500 hover:text-primary shadow-sm">
                  <span className="material-symbols-outlined text-sm">download</span>
                </button>
                <button className="p-1.5 bg-white/90 backdrop-blur rounded-lg text-slate-500 hover:text-red-500 shadow-sm">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
              <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-white/90 backdrop-blur px-2 py-0.5 rounded text-primary uppercase">
                {asset.type}
              </span>
            </div>
            <div className="p-3">
              <p className="font-bold text-sm truncate">{asset.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{asset.format} · {asset.size} · {asset.date}</p>
            </div>
          </div>
        ))}

        {/* Upload Placeholder */}
        <div className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-xl flex flex-col items-center justify-center gap-2 min-h-[200px] hover:bg-primary/10 transition-all cursor-pointer group">
          <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-2xl">add</span>
          </div>
          <p className="text-sm font-bold text-primary">Add Asset</p>
        </div>
      </div>
    </div>
  );
}
