import React from 'react';
import { Home, Search, Library, Plus, Heart, Music } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#111827] h-full flex flex-col justify-between p-4 border-r border-gray-800/50 select-none shrink-0">
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-[#10B981] flex items-center justify-center text-slate-950 font-bold">
            <Music size={22} className="stroke-[2.5]" />
          </div>
          <span className="text-xl font-extrabold tracking-wide text-white">TuneBox</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          <a href="#" className="flex items-center gap-4 text-white bg-gray-800/60 px-3 py-2.5 rounded-lg font-medium transition">
            <Home size={20} className="text-[#10B981]" /> Home
          </a>
          <a href="#" className="flex items-center gap-4 text-slate-400 hover:text-white px-3 py-2.5 rounded-lg font-medium hover:bg-gray-800/30 transition">
            <Search size={20} /> Search
          </a>
          <a href="#" className="flex items-center gap-4 text-slate-400 hover:text-white px-3 py-2.5 rounded-lg font-medium hover:bg-gray-800/30 transition">
            <Library size={20} /> Your Library
          </a>
        </nav>

        {/* Quick Actions / Playlists */}
        <div className="pt-4 border-t border-gray-800/60 space-y-3">
          <button className="w-full flex items-center gap-3 text-slate-400 hover:text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800/30 transition cursor-pointer">
            <div className="p-1.5 bg-gray-800 rounded">
              <Plus size={16} />
            </div>
            Create Playlist
          </button>
          <button className="w-full flex items-center gap-3 text-slate-400 hover:text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800/30 transition cursor-pointer">
            <div className="p-1.5 bg-emerald-500/20 text-[#10B981] rounded">
              <Heart size={16} />
            </div>
            Liked Songs
          </button>
        </div>
      </div>
    </aside>
  );
}