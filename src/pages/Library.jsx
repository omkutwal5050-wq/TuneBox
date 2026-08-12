import React, { useContext } from 'react';
import { Heart, Music, Play } from 'lucide-react';
import { PlayerContext } from '../context/Playercontext';

export default function Library() {
  const { currentTrack, playTrack } = useContext(PlayerContext);

  return (
    <main className="flex-1 bg-[#0B0F17] overflow-y-auto p-8 space-y-8 select-none">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Library</h1>
      </div>

      {/* Quick Playlists Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl flex flex-col justify-between h-48 cursor-pointer hover:scale-[1.02] transition">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Heart size={24} className="fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Liked Songs</h3>
              <p className="text-xs text-slate-400">12 tracks</p>
            </div>
          </div>
          <p className="text-xs text-slate-300">Your favorite tracks, saved in one place.</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 p-6 rounded-2xl border border-emerald-500/20 shadow-xl flex flex-col justify-between h-48 cursor-pointer hover:scale-[1.02] transition">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
              <Music size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Daily Coding Mix</h3>
              <p className="text-xs text-slate-400">Playlist • 4 tracks</p>
            </div>
          </div>
          <p className="text-xs text-slate-300">Curated instrumental beats and synth ambient.</p>
        </div>
      </div>
    </main>
  );
}