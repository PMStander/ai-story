import { useState } from "react";
import { ART_STYLES } from "../lib/kdpFormats";

/**
 * Reusable Style Guide editor component.
 * Used in StoryOutline and SeriesManager for consistent illustration settings.
 */
export default function StyleGuide({ styleGuide = {}, onChange, compact = false }) {
  const [showCharForm, setShowCharForm] = useState(false);
  const [newCharName, setNewCharName] = useState("");
  const [newCharDesc, setNewCharDesc] = useState("");

  const guide = {
    artStyle: "",
    colorPalette: "",
    characters: [],
    environmentRules: "",
    additionalRules: "",
    ...styleGuide,
  };

  const update = (field, value) => {
    onChange?.({ ...guide, [field]: value });
  };

  const addCharacter = () => {
    if (!newCharName.trim()) return;
    const chars = [...(guide.characters || []), { name: newCharName.trim(), visualDescription: newCharDesc.trim() }];
    onChange?.({ ...guide, characters: chars });
    setNewCharName("");
    setNewCharDesc("");
    setShowCharForm(false);
  };

  const removeCharacter = (idx) => {
    const chars = guide.characters.filter((_, i) => i !== idx);
    onChange?.({ ...guide, characters: chars });
  };

  const updateCharacter = (idx, field, value) => {
    const chars = [...guide.characters];
    chars[idx] = { ...chars[idx], [field]: value };
    onChange?.({ ...guide, characters: chars });
  };

  return (
    <div className={`space-y-${compact ? '4' : '6'}`}>
      {/* Art Style */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Art Style</label>
        {compact ? (
          <select
            value={ART_STYLES.find(s => s.prompt === guide.artStyle)?.id || ""}
            onChange={(e) => {
              const style = ART_STYLES.find(s => s.id === e.target.value);
              update("artStyle", style?.prompt || "");
            }}
            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
          >
            <option value="">Select art style...</option>
            {ART_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {ART_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => update("artStyle", style.prompt)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  guide.artStyle === style.prompt
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 hover:border-primary/30"
                }`}
              >
                <p className="text-xs font-bold">{style.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{style.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Color Palette */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Color Palette</label>
        <input
          value={guide.colorPalette}
          onChange={(e) => update("colorPalette", e.target.value)}
          className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-primary focus:border-primary"
          placeholder="e.g., warm pastels, vibrant primary colors, muted earth tones"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {["Vibrant & Colorful", "Warm Pastels", "Cool Ocean Tones", "Earthy & Natural", "Bold Primary", "Soft Sunset"].map((p) => (
            <button key={p} onClick={() => update("colorPalette", p.toLowerCase())} className="px-2 py-1 rounded-full bg-slate-100 text-[10px] font-medium hover:bg-primary/20 hover:text-primary transition-colors">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Characters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Characters</label>
          <button
            onClick={() => setShowCharForm(true)}
            className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Character
          </button>
        </div>

        {guide.characters.length === 0 && !showCharForm && (
          <p className="text-xs text-slate-400 italic">No characters defined. Add characters for consistent illustrations across all pages.</p>
        )}

        <div className="space-y-2">
          {guide.characters.map((char, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <input
                  value={char.name}
                  onChange={(e) => updateCharacter(idx, "name", e.target.value)}
                  className="font-bold text-sm bg-transparent focus:outline-none focus:underline decoration-primary"
                  placeholder="Character Name"
                />
                <button onClick={() => removeCharacter(idx)} className="text-slate-400 hover:text-red-500">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <textarea
                value={char.visualDescription}
                onChange={(e) => updateCharacter(idx, "visualDescription", e.target.value)}
                className="w-full bg-white rounded-lg border border-slate-200 px-3 py-2 text-xs resize-none min-h-[60px] focus:ring-primary focus:border-primary"
                placeholder="Physical appearance: hair color, eye color, clothing, proportions, distinguishing features..."
              />
            </div>
          ))}
        </div>

        {showCharForm && (
          <div className="mt-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
            <input
              value={newCharName}
              onChange={(e) => setNewCharName(e.target.value)}
              className="w-full bg-white rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold mb-2 focus:ring-primary focus:border-primary"
              placeholder="Character name"
              autoFocus
            />
            <textarea
              value={newCharDesc}
              onChange={(e) => setNewCharDesc(e.target.value)}
              className="w-full bg-white rounded-lg border border-slate-200 px-3 py-2 text-xs resize-none min-h-[60px] mb-2 focus:ring-primary focus:border-primary"
              placeholder="Visual description: a small brown bunny with big floppy ears, wearing a red jacket..."
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowCharForm(false); setNewCharName(""); setNewCharDesc(""); }} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button onClick={addCharacter} disabled={!newCharName.trim()} className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
                Add Character
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Environment & Additional Rules */}
      {!compact && (
        <>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Environment / Setting Rules</label>
            <input
              value={guide.environmentRules}
              onChange={(e) => update("environmentRules", e.target.value)}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-primary focus:border-primary"
              placeholder="e.g., cozy cottage in a forest, sunny seaside town, magical kingdom"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Additional Style Rules</label>
            <textarea
              value={guide.additionalRules}
              onChange={(e) => update("additionalRules", e.target.value)}
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-primary focus:border-primary min-h-[60px] resize-none"
              placeholder="e.g., always include butterflies, use rounded shapes, no text on illustrations..."
            />
          </div>
        </>
      )}
    </div>
  );
}
