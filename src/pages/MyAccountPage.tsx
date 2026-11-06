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
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocationTracker } from '../context/LocationContext';
import { mockDb } from '../lib/mockDb';
import { PhoneVerificationModal } from '../components/auth/PhoneVerificationModal';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

interface HealthVulnerabilityOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const HEALTH_VULNERABILITY_OPTIONS: HealthVulnerabilityOption[] = [
  {
    id: 'heart_condition',
    label: 'Heart & Cardiovascular Sensitivity',
    description: 'Higher susceptibility to thermal cardiac stress and dehydration',
    icon: Heart
  },
  {
    id: 'elderly_resident',
    label: 'Elderly Household Member (60+ Years)',
    description: 'Reduced thermoregulation and slower heat-warning response',
    icon: User
  },
  {
    id: 'outdoor_worker',
    label: 'Outdoor or Manual Laborer',
    description: 'Sustained peak daytime sun exposure (construction, delivery, vendor)',
    icon: Briefcase
  },
  {
    id: 'respiratory_asthma',
    label: 'Asthma or Respiratory Condition',
    description: 'Sensitive to dry hot air, surface ozone, and summer dust spikes',
    icon: Activity
  },
  {
    id: 'young_children',
    label: 'Infants & Young Children (Under 5)',
    description: 'Rapid heat accumulation; requires early hydration alerts',
    icon: Baby
  },
  {
    id: 'pregnant_nursing',
    label: 'Pregnant or Nursing Mother',
    description: 'Higher metabolic heat load and critical hydration needs',
    icon: HeartHandshake
  },
  {
    id: 'chronic_condition',
    label: 'Kidney or Metabolic Condition',
    description: 'Sensitive electrolyte and fluid management during heat waves',
    icon: Stethoscope
  },
  {
    id: 'tin_sheet_roof',
    label: 'Tin / Asbestos Roof or Top Floor',
    description: 'Intense indoor radiative heat with prolonged evening heat traps',
    icon: Home
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

  // Modals & Feedback
  const [showPhoneVerifyModal, setShowPhoneVerifyModal] = useState(false);
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
    <div className="max-w-4xl mx-auto space-y-6 pb-24 px-4 sm:px-6">
      {/* Phone OTP Verification Modal */}
      <PhoneVerificationModal
        isOpen={showPhoneVerifyModal}
        onClose={() => setShowPhoneVerifyModal(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EDF5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E60F2]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1E60F2]">
              Resident Settings & Safeguards
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mt-1 flex items-center gap-2.5">
            <span>My Account & Safety Profile</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Personalize your health protection flags, designate emergency contacts, and tune your neighborhood heat advisories.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          icon={<LogOut className="w-4 h-4 text-rose-600" />}
          className="self-start sm:self-auto hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
        >
          <span>Sign Out</span>
        </Button>
      </div>

      {/* Save Success Banner */}
      {isSaved && (
        <div className="p-4 rounded-[20px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in duration-200 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <strong className="font-semibold block text-emerald-900">Preferences Saved Successfully!</strong>
            <span className="text-emerald-700 text-xs">
              Your profile, health flags, and emergency notification settings are updated and synchronized.
            </span>
          </div>
        </div>
      )}

      {/* RESIDENT OVERVIEW PROFILE CARD */}
      <Card padding="lg" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-[#E5EDF5]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E60F2] to-blue-700 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              {userInitials}
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
              <p className="text-xs text-[#64748B] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                <span>{user?.email || 'Not connected'}</span>
                <span className="text-slate-300">&bull;</span>
                <MapPin className="w-3.5 h-3.5 text-[#1E60F2]" />
                <span className="font-medium text-[#0F172A]">{primaryLocality}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-[#E5EDF5] text-[11px] text-[#64748B] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1E60F2]" />
              <span>Resident since <strong>{memberSince}</strong></span>
            </div>
          </div>
        </div>

        {/* Verification Status Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Email Status */}
          <div className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                Email Safety Alerts
              </span>
              <p className="text-xs font-semibold text-[#0F172A] truncate">
                {user?.email || 'Not linked'}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Active & Verified</span>
              </span>
            </div>
            <Badge variant="success" size="sm">Active</Badge>
          </div>

          {/* SMS Status */}
          <div className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                Emergency Mobile SMS
              </span>
              <p className="text-xs font-semibold text-[#0F172A] truncate">
                {user?.phone ? user.phone : 'No phone linked'}
              </p>
              {user?.is_phone_verified ? (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>SMS OTP Verified</span>
                </span>
              ) : (
                <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Verification Recommended</span>
                </span>
              )}
            </div>

            {user?.is_phone_verified ? (
              <Badge variant="success" size="sm">Verified</Badge>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowPhoneVerifyModal(true)}
                className="shrink-0 text-xs"
              >
                Verify Phone
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* MAIN FORM */}
      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* RESIDENT PROFILE & LOCALITY */}
        <Card padding="lg" className="space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EDF5]">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center shrink-0">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EDF5] bg-white text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EDF5] bg-slate-50 text-[#64748B] text-xs cursor-not-allowed"
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
                  className="px-2.5 py-2.5 rounded-xl border border-[#E5EDF5] bg-slate-50 font-semibold text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
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
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5EDF5] bg-white text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EDF5] bg-white font-medium text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EDF5] bg-white text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors"
              />
              <span className="text-[11px] text-[#64748B] mt-1 block">
                Assists emergency volunteers and municipal water tankers locate you quickly during extreme heat emergencies.
              </span>
            </div>
          </div>
        </Card>

        {/* HEALTH VULNERABILITY FLAGS */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#E5EDF5]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Personal Health Vulnerability Factors</h3>
                <p className="text-xs text-[#64748B]">
                  Heat affects bodies differently. Select applicable conditions to personalize NDMA threshold guidance and priority check-ins.
                </p>
              </div>
            </div>

            <Badge variant="subtle" size="sm">
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
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    isChecked
                      ? 'border-[#1E60F2] bg-blue-50/60 shadow-xs ring-1 ring-[#1E60F2]'
                      : 'border-[#E5EDF5] bg-white hover:bg-slate-50/60 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isChecked ? 'bg-[#1E60F2] text-white' : 'bg-slate-100 text-[#64748B]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold ${isChecked ? 'text-[#0F172A]' : 'text-slate-800'}`}>
                        {item.label}
                      </span>
                      {isChecked && (
                        <Check className="w-3.5 h-3.5 text-[#1E60F2] shrink-0 font-bold" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-[11px] text-[#1E60F2] flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>
              Your health flags remain strictly confidential and are only used to tailor dehydration warnings and priority welfare check-ins.
            </span>
          </div>
        </Card>

        {/* EMERGENCY CONTACTS */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EDF5]">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EDF5] bg-white text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1.5">
                Relationship
              </label>
              <select
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EDF5] bg-white font-medium text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EDF5] bg-white text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors"
              />
            </div>
          </div>
        </Card>

        {/* NOTIFICATION PREFERENCES */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5EDF5]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center shrink-0">
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
            <label className="p-3.5 rounded-2xl border border-[#E5EDF5] bg-white hover:bg-slate-50/50 flex items-center justify-between gap-4 cursor-pointer transition-all">
              <div className="space-y-0.5">
                <strong className="text-[#0F172A] block font-semibold text-xs">
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
                className="w-5 h-5 rounded text-[#1E60F2] focus:ring-[#1E60F2] cursor-pointer shrink-0"
              />
            </label>

            {/* SMS Briefings */}
            <label className="p-3.5 rounded-2xl border border-[#E5EDF5] bg-white hover:bg-slate-50/50 flex items-center justify-between gap-4 cursor-pointer transition-all">
              <div className="space-y-0.5">
                <strong className="text-[#0F172A] block font-semibold text-xs">
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
                className="w-5 h-5 rounded text-[#1E60F2] focus:ring-[#1E60F2] cursor-pointer shrink-0"
              />
            </label>

            {/* Critical Warnings */}
            <label className="p-3.5 rounded-2xl border border-[#E5EDF5] bg-white hover:bg-slate-50/50 flex items-center justify-between gap-4 cursor-pointer transition-all">
              <div className="space-y-0.5">
                <strong className="text-[#0F172A] block font-semibold text-xs">
                  Instant Severe Heatwave Flash Alerts
                </strong>
                <span className="text-[#64748B] text-[11px] block">
                  Immediate alerts when your area enters Severe (Orange) or Extreme (Red) heat conditions.
                </span>
              </div>
              <input
                type="checkbox"
                checked={criticalSmsAlerts}
                onChange={(e) => setCriticalSmsAlerts(e.target.checked)}
                className="w-5 h-5 rounded text-[#1E60F2] focus:ring-[#1E60F2] cursor-pointer shrink-0"
              />
            </label>

            {/* Quiet Hours */}
            <div className="p-3.5 rounded-2xl border border-[#E5EDF5] bg-slate-50/60 space-y-3">
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div className="space-y-0.5">
                  <strong className="text-[#0F172A] block font-semibold text-xs">
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
                  className="w-5 h-5 rounded text-[#1E60F2] focus:ring-[#1E60F2] cursor-pointer shrink-0"
                />
              </label>

              {quietHoursEnabled && (
                <div className="flex items-center gap-4 pt-2.5 border-t border-[#E5EDF5]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#64748B] text-[11px] font-medium">Quiet from:</span>
                    <input
                      type="time"
                      value={quietStart}
                      onChange={(e) => setQuietStart(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-[#E5EDF5] bg-white text-xs text-[#0F172A] focus:ring-1 focus:ring-[#1E60F2]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#64748B] text-[11px] font-medium">until:</span>
                    <input
                      type="time"
                      value={quietEnd}
                      onChange={(e) => setQuietEnd(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-[#E5EDF5] bg-white text-xs text-[#0F172A] focus:ring-1 focus:ring-[#1E60F2]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* LANGUAGE & REGIONAL PREFERENCES */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EDF5]">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center shrink-0">
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
              className={`p-4 rounded-2xl border text-center font-bold transition-all flex flex-col items-center gap-1 ${
                language === 'en'
                  ? 'border-[#1E60F2] bg-blue-50 text-[#1E60F2] shadow-xs ring-1 ring-[#1E60F2]'
                  : 'border-[#E5EDF5] bg-white text-[#64748B] hover:bg-slate-50'
              }`}
            >
              <span className="text-base font-bold text-[#0F172A]">English</span>
              <span className="text-[11px] font-medium text-[#64748B]">Primary Standard</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`p-4 rounded-2xl border text-center font-bold transition-all flex flex-col items-center gap-1 ${
                language === 'hi'
                  ? 'border-[#1E60F2] bg-blue-50 text-[#1E60F2] shadow-xs ring-1 ring-[#1E60F2]'
                  : 'border-[#E5EDF5] bg-white text-[#64748B] hover:bg-slate-50'
              }`}
            >
              <span className="text-base font-bold text-[#0F172A]">हिन्दी</span>
              <span className="text-[11px] font-medium text-[#64748B]">Hindi Support</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('kn')}
              className={`p-4 rounded-2xl border text-center font-bold transition-all flex flex-col items-center gap-1 ${
                language === 'kn'
                  ? 'border-[#1E60F2] bg-blue-50 text-[#1E60F2] shadow-xs ring-1 ring-[#1E60F2]'
                  : 'border-[#E5EDF5] bg-white text-[#64748B] hover:bg-slate-50'
              }`}
            >
              <span className="text-base font-bold text-[#0F172A]">ಕನ್ನಡ</span>
              <span className="text-[11px] font-medium text-[#64748B]">Kannada Support</span>
            </button>
          </div>
        </Card>

        {/* SAVE SUBMIT BUTTON */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            icon={<Save className="w-4 h-4" />}
            className="shadow-md shadow-blue-500/20"
          >
            <span>Save Preferences & Safeguards</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MyAccountPage;
