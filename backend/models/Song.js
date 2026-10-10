const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    required: true,
    trim: true
  },
  genre: {
    type: String,
    required: true,
    trim: true
  },
  cover: {
    type: String,
    required: true
  },
  audioSrc: {
    type: String,
    required: true
  },
  album: { type: String, trim: true, default: '' },
  duration: { type: Number, min: 0, default: 0 },
  audioQuality: { type: String, enum: ['low', 'standard', 'high', 'lossless'], default: 'standard' },
  lyrics: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Song', songSchema);