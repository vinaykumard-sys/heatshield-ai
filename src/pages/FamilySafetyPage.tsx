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
  Bookmark,
  CheckSquare,
  Sparkles,
  Droplets,
  Sun,
  Flame
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { FamilyGroup, FamilyMember } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { useAuth } from '../context/AuthContext';
import { useLocationTracker } from '../context/LocationContext';
import { formatTimeAgo } from '../lib/utils';

export const FamilySafetyPage: React.FC = () => {
  const { user } = useAuth();
  const { currentLocation } = useLocationTracker();

  const [activeTab, setActiveTab] = useState<'family' | 'checklist' | 'favorites' | 'emergency'>('family');

  const [groups, setGroups] = useState<FamilyGroup[]>(() => {
    const list = mockDb.getFamilyGroups();
    if (list.length > 0) return list;
    return [{
      id: 'fam-my-circle',
      owner_id: user?.id || 'usr-current',
      group_name: `${user?.full_name ? user.full_name.split(' ')[0] : 'My'} Family Safety Circle`,
      invite_code: `HEAT-${Math.floor(1000 + Math.random() * 9000)}`,
      members: [
        {
          id: 'fm-1',
          group_id: 'fam-my-circle',
          name: 'Mom',
          relationship: 'parent',
          locality_name: 'Jayanagar, Bengaluru',
          phone: '+91 98450 11223',
          last_status: 'safe',
          temperature_at_location: 28.4,
          consent_given: true,
          location_sharing_active: true,
          last_checkin_at: new Date(Date.now() - 3 * 60000).toISOString()
        },
        {
          id: 'fm-2',
          group_id: 'fam-my-circle',
          name: 'Aarav (Son)',
          relationship: 'child',
          locality_name: 'Hebbal Campus, Bengaluru',
          phone: '+91 98450 44556',
          last_status: 'cooling_down',
          temperature_at_location: 34.2,
          consent_given: true,
          location_sharing_active: true,
          last_checkin_at: new Date(Date.now() - 15 * 60000).toISOString()
        }
      ],
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
  const [favoritePlaces, setFavoritePlaces] = useState(() => mockDb.getFavoritePlaces());

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
      last_status: 'safe',
      temperature_at_location: 31.0,
      consent_given: true,
      location_sharing_active: true,
      last_checkin_at: new Date().toISOString()
    };

    const nextGroups = groups.map((g, idx) => {
      if (idx === activeGroupIndex) {
        const updated = { ...g, members: [...g.members, newMember] };
        mockDb.saveFamilyGroup(updated);
        return updated;
      }
      return g;
    });

    setGroups(nextGroups);
    setShowAddMemberModal(false);
    setNewMemberName('');
    setNewMemberLoc('');
    setNewMemberPhone('');
  };

  const handleQuickCheckin = (memberId: string, status: FamilyMember['last_status']) => {
    const nextGroups = groups.map((g, idx) => {
      if (idx === activeGroupIndex) {
        return {
          ...g,
          members: g.members.map(m => m.id === memberId ? { ...m, last_status: status, last_checkin_time: new Date().toISOString() } : m)
        };
      }
      return g;
    });
    setGroups(nextGroups);
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#1E60F2]" />
            <span>Family Heat Safety Circle</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Keep loved ones safe from extreme heat, monitor temperatures, and share check-in status
          </p>
        </div>

        <button
          onClick={() => setShowAddMemberModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto btn-press"
        >
          <Plus className="w-4 h-4" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-2 rounded-[20px] border border-[#E5EDF5] shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('family')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'family' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Family Circle ({activeGroup?.members?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'checklist' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Daily Habits ({checklistCount}/6)</span>
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'favorites' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Places ({favoritePlaces.length})</span>
        </button>
      </div>

      {/* TAB 1: FAMILY CARDS (Section 24) */}
      {activeTab === 'family' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-white rounded-[20px] border border-[#E5EDF5] shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-800">{activeGroup.group_name}</span>
              <button
                onClick={handleCopyCode}
                className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 border border-[#E5EDF5] px-2.5 py-1 rounded-lg bg-[#F5F8FC] transition-colors"
              >
                <Copy className="w-3 h-3 text-slate-400" />
                <span>{copiedCode ? 'Copied to clipboard!' : `Invite Code: ${activeGroup.invite_code}`}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGroup.members?.map(member => {
              const isSafe = member.last_status === 'safe';
              const isCooling = member.last_status === 'cooling_down';
              const temp = Math.round(member.temperature_at_location ?? 30);
              const riskLabel = temp >= 38 ? 'High heat risk' : temp >= 33 ? 'Moderate risk' : 'Low risk';
              const riskColor = temp >= 38 ? 'text-red-700 bg-red-50 border-red-200' : temp >= 33 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200';

              return (
                <div 
                  key={member.id}
                  className="bg-white rounded-[20px] border border-[#E5EDF5] p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                >
                  {/* Top: Name, Relationship & Status Badge */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E60F2] flex items-center justify-center font-bold text-sm">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{member.name}</h4>
                        <span className="text-xs text-slate-400 capitalize">{member.relationship}</span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      isSafe ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      isCooling ? 'bg-blue-50 text-[#1E60F2] border-blue-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {isSafe ? 'Safe' : isCooling ? 'Resting' : 'Alert'}
                    </span>
                  </div>

                  {/* Temperature & Risk Row (Section 24: 28°C, Low risk) */}
                  <div className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-amber-500" />
                      <span className="text-lg font-extrabold text-slate-900 font-sans">
                        {temp}°C
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${riskColor}`}>
                      {riskLabel}
                    </span>
                  </div>

                  {/* Location & Last Updated (Section 24: Updated 3 min ago) */}
                  <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
                    <span className="truncate max-w-[170px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{member.locality_name}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Updated {formatTimeAgo(member.last_checkin_at)}
                    </span>
                  </div>

                  {/* Quick Check-in Feedback buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleQuickCheckin(member.id, 'safe')}
                      className="flex-1 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors text-center btn-press"
                    >
                      Mark Safe
                    </button>
                    <button
                      onClick={() => handleQuickCheckin(member.id, 'cooling_down')}
                      className="flex-1 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#1E60F2] text-xs font-semibold transition-colors text-center btn-press"
                    >
                      Resting
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DAILY HABIT CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="bg-white border border-[#E5EDF5] rounded-[20px] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Today's Heat Resilience Habits</h3>
              <p className="text-xs text-slate-500">Essential practices to prevent dehydration and heat exhaustion</p>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-[#1E60F2] font-sans">{checklistCount}/6</span>
              <span className="text-[11px] text-slate-400 block">Completed</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="p-4 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <span className="font-bold text-slate-900 block">Morning Hydration Kickstart</span>
                <span className="text-slate-500">Drank 500ml water before leaving home</span>
              </div>
              <input
                type="checkbox"
                checked={checklist.drankWater}
                onChange={() => toggleChecklistItem('drankWater')}
                className="w-4 h-4 rounded text-[#1E60F2]"
              />
            </label>

            <label className="p-4 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <span className="font-bold text-slate-900 block">Avoid Peak Midday Sun</span>
                <span className="text-slate-500">Avoided unshaded activities 12 PM - 3:30 PM</span>
              </div>
              <input
                type="checkbox"
                checked={checklist.avoidedMiddaySun}
                onChange={() => toggleChecklistItem('avoidedMiddaySun')}
                className="w-4 h-4 rounded text-[#1E60F2]"
              />
            </label>

            <label className="p-4 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <span className="font-bold text-slate-900 block">Ventilate Indoor Rooms</span>
                <span className="text-slate-500">Curtains closed on sun-facing windows</span>
              </div>
              <input
                type="checkbox"
                checked={checklist.ventilatedRooms}
                onChange={() => toggleChecklistItem('ventilatedRooms')}
                className="w-4 h-4 rounded text-[#1E60F2]"
              />
            </label>

            <label className="p-4 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <span className="font-bold text-slate-900 block">Senior & Child Check-in</span>
                <span className="text-slate-500">Checked water access for elderly relatives</span>
              </div>
              <input
                type="checkbox"
                checked={checklist.checkedSeniors}
                onChange={() => toggleChecklistItem('checkedSeniors')}
                className="w-4 h-4 rounded text-[#1E60F2]"
              />
            </label>
          </div>
        </div>
      )}

      {/* TAB 3: SAVED PLACES */}
      {activeTab === 'favorites' && (
        <div className="bg-white border border-[#E5EDF5] rounded-[20px] p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Saved Family Places</h3>
            <p className="text-xs text-slate-500">Homes, schools, and workplaces monitored for heat alerts</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {favoritePlaces.map(p => (
              <div key={p.id} className="p-4 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-1 text-xs">
                <h4 className="font-bold text-slate-900">{p.displayName}</h4>
                <p className="text-slate-500">{p.city}, {p.state}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 border border-[#E5EDF5] shadow-modal space-y-4 animate-modal-enter">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Family Member</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g., Mom, Dad, Priya"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none input-interactive"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Relationship</label>
                <select
                  value={newMemberRel}
                  onChange={(e: any) => setNewMemberRel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none"
                >
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="elderly_relative">Elderly Relative</option>
                  <option value="spouse">Spouse</option>
                  <option value="sibling">Sibling</option>
                  <option value="neighbour">Neighbour</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Area / Locality</label>
                <input
                  type="text"
                  placeholder="e.g., Jayanagar, Bengaluru"
                  value={newMemberLoc}
                  onChange={(e) => setNewMemberLoc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none input-interactive"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5EDF5] text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1E60F2] text-white font-semibold shadow-xs hover:bg-[#184FD0]"
                >
                  Save Member
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
