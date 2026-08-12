import React from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MainContent from './components/MainContent';
import Player from './components/Player';

export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0B0F17] text-gray-100 select-none">
      {/* Top Main Section */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Navbar />
          <MainContent />
        </div>
      </div>

      {/* Bottom Audio Player Bar */}
      <Player />
    </div>
  );
}