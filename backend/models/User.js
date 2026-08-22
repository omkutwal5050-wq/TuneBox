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
    likedSongs: [{
        type: mongoose.Schema.Types.Mixed // Allows both numeric/string mock IDs and ObjectIds
    }],
    playlists: [{
        name: { type: String, required: true },
        songs: [{ type: mongoose.Schema.Types.Mixed }],
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);