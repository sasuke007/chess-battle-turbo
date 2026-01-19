import { Mail, Star } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full mt-20 border-t border-white/5 bg-neutral-950/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-4 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                <Star className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-2xl font-bold tracking-tighter text-white">
                Chess Battle Turbo
              </span>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm">
              The world's most advanced AI-powered chess training platform. 
              Experience legendary positions, real-time coaching, and master the game like never before.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 group">
                <Mail className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Links Sections - Flex Row on Mobile */}
          <div className="lg:col-span-4 flex flex-row gap-8 sm:gap-12 lg:gap-8">
            {/* Quick Links */}
            <div className="flex-1 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Product</h3>
              <ul className="space-y-4">
                {["Features", "AI Tools", "Pricing", "Changelog"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center group">
                      <span className="w-0 h-px bg-indigo-500 mr-0 group-hover:w-2 group-hover:mr-2 transition-all duration-300"></span>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div className="flex-1 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Resources</h3>
              <ul className="space-y-4">
                {["Documentation", "Support", "Terms", "Privacy"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center group">
                      <span className="w-0 h-px bg-indigo-500 mr-0 group-hover:w-2 group-hover:mr-2 transition-all duration-300"></span>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Stay Updated</h3>
            <p className="text-sm text-neutral-400">
              Get the latest updates on new grandmaster positions and AI feature releases.
            </p>
            <form className="relative group">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all"
              />
              <button className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-20 pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-[11px] font-medium uppercase tracking-widest text-neutral-500">
            <p>© 2026 Chess Battle Turbo</p>
            <span className="hidden sm:block w-1 h-1 bg-neutral-800 rounded-full"></span>
            <p>All Rights Reserved</p>
          </div>
          <div className="flex items-center gap-8">
            {["Terms", "Privacy", "Cookies"].map((item) => (
              <a key={item} href="#" className="text-[11px] font-medium uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
