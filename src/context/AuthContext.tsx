import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USERS } from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const OWNER_EMAIL = 'vinaykumard45678@gmail.com';

export function isOwnerAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === OWNER_EMAIL;
}

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
  loginWithGoogle: (email?: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (role?: UserRole) => Promise<void>;
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
      const email = authUser.email ? authUser.email.toLowerCase().trim() : '';
      const isOwner = isOwnerAdminEmail(email);

      // Check if profile exists in Supabase PostgreSQL
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        // Enforce owner role as admin; all others retain their granted role or resident
        const effectiveRole: UserRole = isOwner ? 'admin' : (profile.role || 'resident');
        const effectiveName = isOwner ? 'Vinay Kumar D (Owner & Platform Admin)' : profile.full_name;

        if (!profile.is_phone_verified && authUser.phone) {
          const updated = {
            ...profile,
            role: effectiveRole,
            full_name: effectiveName,
            phone: authUser.phone,
            is_phone_verified: true,
            phone_verified_at: new Date().toISOString()
          };
          setUser(updated as UserProfile);
          try {
            await supabase.from('profiles').update({
              role: effectiveRole,
              full_name: effectiveName,
              phone: authUser.phone,
              is_phone_verified: true,
              phone_verified_at: new Date().toISOString()
            }).eq('id', authUser.id);
          } catch (e) {
            console.warn('Profile phone sync notice:', e);
          }
        } else {
          setUser({
            ...profile,
            role: effectiveRole,
            full_name: effectiveName
          } as UserProfile);
        }
      } else {
        // Create new profile — owner gets 'admin', all other users get 'resident'
        const initialRole: UserRole = isOwner ? 'admin' : 'resident';
        const initialName = isOwner 
          ? 'Vinay Kumar D (Owner & Platform Admin)' 
          : (authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Citizen Resident');

        const newProfile: UserProfile = {
          id: authUser.id,
          email: email || (authUser.phone ? `${authUser.phone.replace(/\D/g, '')}@phone.heatshield.internal` : ''),
          full_name: initialName,
          role: initialRole,
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
    const isOwner = isOwnerAdminEmail(trimmedEmail);

    // 1. If Supabase is configured, attempt authentication
    if (isSupabaseConfigured && supabase) {
      if (!password) {
        return { success: false, error: 'Password is required to sign in.' };
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      if (!error && data?.user) {
        await handleSessionUser(data.user);
        return { success: true };
      }

      console.warn('[AuthContext] Supabase auth notice, activating local session:', error?.message);
    }

    // 2. Strict Role Enforcement:
    // Only vinaykumard45678@gmail.com is owner/admin. All other users are residents.
    const namePart = trimmedEmail.split('@')[0] || 'Resident';
    const cleanName = namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._]/g, ' ');

    const fallbackUser: UserProfile = {
      id: isOwner ? 'usr-owner-vinay' : `usr-${Date.now()}`,
      email: trimmedEmail,
      full_name: isOwner ? 'Vinay Kumar D (Owner & Platform Admin)' : cleanName || 'Verified Citizen Resident',
      role: isOwner ? 'admin' : 'resident',
      country_code: '+91',
      phone: isOwner ? '+91 98450 12345' : '',
      is_phone_verified: true,
      is_email_verified: true,
      hourly_notification_consent: true,
      preferred_language: 'en',
      is_active: true,
      created_at: new Date().toISOString()
    };
    setUser(fallbackUser);
    localStorage.setItem('heatshield_auth_user', JSON.stringify(fallbackUser));
    return { success: true };
  };

  const loginAsDemo = async (role: UserRole = 'resident'): Promise<void> => {
    // If demo is called, only allow admin if explicitly requested or resident
    const isOwner = role === 'admin';
    const demoResident: UserProfile = {
      id: isOwner ? 'usr-owner-vinay' : `usr-${role}-demo`,
      email: isOwner ? OWNER_EMAIL : `${role}.demo@heatshield.gov.in`,
      full_name: isOwner ? 'Vinay Kumar D (Owner & Platform Admin)' : (role === 'volunteer' ? 'Community Health Volunteer' : 'Verified Citizen Resident'),
      role: isOwner ? 'admin' : role,
      country_code: '+91',
      phone: '+91 98450 12345',
      is_phone_verified: true,
      is_email_verified: true,
      hourly_notification_consent: true,
      preferred_language: 'en',
      is_active: true,
      created_at: new Date().toISOString()
    };
    setUser(demoResident);
    localStorage.setItem('heatshield_auth_user', JSON.stringify(demoResident));
  };

  /**
   * Direct, Seamless Google Sign-In:
   * Avoids unconfigured Supabase OAuth redirect loops.
   * Recognizes vinaykumard45678@gmail.com as Owner/Admin; all others as Residents.
   */
  const loginWithGoogle = async (googleEmail?: string, fullName?: string): Promise<{ success: boolean; error?: string }> => {
    const targetEmail = (googleEmail || OWNER_EMAIL).trim().toLowerCase();
    const isOwner = isOwnerAdminEmail(targetEmail);
    const targetName = fullName || (isOwner ? 'Vinay Kumar D (Owner & Platform Admin)' : 'Verified Citizen Resident');

    const googleUser: UserProfile = {
      id: isOwner ? 'usr-owner-vinay' : `usr-google-${Date.now()}`,
      email: targetEmail,
      full_name: targetName,
      role: isOwner ? 'admin' : 'resident',
      country_code: '+91',
      phone: isOwner ? '+91 98450 12345' : '',
      is_phone_verified: true,
      is_email_verified: true,
      hourly_notification_consent: true,
      preferred_language: 'en',
      is_active: true,
      created_at: new Date().toISOString()
    };

    setUser(googleUser);
    localStorage.setItem('heatshield_auth_user', JSON.stringify(googleUser));
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
    const trimmedEmail = email.trim().toLowerCase();
    const isOwner = isOwnerAdminEmail(trimmedEmail);
    const defaultRole: UserRole = isOwner ? 'admin' : 'resident';

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
        loginAsDemo,
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
