import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Community() {
  const { user } = useAuth();
  const [showcaseBooks, setShowcaseBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, "showcase"), orderBy("createdAt", "desc"), limit(20));
        const snap = await getDocs(q);
        setShowcaseBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        // No showcase collection yet — that's ok
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Community Showcase</h2>
          <p className="text-slate-500 mt-1">Discover books from fellow authors and get inspired.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      ) : showcaseBooks.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">groups</span>
          <h3 className="text-xl font-bold mb-2">Community Coming Soon</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            The community showcase will feature published books from AI Publisher authors.
            Once you publish your first book, you'll be able to share it here!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showcaseBooks.map((book) => (
            <div key={book.id} className="bg-white rounded-xl border border-primary/10 overflow-hidden hover:shadow-lg transition-all">
              {book.coverUrl && (
                <div className="aspect-4/3 bg-slate-100">
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{book.genre}</p>
                <h3 className="font-bold text-lg mb-1">{book.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{book.description}</p>
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                    {book.authorName?.charAt(0) || "?"}
                  </div>
                  <span className="text-xs text-slate-500">{book.authorName || "Anonymous"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
