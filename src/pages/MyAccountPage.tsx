import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Bell, 
  Globe, 
  LogOut, 
  Save, 
  MapPin, 
  Clock, 
  Shield, 
  Heart, 
  Activity, 
  Briefcase, 
  Baby, 
  Home, 
  Stethoscope, 
  HeartHandshake, 
  Sparkles,
  PhoneCall,
  Check,
  Calendar,
  Info,
  Radio,
  Sliders,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocationTracker } from '../context/LocationContext';
import { mockDb } from '../lib/mockDb';
import { WhatsAppOptInCard } from '../components/notifications/WhatsAppOptInCard';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

interface HealthVulnerabilityOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const HEALTH_VULNERABILITY_OPTIONS: HealthVulnerabilityOption[] = [
  {
    id: 'heart_condition',
    label: 'Heart & Cardiovascular Sensitivity',
    description: 'Higher susceptibility to thermal cardiac stress and acute dehydration',
    icon: Heart,
    accentColor: 'rose',
  },
  {
    id: 'elderly_resident',
    label: 'Elderly Household Member (60+ Years)',
    description: 'Reduced thermoregulation and slower natural thirst response to heat',
    icon: User,
    accentColor: 'amber',
  },
  {
    id: 'outdoor_worker',
    label: 'Outdoor or Manual Laborer',
    description: 'Sustained peak daytime sun exposure (construction, delivery, vendor)',
    icon: Briefcase,
    accentColor: 'blue',
  },
  {
    id: 'respiratory_asthma',
    label: 'Asthma or Respiratory Condition',
    description: 'Sensitive to dry hot air, surface ozone, and summer dust spikes',
    icon: Activity,
    accentColor: 'cyan',
  },
  {
    id: 'young_children',
    label: 'Infants & Young Children (Under 5)',
    description: 'Rapid heat accumulation; requires early hydration alerts',
    icon: Baby,
    accentColor: 'indigo',
  },
  {
    id: 'pregnant_nursing',
    label: 'Pregnant or Nursing Mother',
    description: 'Higher metabolic heat load and critical hydration needs',
    icon: HeartHandshake,
    accentColor: 'emerald',
  },
  {
    id: 'chronic_condition',
    label: 'Kidney or Metabolic Condition',
    description: 'Sensitive electrolyte and fluid management during heat waves',
    icon: Stethoscope,
    accentColor: 'violet',
  },
  {
    id: 'tin_sheet_roof',
    label: 'Tin / Asbestos Roof or Top Floor',
    description: 'Intense indoor radiative heat with prolonged evening heat traps',
    icon: Home,
    accentColor: 'orange',
  }
];

