import React, { createContext, useState, useRef, useEffect } from 'react';

export const PlayerContext = createContext();

export const mockSongs = [
  {
    id: 1,
    title: 'Midnight Coding',
    artist: 'Lo-Fi Producer',
    cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'
  },
  {
    id: 2,
    title: 'Synthwave Night Drive',
    artist: 'Retro Beats',
    cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=synthwave-80s-110045.mp3'
  },
  {
    id: 3,
    title: 'Chill Ambient Waves',
    artist: 'Acoustic Dreams',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_8fa21359a1.mp3?filename=chill-ambient-10250.mp3'
  },
  {
    id: 4,
    title: 'Deep Focus Flow',
    artist: 'Brainwave Lab',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f03222.mp3?filename=deep-focus-122340.mp3'
  }
];

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const [currentTrack, setCurrentTrack] = useState(mockSongs[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState({ currentTime: 0, duration: 0 });
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [likedSongIds, setLikedSongIds] = useState([1]); // Default like song #1

  const safePlay = () => {
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Playback prevented:", err);
          setIsPlaying(false);
        });
    }
  };

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
      nextTrack();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack]);

  const playTrack = (track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        safePlay();
      }
    } else {
      setCurrentTrack(track);
      audioRef.current.src = track.audioUrl;
      audioRef.current.volume = isMuted ? 0 : volume;
      safePlay();
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
      safePlay();
    }
  };

  const nextTrack = () => {
    const currentIndex = mockSongs.findIndex((s) => s.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % mockSongs.length;
    playTrack(mockSongs[nextIndex]);
  };

  const prevTrack = () => {
    const currentIndex = mockSongs.findIndex((s) => s.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + mockSongs.length) % mockSongs.length;
    playTrack(mockSongs[prevIndex]);
  };

  const toggleLike = (songId) => {
    setLikedSongIds((prev) => 
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
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
    setIsMuted(val === 0);
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
        nextTrack, 
        prevTrack, 
        time, 
        seek, 
        volume, 
        isMuted, 
        changeVolume, 
        toggleMute, 
        likedSongIds, 
        toggleLike 
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};