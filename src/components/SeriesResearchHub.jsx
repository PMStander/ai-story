import { useState, useEffect } from "react";
import { updateSeries } from "../lib/firestore";
import { useAuth } from "../contexts/AuthContext";

export default function SeriesResearchHub({ seriesData, onUpdate }) {
  const { user } = useAuth();
  
  const [scratchpadText, setScratchpadText] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Research items state
  const [items, setItems] = useState([]);
  
  // Add new item state
  const [showAdd, setShowAdd] = useState(false);
  const [newItemType, setNewItemType] = useState("note"); // 'note', 'link', 'idea'
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemContent, setNewItemContent] = useState("");

  useEffect(() => {
    if (seriesData) {
      setScratchpadText(seriesData.scratchpad || "");
      setItems(seriesData.research || []);
    }
  }, [seriesData]);

  const handleSaveScratchpad = async () => {
    if (!user || !seriesData) return;
    if (scratchpadText === (seriesData.scratchpad || "")) return;
    try {
      await updateSeries(user.uid, seriesData.id, { scratchpad: scratchpadText });
      onUpdate({ ...seriesData, scratchpad: scratchpadText });
    } catch (err) {
      console.error("Error saving scratchpad:", err);
    }
  };

  const handleAddItem = async () => {
    if (!user || !seriesData || !newItemTitle.trim()) return;
    setLoading(true);
    try {
      const newItem = {
        id: Date.now().toString(),
        type: newItemType,
        title: newItemTitle.trim(),
        content: newItemContent.trim(),
        createdAt: Date.now(),
      };
      const updatedItems = [newItem, ...items];
      await updateSeries(user.uid, seriesData.id, { research: updatedItems });
      setItems(updatedItems);
      setShowAdd(false);
      setNewItemTitle("");
      setNewItemContent("");
      setNewItemType("note");
      onUpdate({ ...seriesData, research: updatedItems });
    } catch (err) {
      console.error("Error adding research item:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!user || !seriesData || !confirm("Delete this research item?")) return;
    try {
      const updatedItems = items.filter(item => item.id !== itemId);
      await updateSeries(user.uid, seriesData.id, { research: updatedItems });
      setItems(updatedItems);
      onUpdate({ ...seriesData, research: updatedItems });
    } catch (err) {
      console.error("Error deleting research item:", err);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'note': return 'edit_note';
      case 'link': return 'link';
      case 'idea': return 'lightbulb';
      case 'image': return 'image';
      default: return 'description';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'note': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'link': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'idea': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'image': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-primary/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            Development Scratchpad
          </h4>
          {scratchpadText !== (seriesData.scratchpad || "") && (
            <button
              onClick={handleSaveScratchpad}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              Save Notes
            </button>
          )}
        </div>
        <textarea
          value={scratchpadText}
          onChange={(e) => setScratchpadText(e.target.value)}
          onBlur={handleSaveScratchpad}
          className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-primary focus:border-primary min-h-[160px] resize-y"
          placeholder="Brainstorm global ideas for the universe, paste quick reference text, or keep to-do lists here..."
        />
        <p className="text-[10px] text-slate-400 mt-2 text-right">
          {scratchpadText !== (seriesData.scratchpad || "") ? "Unsaved changes..." : "All changes saved"}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-primary/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold flex items-center gap-2 text-lg">
            <span className="material-symbols-outlined text-primary">hub</span>
            Research Board
          </h4>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">{showAdd ? "close" : "add"}</span>
            {showAdd ? "Cancel" : "Add Item"}
          </button>
        </div>

        {showAdd && (
          <div className="mb-8 p-5 rounded-xl border border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {['note', 'link', 'idea', 'image'].map(t => (
                <button
                  key={t}
                  onClick={() => setNewItemType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    newItemType === t 
                      ? 'bg-primary text-white border-primary shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{getTypeIcon(t)}</span>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Title</label>
                <input 
                  value={newItemTitle} 
                  onChange={(e) => setNewItemTitle(e.target.value)} 
                  className="w-full rounded-xl border-slate-200 bg-white px-4 py-2 text-sm focus:ring-primary focus:border-primary" 
                  placeholder={newItemType === 'idea' ? "e.g., Book 4 concept" : newItemType === 'link' ? "Reference Title" : "New Note"} 
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  {newItemType === 'link' || newItemType === 'image' ? "URL" : "Content / Description"}
                </label>
                {newItemType === 'link' || newItemType === 'image' ? (
                  <input 
                    value={newItemContent} 
                    onChange={(e) => setNewItemContent(e.target.value)} 
                    className="w-full rounded-xl border-slate-200 bg-white px-4 py-2 text-sm focus:ring-primary focus:border-primary" 
                    placeholder={newItemType === 'image' ? "https://example.com/image.jpg" : "https://..."} 
                  />
                ) : (
                  <textarea 
                    value={newItemContent} 
                    onChange={(e) => setNewItemContent(e.target.value)} 
                    className="w-full rounded-xl border-slate-200 bg-white px-4 py-2 text-sm focus:ring-primary focus:border-primary min-h-[100px] resize-y" 
                    placeholder="Write your ideas or notes here..." 
                  />
                )}
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={handleAddItem} 
                  disabled={!newItemTitle.trim() || loading} 
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-lg">add</span>
                  )}
                  Save {newItemType === 'idea' ? "Idea" : newItemType === 'link' ? "Link" : newItemType === 'image' ? "Image" : "Note"}
                </button>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inventory_2</span>
            <p className="text-sm text-slate-500">No research items yet.</p>
            <p className="text-xs text-slate-400 mt-1">Add notes, save reference links, or log book ideas.</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {items.map(item => (
              <div key={item.id} className="break-inside-avoid group relative bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all hover:border-primary/30 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg border flex items-center justify-center ${getTypeColor(item.type)}`}>
                    <span className="material-symbols-outlined text-lg">{getTypeIcon(item.type)}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
                
                <h5 className="font-bold text-slate-800 mb-2 leading-tight">{item.title}</h5>
                
                <div className="flex-1">
                  {item.type === 'link' ? (
                    <a href={item.content.startsWith('http') ? item.content : `https://${item.content}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all line-clamp-3">
                      {item.content}
                    </a>
                  ) : item.type === 'image' ? (
                    <img 
                      src={item.content} 
                      alt={item.title} 
                      className="w-full rounded-lg object-cover mt-2" 
                      onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Invalid+Image' }} 
                    />
                  ) : (
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{item.content}</p>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span className="uppercase tracking-wider">{item.type}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
