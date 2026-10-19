const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSecret, requireAuth, sameUser } = require('../middleware/auth');
const { validateCredentials } = require('../middleware/validate');

const publicUser = (user) => {
  const result = user.toObject ? user.toObject() : { ...user };
  delete result.password;
  return result;
};

const issueToken = (user) => jwt.sign({ userId: user._id.toString(), email: user.email, role: user.role }, getSecret(), { expiresIn: '7d' });
const toLikedSongSnapshot = (track, songId) => {
  if (!track || typeof track !== 'object') return songId;
  const snapshot = {};
  ['id', '_id', 'title', 'artist', 'album', 'genre', 'cover', 'audioSrc', 'file', 'audioUrl', 'lyrics', 'duration', 'isFullSong'].forEach((key) => {
    if (track[key] !== undefined && track[key] !== null) snapshot[key] = track[key];
  });
  snapshot.id = snapshot.id || snapshot._id || songId;
  delete snapshot._id;
  return snapshot;
};

// Register a new user
router.post('/register', validateCredentials, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: String(username).trim() }
      ]
    });
    if (existingUser) {
      const duplicateField = existingUser.email === normalizedEmail ? 'email' : 'username';
      return res.status(409).json({ error: `User with this ${duplicateField} already exists` });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = new User({ username: String(username).trim(), email: normalizedEmail, password: passwordHash });
    await newUser.save();
    
    res.status(201).json({ message: 'User registered successfully', token: issueToken(newUser), user: publicUser(newUser) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login user
router.post('/login', validateCredentials, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const matches = user.password.startsWith('$2')
      ? await bcrypt.compare(password, user.password)
      : user.password === password;
    if (!matches) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.password.startsWith('$2')) {
      user.password = await bcrypt.hash(password, 12);
      await user.save();
    }

    res.json({ message: 'Login successful', token: issueToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific user details (for Profile page)
router.get('/:userId', requireAuth, sameUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('likedSongs');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(publicUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a playlist to user profile
router.post('/:userId/playlists', requireAuth, sameUser, async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name) return res.status(400).json({ error: 'Playlist name is required' });
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.playlists.push({ name, songs: [] });
    await user.save();
    res.status(201).json(user.playlists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rename a playlist without changing the existing embedded playlist schema.
router.patch('/:userId/playlists/:playlistId', requireAuth, sameUser, async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name) return res.status(400).json({ error: 'Playlist name is required' });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const playlist = user.playlists.id(req.params.playlistId);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    playlist.name = name;
    await user.save();
    res.json(user.playlists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add or remove a song in an embedded playlist.
router.patch('/:userId/playlists/:playlistId/songs', requireAuth, sameUser, async (req, res) => {
  try {
    const { songId, action = 'add' } = req.body;
    if (songId === undefined || songId === null || !['add', 'remove'].includes(action)) {
      return res.status(400).json({ error: 'songId and a valid action are required' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const playlist = user.playlists.id(req.params.playlistId);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    const songIdString = String(songId);
    const existingIndex = playlist.songs.findIndex(id => String(id) === songIdString);
    if (action === 'add' && existingIndex === -1) playlist.songs.push(songId);
    if (action === 'remove' && existingIndex !== -1) playlist.songs.splice(existingIndex, 1);

    await user.save();
    res.json(user.playlists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:userId/playlists/:playlistId', requireAuth, sameUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const playlist = user.playlists.id(req.params.playlistId);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    user.playlists.pull({ _id: req.params.playlistId });
    await user.save();
    res.json(user.playlists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Liked Song Route
router.post('/:userId/like', requireAuth, sameUser, async (req, res) => {
  try {
    const { songId, track } = req.body;
    if (songId === undefined || songId === null || songId === '') {
      return res.status(400).json({ error: 'songId is required' });
    }
    const user = await User.findById(req.params.userId);
    
    if (!user) return res.status(404).json({ error: "User not found" });

    const songIdStr = String(songId);
    const songIndex = user.likedSongs.findIndex(id => String(id?.id || id?._id || id) === songIdStr);

    if (songIndex > -1) {
      user.likedSongs.splice(songIndex, 1); // Unlike / remove
    } else {
      user.likedSongs.push(toLikedSongSnapshot(track, songId));
    }

    await user.save();
    
    // Return updated user populated with their liked songs
    const updatedUser = await User.findById(user._id).populate('likedSongs');
    res.status(200).json(publicUser(updatedUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;