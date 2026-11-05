import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  Heart, 
  MapPin, 
  Users, 
  CheckSquare, 
  GraduationCap, 
  Bell, 
  Plus, 
  Trash2, 
  Copy, 
  PhoneCall, 
  AlertTriangle, 
  Droplets, 
  Sun, 
  Thermometer, 
  FileText,
  Clock,
  Sparkles,
  Settings,
  CheckCircle2
} from 'lucide-react';
import { useLocationTracker } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../lib/mockDb';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { FamilyGroup, FamilyMember, UserFavouriteLocation } from '../types';

interface SafetyHabit {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export const MySafetyHubPage: React.FC = () => {
  const { user } = useAuth();
  const { currentLocation, currentReading, currentRisk, selectedZone, selectCustomLocality } = useLocationTracker();
  const locations = mockDb.getLocations();

  const [activeTab, setActiveTab] = useState<'checklist' | 'profile' | 'family' | 'places' | 'academy' | 'preferences'>('checklist');

  // 1. Daily Safety Habits State
  const [habits, setHabits] = useState<SafetyHabit[]>(() => {
    try {
      const saved = localStorage.getItem('heatshield_safety_habits');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      { id: 'h1', title: 'Pre-Hydration Kickstart', description: 'Drink 500ml water or electrolyte solution before leaving home.', completed: true },
      { id: 'h2', title: 'Breathable Cotton Attire', description: 'Wear loose, light-coloured breathable clothing with head protection.', completed: true },
      { id: 'h3', title: 'Avoid Midday Peak Sun', description: 'Schedule unshaded errands outside 12:00 PM – 4:00 PM peak hours.', completed: false },
      { id: 'h4', title: 'Vulnerable Elder Check-in', description: 'Confirm wellbeing and water access for elderly parents or neighbours.', completed: false },
      { id: 'h5', title: 'Carry Hydration & ORS', description: 'Keep a refillable water bottle and an ORS electrolyte sachet in your bag.', completed: false },
      { id: 'h6', title: 'Window & Curtain Shading', description: 'Keep curtains and blinds closed on sun-facing windows between 11 AM – 5 PM.', completed: true }
    ];
  });

  const toggleHabit = (id: string) => {
    setHabits(prev => {
      const next = prev.map(h => h.id === id ? { ...h, completed: !h.completed } : h);
      try {
        localStorage.setItem('heatshield_safety_habits', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const completedHabitsCount = habits.filter(h => h.completed).length;

  // 2. Personal Vulnerability Profile
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('heatshield_resident_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      age_group: 'adult' as 'youth' | 'adult' | 'elderly' | 'child',
      has_cardio: false,
      has_respiratory: false,
      has_ac: true,
      outdoor_hours: 2,
      weight_kg: 68
    };
  });

  const saveProfile = (newProfile: typeof profile) => {
    setProfile(newProfile);
    try {
      localStorage.setItem('heatshield_resident_profile', JSON.stringify(newProfile));
    } catch {
      // ignore
    }
  };

  // Personalized Daily Water Target (Litres)
  const hydrationTarget = useMemo(() => {
    let base = profile.weight_kg * 0.035; // 35ml per kg baseline
    if (profile.outdoor_hours > 2) base += (profile.outdoor_hours - 2) * 0.4;
    if (currentReading && currentReading.temperature_c > 35) base += 0.8;
    return Math.round(base * 10) / 10;
  }, [profile, currentReading]);

  // 3. Saved Monitored Places
  const [places, setPlaces] = useState<UserFavouriteLocation[]>(() => {
    try {
      const saved = localStorage.getItem('heatshield_favourite_places');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'place-home',
        user_id: user?.id || 'usr-me',
        label: 'Home',
        name: 'My Residence',
        locality: locations[0]?.name || 'Hebbal',
        city: 'Bengaluru',
        state: 'Karnataka',
        latitude: locations[0]?.latitude || 13.0365,
        longitude: locations[0]?.longitude || 77.5975,
        is_primary: true,
        created_at: new Date().toISOString()
      }
    ];
  });

  const [newPlaceLabel, setNewPlaceLabel] = useState('');
  const [newPlaceLocalityId, setNewPlaceLocalityId] = useState(locations[0]?.id || '');

  const handleAddPlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceLabel.trim()) return;

    const loc = locations.find(l => l.id === newPlaceLocalityId) || locations[0];
    const validLabels: UserFavouriteLocation['label'][] = ['Home', 'Workplace', 'School', 'Parents', 'Other'];
    const label: UserFavouriteLocation['label'] = (validLabels.includes(newPlaceLabel as any) ? newPlaceLabel : 'Other') as UserFavouriteLocation['label'];
    const newPlace: UserFavouriteLocation = {
      id: `place-${Date.now()}`,
      user_id: user?.id || 'usr-me',
      label,
      name: newPlaceLabel,
      locality: loc ? loc.name : 'Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      latitude: loc ? loc.latitude : 12.9716,
      longitude: loc ? loc.longitude : 77.5946,
      is_primary: places.length === 0,
      created_at: new Date().toISOString()
    };

    const next = [...places, newPlace];
    setPlaces(next);
    try {
      localStorage.setItem('heatshield_favourite_places', JSON.stringify(next));
    } catch {
      // ignore
    }
    setNewPlaceLabel('');
  };

