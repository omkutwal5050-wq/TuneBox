import React, { useContext } from 'react';
import { Heart, Music, Play, Pause } from 'lucide-react';
import { PlayerContext, mockSongs } from '../context/Playercontext';

export default function Library() {
  const { currentTrack, isPlaying, playTrack, likedSongIds, toggleLike } = useContext(PlayerContext);

  const likedSongs = mockSongs.filter((s) => likedSongIds.includes(s.id));

  return (
    <main className="flex-1 bg-[#0B0F17] overflow-y-auto p-8 space-y-8 select-none">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Library</h1>
      </div>

      {/* Liked Songs List */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/20 text-red-500 rounded-lg">
            <Heart size={20} className="fill-current" />
          </div>
          <h2 className="text-xl font-bold text-white">Liked Songs ({likedSongs.length})</h2>
        </div>

        {likedSongs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {likedSongs.map((song) => {
              const isCurrentPlaying = currentTrack?.id === song.id && isPlaying;

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
                      className="text-red-500 transition cursor-pointer hover:scale-110"
                    >
                      <Heart size={16} className="fill-current" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">You haven't liked any songs yet. Click the heart icon on any track to save it here!</p>
        )}
      </div>
    </main>
  );
}