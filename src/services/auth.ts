import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { dbService } from './db';
import { UserProfile } from '../types';

export const authService = {
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      return this.handleUserSignIn(user);
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  },

  async signInWithEmail(email: string, pass: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      return this.handleUserSignIn(result.user);
    } catch (error) {
      console.error('Email Sign In Error:', error);
      throw error;
    }
  },

  async handleUserSignIn(user: User) {
    // Check if profile exists, if not create it
    const existingProfile = await dbService.getUserProfile(user.uid);
    const isMainAdmin = user.email === 'angekapel007@gmail.com';
    const isWhitelistedAdmin = user.email ? await dbService.checkIsAdminEmail(user.email) : false;
    const shouldBeAdmin = isMainAdmin || isWhitelistedAdmin;
    
    if (!existingProfile) {
      const newProfile: UserProfile = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Utilisateur',
        email: user.email || '',
        hasVoted: false,
        role: shouldBeAdmin ? 'admin' : 'user'
      };
      await dbService.createUserProfile(newProfile);
      return user;
    } else if (shouldBeAdmin && existingProfile.role !== 'admin') {
      // Force upgrade if email matches but role is wrong (legacy users or newly whitelisted)
      await dbService.updateUserProfile(user.uid, { role: 'admin' });
    }
    return user;
  },

  async logout() {
    await signOut(auth);
  },

  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};
