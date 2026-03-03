import { NavLink } from "react-router-dom";

const navItems = [
  { icon: "dashboard", label: "All Projects", to: "/" },
  { icon: "edit_note", label: "Story Studio", to: "/story-studio" },
  { icon: "description", label: "Story Outline", to: "/story-outline" },
  { icon: "brush", label: "Illustration Studio", to: "/illustration-studio" },
  { icon: "library_books", label: "Series Manager", to: "/series-manager" },
  { icon: "search", label: "Niche Research", to: "/niche-research" },
  { icon: "folder_open", label: "Asset Library", to: "/asset-library" },
  { icon: "campaign", label: "Ads Manager", to: "/ads-manager" },
  { icon: "share", label: "Social Media", to: "/social-media" },
  { icon: "bar_chart", label: "Analytics", to: "/analytics" },
  { icon: "groups", label: "Community", to: "/community" },
  { icon: "publish", label: "Publishing", to: "/publishing" },
  { icon: "credit_card", label: "Subscription", to: "/subscription" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-primary/10 bg-white flex flex-col flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined">auto_stories</span>
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">AI Publisher</h1>
            <p className="text-xs text-slate-500">Content Engine</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? "sidebar-item-active"
                    : "text-slate-600 hover:bg-primary/5"
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-6">
        <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">add</span>
          <span className="text-sm">New Project</span>
        </button>
      </div>
    </aside>
  );
}