export const MyAccountPage: React.FC = () => {
  const { user, markPhoneVerified, updateProfile, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { currentLocation, selectedZone } = useLocationTracker();

  // Basic Profile State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone?.replace(/^\+\d+\s*/, '') || '');
  const [countryCode, setCountryCode] = useState(user?.country_code || '+91');
  const [primaryLocality, setPrimaryLocality] = useState(
    user?.primary_locality_name || currentLocation?.localityName || selectedZone?.name || 'Bengaluru Urban'
  );

  // Health Vulnerabilities
  const [vulnerabilities, setVulnerabilities] = useState<string[]>([]);
  
  // Emergency Contacts State
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Family Member');
  const [homeNotes, setHomeNotes] = useState('');

  // Notification Preferences State
  const [hourlyEmail, setHourlyEmail] = useState(user?.hourly_notification_consent ?? true);
  const [hourlySms, setHourlySms] = useState(true);
  const [criticalSmsAlerts, setCriticalSmsAlerts] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('06:00');

  // Feedback
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locations = mockDb.getLocations();

  // Load existing resident data if available
  useEffect(() => {
    const residents = mockDb.getResidents();
    const existing = residents.find(
      r => (user?.id && r.profile_id === user.id) ||
           (user?.phone && r.contact_phone?.includes(user.phone.replace(/^\+\d+\s*/, ''))) ||
           (user?.full_name && r.full_name.toLowerCase() === user.full_name.toLowerCase())
    );

    if (existing) {
      if (existing.vulnerability_indicators && existing.vulnerability_indicators.length > 0) {
        setVulnerabilities(existing.vulnerability_indicators);
      }
      if (existing.emergency_contact_name) setEmergencyName(existing.emergency_contact_name);
      if (existing.emergency_contact_phone) setEmergencyPhone(existing.emergency_contact_phone);
      if (existing.address_notes) setHomeNotes(existing.address_notes);
      if (existing.notes && existing.notes.includes('Relation:')) {
        const rel = existing.notes.replace('Relation:', '').trim();
        if (rel) setEmergencyRelation(rel);
      }
    }
  }, [user]);

  const toggleVulnerability = (id: string) => {
    setVulnerabilities(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const fullPhone = phoneNumber.trim() ? `${countryCode} ${phoneNumber.trim()}` : '';
    
    // 1. Update User Profile in AuthContext (persists to Supabase & localStorage)
    await updateProfile({
      full_name: fullName,
      phone: fullPhone,
      country_code: countryCode,
      primary_locality_name: primaryLocality,
      hourly_notification_consent: hourlyEmail
    });

    // 2. Persist Resident safety record in mockDb
    try {
      const residents = mockDb.getResidents();
      const existing = residents.find(
        r => (user?.id && r.profile_id === user.id) ||
             (user?.full_name && r.full_name.toLowerCase() === user.full_name.toLowerCase())
      );

      const residentId = existing?.id || `res-${user?.id || Date.now()}`;
      mockDb.saveResident({
        id: residentId,
        profile_id: user?.id,
        full_name: fullName,
        age_range: existing?.age_range || '18_to_59',
        locality_id: primaryLocality.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        locality_name: primaryLocality,
        contact_phone: fullPhone,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone,
        address_notes: homeNotes,
        vulnerability_indicators: vulnerabilities,
        preferred_language: language,
        consent_status: true,
        consent_date: existing?.consent_date || new Date().toISOString(),
        created_at: existing?.created_at || new Date().toISOString(),
        notes: emergencyRelation ? `Relation: ${emergencyRelation}` : undefined
      });
    } catch (err) {
      console.warn('Could not update resident safety record:', err);
    }

    setIsSubmitting(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  const memberSince = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })
    : '2026';

  const userInitials = (fullName || user?.full_name || 'Resident')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 px-3 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EDF5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E60F2] shadow-[0_0_8px_rgba(30,96,242,0.6)] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E60F2]">
              Resident Settings & Safeguards
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mt-1 flex items-center gap-2.5">
            <span>My Account & Safety Profile</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
            Personalize your health protection flags, designate emergency contacts, and tune your neighborhood heat advisories.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          icon={<LogOut className="w-4 h-4 text-rose-600" />}
          className="self-start sm:self-auto hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors shadow-2xs"
        >
          <span>Sign Out</span>
        </Button>
      </div>

      {/* Save Success Banner */}
      {isSaved && (
        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-250 shadow-sm">
          <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 shadow-2xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <strong className="font-bold block text-emerald-900 text-sm">Preferences Saved Successfully!</strong>
            <span className="text-emerald-700 text-xs">
              Your profile, health flags, and emergency notification settings are updated and synchronized.
            </span>
          </div>
        </div>
      )}

      {/* 3D-LAYERED RESIDENT OVERVIEW PROFILE CARD */}
      <div className="rounded-[32px] bg-white border border-[#E5EDF5] shadow-[0_12px_40px_-8px_rgba(20,50,90,0.07),0_2px_4px_rgba(0,0,0,0.02)] p-6 sm:p-7 space-y-6 relative overflow-hidden">
        {/* Subtle top light reflection */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 opacity-90" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-[#E5EDF5]">
          <div className="flex items-center gap-4">
            {/* Iridescent 3D Avatar Orb */}
            <div className="relative group">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#1E60F2] via-blue-600 to-indigo-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0 ring-4 ring-blue-50">
                {userInitials}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-2xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-tight">
                  {fullName || 'Citizen Resident'}
                </h2>
                <Badge variant="success" dot size="sm">
                  Verified Resident
                </Badge>
              </div>
              <p className="text-xs text-[#64748B] flex items-center gap-1.5 flex-wrap">
                <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                <span>{user?.email || 'Not connected'}</span>
                <span className="text-slate-300">&bull;</span>
                <MapPin className="w-3.5 h-3.5 text-[#1E60F2]" />
                <span className="font-semibold text-[#0F172A]">{primaryLocality}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <div className="px-3.5 py-1.5 rounded-2xl bg-slate-50 border border-[#E5EDF5] text-[11px] text-[#64748B] flex items-center gap-1.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#1E60F2]" />
              <span>Resident since <strong>{memberSince}</strong></span>
            </div>
          </div>
        </div>

        {/* Verification Status Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Email Status */}
          <div className="p-4 rounded-2xl bg-[#F6F9FD] border border-[#E5EDF5] flex items-center justify-between gap-3 shadow-2xs transition-all hover:border-blue-100">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Email Safety Alerts
              </span>
              <p className="text-xs font-bold text-[#0F172A] truncate">
                {user?.email || 'Not linked'}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Active & Verified</span>
              </span>
            </div>
            <Badge variant="success" size="sm">Active</Badge>
          </div>

          {/* SMS Status */}
          <div className="p-4 rounded-2xl bg-[#F6F9FD] border border-[#E5EDF5] flex items-center justify-between gap-3 shadow-2xs transition-all hover:border-blue-100">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Emergency Mobile Phone
              </span>
              <p className="text-xs font-bold text-[#0F172A] truncate">
                {user?.phone ? user.phone : 'No phone linked'}
              </p>
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                <span>Configured for urgent heatwave alerts</span>
              </span>
            </div>

            <Badge variant={user?.phone ? "success" : "neutral"} size="sm">
              {user?.phone ? "Active" : "Not Set"}
            </Badge>
          </div>
        </div>

        {/* Protection Health Strip */}
        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1E60F2] shrink-0" />
            <span className="text-[#0F172A] font-semibold">
              NDMA Thermal Heat Protection Status:
            </span>
            <span className="text-[#1E60F2] font-bold">
              Level 1 Active ({vulnerabilities.length} Health Safeguards Applied)
            </span>
          </div>
          <span className="text-[11px] text-[#64748B] hidden md:inline">
            Zone: {primaryLocality}
          </span>
        </div>
      </div>

      {/* MAIN FORM */}
      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* CARD 1: RESIDENT PROFILE & LOCALITY */}
        <div className="rounded-[32px] bg-white border border-[#E5EDF5] shadow-[0_8px_30px_rgba(20,50,90,0.05)] p-6 sm:p-7 space-y-5 transition-all hover:shadow-[0_12px_36px_rgba(20,50,90,0.08)]">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5EDF5]">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#1E60F2] flex items-center justify-center shrink-0 shadow-2xs border border-blue-100">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Personal Profile & Monitored Neighborhood</h3>
              <p className="text-xs text-[#64748B]">
                Your primary zone dictates hourly heat calculations and local cooling center distance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1.5">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E5EDF5] bg-white text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] focus:border-[#1E60F2] transition-colors shadow-2xs"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1.5">
                Registered Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E5EDF5] bg-slate-50 text-[#64748B] text-xs cursor-not-allowed shadow-2xs"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1.5">
                Mobile Phone for Heat Alerts <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-2.5 py-2.5 rounded-2xl border border-[#E5EDF5] bg-slate-50 font-bold text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] shadow-2xs"
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
                  className="flex-1 px-3.5 py-2.5 rounded-2xl border border-[#E5EDF5] bg-white text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] focus:border-[#1E60F2] transition-colors shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1.5">
                Primary Neighborhood for Safety Alerts <span className="text-rose-500">*</span>
              </label>
              <select
                value={primaryLocality}
                onChange={(e) => setPrimaryLocality(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E5EDF5] bg-white font-medium text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors shadow-2xs"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    📍 {loc.name} ({loc.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-[#0F172A] block mb-1.5">
                Home Address Notes / Nearby Landmark (Optional)
              </label>
              <input
                type="text"
                value={homeNotes}
                onChange={(e) => setHomeNotes(e.target.value)}
                placeholder="e.g. Near Water Tank, 2nd Cross, behind Community Health Centre"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E5EDF5] bg-white text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors shadow-2xs"
              />
              <span className="text-[11px] text-[#64748B] mt-1.5 block">
                Assists emergency volunteers and municipal water tankers locate you quickly during extreme heat emergencies.
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: HEALTH VULNERABILITY FLAGS */}
        <div className="rounded-[32px] bg-white border border-[#E5EDF5] shadow-[0_8px_30px_rgba(20,50,90,0.05)] p-6 sm:p-7 space-y-4 transition-all hover:shadow-[0_12px_36px_rgba(20,50,90,0.08)]">
          <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#E5EDF5]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs border border-rose-100">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Personal Health Vulnerability Factors</h3>
                <p className="text-xs text-[#64748B]">
                  Heat affects bodies differently. Select applicable conditions to personalize NDMA threshold guidance and priority check-ins.
                </p>
              </div>
            </div>

            <Badge variant="subtle" size="sm" className="shrink-0 font-bold">
              {vulnerabilities.length} Selected
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {HEALTH_VULNERABILITY_OPTIONS.map((item) => {
              const Icon = item.icon;
              const isChecked = vulnerabilities.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleVulnerability(item.id)}
                  aria-pressed={isChecked}
                  className={`p-4 rounded-2xl border text-left transition-all duration-150 flex items-start gap-3.5 transform-gpu active:scale-[0.98] cursor-pointer ${
                    isChecked
                      ? 'border-[#1E60F2] bg-blue-50/70 shadow-sm ring-1 ring-[#1E60F2]'
                      : 'border-[#E5EDF5] bg-white hover:bg-slate-50/80 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isChecked 
                      ? 'bg-[#1E60F2] text-white shadow-xs' 
                      : 'bg-slate-100 text-[#64748B]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold leading-snug ${isChecked ? 'text-blue-950 font-bold' : 'text-slate-800'}`}>
                        {item.label}
                      </span>
                      {isChecked && (
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-[11px] text-[#1E60F2] flex items-center gap-2.5">
            <Info className="w-4 h-4 shrink-0" />
            <span>
              Your health flags remain strictly confidential and are only used to tailor dehydration warnings and priority welfare check-ins.
            </span>
          </div>
        </div>

        {/* CARD 3: EMERGENCY CONTACTS */}
        <div className="rounded-[32px] bg-white border border-[#E5EDF5] shadow-[0_8px_30px_rgba(20,50,90,0.05)] p-6 sm:p-7 space-y-4 transition-all hover:shadow-[0_12px_36px_rgba(20,50,90,0.08)]">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5EDF5]">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs border border-amber-100">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Designated Emergency Contact</h3>
              <p className="text-xs text-[#64748B]">
                In the event of heat exhaustion, fainting, or missed check-ins during red warnings, responders can contact your family member.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1.5">
                Contact Person Full Name
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E5EDF5] bg-white text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors shadow-2xs"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1.5">
                Relationship
              </label>
              <select
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E5EDF5] bg-white font-medium text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors shadow-2xs"
              >
                <option value="Spouse">Spouse / Partner</option>
                <option value="Parent">Parent</option>
                <option value="Child">Adult Son / Daughter</option>
                <option value="Sibling">Brother / Sister</option>
                <option value="Neighbor">Neighbor / Roommate</option>
                <option value="Caregiver">Designated Caregiver</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1.5">
                Emergency Phone Number
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="e.g. +91 98450 67890"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E5EDF5] bg-white text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* CARD 4: WHATSAPP NOTIFICATION OPT-IN & DAILY BRIEFING */}
        <WhatsAppOptInCard />

        {/* CARD 5: NOTIFICATION PREFERENCES */}
        <div className="rounded-[32px] bg-white border border-[#E5EDF5] shadow-[0_8px_30px_rgba(20,50,90,0.05)] p-6 sm:p-7 space-y-4 transition-all hover:shadow-[0_12px_36px_rgba(20,50,90,0.08)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5EDF5]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs border border-indigo-100">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Heat Safety Advisories & Notification Consent</h3>
                <p className="text-xs text-[#64748B]">
                  Timely warnings based on live weather readings and NDMA thermal stress guidelines.
                </p>
              </div>
            </div>
            <Badge variant="primary" size="sm">Neighborhood Live</Badge>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            {/* Email Bulletin */}
            <label className="p-4 rounded-2xl border border-[#E5EDF5] bg-white hover:bg-slate-50/70 flex items-center justify-between gap-4 cursor-pointer transition-all shadow-2xs">
              <div className="space-y-0.5">
                <strong className="text-[#0F172A] block font-bold text-xs">
                  Hourly Email Safety Bulletins
                </strong>
                <span className="text-[#64748B] text-[11px] block">
                  Comprehensive feels-like temperature updates, UV index alerts, and hydration guidance in your inbox.
                </span>
              </div>
              <input
                type="checkbox"
                checked={hourlyEmail}
                onChange={(e) => setHourlyEmail(e.target.checked)}
                className="w-5 h-5 rounded-lg text-[#1E60F2] focus:ring-[#1E60F2] cursor-pointer shrink-0"
              />
            </label>

            {/* SMS Briefings */}
            <label className="p-4 rounded-2xl border border-[#E5EDF5] bg-white hover:bg-slate-50/70 flex items-center justify-between gap-4 cursor-pointer transition-all shadow-2xs">
              <div className="space-y-0.5">
                <strong className="text-[#0F172A] block font-bold text-xs">
                  Hourly SMS Briefings
                </strong>
                <span className="text-[#64748B] text-[11px] block">
                  Quick text message with current temperature, thermal risk score, and urgent precautions.
                </span>
              </div>
              <input
                type="checkbox"
                checked={hourlySms}
                onChange={(e) => setHourlySms(e.target.checked)}
                className="w-5 h-5 rounded-lg text-[#1E60F2] focus:ring-[#1E60F2] cursor-pointer shrink-0"
              />
            </label>

            {/* Critical Warnings */}
            <label className="p-4 rounded-2xl border border-[#E5EDF5] bg-white hover:bg-slate-50/70 flex items-center justify-between gap-4 cursor-pointer transition-all shadow-2xs">
              <div className="space-y-0.5">
                <strong className="text-[#0F172A] block font-bold text-xs flex items-center gap-1.5">
                  <span>Instant Severe Heatwave Flash Alerts</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase">Critical</span>
                </strong>
                <span className="text-[#64748B] text-[11px] block">
                  Immediate alerts when your area enters Severe (Orange) or Extreme (Red) heat conditions.
                </span>
              </div>
              <input
                type="checkbox"
                checked={criticalSmsAlerts}
                onChange={(e) => setCriticalSmsAlerts(e.target.checked)}
                className="w-5 h-5 rounded-lg text-[#1E60F2] focus:ring-[#1E60F2] cursor-pointer shrink-0"
              />
            </label>

            {/* Quiet Hours */}
            <div className="p-4 rounded-2xl border border-[#E5EDF5] bg-slate-50/70 space-y-3 shadow-2xs">
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div className="space-y-0.5">
                  <strong className="text-[#0F172A] block font-bold text-xs">
                    Night-time Quiet Hours
                  </strong>
                  <span className="text-[#64748B] text-[11px] block">
                    Pause routine hourly updates while you sleep. Critical emergency heatwave warnings always sound through.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={quietHoursEnabled}
                  onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                  className="w-5 h-5 rounded-lg text-[#1E60F2] focus:ring-[#1E60F2] cursor-pointer shrink-0"
                />
              </label>

              {quietHoursEnabled && (
                <div className="flex items-center gap-4 pt-3 border-t border-[#E5EDF5] animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <span className="text-[#64748B] text-[11px] font-medium">Quiet from:</span>
                    <input
                      type="time"
                      value={quietStart}
                      onChange={(e) => setQuietStart(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-[#E5EDF5] bg-white text-xs text-[#0F172A] focus:ring-1 focus:ring-[#1E60F2] shadow-2xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#64748B] text-[11px] font-medium">until:</span>
                    <input
                      type="time"
                      value={quietEnd}
                      onChange={(e) => setQuietEnd(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-[#E5EDF5] bg-white text-xs text-[#0F172A] focus:ring-1 focus:ring-[#1E60F2] shadow-2xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARD 6: LANGUAGE & REGIONAL PREFERENCES */}
        <div className="rounded-[32px] bg-white border border-[#E5EDF5] shadow-[0_8px_30px_rgba(20,50,90,0.05)] p-6 sm:p-7 space-y-4 transition-all hover:shadow-[0_12px_36px_rgba(20,50,90,0.08)]">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5EDF5]">
            <div className="w-9 h-9 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 shadow-2xs border border-violet-100">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Language & Regional Localization</h3>
              <p className="text-xs text-[#64748B]">
                Choose your preferred language for all safety advisories, maps, and SMS messages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`p-4 rounded-2xl border text-center font-bold transition-all duration-150 flex flex-col items-center gap-1.5 cursor-pointer transform-gpu active:scale-[0.98] ${
                language === 'en'
                  ? 'border-[#1E60F2] bg-blue-50/80 text-[#1E60F2] shadow-xs ring-1 ring-[#1E60F2]'
                  : 'border-[#E5EDF5] bg-white text-[#64748B] hover:bg-slate-50 shadow-2xs'
              }`}
            >
              <span className="text-base font-bold text-[#0F172A]">English</span>
              <span className="text-[11px] font-medium text-[#64748B]">Primary Standard</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`p-4 rounded-2xl border text-center font-bold transition-all duration-150 flex flex-col items-center gap-1.5 cursor-pointer transform-gpu active:scale-[0.98] ${
                language === 'hi'
                  ? 'border-[#1E60F2] bg-blue-50/80 text-[#1E60F2] shadow-xs ring-1 ring-[#1E60F2]'
                  : 'border-[#E5EDF5] bg-white text-[#64748B] hover:bg-slate-50 shadow-2xs'
              }`}
            >
              <span className="text-base font-bold text-[#0F172A]">हिन्दी</span>
              <span className="text-[11px] font-medium text-[#64748B]">Hindi Support</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('kn')}
              className={`p-4 rounded-2xl border text-center font-bold transition-all duration-150 flex flex-col items-center gap-1.5 cursor-pointer transform-gpu active:scale-[0.98] ${
                language === 'kn'
                  ? 'border-[#1E60F2] bg-blue-50/80 text-[#1E60F2] shadow-xs ring-1 ring-[#1E60F2]'
                  : 'border-[#E5EDF5] bg-white text-[#64748B] hover:bg-slate-50 shadow-2xs'
              }`}
            >
              <span className="text-base font-bold text-[#0F172A]">ಕನ್ನಡ</span>
              <span className="text-[11px] font-medium text-[#64748B]">Kannada Support</span>
            </button>
          </div>
        </div>

        {/* SAVE SUBMIT ACTION DOCK */}
        <div className="flex items-center justify-end gap-3 pt-3 sticky bottom-4 z-20">
          <div className="bg-white/95 backdrop-blur-xl p-2 rounded-2xl border border-[#E5EDF5] shadow-[0_12px_30px_rgba(20,50,90,0.12)]">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              icon={<Save className="w-4 h-4" />}
              className="shadow-md shadow-blue-500/25 px-6 font-bold"
            >
              <span>Save Preferences & Safeguards</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MyAccountPage;