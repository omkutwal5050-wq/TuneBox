import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MainContent from './components/Maincontent';
import Search from './pages/Search';
import Library from './pages/Library';
import Player from './components/Player';

export default function App() {
  const [currentView, setCurrentView] = useState('home');

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0B0F17] text-slate-100 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Navbar />
          <div className="flex-1 overflow-y-auto relative">
            {currentView === 'home' && <MainContent />}
            {currentView === 'search' && <Search />}
            {currentView === 'library' && <Library />}
          </div>
        </div>
      </div>
      <Player />
    </div>
  );
}