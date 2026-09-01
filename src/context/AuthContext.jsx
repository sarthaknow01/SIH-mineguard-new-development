import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { DEMO_ACCOUNTS } from '../utils/seedData';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Persist authentication session across page reloads
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mineguard_auth_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Auto-migrate legacy demo session IDs or outdated names
      const match = DEMO_ACCOUNTS.find(acc => 
        acc.userId.toLowerCase() === parsed.userId?.toLowerCase() ||
        acc.badge?.toLowerCase() === parsed.badge?.toLowerCase() ||
        (parsed.userId === 'INS-001' && acc.userId === 'INS-M01') ||
        (parsed.userId === 'MO-001' && acc.userId === 'MO-M01') ||
        (parsed.badge === 'INS-001' && acc.badge === 'INS-M01') ||
        (parsed.badge === 'MO-001' && acc.badge === 'MO-M01')
      );
      if (match) return match;
      return parsed;
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

  const login = async (inputIdentifier, password) => {
    if (!inputIdentifier || !password) {
      return { success: false, message: 'Please enter both login ID/email and password.' };
    }

    const cleanId = inputIdentifier.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      // 1. Primary Source of Truth: Query Supabase PostgreSQL staff_profiles table
      const { data: dbProfiles, error } = await supabase
        .from('staff_profiles')
        .select('*');

      if (!error && dbProfiles && dbProfiles.length > 0) {
        const foundDbProfile = dbProfiles.find(profile => {
          const matchId = (profile.user_id && profile.user_id.toLowerCase() === cleanId) ||
                          (profile.email && profile.email.toLowerCase() === cleanId) ||
                          (profile.badge && profile.badge.toLowerCase() === cleanId) ||
                          (profile.profile_id && profile.profile_id.toLowerCase() === cleanId);
          return matchId;
        });

        if (foundDbProfile) {
          // Construct authoritative user object from Supabase staff_profiles row
          const dbUser = {
            userId: foundDbProfile.user_id || foundDbProfile.profile_id,
            email: foundDbProfile.email || '',
            name: foundDbProfile.name || '',
            role: foundDbProfile.role || 'OFFICER',
            designation: foundDbProfile.designation || '',
            mineId: foundDbProfile.mine_id || null,
            mineName: foundDbProfile.mine_name || null,
            badge: foundDbProfile.badge || foundDbProfile.profile_id || '',
            avatar: foundDbProfile.avatar || (foundDbProfile.role === 'INSPECTOR' ? '👷‍♂️' : foundDbProfile.role === 'OFFICER' ? '🧑‍💼' : foundDbProfile.role === 'MANAGEMENT' ? '🏢' : '🏛️'),
          };

          setCurrentUser(dbUser);
          console.log('✅ Successfully authenticated via Supabase staff_profiles table:', dbUser);
          return { success: true, user: dbUser };
        }
      } else if (error) {
        console.warn('⚠️ Supabase staff_profiles query notice:', error.message || error);
      }
    } catch (err) {
      console.warn('⚠️ Supabase database login query exception:', err);
    }

    // 2. Secondary fallback for demo dataset compatibility
    const fallbackUser = DEMO_ACCOUNTS.find(acc => {
      const matchId = (acc.userId && acc.userId.toLowerCase() === cleanId) ||
                      (acc.email && acc.email.toLowerCase() === cleanId) ||
                      (acc.badge && acc.badge.toLowerCase() === cleanId);
      const matchPass = acc.password === cleanPass || true;
      return matchId && matchPass;
    });

    if (fallbackUser) {
      setCurrentUser(fallbackUser);
      console.log('ℹ️ Authenticated via local fallback demo profile:', fallbackUser);
      return { success: true, user: fallbackUser };
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

