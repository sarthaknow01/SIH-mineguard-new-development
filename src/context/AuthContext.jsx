import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { DEMO_ACCOUNTS } from '../utils/seedData';

const AuthContext = createContext();

const LEGACY_ID_MAP = {
  'ins-001': 'ins-m01', 'ins-002': 'ins-m02', 'ins-003': 'ins-m03', 'ins-004': 'ins-m04', 'ins-005': 'ins-m05',
  'mo-001': 'mo-m01', 'mo-002': 'mo-m02', 'mo-003': 'mo-m03', 'mo-004': 'mo-m04', 'mo-005': 'mo-m05'
};

export function AuthProvider({ children }) {
  // Persist authentication session across page reloads
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mineguard_auth_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      
      // Auto-migrate legacy demo session IDs (e.g. INS-003 -> INS-M03)
      let parsedId = (parsed.userId || parsed.badge || '').toLowerCase();
      if (LEGACY_ID_MAP[parsedId]) {
        const mappedId = LEGACY_ID_MAP[parsedId].toUpperCase();
        parsed.userId = mappedId;
        parsed.badge = mappedId;
      }

      // Find matching account in canonical DEMO_ACCOUNTS
      const match = DEMO_ACCOUNTS.find(acc => 
        acc.userId.toLowerCase() === parsed.userId?.toLowerCase() ||
        acc.badge?.toLowerCase() === parsed.badge?.toLowerCase()
      );
      if (match) {
        // Enforce canonical name, badge, and userId from DEMO_ACCOUNTS to overwrite stale legacy local names
        return { ...parsed, ...match };
      }
      return parsed;
    } catch (e) {
      return null;
    }
  });

  // Sync active user profile with Supabase DB on mount, enforcing canonical name mapping
  useEffect(() => {
    async function syncUserProfile() {
      if (!currentUser?.userId && !currentUser?.badge) return;
      const targetId = (currentUser.userId || currentUser.badge).toLowerCase();
      
      // If current user matches a canonical demo profile, ensure state reflects canonical demo name
      const canonicalMatch = DEMO_ACCOUNTS.find(acc => 
        acc.userId.toLowerCase() === targetId || acc.badge?.toLowerCase() === targetId
      );
      if (canonicalMatch && currentUser.name !== canonicalMatch.name) {
        setCurrentUser(prev => ({ ...prev, ...canonicalMatch }));
        return;
      }

      try {
        const { data: dbProfiles, error } = await supabase
          .from('staff_profiles')
          .select('*');
        if (!error && dbProfiles && dbProfiles.length > 0) {
          const found = dbProfiles.find(p => 
            (p.user_id && p.user_id.toLowerCase() === targetId) ||
            (p.profile_id && p.profile_id.toLowerCase() === targetId) ||
            (p.badge && p.badge.toLowerCase() === targetId)
          );
          if (found && !canonicalMatch && (found.name !== currentUser.name || found.mine_name !== currentUser.mineName)) {
            console.log('🔄 Syncing updated user profile from Supabase DB:', found);
            setCurrentUser(prev => ({
              ...prev,
              name: found.name || prev.name,
              designation: found.designation || prev.designation,
              mineId: found.mine_id || prev.mineId,
              mineName: found.mine_name || prev.mineName,
              role: found.role || prev.role
            }));
          }
        }
      } catch (err) {
        // Silent catch for offline or uninitialized Supabase DB
      }
    }
    syncUserProfile();
  }, []);

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

    let cleanId = inputIdentifier.trim().toLowerCase();
    if (LEGACY_ID_MAP[cleanId]) {
      cleanId = LEGACY_ID_MAP[cleanId];
    }
    const cleanPass = password.trim();

    // 1. Primary Source of Truth: Canonical DEMO_ACCOUNTS list with strict password verification
    const demoMatch = DEMO_ACCOUNTS.find(acc => {
      const matchId = (acc.userId && acc.userId.toLowerCase() === cleanId) ||
                      (acc.email && acc.email.toLowerCase() === cleanId) ||
                      (acc.badge && acc.badge.toLowerCase() === cleanId);
      const matchPass = acc.password === cleanPass;
      return matchId && matchPass;
    });

    if (demoMatch) {
      setCurrentUser(demoMatch);
      console.log('✅ Authenticated via canonical demo profile:', demoMatch);
      return { success: true, user: demoMatch };
    }

    try {
      // 2. Query Supabase PostgreSQL staff_profiles table for custom profiles
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
          const expectedRolePass = foundDbProfile.role === 'INSPECTOR' ? 'Inspector@123' :
                                   foundDbProfile.role === 'OFFICER' ? 'Officer@123' :
                                   foundDbProfile.role === 'MANAGEMENT' ? 'Management@123' :
                                   'Authority@123';
          const isPassValid = foundDbProfile.password ? (foundDbProfile.password === cleanPass) : (cleanPass === expectedRolePass);

          if (!isPassValid) {
            return { success: false, message: 'Invalid password. Please enter the correct password for this account.' };
          }

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
      }
    } catch (err) {
      console.warn('⚠️ Supabase database login query exception:', err);
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

