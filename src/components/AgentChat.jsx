import { useState, useRef, useEffect } from "react";
import { useAgent } from "../contexts/AgentProvider";
import { useLocation } from "react-router-dom";

// Map routes to human-readable page names
const PAGE_NAMES = {
  "/": "Dashboard",
  "/story-studio": "Story Studio",
  "/story-outline": "Story Outline",
  "/illustration-studio": "Illustration Studio",
  "/series-manager": "Series Manager",
  "/niche-research": "Niche Research",
  "/asset-library": "Asset Library",
  "/ads-manager": "Ads Manager",
  "/social-media": "Social Media",
  "/analytics": "Analytics",
  "/community": "Community",
  "/publishing": "Publishing Hub",
  "/subscription": "Subscription",
  "/settings": "Settings",
};

export default function AgentChat() {
  const {
    isOpen,
    toggleOpen,
    messages,
    loading,
    sendMessage,
    clearChat,
    hasApiKey,
    setPageContext,
  } = useAgent();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const location = useLocation();

  // Auto-update page context based on route
  useEffect(() => {
    const pageName =
      PAGE_NAMES[location.pathname] || location.pathname.replace(/^\//, "") || "Dashboard";
    setPageContext((prev) => ({ ...prev, currentPage: pageName }));
  }, [location.pathname, setPageContext]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render action badges
  const renderAction = (action) => {
    const icons = {
      update_content: { icon: "edit_note", label: "Updated page content", color: "text-blue-600 bg-blue-50" },
      suggest_continuation: { icon: "auto_awesome", label: "Suggested continuation", color: "text-purple-600 bg-purple-50" },
      add_image: { icon: "image", label: "Generated illustration", color: "text-green-600 bg-green-50" },
      generate_outline: { icon: "description", label: "Generated outline", color: "text-amber-600 bg-amber-50" },
      research_niche: { icon: "search", label: "Researched niche", color: "text-cyan-600 bg-cyan-50" },
      social_post: { icon: "share", label: "Created social post", color: "text-pink-600 bg-pink-50" },
      ad_keywords: { icon: "campaign", label: "Ad keywords ready", color: "text-orange-600 bg-orange-50" },
      series_ideas: { icon: "library_books", label: "Series ideas ready", color: "text-indigo-600 bg-indigo-50" },
      book_metadata: { icon: "publish", label: "Metadata optimized", color: "text-teal-600 bg-teal-50" },
    };
    const info = icons[action.action] || { icon: "check", label: action.action, color: "text-slate-600 bg-slate-50" };

    return (
      <div key={action.action} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${info.color} mt-2`}>
        <span className="material-symbols-outlined text-sm">{info.icon}</span>
        {info.label}
      </div>
    );
  };

  return (
    <>
      {/* FAB Toggle Button */}
      <button
        onClick={toggleOpen}
        className={`fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen
            ? "bg-slate-800 text-white rotate-0"
            : "bg-linear-to-br from-primary to-purple-700 text-white"
        }`}
        style={{ boxShadow: isOpen ? "0 4px 24px rgba(0,0,0,0.2)" : "0 4px 24px rgba(157,43,238,0.4)" }}
      >
        <span className="material-symbols-outlined text-2xl">
          {isOpen ? "close" : "auto_awesome"}
        </span>
      </button>

      {/* Chat Drawer */}
      <div
        className={`fixed bottom-24 right-6 z-40 w-96 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
        style={{ maxHeight: "calc(100vh - 140px)", height: "600px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-linear-to-br from-primary to-purple-700 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">auto_awesome</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">AI Assistant</h3>
              <p className="text-[10px] text-slate-400">
                {PAGE_NAMES[location.pathname] || "Ready to help"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                title="Clear chat"
              >
                <span className="material-symbols-outlined text-slate-400 text-lg">delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="size-16 bg-linear-to-br from-primary/10 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
              </div>
              <h4 className="font-bold text-slate-700 mb-2">How can I help?</h4>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                I can help with writing stories, generating illustrations, researching niches, creating social posts, and more.
              </p>
              {/* Quick actions */}
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "✍️ Continue my story",
                  "🎨 Generate an illustration",
                  "🔍 Research a niche",
                  "📱 Create social post",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion.replace(/^[^\s]+\s/, ""));
                      inputRef.current?.focus();
                    }}
                    className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : msg.error
                    ? "bg-red-50 text-red-700 border border-red-200 rounded-bl-md"
                    : "bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-md"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.actions?.map(renderAction)}
                {msg.actions?.some((a) => a.action === "add_image" && a.imageUrl) && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={msg.actions.find((a) => a.action === "add_image").imageUrl}
                      alt="Generated illustration"
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="size-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="size-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="size-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs text-slate-400 ml-1">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-100 shrink-0">
          {!hasApiKey ? (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2.5">
              <span className="material-symbols-outlined text-sm">warning</span>
              Set your Gemini API key in Settings to use the AI assistant.
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-slate-400"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="size-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
