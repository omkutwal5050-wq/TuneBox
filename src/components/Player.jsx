import React, { useContext } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Shuffle, Repeat, 
  Mic2, ListMusic 
} from 'lucide-react';
import { PlayerContext } from '../context/Playercontext';
import { mockSongs } from '../data/songsData';

export default function Player() {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    nextTrack, 
    prevTrack, 
    time, 
    seek, 
    volume, 
    isMuted, 
    changeVolume, 
    toggleMute,
    isShuffle,
    toggleShuffle,
    repeatMode,
    cycleRepeatMode
  } = useContext(PlayerContext);

  if (!currentTrack) return null;

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSeek = (e) => {
    seek(Number(e.target.value));
  };

  const handleVolume = (e) => {
    changeVolume(Number(e.target.value));
  };

  return (
    <div className="h-24 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between px-4 md:px-6 relative z-50">
      {/* Left: Track Info */}
      <div className="flex items-center gap-4 w-1/4 min-w-[180px]">
        <img 
          src={currentTrack.cover} 
          alt={currentTrack.title} 
          className="w-14 h-14 rounded-lg object-cover shadow-md"
        />
        <div className="truncate">
          <h4 className="text-white text-sm font-semibold truncate">{currentTrack.title}</h4>
          <p className="text-neutral-400 text-xs truncate">{currentTrack.artist}</p>
        </div>
      </div>

      {/* Center: Playback Controls */}
      <div className="flex flex-col items-center justify-center flex-1 max-w-2xl px-4">
        <div className="flex items-center gap-6 mb-2">
          <button 
            onClick={toggleShuffle}
            className={`transition ${isShuffle ? 'text-indigo-400' : 'text-neutral-400 hover:text-white'}`}
          >
            <Shuffle size={18} />
          </button>
          <button 
            onClick={prevTrack}
            className="text-neutral-400 hover:text-white transition"
          >
            <SkipBack size={24} fill="currentColor" />
          </button>
          <button 
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition transform"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>
          <button 
            onClick={nextTrack}
            className="text-neutral-400 hover:text-white transition"
          >
            <SkipForward size={24} fill="currentColor" />
          </button>
          <button 
            onClick={cycleRepeatMode}
            className={`transition ${repeatMode !== 'off' ? 'text-indigo-400' : 'text-neutral-400 hover:text-white'}`}
          >
            <Repeat size={18} />
            {repeatMode === 'one' && <span className="absolute text-[8px] font-bold -mt-2 ml-4">1</span>}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3 w-full">
          <span className="text-xs text-neutral-400 w-10 text-right">
            {formatTime(time.currentTime)}
          </span>
          <input 
            type="range" 
            min="0" 
            max={time.duration || 100} 
            value={time.currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
          />
          <span className="text-xs text-neutral-400 w-10">
            {formatTime(time.duration)}
          </span>
        </div>
      </div>

      {/* Right: Volume & Extras */}
      <div className="flex items-center justify-end gap-4 w-1/4 min-w-[180px]">
        <button className="text-neutral-400 hover:text-white transition hidden lg:block">
          <Mic2 size={18} />
        </button>
        <button className="text-neutral-400 hover:text-white transition hidden lg:block">
          <ListMusic size={18} />
        </button>
        <div className="flex items-center gap-2 group">
          <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition">
            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolume}
            className="w-24 h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer accent-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </div>
    </div>
  );
}