import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const SESSION_PROFILE_KEY = 'stella_active_user_session_v1';
const LOCAL_REGISTRY_KEY = 'stella_registered_users_registry_v1';

export function getLocalUserRegistry() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_REGISTRY_KEY) || '[]');
  } catch {
    return [];
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
    setUserProfile(prev => prev ? { ...prev, avatarUrl: newUrl } : null);
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

  // Sign up with Gmail/Email, Password, and Full Name
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

    // Check local registry
    const localExisting = findLocalUserSync(cleanEmail);
    if (localExisting) {
      const err = new Error('ALREADY_REGISTERED');
      err.code = 'ALREADY_REGISTERED';
      throw err;
    }

    // Check cloud Firestore
    const cloudExisting = await findRegisteredUserFirestoreOnly(cleanEmail);
    if (cloudExisting) {
      saveUserToRegistry(cloudExisting);
      const err = new Error('ALREADY_REGISTERED');
      err.code = 'ALREADY_REGISTERED';
      throw err;
    }

    let firebaseUid = null;
    let firebaseUserObj = null;

    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      firebaseUid = res.user.uid;
      firebaseUserObj = res.user;
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        const alreadyErr = new Error('ALREADY_REGISTERED');
        alreadyErr.code = 'ALREADY_REGISTERED';
        throw alreadyErr;
      } else if (err.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.');
      }
      console.warn("Firebase Auth sign up note:", err);
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

    // Save profile to Firestore under both doc IDs so cloud lookups succeed from any browser
    try {
      await setDoc(doc(db, 'users', userId), profile).catch(() => {});
      if (firebaseUid && userId !== makeUserId(cleanEmail)) {
        await setDoc(doc(db, 'users', makeUserId(cleanEmail)), profile).catch(() => {});
      }
    } catch (err) {
      console.warn("Firestore registration note:", err);
    }

    saveUserToRegistry(profile);

    if (autoSignIn) {
      setCurrentUser(firebaseUserObj || profile);
      setUserProfile(profile);
    } else {
      // Sign out from Firebase Auth so auth state listener doesn't auto-login
      try {
        await signOut(auth);
      } catch {}
    }

    return profile;
  };

  // Sign in (Strictly enforces prior user registration & matching credentials)
  const signIn = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      throw new Error('Please enter both Gmail / Email address and password.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Please enter a valid Gmail / Email address format.');
    }

    // Step 1: Check local registry (0ms)
    const localUser = findLocalUserSync(cleanEmail);

    if (localUser) {
      if (localUser.password && localUser.password !== password) {
        const wrongErr = new Error('Incorrect password. Gmail and password must match. Access denied.');
        wrongErr.code = 'WRONG_PASSWORD';
        throw wrongErr;
      }

      setCurrentUser(localUser);
      setUserProfile(localUser);

      // Async cloud sync
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

    // Step 2: Query Firestore & Firebase Auth concurrently for cloud registration status
    const [authResult, firestoreUser] = await Promise.all([
      signInWithEmailAndPassword(auth, cleanEmail, password)
        .then(res => ({ user: res.user, error: null }))
        .catch(err => ({ user: null, error: err })),
      findRegisteredUserFirestoreOnly(cleanEmail)
    ]);

    const firebaseUser = authResult.user;
    const authError = authResult.error;

    // Strict registration determination:
    // A user is registered ONLY if found in Firestore DB, Firebase Auth succeeds, or wrong password code returned
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
      // User is NOT registered anywhere! Force redirect to registration!
      const notRegErr = new Error('USER_NOT_REGISTERED');
      notRegErr.code = 'USER_NOT_REGISTERED';
      throw notRegErr;
    }

    // Registered user entered wrong password in Firebase Auth
    if (authError && (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential')) {
      if (firestoreUser && firestoreUser.password === password) {
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
        createdAt: new Date().toISOString()
      };

      setCurrentUser(firebaseUser);
      setUserProfile(cloudProfile);
      saveUserToRegistry(cloudProfile);
      return cloudProfile;
    }

    if (firestoreUser) {
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
            createdAt: new Date().toISOString()
          };
        }
        if (profile) {
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
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
