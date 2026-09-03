import { 
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where 
} from 'firebase/firestore';
import { db } from '../firebase';

const LOCAL_REGISTRY_KEY = 'stella_registered_users_registry_v1';
const LOCAL_FRIENDSHIPS_KEY = 'stella_local_friendships_v1';
const GLOBAL_CHALLENGES_MAP_KEY = 'stella_global_challenges_map_v1';

// Helper for local friendships persistence
function getLocalFriendships() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_FRIENDSHIPS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalFriendships(list) {
  try {
    localStorage.setItem(LOCAL_FRIENDSHIPS_KEY, JSON.stringify(list));
  } catch {}
}

// Helper for registered users registry
function getLocalUserRegistry() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_REGISTRY_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Instant Search for registered users by Gmail address, Full Name, or Username
 * EXCLUDES all administrator accounts to keep admin identity hidden.
 */
export async function searchUsers(searchTerm = '', currentUid = '', currentEmail = '') {
  const clean = (searchTerm || '').trim().toLowerCase().replace(/^@/, '');
  const cleanCurrentEmail = (currentEmail || '').trim().toLowerCase();
  const cleanCurrentUid = (currentUid || '').trim().toLowerCase();

  const userPool = getLocalUserRegistry();

  // Deduplicate users by email or uid, excluding current user & admin accounts
  const uniqueUsers = [];
  const seenKeys = new Set();

  for (const u of userPool) {
    if (!u) continue;
    const userEmail = (u.email || '').trim().toLowerCase();
    const userUid = (u.uid || '').trim().toLowerCase();

    // REQUIREMENT: Admin identity is strictly hidden; skip any admin user
    if (u.role === 'admin' || userEmail === 'admin@stella.com') {
      continue;
    }

    // Skip current user
    if ((cleanCurrentUid && userUid === cleanCurrentUid) || 
        (cleanCurrentEmail && userEmail === cleanCurrentEmail)) {
      continue;
    }

    const key = userEmail || userUid;
    if (key && !seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueUsers.push(u);
    }
  }

  // Non-blocking Firestore background sync
  (async () => {
    try {
      const q = query(collection(db, 'users'));
      const querySnap = await getDocs(q);
      const cloudUsers = [];
      querySnap.forEach(d => cloudUsers.push(d.data()));
      if (cloudUsers.length > 0) {
        const registry = getLocalUserRegistry();
        cloudUsers.forEach(cu => {
          if (!registry.some(r => r.email === cu.email || r.uid === cu.uid)) {
            registry.push(cu);
          }
        });
        localStorage.setItem(LOCAL_REGISTRY_KEY, JSON.stringify(registry));
      }
    } catch (e) {
      // ignore offline notes
    }
  })();

  if (!clean) return [];

  // Filter matching non-admin users
  return uniqueUsers.filter(u => 
    (u.email && u.email.toLowerCase().includes(clean)) ||
    (u.displayName && u.displayName.toLowerCase().includes(clean)) ||
    (u.username && u.username.toLowerCase().includes(clean))
  );
}

/**
 * Send Friend Request (Instant 0ms synchronous local save + background cloud sync)
 * Strictly blocks sending requests to admin accounts.
 */
