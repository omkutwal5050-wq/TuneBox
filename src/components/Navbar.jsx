import React from 'react';
import { Search, Bell } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 border-b border-gray-800/50 flex items-center justify-between px-8 bg-[#0B0F17]/80 backdrop-blur-md sticky top-0 z-10">
      {/* Search Bar */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="What do you want to play?" 
          className="w-full bg-gray-900 border border-gray-800 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#10B981] transition"
        />
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-white hover:bg-gray-800 rounded-full transition cursor-pointer">
          <Bell size={20} />
        </button>
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full p-1 pr-3 cursor-pointer hover:border-gray-700 transition">
          <div className="w-7 h-7 bg-emerald-500/20 text-[#10B981] rounded-full flex items-center justify-center font-bold text-xs">
            U
          </div>
          <span className="text-sm font-medium text-gray-200">User</span>
        </div>
      </div>
    </header>
  );
}