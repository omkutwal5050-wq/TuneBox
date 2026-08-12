import React, { useContext } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle } from 'lucide-react';
import { PlayerContext } from '../context/Playercontext';

export default function Player() {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    time, 
    seek, 
    volume, 
    isMuted, 
    changeVolume, 
    toggleMute 
  } = useContext(PlayerContext);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = time.duration ? (time.currentTime / time.duration) * 100 : 0;

  const handleSeekChange = (e) => {
    const targetPercent = parseFloat(e.target.value);
    const newTime = (targetPercent / 100) * time.duration;
    seek(newTime);
  };

  return (
    <footer className="h-20 bg-[#111827] border-t border-gray-800/60 px-6 flex items-center justify-between z-20 shrink-0">
      {/* Track Info */}
      <div className="flex items-center gap-3 w-1/4">
        {currentTrack ? (
          <>
            <img 
              src={currentTrack.cover} 
              alt={currentTrack.title} 
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">{currentTrack.title}</h4>
              <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
            </div>
          </>
        ) : (
          <div className="text-xs text-slate-500">No track selected</div>
        )}
      </div>

      {/* Playback Controls & Scrubber */}
      <div className="flex flex-col items-center gap-2 w-2/4 max-w-md">
        <div className="flex items-center gap-6">
          <button className="text-slate-400 hover:text-white transition cursor-pointer"><Shuffle size={16} /></button>
          <button className="text-slate-400 hover:text-white transition cursor-pointer"><SkipBack size={18} /></button>
          <button 
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-105 transition cursor-pointer"
          >
            {isPlaying ? (
              <Pause size={16} className="fill-current" />
            ) : (
              <Play size={16} className="fill-current ml-0.5" />
            )}
          </button>
          <button className="text-slate-400 hover:text-white transition cursor-pointer"><SkipForward size={18} /></button>
          <button className="text-slate-400 hover:text-white transition cursor-pointer"><Repeat size={16} /></button>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full flex items-center gap-3 text-xs text-slate-400">
          <span>{formatTime(time.currentTime)}</span>
          <div className="relative flex-1 h-1 bg-gray-800 rounded-full flex items-center group cursor-pointer">
            <div 
              className="h-full bg-[#10B981] rounded-full" 
              style={{ width: `${progressPercent}%` }}
            />
            <input 
              type="range"
              min="0"
              max="100"
              value={progressPercent || 0}
              onChange={handleSeekChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <span>{formatTime(time.duration)}</span>
        </div>
      </div>

      {/* Interactive Volume Control */}
      <div className="flex items-center justify-end gap-3 w-1/4">
        <button 
          onClick={toggleMute}
          className="text-slate-400 hover:text-white transition cursor-pointer"
        >
          {isMuted || volume === 0 ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} />}
        </button>
        <div className="relative w-24 h-1 bg-gray-800 rounded-full flex items-center group cursor-pointer">
          <div 
            className="h-full bg-gray-300 group-hover:bg-[#10B981] rounded-full transition-colors" 
            style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
          />
          <input 
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => changeVolume(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </footer>
  );
}