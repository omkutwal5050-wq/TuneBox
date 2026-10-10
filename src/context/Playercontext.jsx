import React, { createContext, useState, useRef, useEffect } from 'react';
import { mockSongs } from '../data/songsData';

export const PlayerContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeTrack = (track) => {
  if (!track) return track;
  const rawAudioSrc = track.audioSrc || track.file || track.audioUrl || '';
  const rawCover = track.cover || '';
  const mediaOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
  const audioSrc = rawAudioSrc.startsWith('/') ? `${mediaOrigin}${rawAudioSrc}` : rawAudioSrc;
  const cover = rawCover.startsWith('/') && !rawCover.startsWith('//')
    ? `${mediaOrigin}${rawCover}`
    : rawCover;
  return {
    ...track,
    audioSrc,
    file: audioSrc,
    audioUrl: audioSrc,
    cover: cover.startsWith('public/') ? `${mediaOrigin}/${cover.slice('public/'.length)}` : cover
  };
};

const getStoredLikedIds = (user) => (
  user?.likedSongs?.map(song => typeof song === 'object' ? song.id || song._id : song) || []
);

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
        if (!parsed?.audioSrc && !parsed?.file && !parsed?.audioUrl) return normalizeTrack(mockSongs[0]);
        return normalizeTrack(parsed);
      } catch {
        return normalizeTrack(mockSongs[0]);
      }
    }
    return normalizeTrack(mockSongs[0]);
  });

  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('player_volume');
    return saved !== null ? parseFloat(saved) : 0.8;
  });

  const [likedSongIds, setLikedSongIds] = useState(() => {
    const saved = localStorage.getItem('player_likedSongs');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return saved ? JSON.parse(saved) : getStoredLikedIds(user);
  });

  const [queue, setQueue] = useState(() => {
    const saved = localStorage.getItem('player_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('player_playlists');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return saved ? JSON.parse(saved) : (user?.playlists || []).map(playlist => ({
      id: playlist._id,
      name: playlist.name,
      songIds: playlist.songs || []
    }));
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState('');
  const [time, setTime] = useState({ currentTime: 0, duration: 0 });
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');
  const [crossfadeSeconds, setCrossfadeSeconds] = useState(() => Number(localStorage.getItem('player_crossfade') || 0));
  const [audioQuality, setAudioQuality] = useState(() => localStorage.getItem('player_quality') || 'standard');
  const [toastMessage, setToastMessage] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('player_recentSearches') || '[]');
    } catch {
      return [];
    }
  });

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

  useEffect(() => {
    localStorage.setItem('player_recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    localStorage.setItem('player_crossfade', String(crossfadeSeconds));
  }, [crossfadeSeconds]);

  useEffect(() => {
    localStorage.setItem('player_quality', audioQuality);
  }, [audioQuality]);

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
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setPlaybackError('');
          setupAudioContext();
        })
        .catch((err) => {
          console.warn("Playback prevented:", err);
          setIsPlaying(false);
          setPlaybackError('This track could not be played. Try another preview.');
        });
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    const audioSrc = currentTrack?.audioSrc || currentTrack?.file || currentTrack?.audioUrl;
    if (audioSrc) {
      const wasPlaying = isPlaying;
      setPlaybackError('');
      const resolvedSrc = new URL(audioSrc, window.location.href).href;
      if (audio.src !== resolvedSrc) {
        audio.src = audioSrc;
        audio.load();
      }
      if (wasPlaying) {
        audio.addEventListener('canplay', safePlay, { once: true });
      }
      return () => audio.removeEventListener('canplay', safePlay);
    }
  }, [currentTrack]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!storedUser || !token || !currentTrack?.id) return;
    const user = JSON.parse(storedUser);
    fetch(`${API_BASE_URL}/users/${user._id}/recently-played`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ songId: currentTrack.id })
    }).catch(error => console.warn('Could not save recently played track:', error));
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume;

    const handleAudioError = () => {
      setIsPlaying(false);
      setPlaybackError('This track is unavailable or its preview has expired.');
    };

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
    audio.addEventListener('error', handleAudioError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleAudioError);
    };
  }, [repeatMode, isShuffle, queue, isMuted, volume]);

  const playTrack = (track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      const nextTrack = normalizeTrack(track);
      const audioSrc = nextTrack.audioSrc;
      setCurrentTrack(nextTrack);
      setIsPlaying(true);
      setPlaybackError('');
      audioRef.current.src = audioSrc;
      audioRef.current.load();
      safePlay();
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

    const currentIndex = mockSongs.findIndex((s) => String(s.id) === String(currentTrack.id));
    if (currentIndex === -1) {
      if (repeatMode === 'all') playTrack(mockSongs[0]);
      else setIsPlaying(false);
      return;
    }
    if (repeatMode === 'off' && currentIndex === mockSongs.length - 1) {
      setIsPlaying(false);
      return;
    }
    const nextIndex = (currentIndex + 1) % mockSongs.length;
    playTrack(mockSongs[nextIndex]);
  };

  const prevTrack = () => {
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const currentIndex = mockSongs.findIndex((s) => String(s.id) === String(currentTrack.id));
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

  const toggleLike = async (songId) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      showToast("Please login to like songs!");
      return;
    }

    try {
      const userObj = JSON.parse(storedUser);
      const response = await fetch(`${API_BASE_URL}/auth/${userObj._id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ songId })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));

        const newLikedIds = getStoredLikedIds(updatedUser);
        setLikedSongIds(newLikedIds);
        
        const isNowLiked = newLikedIds.some(id => String(id) === String(songId));
        showToast(isNowLiked ? "Added to Liked (Saved to DB)" : "Removed from Liked");
      }
    } catch (err) {
      console.error("Failed to sync like with database:", err);
      showToast("Error syncing with database");
    }
  };

  const addToQueue = (song) => {
    setQueue((prev) => [...prev, normalizeTrack(song)]);
    showToast(`Added "${song.title}" to Queue`);
  };

  const playNext = (song) => {
    setQueue((prev) => [normalizeTrack(song), ...prev]);
    showToast(`"${song.title}" will play next`);
  };

  const removeFromQueue = (index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    setQueue([]);
    showToast("Queue cleared");
  };

  const createPlaylist = (name) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return showToast("Please login to create playlists!");
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const user = JSON.parse(storedUser);
    fetch(`${API_BASE_URL}/auth/${user._id}/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name: trimmedName })
    }).then(async response => {
      if (!response.ok) throw new Error('Could not create playlist');
      const savedPlaylists = await response.json();
      const nextPlaylists = savedPlaylists.map(playlist => ({
        id: playlist._id,
        name: playlist.name,
        songIds: playlist.songs || []
      }));
      setPlaylists(nextPlaylists);
      localStorage.setItem('user', JSON.stringify({ ...user, playlists: savedPlaylists }));
      showToast(`Playlist "${trimmedName}" created!`);
    }).catch(error => {
      console.error('Failed to create playlist:', error);
      showToast('Error creating playlist');
    });
  };

  const addSongToPlaylist = (playlistId, songId) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return showToast("Please login to manage playlists!");
    const user = JSON.parse(storedUser);
    fetch(`${API_BASE_URL}/auth/${user._id}/playlists/${playlistId}/songs`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ songId, action: 'add' })
    }).then(async response => {
      if (!response.ok) throw new Error('Could not update playlist');
      const savedPlaylists = await response.json();
      setPlaylists(savedPlaylists.map(playlist => ({
        id: playlist._id,
        name: playlist.name,
        songIds: playlist.songs || []
      })));
      localStorage.setItem('user', JSON.stringify({ ...user, playlists: savedPlaylists }));
      showToast("Added song to playlist");
    }).catch(error => {
      console.error('Failed to update playlist:', error);
      showToast('Error updating playlist');
    });
  };

  const renamePlaylist = (playlistId, name) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser || !name.trim()) return;
    const user = JSON.parse(storedUser);
    fetch(`${API_BASE_URL}/auth/${user._id}/playlists/${playlistId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() })
    }).then(async response => {
      if (!response.ok) throw new Error('Could not rename playlist');
      const savedPlaylists = await response.json();
      setPlaylists(savedPlaylists.map(playlist => ({
        id: playlist._id,
        name: playlist.name,
        songIds: playlist.songs || []
      })));
    }).catch(error => {
      console.error('Failed to rename playlist:', error);
      showToast('Error renaming playlist');
    });
  };

  const deletePlaylist = (playlistId) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    const user = JSON.parse(storedUser);
    fetch(`${API_BASE_URL}/auth/${user._id}/playlists/${playlistId}`, {
      method: 'DELETE'
    }).then(async response => {
      if (!response.ok) throw new Error('Could not delete playlist');
      const savedPlaylists = await response.json();
      setPlaylists(savedPlaylists.map(playlist => ({
        id: playlist._id,
        name: playlist.name,
        songIds: playlist.songs || []
      })));
      showToast('Playlist deleted');
    }).catch(error => {
      console.error('Failed to delete playlist:', error);
      showToast('Error deleting playlist');
    });
  };

  const rememberSearch = (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    setRecentSearches(previous => [
      trimmedQuery,
      ...previous.filter(item => item.toLowerCase() !== trimmedQuery.toLowerCase())
    ].slice(0, 8));
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
    const matchesGenre = selectedGenre === 'All' || song.genre?.toLowerCase() === selectedGenre.toLowerCase();
    return matchesSearch && matchesGenre;
  });

  return (
    <PlayerContext.Provider 
      value={{ 
        audioRef,
        analyserRef,
        currentTrack, 
        isPlaying, 
        playbackError,
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
        crossfadeSeconds,
        setCrossfadeSeconds,
        audioQuality,
        setAudioQuality,
        queue,
        addToQueue,
        playNext,
        removeFromQueue,
        clearQueue,
        playlists,
        createPlaylist,
        addSongToPlaylist,
        renamePlaylist,
        deletePlaylist,
        toastMessage,
        searchQuery,
        setSearchQuery,
        recentSearches,
        rememberSearch,
        selectedGenre,
        setSelectedGenre,
        filteredSongs
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};