import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useGemini } from "../contexts/GeminiContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";

export default function Subscription() {
  const { user } = useAuth();
  const { hasApiKey } = useGemini();
  const navigate = useNavigate();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const usageRef = doc(db, "users", user.uid, "settings", "usage");
      const snap = await getDoc(usageRef);
      if (snap.exists()) {
        setUsage(snap.data());
      } else {
        // Initialize usage tracking
        const initial = {
          textGenerations: 0,
          imageGenerations: 0,
          researchQueries: 0,
          socialPosts: 0,
          embeddings: 0,
          totalTokensUsed: 0,
          periodStart: new Date().toISOString(),
        };
        await setDoc(usageRef, initial);
        setUsage(initial);
      }
      setLoading(false);
    })();
  }, [user]);

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/forever",
      description: "Bring your own Gemini API key",
      features: ["Unlimited projects", "AI story generation", "AI illustrations (Imagen 3)", "Niche research", "Vector search", "Social media toolkit", "Community access"],
      isCurrent: true,
      cta: "Current Plan",
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month",
      description: "Everything in Free + managed AI",
      features: ["Everything in Free", "Managed Gemini API (no key needed)", "Priority image generation", "Advanced analytics", "PDF export", "Priority support", "Custom branding"],
      isCurrent: false,
      cta: "Coming Soon",
      badge: "COMING SOON",
    },
    {
      name: "Business",
      price: "$49",
      period: "/month",
      description: "For professional publishers",
      features: ["Everything in Pro", "Team collaboration", "Bulk book generation", "Amazon KDP auto-publish", "Revenue analytics API", "White-label option", "Dedicated support"],
      isCurrent: false,
      cta: "Coming Soon",
      badge: "COMING SOON",
    },
  ];

  const usageItems = [
    { label: "Text Generations", key: "textGenerations", icon: "edit_note", limit: "Unlimited" },
    { label: "Image Generations", key: "imageGenerations", icon: "brush", limit: "Unlimited" },
    { label: "Research Queries", key: "researchQueries", icon: "search", limit: "Unlimited" },
    { label: "Social Posts", key: "socialPosts", icon: "share", limit: "Unlimited" },
    { label: "Embeddings", key: "embeddings", icon: "memory", limit: "Unlimited" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Subscription & Billing</h2>
          <p className="text-slate-500 mt-1">Manage your plan and track AI usage.</p>
        </div>
      </div>

      {/* BYOK Status */}
      <div className={`flex items-center gap-4 p-5 rounded-xl mb-8 ${hasApiKey ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
        <div className={`size-12 rounded-xl flex items-center justify-center ${hasApiKey ? "bg-green-100" : "bg-amber-100"}`}>
          <span className={`material-symbols-outlined text-xl ${hasApiKey ? "text-green-600" : "text-amber-600"}`}>
            {hasApiKey ? "check_circle" : "key"}
          </span>
        </div>
        <div className="flex-1">
          <p className={`font-bold text-sm ${hasApiKey ? "text-green-800" : "text-amber-800"}`}>
            {hasApiKey ? "BYOK Active — Using Your Gemini API Key" : "No API Key Configured"}
          </p>
          <p className={`text-xs ${hasApiKey ? "text-green-600" : "text-amber-600"}`}>
            {hasApiKey ? "All AI costs are billed directly to your Google Cloud account. No subscription fees for AI usage." : "Set up your Gemini API key to unlock all AI features."}
          </p>
        </div>
        <button onClick={() => navigate("/settings")} className={`px-4 py-2 rounded-lg text-sm font-bold ${hasApiKey ? "bg-green-600 text-white hover:bg-green-700" : "bg-amber-500 text-white hover:bg-amber-600"}`}>
          {hasApiKey ? "Manage Key" : "Set Up"}
        </button>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {plans.map((plan) => (
          <div key={plan.name} className={`bg-white rounded-xl border p-6 relative ${plan.isCurrent ? "border-primary shadow-lg shadow-primary/10" : "border-primary/10"}`}>
            {plan.badge && (
              <span className="absolute -top-3 right-4 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full">{plan.badge}</span>
            )}
            {plan.isCurrent && (
              <span className="absolute -top-3 right-4 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">ACTIVE</span>
            )}
            <h3 className="text-lg font-black mb-1">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-black">{plan.price}</span>
              <span className="text-sm text-slate-400">{plan.period}</span>
            </div>
            <p className="text-sm text-slate-500 mb-5">{plan.description}</p>
            <ul className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-green-500 text-lg">check</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              disabled={plan.isCurrent || !!plan.badge}
              className={`w-full py-3 rounded-xl font-bold text-sm ${
                plan.isCurrent ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Usage Tracking */}
      <div className="bg-white rounded-xl border border-primary/10 p-6">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">analytics</span>
          AI Usage This Period
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="size-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {usageItems.map((item) => (
              <div key={item.key} className="p-4 bg-slate-50 rounded-xl text-center">
                <span className="material-symbols-outlined text-primary text-2xl mb-2">{item.icon}</span>
                <p className="text-2xl font-black">{usage?.[item.key] || 0}</p>
                <p className="text-[10px] text-slate-500 mt-1">{item.label}</p>
                <p className="text-[10px] text-primary font-medium mt-0.5">Limit: {item.limit}</p>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-slate-400 mt-4 text-center">
          With BYOK, all AI usage is billed directly to your Google Cloud account. There are no usage limits from AI Publisher.
        </p>
      </div>
    </div>
  );
}
