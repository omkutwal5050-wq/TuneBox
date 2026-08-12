import React, { useState, useContext } from 'react';
import { Search as SearchIcon, Play, Pause, Heart } from 'lucide-react';
import { PlayerContext, mockSongs } from '../context/Playercontext';

export default function Search() {
  const [query, setQuery] = useState('');
  const { currentTrack, isPlaying, playTrack, likedSongIds, toggleLike } = useContext(PlayerContext);

  const filteredSongs = mockSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.artist.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="flex-1 bg-[#0B0F17] overflow-y-auto p-8 space-y-8 select-none">
      {/* Search Input Header */}
      <div className="relative max-w-md">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to listen to?" 
          className="w-full bg-[#111827] text-white placeholder-slate-400 pl-12 pr-4 py-3 rounded-full border border-gray-800 focus:outline-none focus:border-[#10B981] transition"
        />
      </div>

      {/* Results or Browse Categories */}
      {query.trim() !== '' ? (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Search Results</h2>
          {filteredSongs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredSongs.map((song) => {
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
          ) : (
            <p className="text-slate-400 text-sm">No songs found matching "{query}"</p>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Browse All</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: 'Podcasts', color: 'bg-pink-600' },
              { name: 'Made For You', color: 'bg-indigo-600' },
              { name: 'Charts', color: 'bg-purple-600' },
              { name: 'New Releases', color: 'bg-[#10B981]' },
              { name: 'Discover', color: 'bg-blue-600' },
              { name: 'Live Events', color: 'bg-amber-600' }
            ].map((cat, idx) => (
              <div 
                key={idx} 
                className={`${cat.color} aspect-square rounded-xl p-4 font-bold text-lg text-white shadow-lg cursor-pointer hover:scale-105 transition flex items-start justify-between overflow-hidden relative`}
              >
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}