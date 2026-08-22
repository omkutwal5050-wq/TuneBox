import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/sidebar';
import Maincontent from './components/Maincontent';
import Player from './components/Player';
import AuthModal from './components/AuthModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      // If not logged in, force open the auth modal
      setIsAuthOpen(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsAuthOpen(true); // Open auth modal again on logout
  };

  // Prevent flashing the main app while checking localStorage
  if (isLoading) {
    return (
      <div className="h-screen bg-[#0B0F17] text-white flex items-center justify-center">
        <p className="text-emerald-500 text-lg animate-pulse">Loading TuneBox...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0B0F17] text-white flex flex-col overflow-hidden relative selection:bg-emerald-500 selection:text-black">
      {/* If user is not logged in, force them to authenticate via modal */}
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
            className="px-6 py-3 bg-emerald-500 text-black font-semibold rounded-full hover:bg-emerald-400 transition shadow-lg"
          >
            Sign In / Register
          </button>

          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => {
              // Only allow closing if a user is logged in
              if (currentUser) setIsAuthOpen(false);
            }}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              setIsAuthOpen(false);
            }}
          />
        </div>
      ) : (
        /* Full App Access Once Logged In */
        <>
          {/* Top Navigation */}
          <Navbar 
            currentUser={currentUser} 
            onOpenAuth={() => setIsAuthOpen(true)} 
            onLogout={handleLogout} 
          />

          {/* Main Body (Sidebar + Content) */}
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <Maincontent />
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