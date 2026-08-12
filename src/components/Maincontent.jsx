import React, { useContext } from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { PlayerContext, mockSongs } from '../context/Playercontext';

export default function MainContent() {
  const { currentTrack, isPlaying, playTrack, likedSongIds, toggleLike } = useContext(PlayerContext);

  const featuredTrack = mockSongs[0];

  return (
    <main className="flex-1 bg-[#0B0F17] overflow-y-auto p-8 space-y-8 select-none">
      {/* Featured Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-900/60 via-slate-900 to-slate-950 p-8 border border-emerald-500/20 shadow-xl flex items-center justify-between">
        <div className="max-w-md space-y-3 z-10">
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">Featured Playlist</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Daily Coding Mix</h1>
          <p className="text-sm text-slate-300">Curated instrumental beats, synth ambient, and smooth grooves to keep you in flow state.</p>
          <button 
            onClick={() => playTrack(featuredTrack)}
            className="mt-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-slate-950 font-bold text-sm rounded-full flex items-center gap-2 transition cursor-pointer hover:scale-105"
          >
            {currentTrack?.id === featuredTrack.id && isPlaying ? (
              <>
                <Pause size={18} className="fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={18} className="fill-current" />
                <span>Play Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recommended Songs Grid */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recommended Tracks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockSongs.map((song) => {
            const isCurrentPlaying = currentTrack?.id === song.id && isPlaying;
            const isLiked = likedSongIds.includes(song.id);

            return (
              <div 
                key={song.id} 
                onClick={() => playTrack(song)}
                className="group relative bg-[#111827]/60 hover:bg-[#1E293B]/80 p-4 rounded-xl border border-gray-800/60 transition cursor-pointer"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                  <img src={song.cover} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isCurrentPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className="w-10 h-10 rounded-full bg-[#10B981] text-slate-950 flex items-center justify-center shadow-lg">
                      {isCurrentPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-0.5" />}
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="overflow-hidden">
                    <h3 className={`text-sm font-semibold truncate ${currentTrack?.id === song.id ? 'text-[#10B981]' : 'text-white'}`}>{song.title}</h3>
                    <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(song.id);
                    }} 
                    className={`transition cursor-pointer ${isLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-400'}`}
                  >
                    <Heart size={16} className={isLiked ? 'fill-current' : ''} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}