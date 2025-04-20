import { Platform } from 'react-native';
import 'react-native-get-random-values';
import {v4 as uuidv4} from 'uuid'

// Define types for our mock Firebase implementation
interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  updateProfile?: (profile: { displayName?: string }) => Promise<void>;
}

interface UserCredential {
  user: MockUser;
}

type AuthStateChangeListener = (user: MockUser | null) => void;

// Mock Firebase implementation for demo purposes
class MockAuth {
  currentUser: MockUser | null = null;
  listeners: AuthStateChangeListener[] = [];

  createUserWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    return new Promise((resolve) => {
      const newUser: MockUser = {
        uid: 'mock-user-' + Math.random().toString(36).substring(2, 9),
        email,
        displayName: '',
        emailVerified: false,
        updateProfile: (profile: { displayName?: string }) => {
          if (this.currentUser && profile.displayName) {
            this.currentUser.displayName = profile.displayName;
          }
          return Promise.resolve();
        }
      };
      
      this.currentUser = newUser;
      
      // Notify listeners
      this.listeners.forEach(listener => listener(this.currentUser));
      
      resolve({ user: this.currentUser });
    });
  }

  signInWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    return new Promise((resolve) => {
      const mockUser: MockUser = {
        uid: 'mock-user-' + Math.random().toString(36).substring(2, 9),
        email,
        displayName: 'Demo User',
        emailVerified: true
      };
      
      this.currentUser = mockUser;
      
      // Notify listeners
      this.listeners.forEach(listener => listener(this.currentUser));
      
      resolve({ user: this.currentUser });
    });
  }

  signOut(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.currentUser = null;
      
      // Notify listeners
      this.listeners.forEach(listener => listener(null));
      
      resolve();
    });
  }

  sendPasswordResetEmail(email: string): Promise<void> {
    return Promise.resolve();
  }

  onAuthStateChanged(listener: AuthStateChangeListener): () => void {
    this.listeners.push(listener);
    
    // Call with current state immediately
    if (this.currentUser) {
      listener(this.currentUser);
    } else {
      listener(null);
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

interface Collections {
  [key: string]: {
    [id: string]: any;
  };
}

interface DocumentReference {
  get: () => Promise<DocumentSnapshot>;
  set: (data: any) => Promise<void>;
  update: (data: any) => Promise<void>;
}

interface DocumentSnapshot {
  exists: boolean;
  data: () => any | null;
}

class MockFirestore {
  collections: Collections = {
    users: {}
  };

  doc(collection: string, id: string): DocumentReference {
    return {
      get: () => Promise.resolve({
        exists: !!this.collections[collection]?.[id],
        data: () => this.collections[collection]?.[id] || null,
      }),
      set: (data: any) => {
        if (!this.collections[collection]) {
          this.collections[collection] = {};
        }
        this.collections[collection][id] = data;
        return Promise.resolve();
      },
      update: (data: any) => {
        if (!this.collections[collection]) {
          this.collections[collection] = {};
        }
        if (!this.collections[collection][id]) {
          this.collections[collection][id] = {};
        }
        this.collections[collection][id] = {
          ...this.collections[collection][id],
          ...data
        };
        return Promise.resolve();
      }
    };
  }
}

// Create mock instances
const auth = new MockAuth();
const db = new MockFirestore();

// Export mock Firebase services
export { auth, db };

// Export mock providers for social login
export class GoogleAuthProvider {
  addScope(): void {}
}

export class OAuthProvider {
  constructor(public providerId: string) {}
  addScope(): void {}
}

export const signInWithPopup = (): Promise<{ user: MockUser }> => {
  return Promise.resolve({
    user: {
      uid: 'mock-social-user-' + Math.random().toString(36).substring(2, 9),
      email: 'social@example.com',
      displayName: 'Social User',
      emailVerified: true
    }
  });
};

// Console message to indicate mock mode
console.log('⚠️ Using mock Firebase implementation for demo purposes');