import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  MapPin, 
  User, 
  X, 
  Phone, 
  RotateCcw, 
  Truck, 
  Eye, 
  Lock, 
  ArrowRight, 
  ShieldAlert, 
  AlertTriangle, 
  Droplets, 
  Stethoscope, 
  Wind, 
  Users, 
  Flame, 
  UserCheck, 
  Check, 
  Ban,
  Clock,
  Radio,
  Sparkles,
  Filter,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AssistanceRequest, RequestStatus, RequestCategory } from '../types';
import { AssistanceRequestModal } from '../components/requests/AssistanceRequestModal';
import { AssistanceRequestsService } from '../lib/assistanceRequestsService';
import { formatTimeAgo } from '../lib/utils';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';

// 4-step canonical HeatShield 3D status sequence
const PROGRESSION_STEPS = [
  { key: 'pending', label: 'Pending', icon: Radio },
  { key: 'assigned', label: 'Assigned', icon: UserCheck },
  { key: 'in_progress', label: 'In Progress', icon: Truck },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
] as const;

// Helper to determine the progression index for any request status
function getStepIndex(status: RequestStatus): number {
  switch (status) {
    case 'resolved':
      return 3; // Completed
    case 'dispatched':
    case 'in_progress':
      return 2; // In Progress
    case 'in_review':
    case 'assigned':
      return 1; // Assigned
    case 'cancelled':
      return -1;
    case 'submitted':
    case 'open':
    default:
      return 0; // Pending
  }
}

