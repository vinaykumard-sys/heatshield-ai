import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Bell,
  Sun,
  Flame,
  CloudRain,
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
  const { user, updateProfile } = useAuth();

  const [countryCode, setCountryCode] = useState(user?.country_code || '+91');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone?.replace(/^\+\d+\s*/, '') || '');
  const [isSaved, setIsSaved] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingBriefing, setIsTestingBriefing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
        if (res.optedIn) {
          setIsSaved(true);
          if (res.preferences) {
            setDailyBriefing(res.preferences.dailyBriefing ?? true);
            setExtremeHeatAlerts(res.preferences.extremeHeatAlerts ?? true);
            setSevereWeatherAlerts(res.preferences.severeWeatherAlerts ?? true);
          }
        }
      }).catch(() => {});
    }
  }, [phoneNumber, countryCode]);

  const handleSavePreferences = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) {
      setErrorMsg('Please enter your WhatsApp mobile number.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const fullPhone = `${countryCode} ${phoneNumber.trim()}`;
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
        setIsSaved(true);
        setSuccessMsg('HeatShield AI: WhatsApp notification preferences updated successfully!');

        const nowTs = new Date().toISOString();
        await updateProfile({
          phone: fullPhone,
          country_code: countryCode
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
              updated_at: nowTs
            });

            await supabase.from('notification_consents').insert({
              user_id: user.id,
              consent_type: 'hourly_heat_updates',
              channels: ['whatsapp', 'sms'],
              phone_number: fullPhone,
              consented_at: nowTs
            });
          } catch (e) {
            console.warn('Supabase consent sync warning:', e);
          }
        }

        if (onVerified) onVerified(fullPhone);
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
              {isSaved && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Subscribed
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              WhatsApp Heat Alerts & Daily Morning Briefing
            </h3>
          </div>
        </div>

        {/* Live Gateway Pill */}
        <div className="flex items-center gap-2">
          {gatewayStatus.connected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Gateway Connected
            </span>
          ) : (
            <Link
              to="/whatsapp-gateway"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
              title={gatewayStatus.message}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Gateway Not Linked</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Gateway Notice if unlinked */}
      {!gatewayStatus.connected && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-[11px] font-medium leading-relaxed">
              WhatsApp gateway not linked. Scan QR code in Admin Gateway to link HeatShield AI before messages can be delivered live.
            </span>
          </div>
          <Link
            to="/whatsapp-gateway"
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg shrink-0 inline-flex items-center gap-1 transition-colors"
          >
            Open Admin QR Scanner <ExternalLink className="w-3 h-3" />
          </Link>
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

      {/* Preferences Form */}
      <form onSubmit={handleSavePreferences} className="space-y-4">
        <p className="text-xs text-slate-600 leading-relaxed">
          Configure your WhatsApp number to receive official <strong>HeatShield AI</strong> daily morning thermal briefings, real-time risk scores, and extreme heat emergency advisories.
        </p>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            WhatsApp Mobile Number
          </label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="+91">IN +91 (India)</option>
              <option value="+1">US +1 (United States)</option>
              <option value="+44">UK +44 (United Kingdom)</option>
              <option value="+971">AE +971 (UAE)</option>
              <option value="+65">SG +65 (Singapore)</option>
            </select>
            <input
              type="tel"
              required
              placeholder="9945744948"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Preferences Checkboxes */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
            Opt-In Notification Preferences:
          </span>
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-slate-700">Daily Morning Briefing (6:00 AM)</span>
            </div>
            <input
              type="checkbox"
              checked={dailyBriefing}
              onChange={(e) => setDailyBriefing(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              <span className="text-xs text-slate-700">Extreme Heat Alerts (Orange/Red)</span>
            </div>
            <input
              type="checkbox"
              checked={extremeHeatAlerts}
              onChange={(e) => setExtremeHeatAlerts(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-slate-700">Severe Weather Alerts</span>
            </div>
            <input
              type="checkbox"
              checked={severeWeatherAlerts}
              onChange={(e) => setSevereWeatherAlerts(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving || !phoneNumber.trim()}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Notification Preferences</span>
              </>
            )}
          </button>

          {gatewayStatus.connected && (
            <button
              type="button"
              disabled={isTestingBriefing}
              onClick={handleTestBriefing}
              className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Send a sample morning briefing to test message delivery"
            >
              {isTestingBriefing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>Test Briefing</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default WhatsAppOptInCard;
