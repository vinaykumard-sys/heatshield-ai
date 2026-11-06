import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Users, 
  CheckSquare, 
  GraduationCap, 
  Bell, 
  Trash2, 
  Copy, 
  Droplets, 
  Thermometer, 
  FileText,
  CheckCircle2,
  Sparkles,
  Heart,
  Plus
} from 'lucide-react';
import { useLocationTracker } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../lib/mockDb';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { FamilyGroup, FamilyMember, UserFavouriteLocation } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

interface SafetyHabit {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export const MySafetyHubPage: React.FC = () => {
  const { user } = useAuth();
  const { currentLocation, currentReading, selectedZone } = useLocationTracker();
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
      { id: 'h1', title: 'Morning Hydration Kickstart', description: 'Drink 500ml water or electrolyte fluid before stepping outside.', completed: true },
      { id: 'h2', title: 'Breathable Cotton Attire', description: 'Wear loose, light-coloured clothing with a wide-brim hat or umbrella.', completed: true },
      { id: 'h3', title: 'Avoid Midday Peak Sun', description: 'Schedule unshaded outdoor errands outside the 12:00 PM – 4:00 PM window.', completed: false },
      { id: 'h4', title: 'Check in on Elders', description: 'Confirm wellbeing, water access, and cooling for senior family members or neighbours.', completed: false },
      { id: 'h5', title: 'Carry Refillable Water Bottle', description: 'Keep a clean water flask and an ORS electrolyte sachet in your bag.', completed: false },
      { id: 'h6', title: 'Shade Sunny Windows', description: 'Keep curtains and blinds drawn on sun-facing windows between 11 AM – 5 PM.', completed: true }
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

  // 4. Family Safety Circle
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
Monitored Area: ${currentLocation.localityName || selectedZone?.name || 'Local Ward'}
Date: ${new Date().toLocaleDateString()}

1. HYDRATION TARGET:
   - Your daily personalized hydration target is ${hydrationTarget} Litres.
   - Drink 250ml water every 20-30 minutes during peak midday temperatures.
   - Carry ORS or electrolyte fluids when travelling outdoors.

2. COOLING ENVIRONMENT:
   - Use shaded or air-conditioned areas between 12:00 PM and 4:00 PM.
   - Apply cool, damp cloths to neck, armpits, and forehead if overheated.

3. EMERGENCY WARNING SIGNS (CALL 108 / 112 IMMEDIATELY):
   - Confusion, slurred speech, or loss of balance.
   - Hot, dry skin with sudden absence of sweating.
   - Severe nausea, rapid pulse, or fainting.

4. 24x7 EMERGENCY CONTACTS:
   - National Emergency: 112
   - Medical Ambulance: 108
   - State Disaster Management: 1070 / 1077

Generated by HeatShield AI`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HeatShield_Personal_Safety_Plan.txt';
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
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      <LocationTrackerBar />

      {/* Hero Overview Card */}
      <Card padding="lg" className="bg-gradient-to-br from-blue-50/70 via-white to-sky-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="brand" size="sm">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Personal Safety Shield
              </Badge>
              <span className="text-xs text-[#64748B]">
                {currentLocation.localityName || selectedZone?.name || 'Your area'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              My Safety & Protection Hub
            </h1>

            <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed">
              Personalized heat protection tailored to your daily schedule: track your daily hydration target ({hydrationTarget}L), monitor family members, and complete daily safety habits.
            </p>

            <div className="flex items-center gap-5 pt-2 text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>Habits: <strong className="text-[#0F172A]">{completedHabitsCount}/6 Completed</strong></span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Droplets className="w-4 h-4 text-[#1E60F2]" />
                <span>Water Target: <strong className="text-[#0F172A]">{hydrationTarget} Litres/day</strong></span>
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={handleDownloadCheatsheet}
              icon={<FileText className="w-4 h-4" />}
            >
              Download Safety Plan
            </Button>
          </div>
        </div>
      </Card>

      {/* Clean Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#E5EDF5]">
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all shrink-0 ${
                isActive
                  ? 'bg-[#1E60F2] text-white shadow-xs'
                  : 'bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F5F8FC] border border-[#E5EDF5]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#1E60F2]'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DAILY HABIT CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Today's Heat Safety Habits</h3>
              <p className="text-xs text-[#64748B]">Evidence-based daily habits to protect your health during high temperature periods.</p>
            </div>
            <Badge variant="brand" size="sm">
              {Math.round((completedHabitsCount / habits.length) * 100)}% Complete
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {habits.map(habit => (
              <div
                key={habit.id}
                onClick={() => toggleHabit(habit.id)}
                className={`p-5 rounded-[20px] border cursor-pointer transition-all flex items-start gap-4 shadow-card hover:shadow-card-hover ${
                  habit.completed
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-white border-[#E5EDF5] hover:border-slate-300'
                }`}
              >
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                  habit.completed
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white border-[#E5EDF5]'
                }`}>
                  {habit.completed && <CheckCircle2 className="w-4 h-4" />}
                </div>

