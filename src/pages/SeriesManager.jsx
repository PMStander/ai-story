export default function SeriesManager() {
  const series = [
    { title: "The Last Horizon Saga", books: 4, status: "Active", progress: 72, genre: "Fantasy" },
    { title: "Little Dreamers Collection", books: 6, status: "Publishing", progress: 95, genre: "Children's" },
    { title: "Kitchen Chronicles", books: 3, status: "Drafting", progress: 30, genre: "Cookbook" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Series Manager</h2>
          <p className="text-slate-500 mt-1">Organize and manage your book series collections.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">add</span>
          New Series
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {series.map((s) => (
          <div key={s.title} className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">library_books</span>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                s.status === "Active" ? "bg-green-100 text-green-700" :
                s.status === "Publishing" ? "bg-blue-100 text-blue-700" :
                "bg-amber-100 text-amber-700"
              }`}>
                {s.status}
              </span>
            </div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{s.genre}</p>
            <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{s.title}</h3>
            <p className="text-sm text-slate-500 mb-4">{s.books} books in series</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium">{s.progress}% Complete</span>
            </div>
            <div className="w-full h-1.5 bg-primary/10 rounded-full mb-4">
              <div className="h-full bg-primary rounded-full" style={{ width: `${s.progress}%` }} />
            </div>
            <button className="w-full py-2.5 bg-primary/5 text-primary font-bold text-sm rounded-lg hover:bg-primary/10 transition-colors">
              Manage Series
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
