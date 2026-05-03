import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as _signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import * as firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp((firebaseConfig as any).default || firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Wait, I will use:
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Firebase Sign-In Error:", error);
    alert("Sign-in failed. Please check the browser console for details (F12). Error: " + (error as Error).message);
  }
};
export const signOut = () => _signOut(auth);
