import React, { useContext, useState, useEffect } from 'react';
import { Play, Pause, Heart, Search as SearchIcon, Loader2 } from 'lucide-react';
import { PlayerContext } from '../context/Playercontext';
import { mockSongs } from '../data/songsData';

export default function Search() {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    toggleLike,
    likedSongIds,
    recentSearches,
    rememberSearch
  } = useContext(PlayerContext);
  const [localQuery, setLocalQuery] = useState('');
  const [apiResults, setApiResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/proxy/search?query=${encodeURIComponent(localQuery)}`);
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
          audioSrc: song.audioSrc || song.file || '',
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

  const combinedResults = [...localFiltered, ...apiResults].reduce((uniqueSongs, song) => {
    const key = `${song.title || ''}:${song.artist || ''}`.trim().toLowerCase();
    const existingIndex = uniqueSongs.findIndex(existingSong => (
      `${existingSong.title || ''}:${existingSong.artist || ''}`.trim().toLowerCase() === key
    ));

    if (existingIndex === -1) {
      uniqueSongs.push(song);
      return uniqueSongs;
    }

    const existingSong = uniqueSongs[existingIndex];
    const existingScore = Number(Boolean(existingSong.cover)) + Number(Boolean(existingSong.audioSrc || existingSong.file));
    const songScore = Number(Boolean(song.cover)) + Number(Boolean(song.audioSrc || song.file));
    if (songScore > existingScore) uniqueSongs[existingIndex] = song;
    return uniqueSongs;
  }, []);

  const suggestions = [...combinedResults]
    .sort((a, b) => String(a.title).localeCompare(String(b.title)))
    .slice(0, 8);

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
          onFocus={() => setIsSearchFocused(true)}
          placeholder="Search millions of songs, artists, or genres..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-12 pr-6 py-3.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition shadow-inner"
          autoFocus
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              rememberSearch(localQuery);
              setIsSearchFocused(false);
              event.currentTarget.blur();
            }
          }}
        />
        {isSearchFocused && (recentSearches.length > 0 || suggestions.length > 0) && (
          <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
            {!localQuery.trim() && recentSearches.length > 0 && (
              <div className="border-b border-neutral-800 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Previous searches</p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(search => (
                    <button
                      key={search}
                      onMouseDown={() => {
                        setLocalQuery(search);
                        rememberSearch(search);
                      }}
                      className="rounded-full bg-neutral-800 px-3 py-1.5 text-left text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {suggestions.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Suggestions</p>
                {suggestions.map(song => (
                  <button
                    key={`${song.id}-${song.title}`}
                    onMouseDown={() => {
                      setLocalQuery(song.title);
                      rememberSearch(song.title);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-neutral-800"
                  >
                    <SearchIcon size={15} className="text-neutral-500" />
                    <span className="truncate text-sm text-neutral-200">{song.title}</span>
                    <span className="ml-auto truncate text-xs text-neutral-500">{song.artist}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {recentSearches.map(search => (
          <button
            key={search}
            onClick={() => {
              setLocalQuery(search);
              rememberSearch(search);
            }}
            className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-700"
          >
            {search}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {['All', 'Synthwave', 'Ambient', 'Pop', 'Bollywood'].map(genre => (
          <button
            key={genre}
            onClick={() => setLocalQuery(genre === 'All' ? '' : genre)}
            className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-400 hover:border-emerald-500 hover:text-emerald-400"
          >
            {genre}
          </button>
        ))}
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
              const isLiked = likedSongIds.some(id => String(id) === String(song.id));

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
                      onClick={() => playTrack(song, combinedResults)}
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
                      onClick={() => toggleLike(song.id, song)}
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