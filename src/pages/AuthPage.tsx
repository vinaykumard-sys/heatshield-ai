import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Info,
  Phone,
  BellRing
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { BrandLogo } from '../components/common/BrandLogo';
import { PhoneVerificationModal } from '../components/auth/PhoneVerificationModal';

export const AuthPage: React.FC = () => {
  const { isAuthenticated, user, needsPhoneVerification, login, loginWithGoogle, signup, resetPassword } = useAuth();
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
  const [showOAuthConfigGuide, setShowOAuthConfigGuide] = useState(false);
  const [showPhoneVerifyModal, setShowPhoneVerifyModal] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated && !needsPhoneVerification) {
      navigate('/dashboard', { replace: true });
    } else if (isAuthenticated && needsPhoneVerification) {
      setShowPhoneVerifyModal(true);
    }
  }, [isAuthenticated, needsPhoneVerification, navigate]);

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
          navigate(from, { replace: true });
        }
      } else if (mode === 'signup') {
        const fullPhone = `${countryCode} ${phoneNumber.trim()}`;
        const res = await signup(email, password, fullName, fullPhone, countryCode, hourlyConsent);
        if (!res.success) {
          setErrorMsg(res.error || 'Registration failed.');
        } else if (res.requiresEmailConfirmation) {
          setSuccessMsg(`Account created for ${email}! A confirmation link has been sent to your email. Please verify your email, then verify your mobile number.`);
          setShowPhoneVerifyModal(true);
        } else {
          setSuccessMsg('Resident account created successfully! Please verify your mobile number.');
          setShowPhoneVerifyModal(true);
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
        setShowPhoneVerifyModal(true);
      } else if (!res.success) {
        setErrorMsg(res.error || 'Google authentication encountered an issue.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Google authentication error.');
    } finally {
      setIsGoogleLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-8">
      {/* Phone OTP Verification Modal */}
      <PhoneVerificationModal
        isOpen={showPhoneVerifyModal}
        required={true}
        onClose={() => {
          setShowPhoneVerifyModal(false);
          navigate('/dashboard', { replace: true });
        }}
      />

      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          
          {/* Left Section: Resident Platform Brand Deck */}
          <div className="lg:col-span-5 bg-[#0F172A] p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <Link to="/" className="inline-block">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">HeatShield <span className="text-cyan-400 font-mono text-sm">AI</span></span>
                </div>
              </Link>

              <div className="space-y-3 pt-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-300 text-xs font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Resident Community Heat Safety Ecosystem
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Protecting citizen lives from extreme heatwaves.
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  Receive verified hourly temperature & heat-risk updates on Email and SMS, find nearby drinking water and cooling sanctuaries, and protect your loved ones.
                </p>
              </div>

              {/* Minimalist Graphic Representation */}
              <div className="pt-4">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-700 pb-2">
                    <span className="font-mono text-[11px] uppercase">Community Safety Services</span>
                    <span className="text-emerald-400 font-mono font-medium">NDMA Protocol</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50">
                      <span className="text-slate-400 text-[10px] block">Hourly Alerts</span>
                      <strong className="text-white text-xs font-mono">SMS & Email</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50">
                      <span className="text-slate-400 text-[10px] block">Water & Cool</span>
                      <strong className="text-cyan-400 text-xs font-mono">GPS Mapped</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50">
                      <span className="text-slate-400 text-[10px] block">Verification</span>
                      <strong className="text-emerald-400 text-xs font-mono">Compulsory</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-6 border-t border-slate-800 text-xs text-slate-400">
              National Disaster Management Authority (NDMA) & IMD Guidelines Compliant.
            </div>
          </div>

          {/* Right Section: Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
            <div className="max-w-md w-full mx-auto space-y-5">
              
              {/* Form Title */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {mode === 'login' ? 'Sign in to HeatShield' : mode === 'signup' ? 'Resident Registration' : 'Reset your password'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {mode === 'login' 
                    ? 'Access your hyperlocal heat telemetry, alerts, and emergency lifelines.'
                    : mode === 'signup'
                    ? 'Register as a verified resident to receive hourly thermal briefings and water locator.'
                    : 'Enter your registered email address to receive recovery instructions.'}
                </p>
              </div>

              {/* PRIMARY METHOD: Official Google Sign-In Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm border border-slate-300 flex items-center justify-center gap-3 hover:border-slate-400 active:bg-slate-100 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isGoogleLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-slate-700">Connecting Google Account...</span>
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
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-[#E2E8F0] w-full" />
                  <span className="bg-white px-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                    or continue with email & phone
                  </span>
                </div>
              </div>

              {/* Status & Error Alerts */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Email / Password / Phone Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Anand Murthy"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number (For Emergency Alerts)</label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+65">🇸🇬 +65</option>
                        <option value="+61">🇦🇺 +61</option>
                      </select>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="98450 12345"
                        className="flex-1 bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                )}

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Password</label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
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
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="space-y-2 pt-1 text-[11px] text-slate-600">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hourlyConsent}
                        onChange={(e) => setHourlyConsent(e.target.checked)}
                        className="rounded text-blue-600 mt-0.5"
                      />
                      <span>I explicitly consent to receive hourly personalized heat updates and emergency advisories via Email and SMS.</span>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="rounded text-blue-600 mt-0.5"
                      />
                      <span>I agree to the <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.</span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  <span>
                    {isSubmitting
                      ? 'Processing...'
                      : mode === 'login'
                      ? 'Sign In to Dashboard'
                      : mode === 'signup'
                      ? 'Create Verified Resident Account'
                      : 'Send Reset Link'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Mode Switcher */}
              <div className="text-center text-xs text-slate-500 pt-2 border-t border-[#E2E8F0]">
                {mode === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <button 
                      onClick={() => setMode('signup')} 
                      className="font-bold text-blue-600 hover:text-blue-700"
                    >
                      Register as Resident
                    </button>
                  </p>
                ) : (
                  <p>
                    Already registered?{' '}
                    <button 
                      onClick={() => setMode('login')} 
                      className="font-bold text-blue-600 hover:text-blue-700"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>

              {/* Collapsible Supabase Google OAuth Setup Guide */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowOAuthConfigGuide(!showOAuthConfigGuide)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mx-auto"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Google OAuth Configuration Guide</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showOAuthConfigGuide ? 'rotate-180' : ''}`} />
                </button>

                {showOAuthConfigGuide && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] text-xs text-slate-600 space-y-2 text-left">
                    <p className="font-semibold text-slate-900">
                      Step-by-Step Google OAuth Setup with Supabase:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                      <li>Go to <strong>Google Cloud Console</strong> &gt; APIs &amp; Services &gt; Credentials.</li>
                      <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web Application).</li>
                      <li>
                        Add Supabase Authorized Redirect URI: <br />
                        <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px] select-all font-mono">
                          {isSupabaseConfigured && import.meta.env.VITE_SUPABASE_URL 
                            ? `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/callback` 
                            : 'https://<your-project-ref>.supabase.co/auth/v1/callback'}
                        </code>
                      </li>
                      <li>In <strong>Supabase Dashboard</strong> &gt; Authentication &gt; Providers &gt; <strong>Google</strong>: paste your Client ID &amp; Secret.</li>
                      <li>Set Authorized Redirect URL to <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px] font-mono">{window.location.origin}</code></li>
                    </ol>
                  </div>
                )}
              </div>

            </div>

            {/* Terms and Privacy Footer */}
            <div className="pt-6 text-center text-xs text-slate-400">
              By continuing, you agree to HeatShield AI's{' '}
              <Link to="/terms" className="text-slate-600 hover:underline">Terms of Service</Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-slate-600 hover:underline">Privacy Policy</Link>.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default AuthPage;
