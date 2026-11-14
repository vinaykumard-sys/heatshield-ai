import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
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
  loginAsDemoResident: () => Promise<void>;
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
  // Unauthenticated by default; sessions verified strictly on mount
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync valid authenticated user session to secure localStorage
  useEffect(() => {
    if (isLoading) return;

    if (user) {
      localStorage.setItem('heatshield_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('heatshield_auth_user');
    }
  }, [user, isLoading]);

  // Supabase Session Subscription & Lifecycle
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
        // Unconfigured mode: Check for existing session
        try {
          const saved = localStorage.getItem('heatshield_auth_user');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.id && parsed.email) {
              // Ensure no local tampered admin role
              setUser({
                ...parsed,
                role: parsed.role === 'admin' ? 'resident' : parsed.role, // Never allow unverified offline admin
              });
            } else {
              setUser(null);
              localStorage.removeItem('heatshield_auth_user');
            }
          } else {
            setUser(null);
          }
        } catch {
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

  /**
   * Strictly reads user role from Supabase database `profiles` table.
   * A user is ONLY an admin if the database explicitly grants role === 'admin'.
   */
  const handleSessionUser = async (authUser: any) => {
    if (!supabase) return;
    try {
      const email = authUser.email ? authUser.email.toLowerCase().trim() : '';

      // Check if profile exists in Supabase PostgreSQL by user ID, or fallback by verified email
      let profile: any = null;
      const { data: profileById, error: idError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileById && !idError) {
        profile = profileById;
      } else if (email) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        if (profileByEmail) {
          profile = profileByEmail;
          // Synchronize profile ID if it differed due to provider link
          if (profile.id !== authUser.id) {
            try {
              await supabase
                .from('profiles')
                .update({ id: authUser.id, updated_at: new Date().toISOString() })
                .eq('email', email);
              profile.id = authUser.id;
            } catch (syncErr) {
              console.warn('Profile ID synchronization note:', syncErr);
            }
          }
        }
      }

      if (profile) {
        // Enforce role strictly from Supabase DB record
        const dbRole: UserRole = profile.role === 'admin' 
          ? 'admin' 
          : (profile.role === 'volunteer' ? 'volunteer' : 'resident');

        const profileData: UserProfile = {
          ...profile,
          role: dbRole,
          email: profile.email || email,
          full_name: profile.full_name || authUser.user_metadata?.full_name || 'Citizen Resident',
        };

        setUser(profileData);
      } else {
        // New user profile: Defaults strictly to 'resident'
        const initialRole: UserRole = 'resident';
        const initialName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Citizen Resident';

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

  /**
   * Genuine Supabase password authentication
   */
  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!password) {
      return { success: false, error: 'Password is required to sign in.' };
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data?.user) {
        await handleSessionUser(data.user);
        return { success: true };
      }
      return { success: false, error: 'User account not found.' };
    }

    // Offline / Demo verification for resident only
    return { success: false, error: 'Supabase authentication service unavailable. Check network connection.' };
  };

  /**
   * Safe Guest Resident Demo Access (STRICTLY resident role only)
   */
  const loginAsDemoResident = async (): Promise<void> => {
    const demoResident: UserProfile = {
      id: `usr-resident-demo-${Date.now()}`,
      email: 'citizen.resident@heatshield.gov.in',
      full_name: 'Verified Citizen Resident',
      role: 'resident', // Strictly resident
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
   * Google Sign-In via Supabase OAuth with dedicated callback handler
   */
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const callbackUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'https://heatshield-ai-eight.vercel.app/auth/callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    }

    return { 
      success: false, 
      error: 'Google OAuth requires active Supabase authentication configuration.' 
    };
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
    const defaultRole: UserRole = 'resident'; // Always defaults to resident

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

    return { success: false, error: 'Database authentication service not available.' };
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/auth?mode=reset`
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    }
    return { success: true };
  };

  const markPhoneVerified = (verifiedAt: string) => {
    if (!user) return;
    const updated = {
      ...user,
      is_phone_verified: true,
      phone_verified_at: verifiedAt
    };
    setUser(updated);
    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').update({
        is_phone_verified: true,
        phone_verified_at: verifiedAt
      }).eq('id', user.id).then();
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    // Security: Prevent users from self-promoting to admin via client profile updates
    const safeUpdates = { ...updates };
    delete (safeUpdates as any).role; // Strip role updates from client!

    const updated = { ...user, ...safeUpdates };
    setUser(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').update(safeUpdates).eq('id', user.id);
      } catch (e) {
        console.warn('Profile update notice:', e);
      }
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Logout notice:', e);
      }
    }
    setUser(null);
    localStorage.removeItem('heatshield_auth_user');
  };

  // Strictly enforce role checks
  const role: UserRole = user?.role || 'resident';
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isVolunteer = user?.role === 'volunteer';
  const isResident = user?.role === 'resident' || (!isAdmin && !isVolunteer);
  const needsPhoneVerification = isAuthenticated && !user.is_phone_verified;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        isAdmin,
        isVolunteer,
        isResident,
        needsPhoneVerification,
        login,
        loginWithGoogle,
        loginAsDemoResident,
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
