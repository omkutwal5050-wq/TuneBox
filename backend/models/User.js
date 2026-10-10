const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    likedSongs: [{
        type: mongoose.Schema.Types.Mixed // Allows both numeric/string mock IDs and ObjectIds
    }],
    playlists: [{
        name: { type: String, required: true },
        songs: [{ type: mongoose.Schema.Types.Mixed }],
        createdAt: { type: Date, default: Date.now }
    }],
    recentlyPlayed: [{
        songId: { type: mongoose.Schema.Types.Mixed, required: true },
        playedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);