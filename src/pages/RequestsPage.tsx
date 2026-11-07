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
  BadgeAlert,
  Droplets,
  Stethoscope,
  Wind,
  Bus,
  UserCheck,
  Check,
  Ban
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AssistanceRequest, RequestStatus, RequestCategory } from '../types';
import { NewRequestModal } from '../components/requests/NewRequestModal';
import { AssistanceRequestsService } from '../lib/assistanceRequestsService';
import { formatTimeAgo } from '../lib/utils';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';

export const RequestsPage: React.FC = () => {
  const { user, isAuthenticated, isVolunteer, isAdmin } = useAuth();
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Resolution Dialog State
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Designated Responder Testing Mode (Allows logged-in residents to test and verify responder flow)
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

  const matchesFilter = (status: RequestStatus, filter: string) => {
    if (filter === 'all') return true;
    if (filter === 'submitted') return status === 'submitted' || status === 'open';
    if (filter === 'in_review') return status === 'in_review' || status === 'assigned';
    if (filter === 'dispatched') return status === 'dispatched' || status === 'in_progress';
    if (filter === 'resolved') return status === 'resolved';
    if (filter === 'cancelled') return status === 'cancelled';
    return status === filter;
  };

  const filtered = requests.filter((r) => {
    if (!matchesFilter(r.status, statusFilter)) return false;
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
      setActionError(res.error || 'Failed to update status to In Review.');
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
      'Request cancelled by user/resident.'
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

  const getCategoryBadge = (cat: RequestCategory) => {
    switch (cat) {
      case 'water':
        return { label: 'Water Aid', icon: Droplets, color: 'text-sky-700 bg-sky-50 border-sky-200' };
      case 'medical':
        return { label: 'Medical Aid', icon: Stethoscope, color: 'text-rose-700 bg-rose-50 border-rose-200' };
      case 'cooling':
        return { label: 'Cooling / Shelter', icon: Wind, color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'cooling_centre_transport':
        return { label: 'Transportation', icon: Bus, color: 'text-purple-700 bg-purple-50 border-purple-200' };
      case 'general_welfare':
        return { label: 'Vulnerable Check', icon: UserCheck, color: 'text-amber-800 bg-amber-50 border-amber-200' };
      default:
        return { label: 'Relief Aid', icon: HelpCircle, color: 'text-slate-700 bg-slate-100 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#1E60F2]" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Community Assistance Requests
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Coordinate emergency hydration, ORS packs, cooling shelters, and vulnerable welfare checks
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Test Responder Toggle for verification */}
          {isAuthenticated && !isVolunteer && !isAdmin && (
            <button
              type="button"
              onClick={() => setIsTestResponder(!isTestResponder)}
              className={`text-xs px-3 py-2 rounded-xl font-medium border transition-colors ${
                isTestResponder 
                  ? 'bg-blue-50 text-[#1E60F2] border-blue-200 font-semibold shadow-2xs' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle field responder testing controls"
            >
              {isTestResponder ? '✓ Test Responder Mode: Active' : 'Enable Responder Controls (Test)'}
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Assistance Request</span>
          </button>
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white font-bold text-xs shadow-xs transition-colors shrink-0 self-stretch sm:self-auto justify-center"
          >
            <span>Sign In / Register</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Action Error Banner */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-[20px] border border-[#E5EDF5] shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'submitted', label: 'Submitted' },
            { id: 'in_review', label: 'In Review' },
            { id: 'dispatched', label: 'Dispatched' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                statusFilter === st.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:w-80">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ID, name, location, aid..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#1E60F2]"
            />
          </div>
          <button
            type="button"
            onClick={refreshList}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            title="Refresh list"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-3xl border border-[#E5EDF5] p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-[#1E60F2] rounded-full animate-spin" />
            <span>Loading assistance requests from database...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E5EDF5] p-12 text-center shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {requests.length === 0 ? 'No Assistance Requests Active' : 'No Requests Match Your Filter'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {requests.length === 0
                  ? 'All local community sectors are supplied. Click "New Assistance Request" if someone requires hydration or shelter aid.'
                  : 'Try selecting a different status filter or clearing your search term.'}
              </p>
            </div>
            {requests.length === 0 && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E60F2] text-white text-xs font-semibold shadow-xs hover:bg-[#184FD0] transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Request</span>
              </button>
            )}
          </div>
        ) : (
          filtered.map(req => {
            const statusDisplay = AssistanceRequestsService.getStatusDisplay(req.status);
            const categoryBadge = getCategoryBadge(req.category);
            const CatIcon = categoryBadge.icon;
            const isOwner = user && (user.id === req.requested_by || user.full_name === req.resident_name);

            return (
              <div
                key={req.id}
                className="bg-white rounded-3xl border border-[#E5EDF5] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-slate-300"
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  {/* Top Metadata Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 truncate max-w-[150px]" title={req.id}>
                      {req.id.length > 18 ? `${req.id.slice(0, 8)}...${req.id.slice(-4)}` : req.id}
                    </span>

                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusDisplay.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDisplay.dotColor}`} />
                      <span>{statusDisplay.label}</span>
                    </span>

                    {/* Category Badge */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${categoryBadge.color}`}>
                      <CatIcon className="w-3 h-3" />
                      <span>{categoryBadge.label}</span>
                    </span>

                    {/* Priority Badge */}
                    {req.priority === 'urgent' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-red-100 text-red-700 border border-red-200">
                        Urgent
                      </span>
                    )}

                    <span className="font-bold text-slate-900 text-xs">
                      {req.resident_name || 'Community Resident'}
                    </span>

                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{req.locality_name}</span>
                    </span>

                    <span className="text-[11px] text-slate-400 font-medium">
                      • {formatTimeAgo(req.created_at)}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {req.description}
                  </p>

                  {/* Contact phone if provided */}
                  {req.contact_phone && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl w-fit border border-slate-200/60">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Callback:</span>
                      <a href={`tel:${req.contact_phone}`} className="hover:text-[#1E60F2] font-semibold underline">
                        {req.contact_phone}
                      </a>
                    </div>
                  )}

                  {/* Assigned volunteer badge */}
                  {req.assigned_volunteer_name && req.status !== 'resolved' && req.status !== 'cancelled' && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50/70 px-3 py-1 rounded-xl w-fit border border-blue-200/50">
                      <User className="w-3.5 h-3.5 text-[#1E60F2]" />
                      <span>Assigned Responder: <strong>{req.assigned_volunteer_name}</strong></span>
                    </div>
                  )}

                  {/* Resolution notes */}
                  {req.resolution_notes && (
                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-emerald-900 text-xs space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolution Notes:</span>
                      </div>
                      <span className="text-slate-700 block">{req.resolution_notes}</span>
                      {req.resolved_at && (
                        <span className="block text-[10px] text-slate-400 mt-1">
                          Resolved {formatTimeAgo(req.resolved_at)} {req.assigned_volunteer_name ? `by ${req.assigned_volunteer_name}` : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Workflow Action Buttons */}
                <div className="shrink-0 flex items-center gap-2 self-stretch md:self-center justify-end flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Responder Controls */}
                  {canRespond && (
                    <>
                      {(req.status === 'open' || req.status === 'submitted') && (
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleStartReview(req.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E60F2] text-xs font-bold border border-blue-200 transition-colors disabled:opacity-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Take In Review</span>
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
                          <span>Dispatch Team</span>
                        </button>
                      )}

                      {req.status !== 'resolved' && req.status !== 'cancelled' && (
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => {
                            setResolvingId(req.id);
                            setResolutionNotes('');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </>
                  )}

                  {/* Resident Owner Action: Cancel own pending request */}
                  {isOwner && (req.status === 'submitted' || req.status === 'open' || req.status === 'in_review') && (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleCancelRequest(req.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-xs font-medium transition-colors disabled:opacity-50"
                      title="Cancel your assistance request if no longer needed"
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
        <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Resolve Assistance Request</h3>
              <button 
                type="button"
                onClick={() => setResolvingId(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 block">
                Resolution Notes / Action Taken <span className="text-red-500">*</span>
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="E.g., Delivered cold potable water, 4 ORS packets, and advised shade rest."
                rows={3}
                className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:bg-white focus:border-[#1E60F2] text-xs"
              />
              <span className="text-[11px] text-slate-400">
                Resolution notes will be visible to the community resident and logged to the welfare audit log.
              </span>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setResolvingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus || !resolutionNotes.trim()}
                onClick={() => handleResolveSubmit(resolvingId)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
              >
                {isUpdatingStatus ? 'Saving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      <NewRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          refreshList();
        }}
      />
    </div>
  );
};

export default RequestsPage;
