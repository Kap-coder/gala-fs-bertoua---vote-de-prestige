import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  increment, 
  writeBatch, 
  onSnapshot, 
  query, 
  orderBy,
  Timestamp,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Candidate, UserProfile, Vote } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const dbService = {
  // Candidates
  async getCandidates(): Promise<Candidate[]> {
    try {
      const snapshot = await getDocs(collection(db, 'candidates'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'candidates');
      return [];
    }
  },

  subscribeCandidates(callback: (candidates: Candidate[]) => void) {
    const q = query(collection(db, 'candidates'), orderBy('voteCount', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const candidates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
      callback(candidates);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'candidates'));
  },

  async addCandidate(candidate: Omit<Candidate, 'id' | 'voteCount'>) {
    try {
      await addDoc(collection(db, 'candidates'), { ...candidate, voteCount: 0 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'candidates');
    }
  },

  async updateCandidate(id: string, data: Partial<Candidate>) {
    try {
      await updateDoc(doc(db, 'candidates', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `candidates/${id}`);
    }
  },

  async deleteCandidate(id: string) {
    try {
      await deleteDoc(doc(db, 'candidates', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `candidates/${id}`);
    }
  },

  // Users
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      return null;
    }
  },

  async createUserProfile(profile: UserProfile) {
    try {
      await setDoc(doc(db, 'users', profile.id), profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${profile.id}`);
    }
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>) {
    try {
      await updateDoc(doc(db, 'users', uid), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  },

  // Voting Logic (Atomic Transaction/Batch)
  async castVote(userId: string, candidateId: string) {
    try {
      const batch = writeBatch(db);
      
      // 1. Create vote record
      const voteRef = doc(collection(db, 'votes'));
      batch.set(voteRef, {
        userId,
        candidateId,
        timestamp: Timestamp.now()
      });

      // 2. Update candidate vote count
      const candidateRef = doc(db, 'candidates', candidateId);
      batch.update(candidateRef, {
        voteCount: increment(1)
      });

      // 3. Mark user as voted
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        hasVoted: true
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch-vote');
    }
  },

  // Admin: Get all votes
  subscribeVotes(callback: (votes: Vote[]) => void) {
    const q = query(collection(db, 'votes'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const votes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vote));
      callback(votes);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'votes'));
  },

  // Admin: Get all users
  subscribeUsers(callback: (users: UserProfile[]) => void) {
    return onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      callback(users);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
  },

  // Admin: Whitelisted Emails
  async addAdminEmail(email: string) {
    try {
      await setDoc(doc(db, 'admin_emails', email.toLowerCase()), {
        email: email.toLowerCase(),
        addedBy: auth.currentUser?.email,
        addedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `admin_emails/${email}`);
    }
  },

  async removeAdminEmail(email: string) {
    try {
      await deleteDoc(doc(db, 'admin_emails', email.toLowerCase()));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `admin_emails/${email}`);
    }
  },

  subscribeAdminEmails(callback: (emails: any[]) => void) {
    return onSnapshot(collection(db, 'admin_emails'), (snapshot) => {
      const emails = snapshot.docs.map(doc => doc.data());
      callback(emails);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'admin_emails'));
  },

  async checkIsAdminEmail(email: string): Promise<boolean> {
    try {
      const snapshot = await getDoc(doc(db, 'admin_emails', email.toLowerCase()));
      return snapshot.exists();
    } catch (error) {
      return false;
    }
  }
};
