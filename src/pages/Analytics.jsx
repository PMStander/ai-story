import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserProjects, getChapters } from "../lib/firestore";

export default function Analytics() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalWords: 0, totalChapters: 0, totalAssets: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const projs = await getUserProjects(user.uid);
      setProjects(projs);

      let totalWords = 0;
      let totalChapters = 0;
      for (const p of projs) {
        const chs = await getChapters(user.uid, p.id);
        totalChapters += chs.length;
        totalWords += chs.reduce((sum, ch) => sum + (ch.content?.split(/\s+/).filter(Boolean).length || 0), 0);
      }
      setStats({ totalWords, totalChapters, totalAssets: 0 });
      setLoading(false);
    })();
  }, [user]);

  const published = projects.filter((p) => p.status === "published");
  const inProgress = projects.filter((p) => p.status !== "published");

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Analytics</h2>
          <p className="text-slate-500 mt-1">Track your publishing metrics and AI usage.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Books", value: projects.length, icon: "menu_book", color: "text-primary" },
              { label: "Total Words", value: stats.totalWords.toLocaleString(), icon: "text_fields", color: "text-blue-600" },
              { label: "Total Pages", value: stats.totalChapters, icon: "description", color: "text-amber-600" },
              { label: "Published", value: published.length, icon: "check_circle", color: "text-green-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-5 border border-primary/5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`material-symbols-outlined text-lg ${s.color}`}>{s.icon}</span>
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
                <p className="text-3xl font-black">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Project Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-primary/10 p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">timeline</span>
                Writing Activity
              </h3>
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <p className="text-sm text-slate-400 py-8 text-center">No project data yet.</p>
                ) : (
                  projects.map((p) => (
                    <div key={p.id} className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{p.title}</p>
                        <p className="text-[11px] text-slate-400">{p.genre}</p>
                      </div>
                      <div className="w-32">
                        <div className="h-1.5 bg-primary/10 rounded-full">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${p.progress || 0}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary w-10 text-right">{p.progress || 0}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-primary/10 p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">psychology</span>
                AI Usage
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Text Generations", value: "—", desc: "Story outlines, suggestions" },
                  { label: "Image Generations", value: "—", desc: "Imagen 3 illustrations" },
                  { label: "Research Queries", value: "—", desc: "Niche analysis" },
                  { label: "Social Posts", value: "—", desc: "Content generation" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <span className="text-lg font-black text-slate-300">{item.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-4">
                AI usage tracking will be available in a future update. All API calls use your own key.
              </p>
            </div>
          </div>

          {/* Books Table */}
          {projects.length > 0 && (
            <div className="bg-white rounded-xl border border-primary/10 overflow-hidden">
              <div className="p-6 border-b border-primary/5">
                <h3 className="font-bold">All Books</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Title</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Genre</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Status</th>
                    <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium">{p.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{p.genre}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                          p.status === "published" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-primary/10 rounded-full">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress || 0}%` }} />
                          </div>
                          <span className="text-xs font-bold">{p.progress || 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
