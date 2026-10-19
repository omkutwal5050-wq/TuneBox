import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/sidebar';
import Maincontent from './components/Maincontent';
import UploadSong from './components/UploadSong';
import Profile from './pages/Profile';
import Player from './components/Player';
import AuthModal from './components/AuthModal';
import Search from './pages/Search'; // 1. Import your Search component
import Library from './pages/Library';
import Discover from './pages/Discover';
import AirStudio from './components/AirStudio';

const getTokenRole = (token) => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    return JSON.parse(atob(paddedPayload)).role || '';
  } catch {
    return '';
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'profile', 'search', 'library'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check if user is already logged in on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    let storedUser = null;
    try {
      storedUser = savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem('user');
    }

    if (storedUser && token) {
      const tokenRole = getTokenRole(token);
      setCurrentUser({ ...storedUser, role: tokenRole || storedUser.role || '' });
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
    window.dispatchEvent(new Event('tunebox:user-changed'));
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0B0F17] text-white flex items-center justify-center">
        <p className="text-emerald-500 text-lg animate-pulse">Loading TuneBox...</p>
      </div>
    );
  }

  const isAdmin = String(currentUser?.role || '').toLowerCase() === 'admin';

  // Render the appropriate main content based on currentView
  const renderMainContent = () => {
    switch (currentView) {
      case 'profile':
        return <Profile currentUser={currentUser} />;
      case 'search':
        return <Search />; // 2. Use your Search component here
      case 'library':
        return <Library />;
      case 'recent':
        return <Discover view="recent" />;
      case 'recommended':
        return <Discover view="recommended" />;
      case 'radio':
        return <Discover view="radio" />;
      case 'mood':
        return <Discover view="mood" />;
      case 'air-studio':
        return <AirStudio />;
      case 'upload':
        return isAdmin ? <UploadSong /> : <Maincontent />;
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
              const token = localStorage.getItem('token');
              const tokenRole = token ? getTokenRole(token) : '';
              const resolvedUser = { ...user, role: tokenRole || user.role || '' };
              localStorage.setItem('user', JSON.stringify(resolvedUser));
              setCurrentUser(resolvedUser);
              setIsAuthOpen(false);
              window.dispatchEvent(new Event('tunebox:user-changed'));
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
            <Sidebar
              currentView={currentView}
              setCurrentView={setCurrentView}
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(previous => !previous)}
              isAdmin={isAdmin}
            />
            
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