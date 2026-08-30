import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_ACCOUNTS } from '../utils/seedData';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Persist authentication session across page reloads
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mineguard_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mineguard_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mineguard_auth_user');
      localStorage.removeItem('mineguard_current_tab');
    }
  }, [currentUser]);

  const login = (inputIdentifier, password) => {
    if (!inputIdentifier || !password) {
      return { success: false, message: 'Please enter both login ID/email and password.' };
    }

    const cleanId = inputIdentifier.trim().toLowerCase();
    const cleanPass = password.trim();

    const found = DEMO_ACCOUNTS.find(acc => {
      const matchId = (acc.userId && acc.userId.toLowerCase() === cleanId) ||
                      (acc.email && acc.email.toLowerCase() === cleanId) ||
                      (acc.badge && acc.badge.toLowerCase() === cleanId);
      const matchPass = acc.password === cleanPass;
      return matchId && matchPass;
    });

    if (found) {
      setCurrentUser(found);
      return { success: true, user: found };
    }

    return { success: false, message: 'Invalid credentials. Check user ID / email and password.' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mineguard_auth_user');
    localStorage.removeItem('mineguard_current_tab');
    window.location.hash = '';
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
