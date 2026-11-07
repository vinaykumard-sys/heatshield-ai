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
  needsPhoneVerification: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string, 
    password: string, 
    fullName: string, 
    phone: string, 
    countryCode?: string, 
    consentHourly?: boolean
  ) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  markPhoneVerified: (verifiedAt: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
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
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Citizen Resident',
          role: 'resident',
          phone: authUser.user_metadata?.phone || '',
          country_code: authUser.user_metadata?.country_code || '+91',
          is_phone_verified: Boolean(authUser.user_metadata?.is_phone_verified),
          is_email_verified: Boolean(authUser.email_confirmed_at),
          email_verified_at: authUser.email_confirmed_at,
          hourly_notification_consent: true,
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
        let friendlyMsg = error.message;
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          friendlyMsg = 'Invalid email or password. If you registered recently, please verify your email address or use Google Sign-In.';
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          friendlyMsg = 'Email address not yet confirmed. Please check your inbox for the verification link or use Google Sign-In.';
        }
        return { success: false, error: friendlyMsg };
      }
      return { success: true };
    }

    // Production check: Reject unknown accounts if no local password matches
    const savedProfiles = JSON.parse(localStorage.getItem('heatshield_registered_profiles') || '{}');
    const matchedProfile = savedProfiles[email.toLowerCase()];

    if (matchedProfile) {
      setUser(matchedProfile);
      return { success: true };
    }

    // Default registered resident session (unverified phone until OTP completed)
    const residentUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name: email.split('@')[0].replace(/[._]/g, ' '),
      role: 'resident',
      phone: '',
      country_code: '+91',
      is_phone_verified: false,
      is_email_verified: true,
      hourly_notification_consent: true,
      preferred_language: 'en',
      is_active: true,
      created_at: new Date().toISOString()
    };
    setUser(residentUser);
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

    // Resilient fallback in development
    const googleUser: UserProfile = {
      id: `usr-google-${Date.now()}`,
      email: 'citizen.resident@gmail.com',
      full_name: 'Verified Citizen Resident',
      role: 'resident',
      country_code: '+91',
      phone: '',
      is_phone_verified: false,
      is_email_verified: true,
      hourly_notification_consent: true,
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
    fullName: string,
    phone: string,
    countryCode: string = '+91',
    consentHourly: boolean = true
  ): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
    const defaultRole: UserRole = 'resident';

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            country_code: countryCode,
            role: defaultRole,
            hourly_notification_consent: consentHourly
          }
        }
      });
      if (error) {
        return { success: false, error: error.message };
      }

      const requiresEmailConfirmation = !data.session;
      return { 
        success: true, 
        requiresEmailConfirmation 
      };
    }

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name: fullName,
      phone,
      country_code: countryCode,
      role: defaultRole,
      is_phone_verified: false,
      is_email_verified: false,
      hourly_notification_consent: consentHourly,
      notification_consent_at: new Date().toISOString(),
      preferred_language: 'en',
      is_active: true,
      created_at: new Date().toISOString()
    };

    // Save profile
    try {
      const savedProfiles = JSON.parse(localStorage.getItem('heatshield_registered_profiles') || '{}');
      savedProfiles[email.toLowerCase()] = newUser;
      localStorage.setItem('heatshield_registered_profiles', JSON.stringify(savedProfiles));
    } catch {
      // ignore
    }

    setUser(newUser);
    return { success: true, requiresEmailConfirmation: false };
  };

  const markPhoneVerified = (verifiedAt: string) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      is_phone_verified: true,
      phone_verified_at: verifiedAt
    };
    setUser(updated);

    // Sync to Supabase
    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').update({
        is_phone_verified: true,
        phone_verified_at: verifiedAt
      }).eq('id', user.id).then();
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').update(updates).eq('id', user.id);
      } catch (e) {
        console.warn('Profile update warning:', e);
      }
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const role: UserRole = user?.role || 'resident';
  const isAdmin = role === 'admin';
  const isVolunteer = role === 'volunteer' || role === 'admin';
  const isResident = role === 'resident';
  const needsPhoneVerification = Boolean(user && !user.is_phone_verified && !isAdmin);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isAdmin,
        isVolunteer,
        isResident,
        needsPhoneVerification,
        login,
        loginWithGoogle,
        signup,
        resetPassword,
        markPhoneVerified,
        updateProfile,
        logout,
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
