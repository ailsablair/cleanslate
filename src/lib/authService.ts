import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInAnonymously
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { INITIAL_USER_PROFILE } from './mockData';

const googleProvider = new GoogleAuthProvider();

export interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
}

/**
 * Listen for Firebase Auth state changes and sync user profile from Firestore
 */
export function subscribeToAuthChanges(
  onStateChange: (state: AuthState) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Sync or create user profile in Firestore
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        let userProfile: UserProfile;

        if (userSnap.exists()) {
          userProfile = userSnap.data() as UserProfile;
        } else {
          // Create initial customized profile for new user
          const nameParts = (firebaseUser.displayName || 'CleanSlate User').split(' ');
          userProfile = {
            ...INITIAL_USER_PROFILE,
            uid: firebaseUser.uid,
            firstName: nameParts[0] || 'CleanSlate',
            lastName: nameParts.slice(1).join(' ') || 'Debtor',
            email: firebaseUser.email || 'user@cleanslate.ca',
            avatarUrl: firebaseUser.photoURL || INITIAL_USER_PROFILE.avatarUrl,
            updatedAt: new Date().toISOString()
          };
          await setDoc(userRef, userProfile);
        }

        onStateChange({
          user: firebaseUser,
          profile: userProfile,
          isLoading: false,
          isAuthenticated: true,
          isAnonymous: firebaseUser.isAnonymous
        });
      } catch (err) {
        console.warn('Auth sync error, using initial profile:', err);
        onStateChange({
          user: firebaseUser,
          profile: {
            ...INITIAL_USER_PROFILE,
            uid: firebaseUser.uid,
            email: firebaseUser.email || INITIAL_USER_PROFILE.email
          },
          isLoading: false,
          isAuthenticated: true,
          isAnonymous: firebaseUser.isAnonymous
        });
      }
    } else {
      // Logged out state
      const savedProfile = localStorage.getItem('cleanslate_profile');
      const defaultProfile = savedProfile ? JSON.parse(savedProfile) : INITIAL_USER_PROFILE;

      onStateChange({
        user: null,
        profile: defaultProfile,
        isLoading: false,
        isAuthenticated: false,
        isAnonymous: false
      });
    }
  });
}

/**
 * Sign in with Google Auth
 */
export async function loginWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

/**
 * Sign in as Quick Demo / Anonymous User for instant testing
 */
export async function loginAsDemoUser(): Promise<FirebaseUser | null> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.warn('Anonymous auth note:', error);
    return null;
  }
}

/**
 * Log out user safely from Firebase Auth & clear local caches if requested
 */
export async function logoutUser(clearLocalStorage = false): Promise<void> {
  try {
    await firebaseSignOut(auth);
    if (clearLocalStorage) {
      localStorage.removeItem('cleanslate_profile');
      localStorage.removeItem('cleanslate_banks');
      localStorage.removeItem('cleanslate_txs');
      localStorage.removeItem('cleanslate_reports');
      localStorage.removeItem('cleanslate_receipts');
      localStorage.removeItem('cleanslate_goals');
    }
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}
