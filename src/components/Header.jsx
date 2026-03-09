import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import DayNightToggle from "./DayNightToggle";

export default function Header() {
  const { user, signOut } = useAuth();

  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const photoURL = user?.photoURL;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-16 border-b border-primary/5 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/90 backdrop-blur flex items-center justify-between px-6 shrink-0 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <span className="material-symbols-outlined text-slate-400">search</span>
        <input
          className="bg-transparent text-sm w-full max-w-md focus:outline-none placeholder:text-slate-400 dark:text-slate-100"
          placeholder="Search your library..."
        />
      </div>
      <div className="flex items-center gap-4">
        {/* Theme toggle */}
        <DayNightToggle />

        <button className="relative p-2 hover:bg-primary/5 rounded-xl transition-colors">
          <span className="material-symbols-outlined text-slate-500 dark:text-slate-300">notifications</span>
          <span className="absolute top-1.5 right-1.5 size-2 bg-primary rounded-full" />
        </button>
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl px-3 py-1.5 transition-colors"
          >
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{displayName}</span>
            {photoURL ? (
              <img src={photoURL} alt="" className="size-8 rounded-full object-cover" />
            ) : (
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {initials}
              </div>
            )}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-primary/10 dark:border-slate-700 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-bold dark:text-white">{displayName}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                onClick={() => { navigate("/settings"); setDropdownOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 dark:hover:bg-primary/10 dark:text-slate-200 flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-lg text-slate-400">settings</span>
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
