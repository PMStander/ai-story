export default function Dashboard() {
  const projects = [
    {
      id: 1,
      genre: "Non-Fiction",
      title: "Potty Training Guide",
      status: "Draft",
      progress: 60,
      lastEdit: "2h ago",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAdkvGqiO9eT2nIePXbnM0jAYhb6SDJ1fTr7C6NKj7IAMKb7_NAcKVcodZ6rXTs1NFpxMDW_g15-mMJYrXQh7jSCAadzsK0u9oYLGHmLA-f1HPnbj-sjBVaYCttv_fBjqxPGpnlpyXD7WUKgEquJvQYrpe8uTRqyKG5AW9RhVr84tHYpBaVss7hhlgIP4kkTcK8zouiTk0S6lz4cOFIElcXGT88dl4kdpWhpgqJHCEUdLffwU7FkHK0bvxJHk1c0KuXVj2jhhjWsgg",
    },
    {
      id: 2,
      genre: "Children's Fiction",
      title: "Bedtime Stories for Toddlers",
      status: "Generating",
      progress: 85,
      lastEdit: "1d ago",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD5puxHcnLojW5z5HkXzBSEMr8TRVbpwWIY7bezKfKcQrPrHrXug9CtKyApzxLMHztOJn2WEeZfT2uLcRhCB-PNKdHttvN4d8C2GkAP3WLcEveXTUR2y-PE2EvOXU4soXt5XCbrtKKwMSi8oT8cjjtjWpjhptjr00BdnmLkXLqf0glEYBJerCZJlkN80F4aDRkJ0cFBdKr700X17kWb3_aQuDR_8vAyFci_glPLrZrv1HkV_cfRA1bGwZE_E2d3rlWyEJUgf-9iahw",
    },
    {
      id: 3,
      genre: "Cooking",
      title: "Healthy Recipes for Busy Parents",
      status: "Researching",
      progress: 12,
      lastEdit: "Created: 3d ago",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mCJPnzz5-r3NyjWThi_-m6OvV1WK-yMD_dWhmR57Mi9vqcMf6beHeu0TUoC7PHskTo-kYpqC4yG8ToYBy0WFseB-YT21URQybvv4D6aB7ovDbUMp5L7UTpgiHQl52WwVBopemPY0tsZ861aRJ6fbbaDi4iHGKyXKUnJVqpF-9cdb1ig11j0LAPYnkrKw4gTLn81Vo0E0U90YWJvyDQfWl0JfCNQS-QzKPDUEJFMFBuZLchyjLPwCE2vIwdJk_R-Fxhh3BvdT6no",
    },
  ];

  const stats = [
    { label: "Total Books", value: "12" },
    { label: "Published (KDP)", value: "8" },
    { label: "Monthly Royalties", value: "$2,440" },
    { label: "AI Tokens Used", value: "45%" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Active Projects</h2>
          <p className="text-slate-500 mt-1">
            You have {projects.length} books currently in development.
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-primary/20 rounded-xl hover:border-primary transition-all shadow-sm">
          <span className="material-symbols-outlined text-primary">
            add_circle
          </span>
          <span className="text-sm font-bold text-primary">
            Create New Project
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex gap-5">
              <div className="w-32 h-44 rounded-lg bg-primary/10 overflow-hidden flex-shrink-0 relative border border-primary/5">
                <div
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url('${project.image}')` }}
                />
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-primary uppercase">
                  {project.status}
                </div>
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                      {project.genre}
                    </p>
                    <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                  </div>
                  <button className="text-slate-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>
                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 font-medium">
                      {project.progress}% Complete
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {project.lastEdit}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-primary/10 rounded-full mb-6">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 bg-primary text-white text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
                      <span className="material-symbols-outlined text-lg">
                        edit_square
                      </span>
                      Open Studio
                    </button>
                    <button className="px-3 bg-primary/5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                      <span className="material-symbols-outlined">
                        visibility
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-xl p-5 flex flex-col items-center justify-center group hover:bg-primary/10 transition-all cursor-pointer">
          <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl">add</span>
          </div>
          <p className="text-lg font-bold text-primary">Start New Project</p>
          <p className="text-sm text-primary/60 mt-1">
            AI-assisted book creation
          </p>
        </div>
      </div>

      <div className="mt-12">
        <h3 className="text-xl font-bold mb-6">Quick Insights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white p-6 rounded-xl border border-primary/5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-3xl font-black text-primary mt-1">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
