import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, CheckCircle2, AlertCircle, RefreshCw, Lock, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { requestPhoneOtp, verifyPhoneOtp } from '../../lib/phoneAuthService';
import { saveWhatsAppOptIn, checkGatewayHealth } from '../../lib/whatsappGateway';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

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
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<{ connected: boolean; message: string }>({
    connected: false,
    message: ''
  });
  const [cooldown, setCooldown] = useState(0);

  // Preference checkboxes
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [extremeHeatAlerts, setExtremeHeatAlerts] = useState(true);
  const [severeWeatherAlerts, setSevereWeatherAlerts] = useState(true);

  // Check WhatsApp gateway status on modal open
  useEffect(() => {
    if (isOpen) {
      checkGatewayHealth().then(res => {
        setGatewayStatus({
          connected: res.connected,
          message: res.connected
            ? 'WhatsApp Gateway Connected'
            : 'WhatsApp gateway not linked. Scan QR code in Admin Gateway to link HeatShield AI'
        });
      }).catch(() => {
        setGatewayStatus({
          connected: false,
          message: 'WhatsApp gateway not linked. Scan QR code in Admin Gateway to link HeatShield AI'
        });
      });
    }
  }, [isOpen]);

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
    setDevOtpHint(null);
    setIsLoading(true);

    try {
      const res = await requestPhoneOtp(countryCode, phoneNumber);
      if (!res.success) {
        setErrorMsg(res.message);
        if (res.cooldownSeconds) setCooldown(res.cooldownSeconds);
      } else {
        setSuccessMsg(res.message);
        if (res.devOtp) {
          setDevOtpHint(res.devOtp);
        }
        setStep('enter_otp');
        setCooldown(res.cooldownSeconds || 60);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send verification code from HeatShield AI.');
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
      const fullPhone = `${countryCode} ${phoneNumber.trim()}`;
      const res = await verifyPhoneOtp(countryCode, phoneNumber, otpCode, {
        userId: user?.id,
        preferences: {
          name: user?.full_name || 'Resident',
          locality: user?.primary_locality_name || 'Bengaluru Urban',
          dailyBriefing,
          extremeHeatAlerts,
          severeWeatherAlerts
        }
      });

      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setSuccessMsg('HeatShield AI: Mobile number verified and WhatsApp safety alerts activated!');
        const verifiedTimestamp = res.verifiedAt || new Date().toISOString();

        // 1. Mark phone verified in Auth Context
        markPhoneVerified(verifiedTimestamp);
        await updateProfile({
          phone: fullPhone,
          country_code: countryCode,
          is_phone_verified: true,
          phone_verified_at: verifiedTimestamp
        });

        // 2. Persist to Supabase if configured
        if (isSupabaseConfigured && supabase && user?.id) {
          try {
            await supabase.from('user_notification_preferences').upsert({
              user_id: user.id,
              sms_enabled: true,
              in_app_enabled: true,
              hourly_updates_enabled: true,
              critical_alerts_enabled: extremeHeatAlerts,
              updated_at: verifiedTimestamp
            });

            await supabase.from('notification_consents').insert({
              user_id: user.id,
              consent_type: 'hourly_heat_updates',
              channels: ['whatsapp', 'sms'],
              phone_number: fullPhone,
              consented_at: verifiedTimestamp
            });
          } catch (dbErr) {
            console.warn('Supabase notification preference sync notice:', dbErr);
          }
        }

        // 3. Persist WhatsApp Gateway Opt-In
        try {
          await saveWhatsAppOptIn({
            phone: phoneNumber.trim(),
            countryCode,
            name: user?.full_name || 'Resident',
            locality: user?.primary_locality_name || 'Bengaluru Urban',
            userId: user?.id,
            preferences: {
              dailyBriefing,
              extremeHeatAlerts,
              severeWeatherAlerts
            }
          });
        } catch {
          // gateway is resilient
        }

        setTimeout(() => {
          if (onClose) onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check the code.');
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
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-inner">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                HeatShield AI
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
              WhatsApp Alert Verification
            </h3>
          </div>
        </div>

        {/* Gateway Status Banner */}
        {!gatewayStatus.connected && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
            <span className="text-[11px] leading-tight">
              ⚠️ WhatsApp gateway not linked. Scan QR code in Admin Gateway to link HeatShield AI.
            </span>
            <Link
              to="/whatsapp-gateway"
              onClick={() => onClose && onClose()}
              className="text-[10px] font-bold text-amber-800 underline hover:text-amber-950 shrink-0 inline-flex items-center gap-1 cursor-pointer"
            >
              Link Now <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          HeatShield AI delivers verified daily 6:00 AM weather briefings, live hourly thermal risk scores, and urgent heatwave emergency alerts directly to your WhatsApp.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {devOtpHint && (
          <div className="mb-4 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
            <span className="text-[11px]">HeatShield AI Test Code: <strong className="font-mono font-bold tracking-wider">{devOtpHint}</strong></span>
            <button
              type="button"
              onClick={() => setOtpCode(devOtpHint)}
              className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-semibold hover:bg-blue-700"
            >
              Fill OTP
            </button>
          </div>
        )}

        {step === 'input_phone' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                WhatsApp Mobile Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>
            </div>

            {/* Notification Preferences Toggles */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-700">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Opt-in Notification Preferences:
              </span>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs">☀️ Daily Morning Briefing (6:00 AM)</span>
                <input
                  type="checkbox"
                  checked={dailyBriefing}
                  onChange={(e) => setDailyBriefing(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs">🔴 Extreme Heat Alerts (Orange/Red)</span>
                <input
                  type="checkbox"
                  checked={extremeHeatAlerts}
                  onChange={(e) => setExtremeHeatAlerts(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs">🌧 Severe Weather Alerts</span>
                <input
                  type="checkbox"
                  checked={severeWeatherAlerts}
                  onChange={(e) => setSevereWeatherAlerts(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Requesting Server OTP...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  <span>Send 6-Digit Verification Code</span>
                </>
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
                  className="text-[11px] text-emerald-600 hover:underline font-semibold cursor-pointer"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-xl font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block text-center">
                Code sent to {countryCode} {phoneNumber} (valid 5 minutes)
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={cooldown > 0 || isLoading}
                onClick={handleSendCode}
                className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-40 cursor-pointer font-medium"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </button>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Verify & Activate</span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Server-side cryptographic OTP. HeatShield AI never spams.</span>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerificationModal;
