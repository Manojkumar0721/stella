import React, { useState, useEffect } from 'react';
import { useAuth, DEFAULT_ADMIN, DEFAULT_ADMIN_ALT } from '../context/AuthContext';
import { 
  Shield, Trash2, Search, Users, UserX, UserCheck, Lock, Unlock, AlertTriangle, CheckCircle2, ArrowLeft, RefreshCw 
} from 'lucide-react';

export default function AdminDashboard({ onBackToDashboard }) {
  const { userProfile, getAllUsers, toggleRestrictUser, deleteUserByAdmin } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'restricted'
  const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  const loadUsers = () => {
    const list = getAllUsers();
    setUsersList(list);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const isSystemAdmin = (user) => {
    if (!user) return false;
    return (
      user.role === 'admin' || 
      user.email === DEFAULT_ADMIN.email || 
      user.email === DEFAULT_ADMIN_ALT.email
    );
  };

  // Instant 0ms Optimistic Restrict Toggle
  const handleToggleRestrict = (user) => {
    if (!user) return;
    if (isSystemAdmin(user) || user.uid === userProfile?.uid) {
      alert("System administrator accounts cannot be restricted.");
      return;
    }
    const isNowRestricted = !user.isRestricted;
    const targetUid = user.uid;
    const targetName = user.displayName || user.email;

    // 1. Instant local component state update (0ms UI latency!)
    setUsersList(prev => prev.map(u => {
      if (u && (u.uid === targetUid || u.email === user.email)) {
        return { ...u, isRestricted: isNowRestricted };
      }
      return u;
    }));
    setActionSuccess(`User "${targetName}" has been ${isNowRestricted ? 'restricted' : 'unrestricted'} successfully.`);

    // 2. Background async persistence
    toggleRestrictUser(targetUid).catch(err => console.warn(err));

    setTimeout(() => setActionSuccess(''), 3000);
  };

  // Instant 0ms Optimistic Permanent Delete
  const handleDeleteConfirm = () => {
    if (!selectedUserForDelete) return;
    if (isSystemAdmin(selectedUserForDelete) || selectedUserForDelete.uid === userProfile?.uid) {
      alert("System administrator accounts cannot be deleted.");
      setSelectedUserForDelete(null);
      return;
    }

    const targetUid = selectedUserForDelete.uid;
    const targetEmail = selectedUserForDelete.email;
    const targetName = selectedUserForDelete.displayName || selectedUserForDelete.email;

    // 1. Instant local UI update & modal close (0ms UI latency!)
    setUsersList(prev => prev.filter(u => u && u.uid !== targetUid && u.email !== targetEmail));
    setSelectedUserForDelete(null);
    setActionSuccess(`User "${targetName}" was permanently deleted.`);

    // 2. Background async storage & cloud deletion
    deleteUserByAdmin(targetUid).catch(err => console.warn(err));

    setTimeout(() => setActionSuccess(''), 3000);
  };

  // Filtered user list
  const filteredUsers = usersList.filter(u => {
    if (!u) return false;
    const matchesSearch = 
      (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()));

    if (statusFilter === 'active') return matchesSearch && !u.isRestricted;
    if (statusFilter === 'restricted') return matchesSearch && u.isRestricted;
    return matchesSearch;
  });

  const totalUsers = usersList.length;
  const activeCount = usersList.filter(u => u && !u.isRestricted).length;
  const restrictedCount = usersList.filter(u => u && u.isRestricted).length;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top Banner & Header */}
      <div className="bg-[#1e1f20] border border-neutral-800/80 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Admin Control Panel</h1>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase">
                  User Management
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Restrict access or permanently delete user accounts from the application.
              </p>
            </div>
          </div>

          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="bg-[#282a2c] hover:bg-[#333537] text-gray-200 hover:text-white px-4 py-2 rounded-full text-xs font-semibold border border-neutral-700/50 transition-all flex items-center gap-2 shadow-sm self-start sm:self-center"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to App</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 shadow-md animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* User Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#1e1f20] border border-neutral-800/80 p-4 rounded-2xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Total Registered Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{totalUsers}</p>
        </div>

        <div className="bg-[#1e1f20] border border-neutral-800/80 p-4 rounded-2xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Active Accounts</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">{activeCount}</p>
        </div>

        <div className="bg-[#1e1f20] border border-neutral-800/80 p-4 rounded-2xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Restricted Accounts</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-rose-400">{restrictedCount}</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#1e1f20] border border-neutral-800/80 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#131314] border border-neutral-800 rounded-full pl-10 pr-4 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#131314] p-1 rounded-full border border-neutral-800 text-xs w-full md:w-auto justify-center">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
              statusFilter === 'all' ? 'bg-[#282a2c] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            All ({usersList.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
              statusFilter === 'active' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('restricted')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
              statusFilter === 'restricted' ? 'bg-rose-600/30 text-rose-300 border border-rose-500/30 shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Restricted ({restrictedCount})
          </button>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-[#1e1f20] border border-neutral-800/80 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
            Registered Users ({filteredUsers.length})
          </h2>
          <button 
            onClick={loadUsers} 
            className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-[#282a2c] transition-colors"
            title="Refresh user list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#131314] text-gray-400 border-b border-neutral-800 font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredUsers.map((user) => {
                  const isAdmin = isSystemAdmin(user);
                  const isRestricted = !!user.isRestricted;
                  const isSelf = user.uid === userProfile?.uid;

                  return (
                    <tr key={user.uid} className="hover:bg-[#242527] transition-colors group">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                            alt={user.displayName}
                            className="w-9 h-9 rounded-full bg-[#131314] border border-neutral-700/60 p-0.5 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-100 flex items-center gap-1.5">
                              <span>{user.displayName || user.username || user.email}</span>
                              {isSelf && (
                                <span className="bg-blue-500/20 text-blue-300 text-[9px] px-1.5 py-0.5 rounded font-mono">You</span>
                              )}
                              {isAdmin && (
                                <span className="bg-indigo-500/20 text-indigo-300 text-[9px] px-1.5 py-0.5 rounded font-mono">Admin</span>
                              )}
                            </p>
                            <p className="text-[11px] text-gray-400 font-mono truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isRestricted ? (
                          <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                            <Lock className="w-3 h-3" />
                            <span>Restricted</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Restrict / Unrestrict Toggle Button */}
                          <button
                            type="button"
                            disabled={isAdmin}
                            onClick={() => handleToggleRestrict(user)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                              isRestricted
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                            title={isAdmin ? "System administrator accounts cannot be restricted" : isRestricted ? "Unrestrict user access" : "Restrict user access"}
                          >
                            {isRestricted ? (
                              <>
                                <Unlock className="w-3.5 h-3.5 text-emerald-300" />
                                <span>Unrestrict</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Restrict</span>
                              </>
                            )}
                          </button>

                          {/* Permanent Delete Button */}
                          <button
                            type="button"
                            disabled={isAdmin}
                            onClick={() => setSelectedUserForDelete(user)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                            title={isAdmin ? "System administrator accounts cannot be deleted" : "Delete user permanently"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 space-y-2">
            <Users className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-xs">No users found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Delete User Confirmation Modal */}
      {selectedUserForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-hidden">
          <div className="w-full max-w-sm bg-[#1e1f20] border border-neutral-800/80 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Delete User Account?</h3>
              <p className="text-xs text-gray-400">
                Are you sure you want to permanently delete <strong className="text-gray-200">{selectedUserForDelete.displayName || selectedUserForDelete.email}</strong> (<span className="font-mono text-gray-300">{selectedUserForDelete.email}</span>)?
              </p>
              <p className="text-[11px] text-rose-400 font-medium pt-1">This user will be permanently removed from the system.</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForDelete(null)}
                className="flex-1 py-2.5 rounded-full text-xs font-medium bg-[#131314] hover:bg-[#282a2c] text-gray-300 border border-neutral-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all active:scale-95"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
