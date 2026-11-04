import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Bell, 
  Globe, 
  Moon, 
  Lock, 
  LogOut, 
  Save, 
  Sparkles,
  MapPin,
  Clock,
  Shield,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocationTracker } from '../context/LocationContext';
import { mockDb } from '../lib/mockDb';
import { PhoneVerificationModal } from '../components/auth/PhoneVerificationModal';

export const MyAccountPage: React.FC = () => {
  const { user, markPhoneVerified, updateProfile, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { currentLocation, selectedZone } = useLocationTracker();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone?.replace(/^\+\d+\s*/, '') || '');
  const [countryCode, setCountryCode] = useState(user?.country_code || '+91');
  const [primaryLocality, setPrimaryLocality] = useState(user?.primary_locality_name || currentLocation.localityName || 'Bengaluru Urban');
  
  // Notification Preferences
  const [hourlyEmail, setHourlyEmail] = useState(user?.hourly_notification_consent ?? true);
  const [hourlySms, setHourlySms] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('06:00');

  const [showPhoneVerifyModal, setShowPhoneVerifyModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const locations = mockDb.getLocations();

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = `${countryCode} ${phoneNumber.trim()}`;
    await updateProfile({
      full_name: fullName,
      phone: fullPhone,
      country_code: countryCode,
      primary_locality_name: primaryLocality,
      hourly_notification_consent: hourlyEmail
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 sm:px-6">
      {/* Phone OTP Verification Modal */}
      <PhoneVerificationModal
        isOpen={showPhoneVerifyModal}
        onClose={() => setShowPhoneVerifyModal(false)}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            <span>My Resident Account & Privacy</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal verification, hourly Email & SMS safety alerts, and account preferences.
          </p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile and notification preferences updated successfully!</span>
        </div>
      )}

      {/* VERIFICATION STATUS CARD */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Compulsory Contact Verification Status</h3>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            Resident Shield
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email Verification */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Registered Email</span>
              <strong className="text-xs text-slate-900 font-mono truncate block">{user?.email || 'Not connected'}</strong>
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Email Verified</span>
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Active
            </span>
          </div>

          {/* Phone Verification */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Mobile Phone Number</span>
              <strong className="text-xs text-slate-900 font-mono truncate block">
                {user?.phone ? `${user.country_code || '+91'} ${user.phone.replace(/^\+\d+\s*/, '')}` : 'No phone linked'}
              </strong>
              {user?.is_phone_verified ? (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>SMS OTP Verified</span>
                </span>
              ) : (
                <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Unverified Phone</span>
                </span>
              )}
            </div>

            {user?.is_phone_verified ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowPhoneVerifyModal(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                Verify SMS
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RESIDENT PROFILE FORM */}
      <form onSubmit={handleSavePreferences} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-600" />
            <span>Personal Profile & Monitored Primary Locality</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Registered Email (Read-Only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Mobile Phone Number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-2.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 text-xs"
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
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Primary Locality for Hourly Alerts</label>
              <select
                value={primaryLocality}
                onChange={(e) => setPrimaryLocality(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-semibold"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    📍 {loc.name} ({loc.city})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* HOURLY NOTIFICATION PREFERENCES (PHASE 8 REQUIREMENT) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Mandatory Hourly Heat Alerts & Consent</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Scheduled 0 * * * *</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Every hour on the hour, HeatShield AI retrieves real-time Open-Meteo weather readings and NDMA thermal stress calculations for your primary location (<strong>{primaryLocality}</strong>) and dispatches personalised safety updates.
          </p>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
              <div>
                <strong className="text-slate-900 block font-bold">Hourly Email Updates</strong>
                <span className="text-slate-500 text-[11px]">
                  Receive full thermal metrics, feels-like temperature, and NDMA clinical advice in your inbox.
                </span>
              </div>
              <input
                type="checkbox"
                checked={hourlyEmail}
                onChange={(e) => setHourlyEmail(e.target.checked)}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
              <div>
                <strong className="text-slate-900 block font-bold">Hourly SMS Telemetry Briefings</strong>
                <span className="text-slate-500 text-[11px]">
                  Concise TRAI-compliant text messages with current temp, heat risk score, and immediate precaution.
                </span>
              </div>
              <input
                type="checkbox"
                checked={hourlySms}
                onChange={(e) => setHourlySms(e.target.checked)}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 block font-bold">Night-time Quiet Hours</strong>
                  <span className="text-slate-500 text-[11px]">
                    Suppress routine hourly updates during sleep hours (critical emergency heatwave alerts remain active).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={quietHoursEnabled}
                  onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {quietHoursEnabled && (
                <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 text-[11px]">From:</span>
                    <input
                      type="time"
                      value={quietStart}
                      onChange={(e) => setQuietStart(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 text-[11px]">To:</span>
                    <input
                      type="time"
                      value={quietEnd}
                      onChange={(e) => setQuietEnd(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LANGUAGE & ACCESSIBILITY */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Language & Localization</span>
          </h3>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`p-3.5 rounded-2xl border text-center font-bold transition-all ${
                language === 'en'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`p-3.5 rounded-2xl border text-center font-bold transition-all ${
                language === 'hi'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              हिन्दी (Hindi)
            </button>
            <button
              type="button"
              onClick={() => setLanguage('kn')}
              className={`p-3.5 rounded-2xl border text-center font-bold transition-all ${
                language === 'kn'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              ಕನ್ನಡ (Kannada)
            </button>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 btn-interact hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences & Consent</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MyAccountPage;
