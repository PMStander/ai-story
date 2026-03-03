export default function Publishing() {
  const publishedBooks = [
    { title: "Potty Training Guide", asin: "B0C12345", status: "Live", date: "Sep 15, 2023", price: "$9.99", reviews: 42 },
    { title: "Bedtime Stories Collection", asin: "B0C67890", status: "Live", date: "Aug 22, 2023", price: "$12.99", reviews: 67 },
    { title: "Little Dreamers Vol. 1", asin: "B0C24680", status: "In Review", date: "Oct 1, 2023", price: "$8.99", reviews: 0 },
  ];

  const steps = [
    { num: 1, title: "Manuscript", desc: "Upload or generate your book content", icon: "description", complete: true },
    { num: 2, title: "Cover Design", desc: "Create or upload your book cover", icon: "image", complete: true },
    { num: 3, title: "Metadata", desc: "Title, description, keywords, categories", icon: "label", complete: true },
    { num: 4, title: "Pricing", desc: "Set price and royalty preferences", icon: "payments", complete: false },
    { num: 5, title: "Review & Publish", desc: "Final review before submission", icon: "rocket_launch", complete: false },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Publishing Hub</h2>
          <p className="text-slate-500 mt-1">Manage Amazon KDP publishing workflow and listings.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">publish</span>
          Publish New Book
        </button>
      </div>

      {/* Publishing Workflow */}
      <section className="bg-white rounded-xl border border-primary/10 p-6 mb-8">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">timeline</span>
          Publishing Workflow
        </h3>
        <div className="flex items-center gap-4">
          {steps.map((step, idx) => (
            <div key={step.num} className="flex items-center gap-4 flex-1">
              <div className="flex flex-col items-center gap-2">
                <div className={`size-12 rounded-full flex items-center justify-center ${step.complete ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}>
                  {step.complete ? (
                    <span className="material-symbols-outlined">check</span>
                  ) : (
                    <span className="material-symbols-outlined">{step.icon}</span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold">{step.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 max-w-[100px]">{step.desc}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 ${step.complete ? "bg-primary" : "bg-slate-200"} mb-8`} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Published Books */}
      <div className="bg-white rounded-xl border border-primary/10 overflow-hidden">
        <div className="p-6 border-b border-primary/5">
          <h3 className="font-bold">Published Books</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Title", "ASIN", "Status", "Published", "Price", "Reviews", ""].map((h) => (
                  <th key={h} className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {publishedBooks.map((b) => (
                <tr key={b.asin} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{b.title}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-mono">{b.asin}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${b.status === "Live" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{b.date}</td>
                  <td className="px-6 py-4 text-sm font-medium">{b.price}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-amber-400 text-sm">star</span>
                      <span>{b.reviews}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary text-xs font-bold hover:underline">Manage</button>
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
