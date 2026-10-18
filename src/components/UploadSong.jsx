import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';

const initialForm = {
  title: '',
  artist: '',
  genre: ''
};

export default function UploadSong() {
  const [form, setForm] = useState(initialForm);
  const [cover, setCover] = useState(null);
  const [audio, setAudio] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleCoverChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setCover(selectedFile);
  };

  const handleAudioChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setAudio(selectedFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    if (!cover || !audio) {
      setMessage({ type: 'error', text: 'Please select both a cover image and an MP3 file.' });
      return;
    }

    if (!cover.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'The cover file must be an image.' });
      return;
    }

    if (audio.type !== 'audio/mpeg' && !audio.name.toLowerCase().endsWith('.mp3')) {
      setMessage({ type: 'error', text: 'The audio file must be an MP3.' });
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('artist', form.artist.trim());
    formData.append('genre', form.genre.trim());
    formData.append('cover', cover);
    formData.append('audio', audio);

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/admin/songs`, formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setForm(initialForm);
      setCover(null);
      setAudio(null);
      document.getElementById('upload-song-cover')?.form?.reset();
      setMessage({
        type: 'success',
        text: `“${response.data.title || form.title}” was uploaded successfully.`
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Song upload failed. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-800 bg-[#121824] p-6 text-white shadow-xl sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">Admin</p>
        <h1 className="mt-2 text-3xl font-bold">Upload a song</h1>
        <p className="mt-2 text-sm text-gray-400">
          Add song details and upload the cover image and MP3 audio file.
        </p>
      </div>

      {message.text && (
        <div
          role="alert"
          className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/40 bg-red-500/10 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-300">Title</span>
            <input
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-700 bg-[#0B0F17] px-4 py-3 outline-none transition focus:border-emerald-500"
              placeholder="Song title"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-300">Artist</span>
            <input
              name="artist"
              type="text"
              value={form.artist}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-700 bg-[#0B0F17] px-4 py-3 outline-none transition focus:border-emerald-500"
              placeholder="Artist name"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-300">Genre</span>
          <input
            name="genre"
            type="text"
            value={form.genre}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-700 bg-[#0B0F17] px-4 py-3 outline-none transition focus:border-emerald-500"
            placeholder="For example, Bollywood"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-300">Cover image</span>
          <input
            id="upload-song-cover"
            name="cover"
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            required
            className="block w-full cursor-pointer rounded-lg border border-gray-700 bg-[#0B0F17] text-sm text-gray-400 file:mr-4 file:border-0 file:bg-emerald-500 file:px-4 file:py-3 file:font-medium file:text-black hover:file:bg-emerald-400"
          />
          {cover && <p className="mt-2 text-xs text-gray-500">{cover.name}</p>}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-300">MP3 audio</span>
          <input
            name="audio"
            type="file"
            accept=".mp3,audio/mpeg"
            onChange={handleAudioChange}
            required
            className="block w-full cursor-pointer rounded-lg border border-gray-700 bg-[#0B0F17] text-sm text-gray-400 file:mr-4 file:border-0 file:bg-cyan-500 file:px-4 file:py-3 file:font-medium file:text-black hover:file:bg-cyan-400"
          />
          {audio && <p className="mt-2 text-xs text-gray-500">{audio.name}</p>}
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Uploading...' : 'Upload song'}
        </button>
      </form>
    </section>
  );
}