export async function sendFriendRequest(senderProfile, targetUser) {
  const receiverEmail = (targetUser.email || '').trim().toLowerCase();
  const receiverUid = targetUser.uid || `usr_${receiverEmail.replace(/[^a-z0-9]/g, '_')}`;

  // REQUIREMENT: Prevent sending requests to admin accounts
  if (targetUser.role === 'admin' || receiverEmail === 'admin@stella.com') {
    throw new Error('Friend requests cannot be sent to administrators.');
  }

  const senderEmail = (senderProfile.email || '').trim().toLowerCase();
  const senderUid = senderProfile.uid || `usr_${senderEmail.replace(/[^a-z0-9]/g, '_')}`;

  const reqId = `freq_${senderUid}_${receiverUid}`;

  const newReq = {
    id: reqId,
    senderUid: senderUid,
    senderEmail: senderEmail,
    senderUsername: senderProfile.username || senderEmail.split('@')[0],
    senderDisplayName: senderProfile.displayName || senderEmail,
    receiverUid: receiverUid,
    receiverEmail: receiverEmail,
    receiverUsername: targetUser.username || receiverEmail.split('@')[0],
    receiverDisplayName: targetUser.displayName || receiverEmail,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  // 1. SAVE LOCALLY IMMEDIATELY (0ms Latency)
  const localReqs = getLocalFriendships();
  const filtered = localReqs.filter(r => r.id !== reqId);
  filtered.push(newReq);
  saveLocalFriendships(filtered);

  // 2. Non-blocking Firestore background sync
  (async () => {
    try {
      await setDoc(doc(db, 'friendships', reqId), newReq);
    } catch (e) {
      console.warn("Firestore send request note:", e);
    }
  })();

  return newReq;
}

/**
 * Fetch Pending Incoming Requests for current user (Instant 0ms local read)
 */
export async function fetchPendingRequests(currentUid, currentEmail) {
  const cleanEmail = (currentEmail || '').trim().toLowerCase();
  const cleanUid = (currentUid || '').trim().toLowerCase();

  // Instant local read
  const localReqs = getLocalFriendships().filter(r => {
    if (!r || r.status !== 'pending') return false;
    const rEmail = (r.receiverEmail || '').trim().toLowerCase();
    const rUid = (r.receiverUid || '').trim().toLowerCase();
    return (cleanEmail && rEmail === cleanEmail) || (cleanUid && rUid === cleanUid);
  });

  return localReqs;
}

/**
 * Accept Friend Request (Instant 0ms local update + background cloud sync)
 */
export async function acceptFriendRequest(requestId, requestObj) {
  // 1. UPDATE LOCALLY IMMEDIATELY (0ms Latency)
  const localReqs = getLocalFriendships();
  const target = localReqs.find(r => r.id === requestId);
  if (target) {
    target.status = 'accepted';
    saveLocalFriendships(localReqs);
  } else if (requestObj) {
    const updated = { ...requestObj, status: 'accepted' };
    localReqs.push(updated);
    saveLocalFriendships(localReqs);
  }

  // 2. Non-blocking Firestore background sync
  (async () => {
    try {
      await updateDoc(doc(db, 'friendships', requestId), { status: 'accepted' });
    } catch (e) {
      console.warn("Firestore accept request note:", e);
    }
  })();
}

/**
 * Decline Friend Request (Instant 0ms local delete + background cloud sync)
 */
export async function declineFriendRequest(requestId) {
  // 1. DELETE LOCALLY IMMEDIATELY (0ms Latency)
  const localReqs = getLocalFriendships();
  const filtered = localReqs.filter(r => r.id !== requestId);
  saveLocalFriendships(filtered);

  // 2. Non-blocking Firestore background sync
  (async () => {
    try {
      await deleteDoc(doc(db, 'friendships', requestId));
    } catch (e) {
      console.warn("Firestore decline request note:", e);
    }
  })();
}

/**
 * Fetch Accepted Friends / Connections (Instant 0ms local read)
 */
export async function fetchFriends(currentUid, currentEmail) {
  const cleanEmail = (currentEmail || '').trim().toLowerCase();
  const cleanUid = (currentUid || '').trim().toLowerCase();

  const friendMap = new Map();

  // Instant Local friendships read
  const localReqs = getLocalFriendships();
  localReqs.forEach(r => {
    if (r.status === 'accepted') {
      const rSenderEmail = (r.senderEmail || '').trim().toLowerCase();
      const rSenderUid = (r.senderUid || '').trim().toLowerCase();
      const rRecvEmail = (r.receiverEmail || '').trim().toLowerCase();
      const rRecvUid = (r.receiverUid || '').trim().toLowerCase();

      const isSender = (cleanEmail && rSenderEmail === cleanEmail) || (cleanUid && rSenderUid === cleanUid);
      const isReceiver = (cleanEmail && rRecvEmail === cleanEmail) || (cleanUid && rRecvUid === cleanUid);

      if (isSender) {
        const key = rRecvEmail || rRecvUid;
        friendMap.set(key, {
          uid: rRecvUid,
          email: rRecvEmail,
          username: r.receiverUsername || rRecvEmail.split('@')[0],
          displayName: r.receiverDisplayName || rRecvEmail
        });
      } else if (isReceiver) {
        const key = rSenderEmail || rSenderUid;
        friendMap.set(key, {
          uid: rSenderUid,
          email: rSenderEmail,
          username: r.senderUsername || rSenderEmail.split('@')[0],
          displayName: r.senderDisplayName || rSenderEmail
        });
      }
    }
  });

  // Resolve friend profiles against local user registry
  const registry = getLocalUserRegistry();
  const result = [];

  for (const [key, basicInfo] of friendMap.entries()) {
    const found = registry.find(u => 
      (u.email && u.email.trim().toLowerCase() === basicInfo.email) ||
      (u.uid && u.uid.trim().toLowerCase() === basicInfo.uid)
    );

    if (found) {
      result.push(found);
    } else {
      result.push({
        uid: basicInfo.uid,
        email: basicInfo.email,
        displayName: basicInfo.displayName || basicInfo.email,
        username: basicInfo.username,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${basicInfo.email}`
      });
    }
  }

  return result;
}

/**
 * Fetch Friend's Challenges for Read-Only Dashboard (Instant 0ms local read)
 */
export async function fetchFriendChallenges(friendUid, friendEmail) {
  const cleanEmail = (friendEmail || '').trim().toLowerCase();
  const cleanUid = (friendUid || '').trim().toLowerCase();

  // 1. Check Global Challenges Map in localStorage (0ms Instant)
  try {
    const globalMap = JSON.parse(localStorage.getItem(GLOBAL_CHALLENGES_MAP_KEY) || '{}');
    if (cleanUid && globalMap[cleanUid] && Array.isArray(globalMap[cleanUid])) {
      return globalMap[cleanUid];
    }
    if (cleanEmail && globalMap[cleanEmail] && Array.isArray(globalMap[cleanEmail])) {
      return globalMap[cleanEmail];
    }
  } catch {}

  // 2. Check direct user key in localStorage (0ms Instant)
  try {
    const userChallenges = JSON.parse(localStorage.getItem(`stella_user_challenges_${cleanUid}`) || '[]');
    if (Array.isArray(userChallenges) && userChallenges.length > 0) {
      return userChallenges;
    }
  } catch {}

  return [];
}
