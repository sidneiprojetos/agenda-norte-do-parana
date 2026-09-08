import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, isUserAdmin } from '../firebase';
import { UserProfile, UserRole, UserStatus } from '../types';

const USERS_COLLECTION = 'users';

/**
 * Synchronize and ensure user profile document in Firestore upon Google Login.
 * Automatically marks imc.sidnei@gmail.com as 'admin' and 'approved'.
 * Other users are initialized with 'pending' status awaiting admin approval.
 */
export async function syncUserProfile(fbUser: User): Promise<UserProfile> {
  if (!fbUser.uid) {
    throw new Error('User UID is missing');
  }

  const userDocRef = doc(db, USERS_COLLECTION, fbUser.uid);
  const userSnapshot = await getDoc(userDocRef);
  const isAdminEmail = isUserAdmin(fbUser.email);

  if (userSnapshot.exists()) {
    const existingData = userSnapshot.data() as Partial<UserProfile>;
    
    // If user is Sidnei, enforce admin and approved
    const role: UserRole = isAdminEmail ? 'admin' : (existingData.role || 'member');
    const status: UserStatus = isAdminEmail ? 'approved' : (existingData.status || 'pending');

    const updatedProfile: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || existingData.displayName || fbUser.email?.split('@')[0] || 'Membro',
      photoURL: fbUser.photoURL || existingData.photoURL || null,
      role,
      status,
      createdAt: existingData.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      approvedAt: isAdminEmail ? (existingData.approvedAt || new Date().toISOString()) : existingData.approvedAt,
      approvedBy: isAdminEmail ? (existingData.approvedBy || 'Master') : existingData.approvedBy,
      division: existingData.division || 'Norte do Paraná',
      notes: existingData.notes || ''
    };

    await setDoc(userDocRef, updatedProfile, { merge: true });
    return updatedProfile;
  } else {
    // Brand new user registration
    const newProfile: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Membro',
      photoURL: fbUser.photoURL || null,
      role: isAdminEmail ? 'admin' : 'member',
      status: isAdminEmail ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      approvedAt: isAdminEmail ? new Date().toISOString() : undefined,
      approvedBy: isAdminEmail ? 'Master' : undefined,
      division: 'Norte do Paraná',
      notes: ''
    };

    await setDoc(userDocRef, newProfile);
    return newProfile;
  }
}

/**
 * Subscribe to a specific user's profile in real-time.
 * If status is updated to 'approved' by admin, the client will immediately unlock.
 */
export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void
): () => void {
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  return onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserProfile);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error listening to user profile:', error);
      callback(null);
    }
  );
}

/**
 * Subscribe to all users for the Admin Dashboard.
 */
export function subscribeToAllUsers(
  callback: (users: UserProfile[]) => void
): () => void {
  const usersRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as UserProfile);
      });
      // Sort: pending first, then by createdAt desc
      users.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      callback(users);
    },
    (error) => {
      console.error('Error fetching users for admin dashboard:', error);
    }
  );
}

/**
 * Approve user request
 */
export async function approveUser(uid: string, approverEmail: string): Promise<void> {
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userDocRef, {
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: approverEmail
  });
}

/**
 * Reject / Block user request
 */
export async function rejectUser(uid: string): Promise<void> {
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userDocRef, {
    status: 'rejected'
  });
}

/**
 * Update user role (admin or member)
 */
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userDocRef, { role });
}

/**
 * Update full user details from admin modal
 */
export async function updateUserDetails(
  uid: string,
  details: {
    displayName?: string;
    role?: UserRole;
    status?: UserStatus;
    division?: string;
    notes?: string;
  }
): Promise<void> {
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userDocRef, {
    ...details,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Permanently delete a user profile
 */
export async function deleteUser(uid: string): Promise<void> {
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  await deleteDoc(userDocRef);
}
