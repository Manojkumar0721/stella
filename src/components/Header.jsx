import React from 'react';
import { Trash2, Menu } from 'lucide-react';

export default function Header({
  activeChallenge,
  onToggleMobileSidebar,
  onClearAll
}) {
  return (
    <header className="bg-[#131314]/90 border-b border-neutral-800/40 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Active Challenge Info */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 rounded-full bg-[#1e1f20] text-gray-300 hover:bg-[#282a2c] hover:text-white transition-colors"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-semibold text-gray-100 tracking-tight flex flex-wrap items-center gap-2">
                <span>{activeChallenge?.name || "Stella"}</span>
                {activeChallenge && (
                  <span className="text-xs bg-[#1e1f20] text-gray-400 border border-neutral-800 px-3 py-0.5 rounded-full font-normal">
                    {activeChallenge.startDate} → {activeChallenge.endDate}
                  </span>
                )}
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Action Pills */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Clear Active Data */}
          {activeChallenge && (
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to clear all topics and notes for "${activeChallenge.name}"?`)) {
                  onClearAll();
                }
              }}
              className="bg-[#1e1f20] hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 px-3.5 py-1.5 rounded-full text-xs font-medium border border-neutral-800/60 transition-all duration-200 flex items-center gap-1.5 active:scale-95"
              title="Clear topics/notes for active challenge"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
