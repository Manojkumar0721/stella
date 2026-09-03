import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const SESSION_PROFILE_KEY = 'stella_active_user_session_v1';
const LOCAL_REGISTRY_KEY = 'stella_registered_users_registry_v1';

export const DEFAULT_ADMIN = {
  uid: 'usr_admin_stella',
  email: 'admin@stella.com',
  username: 'admin',
  displayName: 'System Administrator',
  password: 'admin123',
  role: 'admin',
  isRestricted: false,
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
  createdAt: '2026-01-01T00:00:00.000Z'
};

export function getLocalUserRegistry() {
  try {
    const raw = localStorage.getItem(LOCAL_REGISTRY_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
    
    // Remove duplicate/legacy admin accounts (e.g. admin@gmail.com)
    list = list.filter(u => u && u.email?.toLowerCase() !== 'admin@gmail.com');

    // Deduplicate by clean email address
    const map = new Map();
    list.forEach(u => {
      if (u && u.email) {
        const clean = u.email.trim().toLowerCase();
        if (!map.has(clean) || u.role === 'admin') {
          map.set(clean, u);
        }
      }
    });
    list = Array.from(map.values());

    // Ensure single default admin account exists
    const adminIdx = list.findIndex(u => u && u.email?.toLowerCase() === DEFAULT_ADMIN.email);
    if (adminIdx >= 0) {
      list[adminIdx] = { ...list[adminIdx], ...DEFAULT_ADMIN };
    } else {
      list.unshift(DEFAULT_ADMIN);
    }

    localStorage.setItem(LOCAL_REGISTRY_KEY, JSON.stringify(list));
    return list;
  } catch {
    return [DEFAULT_ADMIN];
  }
}

export function saveUserToRegistry(profile) {
  if (!profile || !profile.email) return;
  try {
    const saved = getLocalUserRegistry();
    const cleanEmail = profile.email.trim().toLowerCase();
    const existingIndex = saved.findIndex(u => u && (u.email?.toLowerCase() === cleanEmail || u.uid === profile.uid));

    let updatedProfile = { ...profile };
    if (existingIndex >= 0) {
      const existing = saved[existingIndex];
      const defaultName = cleanEmail.split('@')[0];
      const hasBetterExistingName = existing.displayName && existing.displayName !== defaultName && existing.displayName !== cleanEmail;
      const newIsDefaultName = !profile.displayName || profile.displayName === defaultName || profile.displayName === cleanEmail;

      if (hasBetterExistingName && newIsDefaultName) {
        updatedProfile.displayName = existing.displayName;
      }
      // Preserve role & restriction status if set
      if (existing.role) updatedProfile.role = existing.role;
      if (typeof existing.isRestricted === 'boolean') updatedProfile.isRestricted = existing.isRestricted;

      saved[existingIndex] = { ...existing, ...updatedProfile };
    } else {
      saved.push(updatedProfile);
    }
    localStorage.setItem(LOCAL_REGISTRY_KEY, JSON.stringify(saved));
  } catch {
    // ignore
  }
}

export function isEmailRegisteredLocally(email) {
  if (!email) return false;
  try {
    const cleanEmail = email.trim().toLowerCase();
    const saved = getLocalUserRegistry();
    return saved.some(u => u && u.email?.toLowerCase() === cleanEmail);
  } catch {
    return false;
  }
}

export function findLocalUserSync(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const saved = getLocalUserRegistry();
  return saved.find(u => u && u.email && u.email.trim().toLowerCase() === cleanEmail) || null;
}

export function makeUserId(email) {
  return `usr_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
}

export async function findRegisteredUserFirestoreOnly(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const customId = makeUserId(cleanEmail);

  // 1. Firestore check by custom doc id (makeUserId)
  try {
    const docSnap = await getDoc(doc(db, 'users', customId));
    if (docSnap.exists()) return docSnap.data();
  } catch (err) {
    console.warn("Firestore doc check note:", err);
  }

  // 2. Firestore check by email query
  try {
    const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data();
    }
  } catch (err) {
    console.warn("Firestore query check note:", err);
  }

  return null;
}

export async function findRegisteredUser(email) {
  if (!email) return null;
  const local = findLocalUserSync(email);
  if (local) return local;
  return await findRegisteredUserFirestoreOnly(email);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_PROFILE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_PROFILE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed) saveUserToRegistry(parsed);
      return parsed;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Seed default admin account in registry on mount
  useEffect(() => {
    getLocalUserRegistry();
  }, []);

  // Save session profile locally for instant re-loads & update local search registry
  useEffect(() => {
    try {
      if (userProfile) {
        localStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(userProfile));
        saveUserToRegistry(userProfile);
      } else {
        localStorage.removeItem(SESSION_PROFILE_KEY);
      }
    } catch {
      // ignore
    }
  }, [userProfile]);

  const updateProfileAvatar = (newUrl) => {
    setUserProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, avatarUrl: newUrl };
      saveUserToRegistry(updated);
      return updated;
    });
    setCurrentUser(prev => {
      if (!prev) return null;
      return { ...prev, avatarUrl: newUrl };
    });
  };

  const fetchUserProfileQuick = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data();
      return null;
    } catch {
      return null;
    }
  };

  // Instant 0ms Registration (Synchronous local registry write + background cloud sync)
  const signUp = async (email, password, displayName, autoSignIn = false) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanUsername = cleanEmail.split('@')[0].toLowerCase();
    const cleanDisplay = displayName ? displayName.trim() : cleanUsername;

    if (!cleanEmail) {
      throw new Error('Please enter a valid Gmail / Email address.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Please enter a valid Gmail / Email address format.');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    if (!cleanDisplay) {
      throw new Error('Full Name is required for registration.');
    }

    // Synchronous (0ms) local registry check
    const localExisting = findLocalUserSync(cleanEmail);
    if (localExisting) {
      const err = new Error('ALREADY_REGISTERED');
      err.code = 'ALREADY_REGISTERED';
      throw err;
    }

    const userId = makeUserId(cleanEmail);

    const profile = {
      uid: userId,
      email: cleanEmail,
      username: cleanUsername,
      displayName: cleanDisplay,
      password: password,
      role: cleanEmail === DEFAULT_ADMIN.email ? 'admin' : 'user',
      isRestricted: false,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
      createdAt: new Date().toISOString()
    };

    // Save profile to local storage synchronously (0ms latency!)
    saveUserToRegistry(profile);

    if (autoSignIn) {
      setCurrentUser(profile);
      setUserProfile(profile);
    }

    // Non-blocking async background cloud sync
    (async () => {
      try {
        const res = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const firebaseUid = res.user?.uid;
        if (firebaseUid) {
          profile.uid = firebaseUid;
          await setDoc(doc(db, 'users', firebaseUid), profile).catch(() => {});
        }
        await setDoc(doc(db, 'users', userId), profile).catch(() => {});
        if (!autoSignIn) {
          await signOut(auth).catch(() => {});
        }
      } catch (err) {
        console.warn("Background Firebase registration sync note:", err);
      }
    })();

    return profile;
  };

  // Instant 0ms Sign In
  const signIn = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      throw new Error('Please enter both Gmail / Email address and password.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Please enter a valid Gmail / Email address format.');
    }

    // Direct Admin Credentials Shortcut (0ms)
    if (cleanEmail === DEFAULT_ADMIN.email && password === 'admin123') {
      saveUserToRegistry(DEFAULT_ADMIN);
      setCurrentUser(DEFAULT_ADMIN);
      setUserProfile(DEFAULT_ADMIN);
      return DEFAULT_ADMIN;
    }

    // Step 1: Check local registry (0ms synchronous lookup)
    const localUser = findLocalUserSync(cleanEmail);

    if (localUser) {
      if (localUser.isRestricted) {
        const restrErr = new Error('Your account has been restricted by an administrator. Access denied.');
        restrErr.code = 'USER_RESTRICTED';
        throw restrErr;
      }

      if (localUser.password && localUser.password !== password) {
        const wrongErr = new Error('Incorrect password. Gmail and password must match. Access denied.');
        wrongErr.code = 'WRONG_PASSWORD';
        throw wrongErr;
      }

      setCurrentUser(localUser);
      setUserProfile(localUser);

      // Non-blocking async background cloud sync
      (async () => {
        try {
          const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
          if (res?.user) {
            let cloudProfile = await fetchUserProfileQuick(res.user.uid);
            if (!cloudProfile) cloudProfile = localUser;
            saveUserToRegistry(cloudProfile);
          }
        } catch {}
      })();

      return localUser;
    }

    // Step 2: Query Firestore & Firebase Auth concurrently ONLY if user is not in local registry
    const [authResult, firestoreUser] = await Promise.all([
      signInWithEmailAndPassword(auth, cleanEmail, password)
        .then(res => ({ user: res.user, error: null }))
        .catch(err => ({ user: null, error: err })),
      findRegisteredUserFirestoreOnly(cleanEmail)
    ]);

    const firebaseUser = authResult.user;
    const authError = authResult.error;

    // Strict registration determination:
    const isRegistered = !!(
      firestoreUser || 
      firebaseUser || 
      (authError && (
        authError.code === 'auth/wrong-password' || 
        authError.code === 'auth/invalid-credential' ||
        authError.code === 'auth/invalid-password'
      ))
    );

    if (!isRegistered) {
      const notRegErr = new Error('USER_NOT_REGISTERED');
      notRegErr.code = 'USER_NOT_REGISTERED';
      throw notRegErr;
    }

    if (firestoreUser?.isRestricted) {
      const restrErr = new Error('Your account has been restricted by an administrator. Access denied.');
      restrErr.code = 'USER_RESTRICTED';
      throw restrErr;
    }

    if (authError && (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential')) {
      if (firestoreUser && firestoreUser.password === password) {
        if (firestoreUser.isRestricted) {
          const restrErr = new Error('Your account has been restricted by an administrator. Access denied.');
          restrErr.code = 'USER_RESTRICTED';
          throw restrErr;
        }
        setCurrentUser(firestoreUser);
        setUserProfile(firestoreUser);
        saveUserToRegistry(firestoreUser);
        return firestoreUser;
      }
      const wrongErr = new Error('Incorrect password. Gmail and password must match. Access denied.');
      wrongErr.code = 'WRONG_PASSWORD';
      throw wrongErr;
    }

    if (firebaseUser) {
      let cloudProfile = firestoreUser || {
        uid: firebaseUser.uid,
        email: cleanEmail,
        username: cleanEmail.split('@')[0],
        displayName: firebaseUser.displayName || cleanEmail.split('@')[0],
        avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail.split('@')[0]}`,
        role: cleanEmail === DEFAULT_ADMIN.email ? 'admin' : 'user',
        isRestricted: false,
        createdAt: new Date().toISOString()
      };

      if (cloudProfile.isRestricted) {
        const restrErr = new Error('Your account has been restricted by an administrator. Access denied.');
        restrErr.code = 'USER_RESTRICTED';
        throw restrErr;
      }

      setCurrentUser(firebaseUser);
      setUserProfile(cloudProfile);
      saveUserToRegistry(cloudProfile);
      return cloudProfile;
    }

    if (firestoreUser) {
      if (firestoreUser.isRestricted) {
        const restrErr = new Error('Your account has been restricted by an administrator. Access denied.');
        restrErr.code = 'USER_RESTRICTED';
        throw restrErr;
      }

      if (firestoreUser.password && firestoreUser.password !== password) {
        const wrongErr = new Error('Incorrect password. Gmail and password must match. Access denied.');
        wrongErr.code = 'WRONG_PASSWORD';
        throw wrongErr;
      }
      setCurrentUser(firestoreUser);
      setUserProfile(firestoreUser);
      saveUserToRegistry(firestoreUser);
      return firestoreUser;
    }

    const wrongErr = new Error('Incorrect password. Gmail and password must match. Access denied.');
    wrongErr.code = 'WRONG_PASSWORD';
    throw wrongErr;
  };

  // Admin Actions
  const getAllUsers = () => {
    return getLocalUserRegistry();
  };

  // Instant 0ms Local Update + Async Cloud Sync
  const toggleRestrictUser = async (targetUid) => {
    const registry = getLocalUserRegistry();
    const index = registry.findIndex(u => u && u.uid === targetUid);
    if (index >= 0) {
      const newStatus = !registry[index].isRestricted;
      registry[index].isRestricted = newStatus;
      localStorage.setItem(LOCAL_REGISTRY_KEY, JSON.stringify(registry));
      try {
        await setDoc(doc(db, 'users', targetUid), { isRestricted: newStatus }, { merge: true }).catch(() => {});
      } catch (err) {
        console.warn("Firestore restrict sync note:", err);
      }
    }
  };

  // Instant 0ms Local Update + Async Cloud Sync
  const deleteUserByAdmin = async (targetUid) => {
    let registry = getLocalUserRegistry();
    const targetUser = registry.find(u => u && u.uid === targetUid);
    const targetEmail = targetUser?.email ? targetUser.email.trim().toLowerCase() : '';
    registry = registry.filter(u => u && u.uid !== targetUid && (targetEmail ? u.email?.trim().toLowerCase() !== targetEmail : true));
    localStorage.setItem(LOCAL_REGISTRY_KEY, JSON.stringify(registry));
    
    // Purge all friendships / connections involving deleted user locally
    try {
      const friendshipsRaw = localStorage.getItem('stella_local_friendships_v1');
      const friendships = friendshipsRaw ? JSON.parse(friendshipsRaw) : [];
      const remainingFriendships = [];
      const removedFriendshipIds = [];

      for (const r of friendships) {
        if (!r) continue;
        const sEmail = (r.senderEmail || '').trim().toLowerCase();
        const sUid = (r.senderUid || '').trim().toLowerCase();
        const rEmail = (r.receiverEmail || '').trim().toLowerCase();
        const rUid = (r.receiverUid || '').trim().toLowerCase();

        const matchesTarget = (targetUid && (sUid === targetUid || rUid === targetUid)) ||
                              (targetEmail && (sEmail === targetEmail || rEmail === targetEmail));

        if (matchesTarget) {
          if (r.id) removedFriendshipIds.push(r.id);
        } else {
          remainingFriendships.push(r);
        }
      }

      localStorage.setItem('stella_local_friendships_v1', JSON.stringify(remainingFriendships));

      // Async Firestore deletion for user docs & friendship docs
      (async () => {
        try {
          await deleteDoc(doc(db, 'users', targetUid)).catch(() => {});
          if (targetEmail) {
            const customId = makeUserId(targetEmail);
            await deleteDoc(doc(db, 'users', customId)).catch(() => {});
          }
          for (const fId of removedFriendshipIds) {
            if (fId) await deleteDoc(doc(db, 'friendships', fId)).catch(() => {});
          }
        } catch (err) {
          console.warn("Firestore delete sync note:", err);
        }
      })();
    } catch (e) {
      console.warn("Local friendship purge note:", e);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem(SESSION_PROFILE_KEY);
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !userProfile) {
        let profile = await fetchUserProfileQuick(user.uid);
        if (!profile && user.email) {
          profile = findLocalUserSync(user.email);
        }
        if (!profile && user.email) {
          profile = await findRegisteredUserFirestoreOnly(user.email);
        }
        if (!profile && user.email) {
          const usernameFromEmail = user.email.split('@')[0];
          profile = {
            uid: user.uid,
            email: user.email.trim().toLowerCase(),
            username: usernameFromEmail,
            displayName: user.displayName || usernameFromEmail,
            avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${usernameFromEmail}`,
            role: user.email.trim().toLowerCase() === DEFAULT_ADMIN.email ? 'admin' : 'user',
            isRestricted: false,
            createdAt: new Date().toISOString()
          };
        }
        if (profile) {
          if (profile.isRestricted) {
            await signOut(auth);
            return;
          }
          setCurrentUser(user);
          setUserProfile(profile);
          saveUserToRegistry(profile);
        }
      }
    });

    return unsubscribe;
  }, [userProfile]);

  const value = {
    currentUser,
    userProfile,
    signUp,
    signIn,
    updateProfileAvatar,
    logout,
    loading,
    getAllUsers,
    toggleRestrictUser,
    deleteUserByAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
