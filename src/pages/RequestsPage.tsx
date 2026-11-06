import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  PlusCircle, 
  Droplets, 
  Wind, 
  HeartHandshake, 
  Bus, 
  AlertCircle, 
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  X,
  Phone,
  RotateCcw,
  Send,
  Truck,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AssistanceRequest } from '../types';
import { NewRequestModal } from '../components/requests/NewRequestModal';
import { AssistanceRequestsService } from '../lib/assistanceRequestsService';
import { formatTimeAgo } from '../lib/utils';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';

export const RequestsPage: React.FC = () => {
  const { user, isVolunteer, isAdmin } = useAuth();
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const refreshList = async () => {
    setIsLoading(true);
    try {
      const all = await AssistanceRequestsService.getAllRequests();
      setRequests(all);
    } catch (e) {
      console.warn('Failed to load requests:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshList();
  }, []);

  const matchesFilter = (status: string, filter: string) => {
    if (filter === 'all') return true;
    if (filter === 'submitted') return status === 'submitted' || status === 'open';
    if (filter === 'in_review') return status === 'in_review' || status === 'assigned';
    if (filter === 'dispatched') return status === 'dispatched' || status === 'in_progress';
    if (filter === 'resolved') return status === 'resolved';
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
        (r.id && r.id.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleStartReview = async (reqId: string) => {
    await AssistanceRequestsService.updateStatus(
      reqId,
      'in_review',
      undefined,
      user?.full_name || 'Community Responder'
    );
    await refreshList();
  };

  const handleDispatch = async (reqId: string) => {
    await AssistanceRequestsService.updateStatus(
      reqId,
      'dispatched',
      undefined,
      user?.full_name || 'Community Responder'
    );
    await refreshList();
  };

  const handleResolveSubmit = async (reqId: string) => {
    await AssistanceRequestsService.updateStatus(
      reqId,
      'resolved',
      resolutionNotes || 'Assistance successfully rendered by heat relief network.',
      user?.full_name || 'Community Responder'
    );
    setResolvingId(null);
    setResolutionNotes('');
    await refreshList();
  };

  const isResponder = isVolunteer || isAdmin;

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

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Assistance Request</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-[20px] border border-[#E5EDF5] shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'submitted', label: 'Submitted' },
            { id: 'in_review', label: 'In Review' },
            { id: 'dispatched', label: 'Dispatched' },
            { id: 'resolved', label: 'Resolved' }
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
              placeholder="Search by ID, name, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#1E60F2]"
            />
          </div>
          <button
            type="button"
            onClick={refreshList}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Refresh list"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-3xl border border-[#E5EDF5] p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-[#1E60F2] rounded-full animate-spin" />
            <span>Loading assistance requests...</span>
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
            return (
              <div
                key={req.id}
                className="bg-white rounded-3xl border border-[#E5EDF5] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-slate-300"
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      {req.id}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusDisplay.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDisplay.dotColor}`} />
                      <span>{statusDisplay.label}</span>
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {req.resident_name || 'Community Resident'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{req.locality_name}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      • {formatTimeAgo(req.created_at)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {req.description}
                  </p>

                  {/* Contact phone if provided */}
                  {req.contact_phone && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <a href={`tel:${req.contact_phone}`} className="hover:text-[#1E60F2] underline">
                        {req.contact_phone}
                      </a>
                    </div>
                  )}

                  {/* Assigned volunteer badge */}
                  {req.assigned_volunteer_name && req.status !== 'resolved' && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50/60 px-3 py-1 rounded-xl w-fit">
                      <User className="w-3.5 h-3.5 text-[#1E60F2]" />
                      <span>Assigned to: <strong>{req.assigned_volunteer_name}</strong></span>
                    </div>
                  )}

                  {req.resolution_notes && (
                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-emerald-900 text-xs space-y-0.5">
                      <span className="font-bold block">Resolution Notes:</span>
                      <span className="text-slate-700">{req.resolution_notes}</span>
                      {req.resolved_at && (
                        <span className="block text-[10px] text-slate-400 mt-1">
                          Resolved {formatTimeAgo(req.resolved_at)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Workflow Transitions */}
                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  {(req.status === 'open' || req.status === 'submitted') && (
                    <button
                      type="button"
                      onClick={() => handleStartReview(req.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E60F2] text-xs font-bold border border-blue-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Take In Review</span>
                    </button>
                  )}

                  {(req.status === 'assigned' || req.status === 'in_review') && (
                    <button
                      type="button"
                      onClick={() => handleDispatch(req.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Dispatch Team</span>
                    </button>
                  )}

                  {req.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => setResolvingId(req.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      Mark Resolved
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
              <label className="font-semibold text-slate-700 block">Resolution Notes / Action Taken</label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="E.g., Delivered cold potable water & ORS packets to residence."
                rows={3}
                className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:bg-white focus:border-[#1E60F2]"
              />
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
                onClick={() => handleResolveSubmit(resolvingId)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              >
                Confirm Resolution
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
