import React, { createContext, useState, useRef, useEffect } from 'react';
import { mockSongs } from '../data/songsData';

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);

  if (!audioRef.current) {
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = "anonymous";
  }

  const [currentTrack, setCurrentTrack] = useState(() => {
    const saved = localStorage.getItem('player_currentTrack');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed?.audioUrl) return mockSongs[0];
        return parsed;
      } catch {
        return mockSongs[0];
      }
    }
    return mockSongs[0];
  });

  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('player_volume');
    return saved !== null ? parseFloat(saved) : 0.8;
  });

  const [likedSongIds, setLikedSongIds] = useState(() => {
    const saved = localStorage.getItem('player_likedSongs');
    return saved ? JSON.parse(saved) : [1];
  });

  const [queue, setQueue] = useState(() => {
    const saved = localStorage.getItem('player_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('player_playlists');
    return saved ? JSON.parse(saved) : [{ id: 1, name: 'My Favorites', songIds: [1, 2] }];
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState({ currentTime: 0, duration: 0 });
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');
  const [toastMessage, setToastMessage] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  useEffect(() => {
    localStorage.setItem('player_currentTrack', JSON.stringify(currentTrack));
  }, [currentTrack]);

  useEffect(() => {
    localStorage.setItem('player_volume', volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('player_likedSongs', JSON.stringify(likedSongIds));
  }, [likedSongIds]);

  useEffect(() => {
    localStorage.setItem('player_queue', JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    localStorage.setItem('player_playlists', JSON.stringify(playlists));
  }, [playlists]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const setupAudioContext = () => {
    if (!audioContextRef.current) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;

        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);

        audioContextRef.current = ctx;
        analyserRef.current = analyser;
        sourceNodeRef.current = source;
      } catch (err) {
        console.warn("Web Audio API init skipped:", err);
      }
    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const safePlay = () => {
    setupAudioContext();
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
    if (currentTrack?.audioUrl) {
      const wasPlaying = isPlaying;
      audio.src = currentTrack.audioUrl;
      audio.load();
      if (wasPlaying) safePlay();
    }
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume;

    const handleTimeUpdate = () => {
      setTime({
        currentTime: audio.currentTime || 0,
        duration: isFinite(audio.duration) ? audio.duration : 0
      });
    };

    const handleLoadedMetadata = () => {
      setTime((prev) => ({
        ...prev,
        duration: isFinite(audio.duration) ? audio.duration : 0
      }));
    };

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        safePlay();
      } else {
        nextTrack();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, isShuffle, queue, isMuted, volume]);

  const playTrack = (track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      safePlay();
    }
  };

  const nextTrack = () => {
    if (queue.length > 0) {
      const nextFromQueue = queue[0];
      setQueue((prev) => prev.slice(1));
      playTrack(nextFromQueue);
      return;
    }

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * mockSongs.length);
      playTrack(mockSongs[randomIndex]);
      return;
    }

    const currentIndex = mockSongs.findIndex((s) => s.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % mockSongs.length;
    playTrack(mockSongs[nextIndex]);
  };

  const prevTrack = () => {
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const currentIndex = mockSongs.findIndex((s) => s.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + mockSongs.length) % mockSongs.length;
    playTrack(mockSongs[prevIndex]);
  };

  const seek = (newTime) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isFinite(newTime) && newTime >= 0) {
      audio.currentTime = newTime;
      setTime((prev) => ({ ...prev, currentTime: newTime }));
    }
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => {
      const nextState = !prev;
      showToast(nextState ? "Shuffle On" : "Shuffle Off");
      return nextState;
    });
  };

  const cycleRepeatMode = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') { showToast("Repeat All"); return 'all'; }
      if (prev === 'all') { showToast("Repeat One"); return 'one'; }
      showToast("Repeat Off");
      return 'off';
    });
  };

  const toggleLike = (songId) => {
    setLikedSongIds((prev) => {
      const isLiked = prev.includes(songId);
      showToast(isLiked ? "Removed from Liked" : "Added to Liked");
      return isLiked ? prev.filter((id) => id !== songId) : [...prev, songId];
    });
  };

  const addToQueue = (song) => {
    setQueue((prev) => [...prev, song]);
    showToast(`Added "${song.title}" to Queue`);
  };

  const removeFromQueue = (index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    setQueue([]);
    showToast("Queue cleared");
  };

  const createPlaylist = (name) => {
    const newPlaylist = { id: Date.now(), name, songIds: [] };
    setPlaylists((prev) => [...prev, newPlaylist]);
    showToast(`Playlist "${name}" created!`);
  };

  const addSongToPlaylist = (playlistId, songId) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          if (pl.songIds.includes(songId)) {
            showToast("Song already in playlist");
            return pl;
          }
          showToast("Added song to playlist");
          return { ...pl, songIds: [...pl.songIds, songId] };
        }
        return pl;
      })
    );
  };

  const changeVolume = (newVal) => {
    const val = parseFloat(newVal);
    setVolumeState(val);
    if (audioRef.current) audioRef.current.volume = val;
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolumeState(prevVolume || 0.8);
      if (audioRef.current) audioRef.current.volume = prevVolume || 0.8;
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      setVolumeState(0);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const filteredSongs = mockSongs.filter((song) => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || song.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <PlayerContext.Provider 
      value={{ 
        audioRef,
        analyserRef,
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
        toggleLike,
        isShuffle,
        toggleShuffle,
        repeatMode,
        cycleRepeatMode,
        queue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        playlists,
        createPlaylist,
        addSongToPlaylist,
        toastMessage,
        searchQuery,
        setSearchQuery,
        selectedGenre,
        setSelectedGenre,
        filteredSongs
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};