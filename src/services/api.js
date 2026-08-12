import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Fetch all songs from MongoDB
export const fetchSongs = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/songs`);
    return response.data;
  } catch (error) {
    console.error('Error fetching songs:', error);
    return [];
  }
};

// Add a new song to MongoDB
export const addSong = async (songData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/songs`, songData);
    return response.data;
  } catch (error) {
    console.error('Error adding song:', error);
    throw error;
  }
};

// Fetch user data (liked songs, playlists)
export const fetchUser = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

// Like or Unlike a song
export const toggleLikeSong = async (userId, songId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/${userId}/like`, { songId });
    return response.data;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};