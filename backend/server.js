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

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});