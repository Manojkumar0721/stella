import React, { useState, useEffect, useMemo } from 'react';
import { fetchFriendChallenges } from '../services/socialService';
import { getMonthsInRange } from '../utils/dateUtils';
import Calendar from './Calendar';
import StatsBanner from './StatsBanner';
import DailyModal from './DailyModal';
import { Sparkles, ArrowLeft, Lock, UserCheck, Trophy, Mail } from 'lucide-react';

export default function FriendDashboard({ friendUser, onBackToMyDashboard }) {
  const [challenges, setChallenges] = useState([]);
  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);

  const resolvedFriend = useMemo(() => {
    if (!friendUser) return friendUser;
    try {
      const registry = JSON.parse(localStorage.getItem('stella_registered_users_registry_v1') || '[]');
      const found = registry.find(u => 
        (u.email && u.email.trim().toLowerCase() === friendUser.email?.trim().toLowerCase()) ||
        (u.uid && u.uid === friendUser.uid)
      );
      if (found && found.displayName) {
        return { ...friendUser, ...found };
      }
    } catch {}
    return friendUser;
  }, [friendUser]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetchFriendChallenges(resolvedFriend.uid, resolvedFriend.email);
      setChallenges(res);
      if (res.length > 0) {
        setActiveChallengeId(res[0].id);
      }
      setLoading(false);
    }
    loadData();
  }, [resolvedFriend]);

  const activeChallenge = useMemo(() => {
    return challenges.find(c => c.id === activeChallengeId) || null;
  }, [challenges, activeChallengeId]);

  const calendarState = useMemo(() => {
    return activeChallenge?.calendarState || {};
  }, [activeChallenge]);

  const months = useMemo(() => {
    if (!activeChallenge) return [];
    return getMonthsInRange(activeChallenge.startDate, activeChallenge.endDate);
  }, [activeChallenge]);

  const getDayData = (dateStr) => {
    if (!calendarState[dateStr]) {
      return { topics: [], updates: [] };
    }
    return {
      topics: calendarState[dateStr].topics || [],
      updates: calendarState[dateStr].updates || []
    };
  };

  const getOverallStats = () => {
    let totalTopics = 0;
    let completedTopics = 0;
    let totalUpdates = 0;
    let activeDaysCount = 0;
    let totalDaysInRange = 0;

    if (activeChallenge) {
      const d1 = new Date(activeChallenge.startDate);
      const d2 = new Date(activeChallenge.endDate);
      const diffTime = Math.abs(d2 - d1);
      totalDaysInRange = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    Object.entries(calendarState).forEach(([dateStr, dayData]) => {
      const topics = dayData.topics || [];
      const updates = dayData.updates || [];

      if (topics.length > 0 || updates.length > 0) activeDaysCount++;
      totalTopics += topics.length;
      completedTopics += topics.filter(t => t.completed).length;
      totalUpdates += updates.length;
    });

    const completionRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    return { totalTopics, completedTopics, completionRate, totalUpdates, activeDaysCount, totalDaysInRange };
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner: Friend Connection & Read-Only Badge */}
      <div className="bg-[#1e1f20] border border-neutral-800/80 rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBackToMyDashboard}
            className="p-2.5 rounded-full bg-[#131314] text-gray-300 hover:text-white hover:bg-[#282a2c] transition-colors border border-neutral-800"
            title="Back to My Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <img
            src={resolvedFriend.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${resolvedFriend.email}`}
            alt={resolvedFriend.displayName}
            className="w-11 h-11 rounded-full bg-[#131314] border border-neutral-800 p-0.5"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-gray-100">
                {resolvedFriend.displayName || resolvedFriend.email}
              </h2>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Mail className="w-3 h-3 text-gray-500" />
                <span>{resolvedFriend.email}</span>
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                <UserCheck className="w-3 h-3" /> Connected
              </span>
            </div>
          </div>
        </div>

        {/* Friend's Challenges Selector Pills */}
        {challenges.length > 0 && (
          <div className="flex items-center gap-1.5 bg-[#131314] p-1 rounded-full border border-neutral-800/60 overflow-x-auto max-w-full">
            {challenges.map(ch => (
              <button
                key={ch.id}
                onClick={() => { setActiveChallengeId(ch.id); setCurrentMonthIndex(0); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activeChallengeId === ch.id
                    ? 'bg-[#282a2c] text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {ch.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-[#1e1f20] rounded-3xl border border-neutral-800">
          <Sparkles className="w-6 h-6 animate-spin mx-auto text-blue-400 mb-2" />
          <p className="text-xs">Fetching {resolvedFriend.displayName || resolvedFriend.email}'s active challenges...</p>
        </div>
      ) : activeChallenge ? (
        <>
          {/* Stats Overview */}
          <StatsBanner stats={getOverallStats()} challengeConfig={activeChallenge} />

          {/* Read-Only Dynamic Calendar Grid */}
          <Calendar
            months={months}
            currentMonthIndex={currentMonthIndex}
            setCurrentMonthIndex={setCurrentMonthIndex}
            startDate={activeChallenge.startDate}
            endDate={activeChallenge.endDate}
            getDayData={getDayData}
            onSelectDay={(dateStr) => setSelectedDate(dateStr)}
          />

          {/* Daily Detail View (Read-Only) */}
          {selectedDate && (
            <DailyModal
              dateStr={selectedDate}
              dayData={getDayData(selectedDate)}
              startDate={activeChallenge.startDate}
              endDate={activeChallenge.endDate}
              onClose={() => setSelectedDate(null)}
              onSelectDate={(d) => setSelectedDate(d)}
              onAddTopic={() => {}}
              onUpdateTopic={() => {}}
              onToggleTopic={() => {}}
              onDeleteTopic={() => {}}
              onAddUpdate={() => {}}
              onUpdateUpdate={() => {}}
              onDeleteUpdate={() => {}}
            />
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-400 bg-[#1e1f20] rounded-3xl border border-neutral-800 space-y-2">
          <Trophy className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="text-sm font-medium text-gray-300">No public challenges created yet</p>
          <p className="text-xs text-gray-500">{resolvedFriend.displayName || resolvedFriend.email} hasn't launched any public challenges yet.</p>
        </div>
      )}
    </div>
  );
}
