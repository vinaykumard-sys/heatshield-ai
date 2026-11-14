import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [suggestPasswordLogin, setSuggestPasswordLogin] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function processAuthCallback() {
      // If already authenticated with a valid session, navigate straight to dashboard
      if (isAuthenticated && user) {
        if (isMounted) {
          setStatus('success');
          setTimeout(() => navigate('/dashboard', { replace: true }), 400);
        }
        return;
      }

      try {
        // Parse parameters from both query string and hash fragment
        const searchParams = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.startsWith('#') ? location.hash.slice(1) : location.hash);

        const error = searchParams.get('error') || hashParams.get('error');
        const errorCode = searchParams.get('error_code') || hashParams.get('error_code');
        const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');
        const code = searchParams.get('code');

        // Handle error returned from OAuth provider or Supabase
        if (error) {
          console.warn('[HeatShield OAuth] Provider reported callback error:', { error, errorCode, errorDesc });
          if (!isMounted) return;

          setStatus('error');
          const decodedDesc = errorDesc ? decodeURIComponent(errorDesc).replace(/\+/g, ' ') : '';

          if (
            decodedDesc.toLowerCase().includes('already exists') ||
            decodedDesc.toLowerCase().includes('identity') ||
            decodedDesc.toLowerCase().includes('link') ||
            errorCode === 'identity_conflict'
          ) {
            setSuggestPasswordLogin(true);
            setErrorMessage('Account Already Registered');
            setErrorDetails(
              'An account with this email address was previously created using a password. To protect your account, please sign in with your email and password.'
            );
          } else {
            setErrorMessage('Authentication Unsuccessful');
            setErrorDetails(decodedDesc || 'The authentication provider could not verify your identity. Please try again.');
          }
          return;
        }

        if (!isSupabaseConfigured || !supabase) {
          if (!isMounted) return;
          setStatus('error');
          setErrorMessage('Service Unavailable');
          setErrorDetails('Authentication services are currently unreachable. Please check your connection.');
          return;
        }

        // 1. If an authorization code is present in PKCE flow, exchange it
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.warn('[HeatShield OAuth] Code exchange note:', exchangeError.message);
            // Even if exchangeCodeForSession returned an error, verify if a session was already established
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user) {
              if (isMounted) {
                setStatus('success');
                setTimeout(() => navigate('/dashboard', { replace: true }), 400);
              }
              return;
            }

            if (!isMounted) return;
            setStatus('error');
            setErrorMessage('Authentication Link Expired');
            setErrorDetails('The verification code has expired or was already used. Please initiate sign in again.');
            return;
          }

          if (data?.session) {
            if (isMounted) {
              setStatus('success');
              setTimeout(() => navigate('/dashboard', { replace: true }), 400);
            }
            return;
          }
        }

        // 2. Poll/verify if session is established via onAuthStateChange / detectSessionInUrl
        const { data: sessionCheck } = await supabase.auth.getSession();
        if (sessionCheck?.session?.user) {
          if (isMounted) {
            setStatus('success');
            setTimeout(() => navigate('/dashboard', { replace: true }), 400);
          }
          return;
        }

        // 3. Fallback: wait briefly for supabase.auth listener
        const timeoutId = setTimeout(() => {
          if (isMounted && status === 'processing') {
            setStatus('error');
            setErrorMessage('Session Timeout');
            setErrorDetails('No active authentication session was detected. Please sign in to continue.');
          }
        }, 4000);

        return () => clearTimeout(timeoutId);
      } catch (err: any) {
        console.error('[HeatShield OAuth] Unexpected callback processing failure:', err);
        if (isMounted) {
          setStatus('error');
          setErrorMessage('System Authentication Error');
          setErrorDetails(err.message || 'An unexpected error occurred while finalizing sign in.');
        }
      }
    }

    processAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [location, navigate, isAuthenticated, user]);

  return (
    <div className="relative min-h-screen w-full bg-[#030712] overflow-x-hidden flex flex-col justify-between select-none">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Atmospheric Header */}
      <header className="relative z-20 w-full px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1E60F2] to-blue-500 text-white flex items-center justify-center font-bold shadow-[0_0_20px_rgba(30,96,242,0.5)] border border-blue-400/30">
            <Shield className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              HeatShield <span className="text-blue-400 text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-400/20">AI OS</span>
            </span>
            <span className="text-[10px] text-blue-200/60 block font-mono">Planetary Thermal Defense</span>
          </div>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl text-center"
        >
          {status === 'processing' && (
            <div className="space-y-6">
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <Shield className="w-7 h-7 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Verifying Credentials</h2>
                <p className="text-xs text-slate-400">
                  Securing connection with HeatShield AI Planetary Defense...
                </p>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full w-2/3 animate-pulse rounded-full" />
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Access Granted</h2>
                <p className="text-xs text-emerald-300">
                  Authentication established. Redirecting to your command dashboard...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6 text-left">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{errorMessage}</h2>
                <p className="text-xs text-slate-300 leading-relaxed">{errorDetails}</p>
              </div>

              <div className="pt-2 space-y-3">
                {suggestPasswordLogin ? (
                  <Link
                    to="/login"
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Sign In with Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Return to Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                <Link
                  to="/"
                  className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center justify-center transition-colors border border-white/5"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <footer className="relative z-20 py-6 text-center text-xs text-slate-500 font-mono">
        HEATSHIELD AI OS • SECURITY ARCHITECTURE v1.2.0 • ISO 27001 COMPLIANT
      </footer>
    </div>
  );
};
