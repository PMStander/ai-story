/**
 * PuzzleViewer — renders a puzzle page or its answer key.
 * Displays the SVG inline and provides toggle + download.
 */
import { useState } from "react";

export default function PuzzleViewer({ puzzle, compact = false }) {
  const [showAnswer, setShowAnswer] = useState(false);

  if (!puzzle) return null;

  const { title, svgPuzzle, svgAnswer, placedCount, totalWords, text } = puzzle;
  const currentImage = showAnswer ? svgAnswer : svgPuzzle;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = currentImage;
    a.download = `${title || "puzzle"}_${showAnswer ? "answer" : "puzzle"}.png`;
    a.click();
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${compact ? "" : "shadow-sm"}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-primary text-sm">
            {puzzle.puzzleType === "word-search" ? "search" : "grid_on"}
          </span>
          <p className="font-bold text-sm truncate">{title}</p>
          {placedCount !== undefined && (
            <span className="text-[10px] text-slate-400 font-medium shrink-0">
              {placedCount}/{totalWords} words
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Puzzle / Answer toggle */}
          {svgAnswer && (
            <div className="flex bg-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => setShowAnswer(false)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                  !showAnswer ? "bg-white text-slate-700 shadow-sm" : "text-slate-400"
                }`}
              >
                Puzzle
              </button>
              <button
                onClick={() => setShowAnswer(true)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                  showAnswer ? "bg-red-500 text-white shadow-sm" : "text-slate-400"
                }`}
              >
                Answer Key
              </button>
            </div>
          )}
          {/* Download */}
          <button
            onClick={handleDownload}
            title="Download as PNG"
            className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-base">download</span>
          </button>
        </div>
      </div>

      {/* Clue count info */}
      {text && (
        <div className="px-4 py-1.5 text-[10px] text-slate-400 bg-slate-50 border-b border-slate-100">
          {text}
        </div>
      )}

      {/* SVG Puzzle / Answer */}
      <div className="overflow-auto p-2 bg-white">
        {currentImage ? (
          <img
            src={currentImage}
            alt={showAnswer ? `${title} — Answer Key` : title}
            className="max-w-full h-auto mx-auto block"
            style={{ imageRendering: "crisp-edges" }}
          />
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-300">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl">grid_on</span>
              <p className="text-xs mt-2">Generating puzzle...</p>
            </div>
          </div>
        )}
      </div>

      {/* Answer key tag */}
      {showAnswer && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-400 text-sm">key</span>
          <p className="text-[11px] text-red-600 font-medium">Answer Key — letters shown in red</p>
        </div>
      )}
    </div>
  );
}
