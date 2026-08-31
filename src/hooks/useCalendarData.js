import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { formatDateString, isDateInRange } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

const GLOBAL_CHALLENGES_MAP_KEY = 'stella_global_challenges_map_v1';

function getUserStorageKey(uid) {
  return `stella_user_challenges_${uid || 'guest'}`;
}

function getUserActiveIdKey(uid) {
  return `stella_user_active_id_${uid || 'guest'}`;
}

function getActiveUserIdFromStorage() {
  try {
    const saved = localStorage.getItem('stella_active_user_session_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.uid || parsed.email)) {
        const cleanEmail = (parsed.email || '').trim().toLowerCase();
        return parsed.uid || `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
      }
    }
  } catch {}
  return null;
}

function getInitialChallenges(uid) {
  if (!uid) return [];
  try {
    const key = getUserStorageKey(uid);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error reading user challenge storage", e);
  }
  return [];
}

function getInitialActiveId(uid, challenges) {
  if (!uid) return null;
  try {
    const key = getUserActiveIdKey(uid);
    const storedId = localStorage.getItem(key);
    if (storedId && challenges.some(c => c.id === storedId)) {
      return storedId;
    }
  } catch (e) {
    console.error("Error reading active challenge ID", e);
  }
  return challenges.length > 0 ? challenges[0].id : null;
}

export function useCalendarData() {
  const { userProfile } = useAuth();
  const uid = userProfile?.uid || getActiveUserIdFromStorage();

  const [challenges, setChallenges] = useState(() => getInitialChallenges(uid));
  const [activeChallengeId, setActiveChallengeId] = useState(() => getInitialActiveId(uid, challenges));
  const [viewMode, setViewMode] = useState(() => (challenges.length > 0 ? 'calendar' : 'create'));

  const prevUidRef = useRef(uid);

  // Sync challenges when logged-in user changes
  useEffect(() => {
    if (!uid) {
      setChallenges([]);
      setActiveChallengeId(null);
      setViewMode('create');
      prevUidRef.current = null;
      return;
    }

    if (prevUidRef.current !== uid) {
      prevUidRef.current = uid;
      const loadedChallenges = getInitialChallenges(uid);
      const loadedActiveId = getInitialActiveId(uid, loadedChallenges);

      setChallenges(loadedChallenges);
      setActiveChallengeId(loadedActiveId);
      setViewMode(loadedChallenges.length > 0 ? 'calendar' : 'create');
    }
  }, [uid]);

  // Save challenges array to user storage & global friend lookup map
  useEffect(() => {
    if (!uid) return;
    try {
      const userKey = getUserStorageKey(uid);
      localStorage.setItem(userKey, JSON.stringify(challenges));

      // Publish to global challenges map for friend viewing
      const globalMap = JSON.parse(localStorage.getItem(GLOBAL_CHALLENGES_MAP_KEY) || '{}');
      globalMap[uid] = challenges;
      if (userProfile?.email) {
        globalMap[userProfile.email.trim().toLowerCase()] = challenges;
      }
      localStorage.setItem(GLOBAL_CHALLENGES_MAP_KEY, JSON.stringify(globalMap));
    } catch (e) {
      console.error("Error saving challenges to localStorage", e);
    }
  }, [challenges, uid, userProfile]);

  // Save activeChallengeId to user storage
  useEffect(() => {
    if (!uid) return;
    try {
      const activeKey = getUserActiveIdKey(uid);
      if (activeChallengeId) {
        localStorage.setItem(activeKey, activeChallengeId);
      } else {
        localStorage.removeItem(activeKey);
      }
    } catch (e) {
      console.error("Error saving active challenge ID", e);
    }
  }, [activeChallengeId, uid]);

  // Active challenge config
  const activeChallenge = useMemo(() => {
    return challenges.find(c => c.id === activeChallengeId) || null;
  }, [challenges, activeChallengeId]);

  const challengeConfig = useMemo(() => {
    if (!activeChallenge) {
      return { startDate: '2026-09-01', endDate: '2026-11-30', totalDays: 91 };
    }
    const d1 = new Date(activeChallenge.startDate);
    const d2 = new Date(activeChallenge.endDate);
    const diffTime = Math.abs(d2 - d1);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return {
      startDate: activeChallenge.startDate,
      endDate: activeChallenge.endDate,
      totalDays
    };
  }, [activeChallenge]);

  const calendarState = useMemo(() => {
    return activeChallenge?.calendarState || {};
  }, [activeChallenge]);

  // Create a new challenge
  const createChallenge = useCallback(({ name, startDate, endDate }) => {
    const newId = `challenge-${Date.now()}`;
    const newChallenge = {
      id: newId,
      name,
      startDate,
      endDate,
      createdAt: new Date().toISOString(),
      calendarState: {}
    };

    setChallenges(prev => [newChallenge, ...prev]);
    setActiveChallengeId(newId);
    setViewMode('calendar');
    return newId;
  }, []);

  // Select active challenge
  const selectChallenge = useCallback((id) => {
    if (challenges.some(c => c.id === id)) {
      setActiveChallengeId(id);
      setViewMode('calendar');
    }
  }, [challenges]);

  // Delete challenge
  const deleteChallenge = useCallback((id) => {
    setChallenges(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (activeChallengeId === id) {
        if (filtered.length > 0) {
          setActiveChallengeId(filtered[0].id);
        } else {
          setActiveChallengeId(null);
          setViewMode('create');
        }
      }
      return filtered;
    });
  }, [activeChallengeId]);

  // Get data for a specific day in active challenge
  const getDayData = useCallback((dateStr) => {
    if (!calendarState[dateStr]) {
      return { topics: [], updates: [] };
    }
    return {
      topics: calendarState[dateStr].topics || [],
      updates: calendarState[dateStr].updates || []
    };
  }, [calendarState]);

  // Helper to update active challenge state
  const updateActiveCalendarState = useCallback((updater) => {
    if (!activeChallengeId) return;

    setChallenges(prev => prev.map(ch => {
      if (ch.id !== activeChallengeId) return ch;
      const currentCalState = ch.calendarState || {};
      const newCalState = updater(currentCalState);
      return {
        ...ch,
        calendarState: newCalState
      };
    }));
  }, [activeChallengeId]);

  // Add Topic
  const addTopic = useCallback((dateStr, title) => {
    if (!title || !title.trim()) return;
    updateActiveCalendarState(prev => {
      const dayObj = prev[dateStr] || { topics: [], updates: [] };
      const newTopic = {
        id: `topic-${Date.now()}`,
        title: title.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };
      return {
        ...prev,
        [dateStr]: {
          ...dayObj,
          topics: [...(dayObj.topics || []), newTopic]
        }
      };
    });
  }, [updateActiveCalendarState]);

  // Update Topic Title
  const updateTopic = useCallback((dateStr, topicId, newTitle) => {
    if (!newTitle || !newTitle.trim()) return;
    updateActiveCalendarState(prev => {
      const dayObj = prev[dateStr];
      if (!dayObj || !dayObj.topics) return prev;
      return {
        ...prev,
        [dateStr]: {
          ...dayObj,
          topics: dayObj.topics.map(t =>
            t.id === topicId ? { ...t, title: newTitle.trim() } : t
          )
        }
      };
    });
  }, [updateActiveCalendarState]);

  // Toggle Topic Completion
  const toggleTopic = useCallback((dateStr, topicId) => {
    updateActiveCalendarState(prev => {
      const dayObj = prev[dateStr];
      if (!dayObj || !dayObj.topics) return prev;
      return {
        ...prev,
        [dateStr]: {
          ...dayObj,
          topics: dayObj.topics.map(t =>
            t.id === topicId ? { ...t, completed: !t.completed } : t
          )
        }
      };
    });
  }, [updateActiveCalendarState]);

  // Delete Topic
  const deleteTopic = useCallback((dateStr, topicId) => {
    updateActiveCalendarState(prev => {
      const dayObj = prev[dateStr];
      if (!dayObj || !dayObj.topics) return prev;
      return {
        ...prev,
        [dateStr]: {
          ...dayObj,
          topics: dayObj.topics.filter(t => t.id !== topicId)
        }
      };
    });
  }, [updateActiveCalendarState]);

  // Add Update Note
  const addUpdate = useCallback((dateStr, text) => {
    if (!text || !text.trim()) return;
    updateActiveCalendarState(prev => {
      const dayObj = prev[dateStr] || { topics: [], updates: [] };
      const newUpdate = {
        id: `update-${Date.now()}`,
        text: text.trim(),
        timestamp: new Date().toISOString()
      };
      return {
        ...prev,
        [dateStr]: {
          ...dayObj,
          updates: [...(dayObj.updates || []), newUpdate]
        }
      };
    });
  }, [updateActiveCalendarState]);

  // Update Note Text
  const updateUpdate = useCallback((dateStr, updateId, newText) => {
    if (!newText || !newText.trim()) return;
    updateActiveCalendarState(prev => {
      const dayObj = prev[dateStr];
      if (!dayObj || !dayObj.updates) return prev;
      return {
        ...prev,
        [dateStr]: {
          ...dayObj,
          updates: dayObj.updates.map(u =>
            u.id === updateId ? { ...u, text: newText.trim() } : u
          )
        }
      };
    });
  }, [updateActiveCalendarState]);

  // Delete Update Note
  const deleteUpdate = useCallback((dateStr, updateId) => {
    updateActiveCalendarState(prev => {
      const dayObj = prev[dateStr];
      if (!dayObj || !dayObj.updates) return prev;
      return {
        ...prev,
        [dateStr]: {
          ...dayObj,
          updates: dayObj.updates.filter(u => u.id !== updateId)
        }
      };
    });
  }, [updateActiveCalendarState]);

  // Overall Statistics for Active Challenge
  const getOverallStats = useCallback(() => {
    let totalTopics = 0;
    let completedTopics = 0;
    let totalUpdates = 0;
    let activeDaysCount = 0;

    Object.entries(calendarState).forEach(([dateStr, dayData]) => {
      const topics = dayData.topics || [];
      const updates = dayData.updates || [];

      if (topics.length > 0 || updates.length > 0) {
        activeDaysCount++;
      }

      totalTopics += topics.length;
      completedTopics += topics.filter(t => t.completed).length;
      totalUpdates += updates.length;
    });

    const completionRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return {
      totalTopics,
      completedTopics,
      completionRate,
      totalUpdates,
      activeDaysCount,
      totalDaysInRange: challengeConfig.totalDays
    };
  }, [calendarState, challengeConfig]);

  // Challenge summary helper
  const getChallengeSummary = useCallback((challenge) => {
    let totalTopics = 0;
    let completedTopics = 0;
    const state = challenge.calendarState || {};

    Object.values(state).forEach(day => {
      const topics = day.topics || [];
      totalTopics += topics.length;
      completedTopics += topics.filter(t => t.completed).length;
    });

    const completionRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    return { totalTopics, completedTopics, completionRate };
  }, []);

  // Clear all application data
  const clearAllData = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all data? This will remove all your challenges and tasks.")) {
      try {
        localStorage.removeItem(MULTI_CHALLENGE_STORAGE_KEY);
        localStorage.removeItem(ACTIVE_CHALLENGE_ID_KEY);
        localStorage.removeItem(LEGACY_CONFIG_KEY);
        localStorage.removeItem(LEGACY_DATA_KEY);
      } catch (e) {
        console.error("Error clearing localStorage", e);
      }
      setChallenges([]);
      setActiveChallengeId(null);
      setViewMode('create');
    }
  }, []);

  return {
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
    clearAllData,
    getChallengeSummary
  };
}
