const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { Readable } = require('stream');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { upload } = require('./utils/cloudinary');

const Song = require('./models/Song');
const User = require('./models/User');
const Playlist = require('./models/Playlist');
const { requireAuth, sameUser, requireAdmin } = require('./middleware/auth');

// Import your auth routes
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const API_ORIGIN = process.env.PUBLIC_API_ORIGIN || `http://localhost:${PORT}`;
const frontendOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || frontendOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin is not allowed'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is missing. Create backend/.env before starting the server.');
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET is missing or too weak. Configure a random secret with at least 32 characters.');
}
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_ORIGINS) {
  throw new Error('FRONTEND_ORIGINS is required in production.');
}
const publicUser = (user) => {
  const result = user.toObject ? user.toObject() : { ...user };
  delete result.password;
  return result;
};
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
const toMediaUrl = (value, directory) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const normalized = value.replace(/^public[\\/]/, '').replace(/^[/\\]+/, '');
  if (normalized.startsWith(`${directory}/`)) {
    return `${API_ORIGIN}/${normalized}`;
  }
  return `${API_ORIGIN}/${directory}/${normalized}`;
};

const allowedPreviewHosts = new Set([
  'audio.jamendo.com',
  'api.jamendo.com',
  'audio-ssl.itunes.apple.com',
  'audio.itunes.apple.com',
  'itunes.apple.com',
  'p.scdn.co'
]);

const toPreviewProxyUrl = (value) => {
  if (!value) return '';
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    if (!allowedPreviewHosts.has(parsed.hostname.toLowerCase())) return value;
    return `${API_ORIGIN}/api/proxy/audio?url=${encodeURIComponent(parsed.toString())}`;
  } catch {
    return '';
  }
};

// Middleware
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth') && ['POST'].includes(req.method)) {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    req.app.locals.authRate = req.app.locals.authRate || new Map();
    const entry = req.app.locals.authRate.get(key) || { count: 0, startedAt: now };
    if (now - entry.startedAt > 15 * 60 * 1000) {
      entry.count = 0;
      entry.startedAt = now;
    }
    entry.count += 1;
    req.app.locals.authRate.set(key, entry);
    if (entry.count > 20) return res.status(429).json({ error: 'Too many authentication attempts' });
  }
  next();
});
app.use('/songs', express.static(path.resolve(__dirname, '../public/songs')));
app.use('/coverpages', express.static(path.resolve(__dirname, '../public/coverpages')));
app.use('/uploads', express.static(path.resolve(__dirname, '../public/uploads')));

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

