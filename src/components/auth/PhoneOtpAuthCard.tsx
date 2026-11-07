import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Clock, 
  ChevronLeft 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  requestPhoneOtp, 
  verifyPhoneOtp, 
  normalizeToE164, 
  isValidIndianMobileNumber 
} from '../../lib/phoneAuthService';

interface PhoneOtpAuthCardProps {
  onSuccess?: () => void;
  redirectTo?: string;
  isModal?: boolean;
}

export const PhoneOtpAuthCard: React.FC<PhoneOtpAuthCardProps> = ({
  onSuccess,
  redirectTo = '/dashboard',
  isModal = false
}) => {
  const { markPhoneVerified } = useAuth();
  const navigate = useNavigate();

  // Screen state: 'phone' (Screen A) or 'otp' (Screen B)
  const [screen, setScreen] = useState<'phone' | 'otp'>('phone');

  // Phone input states
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // OTP input states: 6 individual digits
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  // Timers:
  // 1. Resend cooldown timer (60 seconds)
  const [resendCooldown, setResendCooldown] = useState(0);
  // 2. OTP expiration countdown timer (5 minutes = 300 seconds)
  const [expirationSeconds, setExpirationSeconds] = useState(300);

  // Resend cooldown interval
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Expiration countdown interval (runs when on 'otp' screen)
  useEffect(() => {
    let timer: any;
    if (screen === 'otp' && expirationSeconds > 0) {
      timer = setInterval(() => {
        setExpirationSeconds(prev => {
          if (prev <= 1) {
            setOtpError('Verification code has expired. Please request a new code.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [screen, expirationSeconds]);

  // Format expiration timer as MM:SS
  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ─── SCREEN A: Request OTP ────────────────────────────────────────────────
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPhoneError('');
    setOtpError('');
    setOtpSuccess('');

    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

    if (!cleanNumber) {
      setPhoneError('Please enter your mobile phone number.');
      return;
    }

    if (countryCode === '+91' && !isValidIndianMobileNumber(cleanNumber)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).');
      return;
    }

    setIsRequesting(true);

    try {
      const res = await requestPhoneOtp(countryCode, cleanNumber);

      if (!res.success) {
        setPhoneError(res.message);
        if (res.cooldownSeconds) {
          setResendCooldown(res.cooldownSeconds);
        }
      } else {
        // Navigate to Screen B
        setScreen('otp');
        setResendCooldown(res.cooldownSeconds || 60);
        setExpirationSeconds(300); // 5-minute validity
        setOtpDigits(['', '', '', '', '', '']);
        // Auto focus first box
        setTimeout(() => {
          digitInputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (err: any) {
      setPhoneError(err.message || 'Unable to request verification code. Please check your network.');
    } finally {
      setIsRequesting(false);
    }
  };

  // ─── SCREEN B: Digit Input Navigation & Paste ────────────────────────────
  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digits
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    const digit = cleaned.slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    // Auto advance focus to next box if available
    if (index < 5 && digit) {
      digitInputRefs.current[index + 1]?.focus();
    }

    // Auto trigger verification if all 6 boxes are filled
    const fullCode = updated.join('');
    if (fullCode.length === 6) {
      handleVerifyCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(newDigits);

    // Focus last filled box or first empty
    const nextEmpty = newDigits.findIndex(d => !d);
    const focusIdx = nextEmpty === -1 ? 5 : nextEmpty;
    digitInputRefs.current[focusIdx]?.focus();

    if (pastedData.length === 6) {
      handleVerifyCode(pastedData);
    }
  };

  // ─── SCREEN B: Verify OTP ────────────────────────────────────────────────
  const handleVerifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');

    if (code.length !== 6) {
      setOtpError('Please enter all 6 digits.');
      return;
    }

    if (expirationSeconds <= 0) {
      setOtpError('Verification code has expired. Please request a new code.');
      return;
    }

    setOtpError('');
    setIsVerifying(true);

    try {
      const res = await verifyPhoneOtp(countryCode, phoneNumber, code);

      if (!res.success) {
        setOtpError(res.message);
      } else {
        setOtpSuccess('Mobile number verified successfully!');
        const normalized = normalizeToE164(countryCode, phoneNumber);
        markPhoneVerified(new Date().toISOString());

        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            navigate(redirectTo, { replace: true });
          }
        }, 800);
      }
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const normalizedPhoneDisplay = normalizeToE164(countryCode, phoneNumber);

  return (
    <div className={`w-full ${isModal ? '' : 'max-w-md mx-auto'}`}>
      {/* SCREEN A: Phone Input */}
      {screen === 'phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1E60F2] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                HeatShield AI Official Auth
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Verify your mobile number
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Sign in with your mobile phone to access heatwave alerts, safe routes, and community assistance.
            </p>
          </div>

          {phoneError && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{phoneError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mobile Phone Number
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E60F2] cursor-pointer"
              >
                <option value="+91">🇮🇳 +91 (India)</option>
                <option value="+1">🇺🇸 +1 (US)</option>
                <option value="+44">🇬🇧 +44 (UK)</option>
                <option value="+971">🇦🇪 +971 (UAE)</option>
                <option value="+65">🇸🇬 +65 (SG)</option>
              </select>

              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  placeholder="99457 44948"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
                />
              </div>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Format: 10-digit mobile number (e.g. 9945744948)
            </span>
          </div>

          <button
            type="submit"
            disabled={isRequesting || !phoneNumber.trim()}
            className="w-full py-3 rounded-xl bg-[#1E60F2] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isRequesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sending verification code...</span>
              </>
            ) : (
              <>
                <span>Send OTP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>End-to-end encrypted WhatsApp verification. HeatShield AI never shares your number.</span>
          </div>
        </form>
      ) : (
        /* SCREEN B: OTP Verification */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setScreen('phone')}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              WhatsApp Verification
            </span>
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Verify OTP
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Enter the 6-digit code sent to WhatsApp{' '}
              <strong className="text-slate-900 font-mono">{normalizedPhoneDisplay}</strong>
            </p>
          </div>

          {otpError && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{otpError}</span>
            </div>
          )}

          {otpSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{otpSuccess}</span>
            </div>
          )}

          {/* 6-box OTP input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
              Enter 6-Digit Code
            </label>
            <div className="flex justify-between gap-2 max-w-xs mx-auto">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (digitInputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={isVerifying || expirationSeconds <= 0}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className="w-11 h-13 text-center text-xl font-mono font-black text-slate-900 bg-white border-2 border-slate-200 rounded-xl focus:border-[#1E60F2] focus:ring-2 focus:ring-[#1E60F2]/20 focus:outline-none transition-all disabled:opacity-50"
                />
              ))}
            </div>

            {/* Expiration Countdown */}
            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>
                OTP expires in{' '}
                <strong className={`font-mono font-bold ${expirationSeconds < 60 ? 'text-red-600' : 'text-slate-800'}`}>
                  {formatTimer(expirationSeconds)}
                </strong>
              </span>
            </div>
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={() => handleVerifyCode()}
            disabled={isVerifying || otpDigits.join('').length !== 6 || expirationSeconds <= 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying OTP...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify OTP</span>
              </>
            )}
          </button>

          {/* Resend OTP Section */}
          <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
            <span className="text-slate-500">Didn't receive the code?</span>
            <button
              type="button"
              disabled={resendCooldown > 0 || isRequesting}
              onClick={() => handleSendOtp()}
              className="text-[#1E60F2] hover:text-blue-800 font-bold disabled:opacity-40 cursor-pointer"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneOtpAuthCard;
