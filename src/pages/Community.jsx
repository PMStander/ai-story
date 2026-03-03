export default function Community() {
  const showcaseItems = [
    {
      author: "Sarah Chen",
      title: "The Moonlit Garden",
      genre: "Children's Fiction",
      likes: 234,
      avatar: "S",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCZjZ5Mju9DsE-dxS42Gi_lEaNC6cD3-D_5zBhjUNJIUisIV1rVg1BvSVpuenq_FudhHbrYyabkoStvT6zakZBS_dQHCfOJ4fxGuXQer_qRnH_s2ylzst0X7IgFUoeBcxQ6fDDQqVMpLnIv5E_-vQNu89OeFuFDi89U2jXmT9zEBCPQ0MUeXDYaa2bj_sWvzatw-Fi_mL-oUgh6EqIIgCIPLWcz2kV0aB0P17nKG4RNv6a2Hz56--PFfKjtRZnrZlfmEnSfugI-J4",
    },
    {
      author: "Marcus Johnson",
      title: "Urban Jungle Cooking",
      genre: "Cookbook",
      likes: 189,
      avatar: "M",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mCJPnzz5-r3NyjWThi_-m6OvV1WK-yMD_dWhmR57Mi9vqcMf6beHeu0TUoC7PHskTo-kYpqC4yG8ToYBy0WFseB-YT21URQybvv4D6aB7ovDbUMp5L7UTpgiHQl52WwVBopemPY0tsZ861aRJ6fbbaDi4iHGKyXKUnJVqpF-9cdb1ig11j0LAPYnkrKw4gTLn81Vo0E0U90YWJvyDQfWl0JfCNQS-QzKPDUEJFMFBuZLchyjLPwCE2vIwdJk_R-Fxhh3BvdT6no",
    },
    {
      author: "Emily Wright",
      title: "Starfall Chronicles",
      genre: "Sci-Fi",
      likes: 312,
      avatar: "E",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQE-bJbK5m2qyxpEppKgPr1CIchJLc_hg9w0ZtxQ60O-bI6gPwAwyHj0B9KY0kxXX9RFUpzBSdPb7RJkk58ZHoe6fNaF4P9O512OM0_faJBBnFYnNIp07ldbOU7WdF0xHttcCHnCgQyTRyIRr58oPXPlU7hnf-TRpWpNB7-Ss8AdcO79OYKCZr0QvtwgxUFti3wEiaIG9Irkn6MkWoqiCMiaFw3yK2qBpw_8gG26yWDqLx2iev-awP0pltLERklGHSxBdCiAqAlR4",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Community Showcase</h2>
          <p className="text-slate-500 mt-1">Discover books created by fellow AI publishers.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">upload</span>
          Share Your Book
        </button>
      </div>

      {/* Featured */}
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 mb-8 border border-primary/10">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">star</span>
          <h3 className="font-bold text-primary uppercase text-sm tracking-wider">Featured This Week</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {showcaseItems.map((item) => (
            <div key={item.title} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group cursor-pointer">
              <div className="aspect-[3/2] overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{item.genre}</p>
                <h4 className="font-bold group-hover:text-primary transition-colors">{item.title}</h4>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{item.avatar}</div>
                    <span className="text-xs text-slate-500">{item.author}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <span className="material-symbols-outlined text-sm">favorite</span>
                    {item.likes}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Discussion */}
      <section className="bg-white rounded-xl border border-primary/10 p-6">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">forum</span>
          Recent Discussions
        </h3>
        <div className="space-y-4">
          {[
            { title: "Best AI prompts for children's book illustrations?", replies: 24, views: 342 },
            { title: "How I made $5K/month with KDP low-content books", replies: 56, views: 1203 },
            { title: "Tips for consistent character design across pages", replies: 18, views: 245 },
          ].map((topic) => (
            <div key={topic.title} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-sm">chat_bubble</span>
                </div>
                <span className="text-sm font-medium">{topic.title}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{topic.replies} replies</span>
                <span>{topic.views} views</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
