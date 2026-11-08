import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USERS } from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  // Unauthenticated by default; sessions are verified on mount
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync valid user to localStorage only after initial session check completes
  useEffect(() => {
    if (isLoading) return;

    if (user) {
      localStorage.setItem('heatshield_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('heatshield_auth_user');
    }
  }, [user, isLoading]);

  // Supabase OAuth and Session Subscription
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!mounted) return;

          if (error || !session?.user) {
            setUser(null);
            localStorage.removeItem('heatshield_auth_user');
          } else {
            await handleSessionUser(session.user);
          }
        } catch (e) {
          console.warn('Session verification notice:', e);
          if (mounted) {
            setUser(null);
            localStorage.removeItem('heatshield_auth_user');
          }
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      } else {
        // Local / Resilient Mode: Only restore if a valid real session was stored
        try {
          const saved = localStorage.getItem('heatshield_auth_user');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.id && parsed.email) {
              setUser(parsed);
            } else {
              setUser(null);
              localStorage.removeItem('heatshield_auth_user');
            }
          } else {
            setUser(null);
          }
        } catch (e) {
          setUser(null);
          localStorage.removeItem('heatshield_auth_user');
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    }

    initSession();

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        if (session?.user) {
          await handleSessionUser(session.user);
        } else if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          localStorage.removeItem('heatshield_auth_user');
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
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
        if (!profile.is_phone_verified && authUser.phone) {
          const updated = {
            ...profile,
            phone: authUser.phone,
            is_phone_verified: true,
            phone_verified_at: new Date().toISOString()
          };
          setUser(updated as UserProfile);
          try {
            await supabase.from('profiles').update({
              phone: authUser.phone,
              is_phone_verified: true,
              phone_verified_at: new Date().toISOString()
            }).eq('id', authUser.id);
          } catch (e) {
            console.warn('Profile phone sync notice:', e);
          }
        } else {
          setUser(profile as UserProfile);
        }
      } else {
        // Create new profile with default role 'resident'
        const newProfile: UserProfile = {
          id: authUser.id,
          email: authUser.email || (authUser.phone ? `${authUser.phone.replace(/\D/g, '')}@phone.heatshield.internal` : ''),
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Citizen Resident',
          role: 'resident',
          phone: authUser.phone || authUser.user_metadata?.phone || '',
          country_code: authUser.user_metadata?.country_code || '+91',
          is_phone_verified: Boolean(authUser.phone || authUser.user_metadata?.is_phone_verified),
          phone_verified_at: authUser.phone ? new Date().toISOString() : undefined,
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
    const trimmedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      if (!password) {
        return { success: false, error: 'Password is required to sign in.' };
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
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

    // Local / Resilient Mode (Supabase not configured):
    // Authenticate against locally registered accounts without falling back to mock resident
    try {
      const savedProfiles = JSON.parse(localStorage.getItem('heatshield_registered_profiles') || '{}');
      const matchedRecord = savedProfiles[trimmedEmail];

      if (!matchedRecord) {
        return { 
          success: false, 
          error: 'No account found with this email. Please register first or verify your email.' 
        };
      }

      if (matchedRecord.password && password && matchedRecord.password !== password) {
        return {
          success: false,
          error: 'Incorrect password. Please try again.'
        };
      }

      const { password: _, ...userProfile } = matchedRecord;
      setUser(userProfile as UserProfile);
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Login failed. Please check credentials and try again.' };
    }
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
    const trimmedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
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
      if (data.session?.user) {
        await handleSessionUser(data.session.user);
      }
      return { 
        success: true, 
        requiresEmailConfirmation 
      };
    }

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: trimmedEmail,
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

    // Save profile and credentials
    try {
      const savedProfiles = JSON.parse(localStorage.getItem('heatshield_registered_profiles') || '{}');
      savedProfiles[trimmedEmail] = {
        ...newUser,
        password
      };
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
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Supabase signOut notice:', e);
    } finally {
      setUser(null);
      localStorage.removeItem('heatshield_auth_user');
    }
  };

  const role: UserRole = user?.role || 'resident';
  const isAdmin = role === 'admin';
  const isVolunteer = role === 'volunteer' || role === 'admin';
  const isResident = role === 'resident';
  const needsPhoneVerification = false;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
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
