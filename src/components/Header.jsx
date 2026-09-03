import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, Shield, LayoutDashboard } from 'lucide-react';

export default function Header({
  activeChallenge,
  viewMode,
  onToggleAdmin,
  onToggleMobileSidebar
}) {
  const { userProfile } = useAuth();

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
                <span>{viewMode === 'admin' ? "Admin Control Panel" : activeChallenge?.name || "Stella"}</span>
                {viewMode !== 'admin' && activeChallenge && (
                  <span className="text-xs bg-[#1e1f20] text-gray-400 border border-neutral-800 px-3 py-0.5 rounded-full font-normal">
                    {activeChallenge.startDate} → {activeChallenge.endDate}
                  </span>
                )}
                {viewMode === 'admin' && (
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-0.5 rounded-full font-mono font-bold">
                    User Management
                  </span>
                )}
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Action Pills */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Admin Mode Toggle Pill for Admin Users */}
          {userProfile?.role === 'admin' && (
            <button
              onClick={onToggleAdmin}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 flex items-center gap-1.5 active:scale-95 ${
                viewMode === 'admin'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-md'
                  : 'bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border-indigo-700/50'
              }`}
              title={viewMode === 'admin' ? "Switch to App Dashboard" : "Switch to Admin Control Panel"}
            >
              {viewMode === 'admin' ? (
                <>
                  <LayoutDashboard className="w-3.5 h-3.5 text-white" />
                  <span>App Dashboard</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Admin Panel</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
