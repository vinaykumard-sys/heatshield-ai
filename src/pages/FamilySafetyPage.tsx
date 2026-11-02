import React, { useState } from 'react';
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
  Lock
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { FamilyGroup, FamilyMember } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';

export const FamilySafetyPage: React.FC = () => {
  const [groups, setGroups] = useState<FamilyGroup[]>(() => mockDb.getFamilyGroups());
  const [activeGroup, setActiveGroup] = useState<FamilyGroup>(groups[0]);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRel, setNewMemberRel] = useState<FamilyMember['relationship']>('parent');
  const [newMemberLoc, setNewMemberLoc] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeGroup.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: FamilyMember = {
      id: `fm-${Date.now()}`,
      group_id: activeGroup.id,
      name: newMemberName,
      relationship: newMemberRel,
      locality_name: newMemberLoc || 'Bengaluru',
      phone: newMemberPhone,
      consent_given: true,
      location_sharing_active: false,
      last_status: 'safe',
      last_checkin_at: new Date().toISOString(),
      temperature_at_location: 34.2,
      risk_at_location: 55
    };

    const updatedGroup = {
      ...activeGroup,
      members: [...activeGroup.members, newMember]
    };

    mockDb.saveFamilyGroup(updatedGroup);
    setGroups(mockDb.getFamilyGroups());
    setActiveGroup(updatedGroup);
    setShowAddMemberModal(false);
    setNewMemberName('');
    setNewMemberLoc('');
    setNewMemberPhone('');
  };

  const handleQuickCheckin = (memberId: string, status: 'safe' | 'cooling_down' | 'emergency') => {
    const updatedMembers = activeGroup.members.map(m => {
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
    setActiveGroup(updatedGroup);
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
              <span>Family Heat Safety & Welfare Circle</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              PRIVACY COMPLIANT
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Voluntary, consent-based heat welfare coordination for children, parents, and elderly family members.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyCode}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all btn-press hover:scale-105 active:scale-95"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>{copiedCode ? 'Code Copied!' : `Invite Code: ${activeGroup.invite_code}`}</span>
          </button>

          <button
            onClick={() => setShowAddMemberModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all btn-interact hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Family Member</span>
          </button>
        </div>
      </div>

      {/* Family Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeGroup.members.map(member => {
          const isSafe = member.last_status === 'safe';
          const isCooling = member.last_status === 'cooling_down';
          const isDanger = member.last_status === 'emergency';

          return (
            <div 
              key={member.id}
              className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 card-interactive hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{member.name}</h3>
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
                    {member.relationship}
                  </span>
                </div>

                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  isSafe ? 'bg-emerald-100 text-emerald-800' :
                  isCooling ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {member.last_status.replace('_', ' ')}
                </span>
              </div>

              {/* Location & Microclimate status */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.locality_name}</span>
                  </span>
                  {member.temperature_at_location && (
                    <span className="font-mono font-bold text-slate-900">
                      {member.temperature_at_location}°C
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Last confirmed:</span>
                  <span>{new Date(member.last_checkin_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Quick Check-in Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleQuickCheckin(member.id, 'safe')}
                  className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Safe</span>
                </button>

                <button
                  onClick={() => handleQuickCheckin(member.id, 'cooling_down')}
                  className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Resting in Shade</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Privacy & Consent Guarantee */}
      <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-start gap-3 text-xs">
        <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-slate-300 leading-relaxed">
          <b>Strict Family Privacy Policy:</b> No continuous tracking or surveillance. Members voluntarily share periodic welfare confirmations and neighborhood-level microclimate conditions. You can revoke membership or disable location sharing at any time.
        </p>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-modal-enter">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Add Family Member</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  placeholder="e.g. Grandma Kamala"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Relationship</label>
                <select
                  value={newMemberRel}
                  onChange={e => setNewMemberRel(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                >
                  <option value="parent">Parent</option>
                  <option value="grandparent">Grandparent</option>
                  <option value="child">Child</option>
                  <option value="spouse">Spouse</option>
                  <option value="relative">Relative</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Locality / Ward</label>
                <input
                  type="text"
                  value={newMemberLoc}
                  onChange={e => setNewMemberLoc(e.target.value)}
                  placeholder="e.g. Hebbal, Bengaluru"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
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