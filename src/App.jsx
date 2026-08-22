import React, { useState, useEffect, useContext } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/sidebar';
import Maincontent from './components/Maincontent';
import Profile from './pages/Profile';
import Player from './components/Player';
import AuthModal from './components/AuthModal';
import { PlayerContext } from './context/Playercontext';
import { mockSongs } from './data/songsData';
import { Play, Heart } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'profile', 'search', 'library'

  const { likedSongIds, playTrack } = useContext(PlayerContext);

  // Check if user is already logged in on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      setIsAuthOpen(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setCurrentView('home');
    setIsAuthOpen(true);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0B0F17] text-white flex items-center justify-center">
        <p className="text-emerald-500 text-lg animate-pulse">Loading TuneBox...</p>
      </div>
    );
  }

  // Filter mockSongs to find the ones that match the user's liked song IDs
  const likedSongsList = mockSongs.filter((song) => 
    likedSongIds.some((id) => String(id) === String(song.id))
  );

  // Render the appropriate main content based on currentView
  const renderMainContent = () => {
    switch (currentView) {
      case 'profile':
        return <Profile currentUser={currentUser} />;
      case 'search':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Search</h2>
            <p className="text-neutral-400">Search functionality coming up next!</p>
          </div>
        );
      case 'library':
        return (
          <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Heart size={32} fill="white" className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-white">Liked Songs</h1>
                <p className="text-neutral-400 text-sm">{likedSongsList.length} saved tracks</p>
              </div>
            </div>

            {likedSongsList.length === 0 ? (
              <div className="text-center py-16 bg-neutral-900/50 rounded-2xl border border-neutral-800">
                <p className="text-neutral-400 text-lg mb-2">No liked songs yet!</p>
                <p className="text-neutral-500 text-sm">Click the heart icon on any song to add it to your library.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {likedSongsList.map((song, index) => (
                  <div 
                    key={song.id}
                    onClick={() => playTrack(song)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800/60 transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-neutral-500 font-medium w-6 text-center">{index + 1}</span>
                      <div className="relative">
                        <img src={song.cover} alt={song.title} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-lg">
                          <Play size={18} fill="white" className="text-white ml-0.5" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-sm group-hover:text-emerald-400 transition">{song.title}</h4>
                        <p className="text-neutral-400 text-xs">{song.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Heart size={18} fill="currentColor" className="text-rose-500" />
                      <span className="text-neutral-400 text-xs">{song.duration || "3:00"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'home':
      default:
        return <Maincontent />;
    }
  };

  return (
    <div className="h-screen bg-[#0B0F17] text-white flex flex-col overflow-hidden relative selection:bg-emerald-500 selection:text-black">
      {!currentUser ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
            Welcome to TuneBox
          </h1>
          <p className="text-gray-400 mb-6 max-w-md">
            Please sign in or create an account to start listening to your favorite music library.
          </p>
          <button
            onClick={() => setIsAuthOpen(true)}
            className="px-6 py-3 bg-emerald-500 text-black font-semibold rounded-full hover:bg-emerald-400 transition shadow-lg cursor-pointer"
          >
            Sign In / Register
          </button>

          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => {
              if (currentUser) setIsAuthOpen(false);
            }}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              setIsAuthOpen(false);
            }}
          />
        </div>
      ) : (
        <>
          {/* Top Navigation */}
          <Navbar 
            currentUser={currentUser} 
            onOpenAuth={() => setIsAuthOpen(true)} 
            onLogout={handleLogout} 
            onViewProfile={() => setCurrentView('profile')}
            onViewHome={() => setCurrentView('home')}
          />

          {/* Main Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar receives currentView and setCurrentView */}
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
            
            <main className="flex-1 overflow-y-auto">
              {renderMainContent()}
            </main>
          </div>

          {/* Persistent Audio Player Footer */}
          <div className="shrink-0 z-20">
            <Player />
          </div>
        </>
      )}
    </div>
  );
}