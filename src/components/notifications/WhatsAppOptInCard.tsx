import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  ExternalLink,
  ShieldCheck,
  Bell,
  Sun,
  Flame,
  CloudRain,
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { requestPhoneOtp, verifyPhoneOtp } from '../../lib/phoneAuthService';
import {
  checkGatewayHealth,
  saveWhatsAppOptIn,
  fetchWhatsAppOptIn,
  triggerDailyBriefing
} from '../../lib/whatsappGateway';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface WhatsAppOptInCardProps {
  className?: string;
  onVerified?: (phone: string) => void;
}

export const WhatsAppOptInCard: React.FC<WhatsAppOptInCardProps> = ({
  className = '',
  onVerified
}) => {
  const { user, markPhoneVerified, updateProfile } = useAuth();

  const [countryCode, setCountryCode] = useState(user?.country_code || '+91');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone?.replace(/^\+\d+\s*/, '') || '');
  const [otpCode, setOtpCode] = useState('');
  const [isVerified, setIsVerified] = useState(Boolean(user?.is_phone_verified));

  // Step: 'input' | 'otp' | 'preferences'
  const [step, setStep] = useState<'input' | 'otp' | 'preferences'>(
    user?.is_phone_verified ? 'preferences' : 'input'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingBriefing, setIsTestingBriefing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Gateway link state
  const [gatewayStatus, setGatewayStatus] = useState<{
    connected: boolean;
    message: string;
    reachable: boolean;
  }>({
    connected: false,
    message: '',
    reachable: false
  });

  // Toggles for Notification Preferences
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [extremeHeatAlerts, setExtremeHeatAlerts] = useState(true);
  const [severeWeatherAlerts, setSevereWeatherAlerts] = useState(true);

  // Check health and load existing preferences
  useEffect(() => {
    checkGatewayHealth().then(res => {
      setGatewayStatus({
        connected: res.connected,
        message: res.connected
          ? 'HeatShield AI WhatsApp Gateway is linked & active'
          : 'WhatsApp gateway not linked. Scan QR code in Admin Gateway to link HeatShield AI',
        reachable: res.reachable
      });
    }).catch(() => {
      setGatewayStatus({
        connected: false,
        message: 'WhatsApp gateway not linked. Scan QR code in Admin Gateway to link HeatShield AI',
        reachable: false
      });
    });

    if (phoneNumber) {
      fetchWhatsAppOptIn(phoneNumber, countryCode).then(res => {
        if (res.optedIn || res.verified) {
          setIsVerified(true);
          setStep('preferences');
          if (res.preferences) {
            setDailyBriefing(res.preferences.dailyBriefing ?? true);
            setExtremeHeatAlerts(res.preferences.extremeHeatAlerts ?? true);
            setSevereWeatherAlerts(res.preferences.severeWeatherAlerts ?? true);
          }
        }
      }).catch(() => {});
    }
  }, [phoneNumber, countryCode]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
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
        if (res.devOtp) setDevOtpHint(res.devOtp);
        setStep('otp');
        setCooldown(res.cooldownSeconds || 60);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request verification code.');
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
        setIsVerified(true);
        setStep('preferences');
        setSuccessMsg('HeatShield AI: Phone verified! You are now opted in for WhatsApp alerts.');
        const verifiedTimestamp = res.verifiedAt || new Date().toISOString();

        markPhoneVerified(verifiedTimestamp);
        await updateProfile({
          phone: fullPhone,
          country_code: countryCode,
          is_phone_verified: true,
          phone_verified_at: verifiedTimestamp
        });

        // Supabase preference sync
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
          } catch (e) {
            console.warn('Supabase consent sync warning:', e);
          }
        }

        if (onVerified) onVerified(fullPhone);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await saveWhatsAppOptIn({
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

      if (res.success) {
        setSuccessMsg('HeatShield AI: Notification preferences updated successfully!');
      } else {
        setErrorMsg(res.message || 'Failed to update preferences.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save preferences.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleTestBriefing = async () => {
    setIsTestingBriefing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await triggerDailyBriefing(true);
      if (res.success) {
        setSuccessMsg(`Daily Briefing triggered! Sent: ${res.sent}, Skipped: ${res.skipped}, Total: ${res.totalEligible}`);
      } else {
        setErrorMsg(res.error || 'Failed to trigger test daily briefing.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to trigger test briefing.');
    } finally {
      setIsTestingBriefing(false);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  return (
    <div className={`p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                HeatShield AI
              </span>
              {isVerified && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified Opt-In
                </span>
              )}
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
              WhatsApp Heat Alerts & Daily Morning Briefing
            </h3>
          </div>
        </div>

        {/* Gateway connection indicator */}
        <div className="flex items-center gap-2">
          {gatewayStatus.connected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Gateway Connected
            </span>
          ) : (
            <a
              href="/whatsapp-gateway"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
              title={gatewayStatus.message}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Gateway Not Linked</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}
        </div>
      </div>

      {/* Honest Gateway Notice if unlinked */}
      {!gatewayStatus.connected && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-[11px] font-medium leading-relaxed">
              WhatsApp gateway not linked. Scan QR code in Admin Gateway to link HeatShield AI before messages can be delivered live.
            </span>
          </div>
          <a
            href="/whatsapp-gateway"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg shrink-0 inline-flex items-center gap-1 transition-colors"
          >
            Open Admin QR Scanner <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Feedback Messages */}
      {errorMsg && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {devOtpHint && (
        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
          <span className="text-[11px]">HeatShield AI Test Code: <strong className="font-mono font-bold tracking-wider">{devOtpHint}</strong></span>
          <button
            type="button"
            onClick={() => setOtpCode(devOtpHint)}
            className="px-2.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-semibold hover:bg-blue-700"
          >
            Auto Fill
          </button>
        </div>
      )}

      {/* STEP 1: Phone input */}
      {step === 'input' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter your WhatsApp number to receive official <strong>HeatShield AI</strong> daily morning thermal briefings, real-time risk scores, and extreme heat emergency advisories.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              WhatsApp Mobile Number
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !phoneNumber.trim()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4" />
                <span>Send WhatsApp Verification Code</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: OTP verification */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Enter 6-Digit Verification Code
            </label>
            <button
              type="button"
              onClick={() => setStep('input')}
              className="text-[11px] text-emerald-600 hover:underline font-semibold"
            >
              Change Phone Number
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              required
              maxLength={6}
              autoFocus
              placeholder="••••••"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-slate-200 text-center text-lg font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
            />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Verify OTP</span>
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || isLoading}
                onClick={handleSendOtp}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-40 font-medium"
              >
                {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend Code'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 3: Active Opt-in & Notification Preferences */}
      {step === 'preferences' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {countryCode} {phoneNumber}
                </span>
                <span className="text-[10px] text-slate-500">Verified WhatsApp Channel</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setStep('input');
                setIsVerified(false);
              }}
              className="text-[11px] text-slate-600 hover:text-slate-900 underline font-medium"
            >
              Update Number
            </button>
          </div>

          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-800 block">
              Manage WhatsApp Notification Preferences
            </span>

            {/* Daily Briefing */}
            <label className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/60 flex items-center justify-between gap-3 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">
                    Daily Morning Briefing (6:00 AM)
                  </strong>
                  <span className="text-[11px] text-slate-500 block">
                    Authentic 9-line morning heat report with peak temp, risk level, rain chance, and hydration advice.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={dailyBriefing}
                onChange={(e) => setDailyBriefing(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer shrink-0"
              />
            </label>

            {/* Extreme Heat Alerts */}
            <label className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/60 flex items-center justify-between gap-3 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">
                    Extreme Heat Alerts (Orange / Red Conditions)
                  </strong>
                  <span className="text-[11px] text-slate-500 block">
                    Urgent notices when ambient temperatures breach 38°C or wet-bulb thresholds threaten health.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={extremeHeatAlerts}
                onChange={(e) => setExtremeHeatAlerts(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer shrink-0"
              />
            </label>

            {/* Severe Weather Alerts */}
            <label className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/60 flex items-center justify-between gap-3 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <CloudRain className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">
                    Severe Weather & Heat Spikes
                  </strong>
                  <span className="text-[11px] text-slate-500 block">
                    Rapid-onset thermal spikes, summer dust storms, and urgent dehydration warnings.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={severeWeatherAlerts}
                onChange={(e) => setSevereWeatherAlerts(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer shrink-0"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSavePreferences}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Save Preferences</span>
            </button>

            <button
              type="button"
              disabled={isTestingBriefing}
              onClick={handleTestBriefing}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Triggers the 6:00 AM daily briefing routine on-demand for opted-in residents"
            >
              {isTestingBriefing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Test 6:00 AM Daily Briefing</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer disclaimer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-slate-400" />
          HeatShield AI strictly adheres to TRAI & NDMA anti-spam guidelines.
        </span>
        <span>Consent timestamped & auditable</span>
      </div>
    </div>
  );
};

export default WhatsAppOptInCard;
