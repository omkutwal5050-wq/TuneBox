import React, { useState, useEffect } from 'react';
import { fetchSongs } from './services/api';

function App() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSongs = async () => {
      const data = await fetchSongs();
      setSongs(data);
      setLoading(false);
    };

    loadSongs();
  }, []);

  if (loading) {
    return <div className="loading-screen" style={{ color: 'white', padding: '20px' }}>Loading TuneBox from database...</div>;
  }

  return (
    <div className="app-container" style={{ padding: '20px', color: 'white', background: '#121212', minHeight: '100vh' }}>
      <h1>TuneBox Music Library</h1>
      <div className="song-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {songs.map((song) => (
          <div key={song._id} className="song-card" style={{ background: '#181818', padding: '15px', borderRadius: '8px' }}>
            <img src={song.cover} alt={song.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }} />
            <h3 style={{ margin: '10px 0 5px 0', fontSize: '16px' }}>{song.title}</h3>
            <p style={{ color: '#b3b3b3', margin: '0 0 10px 0', fontSize: '14px' }}>{song.artist}</p>
            <audio controls src={song.audioSrc} style={{ width: '100%', height: '30px' }}></audio>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;