app.get('/api/proxy/audio', async (req, res) => {
  try {
    const sourceUrl = String(req.query.url || '');
    const parsed = new URL(sourceUrl);
    if (!['http:', 'https:'].includes(parsed.protocol) || !allowedPreviewHosts.has(parsed.hostname.toLowerCase())) {
      return res.status(400).json({ error: 'Unsupported preview source' });
    }

    const headers = {};
    if (req.headers.range) headers.Range = req.headers.range;
    const upstream = await fetch(parsed, { headers, redirect: 'follow' });
    if (!upstream.ok && upstream.status !== 206) {
      return res.status(upstream.status).json({ error: 'Preview source is unavailable' });
    }

    const isItunesPreview = parsed.hostname.toLowerCase().includes('itunes.apple.com');
    if (isItunesPreview) {
      if (!upstream.body) return res.status(502).json({ error: 'Preview source returned no audio' });

      const ffmpeg = spawn(ffmpegPath, [
        '-hide_banner', '-loglevel', 'error',
        '-i', 'pipe:0',
        '-vn',
        '-f', 'mp3',
        '-codec:a', 'libmp3lame',
        '-b:a', '128k',
        'pipe:1'
      ], { windowsHide: true });

      res.status(200);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      ffmpeg.stdout.pipe(res);
      ffmpeg.stderr.on('data', data => console.error('Preview transcoder error:', data.toString().trim()));
      ffmpeg.on('error', error => {
        console.error('Preview transcoder failed:', error.message);
        if (!res.headersSent) res.status(502).json({ error: 'Unable to transcode audio preview' });
        else res.destroy(error);
      });
      res.on('close', () => {
        if (!ffmpeg.killed) ffmpeg.kill();
      });
      Readable.fromWeb(upstream.body).pipe(ffmpeg.stdin);
      return;
    }

    res.status(upstream.status);
    const passthroughHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    passthroughHeaders.forEach(header => {
      const value = upstream.headers.get(header);
      if (value && header !== 'content-type') res.setHeader(header, value);
    });
    // iTunes labels AAC previews as audio/x-m4p, which Chromium rejects even
    // though the payload is an ordinary MP4 audio stream.
    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (!upstream.body) return res.end();
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    console.error('Preview proxy error:', error.message);
    res.status(502).json({ error: 'Unable to load audio preview' });
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

app.post('/api/admin/songs', requireAuth, requireAdmin, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, artist, genre, album = '', duration = 0, audioQuality = 'standard', lyrics = '' } = req.body;
    const audio = req.files?.audio?.[0];
    const cover = req.files?.cover?.[0];
    if (!title || !artist || !genre || !audio || !cover) {
      return res.status(400).json({ error: 'title, artist, genre, audio, and cover are required' });
    }
    const song = await Song.create({
      title, artist, genre, album, duration, audioQuality, lyrics,
      audioSrc: audio.path,
      cover: cover.path
    });
    res.status(201).json(song);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/catalog/facets', async (req, res) => {
  try {
    const [genres, artists, albums] = await Promise.all([
      Song.distinct('genre'),
      Song.distinct('artist'),
      Song.distinct('album', { album: { $ne: '' } })
    ]);
    res.json({ genres, artists, albums });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== USER ROUTES ====================

// Create a new user
app.post('/api/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    if (!username || !email || !password || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'username, email, password, and a valid role are required' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = new User({ username, email, password: passwordHash, role });
    const savedUser = await newUser.save();
    res.status(201).json(publicUser(savedUser));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user profile (including liked songs and playlists)
app.get('/api/users/:userId', requireAuth, sameUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('likedSongs')
      .populate('playlists.songs');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(publicUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like / Unlike a song
app.post('/api/users/:userId/like', requireAuth, sameUser, async (req, res) => {
  try {
    const { songId, track } = req.body;
    if (songId === undefined || songId === null || songId === '') {
      return res.status(400).json({ error: 'songId is required' });
    }
    const user = await User.findById(req.params.userId);
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    const index = user.likedSongs.findIndex(id => String(id?.id || id?._id || id) === String(songId));
    if (index > -1) {
      user.likedSongs.splice(index, 1); // Unlike if already liked
    } else {
      user.likedSongs.push(toLikedSongSnapshot(track, songId)); // Like if not liked
    }

    await user.save();
    res.json(user.likedSongs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:userId/recently-played', requireAuth, sameUser, async (req, res) => {
  try {
    const { songId } = req.body;
    if (songId === undefined || songId === null) return res.status(400).json({ error: 'songId is required' });
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.recentlyPlayed = [
      { songId, track, playedAt: new Date() },
      ...user.recentlyPlayed.filter(item => String(item.songId) !== String(songId))
    ];
    await user.save();
    res.json(user.recentlyPlayed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/recommendations/:userId', requireAuth, sameUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const likedIds = new Set((user.likedSongs || []).map(String));
    const recentIds = new Set((user.recentlyPlayed || []).map(item => String(item.songId)));
    const songs = await Song.find().limit(100).lean();
    const results = songs
      .map(song => ({ ...song, recommendationScore: (likedIds.has(String(song._id)) ? 3 : 0) + (recentIds.has(String(song._id)) ? 2 : 0) }))
      .sort((a, b) => b.recommendationScore - a.recommendationScore);
    res.json(results);
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
        cover: toMediaUrl(song.cover, 'coverpages'),
        file: toPreviewProxyUrl(toMediaUrl(song.audioSrc || song.file || song.audioUrl, 'songs')),
        audioSrc: toPreviewProxyUrl(toMediaUrl(song.audioSrc || song.file || song.audioUrl, 'songs')),
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
          file: toPreviewProxyUrl(track.audio),
          audioSrc: toPreviewProxyUrl(track.audio),
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
          file: toPreviewProxyUrl(track.previewUrl),
          audioSrc: toPreviewProxyUrl(track.previewUrl),
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