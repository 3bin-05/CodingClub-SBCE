import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  collection,
  addDoc
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  adminRecord: any | null;
  accessRequest: any | null;
  loading: boolean;
  isAuthorizedAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]               = useState<User | null>(null);
  const [adminRecord, setAdminRecord] = useState<any | null>(null);
  const [accessRequest, setAccessRequest] = useState<any | null>(null);
  const [loading, setLoading]         = useState<boolean>(true);

  // Derived: is the logged-in user an active admin?
  const isAuthorizedAdmin = !!adminRecord && adminRecord.status === 'active';

  // ── Real-time auth + Firestore listeners ────────────────────────────────
  useEffect(() => {
    let unsubAdmin:   (() => void) | null = null;
    let unsubRequest: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Tear down listeners from the previous session
      if (unsubAdmin)   { unsubAdmin();   unsubAdmin   = null; }
      if (unsubRequest) { unsubRequest(); unsubRequest = null; }

      setUser(firebaseUser);

      if (!firebaseUser) {
        setAdminRecord(null);
        setAccessRequest(null);
        setLoading(false);
        return;
      }

      // Listen to this user's admin document
      unsubAdmin = onSnapshot(
        doc(db, 'admins', firebaseUser.uid),
        (snap) => setAdminRecord(snap.exists() ? snap.data() : null),
        (err)  => console.error('[Auth] admins listener error:', err)
      );

      // Listen to this user's access request document
      unsubRequest = onSnapshot(
        doc(db, 'adminAccessRequests', firebaseUser.uid),
        (snap) => {
          setAccessRequest(snap.exists() ? snap.data() : null);
          setLoading(false);
        },
        (err) => {
          console.error('[Auth] accessRequest listener error:', err);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubAdmin)   unsubAdmin();
      if (unsubRequest) unsubRequest();
    };
  }, []);

  // ── Google Sign-In + Access Request Logic ───────────────────────────────
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const credential  = await signInWithPopup(auth, provider);
    const firebaseUser = credential.user;
    const uid   = firebaseUser.uid;
    const email = firebaseUser.email ?? '';
    const name  = firebaseUser.displayName || email.split('@')[0] || 'User';

    // ── Bootstrap check ─────────────────────────────────────────────────
    const metaRef  = doc(db, 'metadata', 'admin_config');
    const metaSnap = await getDoc(metaRef);
    const isBootstrap =
      !metaSnap.exists() ||
      !metaSnap.data()?.superAdmins ||
      (metaSnap.data()?.superAdmins as string[]).length === 0;

    if (isBootstrap) {
      // ── First user ever → make them Super Admin ─────────────────────
      const now = new Date().toISOString();
      await setDoc(doc(db, 'admins', uid), {
        uid,
        email,
        displayName: name,
        role:        'super_admin',
        status:      'active',
        approvedBy:  'System Bootstrap',
        approvedAt:  now,
        createdAt:   now,
        updatedAt:   now,
      });

      await setDoc(metaRef, { superAdmins: [uid] });

      await addDoc(collection(db, 'adminAuditLogs'), {
        action:           'System Bootstrapped',
        targetType:       'system',
        targetId:         'bootstrap',
        targetName:       'First Super Admin Created',
        performedByUid:   uid,
        performedByEmail: email,
        timestamp:        serverTimestamp(),
        metadata:         { email },
      });

      return; // listeners will fire and set state automatically
    }

    // ── Already bootstrapped: check if this user is an active admin ────
    const adminSnap = await getDoc(doc(db, 'admins', uid));
    if (adminSnap.exists() && adminSnap.data()?.status === 'active') {
      return; // already approved — listeners will update state
    }

    // ── Not an admin → record / increment access request ───────────────
    const requestRef  = doc(db, 'adminAccessRequests', uid);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      // First-time request
      await setDoc(requestRef, {
        uid,
        email,
        displayName:      name,
        status:           'pending',
        firstRequestedAt: serverTimestamp(),
        lastAttemptAt:    serverTimestamp(),
        attemptCount:     1,
      });
    } else {
      // Repeat attempt — only increment counter & timestamp
      await updateDoc(requestRef, {
        lastAttemptAt: serverTimestamp(),
        attemptCount:  increment(1),
        // keep displayName/email up to date in case they changed
        displayName: name,
        email,
      });
    }
    // The onSnapshot listener will pick up the new document and update state
  };

  // ── Logout ──────────────────────────────────────────────────────────────
  const logout = async () => {
    await firebaseSignOut(auth);
    setAdminRecord(null);
    setAccessRequest(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      adminRecord,
      accessRequest,
      loading,
      isAuthorizedAdmin,
      loginWithGoogle,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
