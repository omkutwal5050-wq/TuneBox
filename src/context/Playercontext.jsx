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

  useEffect(() => {
    const audio = audioRef.current;

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

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, togglePlay, time, seek }}>
      {children}
    </PlayerContext.Provider>
  );
};