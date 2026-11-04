import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Heart, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  X, 
  Share2, 
  Thermometer, 
  UserCheck,
  PhoneCall,
  Lock,
  Bookmark,
  CheckSquare,
  Sparkles,
  PhoneForwarded,
  Droplets,
  Sun
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { FamilyGroup, FamilyMember } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { useAuth } from '../context/AuthContext';
import { useLocationTracker } from '../context/LocationContext';

export const FamilySafetyPage: React.FC = () => {
  const { user } = useAuth();
  const { currentLocation, selectCustomLocality } = useLocationTracker();
  const locations = mockDb.getLocations();

  const [activeTab, setActiveTab] = useState<'family' | 'checklist' | 'favorites' | 'emergency'>('family');

  // Groups state with safe default
  const [groups, setGroups] = useState<FamilyGroup[]>(() => {
    const list = mockDb.getFamilyGroups();
    if (list.length > 0) return list;
    return [{
      id: 'fam-my-circle',
      owner_id: user?.id || 'usr-current',
      group_name: `${user?.full_name ? user.full_name.split(' ')[0] : 'My'} Family Safety Circle`,
      invite_code: `HEAT-${Math.floor(1000 + Math.random() * 9000)}`,
      members: [],
      created_at: new Date().toISOString()
    }];
  });

  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const activeGroup = groups[activeGroupIndex] || groups[0];
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRel, setNewMemberRel] = useState<FamilyMember['relationship']>('parent');
  const [newMemberLoc, setNewMemberLoc] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  // Daily Checklist State
  const [checklist, setChecklist] = useState(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const saved = localStorage.getItem(`heatshield_checklist_${today}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      drankWater: true,
      tookElectrolytes: false,
      avoidedMiddaySun: true,
      ventilatedRooms: true,
      checkedSeniors: false,
      protectiveClothing: true
    };
  });

  const toggleChecklistItem = (key: keyof typeof checklist) => {
    setChecklist((prev: any) => {
      const next = { ...prev, [key]: !prev[key] };
      const today = new Date().toISOString().slice(0, 10);
      try {
        localStorage.setItem(`heatshield_checklist_${today}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const checklistCount = Object.values(checklist).filter(Boolean).length;

  // Favourites state
  const [favoritePlaces, setFavoritePlaces] = useState(() => mockDb.getFavoritePlaces());

  // Quick Self-Checkin
  const [selfCheckedIn, setSelfCheckedIn] = useState(false);

  const handleCopyCode = () => {
    if (!activeGroup?.invite_code) return;
    navigator.clipboard.writeText(activeGroup.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;

    const newMember: FamilyMember = {
      id: `fm-${Date.now()}`,
      group_id: activeGroup.id,
      name: newMemberName,
      relationship: newMemberRel,
      locality_name: newMemberLoc || 'Bengaluru Urban',
      phone: newMemberPhone,
      consent_given: true,
      location_sharing_active: false,
      last_status: 'safe',
      last_checkin_at: new Date().toISOString(),
      temperature_at_location: 33.5,
      risk_at_location: 52
    };

    const updatedGroup = {
      ...activeGroup,
      members: [...(activeGroup.members || []), newMember]
    };

    mockDb.saveFamilyGroup(updatedGroup);
    setGroups(mockDb.getFamilyGroups());
    setShowAddMemberModal(false);
    setNewMemberName('');
    setNewMemberLoc('');
    setNewMemberPhone('');
  };

  const handleQuickCheckin = (memberId: string, status: 'safe' | 'cooling_down' | 'emergency') => {
    if (!activeGroup) return;
    const updatedMembers = (activeGroup.members || []).map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          last_status: status,
          last_checkin_at: new Date().toISOString()
        };
      }
      return m;
    });

    const updatedGroup = { ...activeGroup, members: updatedMembers };
    mockDb.saveFamilyGroup(updatedGroup);
    setGroups(mockDb.getFamilyGroups());
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-600" />
              <span>My Safety & Family Circle</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              PRIVACY COMPLIANT
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Voluntary, consent-based safety coordination for children, parents, and elderly family members during extreme heat.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSelfCheckedIn(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all btn-interact"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{selfCheckedIn ? 'Safety Confirmed Today' : 'Confirm My Safety Today'}</span>
          </button>
        </div>
      </div>

      {/* SECTION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('family')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'family'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Family Safety Circle ({activeGroup?.members?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'checklist'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Daily Safety Checklist ({checklistCount}/6)</span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'favorites'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Monitored Places</span>
        </button>

        <button
          onClick={() => setActiveTab('emergency')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'emergency'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Emergency Hotlines</span>
        </button>
      </div>

      {/* TAB 1: FAMILY SAFETY CIRCLE */}
      {activeTab === 'family' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-800">{activeGroup.group_name}</span>
              <button
                onClick={handleCopyCode}
                className="text-[11px] font-mono text-slate-500 hover:text-slate-800 flex items-center gap-1 border border-slate-200 px-2 py-0.5 rounded-lg bg-slate-50"
              >
                <Copy className="w-3 h-3 text-slate-400" />
                <span>{copiedCode ? 'Copied!' : `Invite Code: ${activeGroup.invite_code}`}</span>
              </button>
            </div>

            <button
              onClick={() => setShowAddMemberModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          </div>

          {activeGroup.members && activeGroup.members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGroup.members.map(member => {
                const isSafe = member.last_status === 'safe';
                const isDanger = member.last_status === 'emergency';

                return (
                  <div 
                    key={member.id}
                    className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{member.name}</h4>
                          <span className="text-[10px] text-slate-400 capitalize">{member.relationship}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSafe ? 'bg-emerald-100 text-emerald-800' : isDanger ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {member.last_status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="truncate max-w-[150px]">📍 {member.locality_name}</span>
                      <span className="font-mono">{member.temperature_at_location}°C</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleQuickCheckin(member.id, 'safe')}
                        className="flex-1 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition-all text-center"
                      >
                        Mark Safe
                      </button>
                      <button
                        onClick={() => handleQuickCheckin(member.id, 'cooling_down')}
                        className="flex-1 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition-all text-center"
                      >
                        Resting
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 rounded-3xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
              <Users className="w-10 h-10 mx-auto text-rose-400 opacity-60" />
              <h4 className="text-sm font-bold text-slate-800">No Family Members Added Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Add children, parents, or elderly relatives to monitor their local heat risks, share hydration reminders, and receive welfare check-in updates.
              </p>
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Family Member</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PERSONAL DAILY SAFETY CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Today's Heat Safety Habit Checklist</h3>
              <p className="text-xs text-slate-500">Track and record your daily physiological heat resilience habits.</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-sm font-extrabold text-blue-600">{checklistCount}/6</span>
              <span className="text-[10px] text-slate-400 block">Completed</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <label className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checklist.drankWater}
                  onChange={() => toggleChecklistItem('drankWater')}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <div>
                  <strong className="text-slate-900 block font-bold">Consumed at least 2.5 Litres of Water</strong>
                  <span className="text-slate-500 text-[11px]">Consistent hydration throughout the morning and afternoon.</span>
                </div>
              </div>
              <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
            </label>

            <label className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checklist.tookElectrolytes}
                  onChange={() => toggleChecklistItem('tookElectrolytes')}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <div>
                  <strong className="text-slate-900 block font-bold">Electrolyte / ORS Sachet Replenishment</strong>
                  <span className="text-slate-500 text-[11px]">Lemon water with salt, coconut water, or buttermilk.</span>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-cyan-500 shrink-0" />
            </label>

            <label className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checklist.avoidedMiddaySun}
                  onChange={() => toggleChecklistItem('avoidedMiddaySun')}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <div>
                  <strong className="text-slate-900 block font-bold">Avoided Direct Midday Sun Exposure</strong>
                  <span className="text-slate-500 text-[11px]">Stayed in shaded or indoor environments between 12:00 PM and 3:30 PM.</span>
                </div>
              </div>
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
            </label>

            <label className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checklist.ventilatedRooms}
                  onChange={() => toggleChecklistItem('ventilatedRooms')}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <div>
                  <strong className="text-slate-900 block font-bold">Kept Curtains Closed & Home Cross-Ventilated</strong>
                  <span className="text-slate-500 text-[11px]">Blocked direct solar heat gain on south/west facing windows.</span>
                </div>
              </div>
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            </label>

            <label className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checklist.checkedSeniors}
                  onChange={() => toggleChecklistItem('checkedSeniors')}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <div>
                  <strong className="text-slate-900 block font-bold">Checked on Elderly Relatives & Children</strong>
                  <span className="text-slate-500 text-[11px]">Confirmed they are comfortable and actively hydrating.</span>
                </div>
              </div>
              <Heart className="w-4 h-4 text-rose-500 shrink-0" />
            </label>

            <label className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checklist.protectiveClothing}
                  onChange={() => toggleChecklistItem('protectiveClothing')}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <div>
                  <strong className="text-slate-900 block font-bold">Wore Light Cotton Clothing & Head Protection</strong>
                  <span className="text-slate-500 text-[11px]">Protected skin and reduced solar thermal absorption.</span>
                </div>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            </label>
          </div>
        </div>
      )}

      {/* TAB 3: SAVED MONITORED PLACES */}
      {activeTab === 'favorites' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Saved Monitored Places</h3>
              <p className="text-xs text-slate-500">Quickly monitor heat conditions at places your family visits.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {locations.slice(0, 6).map((loc) => (
              <div
                key={loc.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{loc.name}</h4>
                  <span className="text-[11px] text-slate-500">{loc.city}, {loc.state}</span>
                </div>
                <button
                  onClick={() => selectCustomLocality(loc)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Monitor
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EMERGENCY RAPID HOTLINES */}
      {activeTab === 'emergency' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Official Emergency Hotlines & Dispatch</h3>
              <p className="text-xs text-slate-500">24/7 National and State emergency response contact numbers.</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
              TOLL-FREE 24/7
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <a
              href="tel:112"
              className="p-5 rounded-2xl border border-rose-200 bg-rose-50/70 flex flex-col items-center text-center gap-2 hover:bg-rose-100/70 transition-all btn-interact"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                112
              </div>
              <strong className="text-slate-900 text-sm">National Emergency</strong>
              <span className="text-slate-500 text-[11px]">All-in-one Emergency Response Support System</span>
            </a>

            <a
              href="tel:108"
              className="p-5 rounded-2xl border border-blue-200 bg-blue-50/70 flex flex-col items-center text-center gap-2 hover:bg-blue-100/70 transition-all btn-interact"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                108
              </div>
              <strong className="text-slate-900 text-sm">Emergency Ambulance</strong>
              <span className="text-slate-500 text-[11px]">Rapid Medical Dispatch & Heatstroke Response</span>
            </a>

            <a
              href="tel:1077"
              className="p-5 rounded-2xl border border-amber-200 bg-amber-50/70 flex flex-col items-center text-center gap-2 hover:bg-amber-100/70 transition-all btn-interact"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                1077
              </div>
              <strong className="text-slate-900 text-sm">Disaster Helpline</strong>
              <span className="text-slate-500 text-[11px]">NDMA & State Disaster Heat Advisory Desk</span>
            </a>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Family Member</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhabai"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Relationship</label>
                <select
                  value={newMemberRel}
                  onChange={(e: any) => setNewMemberRel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                >
                  <option value="parent">Parent</option>
                  <option value="elderly_relative">Elderly Relative</option>
                  <option value="child">Child</option>
                  <option value="spouse">Spouse</option>
                  <option value="sibling">Sibling</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Locality / Ward</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jayanagar, Bengaluru"
                  value={newMemberLoc}
                  onChange={(e) => setNewMemberLoc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Phone (Optional for SMS Alerts)</label>
                <input
                  type="tel"
                  placeholder="+91 98450 00000"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-sm"
                >
                  Add to Circle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilySafetyPage;
