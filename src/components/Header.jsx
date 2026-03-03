export default function Header({ title, subtitle }) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-primary/10 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 rounded-xl border-none bg-primary/5 focus:ring-2 focus:ring-primary/50 text-sm"
            placeholder="Search your library..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-primary/5 text-slate-500">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="h-8 w-px bg-primary/10"></div>
        <button className="flex items-center gap-2 pl-2 rounded-full hover:bg-primary/5 transition-colors">
          <span className="text-sm font-medium">Alex Rivera</span>
          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">
              account_circle
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
