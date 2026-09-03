import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  searchUsers, sendFriendRequest, fetchPendingRequests, acceptFriendRequest, declineFriendRequest, fetchFriends, getRelationshipStatus 
} from '../services/socialService';
import ProfileModal from './ProfileModal';
import { 
  Sparkles, Plus, Calendar, Trash2, X, Search, UserPlus, Users, Check, Bell, LogOut, CheckCircle2, Shield, UserCheck 
} from 'lucide-react';

export default function Sidebar({
  challenges,
  activeChallengeId,
  viewMode,
  onSelectChallenge,
  onCreateNewClick,
  onDeleteChallenge,
  getChallengeSummary,
  onSelectFriend,
  activeFriendUser,
  onSelectAdmin,
  isOpenMobile,
  onCloseMobile
}) {
  const { userProfile, logout } = useAuth();
  
  // Search & Profile Modal State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [sentRequestsMap, setSentRequestsMap] = useState({});

  // Load Social Data
  const loadSocialData = async () => {
    if (!userProfile) return;
    const reqs = await fetchPendingRequests(userProfile.uid, userProfile.email);
    setPendingRequests(reqs);

    const friends = await fetchFriends(userProfile.uid, userProfile.email);
    setFriendsList(friends);
  };

  // Poll for incoming friend requests every 2 seconds
  useEffect(() => {
    loadSocialData();
    const interval = setInterval(() => {
      loadSocialData();
    }, 2000);
    return () => clearInterval(interval);
  }, [userProfile]);

  // Search Users Effect (Only searches when query is provided)
  useEffect(() => {
    const term = searchQuery.trim();
    if (!showSearchModal || !userProfile || !term) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchUsers(term, userProfile.uid, userProfile.email);
      setSearchResults(results);
      setIsSearching(false);
    }, 30);

    return () => clearTimeout(timer);
  }, [searchQuery, showSearchModal, userProfile]);

  const handleSendRequest = async (targetUser) => {
    if (!userProfile) return;
    const targetEmail = (targetUser.email || '').trim().toLowerCase();
    if (targetUser.role === 'admin' || targetEmail === 'admin@stella.com') {
      alert("Friend requests cannot be sent to administrators.");
      return;
    }
    setSentRequestsMap(prev => ({ ...prev, [targetUser.uid]: true }));
    await sendFriendRequest(userProfile, targetUser).catch(err => {
      alert(err.message || "Failed to send request.");
    });
  };

  const handleAcceptRequest = async (req) => {
    await acceptFriendRequest(req.id, req);
    loadSocialData();
  };

  const handleDeclineRequest = async (reqId) => {
    await declineFriendRequest(reqId);
    loadSocialData();
  };

  const handleSelectChallenge = (id) => {
    onSelectChallenge(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleCreateNew = () => {
    onCreateNewClick();
    if (onCloseMobile) onCloseMobile();
  };

  const handleDelete = (e, id, name) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      onDeleteChallenge(id);
    }
  };

  const isQueryAdmin = searchQuery.trim().toLowerCase().includes('admin@stella.com');

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1e1f20] text-gray-200 font-sans border-r border-neutral-800/40 select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-neutral-800/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-100 tracking-tight">
              <span className="font-serif text-lg font-extrabold text-white tracking-wider">Stella</span>
            </h1>
          </div>
        </div>

        {onCloseMobile && (
          <button onClick={onCloseMobile} className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Primary Actions: Admin Panel Button, New Challenge & Search Users */}
      <div className="p-3 space-y-2 border-b border-neutral-800/40">
        {userProfile?.role === 'admin' && (
          <button
            onClick={() => { if (onSelectAdmin) onSelectAdmin(); if (onCloseMobile) onCloseMobile(); }}
            className={`w-full py-2.5 px-4 rounded-full font-medium text-xs transition-all duration-200 flex items-center justify-between border ${
              viewMode === 'admin'
                ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 border-indigo-400'
                : 'bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border-indigo-800/40'
            }`}
          >
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Admin Panel</span>
            </span>
            <span className="bg-indigo-500/20 text-indigo-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-indigo-400/30 font-bold">
              Admin
            </span>
          </button>
        )}

        <button
          onClick={handleCreateNew}
          className={`w-full py-2.5 px-4 rounded-full font-medium text-xs transition-all duration-200 flex items-center gap-2.5 group border border-neutral-700/30 ${
            viewMode === 'create'
              ? 'bg-[#282a2c] text-white ring-1 ring-blue-500/50 shadow-md'
              : 'bg-[#282a2c] hover:bg-[#333537] text-gray-200 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          <span>New challenge</span>
        </button>

        <button
          onClick={() => {
            setSearchQuery('');
            setSearchResults([]);
            setShowSearchModal(true);
          }}
          className="w-full py-2.5 px-4 rounded-full font-medium text-xs bg-[#131314] hover:bg-[#282a2c] text-gray-400 hover:text-gray-200 transition-all flex items-center justify-between border border-neutral-800/60"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <span>Search by Gmail...</span>
          </span>
          <UserPlus className="w-3.5 h-3.5 text-blue-400" />
        </button>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
        {/* Pending Requests Notifications */}
        {pendingRequests.length > 0 && (
          <div className="space-y-1 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-2xl">
            <div className="px-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3 h-3 text-blue-400" />
              <span>Friend Requests ({pendingRequests.length})</span>
            </div>
            {pendingRequests.map(req => (
              <div key={req.id} className="bg-[#131314] p-2 rounded-xl flex items-center justify-between gap-2 border border-neutral-800">
                <span className="text-xs text-gray-200 truncate">{req.senderDisplayName || req.senderUsername}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAcceptRequest(req)}
                    className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full"
                    title="Accept Request"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(req.id)}
                    className="p-1 bg-[#282a2c] hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-full"
                    title="Decline"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* My Challenges Section */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 tracking-wider">
            My Challenges ({challenges.length})
          </div>

          {challenges.length > 0 ? (
            challenges.map((challenge) => {
              const isActive = challenge.id === activeChallengeId && viewMode === 'calendar' && !activeFriendUser;
              const summary = getChallengeSummary(challenge);

              return (
                <div
                  key={challenge.id}
                  onClick={() => handleSelectChallenge(challenge.id)}
                  className={`group relative w-full text-left px-3 py-2.5 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 ${
                    isActive
                      ? 'bg-[#282a2c] text-white font-medium shadow-sm ring-1 ring-neutral-700/60'
                      : 'text-gray-300 hover:bg-[#282a2c]/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Calendar className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate font-medium">{challenge.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {summary.completedTopics}/{summary.totalTopics} tasks ({summary.completionRate}%)
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, challenge.id, challenge.name)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-400 hover:bg-neutral-800 rounded-full transition-all"
                    title="Delete Challenge"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 px-4 text-gray-500 space-y-1">
              <p className="text-xs">No challenges created</p>
            </div>
          )}
        </div>
      </div>

      {/* Gemini-Inspired Bottom User Profile Section */}
      {userProfile && (
        <div className="p-3 border-t border-neutral-800/40 bg-[#1e1f20]">
          <div 
            onClick={() => setShowProfileModal(true)}
            className="bg-[#131314] hover:bg-[#282a2c] p-2.5 rounded-full border border-neutral-800/60 transition-all flex items-center justify-between group cursor-pointer"
            title="Open Gemini Profile Menu"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <img
                src={userProfile.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile.username}`}
                alt={userProfile.displayName}
                className="w-8 h-8 rounded-full bg-[#282a2c] p-0.5 border border-neutral-700/40 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-100 truncate leading-tight flex items-center gap-1">
                  <span>{userProfile.displayName || userProfile.email}</span>
                  {userProfile.role === 'admin' && (
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono font-bold">Admin</span>
                  )}
                </p>
                <p className="text-[10px] text-gray-400 truncate leading-tight font-medium">
                  {userProfile.email}
                </p>
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); logout(); }}
              className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-[#1e1f20] rounded-full transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Gemini Floating Profile Modal */}
      {showProfileModal && (
        <ProfileModal 
          onClose={() => setShowProfileModal(false)} 
          onSelectFriend={onSelectFriend}
          activeFriendUser={activeFriendUser}
        />
      )}

      {/* User Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#1e1f20] border border-neutral-800/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-400" />
                <span>Search Users on Stella</span>
              </h3>
              <button onClick={() => setShowSearchModal(false)} className="p-1 text-gray-400 hover:text-white rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Type Gmail address or Name to search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#131314] border border-neutral-800 rounded-full px-4 py-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
              {isSearching && (
                <div className="absolute right-3.5 top-3 text-[10px] text-blue-400 font-mono animate-pulse">
                  Searching...
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pt-2 custom-scrollbar">
              {isSearching ? (
                <p className="text-xs text-gray-400 text-center py-4">Searching database...</p>
              ) : searchResults.length > 0 ? (
                searchResults.map(u => {
                  const relStatus = getRelationshipStatus(userProfile.uid, userProfile.email, u.uid, u.email);
                  const isSentLocally = sentRequestsMap[u.uid];
                  const isPending = relStatus === 'pending' || isSentLocally;
                  const isAccepted = relStatus === 'accepted';

                  return (
                    <div key={u.uid} className="bg-[#131314] p-3 rounded-2xl border border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                          alt={u.displayName || u.email}
                          className="w-7 h-7 rounded-full bg-[#282a2c]"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-200 truncate">{u.displayName || u.email}</p>
                          <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>

                      {isAccepted ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Following</span>
                        </span>
                      ) : isPending ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>Request Sent</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(u)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </button>
                      )}
                    </div>
                  );
                })
              ) : searchQuery.trim() ? (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-gray-400">No registered user found matching "{searchQuery}"</p>
                  {searchQuery.includes('@') && !isQueryAdmin && (
                    <button
                      type="button"
                      onClick={() => handleSendRequest({ email: searchQuery.trim().toLowerCase(), displayName: searchQuery.trim().toLowerCase() })}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5 active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow {searchQuery.trim().toLowerCase()}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 space-y-1">
                  <Search className="w-5 h-5 text-gray-600 mx-auto opacity-40" />
                  <p className="text-xs">Type a Gmail address or Name above to search for users.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className="hidden md:block w-64 lg:w-72 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile}></div>
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
