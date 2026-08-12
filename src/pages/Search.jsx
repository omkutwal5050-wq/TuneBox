import React, { useState, useContext } from 'react';
import { Search as SearchIcon, Play, Pause } from 'lucide-react';
import { PlayerContext } from '../context/Playercontext';

const searchCategories = [
  { name: 'Podcasts', color: 'bg-pink-600' },
  { name: 'Made For You', color: 'bg-indigo-600' },
  { name: 'Charts', color: 'bg-purple-600' },
  { name: 'New Releases', color: 'bg-[#10B981]' },
  { name: 'Discover', color: 'bg-blue-600' },
  { name: 'Live Events', color: 'bg-amber-600' }
];

export default function Search() {
  const [query, setQuery] = useState('');

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

      {/* Browse Categories */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Browse All</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {searchCategories.map((cat, idx) => (
            <div 
              key={idx} 
              className={`${cat.color} aspect-square rounded-xl p-4 font-bold text-lg text-white shadow-lg cursor-pointer hover:scale-105 transition flex items-start justify-between overflow-hidden relative`}
            >
              <span>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}