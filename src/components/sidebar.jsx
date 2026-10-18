import React from 'react';
import { Home, Search, Library, Radio, Clock3, Sparkles, Menu, Smile, Upload } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, collapsed, onToggle, isAdmin }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Your Library', icon: Library },
    { id: 'recent', label: 'Recently Played', icon: Clock3 },
    { id: 'recommended', label: 'Recommended', icon: Sparkles },
    { id: 'radio', label: 'Radio', icon: Radio },
    { id: 'mood', label: 'Mood', icon: Smile },
  ];
  if (isAdmin) {
    navItems.push({ id: 'upload', label: 'Upload Song', icon: Upload });
  }

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-[#111827] border-r border-gray-800/60 p-4 md:p-6 flex flex-col justify-between shrink-0 select-none z-10 transition-all duration-200`}>
      <div className="space-y-8">
        <button onClick={onToggle} className="mb-2 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <Menu size={22} />
        </button>
        {/* Brand Logo */}
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10B981] to-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <Radio className="text-slate-950" size={20} />
          </div>
          <span className={`${collapsed ? 'hidden' : ''} text-xl font-bold tracking-wider text-white`}>
            TUNE<span className="text-[#10B981]">BOX</span>
          </span>
        </div>

        {/* Main Nav */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                  isActive 
                    ? 'bg-[#10B981]/10 text-[#10B981]' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon size={20} />
                <span className={collapsed ? 'hidden' : ''}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}