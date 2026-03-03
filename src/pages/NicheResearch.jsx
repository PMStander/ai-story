export default function NicheResearch() {
  const niches = [
    { keyword: "Potty Training", volume: "14,800/mo", competition: "Medium", trend: "up", score: 82 },
    { keyword: "Bedtime Stories Toddlers", volume: "22,100/mo", competition: "High", trend: "up", score: 91 },
    { keyword: "Healthy Family Recipes", volume: "18,400/mo", competition: "High", trend: "stable", score: 74 },
    { keyword: "Kids Activity Books", volume: "33,200/mo", competition: "Medium", trend: "up", score: 88 },
    { keyword: "Baby Sleep Training", volume: "9,600/mo", competition: "Low", trend: "up", score: 76 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Niche Research</h2>
          <p className="text-slate-500 mt-1">AI-powered market analysis for Amazon KDP niches.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">search</span>
          New Research
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-primary/10 p-6 mb-8">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">psychology</span>
          AI Niche Finder
        </h3>
        <div className="flex gap-4">
          <input
            className="flex-1 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary"
            placeholder="Enter a topic or keyword to research... e.g., parenting, DIY crafts, fitness"
          />
          <button className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Analyze
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-primary/10 overflow-hidden">
        <div className="p-6 border-b border-primary/5">
          <h3 className="font-bold">Research Results</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Keyword</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Search Volume</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Competition</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Trend</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Score</th>
                <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {niches.map((n) => (
                <tr key={n.keyword} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{n.keyword}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{n.volume}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      n.competition === "Low" ? "bg-green-100 text-green-700" :
                      n.competition === "Medium" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {n.competition}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`material-symbols-outlined text-lg ${n.trend === "up" ? "text-green-500" : "text-slate-400"}`}>
                      {n.trend === "up" ? "trending_up" : "trending_flat"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${n.score}%` }} />
                      </div>
                      <span className="text-xs font-bold text-primary">{n.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary text-xs font-bold hover:underline">Start Book</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
