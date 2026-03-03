export default function Analytics() {
  const metrics = [
    { label: "Total Revenue", value: "$12,440", change: "+18%", icon: "attach_money" },
    { label: "Books Sold", value: "1,842", change: "+24%", icon: "shopping_cart" },
    { label: "Page Reads (KU)", value: "48.2K", change: "+12%", icon: "menu_book" },
    { label: "Avg. Rating", value: "4.6", change: "+0.2", icon: "star" },
  ];

  const topBooks = [
    { title: "Potty Training Guide", revenue: "$3,240", units: 432, rank: 1 },
    { title: "Bedtime Stories for Toddlers", revenue: "$2,890", units: 380, rank: 2 },
    { title: "Healthy Family Recipes", revenue: "$1,960", units: 264, rank: 3 },
    { title: "The Last Horizon", revenue: "$1,420", units: 198, rank: 4 },
    { title: "Little Dreamers Vol. 1", revenue: "$1,180", units: 165, rank: 5 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Analytics</h2>
          <p className="text-slate-500 mt-1">Track your book performance and revenue metrics.</p>
        </div>
        <div className="flex gap-2">
          {["7D", "30D", "90D", "1Y"].map((period) => (
            <button key={period} className={`px-4 py-2 rounded-lg text-sm font-medium ${period === "30D" ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-primary/50"} transition-colors`}>
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white p-6 rounded-xl border border-primary/5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">{m.icon}</span>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{m.change}</span>
            </div>
            <p className="text-sm text-slate-500">{m.label}</p>
            <p className="text-2xl font-black text-primary mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart Placeholder */}
      <section className="bg-white rounded-xl border border-primary/10 p-6 mb-8">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">show_chart</span>
          Revenue Trend
        </h3>
        <div className="h-64 flex items-end gap-2 px-4">
          {[40, 55, 35, 60, 70, 50, 75, 80, 65, 90, 85, 95].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary/20 hover:bg-primary/40 rounded-t-lg transition-colors cursor-pointer relative group"
                style={{ height: `${h}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ${Math.round(h * 14)}
                </div>
              </div>
              <span className="text-[10px] text-slate-400">{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top Books */}
      <section className="bg-white rounded-xl border border-primary/10 overflow-hidden">
        <div className="p-6 border-b border-primary/5">
          <h3 className="font-bold">Top Performing Books</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {topBooks.map((b) => (
            <div key={b.title} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  #{b.rank}
                </div>
                <span className="font-medium text-sm">{b.title}</span>
              </div>
              <div className="flex items-center gap-8 text-sm">
                <span className="text-slate-500">{b.units} units</span>
                <span className="font-bold text-primary">{b.revenue}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
