import React, { useContext } from 'react';
import { Play, Pause, Heart, Music } from 'lucide-react';
import { PlayerContext } from '../context/Playercontext';
import { mockSongs } from '../data/songsData';

export default function Library() {
  const { currentTrack, isPlaying, playTrack, toggleLike, likedSongIds } = useContext(PlayerContext);

  const likedSongs = mockSongs.filter((song) => likedSongIds.includes(song.id));

  return (
    <div className="flex-1 bg-[#0B0F17] overflow-y-auto p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-neutral-800">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center shadow-lg text-white">
          <Heart size={32} fill="white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Liked Songs</h1>
          <p className="text-sm text-neutral-400">{likedSongs.length} saved tracks in your library</p>
        </div>
      </div>

      {/* Liked Songs Grid */}
      {likedSongs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {likedSongs.map((song) => {
            const isCurrent = currentTrack?.id === song.id;

            return (
              <div
                key={song.id}
                className="group bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 rounded-xl p-4 transition-all duration-300 shadow-md flex flex-col gap-3"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                  <img
                    src={song.cover}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <button
                    onClick={() => playTrack(song)}
                    className={`absolute bottom-3 right-3 w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200 transform ${
                      isCurrent && isPlaying ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'
                    }`}
                  >
                    {isCurrent && isPlaying ? <Pause size={20} /> : <Play size={20} fill="white" />}
                  </button>
                </div>

                <div className="flex items-start justify-between gap-2 mt-1">
                  <div>
                    <h3 className="font-semibold text-white truncate max-w-[180px]">{song.title}</h3>
                    <p className="text-xs text-neutral-400 truncate max-w-[180px]">{song.artist}</p>
                  </div>
                  <button
                    onClick={() => toggleLike(song.id)}
                    className="text-rose-500 hover:text-neutral-400 transition"
                  >
                    <Heart size={18} fill="currentColor" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 space-y-4 text-neutral-500">
          <Music size={48} className="mx-auto opacity-40" />
          <p className="text-lg">No liked songs yet.</p>
          <p className="text-sm">Click the heart icon on any song to save it to your library.</p>
        </div>
      )}
    </div>
  );
}