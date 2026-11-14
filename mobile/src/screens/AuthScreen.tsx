import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../services/supabase';

// Completes any pending auth session when redirected back on web or native
WebBrowser.maybeCompleteAuthSession();

interface AuthScreenProps {
  onAuthSuccess?: (session: any) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    // Intercept OAuth deep link callback when app is running
    const subscription = Linking.addEventListener('url', (event) => {
      if (event.url) {
        processAuthUrl(event.url);
      }
    });

    // Intercept OAuth deep link callback on cold-start launch
    Linking.getInitialURL().then((url) => {
      if (url) {
        processAuthUrl(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const processAuthUrl = async (url: string) => {
    try {
      if (!url.includes('auth/callback') && !url.includes('code=') && !url.includes('access_token=')) {
        return;
      }

      const parsed = Linking.parse(url);

      // 1. Authorization code exchange (PKCE flow)
      const code = parsed.queryParams?.code as string | undefined;
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          // If exchangeCodeForSession failed, check if session is already active
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user) {
            if (onAuthSuccess) onAuthSuccess(sessionData.session);
            return;
          }
          setErrorMessage(error.message || 'Authentication session exchange failed.');
          return;
        }

        if (data?.session && onAuthSuccess) {
          onAuthSuccess(data.session);
          return;
        }
      }

      // 2. Direct tokens in query params or URL hash fragment
      let accessToken = parsed.queryParams?.access_token as string | undefined;
      let refreshToken = parsed.queryParams?.refresh_token as string | undefined;

      if (!accessToken && url.includes('#')) {
        const hashPart = url.substring(url.indexOf('#') + 1);
        const hashParams = new URLSearchParams(hashPart);
        accessToken = hashParams.get('access_token') || undefined;
        refreshToken = hashParams.get('refresh_token') || undefined;
      }

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setErrorMessage(error.message || 'Failed to establish authentication session.');
          return;
        }

        if (data?.session && onAuthSuccess) {
          onAuthSuccess(data.session);
          return;
        }
      }

      // 3. Fallback verification: check if active session exists
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user && onAuthSuccess) {
        onAuthSuccess(sessionData.session);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to parse authentication response.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setErrorMessage(null);
      setInfoMessage(null);

      // Create proper redirect URL
      const redirectUrl = 'https://heatshield-ai-eight.vercel.app/auth/callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Google sign-in could not be initiated.');
        return;
      }

      if (!data?.url) {
        setErrorMessage('Unable to initialize Google authentication endpoint.');
        return;
      }

      // If running inside Android WebView or web browser, navigate to the OAuth endpoint.
      // MainActivity.java will intercept external OAuth URLs and launch the system browser.
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = data.url;
        return;
      }

      // On native Expo, open external authentication session (Custom Tabs / System Browser)
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        await processAuthUrl(result.url);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google authentication encountered an unexpected error.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const validate = (): boolean => {
    setErrorMessage(null);
    setInfoMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return false;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return false;
    }

    return true;
  };

  const handleAuth = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      setInfoMessage(null);

      const trimmedEmail = email.trim();

      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          setErrorMessage(error.message || 'Authentication failed. Please check your credentials.');
          return;
        }

        if (data.session) {
          if (onAuthSuccess) {
            onAuthSuccess(data.session);
          }
        }
      } else {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

        if (error) {
          setErrorMessage(error.message || 'Account registration failed. Please try again.');
          return;
        }

        if (data.session) {
          if (onAuthSuccess) {
            onAuthSuccess(data.session);
          }
        } else if (data.user) {
          // If Supabase project requires email confirmation
          setInfoMessage(
            'Account created! Please check your email inbox to confirm your account, then sign in.'
          );
          setMode('signin');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="light" backgroundColor="#060D1E" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="shield-sun" size={48} color="#06B6D4" />
            </View>
            <Text style={styles.brandTitle}>HEATSHIELD AI</Text>
            <Text style={styles.brandTagline}>Urban Heat Safety & Defense</Text>
            <View style={styles.threatBadge}>
              <View style={styles.radarDot} />
              <Text style={styles.threatBadgeText}>HYPERLOCAL HEAT RESILIENCE SYSTEM</Text>
            </View>
          </View>

          {/* Auth Card */}
          <View style={styles.authCard}>
            {/* Toggle Sign In / Create Account */}
            <View style={styles.tabToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'signin' && styles.toggleBtnActive]}
                onPress={() => {
                  setMode('signin');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    mode === 'signin' && styles.toggleBtnTextActive,
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'signup' && styles.toggleBtnActive]}
                onPress={() => {
                  setMode('signup');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    mode === 'signup' && styles.toggleBtnTextActive,
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message Banner */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Info Message Banner */}
            {infoMessage && (
              <View style={styles.infoBox}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 8 }} />
                <Text style={styles.infoText}>{infoMessage}</Text>
              </View>
            )}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Official Email Address</Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="resident@heatshield.ai"
                  placeholderTextColor="#475569"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Security Password</Text>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordEyeBtn}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#060D1E" size="small" />
              ) : (
                <View style={styles.submitButtonInner}>
                  <Text style={styles.submitButtonText}>
                    {mode === 'signin' ? 'Sign In to HeatShield' : 'Create Protected Account'}
                  </Text>
                  <Feather name="arrow-right" size={18} color="#060D1E" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR SECURE ACCESS WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Native Google OAuth Button */}
            <TouchableOpacity
              style={[styles.googleButton, googleLoading && styles.submitButtonDisabled]}
              onPress={handleGoogleLogin}
              disabled={googleLoading || loading}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator color="#F8FAFC" size="small" />
              ) : (
                <View style={styles.googleButtonInner}>
                  <Ionicons name="logo-google" size={18} color="#EA4335" style={styles.googleIcon} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Instant Demo Access Button */}
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => {
                if (onAuthSuccess) {
                  onAuthSuccess({
                    user: {
                      id: 'usr-citizen-demo',
                      email: 'citizen.resident@heatshield.gov.in',
                      user_metadata: { full_name: 'Verified Citizen Resident' }
                    }
                  });
                }
              }}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={18} color="#34D399" />
              <Text style={styles.demoButtonText}>Quick Demo Access — Enter Dashboard</Text>
            </TouchableOpacity>

            {/* Helper Text */}
            <Text style={styles.legalSubtext}>
              {mode === 'signin'
                ? 'Sign in to access localized heat index radar, cooling corridors & SOS dispatch.'
                : 'Free civilian access under NDMA & Karnataka State Heat Action Plan protocols.'}
            </Text>
          </View>

          {/* Footer Security Badges */}
          <View style={styles.footerBadges}>
            <View style={styles.securityBadge}>
              <Feather name="shield" size={14} color="#10B981" style={{ marginRight: 6 }} />
              <Text style={styles.securityBadgeText}>Supabase Auth • 256-bit Encryption</Text>
            </View>
            <Text style={styles.footerDisclaimer}>
              HeatShield AI Mobile Client v1.1.0 • BBMP Incident Integration
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#060D1E',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logoCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1.5,
    borderColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 2,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#06B6D4',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  threatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  radarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  threatBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.8,
  },
  authCard: {
    backgroundColor: '#0B1329',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: '#060D1E',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#06B6D4',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  toggleBtnTextActive: {
    color: '#060D1E',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  infoText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#060D1E',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    paddingVertical: 12,
  },
  passwordEyeBtn: {
    padding: 6,
  },
  submitButton: {
    backgroundColor: '#06B6D4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#060D1E',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  legalSubtext: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginHorizontal: 10,
  },
  googleButton: {
    backgroundColor: '#0A1128',
    borderColor: '#1E293B',
    borderWidth: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  demoButton: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    flexDirection: 'row',
  },
  demoButtonText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  footerBadges: {
    alignItems: 'center',
    marginTop: 24,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  securityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  footerDisclaimer: {
    fontSize: 10,
    color: '#475569',
  },
});
