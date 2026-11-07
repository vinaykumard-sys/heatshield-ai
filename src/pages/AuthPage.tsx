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
  Phone,
  Sun,
  Droplets,
  HeartHandshake
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { PhoneVerificationModal } from '../components/auth/PhoneVerificationModal';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

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
  const [showPhoneVerifyModal, setShowPhoneVerifyModal] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col justify-center py-10 px-4 sm:px-6">
      {/* Phone OTP Verification Modal */}
      <PhoneVerificationModal
        isOpen={showPhoneVerifyModal}
        required={true}
        onClose={() => {
          setShowPhoneVerifyModal(false);
          navigate('/dashboard', { replace: true });
        }}
      />

      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-[24px] border border-[#E5EDF5] shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
          
          {/* Left Section: Friendly Brand Presentation */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#1E60F2] to-blue-700 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-6 relative z-10">
              <Link to="/" className="inline-block">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white text-[#1E60F2] flex items-center justify-center font-bold shadow-xs">
                    <Shield className="w-5 h-5 fill-current" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">HeatShield <span className="text-blue-200 text-sm font-semibold">AI</span></span>
                </div>
              </Link>

              <div className="space-y-3 pt-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Community Protection Network
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Protecting communities from extreme heat.
                </h1>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-normal">
                  Receive personalized heat-risk advisories, find clean drinking water kiosks and public cooling shelters, and protect your loved ones.
                </p>
              </div>

              {/* Graphic Highlights */}
              <div className="pt-4">
                <div className="p-4 rounded-2xl bg-white/10 border border-white/20 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-blue-100 pb-2 border-b border-white/15">
                    <span className="font-semibold text-[11px]">Safety Features</span>
                    <span className="text-emerald-300 font-semibold">Verified</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-white/10">
                      <Sun className="w-4 h-4 mx-auto mb-1 text-amber-300" />
                      <span className="text-[10px] block text-blue-100">Heat Alerts</span>
                      <strong className="text-white text-xs">Live</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/10">
                      <Droplets className="w-4 h-4 mx-auto mb-1 text-sky-200" />
                      <span className="text-[10px] block text-blue-100">Water Points</span>
                      <strong className="text-white text-xs">Mapped</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/10">
                      <HeartHandshake className="w-4 h-4 mx-auto mb-1 text-emerald-300" />
                      <span className="text-[10px] block text-blue-100">Aid Request</span>
                      <strong className="text-white text-xs">Rapid</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-6 border-t border-white/15 text-xs text-blue-200">
              National Disaster Management Authority (NDMA) Guideline Aligned.
            </div>
          </div>

          {/* Right Section: Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
            <div className="max-w-md w-full mx-auto space-y-5">
              
              {/* Form Title */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                  {mode === 'login' ? 'Sign in to HeatShield' : mode === 'signup' ? 'Create Resident Account' : 'Reset Password'}
                </h2>
                <p className="text-xs text-[#64748B] mt-1">
                  {mode === 'login' 
                    ? 'Access your local heat risk, alerts, and emergency support.'
                    : mode === 'signup'
                    ? 'Register to receive localized heat advisories and water point locations.'
                    : 'Enter your registered email address to receive password recovery instructions.'}
                </p>
              </div>

              {/* Google Sign-In Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-[#0F172A] font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs border border-[#E5EDF5] flex items-center justify-center gap-3 hover:border-slate-300 active:bg-slate-100 disabled:opacity-75"
                >
                  {isGoogleLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#1E60F2] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[#64748B]">Connecting with Google...</span>
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
                  <div className="border-t border-[#E5EDF5] w-full" />
                  <span className="bg-white px-3 text-[11px] text-[#64748B] font-medium uppercase tracking-wider">
                    or continue with email
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

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Anand Murthy"
                      className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1E60F2]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1E60F2]"
                  />
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">Mobile Phone (For SMS Heat Warnings)</label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="px-2.5 py-2 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-xs font-semibold text-[#0F172A] focus:outline-none"
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
                        className="flex-1 bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1E60F2]"
                      />
                    </div>
                  </div>
                )}

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#0F172A]">Password</label>
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
                      className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1E60F2]"
                    />
                  </div>
                )}

                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1E60F2]"
                    />
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="space-y-2 pt-1 text-[11px] text-[#64748B]">
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
                  className="w-full justify-center"
                  disabled={isSubmitting}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  {isSubmitting
                    ? 'Processing...'
                    : mode === 'login'
                    ? 'Sign In to Dashboard'
                    : mode === 'signup'
                    ? 'Create Resident Account'
                    : 'Send Reset Link'}
                </Button>
              </form>

              {/* Mode Switcher */}
              <div className="text-center text-xs text-[#64748B] pt-2 border-t border-[#E5EDF5]">
                {mode === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <button 
                      onClick={() => setMode('signup')} 
                      className="font-bold text-[#1E60F2] hover:underline"
                    >
                      Register as Resident
                    </button>
                  </p>
                ) : (
                  <p>
                    Already registered?{' '}
                    <button 
                      onClick={() => setMode('login')} 
                      className="font-bold text-[#1E60F2] hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
