import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatsBanner from './components/StatsBanner';
import Calendar from './components/Calendar';
import DailyModal from './components/DailyModal';
import ChallengeSetup from './components/ChallengeSetup';
import FriendDashboard from './components/FriendDashboard';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import { useCalendarData } from './hooks/useCalendarData';
import { getMonthsInRange } from './utils/dateUtils';
import { Sparkles, ArrowRight, Calendar as CalendarIcon } from 'lucide-react';

export default function App() {
  const { userProfile, loading } = useAuth();
  
  const {
    challenges,
    activeChallengeId,
    activeChallenge,
    challengeConfig,
    calendarState,
    viewMode,
    setViewMode,
    createChallenge,
    selectChallenge,
    deleteChallenge,
    getDayData,
    addTopic,
    updateTopic,
    toggleTopic,
    deleteTopic,
    addUpdate,
    updateUpdate,
    deleteUpdate,
    getOverallStats,
    resetToDemo,
    clearAllData,
    getChallengeSummary
  } = useCalendarData();

  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);
  const [selectedFriendUser, setSelectedFriendUser] = useState(null);

  // Reset month index to 0 whenever active challenge changes
  useEffect(() => {
    setCurrentMonthIndex(0);
    setSelectedDate(null);
  }, [activeChallengeId]);

  // Compute months dynamically based on active challenge date range
  const months = useMemo(() => {
    if (!activeChallenge) return [];
    return getMonthsInRange(activeChallenge.startDate, activeChallenge.endDate);
  }, [activeChallenge]);

  const stats = getOverallStats();

  // If loading auth state, display minimalist Gemini loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-[#131314] text-gray-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <Sparkles className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Loading Stella...</p>
        </div>
      </div>
    );
  }

  // REQUIREMENT: Must complete Registration / Login before entering the application
  if (!userProfile) {
    return <AuthModal />;
  }

  return (
    <div className="min-h-screen bg-[#131314] text-gray-100 flex flex-col md:flex-row font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Side Navigation Bar */}
      <Sidebar
        challenges={challenges}
        activeChallengeId={activeChallengeId}
        viewMode={viewMode}
        onSelectChallenge={(id) => { setSelectedFriendUser(null); selectChallenge(id); }}
        onCreateNewClick={() => { setSelectedFriendUser(null); setViewMode('create'); }}
        onDeleteChallenge={deleteChallenge}
        getChallengeSummary={getChallengeSummary}
        onSelectFriend={(friend) => setSelectedFriendUser(friend)}
        activeFriendUser={selectedFriendUser}
        onSelectAdmin={() => { setSelectedFriendUser(null); setViewMode('admin'); }}
        isOpenMobile={isOpenMobileSidebar}
        onCloseMobile={() => setIsOpenMobileSidebar(false)}
      />

      {/* Main Content Body */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          activeChallenge={selectedFriendUser ? { name: `${selectedFriendUser.displayName || selectedFriendUser.email}'s Profile` } : activeChallenge}
          viewMode={viewMode}
          onToggleAdmin={() => { setSelectedFriendUser(null); setViewMode(prev => prev === 'admin' ? 'calendar' : 'admin'); }}
          onToggleMobileSidebar={() => setIsOpenMobileSidebar(prev => !prev)}
          onClearAll={clearAllData}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
          {viewMode === 'admin' && userProfile?.role === 'admin' ? (
            /* Admin Control Panel View */
            <AdminDashboard
              onBackToDashboard={() => setViewMode(challenges.length > 0 ? 'calendar' : 'create')}
            />
          ) : selectedFriendUser ? (
            /* Friend's Read-Only Dashboard */
            <FriendDashboard
              friendUser={selectedFriendUser}
              onBackToMyDashboard={() => setSelectedFriendUser(null)}
            />
          ) : viewMode === 'create' || !activeChallenge ? (
            /* Create Challenge View */
            <ChallengeSetup
              onCreateChallenge={createChallenge}
              onCancel={() => activeChallenge && setViewMode('calendar')}
              hasExistingChallenges={challenges.length > 0}
            />
          ) : (
            /* Active Challenge View */
            <>
              {/* Active Challenge Information Banner */}
              <div className="bg-[#1e1f20] border border-neutral-800/60 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-[#282a2c] text-blue-400 border border-neutral-700/40 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-100">
                      {activeChallenge.name} ({activeChallenge.startDate} to {activeChallenge.endDate})
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Select any date cell on the calendar grid below to add tasks, monitor completion progress, and log daily reflection notes.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-blue-400 bg-[#282a2c] border border-neutral-700/40 px-3.5 py-1.5 rounded-full self-end sm:self-center">
                  <span>Select any date cell</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Aggregate Challenge Statistics Overview */}
              <StatsBanner stats={stats} challengeConfig={challengeConfig} />

              {/* Main Dynamic Calendar View */}
              <Calendar
                months={months}
                currentMonthIndex={currentMonthIndex}
                setCurrentMonthIndex={setCurrentMonthIndex}
                startDate={activeChallenge.startDate}
                endDate={activeChallenge.endDate}
                getDayData={getDayData}
                onSelectDay={(dateStr) => setSelectedDate(dateStr)}
              />
            </>
          )}
        </main>

        {/* Daily Detail View Modal */}
        {selectedDate && activeChallenge && !selectedFriendUser && viewMode !== 'admin' && (
          <DailyModal
            dateStr={selectedDate}
            dayData={getDayData(selectedDate)}
            startDate={activeChallenge.startDate}
            endDate={activeChallenge.endDate}
            onClose={() => setSelectedDate(null)}
            onSelectDate={(newDateStr) => setSelectedDate(newDateStr)}
            onAddTopic={addTopic}
            onUpdateTopic={updateTopic}
            onToggleTopic={toggleTopic}
            onDeleteTopic={deleteTopic}
            onAddUpdate={addUpdate}
            onUpdateUpdate={updateUpdate}
            onDeleteUpdate={deleteUpdate}
          />
        )}

        {/* Footer */}
        <footer className="border-t border-neutral-800/40 bg-[#131314] py-6 text-center text-xs text-gray-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="font-serif font-bold text-gray-300">Stella</span>
            </div>
            <div className="flex items-center gap-3">
              {userProfile && (
                <span className="text-[11px] text-gray-400">
                  Signed in as {userProfile.displayName || userProfile.email} ({userProfile.email})
                  {userProfile.role === 'admin' && <strong className="text-indigo-400 ml-1.5">[Admin]</strong>}
                </span>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
