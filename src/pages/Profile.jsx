import React, { useState, useEffect } from 'react';

export default function Profile({ currentUser }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Ensure we have a valid ID
    const userId = currentUser?._id || currentUser?.id;
    if (!userId) return;

    // Fetch user details from your backend API
    fetch(`http://localhost:5000/api/auth/${userId}`)
      .then(res => res.json())
      .then(data => setUserData(data))
      .catch(err => console.error("Error fetching profile:", err));
  }, [currentUser]);

  if (!userData) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Loading your profile...
      </div>
    );
  }

  return (
    <div className="p-8 text-white overflow-y-auto h-full bg-[#0B0F17]">
      {/* Profile Header */}
      <div className="flex items-center space-x-6 mb-10 border-b border-gray-800 pb-8">
        <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-4xl font-bold text-black shadow-lg shadow-emerald-500/20">
          {userData.username ? userData.username.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">{userData.username}</h1>
          <p className="text-gray-400 mt-1">{userData.email}</p>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Liked Songs */}
        <section className="bg-[#121824] p-6 rounded-2xl border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400 flex items-center">
            <span className="mr-2">❤️</span> Liked Songs
          </h2>
          {userData.likedSongs?.length > 0 ? (
            <ul className="space-y-3">
              {userData.likedSongs.map((song, idx) => (
                <li key={idx} className="bg-[#1a2233] p-3 rounded-lg border border-gray-700/50 hover:border-emerald-500/50 transition">
                  <p className="font-medium">{song.title}</p>
                  <p className="text-sm text-gray-400">{song.artist}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No songs liked yet.</p>
          )}
        </section>

        {/* Playlists */}
        <section className="bg-[#121824] p-6 rounded-2xl border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400 flex items-center">
            <span className="mr-2">🎵</span> Your Playlists
          </h2>
          {userData.playlists?.length > 0 ? (
            <ul className="space-y-3">
              {userData.playlists.map((playlist, idx) => (
                <li key={idx} className="bg-[#1a2233] p-3 rounded-lg border border-gray-700/50 flex justify-between items-center">
                  <span className="font-medium">{playlist.name}</span>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                    {playlist.songs?.length || 0} songs
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No playlists created yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}