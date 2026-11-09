import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Phone,
  Sun,
  Droplets,
  HeartHandshake,
  Radio,
  Sparkles,
  ArrowLeft,
  Activity,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { ThermalGlobe3D } from '../components/3d/ThermalGlobe3D';

export const AuthPage: React.FC = () => {
  const { isAuthenticated, user, needsPhoneVerification, login, loginWithGoogle, loginAsDemo, signup, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(() => {
    return location.pathname === '/register' ? 'signup' : 'login';
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hourlyConsent, setHourlyConsent] = useState(true);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Cinematic 1.5-second login success state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [telemetryProgress, setTelemetryProgress] = useState(0);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // If already authenticated and not currently playing the transition, redirect immediately
  useEffect(() => {
    if (isAuthenticated && !isTransitioning) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isTransitioning, navigate, from]);

  /**
   * Triggers the 1.5-second cinematic zoom transition toward the Earth
   * Respects prefers-reduced-motion for accessibility
   */
  const handleAuthSuccess = useCallback(() => {
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      navigate(from, { replace: true });
      return;
    }

    setIsTransitioning(true);

    // Progress counter for cinematic HUD
    const interval = setInterval(() => {
      setTelemetryProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 70);

    setTimeout(() => {
      clearInterval(interval);
      navigate(from, { replace: true });
    }, 1500);
  }, [from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'signup') {
      if (password.length < 8) {
        setErrorMsg('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (!termsAccepted) {
        setErrorMsg('Please acknowledge and accept the Terms of Service and Privacy Policy.');
        return;
      }
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        setErrorMsg('Please enter a valid mobile phone number for heat alerts.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Invalid email or password.');
        } else {
          handleAuthSuccess();
        }
      } else if (mode === 'signup') {
        const fullPhone = `${countryCode} ${phoneNumber.trim()}`;
        const res = await signup(email, password, fullName, fullPhone, countryCode, hourlyConsent);
        if (!res.success) {
          setErrorMsg(res.error || 'Registration failed.');
        } else if (res.requiresEmailConfirmation) {
          setSuccessMsg(`Account created for ${email}! A confirmation link has been sent to your email. Please check your inbox.`);
        } else {
          handleAuthSuccess();
        }
      } else if (mode === 'forgot') {
        const res = await resetPassword(email);
        if (!res.success) {
          setErrorMsg(res.error || 'Could not send reset link. Please check the email address.');
        } else {
          setSuccessMsg('Password reset instructions sent! Check your inbox for the recovery link.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);
    setIsSubmitting(true);
    try {
      const res = await loginWithGoogle();
      if (!isSupabaseConfigured) {
        handleAuthSuccess();
      } else if (!res.success) {
        setErrorMsg(res.error || 'Google authentication encountered an issue.');
      } else {
        handleAuthSuccess();
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Google authentication error.');
    } finally {
      setIsGoogleLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030712] overflow-x-hidden flex flex-col justify-between select-none">
      {/* ── 3D Full-Screen Thermal Climate Environment ─────────────── */}
      <ThermalGlobe3D isTransitioning={isTransitioning} />

      {/* ── Top Atmospheric Navigation Header ──────────────────────── */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-5 flex items-center justify-between">
        <Link 
          to="/"
          className="flex items-center gap-3 group transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
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

        {/* Live Satellite Status Pill */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-white font-medium">INSAT-3DR / METEOMESH</span>
            <span className="text-blue-400">ONLINE</span>
          </div>

          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Site</span>
          </Link>
        </div>
      </header>

      {/* ── Main Floating Auth Container ───────────────────────────── */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={
              isTransitioning
                ? { 
                    opacity: 0, 
                    y: -30, 
                    scale: 0.92, 
                    filter: 'blur(12px)',
                    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } 
                  }
                : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
            }
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="rounded-[28px] overflow-hidden border border-white/15 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.7),0_0_40px_rgba(30,96,242,0.15)] bg-slate-900/75 backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[620px]"
          >
            
            {/* ── Left Column: HeatShield Climate Telemetry ──────────── */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#1E60F2]/90 via-blue-800/85 to-slate-900/95 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10">
              
              {/* Radial ambient glow in card corner */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

              <div className="space-y-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold border border-white/20 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>NDMA Heat Action Plan Certified</span>
                </div>

                <div className="space-y-2.5">
                  <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-black tracking-tight text-white leading-tight">
                    Intelligent Heat Defense System.
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
                    Real-time surface temperature intelligence, urban heat island tracking, cool corridor routing, and life-saving community hydration points.
                  </p>
                </div>

                {/* Live Heat Matrix Widget */}
                <div className="p-4 rounded-2xl bg-black/25 backdrop-blur-md border border-white/15 space-y-3.5">
                  <div className="flex items-center justify-between text-xs text-blue-200">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      Live Network Readout
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                      GRID OPTIMAL
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                      <Sun className="w-4 h-4 mx-auto mb-1 text-amber-300" />
                      <span className="text-[10px] block text-blue-200/80">Heat Alerts</span>
                      <strong className="text-white text-xs font-bold font-mono">Under 30s</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                      <Droplets className="w-4 h-4 mx-auto mb-1 text-cyan-300" />
                      <span className="text-[10px] block text-blue-200/80">Water Hubs</span>
                      <strong className="text-white text-xs font-bold font-mono">1,420+</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                      <HeartHandshake className="w-4 h-4 mx-auto mb-1 text-emerald-300" />
                      <span className="text-[10px] block text-blue-200/80">Safe Corridors</span>
                      <strong className="text-white text-xs font-bold font-mono">Active</strong>
                    </div>
                  </div>
                </div>

                {/* 3D Earth Parallax Hint */}
                <div className="hidden lg:flex items-center gap-2 text-[11px] text-blue-200/70 font-mono">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3D Satellite Parallax Active • Move cursor to inspect</span>
                </div>
              </div>

              <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-blue-200/80">
                <span>Aligned with NDMA Guidelines</span>
                <span className="font-mono text-[10px] text-cyan-300">v2.4.0 CLIMATE-AI</span>
              </div>
            </div>

            {/* ── Right Column: Interactive Authentication Forms ──────── */}
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white dark:bg-slate-900/95">
              <div className="max-w-md w-full mx-auto space-y-5">
                
                {/* Mode Selector Tabs (Sign In vs Create Account) */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800/70 rounded-2xl gap-1 border border-slate-200/80 dark:border-slate-700/60 shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                      mode === 'login'
                        ? 'bg-white dark:bg-slate-900 text-[#1E60F2] shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-none dark:border dark:border-blue-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg('');
                    }}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                      mode === 'signup'
                        ? 'bg-white dark:bg-slate-900 text-[#1E60F2] shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-none dark:border dark:border-blue-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Create Account</span>
                  </button>
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {mode === 'login' ? 'Sign in to HeatShield' : mode === 'signup' ? 'Create Resident Account' : 'Reset Password'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {mode === 'login' 
                      ? 'Access real-time local heat risk, alerts, and emergency support.'
                      : mode === 'signup'
                      ? 'Register to receive localized heatwave advisories and hydration points.'
                      : 'Enter your registered email address to receive password recovery instructions.'}
                  </p>
                </div>

                {/* Quick Instant Citizen & Role Access */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSubmitting(true);
                      await loginAsDemo('resident');
                      handleAuthSuccess();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 border border-emerald-400/30 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Instant Access — Enter Citizen Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* 1-Tap Role Selector for testing all profiles */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsSubmitting(true);
                        await loginAsDemo('resident');
                        handleAuthSuccess();
                      }}
                      className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors text-center"
                    >
                      🧑 Citizen
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setIsSubmitting(true);
                        await loginAsDemo('admin');
                        handleAuthSuccess();
                      }}
                      className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors text-center"
                    >
                      🛡️ Official
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setIsSubmitting(true);
                        await loginAsDemo('volunteer');
                        handleAuthSuccess();
                      }}
                      className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors text-center"
                    >
                      🤝 Volunteer
                    </button>
                  </div>
                </div>

                {/* Google Sign-In Quick Action */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting || isGoogleLoading}
                    className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    {isGoogleLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#1E60F2] border-t-transparent rounded-full animate-spin" />
                        <span className="text-slate-500 dark:text-slate-400">Authenticating...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Sign in with Google</span>
                      </>
                    )}
                  </button>

                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                    <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                      or continue with email
                    </span>
                  </div>
                </div>

                    {/* Status & Error Alerts */}
                    {errorMsg && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                    {successMsg && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{successMsg}</span>
                      </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                      {mode === 'signup' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Anand Murthy"
                            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1E60F2] focus:ring-1 focus:ring-[#1E60F2]"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1E60F2] focus:ring-1 focus:ring-[#1E60F2]"
                        />
                      </div>

                      {mode === 'signup' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                            Mobile Phone (For SMS Heat Warnings)
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                            >
                              <option value="+91">🇮🇳 +91</option>
                              <option value="+1">🇺🇸 +1</option>
                              <option value="+44">🇬🇧 +44</option>
                              <option value="+971">🇦🇪 +971</option>
                              <option value="+65">🇸🇬 +65</option>
                            </select>
                            <input
                              type="tel"
                              required
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="98450 12345"
                              className="flex-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1E60F2] focus:ring-1 focus:ring-[#1E60F2]"
                            />
                          </div>
                        </div>
                      )}

                      {mode !== 'forgot' && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              Password
                            </label>
                            {mode === 'login' && (
                              <button
                                type="button"
                                onClick={() => setMode('forgot')}
                                className="text-[11px] text-[#1E60F2] hover:underline font-medium"
                              >
                                Forgot password?
                              </button>
                            )}
                          </div>
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1E60F2] focus:ring-1 focus:ring-[#1E60F2]"
                          />
                        </div>
                      )}

                      {mode === 'signup' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1E60F2] focus:ring-1 focus:ring-[#1E60F2]"
                          />
                        </div>
                      )}

                      {mode === 'signup' && (
                        <div className="space-y-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={hourlyConsent}
                              onChange={(e) => setHourlyConsent(e.target.checked)}
                              className="rounded text-[#1E60F2] mt-0.5"
                            />
                            <span>I consent to receive localized heat advisories via Email and SMS.</span>
                          </label>

                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              required
                              checked={termsAccepted}
                              onChange={(e) => setTermsAccepted(e.target.checked)}
                              className="rounded text-[#1E60F2] mt-0.5"
                            />
                            <span>I agree to the <Link to="/terms" className="text-[#1E60F2] hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-[#1E60F2] hover:underline">Privacy Policy</Link>.</span>
                          </label>
                        </div>
                      )}

                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        className="w-full justify-center py-2.5 shadow-md shadow-blue-500/20"
                        disabled={isSubmitting}
                        icon={<ArrowRight className="w-4 h-4" />}
                      >
                        {isSubmitting
                          ? 'Authorizing...'
                          : mode === 'login'
                          ? 'Sign In to Dashboard'
                          : mode === 'signup'
                          ? 'Create Resident Account'
                          : 'Send Reset Link'}
                      </Button>

                      {/* Quick Instant Access Button — Jump Directly to Live Dashboard */}
                      <button
                        type="button"
                        onClick={async () => {
                          setIsSubmitting(true);
                          await loginAsDemo();
                          handleAuthSuccess();
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 border border-emerald-400/30 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>Instant Access — Enter Citizen Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    {/* Mode Switcher */}
                    <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                      {mode === 'login' ? (
                        <p>
                          Don't have an account?{' '}
                          <button 
                            type="button"
                            onClick={() => {
                              setMode('signup');
                              setErrorMsg('');
                            }} 
                            className="font-bold text-[#1E60F2] hover:underline"
                          >
                            Register as Resident
                          </button>
                        </p>
                      ) : (
                        <p>
                          Already registered?{' '}
                          <button 
                            type="button"
                            onClick={() => {
                              setMode('login');
                              setErrorMsg('');
                            }} 
                            className="font-bold text-[#1E60F2] hover:underline"
                          >
                            Sign In
                          </button>
                        </p>
                      )}
                    </div>
              </div>
            </div>

          </motion.div>
        </div>
      </main>

      {/* ── Cinematic Login Success Overlay (1.5-second zoom) ───────── */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center p-6 bg-radial from-transparent via-slate-950/40 to-slate-950/90 text-white"
          >
            {/* High-Tech Reticle & Telemetry */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="text-center max-w-md w-full space-y-4 p-8 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_0_80px_rgba(6,182,212,0.3)]"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#1E60F2] to-cyan-400 flex items-center justify-center text-white shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                <Shield className="w-7 h-7 fill-current animate-pulse" />
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-400 block mb-1">
                  AUTHENTICATION CONFIRMED
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Entering HeatShield AI Command
                </h3>
                <p className="text-xs text-blue-200/80 mt-1 font-mono">
                  Connecting to Planetary Weather Array & Local Aid Hubs...
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-white/10">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#1E60F2] via-cyan-400 to-emerald-400 rounded-full"
                  style={{ width: `${telemetryProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300/80 pt-1">
                <span>SECTOR: ASIA-PACIFIC (NCR)</span>
                <span>TELEMETRY: {telemetryProgress}%</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="relative z-20 w-full px-6 py-4 text-center text-xs text-slate-400/80 font-mono">
        <span>HeatShield AI Platform • Protecting Communities from Extreme Heat Stress</span>
      </footer>
    </div>
  );
};

export default AuthPage;