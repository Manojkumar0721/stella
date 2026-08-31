import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const SESSION_PROFILE_KEY = 'stella_active_user_session_v1';
const LOCAL_REGISTRY_KEY = 'stella_registered_users_registry_v1';

export function saveUserToRegistry(profile) {
  if (!profile || !profile.email) return;
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_REGISTRY_KEY) || '[]');
    const cleanEmail = profile.email.trim().toLowerCase();
    const existingIndex = saved.findIndex(u => u.email?.toLowerCase() === cleanEmail || u.uid === profile.uid);

    let updatedProfile = { ...profile };
    if (existingIndex >= 0) {
      const existing = saved[existingIndex];
      const defaultName = cleanEmail.split('@')[0];
      const hasBetterExistingName = existing.displayName && existing.displayName !== defaultName && existing.displayName !== cleanEmail;
      const newIsDefaultName = !profile.displayName || profile.displayName === defaultName || profile.displayName === cleanEmail;

      if (hasBetterExistingName && newIsDefaultName) {
        updatedProfile.displayName = existing.displayName;
      }
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
    const saved = JSON.parse(localStorage.getItem(LOCAL_REGISTRY_KEY) || '[]');
    return saved.some(u => u.email?.toLowerCase() === cleanEmail);
  } catch {
    return false;
  }
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

  // Update profile avatar helper
  const updateProfileAvatar = (newUrl) => {
    setUserProfile(prev => prev ? { ...prev, avatarUrl: newUrl } : null);
  };

  // Fast 150ms Firestore query wrapper
  const fetchUserProfileQuick = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 150));
      const queryPromise = getDoc(docRef).then(snap => snap.exists() ? snap.data() : null);
      return await Promise.race([queryPromise, timeout]);
    } catch {
      return null;
    }
  };

  const makeUserId = (email) => `usr_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  // Sign up with Gmail/Email, Password, and Full Name
  const signUp = async (email, password, displayName) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = cleanEmail.split('@')[0].toLowerCase();
    const cleanDisplay = displayName.trim() || cleanUsername;

    // Check if already registered locally
    if (isEmailRegisteredLocally(cleanEmail)) {
      const err = new Error('ALREADY_REGISTERED');
      err.code = 'ALREADY_REGISTERED';
      throw err;
    }

    let firebaseUid = null;
    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      firebaseUid = res.user.uid;
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        const alreadyErr = new Error('ALREADY_REGISTERED');
        alreadyErr.code = 'ALREADY_REGISTERED';
        throw alreadyErr;
      }
    }

    const userId = firebaseUid || makeUserId(cleanEmail);

    const profile = {
      uid: userId,
      email: cleanEmail,
      username: cleanUsername,
      displayName: cleanDisplay,
      password: password,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
      createdAt: new Date().toISOString()
    };

    // Save profile to Firestore
    try {
      await setDoc(doc(db, 'users', userId), profile).catch(() => {});
    } catch (err) {
      console.warn("Firestore registration note:", err);
    }

    setCurrentUser(profile);
    setUserProfile(profile);
    saveUserToRegistry(profile);

    return profile;
  };

  // Sign in (Strictly enforces prior user registration)
  const signIn = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const userId = makeUserId(cleanEmail);

    if (!cleanEmail || !password) {
      throw new Error('Please enter both email and password.');
    }

    // Step 1: Check if user exists in local registry
    const savedRegistry = (() => {
      try {
        return JSON.parse(localStorage.getItem(LOCAL_REGISTRY_KEY) || '[]');
      } catch {
        return [];
      }
    })();

    const localUser = savedRegistry.find(u => u && u.email && u.email.trim().toLowerCase() === cleanEmail);

    // Step 2: Check Firestore if not found in local registry
    let firestoreUser = null;
    if (!localUser) {
      try {
        const docSnap = await getDoc(doc(db, 'users', userId));
        if (docSnap.exists()) {
          firestoreUser = docSnap.data();
        }
      } catch (err) {
        console.warn("Firestore query note:", err);
      }
    }

    // Step 3: Try Firebase Auth sign in
    let firebaseUser = null;
    let authError = null;
    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
      firebaseUser = res.user;
    } catch (err) {
      authError = err;
    }

    // Step 4: Determine registration status
    const isRegistered = !!(localUser || firestoreUser || firebaseUser);

    if (!isRegistered) {
      // User is NOT registered anywhere! Force redirect to registration page!
      const notRegErr = new Error('USER_NOT_REGISTERED');
      notRegErr.code = 'USER_NOT_REGISTERED';
      throw notRegErr;
    }

    // Step 5: User IS registered. Now verify password!
    if (firebaseUser) {
      let cloudProfile = await fetchUserProfileQuick(firebaseUser.uid);
      if (!cloudProfile) {
        const usernameFromEmail = cleanEmail.split('@')[0];
        cloudProfile = {
          uid: firebaseUser.uid,
          email: cleanEmail,
          username: usernameFromEmail,
          displayName: firebaseUser.displayName || (localUser ? localUser.displayName : usernameFromEmail),
          avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${usernameFromEmail}`,
          createdAt: new Date().toISOString()
        };
      }
      setCurrentUser(firebaseUser);
      setUserProfile(cloudProfile);
      saveUserToRegistry(cloudProfile);
      return cloudProfile;
    }

    // Check local registry user password
    if (localUser) {
      if (localUser.password && localUser.password !== password) {
        const wrongErr = new Error('Incorrect password. Please try again.');
        wrongErr.code = 'WRONG_PASSWORD';
        throw wrongErr;
      }

      setCurrentUser(localUser);
      setUserProfile(localUser);
      return localUser;
    }

    // Check firestore user
    if (firestoreUser) {
      if (firestoreUser.password && firestoreUser.password !== password) {
        const wrongErr = new Error('Incorrect password. Please try again.');
        wrongErr.code = 'WRONG_PASSWORD';
        throw wrongErr;
      }

      setCurrentUser(firestoreUser);
      setUserProfile(firestoreUser);
      saveUserToRegistry(firestoreUser);
      return firestoreUser;
    }

    // Password incorrect for registered user
    const wrongErr = new Error('Incorrect password. Please try again.');
    wrongErr.code = 'WRONG_PASSWORD';
    throw wrongErr;
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem(SESSION_PROFILE_KEY);
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !userProfile) {
        setCurrentUser(user);
        const profile = await fetchUserProfileQuick(user.uid);
        if (profile) {
          if (user.photoURL) profile.avatarUrl = user.photoURL;
          setUserProfile(profile);
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
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
