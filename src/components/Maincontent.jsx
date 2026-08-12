import React, { useContext } from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { PlayerContext } from '../context/Playercontext';
import { mockSongs } from '../data/songsData';

export default function MainContent() {
  const { currentTrack, isPlaying, playTrack, toggleLike, likedSongIds, selectedGenre, setSelectedGenre } = useContext(PlayerContext);

  const featuredTrack = mockSongs[0];

  return (
    <main className="flex-1 bg-[#0B0F17] overflow-y-auto p-6 md:p-8 space-y-8">
      {/* Featured Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-neutral-900 p-8 border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl overflow-hidden">
        <div className="space-y-3 z-10 max-w-lg">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800/50">
            Featured Track
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            {featuredTrack.title}
          </h1>
          <p className="text-sm text-neutral-300">
            {featuredTrack.artist} • <span className="text-neutral-400">{featuredTrack.genre}</span>
          </p>
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => playTrack(featuredTrack)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-full flex items-center gap-2 shadow-lg transition transform hover:scale-105"
            >
              {currentTrack?.id === featuredTrack.id && isPlaying ? (
                <>
                  <Pause size={18} /> Pause
                </>
              ) : (
                <>
                  <Play size={18} fill="white" /> Play Now
                </>
              )}
            </button>
            <button
              onClick={() => toggleLike(featuredTrack.id)}
              className={`p-3 rounded-full border transition ${
                likedSongIds.includes(featuredTrack.id)
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-500'
                  : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white'
              }`}
            >
              <Heart size={20} fill={likedSongIds.includes(featuredTrack.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
        <div className="relative z-10">
          <img
            src={featuredTrack.cover}
            alt={featuredTrack.title}
            className="w-48 h-48 md:w-56 md:h-56 rounded-xl object-cover shadow-2xl border border-neutral-700/50"
          />
        </div>
      </div>

      {/* Genre Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['All', 'Lo-Fi', 'Synthwave', 'Ambient'].map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
              selectedGenre === genre
                ? 'bg-white text-black shadow-md'
                : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Song Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">Trending Songs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockSongs.map((song) => {
            const isCurrent = currentTrack?.id === song.id;
            const isLiked = likedSongIds.includes(song.id);

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
                    className={`text-neutral-400 hover:text-rose-500 transition ${isLiked ? 'text-rose-500' : ''}`}
                  >
                    <size size={18} />
                    <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
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