import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useGemini } from "../contexts/GeminiContext";
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, getUserProjects } from "../lib/firestore";
import { generateText } from "../lib/gemini";

export default function AdsManager() {
  const { user } = useAuth();
  const { apiKey, hasApiKey } = useGemini();
  const [campaigns, setCampaigns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [generatingKeywords, setGeneratingKeywords] = useState(false);
  const [filter, setFilter] = useState("All");

  // Form state
  const [name, setName] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [dailyBudget, setDailyBudget] = useState("10.00");
  const [keywords, setKeywords] = useState("");

  const loadData = async () => {
    if (!user) return;
    const [c, p] = await Promise.all([getCampaigns(user.uid), getUserProjects(user.uid)]);
    setCampaigns(c);
    setProjects(p);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  const resetForm = () => {
    setName("");
    setBookTitle("");
    setDailyBudget("10.00");
    setKeywords("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editingId) {
      await updateCampaign(user.uid, editingId, { name, bookTitle, dailyBudget, keywords });
    } else {
      await createCampaign(user.uid, { name, bookTitle, dailyBudget, keywords });
    }
    resetForm();
    await loadData();
  };

  const handleEdit = (c) => {
    setName(c.name);
    setBookTitle(c.bookTitle || "");
    setDailyBudget(c.dailyBudget || "10.00");
    setKeywords(c.keywords || "");
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this campaign?")) {
      await deleteCampaign(user.uid, id);
      await loadData();
    }
  };

  const handleToggleStatus = async (c) => {
    const newStatus = c.status === "Active" ? "Paused" : "Active";
    await updateCampaign(user.uid, c.id, { status: newStatus });
    await loadData();
  };

  const handleAIKeywords = async () => {
    if (!hasApiKey || !bookTitle.trim()) return;
    setGeneratingKeywords(true);
    try {
      const result = await generateText(apiKey,
        `Generate 10 Amazon KDP advertising keywords for a children's book titled "${bookTitle}". Return just the keywords, one per line, no numbers or bullets.`,
        "You are an Amazon KDP advertising expert."
      );
      setKeywords(result.trim());
    } catch (err) {
      console.error("Keyword generation failed:", err);
    } finally {
      setGeneratingKeywords(false);
    }
  };

  const filtered = filter === "All" ? campaigns : campaigns.filter((c) => c.status === filter);

  const stats = [
    { label: "Total Campaigns", value: campaigns.length, icon: "campaign" },
    { label: "Active", value: campaigns.filter((c) => c.status === "Active").length, icon: "play_circle" },
    { label: "Paused", value: campaigns.filter((c) => c.status === "Paused").length, icon: "pause_circle" },
    { label: "Drafts", value: campaigns.filter((c) => c.status === "Draft").length, icon: "edit_note" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Ads Manager</h2>
          <p className="text-slate-500 mt-1">Manage Amazon advertising campaigns for your books.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">add</span> New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">campaign</span>
              {editingId ? "Edit Campaign" : "New Campaign"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Campaign Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="e.g., Potty Guide - Launch" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Book</label>
                <select value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary">
                  <option value="">Select a book...</option>
                  {projects.map((p) => <option key={p.id} value={p.title}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Daily Budget ($)</label>
                <input type="number" step="0.01" value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-700">Keywords</label>
                  {hasApiKey && bookTitle && (
                    <button onClick={handleAIKeywords} disabled={generatingKeywords} className="text-xs text-primary font-bold flex items-center gap-1 hover:underline disabled:opacity-50">
                      {generatingKeywords ? "Generating..." : <><span className="material-symbols-outlined text-sm">auto_awesome</span> AI Suggest</>}
                    </button>
                  )}
                </div>
                <textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[100px] resize-none" placeholder="One keyword per line..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={resetForm} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleSave} disabled={!name.trim()} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50">
                {editingId ? "Update" : "Create"} Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-primary/10 overflow-hidden">
        <div className="p-6 border-b border-primary/5 flex items-center justify-between">
          <h3 className="font-bold">Campaigns</h3>
          <div className="flex gap-2">
            {["All", "Active", "Paused", "Draft"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500 hover:bg-primary/5 hover:text-primary"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">campaign</span>
            <p className="text-slate-500 mb-2">{filter === "All" ? "No campaigns yet." : `No ${filter.toLowerCase()} campaigns.`}</p>
            <p className="text-sm text-slate-400">Create a campaign to promote your books on Amazon.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Campaign", "Book", "Status", "Budget", "Keywords", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{c.bookTitle || "—"}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleToggleStatus(c)} className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full cursor-pointer ${c.status === "Active" ? "bg-green-100 text-green-700" : c.status === "Paused" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                        {c.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm">${c.dailyBudget}/day</td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate">{c.keywords || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleEdit(c)} className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                        <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-lg">delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
