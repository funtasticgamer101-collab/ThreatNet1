import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, getRedirectResult, signInWithRedirect } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserData {
  role: 'user' | 'moderator' | 'admin';
  displayName: string;
  photoUrl: string;
  bio: string;
  organization?: string;
  focusAreas?: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userData: null, loading: true, isAdmin: false, isModerator: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid);
          let docSnap;
          try {
             docSnap = await getDoc(userRef);
          } catch(e) {
             console.error("GETDOC FAILED:", e);
             throw e;
          }
          
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else {
            // Check if this is the designated admin account
            const isSoleAdmin = u.email === 'FunTasticGamer101@gmail.com' || u.email?.toLowerCase() === 'funtasticgamer101@gmail.com';
            
            // Initialize new user
            const newUserData: UserData = {
              role: isSoleAdmin ? 'admin' : 'user',
              displayName: u.displayName || 'Anonymous',
              photoUrl: u.photoURL || '',
              bio: '',
              isVerified: false,
            };
            
            try {
              await setDoc(userRef, {
                ...newUserData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } catch(e) {
               console.error("SETDOC FAILED:", e);
               throw e;
            }
            setUserData(newUserData);
          }
        } catch (error) {
          console.error("Error creating/fetching user profile:", error);
          // If firestore rules block it or network fails, at least populate a default
          const isSoleAdmin = u.email?.toLowerCase() === 'funtasticgamer101@gmail.com';
          setUserData({
            role: isSoleAdmin ? 'admin' : 'user',
            displayName: u.displayName || 'Anonymous',
            photoUrl: u.photoURL || '',
            bio: '',
            isVerified: false,
          });
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = userData?.role === 'admin';
  const isModerator = isAdmin || userData?.role === 'moderator';

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin, isModerator }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
