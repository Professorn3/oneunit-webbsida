import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null); // holds role etc.
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('admin'); // 'admin' | 'member' | 'guest'

  useEffect(() => {
    let unsubscribeSnap;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        
        unsubscribeSnap = onSnapshot(userRef, (userSnap) => {
          if (userSnap.exists()) {
            setUserData(userSnap.data());
            setLoading(false);
          } else {
            const newUserData = {
              email: user.email,
              role: 'guest',
              createdAt: new Date().toISOString()
            };
            setDoc(userRef, newUserData);
          }
        });
      } else {
        setUserData(null);
        setLoading(false);
        if (unsubscribeSnap) unsubscribeSnap();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnap) unsubscribeSnap();
    };
  }, []);

  const actualIsAdmin = userData?.role === 'admin';

  // Om användaren faktiskt är admin och väljer att byta vy (medlem / gäst)
  const effectiveRole = userData?.isBanned ? 'banned'
                      : actualIsAdmin && viewMode === 'member' ? 'member'
                      : actualIsAdmin && viewMode === 'guest' ? 'guest'
                      : userData?.role;

  const effectiveUser = actualIsAdmin && viewMode === 'guest' ? null : currentUser;

  const value = {
    currentUser: effectiveUser,
    actualUser: currentUser,
    userData: actualIsAdmin && viewMode === 'guest' ? null : userData,
    isAdmin: effectiveRole === 'admin',
    isMember: effectiveRole === 'member' || effectiveRole === 'admin',
    isBanned: effectiveRole === 'banned',
    actualIsAdmin,
    viewMode,
    setViewMode
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
