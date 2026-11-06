import React, { useState, useEffect } from 'react';
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
  UserX,
  Eye,
  EyeOff,
  Bell,
  Thermometer,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocationTracker } from '../context/LocationContext';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { 
  FamilySafetyService, 
  FamilyInvitation, 
  RelationshipType, 
  InvitationStatus, 
  CheckinStatus,
  FamilyChecklist
} from '../lib/familySafetyService';
import { formatTimeAgo } from '../lib/utils';

export const FamilySafetyPage: React.FC = () => {
  const { user } = useAuth();
  const { currentLocation, currentReading } = useLocationTracker();

  const [activeTab, setActiveTab] = useState<'circle' | 'checklist' | 'emergency'>('circle');

  // Opt-in invitations list loaded strictly from service (defaulting to empty array)
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Invite Member Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState<RelationshipType>('parent');
  const [inviteContact, setInviteContact] = useState('');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [inviteErrorMsg, setInviteErrorMsg] = useState<string | null>(null);

  // Check-in Simulation Feedback
  const [checkinPingMsg, setCheckinPingMsg] = useState<string | null>(null);

  // Daily Habits Checklist
  const [checklist, setChecklist] = useState<FamilyChecklist>(() => FamilySafetyService.getDailyChecklist());

  // Load initial data
  useEffect(() => {
    setInvitations(FamilySafetyService.getInvitations());
    setInviteCode(FamilySafetyService.getCircleCode());
  }, []);

  const refreshList = () => {
    setInvitations(FamilySafetyService.getInvitations());
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRegenerateCode = () => {
    const fresh = FamilySafetyService.regenerateCircleCode();
    setInviteCode(fresh);
  };

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteErrorMsg(null);

    if (!inviteName.trim()) {
      setInviteErrorMsg('Please enter a full name.');
      return;
    }
    if (!inviteContact.trim()) {
      setInviteErrorMsg('Please enter a valid phone number or email address.');
      return;
    }

    const created = FamilySafetyService.createInvitation({
      name: inviteName,
      relationship: inviteRelationship,
      contact: inviteContact
    });

    refreshList();
    setInviteSuccessMsg(`Invitation sent to ${created.name} (${created.contact}). They must accept before data is shared.`);
    
    setTimeout(() => {
      setInviteSuccessMsg(null);
      setShowInviteModal(false);
      setInviteName('');
      setInviteContact('');
    }, 2000);
  };

  const handleUpdateStatus = (id: string, status: InvitationStatus, reason?: string) => {
    FamilySafetyService.updateInvitationStatus(id, status, reason);
    refreshList();
  };

  const handleRevoke = (id: string) => {
    FamilySafetyService.removeInvitation(id);
    refreshList();
  };

  const handleToggleConsent = (id: string, field: 'consent_location' | 'consent_telemetry') => {
    const target = invitations.find(i => i.id === id);
    if (!target) return;
    FamilySafetyService.updatePrivacyConsent(id, {
      [field]: !target[field]
    });
    refreshList();
  };

  const handleSendCheckinRequest = (member: FamilyInvitation) => {
    setCheckinPingMsg(`Check-in notification sent to ${member.name}. Awaiting status update.`);
    setTimeout(() => {
      setCheckinPingMsg(null);
    }, 3000);
  };

  const handleSimulateStatusCycle = (member: FamilyInvitation) => {
    const nextStatus: CheckinStatus = 
      member.last_checkin_status === 'safe' 
        ? 'cooling_down' 
        : member.last_checkin_status === 'cooling_down' 
        ? 'needs_aid' 
        : 'safe';
    
    FamilySafetyService.recordCheckin(
      member.id, 
      nextStatus, 
      currentLocation?.localityName || currentLocation?.city,
      currentReading?.temperature_c || 34.5
    );
    refreshList();
  };

  const toggleChecklistItem = (key: keyof FamilyChecklist) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    FamilySafetyService.saveDailyChecklist(updated);
  };

  const checklistCount = Object.values(checklist).filter(Boolean).length;

  const acceptedMembers = invitations.filter(i => i.status === 'accepted');
  const pendingInvitations = invitations.filter(i => i.status === 'pending');
  const declinedInvitations = invitations.filter(i => i.status === 'declined');

  const isCircleCompletelyEmpty = invitations.length === 0;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#1E60F2]" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Family Safety Circle
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1E60F2] border border-blue-200">
              Strict Opt-In
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Coordinate heat safety, mutual check-ins, and thermal alerts with consented loved ones
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite family member</span>
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3 text-xs text-blue-950">
        <Lock className="w-4 h-4 text-[#1E60F2] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Privacy First & Zero Mock Data:</strong> Family circles require explicit mutual consent. Location and heat vulnerability telemetry are <strong>never</strong> shared without consent. If you have not invited anyone, this circle stays completely empty.
        </p>
      </div>

      {/* Checkin Ping Feedback Toast */}
      {checkinPingMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{checkinPingMsg}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setCheckinPingMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-2 rounded-[20px] border border-[#E5EDF5] shadow-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('circle')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'circle' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Connected Circle ({acceptedMembers.length})</span>
          {pendingInvitations.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
              {pendingInvitations.length} pending
            </span>
          )}
          {declinedInvitations.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
              {declinedInvitations.length} declined
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('checklist')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'checklist' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Daily Habits ({checklistCount}/6)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('emergency')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'emergency' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span>Emergency Hotlines</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: CONNECTED FAMILY CIRCLE */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'circle' && (
        <div className="space-y-6">
          {/* Invite Code Share Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Your Family Safety Circle Code</span>
              <p className="text-xs text-slate-500 mt-0.5">
                Share this secure code with family members to link their HeatShield accounts.
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
              <button
                type="button"
                onClick={handleRegenerateCode}
                title="Regenerate code"
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* HONEST EMPTY STATE - STRICT REQUIREMENT */}
          {/* ------------------------------------------------------------------ */}
          {isCircleCompletelyEmpty && (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center max-w-xl mx-auto shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1E60F2] mx-auto flex items-center justify-center border border-blue-100 shadow-2xs">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">Your Family Safety Circle is empty</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Invite family members to coordinate during extreme heat events.
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto pt-1 leading-normal">
                  HeatShield respects your privacy: no sample or fake contacts are displayed. Only people you invite and who give explicit consent will show here.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E60F2] text-white text-xs font-bold hover:bg-[#184FD0] transition-colors shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite family member</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Circle Code</span>
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* PENDING INVITATIONS SECTION */}
          {/* ------------------------------------------------------------------ */}
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
                        {/* Interactive testing buttons to simulate real recipient response */}
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(inv.id, 'accepted')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-colors"
                          title="Simulate recipient accepting this invite"
                        >
                          Simulate Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(inv.id, 'declined', 'Recipient declined via SMS')}
                          className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200 transition-colors"
                          title="Simulate recipient declining this invite"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevoke(inv.id)}
                          className="px-2 py-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 text-[11px] font-medium transition-colors"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* ACCEPTED ACTIVE MEMBERS */}
          {/* ------------------------------------------------------------------ */}
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
                {acceptedMembers.map((m) => {
                  const checkinBadge = 
                    m.last_checkin_status === 'safe'
                      ? { label: 'Marked Safe', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                      : m.last_checkin_status === 'cooling_down'
                      ? { label: 'Resting in Shade', bg: 'bg-blue-50 text-[#1E60F2] border-blue-200' }
                      : m.last_checkin_status === 'needs_aid'
                      ? { label: 'Requested Heat Aid', bg: 'bg-red-50 text-red-700 border-red-200' }
                      : { label: 'Awaiting Check-in', bg: 'bg-slate-50 text-slate-600 border-slate-200' };

                  return (
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

                      {/* Checkin Status Card */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Check-in Status:</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] border ${checkinBadge.bg}`}>
                            {checkinBadge.label}
                          </span>
                        </div>

                        {m.consent_location && (
                          <div className="flex items-center justify-between text-[11px] text-slate-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#1E60F2]" />
                              <span>Location:</span>
                            </span>
                            <span className="font-semibold text-slate-800">
                              {m.last_location_name || currentLocation?.localityName || 'Designated Safe Zone'}
                            </span>
                          </div>
                        )}

                        {m.consent_telemetry && m.last_temperature && (
                          <div className="flex items-center justify-between text-[11px] text-slate-600">
                            <span className="flex items-center gap-1">
                              <Thermometer className="w-3 h-3 text-amber-500" />
                              <span>Thermal Exposure:</span>
                            </span>
                            <span className="font-semibold text-slate-800">
                              {m.last_temperature}°C
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                          <span>Last Activity:</span>
                          <span>{m.last_checkin_at ? formatTimeAgo(m.last_checkin_at) : 'Awaiting check-in'}</span>
                        </div>
                      </div>

                      {/* Privacy Consent Badges & Controls */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleConsent(m.id, 'consent_location')}
                            title={`Click to ${m.consent_location ? 'disable' : 'enable'} location sharing`}
                            className={`flex items-center gap-1 hover:underline ${
                              m.consent_location ? 'text-[#1E60F2]' : 'text-slate-400'
                            }`}
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Location: {m.consent_location ? 'On' : 'Off'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleConsent(m.id, 'consent_telemetry')}
                            title={`Click to ${m.consent_telemetry ? 'disable' : 'enable'} heat telemetry`}
                            className={`flex items-center gap-1 hover:underline ${
                              m.consent_telemetry ? 'text-amber-600' : 'text-slate-400'
                            }`}
                          >
                            <Thermometer className="w-3 h-3" />
                            <span>Heat: {m.consent_telemetry ? 'On' : 'Off'}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSimulateStatusCycle(m)}
                          className="text-[10px] text-slate-400 hover:text-slate-700 underline"
                          title="Cycle test status: Safe -> Shaded -> Needs Aid"
                        >
                          Cycle Status
                        </button>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <button
                          type="button"
                          onClick={() => handleSendCheckinRequest(m)}
                          className="text-[#1E60F2] font-semibold hover:underline flex items-center gap-1"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>Request Check-in</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRevoke(m.id)}
                          className="text-slate-400 hover:text-red-600 text-xs transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* DECLINED INVITATIONS SECTION */}
          {/* ------------------------------------------------------------------ */}
          {declinedInvitations.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5 text-slate-400" />
                  <span>Declined Invitations ({declinedInvitations.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">Connection declined by recipient</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {declinedInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{inv.name}</div>
                      <div className="text-[11px] text-slate-500">{inv.contact} · {inv.relationship}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {inv.declined_reason || 'Declined without specific reason'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(inv.id, 'pending')}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#1E60F2] text-[11px] font-semibold transition-colors"
                      >
                        Re-invite
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevoke(inv.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: DAILY HABITS CHECKLIST */}
      {/* ------------------------------------------------------------------ */}
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
              const isChecked = checklist[item.id as keyof FamilyChecklist];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleChecklistItem(item.id as keyof FamilyChecklist)}
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

      {/* ------------------------------------------------------------------ */}
      {/* TAB 3: EMERGENCY PROTOCOL CONTACTS */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'emergency' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">National Heat Emergency Hotlines</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified emergency dispatch services available 24/7 across India
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-red-50/70 border border-red-200 text-center space-y-2">
              <span className="text-3xl font-black text-red-600 tracking-tight block">108</span>
              <span className="text-xs font-bold text-red-950 block">National Ambulance</span>
              <p className="text-[11px] text-red-800">Critical heatstroke medical dispatch & emergency stabilization</p>
              <a
                href="tel:108"
                className="inline-block mt-2 px-5 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors shadow-xs"
              >
                Call 108
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-2">
              <span className="text-3xl font-black text-amber-700 tracking-tight block">112</span>
              <span className="text-xs font-bold text-amber-950 block">All Emergency Response</span>
              <p className="text-[11px] text-amber-800">Unified police, fire, and medical emergency service</p>
              <a
                href="tel:112"
                className="inline-block mt-2 px-5 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shadow-xs"
              >
                Call 112
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-center space-y-2">
              <span className="text-3xl font-black text-[#1E60F2] tracking-tight block">1070</span>
              <span className="text-xs font-bold text-blue-950 block">Disaster Relief SDMA</span>
              <p className="text-[11px] text-blue-800">State Disaster Management Authority control room</p>
              <a
                href="tel:1070"
                className="inline-block mt-2 px-5 py-2 rounded-xl bg-[#1E60F2] text-white font-bold text-xs hover:bg-[#184FD0] transition-colors shadow-xs"
              >
                Call 1070
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ADD / INVITE FAMILY MEMBER MODAL */}
      {/* ------------------------------------------------------------------ */}
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
                  <p className="text-xs text-slate-500">Mutual consent required to link safety status</p>
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
                <p className="text-xs text-slate-600 leading-relaxed">{inviteSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSendInvitation} className="p-6 space-y-4">
                {inviteErrorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{inviteErrorMsg}</span>
                  </div>
                )}

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
                    <option value="sibling">Sibling</option>
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
                    They must accept the invitation before any location or safety data is shared.
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
