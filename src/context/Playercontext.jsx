import React, { createContext, useState, useRef, useEffect } from 'react';

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const [currentTrack, setCurrentTrack] = useState({
    id: 1,
    title: 'Midnight Coding',
    artist: 'Lo-Fi Producer',
    cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState({ currentTime: 0, duration: 0 });
  const [volume, setVolumeState] = useState(0.8); // 0.0 to 1.0
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const handleTimeUpdate = () => {
      setTime({
        currentTime: audio.currentTime || 0,
        duration: audio.duration || 0
      });
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setTime({ currentTime: 0, duration: audio.duration || 0 });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const playTrack = (track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(track);
      audioRef.current.src = track.audioUrl;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src) {
        audioRef.current.src = currentTrack.audioUrl;
      }
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const seek = (newTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setTime((prev) => ({ ...prev, currentTime: newTime }));
    }
  };

  const changeVolume = (newVal) => {
    const val = parseFloat(newVal);
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      const restoredVol = prevVolume || 0.8;
      setVolumeState(restoredVol);
      if (audioRef.current) audioRef.current.volume = restoredVol;
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      setVolumeState(0);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  return (
    <PlayerContext.Provider 
      value={{ 
        currentTrack, 
        isPlaying, 
        playTrack, 
        togglePlay, 
        time, 
        seek, 
        volume, 
        isMuted, 
        changeVolume, 
        toggleMute 
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};