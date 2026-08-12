import React from 'react';
import { Play, SkipBack, SkipForward, Volume2, Repeat, Shuffle } from 'lucide-react';

export default function Player() {
  return (
    <footer className="h-20 bg-[#111827] border-t border-gray-800/60 px-6 flex items-center justify-between z-20 shrink-0">
      {/* Track Info */}
      <div className="flex items-center gap-3 w-1/4">
        <img 
          src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=100&q=80" 
          alt="Current Track" 
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div className="overflow-hidden">
          <h4 className="text-sm font-semibold text-white truncate">Midnight Coding</h4>
          <p className="text-xs text-slate-400 truncate">Lo-Fi Producer</p>
        </div>
      </div>

      {/* Playback Controls & Progress Bar */}
      <div className="flex flex-col items-center gap-2 w-2/4 max-w-md">
        <div className="flex items-center gap-6">
          <button className="text-slate-400 hover:text-white transition cursor-pointer"><Shuffle size={16} /></button>
          <button className="text-slate-400 hover:text-white transition cursor-pointer"><SkipBack size={18} /></button>
          <button className="w-8 h-8 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-105 transition cursor-pointer">
            <Play size={16} className="fill-current ml-0.5" />
          </button>
          <button className="text-slate-400 hover:text-white transition cursor-pointer"><SkipForward size={18} /></button>
          <button className="text-slate-400 hover:text-white transition cursor-pointer"><Repeat size={16} /></button>
        </div>
        <div className="w-full flex items-center gap-3 text-xs text-slate-400">
          <span>1:24</span>
          <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden cursor-pointer">
            <div className="w-1/3 h-full bg-[#10B981]"></div>
          </div>
          <span>3:45</span>
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center justify-end gap-3 w-1/4">
        <Volume2 size={18} className="text-slate-400" />
        <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden cursor-pointer">
          <div className="w-2/3 h-full bg-gray-400"></div>
        </div>
      </div>
    </footer>
  );
}