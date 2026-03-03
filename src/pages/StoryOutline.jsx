export default function StoryOutline() {
  const chapters = [
    { num: 1, title: "The Awakening", words: 2400, status: "Complete" },
    { num: 2, title: "Shadows of the Past", words: 1800, status: "Complete" },
    { num: 3, title: "The Last Horizon", words: 3200, status: "Drafting" },
    { num: 4, title: "Into the Unknown", words: 0, status: "Planned" },
    { num: 5, title: "The Final Stand", words: 0, status: "Planned" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Story Outline</h2>
          <p className="text-slate-500 mt-1">AI-powered story structuring and chapter planning.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">auto_awesome</span>
          AI Generate Outline
        </button>
      </div>

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
              <input className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold focus:ring-primary focus:border-primary" defaultValue="The Last Horizon Saga" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Synopsis</label>
              <textarea className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary min-h-[120px] resize-none" defaultValue="In a world where the cosmic balance has shifted, a young warrior named Elara must harness the power of an ancient relic to restore order. As Gemini pulses ripple across the sector, she embarks on an epic journey through the Obsidian Range..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Genre</label>
                <input className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary" defaultValue="Fantasy / Sci-Fi" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Target Audience</label>
                <input className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary" defaultValue="Young Adult (16-24)" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-primary/10 p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            Progress
          </h3>
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-5xl font-black text-primary">42%</p>
              <p className="text-sm text-slate-500 mt-1">Overall Complete</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Words</span>
                <span className="font-bold">7,400</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Target Words</span>
                <span className="font-bold">50,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Chapters Done</span>
                <span className="font-bold">2 / 5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div className="bg-white rounded-xl border border-primary/10 overflow-hidden">
        <div className="p-6 border-b border-primary/5 flex items-center justify-between">
          <h3 className="font-bold">Chapter Outline</h3>
          <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
            <span className="material-symbols-outlined text-sm">add</span>
            Add Chapter
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {chapters.map((ch) => (
            <div key={ch.num} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {ch.num}
                </div>
                <div>
                  <p className="font-bold text-sm">{ch.title}</p>
                  <p className="text-xs text-slate-500">{ch.words > 0 ? `${ch.words.toLocaleString()} words` : "Not started"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                  ch.status === "Complete" ? "bg-green-100 text-green-700" :
                  ch.status === "Drafting" ? "bg-blue-100 text-blue-700" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  {ch.status}
                </span>
                <button className="text-slate-400 hover:text-primary">
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
