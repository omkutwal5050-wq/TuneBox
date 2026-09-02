import React, { useContext, useState, useEffect } from 'react';
import { Play, Pause, Heart, Search as SearchIcon, Loader2 } from 'lucide-react';
import { PlayerContext } from '../context/Playercontext';
import { mockSongs } from '../data/songsData';

export default function Search() {
  const { currentTrack, isPlaying, playTrack, toggleLike, likedSongIds } = useContext(PlayerContext);
  const [localQuery, setLocalQuery] = useState('');
  const [apiResults, setApiResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const localFiltered = mockSongs.filter((song) => {
    if (!localQuery.trim()) return false;
    return (
      song.title.toLowerCase().includes(localQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(localQuery.toLowerCase()) ||
      song.genre?.toLowerCase().includes(localQuery.toLowerCase())
    );
  });

  useEffect(() => {
    if (!localQuery.trim() || localQuery.length < 2) {
      setApiResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/proxy/search?query=${encodeURIComponent(localQuery)}`);
        const json = await res.json();

        console.log("Raw Proxy JSON Response:", json);

        // Access the 'results' array sent from the Deezer backend proxy
        const resultsArray = json?.results || [];

        const formatted = resultsArray.map((song) => ({
          id: song.id,
          title: song.title || 'Unknown Title',
          artist: song.artist || 'Unknown Artist',
          cover: song.cover || '',
          file: song.file || '',
          genre: song.genre || 'Deezer'
        }));

        setApiResults(formatted);
      } catch (err) {
        console.error('Failed to fetch from backend proxy:', err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localQuery]);

  const combinedResults = [...localFiltered, ...apiResults];

  return (
    <div className="flex-1 bg-[#0B0F17] overflow-y-auto p-6 md:p-8 space-y-6">
      <div className="relative max-w-xl">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-neutral-400">
          <SearchIcon size={20} />
        </span>
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Search millions of songs, artists, or genres..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-12 pr-6 py-3.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition shadow-inner"
          autoFocus
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-wide">
            {localQuery ? `Search Results for "${localQuery}"` : "Explore All Songs"}
          </h2>
          {loading && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <Loader2 className="animate-spin" size={16} />
              <span>Searching global catalog...</span>
            </div>
          )}
        </div>

        {combinedResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {combinedResults.map((song) => {
              const isCurrent = currentTrack?.id === song.id;
              const isLiked = likedSongIds.includes(song.id);

              return (
                <div
                  key={song.id}
                  className="group bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 rounded-xl p-4 transition-all duration-300 shadow-md flex flex-col gap-3"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-800">
                    <img
                      src={song.cover}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <button
                      onClick={() => playTrack(song)}
                      className={`absolute bottom-3 right-3 w-12 h-12 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center text-black shadow-xl transition-all duration-200 transform ${
                        isCurrent && isPlaying ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'
                      }`}
                    >
                      {isCurrent && isPlaying ? <Pause size={20} /> : <Play size={20} fill="black" />}
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-2 mt-1">
                    <div className="overflow-hidden">
                      <h3 className="font-semibold text-white truncate">{song.title}</h3>
                      <p className="text-xs text-neutral-400 truncate">{song.artist}</p>
                    </div>
                    <button
                      onClick={() => toggleLike(song.id)}
                      className={`text-neutral-400 hover:text-rose-500 transition shrink-0 ${isLiked ? 'text-rose-500' : ''}`}
                    >
                      <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !loading && localQuery.trim() !== '' && (
            <div className="text-center py-20 text-neutral-500">
              <p className="text-lg">No tracks found matching "{localQuery}".</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}