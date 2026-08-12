import React, { createContext, useState, useRef } from 'react';

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const [currentTrack, setCurrentTrack] = useState({
    id: 1,
    title: 'Chill Lo-Fi Beats',
    artist: 'Lo-Fi Producer',
    cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'
  });
  const [isPlaying, setIsPlaying] = useState(false);

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

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, togglePlay }}>
      {children}
    </PlayerContext.Provider>
  );
};