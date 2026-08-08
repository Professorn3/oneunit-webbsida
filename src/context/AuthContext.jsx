import { createContext, useContext, useEffect, useState } from 'react';
import pb from '../pocketbase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(pb.authStore.record);
  const [userData, setUserData] = useState(pb.authStore.record);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('admin'); // 'admin' | 'member' | 'guest'

  useEffect(() => {
    // Initial fetch to make sure the token is valid
    if (pb.authStore.isValid) {
      pb.collection('users').authRefresh().then((authData) => {
        setCurrentUser(authData.record);
        setUserData(authData.record);
        setLoading(false);
      }).catch(() => {
        pb.authStore.clear();
        setCurrentUser(null);
        setUserData(null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    // Listen for auth changes
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setCurrentUser(model);
      setUserData(model);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Presence tracking
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const updatePresence = async () => {
      try {
        await pb.collection('users').update(currentUser.id, { onlineAt: new Date().toISOString() });
      } catch (err) {
        // Ignorera fel, t.ex. om användaren är offline tillfälligt
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 60000); // Varje minut
    
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const actualIsAdmin = userData?.role === 'admin';

  // Om användaren faktiskt är admin och väljer att byta vy (medlem / gäst)
  const effectiveRole = userData?.isBanned ? 'banned'
                      : actualIsAdmin && viewMode === 'member' ? 'member'
                      : actualIsAdmin && viewMode === 'guest' ? 'guest'
                      : userData?.role || 'guest';

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
