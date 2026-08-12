import React from 'react';
import { Play } from 'lucide-react';

const mockCards = [
  { id: 1, title: 'Chill Lo-Fi Beats', subtitle: 'Relaxing ambient beats for coding', cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&q=80' },
  { id: 2, title: 'Midnight Synthwave', subtitle: 'Retrowave & electronic vibes', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80' },
  { id: 3, title: 'Acoustic Morning', subtitle: 'Soft acoustic guitar favorites', cover: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&q=80' },
  { id: 4, title: 'Deep Focus', subtitle: 'Instrumental music for deep work', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80' },
];

export default function MainContent() {
  return (
    <main className="flex-1 overflow-y-auto p-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-gray-900 p-8 border border-emerald-500/20 overflow-hidden">
        <div className="relative z-10 max-w-lg space-y-3">
          <span className="text-[#10B981] text-xs font-semibold uppercase tracking-wider">Featured Playlist</span>
          <h1 className="text-3xl font-extrabold text-white">Daily Coding Mix</h1>
          <p className="text-slate-400 text-sm">Curated instrumental beats, synth ambient, and smooth grooves to keep you in flow state.</p>
          <button className="flex items-center gap-2 bg-[#10B981] text-slate-950 font-semibold px-5 py-2.5 rounded-full hover:brightness-110 transition shadow-lg shadow-emerald-500/20 cursor-pointer">
            <Play size={18} className="fill-current" /> Play Now
          </button>
        </div>
      </div>

      {/* Recommended Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Recommended for You</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mockCards.map((card) => (
            <div key={card.id} className="group bg-gray-900/60 p-4 rounded-xl border border-gray-800/40 hover:bg-gray-800/80 hover:border-gray-700/60 transition cursor-pointer">
              <div className="relative mb-3 overflow-hidden rounded-lg aspect-square">
                <img src={card.cover} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                <button className="absolute bottom-3 right-3 w-10 h-10 bg-[#10B981] text-slate-950 rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition shadow-lg cursor-pointer">
                  <Play size={18} className="fill-current ml-0.5" />
                </button>
              </div>
              <h3 className="font-semibold text-white truncate text-sm">{card.title}</h3>
              <p className="text-slate-400 text-xs truncate mt-1">{card.subtitle}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}