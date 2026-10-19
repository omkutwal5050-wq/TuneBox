import { createContext, useState, useRef, useEffect } from 'react';
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
    id: track.id || track._id,
    audioSrc,
    file: audioSrc,
    audioUrl: audioSrc,
    cover: cover.startsWith('public/') ? `${mediaOrigin}/${cover.slice('public/'.length)}` : cover
  };
};

const getTrackId = (track) => (
  typeof track === 'object' ? track?.id || track?._id : track
);

const getStoredLikedIds = (user) => (
  user?.likedSongs?.map(getTrackId).filter(Boolean) || []
);

const getStoredLikedTracks = (user) => (
  user?.likedSongs?.filter(song => song && typeof song === 'object' && getTrackId(song))
    .map(normalizeTrack) || []
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
  const [likedTracks, setLikedTracks] = useState(() => {
    const saved = localStorage.getItem('player_likedTracks');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    try {
      return saved ? JSON.parse(saved).map(normalizeTrack) : getStoredLikedTracks(user);
    } catch {
      return getStoredLikedTracks(user);
    }
  });

  const [queue, setQueue] = useState(() => {
    const saved = localStorage.getItem('player_queue');
    return saved ? JSON.parse(saved) : [];
  });
  const [playbackList, setPlaybackList] = useState(mockSongs);

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
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('player_recentlyPlayed') || '[]');
    } catch {
      return [];
    }
  });
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
    localStorage.setItem('player_likedTracks', JSON.stringify(likedTracks));
  }, [likedTracks]);

  useEffect(() => {
    const loadLikedSongs = () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const userTracks = getStoredLikedTracks(user);
        const storedTracks = JSON.parse(localStorage.getItem('player_likedTracks') || '[]')
          .filter(track => track && typeof track === 'object')
          .map(normalizeTrack);
        const tracks = [...userTracks, ...storedTracks].filter((track, index, items) => (
          items.findIndex(item => String(getTrackId(item)) === String(getTrackId(track))) === index
        ));
        setLikedSongIds(getStoredLikedIds(user));
        setLikedTracks(tracks);
      } catch (error) {
        console.error('Could not load liked songs:', error);
      }
    };

    window.addEventListener('tunebox:user-changed', loadLikedSongs);
    return () => window.removeEventListener('tunebox:user-changed', loadLikedSongs);
  }, []);

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

  useEffect(() => {
    localStorage.setItem('player_recentlyPlayed', JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  useEffect(() => {
    let cancelled = false;
    const loadRecentlyPlayed = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!storedUser || !token) {
          setRecentlyPlayed([]);
          return;
        }
        const user = JSON.parse(storedUser);
        const response = await fetch(`${API_BASE_URL}/auth/${user._id}`, {
          headers: authHeaders()
        });
        if (!response.ok) throw new Error(`Recently played request failed (${response.status})`);
        const profile = await response.json();
        if (cancelled) return;

        const history = (profile.recentlyPlayed || [])
          .map(entry => entry.track || mockSongs.find(song => String(song.id) === String(entry.songId)))
          .filter(Boolean)
          .map(normalizeTrack);
        setRecentlyPlayed(previous => {
          const merged = [...history, ...previous];
          return merged.filter((track, index) => (
            merged.findIndex(item => String(item.id) === String(track.id)) === index
          ));
        });
      } catch (error) {
        console.error('Could not load recently played tracks:', error);
      }
    };

    loadRecentlyPlayed();
    window.addEventListener('tunebox:user-changed', loadRecentlyPlayed);
    return () => {
      cancelled = true;
      window.removeEventListener('tunebox:user-changed', loadRecentlyPlayed);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const recordRecentlyPlayed = (track) => {
    if (!track?.id) return;
    const normalizedTrack = normalizeTrack(track);
    setRecentlyPlayed(previous => [
      normalizedTrack,
      ...previous.filter(item => String(item.id) !== String(normalizedTrack.id))
    ]);

    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!storedUser || !token) return;

    try {
      const user = JSON.parse(storedUser);
      fetch(`${API_BASE_URL}/users/${user._id}/recently-played`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ songId: normalizedTrack.id, track: normalizedTrack })
      }).then(response => {
        if (!response.ok) throw new Error(`Recently played request failed (${response.status})`);
        return response.json();
      }).catch(error => {
        console.error('Could not save recently played track:', error);
      });
    } catch (error) {
      console.error('Could not read signed-in user for recently played:', error);
    }
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

  const safePlay = (track = currentTrack) => {
    const audio = audioRef.current;
    if (!audio?.src) return;

    if (audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      const playWhenReady = () => safePlay(track);
      audio.addEventListener('canplay', playWhenReady, { once: true });
      audio.load();
      return;
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setPlaybackError('');
          recordRecentlyPlayed(track);
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
      const playWhenReady = () => safePlay(currentTrack);
      setPlaybackError('');
      const resolvedSrc = new URL(audioSrc, window.location.href).href;
      const sourceChanged = audio.src !== resolvedSrc;
      if (sourceChanged) {
        audio.pause();
        audio.src = resolvedSrc;
      }
      if (wasPlaying) {
        if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
          playWhenReady();
        } else {
          audio.addEventListener('canplay', playWhenReady, { once: true });
        }
      }
      if (sourceChanged) audio.load();
      return () => audio.removeEventListener('canplay', playWhenReady);
    }
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
        safePlay(nextTrack);
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
  }, [repeatMode, isShuffle, queue, playbackList, isMuted, volume]);

  const playTrack = (track, sourceTracks = null) => {
    if (sourceTracks?.length) {
      setPlaybackList(sourceTracks.map(normalizeTrack));
    }

    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      const nextTrack = normalizeTrack(track);
      const audioSrc = nextTrack.audioSrc;
      setCurrentTrack(nextTrack);
      setPlaybackError('');
      audioRef.current.pause();
      audioRef.current.src = new URL(audioSrc, window.location.href).href;
      setIsPlaying(true);
    }
  };

  // Select a track for the shared player without starting playback.
  const selectTrack = (track, sourceTracks = null) => {
    if (!track) return;
    if (sourceTracks?.length) {
      setPlaybackList(sourceTracks.map(normalizeTrack));
    }
    const nextTrack = normalizeTrack(track);
    audioRef.current.pause();
    setCurrentTrack(nextTrack);
    setIsPlaying(false);
    setPlaybackError('');
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
      const randomIndex = Math.floor(Math.random() * playbackList.length);
      playTrack(playbackList[randomIndex]);
      return;
    }

    const currentIndex = playbackList.findIndex((s) => String(s.id) === String(currentTrack.id));
    if (currentIndex === -1) {
      if (repeatMode === 'all') playTrack(playbackList[0]);
      else setIsPlaying(false);
      return;
    }
    if (repeatMode === 'off' && currentIndex === playbackList.length - 1) {
      setIsPlaying(false);
      return;
    }
    const nextIndex = (currentIndex + 1) % playbackList.length;
    playTrack(playbackList[nextIndex]);
  };

  const prevTrack = () => {
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const currentIndex = playbackList.findIndex((s) => String(s.id) === String(currentTrack.id));
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + playbackList.length) % playbackList.length;
    playTrack(playbackList[prevIndex]);
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

  const toggleLike = async (songId, track = null) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      showToast("Please login to like songs!");
      return;
    }

    try {
      const userObj = JSON.parse(storedUser);
      const trackSnapshot = track ? normalizeTrack(track) : (
        likedTracks.find(item => String(getTrackId(item)) === String(songId))
        || mockSongs.find(item => String(item.id) === String(songId))
      );
      const response = await fetch(`${API_BASE_URL}/auth/${userObj._id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ songId, track: trackSnapshot })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));

        const previousTracks = likedTracks;
        const newLikedIds = getStoredLikedIds(updatedUser);
        const newLikedTracks = (updatedUser.likedSongs || [])
          .filter(item => item && typeof item === 'object')
          .map(normalizeTrack)
          .concat(previousTracks.filter(previous => (
            newLikedIds.some(id => String(id) === String(getTrackId(previous)))
          )))
          .filter((item, index, items) => (
            items.findIndex(candidate => String(getTrackId(candidate)) === String(getTrackId(item))) === index
          ));
        setLikedSongIds(newLikedIds);
        setLikedTracks(newLikedTracks);
        
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
        selectTrack,
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
        likedTracks,
        toggleLike,
        isShuffle,
        toggleShuffle,
        repeatMode,
        cycleRepeatMode,
        crossfadeSeconds,
        setCrossfadeSeconds,
        audioQuality,
        setAudioQuality,
        recentlyPlayed,
        recordRecentlyPlayed,
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