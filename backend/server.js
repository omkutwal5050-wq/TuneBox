const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Song = require('./models/Song');
const User = require('./models/User');
const Playlist = require('./models/Playlist');

// Import your auth routes
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ==================== AUTH ROUTES ====================
app.use('/api/auth', authRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({ message: "TuneBox backend is running!" });
});

// ==================== SONG ROUTES ====================

// Get all songs
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await Song.find();
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new song
app.post('/api/songs', async (req, res) => {
  try {
    const newSong = new Song(req.body);
    const savedSong = await newSong.save();
    res.status(201).json(savedSong);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== USER ROUTES ====================

// Create a new user
app.post('/api/users', async (req, res) => {
  try {
    const newUser = new User(req.body);
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user profile (including liked songs and playlists)
app.get('/api/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('likedSongs')
      .populate('playlists.songs');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like / Unlike a song
app.post('/api/users/:userId/like', async (req, res) => {
  try {
    const { songId } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    const index = user.likedSongs.indexOf(songId);
    if (index > -1) {
      user.likedSongs.splice(index, 1); // Unlike if already liked
    } else {
      user.likedSongs.push(songId); // Like if not liked
    }

    await user.save();
    res.json(user.likedSongs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ROBUST MULTI-SOURCE SEARCH PROXY ====================
app.get('/api/proxy/search', async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) return res.json({ results: [] });

    let localSongsFormatted = [];
    let jamendoSongs = [];
    let itunesSongs = [];

    // 1. Local MongoDB Database
    try {
      const regex = new RegExp(query, 'i');
      const localSongs = await Song.find({
        $or: [{ title: regex }, { artist: regex }, { genre: regex }]
      });

      localSongsFormatted = localSongs.map(song => ({
        id: song._id.toString(),
        title: song.title,
        artist: song.artist,
        cover: song.cover || '',
        file: song.file || song.audioUrl || '',
        genre: song.genre || 'Local',
        isFullSong: true
      }));
    } catch (err) {
      console.warn("Local DB search error:", err.message);
    }

    // 2. Jamendo API (Full indie tracks)
    try {
      const jamendoUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=5c3451e0&format=json&limit=10&search=${encodeURIComponent(query)}`;
      const jamendoRes = await fetch(jamendoUrl);
      const jamendoData = await jamendoRes.json();
      if (jamendoData && jamendoData.results) {
        jamendoSongs = jamendoData.results.map(track => ({
          id: String(track.id),
          title: track.name,
          artist: track.artist_name,
          cover: track.image || '',
          file: track.audio || '',
          genre: 'Jamendo',
          isFullSong: true
        }));
      }
    } catch (err) {
      console.warn("Jamendo API fetch error:", err.message);
    }

    // 3. iTunes API (Guaranteed mainstream search results)
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`;
      const itunesRes = await fetch(itunesUrl);
      const itunesData = await itunesRes.json();
      if (itunesData && itunesData.results) {
        itunesSongs = itunesData.results.map(track => ({
          id: String(track.trackId),
          title: track.trackName,
          artist: track.artistName,
          cover: track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg') : '',
          file: track.previewUrl || '',
          genre: 'iTunes',
          isFullSong: false
        }));
      }
    } catch (err) {
      console.warn("iTunes API fetch error:", err.message);
    }

    // Combine results so search never returns empty
    const combinedResults = [
      ...localSongsFormatted,
      ...jamendoSongs,
      ...itunesSongs
    ];

    res.json({ results: combinedResults });
  } catch (error) {
    console.error("Search Proxy Error:", error);
    res.status(500).json({ error: 'Failed to search music catalog' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});