import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USERS } from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVolunteer: boolean;
  isResident: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoUser: (role: UserRole) => void;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Unauthenticated by default unless restored from localStorage
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('heatshield_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('heatshield_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('heatshield_auth_user');
    }
  }, [user]);

  // Supabase OAuth and Session Subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const client = supabase;

    // Restore existing session on mount
    client.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await handleSessionUser(session.user);
      }
    });

    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await handleSessionUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSessionUser = async (authUser: any) => {
    if (!supabase) return;
    try {
      // Check if profile exists in Supabase PostgreSQL
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser(profile as UserProfile);
      } else {
        // Create new profile with default role 'resident'
        const newProfile: UserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Community Member',
          role: 'resident',
          preferred_language: 'en',
          is_active: true,
          created_at: new Date().toISOString()
        };

        try {
          await supabase.from('profiles').insert(newProfile);
        } catch (e) {
          console.warn('Profile table insert warning:', e);
        }
        setUser(newProfile);
      }
    } catch (e) {
      console.error('Error synchronizing profile:', e);
    }
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase && password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    }

    // In local demo test mode, match pre-seeded user or create a resident session
    const match = INITIAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
      id: `usr-${Date.now()}`,
      email,
      full_name: email.split('@')[0].replace('.', ' '),
      role: 'resident' as UserRole,
      preferred_language: 'en' as const,
      is_active: true,
      created_at: new Date().toISOString()
    };

    setUser(match);
    return { success: true };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    // Resilient fallback in demo/local development
    const googleUser: UserProfile = {
      id: `usr-google-${Date.now()}`,
      email: 'citizen.resident@gmail.com',
      full_name: 'Verified Citizen Resident',
      role: 'resident',
      preferred_language: 'en',
      is_active: true,
      created_at: new Date().toISOString()
    };
    setUser(googleUser);
    return { success: true };
  };

  const signup = async (
    email: string, 
    password: string, 
    fullName: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Default role is ALWAYS 'resident' per security requirements
    const defaultRole: UserRole = 'resident';

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: defaultRole
          }
        }
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    }

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name: fullName,
      role: defaultRole,
      preferred_language: 'en',
      is_active: true,
      created_at: new Date().toISOString()
    };

    setUser(newUser);
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  // Internal test helper (e.g. for developer verification)
  const switchDemoUser = (targetRole: UserRole) => {
    const demo = INITIAL_USERS.find(u => u.role === targetRole) || INITIAL_USERS[0];
    setUser(demo);
  };

  const role: UserRole = user?.role || 'resident';
  const isAdmin = role === 'admin';
  const isVolunteer = role === 'volunteer' || role === 'admin';
  const isResident = role === 'resident';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isAdmin,
        isVolunteer,
        isResident,
        login,
        loginWithGoogle,
        signup,
        logout,
        switchDemoUser,
        isConfigured: isSupabaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
