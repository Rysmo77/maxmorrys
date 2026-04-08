import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        (async () => {
          try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            // Guard contre la race condition : ignorer si l'utilisateur a changé entre-temps
            if (auth.currentUser?.uid !== uid) return;
            if (docSnap.exists()) {
              setUserData(docSnap.data() as User);
            } else {
              setUserData(null);
            }
          } catch {
            setUserData(null);
          } finally {
            if (auth.currentUser?.uid === uid || !auth.currentUser) {
              setLoading(false);
            }
          }
        })();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      const errorCode = (error as { code?: string })?.code ?? '';
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        throw new Error('Email ou mot de passe incorrect');
      } else if (errorCode === 'auth/too-many-requests') {
        throw new Error('Trop de tentatives. Réessayez plus tard');
      } else if (errorCode === 'auth/user-disabled') {
        throw new Error('Ce compte a été désactivé');
      } else if (errorCode === 'auth/invalid-email') {
        throw new Error('Email invalide');
      } else {
        throw new Error('Erreur de connexion. Vérifiez vos identifiants');
      }
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      const newUser: User = {
        uid: cred.user.uid,
        email,
        displayName,
        role: 'student',
        createdAt: new Date().toISOString(),
        preferences: { theme: 'system', language: 'fr', newsletter: false },
      };
      await setDoc(doc(db, 'users', cred.user.uid), newUser);
      setUserData(newUser);
    } catch (error: unknown) {
      const errorCode = (error as { code?: string })?.code ?? '';
      if (errorCode === 'auth/email-already-in-use') {
        throw new Error('Cet email est déjà utilisé');
      } else if (errorCode === 'auth/invalid-email') {
        throw new Error('Email invalide');
      } else if (errorCode === 'auth/weak-password') {
        throw new Error('Mot de passe trop faible (minimum 6 caractères)');
      } else {
        throw new Error('Erreur lors de la création du compte');
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const docRef = doc(db, 'users', cred.user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        const newUser: User = {
          uid: cred.user.uid,
          email: cred.user.email ?? '',
          displayName: cred.user.displayName ?? '',
          role: 'student',
          createdAt: new Date().toISOString(),
          preferences: { theme: 'system', language: 'fr', newsletter: false },
        };
        await setDoc(docRef, newUser);
        setUserData(newUser);
      } else {
        setUserData(docSnap.data() as User);
      }
    } catch (error: unknown) {
      const errorCode = (error as { code?: string })?.code ?? '';
      if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') return;
      throw new Error('Erreur lors de la connexion avec Google');
    }
  };

  const refreshUserData = async () => {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setUserData(docSnap.data() as User);
    } catch { /* ignore */ }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserData(null);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
      const errorCode = (error as { code?: string })?.code ?? '';
      if (errorCode === 'auth/user-not-found') {
        // Ne pas révéler si l'email existe — retourner silencieusement
        return;
      } else if (errorCode === 'auth/invalid-email') {
        throw new Error('Email invalide');
      } else {
        throw new Error("Erreur lors de l'envoi de l'email");
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signIn, signUp, signInWithGoogle, signOut, resetPassword, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
