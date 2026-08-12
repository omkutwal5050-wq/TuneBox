import React, { useContext, useState, useRef } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Repeat1, 
  Shuffle, ListMusic, FileText 
} from 'lucide-react';
import { PlayerContext } from '../context/Playercontext';

export default function Player() {
  const { 
    audioRef,
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
    queue,
    removeFromQueue,
    clearQueue,
    toastMessage
  } = useContext(PlayerContext);

  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const progressBarRef = useRef(null);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || !seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Get reliable duration either from audioRef or time state
  const totalDuration = (audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0)
    ? audioRef.current.duration
    : time.duration || 0;

  const progressPercent = totalDuration > 0 ? (time.currentTime / totalDuration) * 100 : 0;

  // Direct Track Bar Seek Handler
  const handleSeekClick = (e) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPositionX = e.clientX - rect.left;
    const barWidth = rect.width;
    const clickRatio = Math.max(0, Math.min(1, clickPositionX / barWidth));

    if (totalDuration > 0) {
      const newTargetTime = clickRatio * totalDuration;
      seek(newTargetTime);
    }
  };

  return (
    <footer className="relative h-20 bg-[#111827] border-t border-gray-800/60 px-6 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 bg-[#10B981] text-slate-950 font-bold px-4 py-2 rounded-full text-xs shadow-lg animate-bounce z-50">
          {toastMessage}
        </div>
      )}

      {/* Up Next Queue Modal */}
      {showQueue && (
        <div className="absolute bottom-24 right-6 w-80 bg-[#111827] border border-gray-800 rounded-2xl p-4 shadow-2xl z-50 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ListMusic size={16} className="text-[#10B981]" /> Up Next Queue
            </h3>
            {queue.length > 0 && (
              <button onClick={clearQueue} className="text-xs text-red-400 hover:underline cursor-pointer">Clear All</button>
            )}
          </div>
          {queue.length > 0 ? (
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {queue.map((song, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img src={song.cover} alt="" className="w-8 h-8 rounded object-cover" />
                    <div className="truncate">
                      <p className="font-semibold text-white truncate">{song.title}</p>
                      <p className="text-slate-400 text-[10px] truncate">{song.artist}</p>
                    </div>
                  </div>
                  <button onClick={() => removeFromQueue(idx)} className="text-slate-500 hover:text-red-400 p-1 cursor-pointer">✕</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">Queue is empty. Add songs from Search or Home!</p>
          )}
        </div>
      )}

      {/* Lyrics Panel Modal */}
      {showLyrics && (
        <div className="absolute bottom-24 left-6 w-96 bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-2xl z-50 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText size={16} className="text-[#10B981]" /> Song Lyrics
            </h3>
            <button onClick={() => setShowLyrics(false)} className="text-xs text-slate-400 hover:text-white cursor-pointer">Close</button>
          </div>
          <div className="max-h-64 overflow-y-auto whitespace-pre-line text-sm text-slate-300 leading-relaxed font-mono">
            {currentTrack?.lyrics || "No lyrics available for this track."}
          </div>
        </div>
      )}

      {/* Left: Track Details */}
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

      {/* Middle: Controls & Track Bar */}
      <div className="flex flex-col items-center gap-2 w-2/4 max-w-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleShuffle} 
            className={`transition cursor-pointer ${isShuffle ? 'text-[#10B981]' : 'text-slate-400 hover:text-white'}`}
            title="Toggle Shuffle"
          >
            <Shuffle size={16} />
          </button>

          <button onClick={prevTrack} className="text-slate-400 hover:text-white transition cursor-pointer">
            <SkipBack size={18} />
          </button>

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

          <button onClick={nextTrack} className="text-slate-400 hover:text-white transition cursor-pointer">
            <SkipForward size={18} />
          </button>

          <button 
            onClick={cycleRepeatMode} 
            className={`transition cursor-pointer ${repeatMode !== 'off' ? 'text-[#10B981]' : 'text-slate-400 hover:text-white'}`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        {/* Track Timeline Bar */}
        <div className="w-full flex items-center gap-3 text-xs text-slate-400">
          <span className="w-8 text-right font-mono">{formatTime(time.currentTime)}</span>
          
          <div 
            ref={progressBarRef}
            onClick={handleSeekClick}
            className="relative flex-1 h-3 flex items-center cursor-pointer group py-1"
          >
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-[#10B981] rounded-full" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Playhead Marker */}
            <div 
              className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          <span className="w-8 font-mono">{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Right: Queue, Lyrics & Volume */}
      <div className="flex items-center justify-end gap-3 w-1/4">
        <button 
          onClick={() => { setShowLyrics(!showLyrics); setShowQueue(false); }}
          className={`transition cursor-pointer ${showLyrics ? 'text-[#10B981]' : 'text-slate-400 hover:text-white'}`}
          title="View Lyrics"
        >
          <FileText size={18} />
        </button>

        <button 
          onClick={() => { setShowQueue(!showQueue); setShowLyrics(false); }}
          className={`relative transition cursor-pointer ${showQueue ? 'text-[#10B981]' : 'text-slate-400 hover:text-white'}`}
          title="Up Next Queue"
        >
          <ListMusic size={18} />
          {queue.length > 0 && (
            <span className="absolute -top-1 -right-1.5 bg-[#10B981] text-slate-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {queue.length}
            </span>
          )}
        </button>

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