import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, phone: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUserStatus = async (userId: string, status: 'online' | 'offline') => {
      try {
        const userRef = doc(db!, 'users', userId);
        await updateDoc(userRef, {
            status: status,
            lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error("Failed to update user status:", error);
      }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('kaichat-user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      updateUserStatus(parsedUser.id, 'online');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // This handles user leaving the page
    const handleBeforeUnload = () => {
      if (user) {
        // This is a best-effort attempt. Most modern browsers will not guarantee
        // the completion of this async request on page unload.
        updateUserStatus(user.id, 'offline');
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  const login = async (username: string, phone: string): Promise<string> => {
    const usersRef = collection(db!, 'users');
    const q = query(usersRef, where('username', '==', username), where('phone', '==', phone));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Invalid username or phone number.');
    }
    
    const userData = querySnapshot.docs[0].data() as Omit<User, 'id'>;
    
    if (!userData.verified) {
      throw new Error('Your account is pending admin approval.');
    }

    const loggedInUser: User = { id: querySnapshot.docs[0].id, ...userData };
    setUser(loggedInUser);
    localStorage.setItem('kaichat-user', JSON.stringify(loggedInUser));
    await updateUserStatus(loggedInUser.id, 'online');
    return 'Login successful!';
  };

  const logout = async () => {
    if(user) {
        await updateUserStatus(user.id, 'offline');
    }
    setUser(null);
    localStorage.removeItem('kaichat-user');
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};