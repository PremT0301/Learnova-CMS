import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { auth, db } from '@/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, setDoc } from 'firebase/firestore';
import { listenFacultyRequestByEmail } from '@/services/firebaseService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; redirect?: string }>;
  logout: () => void;
  isLoading: boolean;
  // Admin-only actions
  createOrUpdateUserProfile: (input: { email: string; name?: string; role: UserRole; department?: string; active?: boolean; avatar?: string }) => Promise<{ ok: boolean; reason?: string }>;
  updateUserRole: (email: string, role: UserRole) => Promise<{ ok: boolean; reason?: string }>;
  setUserActive: (email: string, active: boolean) => Promise<{ ok: boolean; reason?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;

// Helper to map Firebase user + Firestore profile to app User
async function buildAppUser(firebaseUid: string, fallbackEmail: string | null): Promise<User | null> {
  try {
    const userDocRef = doc(db, 'users', firebaseUid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const data = userDoc.data() as Partial<User> & { role?: UserRole; active?: boolean };
      if (fallbackEmail && ADMIN_EMAIL && fallbackEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        // Ensure admin role for the pre-decided admin even if profile differs
        return {
          id: firebaseUid,
          email: fallbackEmail,
          name: data.name ?? fallbackEmail,
          role: 'admin',
          avatar: data.avatar,
          department: data.department,
          joinDate: data.joinDate ?? new Date().toISOString().slice(0, 10)
        };
      }
      if (data.active === false) {
        return null;
      }
      return {
        id: firebaseUid,
        email: data.email ?? fallbackEmail ?? '',
        name: data.name ?? data.email ?? 'User',
        role: (data.role ?? 'student') as UserRole,
        avatar: data.avatar,
        department: data.department,
        joinDate: data.joinDate ?? new Date().toISOString().slice(0, 10)
      };
    }
    // If no profile by uid, try lookup by email (admin may pre-create by email)
    if (fallbackEmail) {
      const q = query(collection(db, 'users'), where('email', '==', fallbackEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data() as Partial<User> & { role?: UserRole; active?: boolean };
        if (fallbackEmail && ADMIN_EMAIL && fallbackEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          return {
            id: firebaseUid,
            email: fallbackEmail,
            name: data.name ?? fallbackEmail,
            role: 'admin',
            avatar: data.avatar,
            department: data.department,
            joinDate: data.joinDate ?? new Date().toISOString().slice(0, 10)
          };
        }
        if (data.active === false) {
          return null;
        }
        // Only allow login if admin created this profile (presence in DB is the signal)
        return {
          id: firebaseUid,
          email: data.email ?? fallbackEmail,
          name: data.name ?? fallbackEmail,
          role: (data.role ?? 'student') as UserRole,
          avatar: data.avatar,
          department: data.department,
          joinDate: data.joinDate ?? new Date().toISOString().slice(0, 10)
        };
      }
    }
    // No profile found: Only allow admin to proceed; block everyone else
    if (fallbackEmail && ADMIN_EMAIL && fallbackEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return {
        id: firebaseUid,
        email: fallbackEmail,
        name: fallbackEmail,
        role: 'admin',
        joinDate: new Date().toISOString().slice(0, 10)
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Check if signup is in progress - if so, don't interfere
      const signupInProgress = sessionStorage.getItem('signup_in_progress');
      if (signupInProgress === 'true') {
        console.log('Signup in progress, skipping auth state change handling');
        setIsLoading(false);
        return;
      }

      if (firebaseUser) {
        const appUser = await buildAppUser(firebaseUser.uid, firebaseUser.email);
        if (!appUser) {
          // Block access if no admin-approved profile
          await signOut(auth);
          setUser(null);
        } else {
          setUser(appUser);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; redirect?: string }> => {
    setIsLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = credential.user;
      const appUser = await buildAppUser(fbUser.uid, fbUser.email);
      if (!appUser) {
        await signOut(auth);
        setUser(null);
        return { success: false };
      }
      
      // Check faculty request status for faculty users
      if (appUser.role === 'faculty' && !appUser.active) {
        return new Promise((resolve) => {
          const unsub = listenFacultyRequestByEmail(email.toLowerCase(), (request) => {
            unsub();
            if (request?.status === 'pending') {
              resolve({ success: true, redirect: '/request-under-review' });
            } else if (request?.status === 'rejected') {
              resolve({ success: true, redirect: '/request-denied' });
            } else {
              // Approved or no request found, proceed normally
              setUser(appUser);
              resolve({ success: true });
            }
          });
        });
      }
      
      setUser(appUser);
      return { success: true };
    } catch {
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    return signOut(auth);
  };

  // Admin utilities
  const ensureAdmin = (): { ok: boolean; reason?: string } => {
    if (!user || user.role !== 'admin') {
      return { ok: false, reason: 'not_admin' };
    }
    return { ok: true };
  };

  const findUserDocByEmail = async (email: string) => {
    const normalized = email.toLowerCase();
    const qByEmail = query(collection(db, 'users'), where('email', '==', normalized));
    const snap = await getDocs(qByEmail);
    return snap.docs[0] ?? null;
  };

  const createOrUpdateUserProfile: AuthContextType['createOrUpdateUserProfile'] = async (input) => {
    const gate = ensureAdmin();
    if (!gate.ok) return gate;
    try {
      const normalized = input.email.toLowerCase();
      const existing = await findUserDocByEmail(normalized);
      const payload = {
        email: normalized,
        name: input.name ?? normalized,
        role: input.role,
        department: input.department,
        avatar: input.avatar,
        active: input.active ?? true,
      } as Record<string, unknown>;
      if (existing) {
        await updateDoc(existing.ref, payload);
      } else {
        await addDoc(collection(db, 'users'), payload);
      }
      return { ok: true };
    } catch {
      return { ok: false, reason: 'firestore_error' };
    }
  };

  const updateUserRole: AuthContextType['updateUserRole'] = async (email, role) => {
    const gate = ensureAdmin();
    if (!gate.ok) return gate;
    try {
      const existing = await findUserDocByEmail(email);
      if (!existing) return { ok: false, reason: 'not_found' };
      await updateDoc(existing.ref, { role });
      return { ok: true };
    } catch {
      return { ok: false, reason: 'firestore_error' };
    }
  };

  const setUserActive: AuthContextType['setUserActive'] = async (email, active) => {
    const gate = ensureAdmin();
    if (!gate.ok) return gate;
    try {
      const existing = await findUserDocByEmail(email);
      if (!existing) return { ok: false, reason: 'not_found' };
      await updateDoc(existing.ref, { active });
      return { ok: true };
    } catch {
      return { ok: false, reason: 'firestore_error' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, createOrUpdateUserProfile, updateUserRole, setUserActive }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}