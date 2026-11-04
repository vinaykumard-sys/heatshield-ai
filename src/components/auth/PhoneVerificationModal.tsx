import React, { useState, useEffect } from 'react';
import { ShieldCheck, Phone, CheckCircle2, AlertCircle, RefreshCw, Lock, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { requestPhoneOtp, verifyPhoneOtp } from '../../lib/phoneAuthService';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  required?: boolean;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  isOpen,
  onClose,
  required = false
}) => {
  const { user, markPhoneVerified, updateProfile } = useAuth();

  const [countryCode, setCountryCode] = useState(user?.country_code || '+91');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone?.replace(/^\+\d+\s*/, '') || '');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'input_phone' | 'enter_otp'>('input_phone');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await requestPhoneOtp(countryCode, phoneNumber);
      if (!res.success) {
        setErrorMsg(res.message);
        if (res.cooldownSeconds) setCooldown(res.cooldownSeconds);
      } else {
        setSuccessMsg(res.message);
        setStep('enter_otp');
        setCooldown(60);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send verification SMS.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await verifyPhoneOtp(countryCode, phoneNumber, otpCode);
      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setSuccessMsg('Phone verified successfully! Updating resident profile...');
        const fullPhone = `${countryCode} ${phoneNumber.trim()}`;
        markPhoneVerified(res.verifiedAt || new Date().toISOString());
        await updateProfile({
          phone: fullPhone,
          country_code: countryCode,
          is_phone_verified: true,
          phone_verified_at: res.verifiedAt
        });

        setTimeout(() => {
          if (onClose) onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
        {!required && onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600">
              Compulsory Verification
            </span>
            <h3 className="text-lg font-extrabold text-slate-900">
              Verify Mobile Number
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          To protect residents and ensure you receive urgent hourly thermal advisories and NDMA heat alerts, every account must have a verified mobile number.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'input_phone' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mobile Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="+91">🇮🇳 +91 (India)</option>
                  <option value="+1">🇺🇸 +1 (US/Canada)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+971">🇦🇪 +971 (UAE)</option>
                  <option value="+65">🇸🇬 +65 (Singapore)</option>
                  <option value="+61">🇦🇺 +61 (Australia)</option>
                </select>

                <input
                  type="tel"
                  required
                  placeholder="98450 12345"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending SMS OTP...</span>
                </>
              ) : (
                <span>Send 6-Digit Verification Code</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Enter 6-Digit OTP
                </label>
                <button
                  type="button"
                  onClick={() => setStep('input_phone')}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  Change Number
                </button>
              </div>

              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                placeholder="••••••"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-lg font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block text-center">
                Code sent to {countryCode} {phoneNumber}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={cooldown > 0 || isLoading}
                onClick={handleSendCode}
                className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-40"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </button>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Verify & Activate</span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Encrypted with SHA-256. Strictly used for verified heat alerts.</span>
        </div>
      </div>
    </div>
  );
};
