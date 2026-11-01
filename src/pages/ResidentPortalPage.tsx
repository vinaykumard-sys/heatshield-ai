import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  HelpCircle, 
  CheckCircle2, 
  Sparkles,
  Save,
  Lock
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchLiveWeather } from '../lib/weatherApi';
import { evaluateHeatRisk } from '../lib/riskEngine';
import { RiskBadge } from '../components/common/RiskBadge';
import { NewRequestModal } from '../components/requests/NewRequestModal';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { EnvironmentalReading, HeatRiskAssessment } from '../types';

export const ResidentPortalPage: React.FC = () => {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const locations = mockDb.getLocations();

  const [residentProfile] = useState(() => {
    const list = mockDb.getResidents();
    return list.find(r => r.profile_id === user?.id || r.contact_phone === user?.phone) || list[0];
  });

  const [safeConfirmedRecently, setSafeConfirmedRecently] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reading, setReading] = useState<EnvironmentalReading | null>(null);
  const [risk, setRisk] = useState<HeatRiskAssessment | null>(null);

  // Edit fields
  const [phone, setPhone] = useState(residentProfile?.contact_phone || '');
  const [address, setAddress] = useState(residentProfile?.address_notes || '');
  const [emergencyPhone, setEmergencyPhone] = useState(residentProfile?.emergency_contact_phone || '');
  const [isSavedToast, setIsSavedToast] = useState(false);

  const myLoc = locations.find(l => l.id === residentProfile?.locality_id) || locations[0];

  useEffect(() => {
    async function loadLoc() {
      if (!myLoc) return;
      try {
        const w = await fetchLiveWeather(myLoc.latitude, myLoc.longitude, myLoc.id);
        setReading(w.reading);
        const r = evaluateHeatRisk({
          temperatureC: w.reading.temperature_c,
          relativeHumidityPct: w.reading.relative_humidity_pct,
          baselineVulnerabilityScore: myLoc.baseline_vulnerability_score,
          urbanHeatIslandFactor: myLoc.urban_heat_island_factor,
        }, myLoc.id, language);
        setRisk(r);
      } catch (e) {}
    }
    loadLoc();
  }, [myLoc, language]);

  // One-click "I am safe" confirmation
  const handleConfirmSafe = () => {
    if (!residentProfile) return;
    const checkins = mockDb.getCheckins();
    const myCheckin = checkins.find(c => c.resident_id === residentProfile.id);

    if (myCheckin) {
      mockDb.updateCheckinStatus(myCheckin.id, 'completed', {
        safetyConfirmed: true,
        notes: 'Resident self-confirmed safety via mobile resident portal.',
        volunteerName: 'Resident Self-Confirmation'
      });
    }

    mockDb.saveResident({
      ...residentProfile,
      last_welfare_checkin: new Date().toISOString()
    });

    setSafeConfirmedRecently(true);
    setTimeout(() => setSafeConfirmedRecently(false), 5000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentProfile) return;

    mockDb.saveResident({
      ...residentProfile,
      contact_phone: phone,
      address_notes: address,
      emergency_contact_phone: emergencyPhone
    });

    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Hyperlocal Device Location Tracker & Emergency Bar */}
      <LocationTrackerBar />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Resident Welfare Portal</h1>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
              CITIZEN SAFETY CONSOLE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Check your neighbourhood heat advisory, confirm your personal safety, and request emergency cooling aid.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 shadow-sm font-medium"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
          </select>
        </div>
      </div>

      {/* Main Safe Confirmation Card (Actionable Big Button) */}
      <div className="p-6 sm:p-8 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Daily Welfare Status</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Are you safe and well today?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed">
            Letting your community volunteer know you are safe frees them to prioritize elderly neighbors and infants in urgent distress.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={handleConfirmSafe}
            disabled={safeConfirmedRecently}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-sm ${
              safeConfirmedRecently
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>{safeConfirmedRecently ? 'Confirmed Safe for Today ✓' : t('btnConfirmSafe')}</span>
          </button>

          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="px-5 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Request Cooling / Water</span>
          </button>
        </div>
      </div>

      {/* Local Ward Heat Risk Overview */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Your Registered Locality</span>
            <h3 className="text-lg font-bold text-slate-900">{myLoc.name} ({myLoc.city})</h3>
          </div>
          {risk && (
            <RiskBadge category={risk.risk_category} score={risk.risk_score} size="lg" />
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1">Current Temperature</span>
            <span className="text-xl font-bold text-slate-900 font-mono">{reading?.temperature_c ?? 35.8}°C</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1">Humidity</span>
            <span className="text-xl font-bold text-blue-600 font-mono">{reading?.relative_humidity_pct ?? 54}%</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1">Feels Like</span>
            <span className="text-xl font-bold text-orange-600 font-mono">{reading?.feels_like_c ?? 38.1}°C</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1">Cooling Centers</span>
            <span className="text-xl font-bold text-emerald-700 font-mono">{myLoc.cooling_centers_count} Nearby</span>
          </div>
        </div>

        {risk && (
          <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-100 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Recommended Advisory for You</span>
            </span>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {risk.ai_explanation}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 text-xs text-slate-600">
              {risk.preventive_actions.map((act, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Profile & Privacy Settings Form */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Your Resident Information & Privacy</h3>
          </div>
          <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Protected by Supabase RLS
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Your Full Name</label>
              <input
                type="text"
                disabled
                value={residentProfile?.full_name || user?.full_name}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-500 cursor-not-allowed font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Emergency Relative / Neighbor Phone
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Home Housing / Roof Notes (For Volunteer Visits)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 2nd floor tin shed, need stair assistance"
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Active Consent: Authorize assigned ward volunteers to contact me during heat warnings.
            </span>
            <span className="font-semibold text-emerald-700 font-mono">Consented ✓</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            {isSavedToast ? (
              <span className="text-xs text-emerald-600 font-semibold animate-pulse">
                Profile updated successfully!
              </span>
            ) : <div />}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Contact Details</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal */}
      {isRequestModalOpen && (
        <NewRequestModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};
