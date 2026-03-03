export default function StoryStudio() {
  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Workspace Sidebar */}
      <aside className="w-64 border-r border-primary/10 bg-white p-4 flex flex-col gap-6 overflow-y-auto">
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Workspace
          </p>
          <div className="flex flex-col gap-1">
            <a className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary/10 text-primary" href="#">
              <span className="material-symbols-outlined">description</span>
              <span className="text-sm font-semibold">Story Outline</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-primary/5 transition-colors" href="#">
              <span className="material-symbols-outlined">face_6</span>
              <span className="text-sm font-medium">Character Bible</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-primary/5 transition-colors" href="#">
              <span className="material-symbols-outlined">public</span>
              <span className="text-sm font-medium">World Building</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-primary/5 transition-colors" href="#">
              <span className="material-symbols-outlined">list_alt</span>
              <span className="text-sm font-medium">Chapter Drafts</span>
            </a>
          </div>
        </div>
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            AI Engine
          </p>
          <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-4 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-sm">bolt</span>
              <span className="text-xs font-bold text-primary uppercase">Gemini Pro Active</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enhanced narrative logic and creative brainstorming enabled.
            </p>
          </div>
        </div>
      </aside>

      {/* Split Screen Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: AI Text Editor */}
        <section className="flex-1 flex flex-col bg-white border-r border-primary/5">
          <div className="px-6 py-4 flex items-center justify-between border-b border-primary/5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit_note</span>
              <h3 className="font-bold">Story Outline</h3>
            </div>
            <div className="flex gap-1">
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <span className="material-symbols-outlined text-xl">undo</span>
              </button>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <span className="material-symbols-outlined text-xl">redo</span>
              </button>
            </div>
          </div>
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="group relative">
                <h1 className="text-3xl font-bold text-slate-900 mb-2" contentEditable suppressContentEditableWarning>
                  The Last Horizon
                </h1>
                <p className="text-slate-500 italic">Chapter 1: The Awakening</p>
              </div>
              <div className="prose max-w-none">
                <p className="text-lg leading-relaxed text-slate-700 outline-none" contentEditable suppressContentEditableWarning>
                  The sun dipped below the jagged peaks of the Obsidian Range, casting long, bruised shadows across the valley floor. Elara stood at the precipice, the wind whipping her crimson cloak around her like a living thing. In her palm, the relic hummed—a soft, rhythmic vibration that matched the beating of her own heart.
                </p>
                <p className="text-lg leading-relaxed text-slate-700 mt-4 outline-none" contentEditable suppressContentEditableWarning>
                  She hadn't asked for this destiny, but the elders had been clear. The star-fall was only the beginning. Gemini pulses had been detected across the sector, signaling a shift in the cosmic balance that hadn't been seen for a millennia.
                </p>
              </div>
            </div>
          </div>
          {/* Editor Toolbar */}
          <div className="p-4 border-t border-primary/5 bg-slate-50/50">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                  <span>Gemini: Suggest Next Sentence</span>
                </button>
                <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">format_bold</span>
                </button>
                <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">format_italic</span>
                </button>
                <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">link</span>
                </button>
              </div>
              <div className="text-xs text-slate-400">142 words · 4 min read</div>
            </div>
          </div>
        </section>

        {/* Right: Visual Studio Panel */}
        <section className="w-[450px] flex flex-col bg-slate-50 overflow-y-auto">
          <div className="px-6 py-4 border-b border-primary/5 bg-white flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">palette</span>
              <h3 className="font-bold">Visual Studio</h3>
            </div>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-tighter">
              Asset Generator
            </span>
          </div>
          <div className="p-6 space-y-8">
            {/* Character Consistency */}
            <div className="space-y-4">
              <label className="text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">person_celebrate</span>
                Character Consistency
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div
                  className="aspect-square rounded-xl border-2 border-primary bg-cover bg-center ring-4 ring-primary/10 relative overflow-hidden"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD2E_MYmthIRnpxU6xk0G1Hhg1JTvGqTQr0rPOaLYIVCZnXGSUmBmmKzw4s_48y3OceZOVTGwK4ilMoQ29RzLB3uu4xTkGmJaNrpJOlYuiXsUjI2lZiZ1otvjBN8Zn65h3q_Xh9cnKXDzVxZFnhiMWUUfZCXQztj7Y4ImA3VifwnUM7yrFyr_sIO4XFL0-gqmwiYaFiOwHO_Qlfuq99PHbsqcGiyqW7KoZ6xXtxslZdfyIDtRLMrAdeLUtreTd9RZU_oI9xCaLE8Kc')" }}
                >
                  <div className="absolute inset-0 bg-primary/20 flex items-end p-2">
                    <span className="text-[10px] font-bold text-white uppercase bg-primary px-1.5 py-0.5 rounded">Active</span>
                  </div>
                </div>
                <div
                  className="aspect-square rounded-xl border border-slate-200 bg-cover bg-center grayscale hover:grayscale-0 transition-all cursor-pointer"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCExZwZk-GubFuVr2UchTdCaJ_6cPPKcUSf7mjW_b4oTz97jH_U6gftyJLw6U_NLbPnXXrmKYxOeoNprv187Mk1qxL9RMGoL7FRxdwgkRsaIXQGhgy7vUuzfcuYHpS-JgAxKupWjpDTrvieLIZE3EVMs2YjlXwLEc9YK79DDDAWeEDUpgwmIy-LbPlVRX7DnkJV1WHRsP6j-ch9Lqo7nM2Mu2eix0NaTP_ayE6jTkfpu1SsTxyGKXmKLGDRvvRbn_RPCxqNIMxLT6Q')" }}
                />
                <div className="aspect-square rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-primary hover:text-primary transition-colors cursor-pointer">
                  <span className="material-symbols-outlined">add</span>
                  <span className="text-[10px] font-bold">New Hero</span>
                </div>
              </div>
            </div>

            {/* Generate Scene */}
            <div className="space-y-4">
              <label className="text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">image</span>
                Generate Scene
              </label>
              <div className="relative">
                <textarea
                  className="w-full rounded-xl border-slate-200 bg-white p-4 text-sm focus:ring-primary focus:border-primary min-h-[100px]"
                  placeholder="Describe the scene... e.g., Elara standing on the edge of the Obsidian Range, sunset lighting, cinematic fantasy style."
                />
                <button className="absolute bottom-3 right-3 p-2 bg-primary text-white rounded-lg shadow-lg shadow-primary/30 hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-lg">rocket_launch</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Cinematic", "Digital Art", "Hyper-real", "Watercolor"].map((style) => (
                  <button key={style} className="px-3 py-1 rounded-full bg-slate-200 text-[11px] font-medium hover:bg-primary/20 hover:text-primary transition-colors">
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Assets */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">history</span>
                  Recent Assets
                </label>
                <button className="text-[11px] font-bold text-primary">View All</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuDCZjZ5Mju9DsE-dxS42Gi_lEaNC6cD3-D_5zBhjUNJIUisIV1rVg1BvSVpuenq_FudhHbrYyabkoStvT6zakZBS_dQHCfOJ4fxGuXQer_qRnH_s2ylzst0X7IgFUoeBcxQ6fDDQqVMpLnIv5E_-vQNu89OeFuFDi89U2jXmT9zEBCPQ0MUeXDYaa2bj_sWvzatw-Fi_mL-oUgh6EqIIgCIPLWcz2kV0aB0P17nKG4RNv6a2Hz56--PFfKjtRZnrZlfmEnSfugI-J4",
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuDQE-bJbK5m2qyxpEppKgPr1CIchJLc_hg9w0ZtxQ60O-bI6gPwAwyHj0B9KY0kxXX9RFUpzBSdPb7RJkk58ZHoe6fNaF4P9O512OM0_faJBBnFYnNIp07ldbOU7WdF0xHttcCHnCgQyTRyIRr58oPXPlU7hnf-TRpWpNB7-Ss8AdcO79OYKCZr0QvtwgxUFti3wEiaIG9Irkn6MkWoqiCMiaFw3yK2qBpw_8gG26yWDqLx2iev-awP0pltLERklGHSxBdCiAqAlR4",
                ].map((src, idx) => (
                  <div key={idx} className="group relative aspect-video rounded-xl overflow-hidden shadow-sm border border-slate-200">
                    <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={src} alt="Generated asset" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="p-1.5 bg-white/20 backdrop-blur rounded-lg text-white hover:bg-white/40">
                        <span className="material-symbols-outlined text-sm">download</span>
                      </button>
                      <button className="p-1.5 bg-white/20 backdrop-blur rounded-lg text-white hover:bg-white/40">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
