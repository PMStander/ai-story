export default function Subscription() {
  return (
    <div className="p-8 lg:p-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Subscription &amp; Billing</h1>
          <p className="text-slate-500 mt-1">Manage your plan, track AI usage, and view invoices.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-xl bg-white border border-slate-200 hover:shadow-sm transition-all">
            <span className="material-symbols-outlined text-slate-600">notifications</span>
          </button>
          <button className="p-2.5 rounded-xl bg-white border border-slate-200 hover:shadow-sm transition-all">
            <span className="material-symbols-outlined text-slate-600">help_outline</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Current Plan */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex gap-5 items-center">
                <div className="size-16 rounded-xl bg-primary flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-3xl">workspace_premium</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-primary tracking-wider uppercase">Active Plan</span>
                  <h3 className="text-2xl font-bold mt-0.5">Pro Publisher</h3>
                  <p className="text-slate-500 text-sm mt-1">Next renewal: <span className="font-medium">October 24, 2023</span></p>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <div className="text-3xl font-black">$49<span className="text-base font-normal text-slate-400">/month</span></div>
                <button className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20">
                  Upgrade Plan
                </button>
              </div>
            </div>
          </section>

          {/* AI Usage */}
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Monthly Usage Credits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-tight">Gemini Words</p>
                    <p className="text-xs text-slate-500">Premium narrative generation</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary">75,400</span>
                    <span className="text-xs text-slate-400"> / 100k</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "75%" }} />
                </div>
                <p className="text-xs text-slate-400 italic">Resets in 12 days</p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-tight">Image Generations</p>
                    <p className="text-xs text-slate-500">Book covers &amp; illustrations</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary">124</span>
                    <span className="text-xs text-slate-400"> / 250</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "49%" }} />
                </div>
                <p className="text-xs text-slate-400 italic">Resets in 12 days</p>
              </div>
            </div>
          </section>

          {/* Plan Comparison */}
          <section className="flex flex-col gap-6">
            <h3 className="text-lg font-bold">Compare Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: "Starter",
                  price: "$19",
                  features: ["20k Gemini Words", "50 Image Generations", "3 Active Book Projects"],
                  action: "Downgrade",
                  current: false,
                },
                {
                  name: "Pro Publisher",
                  price: "$49",
                  features: ["100k Gemini Words", "250 Image Generations", "Unlimited Projects", "Advanced Editor Tools"],
                  action: null,
                  current: true,
                },
                {
                  name: "Agency",
                  price: "$149",
                  features: ["500k Gemini Words", "1000 Image Generations", "Multi-user Access", "API Access"],
                  action: "Upgrade Now",
                  current: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`bg-white rounded-xl p-6 flex flex-col h-full relative ${
                    plan.current ? "border-2 border-primary" : "border border-slate-200 hover:border-primary/50"
                  } transition-all`}
                >
                  {plan.current && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      Current
                    </div>
                  )}
                  <h4 className="font-bold">{plan.name}</h4>
                  <p className="text-2xl font-black mt-2 mb-4">
                    {plan.price}<span className="text-sm font-normal text-slate-400">/mo</span>
                  </p>
                  <ul className="text-sm text-slate-500 space-y-3 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {plan.action && (
                    <button
                      className={`w-full py-2.5 rounded-lg font-bold transition-all ${
                        plan.action === "Upgrade Now"
                          ? "bg-primary text-white hover:shadow-lg hover:shadow-primary/20"
                          : "border border-primary text-primary hover:bg-primary/5"
                      }`}
                    >
                      {plan.action}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-8">
          {/* Payment Method */}
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold">Payment Method</h3>
              <button className="text-primary text-sm font-bold hover:underline">Edit</button>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
              <div className="size-10 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-200">
                <span className="material-symbols-outlined text-blue-600">credit_card</span>
              </div>
              <div>
                <p className="text-sm font-bold tracking-widest">•••• 4242</p>
                <p className="text-xs text-slate-500">Exp: 09/2025</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">$49.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span className="font-medium">$0.00</span>
              </div>
              <hr className="border-slate-100" />
              <div className="flex justify-between text-base font-bold">
                <span>Total Charge</span>
                <span className="text-primary">$49.00</span>
              </div>
            </div>
          </section>

          {/* Recent Invoices */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold">Recent Invoices</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { id: "INV-2023-09", date: "Sept 24, 2023", amount: "$49.00" },
                { id: "INV-2023-08", date: "Aug 24, 2023", amount: "$49.00" },
                { id: "INV-2023-07", date: "July 24, 2023", amount: "$49.00" },
              ].map((inv) => (
                <div key={inv.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-sm">description</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase">{inv.id}</p>
                      <p className="text-[10px] text-slate-500">{inv.date}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="text-xs font-bold">{inv.amount}</span>
                    <button className="size-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined text-lg">download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50 text-center">
              <button className="text-xs font-bold text-slate-500 hover:text-primary transition-colors">
                View All Invoices
              </button>
            </div>
          </section>
        </div>
      </div>

      <footer className="mt-12 py-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-slate-500">© 2023 AI Books Studio. All rights reserved.</p>
        <div className="flex gap-6">
          <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Terms of Service</a>
          <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Cancel Subscription</a>
        </div>
      </footer>
    </div>
  );
}
