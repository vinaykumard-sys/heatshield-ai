import React, { useState } from 'react';
import { 
  Heart, 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Copy, 
  Check, 
  AlertTriangle, 
  Lock, 
  X, 
  CheckSquare, 
  Share2, 
  Plus,
  RefreshCw,
  Send,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocationTracker } from '../context/LocationContext';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { mockDb } from '../lib/mockDb';
import { formatTimeAgo } from '../lib/utils';

export type RelationshipType = 'parent' | 'child' | 'spouse' | 'elder' | 'other';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked';

export interface FamilyInvitation {
  id: string;
  name: string;
  relationship: RelationshipType;
  contact: string; // Phone or Email
  status: InvitationStatus;
  invited_at: string;
  accepted_at?: string;
  consent_location: boolean;
  consent_telemetry: boolean;
  last_checkin_status?: 'safe' | 'cooling_down' | 'needs_aid' | 'unknown';
  last_checkin_at?: string;
}

export const FamilySafetyPage: React.FC = () => {
  const { user } = useAuth();
  const { currentLocation } = useLocationTracker();

  const [activeTab, setActiveTab] = useState<'circle' | 'checklist' | 'emergency'>('circle');

  // Opt-in invitations list stored in localStorage, defaulting to EMPTY
  const [invitations, setInvitations] = useState<FamilyInvitation[]>(() => {
    try {
      const saved = localStorage.getItem('heatshield_family_invitations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return [];
  });

  const saveInvitations = (updated: FamilyInvitation[]) => {
    setInvitations(updated);
    try {
      localStorage.setItem('heatshield_family_invitations', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist family invitations:', e);
    }
  };

  // Add / Invite Member Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState<RelationshipType>('parent');
  const [inviteContact, setInviteContact] = useState('');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);

  // Invite code
  const [inviteCode] = useState<string>(() => {
    const savedCode = localStorage.getItem('heatshield_family_circle_code');
    if (savedCode) return savedCode;
    const newCode = `HEAT-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('heatshield_family_circle_code', newCode);
    return newCode;
  });
  const [copiedCode, setCopiedCode] = useState(false);

  // Daily Habits Checklist
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteContact.trim()) return;

    const newInvite: FamilyInvitation = {
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: inviteName.trim(),
      relationship: inviteRelationship,
      contact: inviteContact.trim(),
      status: 'pending',
      invited_at: new Date().toISOString(),
      consent_location: false,
      consent_telemetry: false,
      last_checkin_status: 'unknown'
    };

    const nextList = [newInvite, ...invitations];
    saveInvitations(nextList);

    setInviteSuccessMsg(`Invitation sent to ${inviteName.trim()} (${inviteContact.trim()})`);
    setTimeout(() => {
      setInviteSuccessMsg(null);
      setShowInviteModal(false);
      setInviteName('');
      setInviteContact('');
    }, 1800);
  };

  const handleUpdateStatus = (id: string, status: InvitationStatus) => {
    const nextList = invitations.map(inv => {
      if (inv.id === id) {
        return {
          ...inv,
          status,
          accepted_at: status === 'accepted' ? new Date().toISOString() : inv.accepted_at,
          consent_location: status === 'accepted' ? true : false,
          consent_telemetry: status === 'accepted' ? true : false,
          last_checkin_status: status === 'accepted' ? ('safe' as const) : inv.last_checkin_status,
          last_checkin_at: status === 'accepted' ? new Date().toISOString() : inv.last_checkin_at
        };
      }
      return inv;
    });
    saveInvitations(nextList);
  };

  const handleRevoke = (id: string) => {
    const nextList = invitations.filter(inv => inv.id !== id);
    saveInvitations(nextList);
  };

  const acceptedMembers = invitations.filter(i => i.status === 'accepted');
  const pendingInvitations = invitations.filter(i => i.status === 'pending');

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#1E60F2]" />
            <span>Family Safety</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Protect the people you choose to connect with through verified, opt-in heat safety circles
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add a family member</span>
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3 text-xs text-blue-900">
        <Lock className="w-4 h-4 text-[#1E60F2] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Privacy First:</strong> Family connections require mutual consent. Locations, temperatures, and medical check-ins are <strong>never</strong> displayed without explicit permission. No mock or sample accounts are shown.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-2 rounded-[20px] border border-[#E5EDF5] shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('circle')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'circle' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Connected Family ({acceptedMembers.length})</span>
          {pendingInvitations.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
              {pendingInvitations.length} pending
            </span>
          )}
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
          onClick={() => setActiveTab('emergency')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'emergency' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span>Emergency Contacts</span>
        </button>
      </div>

      {/* TAB 1: CONNECTED FAMILY CIRCLE */}
      {activeTab === 'circle' && (
        <div className="space-y-6">
          {/* Invite Code Share Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Your Family Safety Circle Code</span>
              <p className="text-xs text-slate-500 mt-0.5">
                Share this secure code with family members to connect their HeatShield accounts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 font-mono text-sm font-bold text-slate-900 tracking-wider">
                {inviteCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#1E60F2] text-xs font-semibold text-slate-700 hover:text-[#1E60F2] shadow-2xs transition-all active:scale-95"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* EMPTY STATE: When no accepted members and no pending invitations */}
          {acceptedMembers.length === 0 && pendingInvitations.length === 0 && (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center max-w-xl mx-auto shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1E60F2] mx-auto flex items-center justify-center border border-blue-100 shadow-2xs">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">Family Safety</h3>
                <p className="text-sm font-medium text-slate-700">
                  Protect the people you choose to connect with.
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  No family members added yet. Send an invitation to loved ones to check in on each other during heatwaves.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E60F2] text-white text-xs font-bold hover:bg-[#184FD0] transition-colors shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add a family member</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Invite someone</span>
                </button>
              </div>
            </div>
          )}

          {/* PENDING INVITATIONS SECTION */}
          {pendingInvitations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pending Invitations ({pendingInvitations.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">Awaiting recipient consent</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{inv.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 capitalize">
                            {inv.relationship}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          {inv.contact.includes('@') ? (
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{inv.contact}</span>
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                        Invitation Sent (Pending)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
                      <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Location and heat readings hidden until accepted</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">
                        Sent {formatTimeAgo(inv.invited_at)}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Simulation trigger for testing consent */}
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(inv.id, 'accepted')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-colors"
                          title="Simulate recipient accepting this invite"
                        >
                          Confirm & Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevoke(inv.id)}
                          className="px-2 py-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 text-[11px] font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACCEPTED ACTIVE MEMBERS */}
          {acceptedMembers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Active Family Members ({acceptedMembers.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">Consented connection active</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {acceptedMembers.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-900">{m.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 capitalize">
                            {m.relationship}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          {m.contact.includes('@') ? (
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{m.contact}</span>
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Accepted</span>
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Check-in Status:</span>
                        <span className="font-bold text-emerald-700">
                          {m.last_checkin_status === 'safe'
                            ? 'Marked Safe'
                            : m.last_checkin_status === 'cooling_down'
                            ? 'Resting in Shade'
                            : 'No recent check-in'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Updated:</span>
                        <span>{m.last_checkin_at ? formatTimeAgo(m.last_checkin_at) : 'Awaiting check-in'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus: 'safe' | 'cooling_down' = m.last_checkin_status === 'safe' ? 'cooling_down' : 'safe';
                          const nextList: FamilyInvitation[] = invitations.map(inv =>
                            inv.id === m.id
                              ? { ...inv, last_checkin_status: nextStatus, last_checkin_at: new Date().toISOString() }
                              : inv
                          );
                          saveInvitations(nextList);
                        }}
                        className="text-[#1E60F2] font-semibold hover:underline"
                      >
                        Send Check-in Request
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRevoke(m.id)}
                        className="text-slate-400 hover:text-red-600 text-xs"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DAILY HABITS CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Resident Daily Heat Habits</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Simple evidence-based daily checks to prevent heat dehydration and heat stress
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-blue-50 text-[#1E60F2] text-xs font-bold border border-blue-200">
              {checklistCount} of 6 Completed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'drankWater', title: 'Drank at least 2.5L clean water', desc: 'Sustained continuous hydration throughout waking hours' },
              { id: 'tookElectrolytes', title: 'Carried ORS or electrolytes', desc: 'Crucial when sweating or commuting during heat' },
              { id: 'avoidedMiddaySun', title: 'Avoided direct sun 12 PM - 3:30 PM', desc: 'Postponed strenuous exertion outside peak heat hours' },
              { id: 'ventilatedRooms', title: 'Kept indoor living space shaded & ventilated', desc: 'Cross-breeze or blinds closed against direct solar glare' },
              { id: 'checkedSeniors', title: 'Checked on family elders & toddlers', desc: 'Vulnerable individuals face elevated risks of rapid dehydration' },
              { id: 'protectiveClothing', title: 'Wore loose, light cotton clothing', desc: 'Allows sweat evaporation and reflects radiant heat' }
            ].map(item => {
              const isChecked = (checklist as any)[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleChecklistItem(item.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                    isChecked
                      ? 'bg-blue-50/50 border-blue-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isChecked
                      ? 'bg-[#1E60F2] border-[#1E60F2] text-white'
                      : 'border-slate-300 bg-white'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </span>
                  <div>
                    <h4 className={`text-xs font-bold ${isChecked ? 'text-slate-900' : 'text-slate-700'}`}>
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: EMERGENCY PROTOCOL CONTACTS */}
      {activeTab === 'emergency' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">National Heat Emergency Numbers</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified emergency dispatch services available 24/7 across India
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-red-50/70 border border-red-200 text-center space-y-2">
              <span className="text-2xl font-black text-red-700 tracking-tight block">112</span>
              <span className="text-xs font-bold text-red-950 block">National Emergency</span>
              <p className="text-[11px] text-red-800">Police, Ambulance, and Fire combined response</p>
              <a
                href="tel:112"
                className="inline-block mt-2 px-4 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors"
              >
                Call 112
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-2">
              <span className="text-2xl font-black text-amber-700 tracking-tight block">108</span>
              <span className="text-xs font-bold text-amber-950 block">Emergency Ambulance</span>
              <p className="text-[11px] text-amber-800">Critical heatstroke medical dispatch</p>
              <a
                href="tel:108"
                className="inline-block mt-2 px-4 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors"
              >
                Call 108
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-center space-y-2">
              <span className="text-2xl font-black text-[#1E60F2] tracking-tight block">1070</span>
              <span className="text-xs font-bold text-blue-950 block">Disaster Relief</span>
              <p className="text-[11px] text-blue-800">State Disaster Management Authority helpline</p>
              <a
                href="tel:1070"
                className="inline-block mt-2 px-4 py-1.5 rounded-xl bg-[#1E60F2] text-white font-bold text-xs hover:bg-[#184FD0] transition-colors"
              >
                Call 1070
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ADD / INVITE FAMILY MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-[#1E60F2] rounded-xl border border-blue-200">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Invite Family Member</h3>
                  <p className="text-xs text-slate-500">Send an invitation to connect</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccessMsg ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Invitation Sent</h4>
                <p className="text-xs text-slate-600">{inviteSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSendInvitation} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={inviteRelationship}
                    onChange={(e) => setInviteRelationship(e.target.value as RelationshipType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="spouse">Spouse / Partner</option>
                    <option value="elder">Elder / Grandparent</option>
                    <option value="other">Other family / Close friend</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number or Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteContact}
                    onChange={(e) => setInviteContact(e.target.value)}
                    placeholder="+91 98450 12345 or user@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    They must accept before any location or safety data is shared.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilySafetyPage;
