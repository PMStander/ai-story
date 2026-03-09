import { NavLink, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const globalNavItems = [
  { icon: "auto_awesome", label: "✨ Create Book", to: "/book-wizard", highlight: true },
  { icon: "dashboard", label: "All Projects", to: "/" },
  { icon: "library_books", label: "Series Manager", to: "/series-manager" },
  { icon: "search", label: "Niche Research", to: "/niche-research" },
  { icon: "folder_open", label: "Asset Library", to: "/asset-library" },
  { icon: "credit_card", label: "Subscription", to: "/subscription" },
];

const projectNavItems = [
  { icon: "edit_note", label: "Story Studio", to: "/story-studio" },
  { icon: "description", label: "Story Outline", to: "/story-outline" },
  { icon: "brush", label: "Illustration Studio", to: "/illustration-studio" },
  { icon: "campaign", label: "Ads Manager", to: "/ads-manager" },
  { icon: "share", label: "Social Media", to: "/social-media" },
  { icon: "bar_chart", label: "Analytics", to: "/analytics" },
  { icon: "groups", label: "Community", to: "/community" },
  { icon: "publish", label: "Publishing", to: "/publishing" },
];

export default function Sidebar() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const photoURL = user?.photoURL;

  return (
    <aside className="w-64 border-r border-primary/10 bg-white dark:bg-slate-900 dark:border-slate-700/50 flex flex-col flex-shrink-0 transition-colors">
      <div className="p-6 overflow-y-auto flex-1">
        <div className="flex items-center gap-2 mb-8">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined">auto_stories</span>
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight dark:text-white">AI Publisher</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Content Engine</p>
          </div>
        </div>

        <nav className="flex flex-col gap-6">
          {/* Global Section */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-3">Main Menu</p>
            <div className="flex flex-col gap-1">
              {globalNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                      isActive
                        ? "sidebar-item-active"
                        : "text-slate-600 dark:text-slate-300 hover:bg-primary/5 dark:hover:bg-primary/10"
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Project Specific Section */}
          {projectId && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3 px-3">Project Space</p>
              <div className="flex flex-col gap-1">
                {projectNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={`${item.to}?project=${projectId}`}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                        isActive
                          ? "sidebar-item-active"
                          : "text-slate-600 dark:text-slate-300 hover:bg-primary/5 dark:hover:bg-primary/10"
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* User profile + Settings + Theme toggle */}
      <div className="mt-auto border-t border-primary/5 dark:border-slate-700/50 bg-white dark:bg-slate-900 transition-colors">
        {/* Theme toggle */}
        <div className="px-6 py-2 flex items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {isDark ? "Dark mode" : "Light mode"}
          </span>
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isDark ? "bg-primary" : "bg-slate-200"}`}
            aria-label="Toggle theme"
          >
            <span
              className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${isDark ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors ${
              isActive ? "text-primary bg-primary/5" : "text-slate-500 dark:text-slate-400 hover:bg-primary/5 dark:hover:bg-primary/10"
            }`
          }
        >
          <span className="material-symbols-outlined text-xl">settings</span>
          <span>Settings</span>
        </NavLink>
        <div className="px-6 py-4 flex items-center gap-3">
          {photoURL ? (
            <img src={photoURL} alt="" className="size-8 rounded-full object-cover" />
          ) : (
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate dark:text-white">{displayName}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
