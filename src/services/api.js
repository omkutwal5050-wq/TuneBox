import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export { API_BASE_URL };

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
    const response = await axios.get(`${API_BASE_URL}/users/${userId}`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

// Like or Unlike a song
export const toggleLikeSong = async (userId, songId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/${userId}/like`, { songId }, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};