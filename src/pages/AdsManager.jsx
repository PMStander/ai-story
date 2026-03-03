export default function AdsManager() {
  const campaigns = [
    { name: "Potty Guide - Launch", status: "Active", spend: "$145.20", impressions: "24.5K", clicks: "1,240", acos: "28%", sales: "$518" },
    { name: "Bedtime Stories - Auto", status: "Active", spend: "$89.50", impressions: "18.2K", clicks: "920", acos: "22%", sales: "$406" },
    { name: "Recipes - Sponsored", status: "Paused", spend: "$34.00", impressions: "5.1K", clicks: "180", acos: "45%", sales: "$75" },
  ];

  const stats = [
    { label: "Total Ad Spend", value: "$268.70", icon: "payments" },
    { label: "Total Sales", value: "$999.00", icon: "attach_money" },
    { label: "Average ACoS", value: "26.9%", icon: "analytics" },
    { label: "Active Campaigns", value: "2", icon: "campaign" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Ads Manager</h2>
          <p className="text-slate-500 mt-1">Manage Amazon advertising campaigns for your books.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">add</span>
          New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-6 rounded-xl border border-primary/5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">{s.icon}</span>
              </div>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
            <p className="text-2xl font-black text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-primary/10 overflow-hidden">
        <div className="p-6 border-b border-primary/5 flex items-center justify-between">
          <h3 className="font-bold">Campaigns</h3>
          <div className="flex gap-2">
            {["All", "Active", "Paused"].map((f) => (
              <button key={f} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${f === "All" ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500 hover:bg-primary/5 hover:text-primary"} transition-colors`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Campaign", "Status", "Spend", "Impressions", "Clicks", "ACoS", "Sales", ""].map((h) => (
                  <th key={h} className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{c.name}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${c.status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{c.spend}</td>
                  <td className="px-6 py-4 text-sm">{c.impressions}</td>
                  <td className="px-6 py-4 text-sm">{c.clicks}</td>
                  <td className="px-6 py-4 text-sm font-medium text-primary">{c.acos}</td>
                  <td className="px-6 py-4 text-sm font-bold">{c.sales}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">more_vert</span></button>
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
