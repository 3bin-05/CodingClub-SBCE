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

interface AuthContextType {
  user: User | null;
  adminRecord: any | null;
  accessRequest: any | null;
  loading: boolean;
  isAuthorizedAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  recordAccessAttempt: (firebaseUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminRecord, setAdminRecord] = useState<any | null>(null);
  const [accessRequest, setAccessRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isAuthorizedAdmin = !!adminRecord && adminRecord.status === 'active';

  // Function to record/update access attempt
  const recordAccessAttempt = async (firebaseUser: User) => {
    if (!firebaseUser) return;
    const requestDocRef = doc(db, 'adminAccessRequests', firebaseUser.uid);
    try {
      const docSnap = await getDoc(requestDocRef);
      if (!docSnap.exists()) {
        await setDoc(requestDocRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Unknown User',
          status: 'pending',
          firstRequestedAt: serverTimestamp(),
          lastAttemptAt: serverTimestamp(),
          attemptCount: 1
        });
      } else {
        await updateDoc(requestDocRef, {
          lastAttemptAt: serverTimestamp(),
          attemptCount: increment(1)
        });
      }
    } catch (err) {
      console.error('Error recording access attempt:', err);
    }
  };

  useEffect(() => {
    let unsubAdmin: (() => void) | null = null;
    let unsubRequest: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // Clean up previous snapshots
      if (unsubAdmin) unsubAdmin();
      if (unsubRequest) unsubRequest();

      if (firebaseUser) {
        // Set up real-time listener for the user's admin document
        unsubAdmin = onSnapshot(doc(db, 'admins', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setAdminRecord(docSnap.data());
          } else {
            setAdminRecord(null);
          }
        }, (err) => {
          console.error('Error listening to admin record:', err);
        });

        // Set up real-time listener for the user's access request document
        unsubRequest = onSnapshot(doc(db, 'adminAccessRequests', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setAccessRequest(docSnap.data());
          } else {
            setAccessRequest(null);
          }
          setLoading(false);
        }, (err) => {
          console.error('Error listening to access request:', err);
          setLoading(false);
        });

      } else {
        setAdminRecord(null);
        setAccessRequest(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubAdmin) unsubAdmin();
      if (unsubRequest) unsubRequest();
    };
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;
      const uid = firebaseUser.uid;
      const email = firebaseUser.email || '';
      const name = firebaseUser.displayName || email.split('@')[0] || 'Admin';

      // 1. Fetch metadata config to check if database is empty (bootstrap check)
      const metaDocRef = doc(db, 'metadata', 'admin_config');
      const metaSnap = await getDoc(metaDocRef);
      const isDbEmpty = !metaSnap.exists() || !metaSnap.data()?.superAdmins || metaSnap.data()?.superAdmins.length === 0;

      if (isDbEmpty) {
        // Bootstrap: Set directly as active super_admin
        await setDoc(doc(db, 'admins', uid), {
          uid,
          email,
          displayName: name,
          role: 'super_admin',
          status: 'active',
          approvedBy: 'System Bootstrap',
          approvedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Initialize admin_config metadata document
        await setDoc(metaDocRef, {
          superAdmins: [uid]
        });

        // Write bootstrap audit log
        await addDoc(collection(db, 'adminAuditLogs'), {
          action: 'System Bootstrapped',
          targetType: 'system',
          targetId: 'bootstrap',
          targetName: 'First Super Admin Created',
          performedByUid: uid,
          performedByEmail: email,
          timestamp: serverTimestamp(),
          metadata: { email }
        });
      } else {
        // Standard user: Check if they are an active admin, otherwise record access attempt
        const adminSnap = await getDoc(doc(db, 'admins', uid));
        if (!adminSnap.exists() || adminSnap.data()?.status !== 'active') {
          await recordAccessAttempt(firebaseUser);
        }
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
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
      recordAccessAttempt
    }}>
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
