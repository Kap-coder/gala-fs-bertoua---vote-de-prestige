import { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  hasVoted: boolean;
  role: UserRole;
}

export interface Candidate {
  id: string;
  name: string;
  description: string;
  image: string;
  voteCount: number;
}

export interface Vote {
  id?: string;
  userId: string;
  candidateId: string;
  timestamp: Timestamp;
}
