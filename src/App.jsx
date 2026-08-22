import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/sidebar';
import Maincontent from './components/Maincontent';
import Player from './components/Player';
import AuthModal from './components/AuthModal';

export default function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  return (
    <div className="h-screen bg-[#0B0F17] text-white flex flex-col overflow-hidden relative selection:bg-emerald-500 selection:text-black">
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

      {/* Root-Level Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}