import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGemini } from "../contexts/GeminiContext";
import { deepResearchNiche, researchNiche } from "../lib/gemini";

const TABS = [
  { id: "keywords", label: "Keywords", icon: "key" },
  { id: "bestsellers", label: "Bestsellers", icon: "star" },
  { id: "analytics", label: "Analytics", icon: "analytics" },
  { id: "gaps", label: "Content Gaps", icon: "lightbulb" },
  { id: "series", label: "Series Strategy", icon: "library_books" },
];

export default function NicheResearch() {
  const { apiKey, hasApiKey } = useGemini();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("keywords");
  const [researchMode, setResearchMode] = useState("deep"); // "quick" | "deep"

  const handleResearch = async () => {
    if (!query.trim()) return;
    if (!hasApiKey) {
      setError("Please set your Gemini API key in Settings first.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const data = researchMode === "deep"
        ? await deepResearchNiche(apiKey, query.trim())
        : await researchNiche(apiKey, query.trim());
      setResults(data);
      setActiveTab("keywords");
    } catch (err) {
      setError(err.message || "Research failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartBook = (keyword, suggestedTitle) => {
    const title = suggestedTitle || keyword;
    navigate(`/?create=${encodeURIComponent(title)}`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Niche Research</h2>
          <p className="text-slate-500 mt-1">AI-powered deep market intelligence for Amazon KDP.</p>
        </div>
      </div>

      {/* No API Key Warning */}
      {!hasApiKey && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
          <span className="material-symbols-outlined text-amber-500">warning</span>
          <p className="text-sm text-amber-700">Gemini API key required for AI research.</p>
          <button onClick={() => navigate("/settings")} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 ml-auto">
            Set Up
          </button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-primary/10 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">psychology</span>
            AI Niche Intelligence
          </h3>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setResearchMode("quick")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${researchMode === "quick" ? "bg-white text-slate-700 shadow-sm" : "text-slate-400"}`}
            >
              Quick
            </button>
            <button
              onClick={() => setResearchMode("deep")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${researchMode === "deep" ? "bg-primary text-white shadow-sm" : "text-slate-400"}`}
            >
              ✨ Deep Research
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleResearch()}
            className="flex-1 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary"
            placeholder="Enter a topic or keyword to research... e.g., potty training, bedtime stories, emotions"
          />
          <button
            onClick={handleResearch}
            disabled={loading || !query.trim() || !hasApiKey}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2 min-w-[160px] justify-center"
          >
            {loading ? (
              <>
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {researchMode === "deep" ? "Deep Analyzing..." : "Analyzing..."}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">rocket_launch</span>
                {researchMode === "deep" ? "Deep Analyze" : "Quick Analyze"}
              </>
            )}
          </button>
        </div>

        {/* Quick suggestions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {["Potty Training", "Bedtime Stories", "Feelings & Emotions", "Social Skills", "Letters & Numbers", "Healthy Eating", "Dinosaurs", "Kindness"].map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium hover:bg-primary/20 hover:text-primary transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <span className="material-symbols-outlined text-red-500">error</span>
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => setError("")} className="ml-auto text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-white rounded-xl border border-primary/10 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-8 rounded-lg bg-primary/20 animate-pulse" />
            <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-primary">
              <div className="size-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span>{researchMode === "deep" ? "Running deep market analysis with Google Search..." : "Analyzing keywords..."}</span>
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-t border-slate-100">
                <div className="h-4 flex-1 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <>
          {/* Insights Card */}
          {results.insights && (
            <div className="bg-gradient-to-r from-primary/10 to-purple-50 rounded-xl p-6 mb-6 border border-primary/10">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">lightbulb</span>
                Market Insights
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">{results.insights}</p>
              {results.recommendation && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-primary/10">
                  <p className="text-sm font-medium text-primary">{results.recommendation}</p>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-white rounded-xl border border-primary/10 p-1.5 overflow-x-auto">
            {TABS.map((tab) => {
              // Only show tab if data exists
              const hasData = tab.id === "keywords" ? results.keywords?.length > 0
                : tab.id === "bestsellers" ? results.bestsellers?.length > 0
                : tab.id === "analytics" ? results.analytics
                : tab.id === "gaps" ? results.contentGaps?.length > 0
                : tab.id === "series" ? results.seriesStrategy
                : false;

              if (!hasData) return null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Keywords Tab */}
          {activeTab === "keywords" && results.keywords && results.keywords.length > 0 && (
            <div className="bg-white rounded-xl border border-primary/10 overflow-hidden">
              <div className="p-6 border-b border-primary/5">
                <h3 className="font-bold">Keyword Analysis</h3>
                <p className="text-xs text-slate-400 mt-1">{results.keywords.length} keywords found for "{query}"</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Keyword</th>
                      <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Volume</th>
                      <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Competition</th>
                      <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Trend</th>
                      <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Score</th>
                      <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.keywords.map((n, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium">{n.keyword}</p>
                          {n.suggestedTitle && <p className="text-[11px] text-primary/60 mt-0.5">💡 {n.suggestedTitle}</p>}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{n.estimatedVolume || n.volume || "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                            n.competition === "Low" ? "bg-green-100 text-green-700" :
                            n.competition === "Medium" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {n.competition}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`material-symbols-outlined text-lg ${
                            n.trend === "up" ? "text-green-500" : n.trend === "down" ? "text-red-400" : "text-slate-400"
                          }`}>
                            {n.trend === "up" ? "trending_up" : n.trend === "down" ? "trending_down" : "trending_flat"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${n.score}%` }} />
                            </div>
                            <span className="text-xs font-bold text-primary">{n.score}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleStartBook(n.keyword, n.suggestedTitle)}
                            className="text-primary text-xs font-bold hover:underline"
                          >
                            Start Book →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bestsellers Tab */}
          {activeTab === "bestsellers" && results.bestsellers && results.bestsellers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Top Sellers in "{query}"</h3>
                <span className="text-xs text-slate-400">{results.bestsellers.length} books analyzed</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {results.bestsellers.map((book, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-primary/10 p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="size-14 rounded-xl bg-gradient-to-br from-primary/20 to-purple-100 flex items-center justify-center shrink-0">
                        <span className="text-2xl font-black text-primary">#{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm leading-tight">{book.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">by {book.author}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                            ⭐ {book.estimatedRating}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            💬 {book.estimatedReviews} reviews
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            📄 {book.pageCount} pages
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                            💰 {book.priceRange}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Why it sells</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{book.whyItSells}</p>
                    </div>
                    {book.lessonsForCreators && (
                      <div className="mt-2 p-3 bg-primary/5 rounded-lg">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-primary/60 mb-1">Takeaway</p>
                        <p className="text-xs text-slate-700 leading-relaxed">{book.lessonsForCreators}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && results.analytics && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">Market Analytics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Avg Page Count", value: results.analytics.avgPageCount, icon: "description", color: "text-blue-600 bg-blue-50" },
                  { label: "Price Sweet Spot", value: results.analytics.priceSwetSpot || results.analytics.avgPrice, icon: "payments", color: "text-green-600 bg-green-50" },
                  { label: "Avg Rating", value: `⭐ ${results.analytics.avgRating}`, icon: "star", color: "text-amber-600 bg-amber-50" },
                  { label: "Market Size", value: results.analytics.marketSize, icon: "trending_up", color: "text-purple-600 bg-purple-50" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl border border-primary/10 p-5">
                    <div className={`size-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
                      <span className="material-symbols-outlined">{stat.icon}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                    <p className="text-xl font-black mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-primary/10 p-5">
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">auto_stories</span>
                    Common Page Counts
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(results.analytics.mostCommonPageCounts || []).map((pc) => (
                      <span key={pc} className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold">
                        {pc} pages
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-3">Range: {results.analytics.pageCountRange}</p>
                </div>
                <div className="bg-white rounded-xl border border-primary/10 p-5">
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">category</span>
                    Top Categories
                  </h4>
                  <div className="space-y-2">
                    {(results.analytics.topCategories || []).map((cat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="size-6 rounded bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{i + 1}</div>
                        <span className="text-sm text-slate-700">{cat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-primary/10 p-5">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Growth Rate</p>
                    <p className="text-sm font-medium">{results.analytics.growthRate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Seasonality</p>
                    <p className="text-sm font-medium">{results.analytics.seasonality}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Gaps Tab */}
          {activeTab === "gaps" && results.contentGaps && results.contentGaps.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Content Gaps & Opportunities</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Underserved angles in this niche you can target</p>
                </div>
              </div>
              <div className="space-y-3">
                {results.contentGaps.map((gap, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-primary/10 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`size-8 rounded-lg flex items-center justify-center ${
                            gap.difficulty === "Easy" ? "bg-green-50 text-green-600" :
                            gap.difficulty === "Medium" ? "bg-amber-50 text-amber-600" :
                            "bg-red-50 text-red-600"
                          }`}>
                            <span className="material-symbols-outlined text-lg">
                              {gap.difficulty === "Easy" ? "check_circle" : gap.difficulty === "Medium" ? "warning" : "error"}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{gap.gap}</h4>
                            <span className={`text-[10px] font-bold uppercase ${
                              gap.difficulty === "Easy" ? "text-green-600" :
                              gap.difficulty === "Medium" ? "text-amber-600" :
                              "text-red-600"
                            }`}>{gap.difficulty} difficulty</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed ml-10">{gap.opportunity}</p>
                      </div>
                      <div className="text-center shrink-0">
                        <div className="relative size-14">
                          <svg className="size-14 -rotate-90" viewBox="0 0 56 56">
                            <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--color-primary, #9d2bee)" strokeWidth="4"
                              strokeDasharray={`${(gap.potentialScore / 100) * 150.8} 150.8`} strokeLinecap="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-primary">{gap.potentialScore}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5">Potential</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleStartBook(gap.gap)}
                        className="text-primary text-xs font-bold hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        Create Book for This Gap
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Series Strategy Tab */}
          {activeTab === "series" && results.seriesStrategy && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Series Strategy</h3>
              <div className="bg-white rounded-xl border border-primary/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`size-10 rounded-lg flex items-center justify-center ${
                    results.seriesStrategy.recommended ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                  }`}>
                    <span className="material-symbols-outlined">
                      {results.seriesStrategy.recommended ? "thumb_up" : "info"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold">
                      {results.seriesStrategy.recommended ? "Series Recommended! ✨" : "Consider a Series"}
                    </h4>
                    <p className="text-xs text-slate-500">{results.seriesStrategy.rationale}</p>
                  </div>
                </div>

                {results.seriesStrategy.suggestedSeriesName && (
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-50 rounded-xl mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary/60 mb-1">Suggested Series Name</p>
                    <p className="text-lg font-black text-primary">{results.seriesStrategy.suggestedSeriesName}</p>
                  </div>
                )}

                {results.seriesStrategy.bookIdeas && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Book Ideas for the Series</p>
                    <div className="space-y-2">
                      {results.seriesStrategy.bookIdeas.map((idea, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors group">
                          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {idx + 1}
                          </div>
                          <span className="text-sm font-medium flex-1">{idea}</span>
                          <button
                            onClick={() => handleStartBook(idea)}
                            className="opacity-0 group-hover:opacity-100 text-primary text-xs font-bold hover:underline transition-opacity"
                          >
                            Create →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
