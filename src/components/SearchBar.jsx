import React, { useContext } from 'react';
import { Search, X } from 'lucide-react';
import { PlayerContext } from '../context/Playercontext';

export default function SearchBar() {
  const { searchQuery, setSearchQuery, selectedGenre, setSelectedGenre } = useContext(PlayerContext);
  const genres = ['All', 'Lo-Fi', 'Synthwave', 'Ambient'];

  return (
    <div className="w-full space-y-3 mb-6">
      {/* Search Input */}
      <div className="relative w-full max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text"
          placeholder="Search by song title or artist..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1F2937] text-white text-sm rounded-xl pl-10 pr-10 py-2.5 border border-gray-800 focus:border-[#10B981] focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-2">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              selectedGenre === genre
                ? 'bg-[#10B981] text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
}