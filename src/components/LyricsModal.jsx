import React, { useContext } from 'react';
import { PlayerContext } from '../context/Playercontext';

export function LyricsModal({ isOpen, onClose }) {
  const { currentTrack } = useContext(PlayerContext);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-4">
            <img 
              src={currentTrack?.cover} 
              alt={currentTrack?.title} 
              className="w-14 h-14 rounded-lg object-cover shadow-md"
            />
            <div>
              <h2 className="text-xl font-bold text-white">{currentTrack?.title}</h2>
              <p className="text-sm text-neutral-400">{currentTrack?.artist}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 w-9 h-9 rounded-full flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        <div className="py-8 overflow-y-auto text-center flex-1 my-auto">
          {currentTrack?.lyrics ? (
            <div className="space-y-4 text-xl font-semibold leading-relaxed text-neutral-200 whitespace-pre-line">
              {currentTrack.lyrics}
            </div>
          ) : (
            <p className="text-neutral-500 italic">No lyrics available for this track.</p>
          )}
        </div>

        <div className="pt-4 border-t border-neutral-800 text-center text-xs text-neutral-500">
          TUNEBOX Live Lyrics Engine
        </div>
      </div>
    </div>
  );
}