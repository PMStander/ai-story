import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useGemini } from "../contexts/GeminiContext";
import { useTheme } from "../contexts/ThemeContext";
import { saveGeminiApiKey, getUserProfile, updateUserProfile } from "../lib/firestore";
import { validateApiKey } from "../lib/gemini";

export default function Settings() {
  const { user } = useAuth();
  const { apiKey, setApiKey, hasApiKey } = useGemini();
  const { theme, setTheme } = useTheme();

  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message: string }
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setKeyInput(apiKey);
    if (user) {
      getUserProfile(user.uid).then((profile) => {
        if (profile) setDisplayName(profile.displayName || "");
      });
    }
  }, [apiKey, user]);

  const handleSaveKey = async () => {
    if (!keyInput.trim()) {
      setStatus({ type: "error", message: "Please enter an API key" });
      return;
    }
    setValidating(true);
    setStatus(null);

    const { valid, error } = await validateApiKey(keyInput.trim());
    if (valid) {
      await saveGeminiApiKey(user.uid, keyInput.trim());
      setApiKey(keyInput.trim());
      setStatus({ type: "success", message: "API key validated and saved successfully!" });
    } else {
      setStatus({ type: "error", message: `Invalid API key: ${error}` });
    }
    setValidating(false);
  };

  const handleRemoveKey = async () => {
    await saveGeminiApiKey(user.uid, "");
    setApiKey("");
    setKeyInput("");
    setStatus({ type: "success", message: "API key removed" });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateUserProfile(user.uid, { displayName });
    setSaving(false);
    setStatus({ type: "success", message: "Profile updated" });
  };

  const maskedKey = keyInput ? `${keyInput.slice(0, 6)}${"•".repeat(20)}${keyInput.slice(-4)}` : "";

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-3xl font-black tracking-tight mb-2">Settings</h2>
      <p className="text-slate-500 mb-8">Manage your account and AI configuration.</p>

      {/* Status Banner */}
      {status && (
        <div className={`flex items-center gap-2 p-4 rounded-xl mb-6 ${
          status.type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
        }`}>
          <span className={`material-symbols-outlined ${status.type === "success" ? "text-green-500" : "text-red-500"}`}>
            {status.type === "success" ? "check_circle" : "error"}
          </span>
          <p className={`text-sm ${status.type === "success" ? "text-green-700" : "text-red-600"}`}>{status.message}</p>
          <button onClick={() => setStatus(null)} className="ml-auto text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Profile Section */}
      <section className="bg-white rounded-xl border border-primary/10 p-6 mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">person</span>
          Profile
        </h3>
        <div className="flex items-center gap-6 mb-6">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="size-16 rounded-full object-cover" />
          ) : (
            <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
              {(displayName || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-bold">{displayName || "User"}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Update Profile"}
          </button>
        </div>
      </section>

      {/* Gemini API Key Section */}
      <section className="bg-white rounded-xl border border-primary/10 p-6 mb-6">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">key</span>
          Gemini API Key
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Your API key is used for all AI features: writing, image generation, and research.
          Get your key from{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            Google AI Studio
          </a>
          .
        </p>

        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <input
              type={showKey ? "text" : "password"}
              value={showKey ? keyInput : maskedKey || keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onFocus={() => setShowKey(true)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:ring-2 focus:ring-primary/50 focus:border-primary pr-12"
              placeholder="AIza..."
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
            >
              <span className="material-symbols-outlined text-lg">
                {showKey ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveKey}
            disabled={validating}
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {validating ? (
              <>
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">save</span>
                {hasApiKey ? "Update Key" : "Save Key"}
              </>
            )}
          </button>
          {hasApiKey && (
            <button
              onClick={handleRemoveKey}
              className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all"
            >
              Remove Key
            </button>
          )}
        </div>

        {hasApiKey && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
            <span className="material-symbols-outlined text-green-500">verified</span>
            <p className="text-sm text-green-700">API key is configured and active</p>
          </div>
        )}
      </section>

      {/* Appearance Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-primary/10 dark:border-slate-700 p-6 mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2 dark:text-white">
          <span className="material-symbols-outlined text-primary">palette</span>
          Appearance
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Choose your preferred theme for the app.</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "light", icon: "light_mode", label: "Light" },
            { id: "dark", icon: "dark_mode", label: "Dark" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                theme === opt.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-primary/40"
              }`}
            >
              <span className="material-symbols-outlined text-2xl">{opt.icon}</span>
              <span className="text-xs font-bold">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* AI Configuration */}
      <section className="bg-white rounded-xl border border-primary/10 p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">tune</span>
          AI Preferences
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Default Illustration Style</label>
            <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary">
              <option>Colorful Cartoon</option>
              <option>Watercolor</option>
              <option>Digital Art</option>
              <option>Flat Illustration</option>
              <option>Hyper-realistic</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Writing Tone</label>
            <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary">
              <option>Playful & Fun</option>
              <option>Educational</option>
              <option>Gentle & Soothing</option>
              <option>Adventurous</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
