const mongoose = require('mongoose');
require('dotenv').config();
const Song = require('./models/Song');

const sampleSongs = [
  {
    title: "Dreamscape",
    artist: "Synthwave Artist",
    genre: "Electronic",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    title: "Neon Horizon",
    artist: "Retro Pulse",
    genre: "Synthwave",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    title: "Midnight Drive",
    artist: "Night Runner",
    genre: "Synthwave",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected for seeding...');
    await Song.deleteMany({}); // Clears existing songs to avoid duplicates
    await Song.insertMany(sampleSongs);
    console.log('Sample songs added successfully!');
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error('Seeding error:', err);
  });