export const AssistanceRequestsPage: React.FC = () => {
  const { user, isAuthenticated, isVolunteer, isAdmin } = useAuth();
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Resolution Dialog State
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Field Responder Testing Mode
  const [isTestResponder, setIsTestResponder] = useState(false);
  const canRespond = isVolunteer || isAdmin || isTestResponder;

  const refreshList = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const all = await AssistanceRequestsService.getAllRequests();
      setRequests(all);
    } catch (e: any) {
      console.warn('Failed to load requests:', e);
      setActionError('Could not refresh assistance requests from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshList();
  }, []);

  const matchesStatusFilter = (status: RequestStatus, filter: string) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return status === 'submitted' || status === 'open';
    if (filter === 'assigned') return status === 'in_review' || status === 'assigned';
    if (filter === 'in_progress') return status === 'dispatched' || status === 'in_progress';
    if (filter === 'completed') return status === 'resolved';
    if (filter === 'cancelled') return status === 'cancelled';
    return status === filter;
  };

  const matchesCategoryFilter = (cat: RequestCategory, filter: string) => {
    if (filter === 'all') return true;
    if (filter === 'emergency') return cat === 'medical';
    return cat === filter;
  };

  const filtered = requests.filter((r) => {
    if (!matchesStatusFilter(r.status, statusFilter)) return false;
    if (!matchesCategoryFilter(r.category, categoryFilter)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.resident_name && r.resident_name.toLowerCase().includes(q)) ||
        (r.locality_name && r.locality_name.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.id && r.id.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const getResponderCallsign = () => {
    if (user?.full_name) return user.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Authorized Field Volunteer';
  };

  const handleStartReview = async (reqId: string) => {
    setIsUpdatingStatus(true);
    setActionError(null);
    const responderName = getResponderCallsign();
    const res = await AssistanceRequestsService.updateStatus(
      reqId,
      'in_review',
      undefined,
      responderName
    );
    setIsUpdatingStatus(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to update status to Assigned/In Review.');
    }
    await refreshList();
  };

  const handleDispatch = async (reqId: string) => {
    setIsUpdatingStatus(true);
    setActionError(null);
    const responderName = getResponderCallsign();
    const res = await AssistanceRequestsService.updateStatus(
      reqId,
      'dispatched',
      undefined,
      responderName
    );
    setIsUpdatingStatus(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to dispatch relief team.');
    }
    await refreshList();
  };

  const handleCancelRequest = async (reqId: string) => {
    if (!window.confirm('Are you sure you want to cancel this assistance request?')) return;
    setIsUpdatingStatus(true);
    setActionError(null);
    const res = await AssistanceRequestsService.updateStatus(
      reqId,
      'cancelled',
      'Request cancelled by resident.'
    );
    setIsUpdatingStatus(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to cancel request.');
    }
    await refreshList();
  };

  const handleResolveSubmit = async (reqId: string) => {
    if (!resolutionNotes.trim()) {
      setActionError('Please provide brief resolution notes describing the relief assistance provided.');
      return;
    }

    setIsUpdatingStatus(true);
    setActionError(null);
    const responderName = getResponderCallsign();
    const res = await AssistanceRequestsService.updateStatus(
      reqId,
      'resolved',
      resolutionNotes.trim(),
      responderName
    );
    setIsUpdatingStatus(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to resolve request.');
    } else {
      setResolvingId(null);
      setResolutionNotes('');
    }
    await refreshList();
  };

  const getCategoryDetails = (cat: RequestCategory) => {
    switch (cat) {
      case 'water':
        return { label: 'Water', icon: Droplets, color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'medical':
        return { label: 'Medical', icon: Stethoscope, color: 'text-rose-700 bg-rose-50 border-rose-200' };
      case 'cooling':
        return { label: 'Cooling', icon: Wind, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' };
      case 'general_welfare':
        return { label: 'General Welfare', icon: Users, color: 'text-emerald-800 bg-emerald-50 border-emerald-200' };
      default:
        return { label: 'Relief Aid', icon: HelpCircle, color: 'text-slate-700 bg-slate-100 border-slate-200' };
    }
  };

  // Metrics summary
  const totalCount = requests.length;
  const activeCount = requests.filter(r => r.status !== 'resolved' && r.status !== 'cancelled').length;
  const resolvedCount = requests.filter(r => r.status === 'resolved').length;

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto px-3 sm:px-6">
      <LocationTrackerBar />

      {/* 3D Elevated Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white overflow-hidden shadow-[0_20px_50px_-15px_rgba(15,23,42,0.4)] border border-slate-700/60">
        {/* Ambient atmospheric aura */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Real-Time Rapid Relief Coordination</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Assistance Requests & Dispatch Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Coordinate drinking water supply, medical triage, cooling transport, and senior welfare checks with live 3D status tracking.
            </p>

            {/* Quick telemetry stats */}
            <div className="pt-2 flex items-center gap-3 sm:gap-6 text-xs flex-wrap">
              <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <span className="text-slate-400">Total Requests:</span>{' '}
                <strong className="text-white font-extrabold">{totalCount}</strong>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 backdrop-blur-sm border border-amber-400/30">
                <span className="text-amber-200">Active Dispatches:</span>{' '}
                <strong className="text-amber-300 font-extrabold">{activeCount}</strong>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30">
                <span className="text-emerald-200">Resolved Relief:</span>{' '}
                <strong className="text-emerald-300 font-extrabold">{resolvedCount}</strong>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Responder Toggle Button */}
            {isAuthenticated && !isVolunteer && !isAdmin && (
              <button
                type="button"
                onClick={() => setIsTestResponder(!isTestResponder)}
                className={`text-xs px-3.5 py-2.5 rounded-2xl font-bold border transition-all ${
                  isTestResponder 
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md' 
                    : 'bg-white/10 text-slate-200 border-white/20 hover:bg-white/20'
                }`}
              >
                {isTestResponder ? '✓ Responder Mode ON' : 'Enable Responder Controls'}
              </button>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-black shadow-[0_10px_25px_-5px_rgba(30,96,242,0.5)] hover:scale-105 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Assistance Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unauthenticated Alert Banner */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-blue-50 border border-blue-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-blue-100/70 text-[#1E60F2] rounded-2xl border border-blue-200 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Sign In Required to Request & Track Assistance
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                Assistance requests are dispatched to real emergency volunteers and community shelters. Sign in or create a resident account to submit a request and track response progress in real time.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            state={{ from: { pathname: '/requests' } }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1E60F2] hover:bg-[#184FD0] text-white font-bold text-xs shadow-xs transition-colors shrink-0 self-stretch sm:self-auto justify-center"
          >
            <span>Sign In / Register</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Action Error Banner */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-xs flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold">{actionError}</span>
          </div>
          <button 
            type="button"
            onClick={() => setActionError(null)} 
            className="p-1 text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3D Filter & Search Control Panel */}
      <div className="space-y-3 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-[0_8px_20px_-6px_rgba(15,23,42,0.06)]">
        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0">
            Category:
          </span>
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'water', label: 'Water' },
            { id: 'medical', label: 'Medical' },
            { id: 'cooling', label: 'Cooling' },
            { id: 'general_welfare', label: 'General Welfare' },
            { id: 'emergency', label: 'Emergency' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                categoryFilter === cat.id
                  ? 'bg-[#1E60F2] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status Pills and Search Input */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0">
              Status:
            </span>
            {[
              { id: 'all', label: 'All Status' },
              { id: 'pending', label: 'Pending' },
              { id: 'assigned', label: 'Assigned' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  statusFilter === st.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 md:w-80">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search ID, name, location, aid..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              type="button"
              onClick={refreshList}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="Refresh request list"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating 3D Cards List of Requests */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3 shadow-xs">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-[#1E60F2] rounded-full animate-spin" />
            <span className="font-semibold text-slate-600">Retrieving real-time requests from HeatShield server...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                {requests.length === 0 ? 'No Assistance Requests Active' : 'No Requests Match Filter'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {requests.length === 0
                  ? 'All local community zones are safe and hydrated. Click below to submit a new assistance request.'
                  : 'Try selecting a different category or status filter above.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1E60F2] text-white text-xs font-bold shadow-md hover:bg-[#184FD0] transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Request</span>
            </button>
          </div>
        ) : (
          filtered.map(req => {
            const categoryDetails = getCategoryDetails(req.category);
            const CatIcon = categoryDetails.icon;
            const currentStepIdx = getStepIndex(req.status);
            const isOwner = user && (user.id === req.requested_by || user.full_name === req.resident_name);

            return (
              <div
                key={req.id}
                className="group relative bg-white/95 rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_35px_-10px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4 overflow-hidden"
              >
                {/* Header Row: Metadata Badges & Timestamps */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Category Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${categoryDetails.color}`}>
                      <CatIcon className="w-3.5 h-3.5" />
                      <span>{categoryDetails.label}</span>
                    </span>

                    {/* Priority Badge */}
                    {req.priority === 'urgent' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-red-600" />
                        <span>Urgent Emergency</span>
                      </span>
                    )}

                    {/* ID Chip */}
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                      #{req.id.slice(0, 8)}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(req.created_at)}</span>
                  </span>
                </div>

                {/* Main Content & Description */}
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                    {req.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1 font-medium text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.resident_name || 'Community Resident'}</span>
                    </div>

                    <div className="flex items-center gap-1 font-medium text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.locality_name}</span>
                    </div>

                    {req.contact_phone && (
                      <div className="flex items-center gap-1 font-semibold text-blue-600">
                        <Phone className="w-3.5 h-3.5 text-blue-500" />
                        <a href={`tel:${req.contact_phone}`} className="hover:underline">
                          {req.contact_phone}
                        </a>
                      </div>
                    )}

                    {req.assigned_volunteer_name && req.status !== 'resolved' && (
                      <div className="flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                        <UserCheck className="w-3 h-3" />
                        <span>Assigned to: {req.assigned_volunteer_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Resolution Notes Banner */}
                  {req.resolution_notes && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-extrabold text-emerald-800">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolution Verified:</span>
                      </div>
                      <p className="text-slate-700">{req.resolution_notes}</p>
                    </div>
                  )}
                </div>

                {/* 3D-Styled Status Progression Timeline Component */}
                {req.status !== 'cancelled' ? (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 border border-slate-200/80 mt-1">
                    <div className="grid grid-cols-4 gap-2 relative">
                      {PROGRESSION_STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isPast = idx < currentStepIdx;
                        const isCurrent = idx === currentStepIdx;

                        return (
                          <div
                            key={step.key}
                            className={`flex flex-col items-center text-center py-1.5 px-1 rounded-xl transition-all ${
                              isCurrent
                                ? 'bg-white shadow-[0_4px_12px_rgba(30,96,242,0.18)] border border-blue-200 ring-2 ring-blue-100'
                                : isPast
                                ? 'text-emerald-700'
                                : 'opacity-40 text-slate-400'
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center mb-1 text-[11px] ${
                                isCurrent
                                  ? 'bg-[#1E60F2] text-white shadow-xs animate-pulse'
                                  : isPast
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {isPast ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                            </div>
                            <span className="text-[10px] font-extrabold leading-tight">
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-slate-400" />
                    <span>Request has been cancelled.</span>
                  </div>
                )}

                {/* Workflow Controls / Responder Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 flex-wrap">
                  {canRespond && req.status !== 'resolved' && req.status !== 'cancelled' && (
                    <>
                      {(req.status === 'open' || req.status === 'submitted') && (
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleStartReview(req.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E60F2] text-xs font-bold border border-blue-200 transition-colors disabled:opacity-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Assign / Review</span>
                        </button>
                      )}

                      {(req.status === 'assigned' || req.status === 'in_review') && (
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleDispatch(req.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch Relief</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => {
                          setResolvingId(req.id);
                          setResolutionNotes('');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
                      >
                        Mark Completed
                      </button>
                    </>
                  )}

                  {/* Resident Owner Action: Cancel own pending request */}
                  {isOwner && (req.status === 'submitted' || req.status === 'open' || req.status === 'in_review') && (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleCancelRequest(req.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <Ban className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolution Modal */}
      {resolvingId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-md w-full p-6 border border-white/60 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.4)] space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Confirm Assistance Completion</h3>
              <button 
                type="button"
                onClick={() => setResolvingId(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-extrabold text-slate-700 block">
                Resolution Notes / Action Taken <span className="text-red-500">*</span>
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="E.g., Delivered 6L chilled drinking water, ORS electrolyte kits, and escorted senior resident to shade."
                rows={3}
                className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:bg-white focus:border-[#1E60F2] text-xs resize-none"
              />
              <span className="text-[11px] text-slate-400 block">
                These notes will complete the timeline progression and notify the resident.
              </span>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setResolvingId(null)}
                className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus || !resolutionNotes.trim()}
                onClick={() => handleResolveSubmit(resolvingId)}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md disabled:opacity-50 transition-all active:scale-95"
              >
                {isUpdatingStatus ? 'Saving...' : 'Confirm Completion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating 3D Assistance Request Modal */}
      <AssistanceRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          refreshList();
        }}
      />
    </div>
  );
};

export default AssistanceRequestsPage;
