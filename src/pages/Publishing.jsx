import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserProjects, updateProject } from "../lib/firestore";
import { useNavigate } from "react-router-dom";

export default function Publishing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserProjects(user.uid).then((p) => {
      setProjects(p);
      setLoading(false);
    });
  }, [user]);

  const handleStatusChange = async (projectId, newStatus) => {
    await updateProject(user.uid, projectId, { status: newStatus });
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, status: newStatus } : p));
  };

  const steps = [
    { label: "Niche Research", icon: "search", status: "research" },
    { label: "Story Outline", icon: "description", status: "outline" },
    { label: "Write Content", icon: "edit_note", status: "writing" },
    { label: "Illustrations", icon: "brush", status: "illustrating" },
    { label: "Review & Edit", icon: "rate_review", status: "review" },
    { label: "Publish", icon: "publish", status: "published" },
  ];

  const getStepIndex = (status) => steps.findIndex((s) => s.status === status);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Publishing Hub</h2>
          <p className="text-slate-500 mt-1">Track your books through the publishing workflow.</p>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="bg-white rounded-xl border border-primary/10 p-6 mb-8">
        <h3 className="font-bold mb-6">Publishing Workflow</h3>
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step.status} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`size-10 rounded-full flex items-center justify-center ${i === 0 ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}>
                  <span className="material-symbols-outlined text-lg">{step.icon}</span>
                </div>
                <p className="text-[10px] font-medium mt-2 text-center">{step.label}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="w-16 h-0.5 bg-slate-200 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Books Publishing Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">publish</span>
          <p className="text-slate-500 font-medium mb-1">No books to publish</p>
          <p className="text-sm text-slate-400">Create a project to get started.</p>
          <button onClick={() => navigate("/")} className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90">Dashboard</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-primary/10 overflow-hidden">
          <div className="p-6 border-b border-primary/5">
            <h3 className="font-bold">Your Books</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Title</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Genre</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Status</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Progress</th>
                <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => {
                const stepIdx = getStepIndex(p.status);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold">{p.title}</p>
                      <p className="text-[11px] text-slate-400">Ages {p.targetAge}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p.genre}</td>
                    <td className="px-6 py-4">
                      <select
                        value={p.status}
                        onChange={(e) => handleStatusChange(p.id, e.target.value)}
                        className="text-xs font-bold rounded-lg border-slate-200 bg-slate-50 px-2 py-1"
                      >
                        {steps.map((s) => <option key={s.status} value={s.status}>{s.label}</option>)}
                        <option value="draft">Draft</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {steps.map((_, i) => (
                            <div key={i} className={`w-4 h-1.5 rounded-full ${i <= stepIdx ? "bg-primary" : "bg-slate-200"}`} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-primary">{stepIdx + 1}/{steps.length}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/story-outline?project=${p.id}`)}
                        className="text-primary text-xs font-bold hover:underline"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
