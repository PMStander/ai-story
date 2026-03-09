import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useGemini } from "../contexts/GeminiContext";
import { getUserProjects } from "../lib/firestore";
import { generateSocialPost } from "../lib/gemini";
import { useNavigate } from "react-router-dom";

export default function SocialMedia() {
  const { user } = useAuth();
  const { apiKey, hasApiKey } = useGemini();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [platform, setPlatform] = useState("Instagram");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState("");
  const [error, setError] = useState("");
  const [savedPosts, setSavedPosts] = useState([]);

  useEffect(() => {
    if (!user) return;
    getUserProjects(user.uid).then(setProjects);
  }, [user]);

  const handleGenerate = async () => {
    if (!hasApiKey) { setError("Set your Gemini API key in Settings."); return; }
    const bookTitle = selectedProject?.title || topic || "My Children's Book";
    setGenerating(true);
    setError("");
    try {
      const post = await generateSocialPost(apiKey, { bookTitle, platform, topic: topic || bookTitle });
      setGeneratedPost(post);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePost = () => {
    if (!generatedPost) return;
    setSavedPosts((prev) => [{ id: Date.now(), platform, content: generatedPost, createdAt: new Date() }, ...prev]);
    setGeneratedPost("");
  };

  const platforms = [
    { name: "Instagram", icon: "📸", color: "bg-gradient-to-br from-purple-500 to-pink-500" },
    { name: "TikTok", icon: "🎵", color: "bg-black" },
    { name: "Facebook", icon: "📘", color: "bg-blue-600" },
    { name: "X (Twitter)", icon: "🐦", color: "bg-slate-800" },
    { name: "Pinterest", icon: "📌", color: "bg-red-600" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Social Media Toolkit</h2>
          <p className="text-slate-500 mt-1">AI-generated promotional content for your books.</p>
        </div>
      </div>

      {!hasApiKey && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
          <span className="material-symbols-outlined text-amber-500">warning</span>
          <p className="text-sm text-amber-700">Gemini API key required.</p>
          <button onClick={() => navigate("/settings")} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold ml-auto">Set Up</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generator */}
        <div className="bg-white rounded-xl border border-primary/10 p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            AI Content Generator
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Platform</label>
              <div className="grid grid-cols-2 gap-2">
                {platforms.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setPlatform(p.name)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      platform === p.name ? "bg-primary text-white" : "bg-slate-100 hover:bg-primary/10"
                    }`}
                  >
                    <span>{p.icon}</span>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Book</label>
              <select
                value={selectedProject?.id || ""}
                onChange={(e) => setSelectedProject(projects.find((p) => p.id === e.target.value) || null)}
                className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              >
                <option value="">Manual entry</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            {!selectedProject && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Topic</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="e.g., potty training book for toddlers"
                />
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating || !hasApiKey}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Writing...</>
              ) : (
                <><span className="material-symbols-outlined text-lg">edit</span> Generate Post</>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 space-y-6">
          {generatedPost && (
            <div className="bg-white rounded-xl border border-primary/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">preview</span>
                  Generated Post — {platform}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(generatedPost)} className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">content_copy</span> Copy
                  </button>
                  <button onClick={handleSavePost} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">save</span> Save
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-5 whitespace-pre-wrap text-sm leading-relaxed">{generatedPost}</div>
            </div>
          )}

          {/* Saved Posts */}
          {savedPosts.length > 0 && (
            <div className="bg-white rounded-xl border border-primary/10 p-6">
              <h3 className="font-bold mb-4">Saved Posts ({savedPosts.length})</h3>
              <div className="space-y-3">
                {savedPosts.map((post) => (
                  <div key={post.id} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-primary">{post.platform}</span>
                      <button onClick={() => navigator.clipboard.writeText(post.content)} className="text-xs text-primary hover:underline">Copy</button>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-3">{post.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!generatedPost && savedPosts.length === 0 && (
            <div className="bg-white rounded-xl border border-primary/10 p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">share</span>
              <p className="text-slate-500 font-medium mb-1">No content generated yet</p>
              <p className="text-sm text-slate-400">Select a platform and click "Generate Post" to create AI content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
