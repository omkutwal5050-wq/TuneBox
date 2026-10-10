import React, { useState } from 'react';
import { Bell } from 'lucide-react';

export default function Navbar({ currentUser, onOpenAuth, onLogout, onViewProfile, onViewHome }) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="h-16 border-b border-gray-800/50 flex items-center justify-between px-8 bg-[#0B0F17]/80 backdrop-blur-md sticky top-0 z-10">
      {/* App Logo - Click to go Home */}
      <h1 
        onClick={onViewHome}
        className="text-xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer tracking-wide"
      >
        TuneBox
      </h1>


      {/* User Actions & Auth State */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-white hover:bg-gray-800 rounded-full transition cursor-pointer">
          <Bell size={20} />
        </button>

        {currentUser ? (
          <div className="relative">
            {/* Clickable Username Container */}
            <div 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full p-1 pr-3 cursor-pointer hover:border-[#10B981] transition"
            >
              <div className="w-7 h-7 bg-emerald-500/20 text-[#10B981] rounded-full flex items-center justify-center font-bold text-xs">
                {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
              </div>
              <span className="text-sm font-medium text-gray-200">{currentUser.username}</span>
              <span className="text-xs text-slate-400">▼</span>
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-2 z-50">
                <button 
                  onClick={() => {
                    setShowDropdown(false);
                    if (onViewProfile) onViewProfile();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-gray-200 transition flex items-center gap-2 cursor-pointer"
                >
                  👤 My Profile
                </button>
                <div className="border-t border-gray-800 my-1"></div>
                <button 
                  onClick={() => {
                    setShowDropdown(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-sm text-red-400 transition flex items-center gap-2 cursor-pointer"
                >
                  🚪 Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="bg-[#10B981] hover:bg-[#0e9f6e] text-black text-sm font-semibold px-5 py-2 rounded-full transition cursor-pointer shadow-lg shadow-emerald-900/20"
          >
            Log In / Sign Up
          </button>
        )}
      </div>
    </header>
  );
}