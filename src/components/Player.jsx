import React, { useState, useContext } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Shuffle, Repeat, 
  Mic2, ListMusic, Heart 
} from 'lucide-react';
import { PlayerContext } from '../context/Playercontext';
import { LyricsModal } from './LyricsModal';

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
    cycleRepeatMode,
    likedSongIds,
    toggleLike,
    queue,
    removeFromQueue,
    clearQueue
    ,crossfadeSeconds,
    setCrossfadeSeconds,
    audioQuality,
    setAudioQuality
  } = useContext(PlayerContext);

  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

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

  const isLiked = likedSongIds.some(id => String(id) === String(currentTrack.id));

  return (
    <>
      <div className="h-24 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between px-4 md:px-6 relative z-50">
        {/* Left: Track Info & Like Button */}
        <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
          <img 
            src={currentTrack.cover} 
            alt={currentTrack.title} 
            className="w-14 h-14 rounded-lg object-cover shadow-md"
          />
          <div className="truncate">
            <h4 className="text-white text-sm font-semibold truncate">{currentTrack.title}</h4>
            <p className="text-neutral-400 text-xs truncate">{currentTrack.artist}</p>
          </div>
          <button 
            onClick={() => toggleLike(currentTrack.id)}
            className={`transition cursor-pointer ml-2 ${isLiked ? 'text-rose-500' : 'text-neutral-400 hover:text-white'}`}
            title={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-2xl px-4">
          <div className="flex items-center gap-6 mb-2">
            <button 
              onClick={toggleShuffle}
              aria-label="Toggle shuffle"
              className={`transition cursor-pointer ${isShuffle ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'}`}
            >
              <Shuffle size={18} />
            </button>
            <button 
              onClick={prevTrack}
              aria-label="Previous track"
              className="text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <SkipBack size={22} fill="currentColor" />
            </button>
            <button 
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition transform cursor-pointer"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            <button 
              onClick={nextTrack}
              aria-label="Next track"
              className="text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <SkipForward size={22} fill="currentColor" />
            </button>
            <button 
              onClick={cycleRepeatMode}
              aria-label="Change repeat mode"
              className={`transition relative cursor-pointer ${repeatMode !== 'off' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'}`}
            >
              <Repeat size={18} />
              {repeatMode === 'one' && <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-emerald-500 text-black px-1 rounded-full">1</span>}
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
              className="flex-1 h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
            />
            <span className="text-xs text-neutral-400 w-10">
              {formatTime(time.duration)}
            </span>
          </div>
        </div>

        {/* Right: Volume & Extras */}
        <div className="flex items-center justify-end gap-3 w-1/4 min-w-[180px]">
          {/* Lyrics / Mic Button */}
          <button 
            onClick={() => setIsLyricsOpen(true)}
            className="text-neutral-400 hover:text-emerald-400 transition p-2 cursor-pointer bg-neutral-800/50 hover:bg-neutral-800 rounded-full"
            title="Show Lyrics"
          >
            <Mic2 size={18} />
          </button>

          <button
            onClick={() => setIsQueueOpen(previous => !previous)}
            className="text-neutral-400 hover:text-white transition p-2 cursor-pointer bg-neutral-800/50 hover:bg-neutral-800 rounded-full"
            title="Open queue"
          >
            <ListMusic size={18} />
          </button>

          <div className="flex items-center gap-2 group">
            <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition cursor-pointer">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolume}
              className="w-20 h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
          <select
            value={audioQuality}
            onChange={(event) => setAudioQuality(event.target.value)}
            className="w-20 rounded bg-neutral-800 px-1 py-1 text-xs text-neutral-300"
            title="Audio quality preference"
          >
            <option value="low">Low</option>
            <option value="standard">Std</option>
            <option value="high">High</option>
            <option value="lossless">Lossless</option>
          </select>
          <select
            value={crossfadeSeconds}
            onChange={(event) => setCrossfadeSeconds(Number(event.target.value))}
            className="w-20 rounded bg-neutral-800 px-1 py-1 text-xs text-neutral-300"
            title="Crossfade preference"
          >
            <option value="0">No fade</option>
            <option value="3">3s fade</option>
            <option value="6">6s fade</option>
            <option value="10">10s fade</option>
          </select>
        </div>
      </div>

      {isQueueOpen && (
        <div className="absolute bottom-24 right-4 z-50 w-80 rounded-xl border border-neutral-700 bg-neutral-900 p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-white">Queue</h3>
            <button onClick={clearQueue} className="text-xs text-neutral-400 hover:text-white">Clear</button>
          </div>
          {queue.length === 0 ? (
            <p className="text-sm text-neutral-500">Your queue is empty.</p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {queue.map((track, index) => (
                <div key={`${track.id}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-white">{track.title}</p>
                    <p className="truncate text-xs text-neutral-500">{track.artist}</p>
                  </div>
                  <button onClick={() => removeFromQueue(index)} className="text-neutral-500 hover:text-rose-400">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lyrics Popup Modal */}
      <LyricsModal 
        isOpen={isLyricsOpen} 
        onClose={() => setIsLyricsOpen(false)} 
      />
    </>
  );
}