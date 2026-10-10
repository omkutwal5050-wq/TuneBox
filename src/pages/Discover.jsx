import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Clock3, Heart, Pause, Play, Radio, Sparkles } from 'lucide-react';
import { PlayerContext } from '../context/Playercontext';
import { mockSongs } from '../data/songsData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const moodRules = {
  Happy: ['pop', 'dance', 'disco', 'happy', 'synthwave'],
  Sad: ['ambient', 'acoustic', 'ballad', 'sad', 'chill'],
  Party: ['hip hop', 'dance', 'electronic', 'party', 'pop'],
  Focus: ['ambient', 'focus', 'instrumental', 'classical'],
  Relax: ['ambient', 'acoustic', 'chill', 'lo-fi', 'relax']
};

const getTrackKey = (track) => String(track?._id || track?.id);

function TrackCard({ song, onPlay, currentTrack, isPlaying, likedSongIds, toggleLike }) {
  const isCurrent = getTrackKey(currentTrack) === getTrackKey(song);
  const isLiked = likedSongIds.some(id => String(id) === getTrackKey(song));

  return (
    <article className="group rounded-xl border border-neutral-800 bg-neutral-900/70 p-3 shadow-md">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-800">
        {song.cover ? (
          <img src={song.cover} alt={song.title} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-600"><Radio size={42} /></div>
        )}
        <button
          onClick={() => onPlay(song)}
          className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-black shadow-xl hover:bg-emerald-400"
          aria-label={`Play ${song.title}`}
        >
          {isCurrent && isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
        </button>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white">{song.title}</h3>
          <p className="truncate text-xs text-neutral-400">{song.artist}</p>
        </div>
        <button onClick={() => toggleLike(song.id || song._id)} className={isLiked ? 'text-rose-500' : 'text-neutral-500 hover:text-rose-400'}>
          <Heart size={17} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>
    </article>
  );
}

export default function Discover({ view }) {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    addToQueue,
    clearQueue,
    recentlyPlayed,
    likedSongIds,
    toggleLike
  } = useContext(PlayerContext);
  const [remoteRecommendations, setRemoteRecommendations] = useState([]);
  const [selectedMood, setSelectedMood] = useState('Happy');
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    let cancelled = false;
    const loadPersonalData = async () => {
      if (!user?._id) {
        setRemoteRecommendations([]);
        return;
      }
      setLoading(true);
      const headers = { Authorization: `Bearer ${localStorage.getItem('token') || ''}` };
      try {
        const [profileResponse, recommendationResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/auth/${user._id}`, { headers }),
          fetch(`${API_BASE_URL}/recommendations/${user._id}`, { headers })
        ]);
        if (!profileResponse.ok || !recommendationResponse.ok) throw new Error('Could not load personalized music');
        const profile = await profileResponse.json();
        const recommendations = await recommendationResponse.json();
        if (cancelled) return;
        const recentIds = new Set((profile.recentlyPlayed || []).map(item => String(item.songId)));
        setRemoteRecommendations(Array.isArray(recommendations) ? recommendations : []);
      } catch (error) {
        if (!cancelled) console.error('Personalized music loading failed:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPersonalData();
    return () => { cancelled = true; };
  }, [user?._id]);

  const moodTracks = useMemo(() => {
    const words = moodRules[selectedMood].map(word => word.toLowerCase());
    const matches = mockSongs.filter(song => {
      const text = `${song.title} ${song.artist} ${song.genre}`.toLowerCase();
      return words.some(word => text.includes(word));
    });
    return matches.length ? matches : mockSongs;
  }, [selectedMood]);

  const recommendedTracks = remoteRecommendations.length ? remoteRecommendations : mockSongs;
  const tracks = view === 'recent' ? recentlyPlayed : view === 'recommended' ? recommendedTracks : moodTracks;
  const title = view === 'recent' ? 'Recently Played' : view === 'recommended' ? 'Recommended for You' : view === 'radio' ? `${selectedMood} Radio` : 'Choose a Mood';
  const subtitle = view === 'recent'
    ? 'Pick up where you left off.'
    : view === 'recommended'
      ? 'Personalized from your likes and listening history.'
      : 'Start a continuous station with songs that match your mood.';

  const startRadio = () => {
    const station = view === 'radio' ? moodTracks : tracks;
    if (!station.length) return;
    clearQueue();
    station.slice(1).forEach(addToQueue);
    playTrack(station[0]);
  };

  return (
    <div className="min-h-full bg-[#0B0F17] p-6 md:p-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-emerald-400">
            {view === 'recent' ? <Clock3 size={18} /> : view === 'recommended' ? <Sparkles size={18} /> : <Radio size={18} />}
            <span className="text-xs font-bold uppercase tracking-widest">TuneBox discovery</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{title}</h1>
          <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>
        </div>
        {(view === 'radio' || view === 'mood') && (
          <button onClick={startRadio} className="rounded-full bg-emerald-500 px-5 py-2.5 font-semibold text-black hover:bg-emerald-400">
            Start station
          </button>
        )}
      </div>

      {(view === 'radio' || view === 'mood') && (
        <div className="mb-7 flex flex-wrap gap-2">
          {Object.keys(moodRules).map(mood => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedMood === mood ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
            >
              {mood}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-neutral-500">Loading your music...</p>
      ) : tracks.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tracks.map(song => (
            <TrackCard
              key={getTrackKey(song)}
              song={song}
              onPlay={playTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              likedSongIds={likedSongIds}
              toggleLike={toggleLike}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-800 py-20 text-center text-neutral-500">
          <p>{view === 'recent' ? 'Play a song and it will appear here.' : 'No tracks are available yet.'}</p>
        </div>
      )}
    </div>
  );
}
