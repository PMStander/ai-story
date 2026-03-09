import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useGemini } from "../contexts/GeminiContext";
import { useNavigate } from "react-router-dom";
import {
  getUserProjects,
  getUserSeries,
  createSeries,
  updateSeries,
  deleteSeries,
} from "../lib/firestore";
import { generateText } from "../lib/gemini";
import StyleGuide from "../components/StyleGuide";

export default function SeriesManager() {
  const { user } = useAuth();
  const { apiKey, hasApiKey } = useGemini();
  const navigate = useNavigate();

  const [series, setSeries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [editingStyleGuide, setEditingStyleGuide] = useState(false);

  // Create form
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newNiche, setNewNiche] = useState("");

  // AI state
  const [aiLoading, setAiLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        getUserSeries(user.uid),
        getUserProjects(user.uid),
      ]);
      setSeries(s);
      setProjects(p);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSeries = async () => {
    if (!newName.trim() || !user) return;
    try {
      await createSeries(user.uid, {
        name: newName.trim(),
        description: newDesc.trim(),
        niche: newNiche.trim(),
      });
      setNewName("");
      setNewDesc("");
      setNewNiche("");
      setShowCreate(false);
      loadData();
    } catch {
      // handle error
    }
  };

  const handleDeleteSeries = async (seriesId) => {
    if (!user || !confirm("Delete this series? Books won't be deleted.")) return;
    await deleteSeries(user.uid, seriesId);
    if (selectedSeries?.id === seriesId) setSelectedSeries(null);
    loadData();
  };

  const handleAddBookToSeries = async (seriesData, projectId) => {
    if (!user) return;
    const bookIds = [...(seriesData.bookIds || [])];
    if (!bookIds.includes(projectId)) {
      bookIds.push(projectId);
      await updateSeries(user.uid, seriesData.id, { bookIds });
      loadData();
    }
  };

  const handleRemoveBookFromSeries = async (seriesData, projectId) => {
    if (!user) return;
    const bookIds = (seriesData.bookIds || []).filter(id => id !== projectId);
    await updateSeries(user.uid, seriesData.id, { bookIds });
    loadData();
  };

  const handleStyleGuideChange = async (seriesData, styleGuide) => {
    if (!user) return;
    await updateSeries(user.uid, seriesData.id, { styleGuide });
    loadData();
  };

  const handleAiConsistencyCheck = async (seriesData) => {
    if (!hasApiKey || !seriesData) return;
    setAiLoading(true);
    try {
      const booksInSeries = projects.filter(p => (seriesData.bookIds || []).includes(p.id));
      const bookSummaries = booksInSeries.map(b => `"${b.title}" (${b.genre}, age ${b.targetAge})`).join(", ");
      const styleStr = seriesData.styleGuide?.artStyle ? `Art style: ${seriesData.styleGuide.artStyle}` : "No style guide defined";
      const chars = (seriesData.styleGuide?.characters || []).map(c => `${c.name}: ${c.visualDescription}`).join("; ");

      const prompt = `Analyze the consistency of this book series:
Series: "${seriesData.name}"
Books: ${bookSummaries || "No books yet"}
Style Guide: ${styleStr}
Characters: ${chars || "None defined"}

Provide:
1. Consistency score (0-100)
2. What's working well
3. Specific issues to fix
4. Recommendations for improvement
Return as JSON: { "score": number, "strengths": string[], "issues": string[], "recommendations": string[] }`;

      const response = await generateText(apiKey, prompt, "You are a publishing consistency expert. Return JSON.");
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const check = JSON.parse(jsonMatch[0]);
        setSelectedSeries(s => s ? { ...s, consistencyCheck: check } : s);
      }
    } catch {
      // handle error
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSuggestNext = async (seriesData) => {
    if (!hasApiKey || !seriesData) return;
    setAiLoading(true);
    try {
      const booksInSeries = projects.filter(p => (seriesData.bookIds || []).includes(p.id));
      const bookTitles = booksInSeries.map(b => b.title).join(", ");

      const prompt = `Suggest the next book idea for this children's series:
Series: "${seriesData.name}" — ${seriesData.description}
Niche: ${seriesData.niche}
Existing books: ${bookTitles || "None yet"}

Provide a JSON response: { "title": "suggested title", "synopsis": "2-3 sentence synopsis", "theme": "key theme", "whyItFits": "why this fits the series" }`;

      const response = await generateText(apiKey, prompt, "You are a bestselling children's book series editor. Return JSON.");
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const suggestion = JSON.parse(jsonMatch[0]);
        setSelectedSeries(s => s ? { ...s, nextBookSuggestion: suggestion } : s);
      }
    } catch {
      // handle error
    } finally {
      setAiLoading(false);
    }
  };

  const seriesBooks = (seriesData) =>
    projects.filter(p => (seriesData?.bookIds || []).includes(p.id));

  const unassignedBooks = projects.filter(
    p => !series.some(s => (s.bookIds || []).includes(p.id))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Series Manager</h2>
          <p className="text-slate-500 mt-1">Organize books into series with shared style guides for consistency.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Series
        </button>
      </div>

      {/* Create Series Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-primary/10 p-6 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">library_books</span>
            Create New Series
          </h3>
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Series Name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold focus:ring-primary focus:border-primary" placeholder="e.g., The Adventures of Brave Bunny" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Description</label>
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-primary focus:border-primary min-h-[60px] resize-none" placeholder="What is this series about?" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Niche / Market</label>
              <input value={newNiche} onChange={(e) => setNewNiche(e.target.value)} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-primary focus:border-primary" placeholder="e.g., social skills, potty training" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleCreateSeries} disabled={!newName.trim()} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50">Create Series</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Series List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-3">Your Series ({series.length})</h3>

            {series.length === 0 && (
              <div className="p-6 bg-white rounded-xl border border-primary/10 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">library_books</span>
                <p className="text-sm text-slate-400">No series yet. Create one to group your books!</p>
              </div>
            )}

            {series.map((s) => {
              const bookCount = (s.bookIds || []).length;
              const hasStyle = !!s.styleGuide?.artStyle;
              return (
                <button
                  key={s.id}
                  onClick={() => { setSelectedSeries(s); setEditingStyleGuide(false); }}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedSeries?.id === s.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-slate-200 bg-white hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-sm">{s.name}</h4>
                    <span className="text-xs text-slate-400">{bookCount} book{bookCount !== 1 ? 's' : ''}</span>
                  </div>
                  {s.description && <p className="text-[11px] text-slate-500 line-clamp-2">{s.description}</p>}
                  <div className="flex gap-1.5 mt-2">
                    {s.niche && <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{s.niche}</span>}
                    {hasStyle && <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Style Guide ✓</span>}
                  </div>
                </button>
              );
            })}

            {/* Unassigned Books */}
            {unassignedBooks.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-3">Unassigned Books ({unassignedBooks.length})</h3>
                <div className="space-y-2">
                  {unassignedBooks.map((p) => (
                    <div key={p.id} className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{p.title}</p>
                        <p className="text-[10px] text-slate-400">{p.genre} • {p.targetAge}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/story-studio?project=${p.id}`)}
                        className="text-primary text-xs font-bold hover:underline"
                      >
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Series Detail */}
          <div className="lg:col-span-2">
            {!selectedSeries ? (
              <div className="p-12 bg-white rounded-xl border border-primary/10 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-200 mb-3">touch_app</span>
                <p className="text-slate-400">Select a series to view details</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Series Header */}
                <div className="bg-white rounded-xl border border-primary/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-black">{selectedSeries.name}</h3>
                      {selectedSeries.description && <p className="text-sm text-slate-500 mt-1">{selectedSeries.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAiConsistencyCheck(selectedSeries)}
                        disabled={aiLoading || !hasApiKey}
                        className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-100 disabled:opacity-50 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">fact_check</span>
                        Check Consistency
                      </button>
                      <button
                        onClick={() => handleAiSuggestNext(selectedSeries)}
                        disabled={aiLoading || !hasApiKey}
                        className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 disabled:opacity-50 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        Suggest Next Book
                      </button>
                      <button
                        onClick={() => handleDeleteSeries(selectedSeries.id)}
                        className="px-3 py-2 text-red-400 hover:bg-red-50 rounded-lg"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Consistency Check Result */}
                  {selectedSeries.consistencyCheck && (
                    <div className="p-4 bg-slate-50 rounded-xl mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`size-12 rounded-xl flex items-center justify-center text-lg font-black ${
                          selectedSeries.consistencyCheck.score >= 80 ? "bg-green-100 text-green-700" :
                          selectedSeries.consistencyCheck.score >= 50 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {selectedSeries.consistencyCheck.score}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">Consistency Score</h4>
                          <p className="text-[10px] text-slate-400">AI-analyzed across all books in the series</p>
                        </div>
                      </div>
                      {selectedSeries.consistencyCheck.strengths?.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[10px] font-bold uppercase text-green-600 mb-1">Strengths</p>
                          {selectedSeries.consistencyCheck.strengths.map((s, i) => (
                            <p key={i} className="text-xs text-slate-600 ml-3">✓ {s}</p>
                          ))}
                        </div>
                      )}
                      {selectedSeries.consistencyCheck.issues?.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[10px] font-bold uppercase text-red-600 mb-1">Issues</p>
                          {selectedSeries.consistencyCheck.issues.map((s, i) => (
                            <p key={i} className="text-xs text-slate-600 ml-3">⚠ {s}</p>
                          ))}
                        </div>
                      )}
                      {selectedSeries.consistencyCheck.recommendations?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase text-primary mb-1">Recommendations</p>
                          {selectedSeries.consistencyCheck.recommendations.map((s, i) => (
                            <p key={i} className="text-xs text-slate-600 ml-3">💡 {s}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Next Book Suggestion */}
                  {selectedSeries.nextBookSuggestion && (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 mb-4">
                      <h4 className="font-bold text-sm flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
                        Suggested Next Book
                      </h4>
                      <p className="text-sm font-bold text-primary">{selectedSeries.nextBookSuggestion.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{selectedSeries.nextBookSuggestion.synopsis}</p>
                      <p className="text-[10px] text-slate-400 mt-2">Theme: {selectedSeries.nextBookSuggestion.theme} — {selectedSeries.nextBookSuggestion.whyItFits}</p>
                      <button
                        onClick={() => navigate(`/book-wizard?topic=${encodeURIComponent(selectedSeries.nextBookSuggestion.title)}`)}
                        className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90"
                      >
                        Create This Book →
                      </button>
                    </div>
                  )}

                  {/* Books in Series */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-sm">Books in Series ({seriesBooks(selectedSeries).length})</h4>
                    </div>
                    {seriesBooks(selectedSeries).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No books assigned yet. Add books from the list below.</p>
                    ) : (
                      <div className="space-y-2">
                        {seriesBooks(selectedSeries).map((book, idx) => (
                          <div key={book.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{idx + 1}</div>
                            {book.coverImageUrl ? (
                              <img src={book.coverImageUrl} alt="" className="size-10 rounded-lg object-cover" />
                            ) : (
                              <div className="size-10 rounded-lg bg-slate-200 flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-400 text-lg">auto_stories</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{book.title}</p>
                              <p className="text-[10px] text-slate-400">{book.genre} • {book.targetAge} • {book.status}</p>
                            </div>
                            <button
                              onClick={() => navigate(`/story-studio?project=${book.id}`)}
                              className="text-primary text-xs font-bold hover:underline"
                            >
                              Open
                            </button>
                            <button
                              onClick={() => handleRemoveBookFromSeries(selectedSeries, book.id)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add books dropdown */}
                    {unassignedBooks.length > 0 && (
                      <div className="mt-3">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddBookToSeries(selectedSeries, e.target.value);
                              e.target.value = "";
                            }
                          }}
                          className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
                        >
                          <option value="">+ Add a book to this series...</option>
                          {unassignedBooks.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Style Guide */}
                <div className="bg-white rounded-xl border border-primary/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">palette</span>
                      Series Style Guide
                    </h4>
                    <button
                      onClick={() => setEditingStyleGuide(!editingStyleGuide)}
                      className="text-primary text-xs font-bold hover:underline"
                    >
                      {editingStyleGuide ? "Close" : "Edit Style Guide"}
                    </button>
                  </div>

                  {!editingStyleGuide ? (
                    <div>
                      {selectedSeries.styleGuide?.artStyle ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {selectedSeries.styleGuide.artStyle && (
                              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">🎨 {selectedSeries.styleGuide.artStyle.slice(0, 40)}...</span>
                            )}
                            {selectedSeries.styleGuide.colorPalette && (
                              <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">🎨 {selectedSeries.styleGuide.colorPalette}</span>
                            )}
                          </div>
                          {selectedSeries.styleGuide.characters?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Characters</p>
                              {selectedSeries.styleGuide.characters.map((c, i) => (
                                <p key={i} className="text-xs text-slate-600"><strong>{c.name}:</strong> {c.visualDescription}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No style guide defined. Set one to maintain visual consistency across all books.</p>
                      )}
                    </div>
                  ) : (
                    <StyleGuide
                      styleGuide={selectedSeries.styleGuide || {}}
                      onChange={(sg) => handleStyleGuideChange(selectedSeries, sg)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