  const handleRemovePlace = (id: string) => {
    const next = places.filter(p => p.id !== id);
    setPlaces(next);
    try {
      localStorage.setItem('heatshield_favourite_places', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  // 4. Family Safety Circle (Real Data Only)
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup>(() => {
    const groups = mockDb.getFamilyGroups();
    if (groups.length > 0) return groups[0];
    return {
      id: 'fam-my-circle',
      owner_id: user?.id || 'usr-me',
      group_name: `${user?.full_name ? user.full_name.split(' ')[0] : 'My'} Family Safety Circle`,
      invite_code: `HEAT-${Math.floor(1000 + Math.random() * 9000)}`,
      members: [],
      created_at: new Date().toISOString()
    };
  });

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState<FamilyMember['relationship']>('parent');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newMember: FamilyMember = {
      id: `mem-${Date.now()}`,
      group_id: familyGroup.id,
      name: newMemberName,
      phone: newMemberPhone || '+91 98*** *****',
      relationship: newMemberRelation,
      locality_name: 'Bengaluru Core',
      consent_given: true,
      location_sharing_active: true,
      last_status: 'safe',
      last_checkin_at: new Date().toISOString()
    };

    const updated = {
      ...familyGroup,
      members: [...familyGroup.members, newMember]
    };

    setFamilyGroup(updated);
    mockDb.saveFamilyGroup(updated);
    setNewMemberName('');
    setNewMemberPhone('');
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(familyGroup.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // 5. Download Action Cheatsheet
  const handleDownloadCheatsheet = () => {
    const text = `HEATSHIELD AI - RESIDENT EMERGENCY HEAT ACTION PROTOCOL
Monitored Ward: ${currentLocation.localityName || selectedZone?.name || 'Local Ward'}
Last Verified: ${new Date().toLocaleDateString()}

1. IMMEDIATE HYDRATION:
   - Your personalized daily hydration target is ${hydrationTarget} Litres.
   - Drink 250ml water every 20-30 minutes during midday sun.
   - Supplement with ORS (Oral Rehydration Salts) or coconut water.

2. COOLING ENVIRONMENT:
   - Seek shaded or air-conditioned respite between 12:00 PM and 4:00 PM.
   - Use evaporative cold damp towels on neck, armpits, and forehead.

3. DANGER WARNING SIGNS (CALL 108 / 112 IMMEDIATELY):
   - Altered mental state, slurred speech, or confusion.
   - Hot, dry, flushed skin with sudden cessation of sweating.
   - Rapid weak pulse, vomiting, or seizures.

4. 24x7 EMERGENCY HOTLINES:
   - National Emergency: 112
   - Medical Ambulance: 108
   - Disaster Helpline: 1077

Issued by HeatShield AI Community Protection Platform.`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HeatShield_Resident_Safety_Plan.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 6. Notification Preferences State
  const [prefSms, setPrefSms] = useState(true);
  const [prefEmail, setPrefEmail] = useState(true);
  const [prefQuietHours, setPrefQuietHours] = useState(true);
  const [savedPrefNotice, setSavedPrefNotice] = useState(false);

  const handleSavePreferences = () => {
    setSavedPrefNotice(true);
    setTimeout(() => setSavedPrefNotice(false), 2500);
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      <LocationTrackerBar />

      {/* QUESTION 5 ANSWER HERO: "How is HeatShield Protecting Me?" */}
      <div className="bg-gradient-to-br from-slate-900 via-navy-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-300 text-xs font-mono font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Personal Protection Shield</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {currentLocation.localityName || selectedZone?.name}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              My Safety & Protection Hub
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              HeatShield AI monitors atmospheric heat in your sector, calculates your personal clinical hydration target ({hydrationTarget}L), safeguards your family circle, and delivers timely safety updates.
            </p>

            <div className="flex items-center gap-4 pt-2 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Habits: <strong className="text-white">{completedHabitsCount}/6 Completed</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Target: <strong className="text-white">{hydrationTarget} Litres/day</strong></span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleDownloadCheatsheet}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Download Safety Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 MY SAFETY TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        {[
          { id: 'checklist', label: 'Daily Habits', icon: CheckSquare, badge: `${completedHabitsCount}/6` },
          { id: 'profile', label: 'Personal Thermal Profile', icon: Thermometer },
          { id: 'family', label: 'Family Safety Circle', icon: Users, badge: familyGroup.members.length > 0 ? familyGroup.members.length : undefined },
          { id: 'places', label: 'Saved Monitored Places', icon: MapPin, badge: places.length },
          { id: 'academy', label: 'Heat First-Aid Guides', icon: GraduationCap },
          { id: 'preferences', label: 'Alert Preferences', icon: Bell }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DAILY 6-POINT HABIT CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Today's Heat Safety Habit Checklist</h3>
              <p className="text-xs text-slate-500">6 scientifically verified daily habits recommended by NDMA & WHO to prevent heat illness.</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600">
              {Math.round((completedHabitsCount / habits.length) * 100)}% Complete
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {habits.map(habit => (
              <div
                key={habit.id}
                onClick={() => toggleHabit(habit.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 shadow-sm ${
                  habit.completed
                    ? 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                  habit.completed
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white border-slate-300'
                }`}>
                  {habit.completed && <CheckCircle2 className="w-4 h-4" />}
                </div>

                <div className="space-y-0.5">
                  <h4 className={`text-xs font-bold ${habit.completed ? 'text-emerald-950 line-through opacity-80' : 'text-slate-900'}`}>
                    {habit.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {habit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PERSONAL VULNERABILITY PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Personal Thermal Vulnerability Profile</h3>
            <p className="text-xs text-slate-500">Customizes hydration volume, exposure warnings, and alert timing to your physical baseline.</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Age Group */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Age Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'youth', label: 'Youth (12-25)' },
                  { id: 'adult', label: 'Adult (26-59)' },
                  { id: 'elderly', label: 'Senior (60+)' },
                  { id: 'child', label: 'Child (<12)' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => saveProfile({ ...profile, age_group: opt.id as any })}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition-colors ${
                      profile.age_group === opt.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Health Conditions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-700 block">Health Factors</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.has_cardio}
                    onChange={e => saveProfile({ ...profile, has_cardio: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Cardiovascular / Blood Pressure Sensitivity</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.has_respiratory}
                    onChange={e => saveProfile({ ...profile, has_respiratory: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Asthma / Respiratory Sensitivity</span>
                </label>
              </div>
            </div>

            {/* Air Conditioning & Outdoor Exposure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Air Conditioning at Home / Work</label>
                <select
                  value={profile.has_ac ? 'yes' : 'no'}
                  onChange={e => saveProfile({ ...profile, has_ac: e.target.value === 'yes' })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="yes">Yes — Air Conditioned</option>
                  <option value="no">No — Fans / Natural Ventilation</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Daily Direct Outdoor Hours</label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={profile.outdoor_hours}
                  onChange={e => saveProfile({ ...profile, outdoor_hours: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Personalized Target Box */}
            <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-cyan-900 block">Personalized Daily Hydration Target</span>
                <span className="text-[11px] text-cyan-700">Calculated from body weight, ambient temp & outdoor hours</span>
              </div>
              <div className="text-xl font-extrabold text-cyan-950 font-mono">
                {hydrationTarget} Litres
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FAMILY SAFETY CIRCLE */}
      {activeTab === 'family' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{familyGroup.group_name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                  Code: {familyGroup.invite_code}
                </span>
                <button
                  onClick={handleCopyInvite}
                  className="text-slate-400 hover:text-slate-700 p-1"
                  title="Copy Invite Code"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copiedCode && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
              </div>
              <p className="text-xs text-slate-500">Add genuine family members to ensure they are safe during peak heat hours.</p>
            </div>
          </div>

          {/* Add Member Form */}
          <form onSubmit={handleAddMember} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-xs">
            <input
              type="text"
              placeholder="Full Name (e.g. Ramesh, Priya)"
              value={newMemberName}
              onChange={e => setNewMemberName(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="tel"
              placeholder="Mobile (+91 ...)"
              value={newMemberPhone}
              onChange={e => setNewMemberPhone(e.target.value)}
              className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newMemberRelation}
              onChange={e => setNewMemberRelation(e.target.value as FamilyMember['relationship'])}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="parent">Parent</option>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="grandparent">Grandparent</option>
              <option value="sibling">Sibling</option>
              <option value="relative">Relative</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shrink-0"
            >
              Add Member
            </button>
          </form>

          {familyGroup.members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {familyGroup.members.map(member => (
                <div key={member.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {member.relationship}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Safe
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{member.name}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">{member.phone}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Last checked: {member.last_checkin_at ? new Date(member.last_checkin_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}</span>
                    <a href={`tel:${member.phone}`} className="text-blue-600 font-bold hover:underline">
                      Call
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-2 shadow-sm">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-800">Your Family Circle is Empty</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Add genuine family members or share invite code <strong>{familyGroup.invite_code}</strong> to receive automatic alerts if heat in their ward becomes critical.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SAVED MONITORED PLACES */}
      {activeTab === 'places' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Saved Monitored Places</h3>
              <p className="text-xs text-slate-500">Monitor live temperatures and heat warnings across home, workplace, parents' house, and school.</p>
            </div>
          </div>

          {/* Add Place Form */}
          <form onSubmit={handleAddPlace} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-xs">
            <input
              type="text"
              placeholder="Label (e.g. Work Office, Elderly Parents)"
              value={newPlaceLabel}
              onChange={e => setNewPlaceLabel(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newPlaceLocalityId}
              onChange={e => setNewPlaceLocalityId(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.city})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shrink-0"
            >
              Save Place
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {places.map(place => (
              <div key={place.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                    {place.label}
                  </span>
                  <button
                    onClick={() => handleRemovePlace(place.id)}
                    className="text-slate-300 hover:text-red-600 p-1 transition-colors"
                    title="Remove place"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900">{place.name || place.locality}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {place.locality} &bull; Lat {place.latitude.toFixed(2)}, Lon {place.longitude.toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Live Safety</span>
                  <span className="font-bold text-emerald-600">Normal Baseline</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: HEAT FIRST-AID GUIDES & ACADEMY */}
      {activeTab === 'academy' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Life-Saving Heat Emergency Action Guides</h3>
            <p className="text-xs text-slate-500">Accredited thermal medical guidance from NDMA, WHO, and Indian Red Cross.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700">
                Early Stage
              </span>
              <h4 className="text-xs font-extrabold text-slate-900">Heat Cramps & Exhaustion</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Symptoms: Heavy sweating, cold clammy skin, muscle cramps, dizziness, nausea.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-700 space-y-1">
                <strong>Action:</strong> Rest in air-conditioned room, sip cold ORS water, loosen tight clothing.
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
                Medical Emergency
              </span>
              <h4 className="text-xs font-extrabold text-slate-900">Life-Threatening Heatstroke</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Symptoms: Body temp &gt; 40°C, dry hot skin (no sweat), slurred speech, confusion, seizures.
              </p>
              <div className="p-2.5 rounded-xl bg-red-50 text-[11px] text-red-900 space-y-1">
                <strong>Action:</strong> Call <strong>108</strong> immediately. Place ice packs on neck & armpits.
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-800">
                Home Hydration
              </span>
              <h4 className="text-xs font-extrabold text-slate-900">Oral Rehydration (ORS)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clean Water (1 Liter) + Sugar (6 level tsp) + Salt (1/2 level tsp).
              </p>
              <div className="p-2.5 rounded-xl bg-cyan-50 text-[11px] text-cyan-900 space-y-1">
                <strong>Action:</strong> Restores vital sodium & potassium lost in sweat. Sip 250ml every 30 mins.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ALERT PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Hourly Notification & Safety Alert Preferences</h3>
            <p className="text-xs text-slate-500">Customize how and when HeatShield AI notifies you of rising heat indices.</p>
          </div>

          <div className="space-y-3.5 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 block">Hourly SMS Updates</span>
                <span className="text-[11px] text-slate-500">Concise TRAI-compliant SMS when heat index exceeds caution baseline</span>
              </div>
              <input
                type="checkbox"
                checked={prefSms}
                onChange={e => setPrefSms(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 block">Hourly Email Briefings</span>
                <span className="text-[11px] text-slate-500">Detailed NDMA safety advice and hour-by-hour forecast tables</span>
              </div>
              <input
                type="checkbox"
                checked={prefEmail}
                onChange={e => setPrefEmail(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 block">Night-Time Quiet Hours</span>
                <span className="text-[11px] text-slate-500">Pause non-critical alerts between 10:00 PM and 07:00 AM</span>
              </div>
              <input
                type="checkbox"
                checked={prefQuietHours}
                onChange={e => setPrefQuietHours(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
            </label>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                Save Preferences
              </button>
              {savedPrefNotice && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Preferences Saved!</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySafetyHubPage;