                <div className="space-y-1">
                  <h4 className={`text-xs font-bold ${habit.completed ? 'text-emerald-950 line-through opacity-80' : 'text-[#0F172A]'}`}>
                    {habit.title}
                  </h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">
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
        <Card padding="lg" className="max-w-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Personal Thermal Profile</h3>
            <p className="text-xs text-[#64748B]">Calibrates your hydration advice and risk thresholds to your personal baseline.</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Age Group */}
            <div>
              <label className="font-semibold text-[#0F172A] block mb-2">Age Group</label>
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
                    className={`py-2 px-3 rounded-xl border font-semibold text-center transition-colors ${
                      profile.age_group === opt.id
                        ? 'bg-[#1E60F2] text-white border-[#1E60F2]'
                        : 'bg-[#F5F8FC] text-[#64748B] border-[#E5EDF5] hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Health Conditions */}
            <div className="space-y-2 pt-2 border-t border-[#E5EDF5]">
              <label className="font-semibold text-[#0F172A] block">Health Conditions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.has_cardio}
                    onChange={e => saveProfile({ ...profile, has_cardio: e.target.checked })}
                    className="w-4 h-4 rounded text-[#1E60F2]"
                  />
                  <span className="text-[#0F172A] font-medium">Cardiovascular Sensitivity</span>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.has_respiratory}
                    onChange={e => saveProfile({ ...profile, has_respiratory: e.target.checked })}
                    className="w-4 h-4 rounded text-[#1E60F2]"
                  />
                  <span className="text-[#0F172A] font-medium">Asthma / Respiratory Sensitivity</span>
                </label>
              </div>
            </div>

            {/* Air Conditioning & Outdoor Exposure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5EDF5]">
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Air Conditioning at Home / Work</label>
                <select
                  value={profile.has_ac ? 'yes' : 'no'}
                  onChange={e => saveProfile({ ...profile, has_ac: e.target.value === 'yes' })}
                  className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3 py-2 text-xs text-[#0F172A]"
                >
                  <option value="yes">Yes — Air Conditioned</option>
                  <option value="no">No — Fans / Ventilation</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Daily Direct Outdoor Hours</label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={profile.outdoor_hours}
                  onChange={e => saveProfile({ ...profile, outdoor_hours: Number(e.target.value) })}
                  className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3 py-2 text-xs text-[#0F172A]"
                />
              </div>
            </div>

            {/* Personalized Target Box */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-blue-950 block">Your Daily Water Target</span>
                <span className="text-[11px] text-[#64748B]">Calculated from body weight, ambient temp & outdoor hours</span>
              </div>
              <div className="text-xl font-extrabold text-[#1E60F2]">
                {hydrationTarget} Litres
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 3: FAMILY SAFETY CIRCLE */}
      {activeTab === 'family' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0F172A]">{familyGroup.group_name}</h3>
                <Badge variant="brand" size="sm">
                  Code: {familyGroup.invite_code}
                </Badge>
                <button
                  onClick={handleCopyInvite}
                  className="text-[#64748B] hover:text-[#0F172A] p-1"
                  title="Copy Invite Code"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copiedCode && <span className="text-xs text-emerald-600 font-semibold">Copied!</span>}
              </div>
              <p className="text-xs text-[#64748B]">Connect with family members to view their safety status during extreme heat.</p>
            </div>
          </div>

          {/* Add Member Form */}
          <Card padding="md">
            <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-xs">
              <input
                type="text"
                placeholder="Full Name (e.g. Ramesh, Priya)"
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                className="flex-1 bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3.5 py-2 text-[#0F172A] focus:outline-none focus:border-[#1E60F2]"
              />
              <input
                type="tel"
                placeholder="Mobile (+91 ...)"
                value={newMemberPhone}
                onChange={e => setNewMemberPhone(e.target.value)}
                className="w-full sm:w-44 bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3.5 py-2 text-[#0F172A] focus:outline-none focus:border-[#1E60F2]"
              />
              <select
                value={newMemberRelation}
                onChange={e => setNewMemberRelation(e.target.value as FamilyMember['relationship'])}
                className="bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3.5 py-2 text-[#0F172A] focus:outline-none"
              >
                <option value="parent">Parent</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="grandparent">Grandparent</option>
                <option value="sibling">Sibling</option>
                <option value="relative">Relative</option>
              </select>
              <Button type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                Add Member
              </Button>
            </form>
          </Card>

          {familyGroup.members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {familyGroup.members.map(member => (
                <Card key={member.id} padding="md" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" size="sm">
                      {member.relationship}
                    </Badge>
                    <Badge variant="success" size="sm">
                      Safe
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">{member.name}</h4>
                    <span className="text-[11px] text-[#64748B]">{member.phone}</span>
                  </div>
                  <div className="pt-2 border-t border-[#E5EDF5] flex items-center justify-between text-xs text-[#64748B]">
                    <span>Last active: {member.last_checkin_at ? new Date(member.last_checkin_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}</span>
                    <a href={`tel:${member.phone}`} className="text-[#1E60F2] font-semibold hover:underline">
                      Call
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card padding="lg" className="text-center space-y-2">
              <Users className="w-8 h-8 text-[#64748B] mx-auto" />
              <h4 className="text-sm font-semibold text-[#0F172A]">Family Safety Circle</h4>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Add family members or share invite code <strong className="text-[#0F172A]">{familyGroup.invite_code}</strong> to receive automatic updates during severe heatwaves.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* TAB 4: SAVED PLACES */}
      {activeTab === 'places' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Saved Monitored Places</h3>
            <p className="text-xs text-[#64748B]">Stay updated on temperature and heat risk for the places you care about.</p>
          </div>

          {/* Add Place Form */}
          <Card padding="md">
            <form onSubmit={handleAddPlace} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-xs">
              <input
                type="text"
                placeholder="Label (e.g. Work Office, Elderly Parents)"
                value={newPlaceLabel}
                onChange={e => setNewPlaceLabel(e.target.value)}
                className="flex-1 bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3.5 py-2 text-[#0F172A] focus:outline-none focus:border-[#1E60F2]"
              />
              <select
                value={newPlaceLocalityId}
                onChange={e => setNewPlaceLocalityId(e.target.value)}
                className="flex-1 bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3.5 py-2 text-[#0F172A] focus:outline-none"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.city})
                  </option>
                ))}
              </select>
              <Button type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                Save Place
              </Button>
            </form>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {places.map(place => (
              <Card key={place.id} padding="md" className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="brand" size="sm">
                    {place.label}
                  </Badge>
                  <button
                    onClick={() => handleRemovePlace(place.id)}
                    className="text-[#64748B] hover:text-red-600 p-1 transition-colors"
                    title="Remove place"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">{place.name || place.locality}</h4>
                  <span className="text-[11px] text-[#64748B]">
                    {place.locality}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#E5EDF5] flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Status</span>
                  <span className="font-semibold text-emerald-600">Normal Conditions</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: HEAT FIRST-AID GUIDES */}
      {activeTab === 'academy' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Heat Emergency Action Guides</h3>
            <p className="text-xs text-[#64748B]">Medical guidance for identifying and treating heat-related illness.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card padding="lg" className="space-y-2.5">
              <Badge variant="warning" size="sm">
                Early Stage
              </Badge>
              <h4 className="text-sm font-bold text-[#0F172A]">Heat Cramps & Exhaustion</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Symptoms: Heavy sweating, cold clammy skin, muscle cramps, dizziness, nausea.
              </p>
              <div className="p-3 rounded-xl bg-[#F5F8FC] text-xs text-[#0F172A] border border-[#E5EDF5]">
                <strong>Action:</strong> Rest in air-conditioned room, sip cold ORS water, loosen tight clothing.
              </div>
            </Card>

            <Card padding="lg" className="space-y-2.5 border-red-200">
              <Badge variant="danger" size="sm">
                Emergency
              </Badge>
              <h4 className="text-sm font-bold text-[#0F172A]">Heatstroke (Critical)</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Symptoms: Body temp &gt; 40°C, dry hot skin (no sweat), slurred speech, confusion, seizures.
              </p>
              <div className="p-3 rounded-xl bg-red-50 text-xs text-red-900 border border-red-100">
                <strong>Action:</strong> Call <strong>108</strong> immediately. Place ice packs on neck & armpits.
              </div>
            </Card>

            <Card padding="lg" className="space-y-2.5">
              <Badge variant="brand" size="sm">
                Hydration Recipe
              </Badge>
              <h4 className="text-sm font-bold text-[#0F172A]">Oral Rehydration Solution (ORS)</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Clean Water (1 Litre) + Sugar (6 level teaspoons) + Salt (1/2 level teaspoon).
              </p>
              <div className="p-3 rounded-xl bg-blue-50 text-xs text-blue-900 border border-blue-100">
                <strong>Action:</strong> Restores vital sodium and electrolytes lost in sweat. Sip steadily.
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 6: ALERT PREFERENCES */}
      {activeTab === 'preferences' && (
        <Card padding="lg" className="max-w-2xl space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Notification Preferences</h3>
            <p className="text-xs text-[#64748B]">Choose how you receive warnings and safety advisories.</p>
          </div>

          <div className="space-y-3.5 text-xs">
            <label className="flex items-center justify-between p-4 rounded-2xl border border-[#E5EDF5] bg-[#F5F8FC] cursor-pointer">
              <div>
                <span className="font-semibold text-[#0F172A] block">SMS Safety Alerts</span>
                <span className="text-[11px] text-[#64748B]">Immediate SMS text when local heat index reaches dangerous levels</span>
              </div>
              <input
                type="checkbox"
                checked={prefSms}
                onChange={e => setPrefSms(e.target.checked)}
                className="w-4 h-4 rounded text-[#1E60F2]"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl border border-[#E5EDF5] bg-[#F5F8FC] cursor-pointer">
              <div>
                <span className="font-semibold text-[#0F172A] block">Daily Morning Briefing</span>
                <span className="text-[11px] text-[#64748B]">Daily 8 AM heat forecast and safe outdoor hour recommendations</span>
              </div>
              <input
                type="checkbox"
                checked={prefEmail}
                onChange={e => setPrefEmail(e.target.checked)}
                className="w-4 h-4 rounded text-[#1E60F2]"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl border border-[#E5EDF5] bg-[#F5F8FC] cursor-pointer">
              <div>
                <span className="font-semibold text-[#0F172A] block">Night-Time Quiet Hours</span>
                <span className="text-[11px] text-[#64748B]">Pause non-critical alerts between 10:00 PM and 7:00 AM</span>
              </div>
              <input
                type="checkbox"
                checked={prefQuietHours}
                onChange={e => setPrefQuietHours(e.target.checked)}
                className="w-4 h-4 rounded text-[#1E60F2]"
              />
            </label>

            <div className="pt-2 flex items-center justify-between">
              <Button
                variant="primary"
                size="md"
                onClick={handleSavePreferences}
              >
                Save Preferences
              </Button>
              {savedPrefNotice && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Preferences Saved</span>
                </span>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MySafetyHubPage;
