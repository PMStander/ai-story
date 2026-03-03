export default function IllustrationStudio() {
  const tools = [
    { icon: "brush", label: "Style Picker", desc: "Choose illustration style" },
    { icon: "palette", label: "Color Palette", desc: "Manage book color scheme" },
    { icon: "auto_fix_high", label: "AI Retouch", desc: "Enhance with Gemini" },
    { icon: "crop", label: "Smart Crop", desc: "Resize for book format" },
  ];

  const illustrations = [
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCZjZ5Mju9DsE-dxS42Gi_lEaNC6cD3-D_5zBhjUNJIUisIV1rVg1BvSVpuenq_FudhHbrYyabkoStvT6zakZBS_dQHCfOJ4fxGuXQer_qRnH_s2ylzst0X7IgFUoeBcxQ6fDDQqVMpLnIv5E_-vQNu89OeFuFDi89U2jXmT9zEBCPQ0MUeXDYaa2bj_sWvzatw-Fi_mL-oUgh6EqIIgCIPLWcz2kV0aB0P17nKG4RNv6a2Hz56--PFfKjtRZnrZlfmEnSfugI-J4",
      title: "Obsidian Mountains",
      status: "Generated",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQE-bJbK5m2qyxpEppKgPr1CIchJLc_hg9w0ZtxQ60O-bI6gPwAwyHj0B9KY0kxXX9RFUpzBSdPb7RJkk58ZHoe6fNaF4P9O512OM0_faJBBnFYnNIp07ldbOU7WdF0xHttcCHnCgQyTRyIRr58oPXPlU7hnf-TRpWpNB7-Ss8AdcO79OYKCZr0QvtwgxUFti3wEiaIG9Irkn6MkWoqiCMiaFw3yK2qBpw_8gG26yWDqLx2iev-awP0pltLERklGHSxBdCiAqAlR4",
      title: "Enchanted Forest",
      status: "Approved",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2E_MYmthIRnpxU6xk0G1Hhg1JTvGqTQr0rPOaLYIVCZnXGSUmBmmKzw4s_48y3OceZOVTGwK4ilMoQ29RzLB3uu4xTkGmJaNrpJOlYuiXsUjI2lZiZ1otvjBN8Zn65h3q_Xh9cnKXDzVxZFnhiMWUUfZCXQztj7Y4ImA3VifwnUM7yrFyr_sIO4XFL0-gqmwiYaFiOwHO_Qlfuq99PHbsqcGiyqW7KoZ6xXtxslZdfyIDtRLMrAdeLUtreTd9RZU_oI9xCaLE8Kc",
      title: "Character: Elara",
      status: "In Review",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Illustration Studio</h2>
          <p className="text-slate-500 mt-1">Create and manage AI-generated book illustrations</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">add</span>
          Generate New
        </button>
      </div>

      {/* AI Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {tools.map((tool) => (
          <div key={tool.label} className="bg-white rounded-xl border border-primary/10 p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">{tool.icon}</span>
            </div>
            <h3 className="font-bold text-sm">{tool.label}</h3>
            <p className="text-xs text-slate-500 mt-1">{tool.desc}</p>
          </div>
        ))}
      </div>

      {/* Prompt Area */}
      <section className="bg-white rounded-xl border border-primary/10 p-6 mb-8">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">auto_awesome</span>
          AI Scene Generator
        </h3>
        <div className="relative">
          <textarea
            className="w-full rounded-xl border-slate-200 bg-slate-50 p-4 text-sm focus:ring-primary focus:border-primary min-h-[120px] resize-none"
            placeholder="Describe the illustration you want... e.g., A whimsical forest with glowing mushrooms, a small cottage in the background, watercolor children's book style..."
          />
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              {["Watercolor", "Digital Art", "Cartoon", "Realistic", "Flat"].map((style) => (
                <button key={style} className="px-3 py-1.5 rounded-full bg-slate-100 text-[11px] font-medium hover:bg-primary/20 hover:text-primary transition-colors">
                  {style}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-lg">rocket_launch</span>
              Generate
            </button>
          </div>
        </div>
      </section>

      {/* Illustrations Gallery */}
      <h3 className="text-xl font-bold mb-6">Generated Illustrations</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {illustrations.map((ill) => (
          <div key={ill.title} className="group bg-white rounded-xl overflow-hidden border border-primary/10 shadow-sm hover:shadow-md transition-all">
            <div className="aspect-[4/3] overflow-hidden relative">
              <img src={ill.src} alt={ill.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button className="p-2 bg-white/20 backdrop-blur rounded-lg text-white hover:bg-white/40">
                  <span className="material-symbols-outlined">download</span>
                </button>
                <button className="p-2 bg-white/20 backdrop-blur rounded-lg text-white hover:bg-white/40">
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button className="p-2 bg-white/20 backdrop-blur rounded-lg text-white hover:bg-white/40">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">{ill.title}</h4>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">{ill.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
