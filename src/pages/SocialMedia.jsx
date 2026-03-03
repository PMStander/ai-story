export default function SocialMedia() {
  const platforms = [
    { name: "Instagram", icon: "photo_camera", followers: "12.4K", posts: 24, engagement: "4.2%" },
    { name: "TikTok", icon: "play_circle", followers: "8.7K", posts: 18, engagement: "6.8%" },
    { name: "Pinterest", icon: "push_pin", followers: "5.2K", posts: 42, engagement: "3.1%" },
    { name: "Twitter/X", icon: "tag", followers: "3.9K", posts: 56, engagement: "2.4%" },
  ];

  const scheduledPosts = [
    { platform: "Instagram", type: "Carousel", title: "5 Tips for Potty Training", date: "Today, 2:00 PM", status: "Scheduled" },
    { platform: "TikTok", type: "Video", title: "Behind the Scenes: Book Cover", date: "Tomorrow, 10:00 AM", status: "Draft" },
    { platform: "Pinterest", type: "Pin", title: "Healthy Recipes Infographic", date: "Mar 5, 9:00 AM", status: "Scheduled" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Social Media Toolkit</h2>
          <p className="text-slate-500 mt-1">AI-powered content creation and scheduling for book promotion.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">edit_square</span>
          Create Post
        </button>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {platforms.map((p) => (
          <div key={p.name} className="bg-white p-5 rounded-xl border border-primary/10 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">{p.icon}</span>
              </div>
              <div>
                <h4 className="font-bold text-sm">{p.name}</h4>
                <p className="text-xs text-slate-500">{p.followers} followers</p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-xs text-slate-400">Posts</p>
                <p className="font-bold">{p.posts}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Engagement</p>
                <p className="font-bold text-primary">{p.engagement}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Content Generator */}
      <section className="bg-white rounded-xl border border-primary/10 p-6 mb-8">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">auto_awesome</span>
          AI Content Generator
        </h3>
        <div className="flex gap-4">
          <textarea
            className="flex-1 rounded-xl border-slate-200 bg-slate-50 p-4 text-sm focus:ring-primary focus:border-primary min-h-[80px] resize-none"
            placeholder="Describe what you want to post about... AI will generate platform-optimized content."
          />
          <button className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 self-end shadow-lg shadow-primary/20">
            Generate
          </button>
        </div>
      </section>

      {/* Scheduled Posts */}
      <div className="bg-white rounded-xl border border-primary/10 overflow-hidden">
        <div className="p-6 border-b border-primary/5">
          <h3 className="font-bold">Scheduled Posts</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {scheduledPosts.map((post) => (
            <div key={post.title} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">{post.type === "Video" ? "play_circle" : post.type === "Pin" ? "push_pin" : "view_carousel"}</span>
                </div>
                <div>
                  <p className="font-bold text-sm">{post.title}</p>
                  <p className="text-xs text-slate-500">{post.platform} · {post.type} · {post.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${post.status === "Scheduled" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {post.status}
                </span>
                <button className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">more_vert</span></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
