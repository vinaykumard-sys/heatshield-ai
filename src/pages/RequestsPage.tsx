import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { useAuth } from '../context/AuthContext';
import { AssistanceRequest } from '../types';
import { NewRequestModal } from '../components/requests/NewRequestModal';
import { formatTimeAgo } from '../lib/utils';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';

export const RequestsPage: React.FC = () => {
  const { user, isVolunteer } = useAuth();
  const [requests, setRequests] = useState<AssistanceRequest[]>(() => mockDb.getRequests());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const refreshList = () => {
    setRequests(mockDb.getRequests());
  };

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = (r.description && r.description.toLowerCase().includes(q)) ||
        (r.resident_name && r.resident_name.toLowerCase().includes(q)) ||
        (r.locality_name && r.locality_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleAssignToMe = (reqId: string) => {
    mockDb.updateRequestStatus(
      reqId,
      'assigned',
      undefined,
      user?.full_name || 'Assigned Volunteer'
    );
    refreshList();
  };

  const handleResolveSubmit = (reqId: string) => {
    mockDb.updateRequestStatus(
      reqId,
      'resolved',
      resolutionNotes || 'Assistance successfully rendered by community volunteer network.',
      user?.full_name || 'Volunteer'
    );
    setResolvingId(null);
    setResolutionNotes('');
    refreshList();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return { label: 'Resolved', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'assigned':
        return { label: 'In Progress', class: 'bg-blue-50 text-[#1E60F2] border-blue-200' };
      case 'open':
      default:
        return { label: 'Open', class: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#1E60F2]" />
            <span>Community Assistance Requests</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Request urgent drinking water, ORS hydration packs, or check-in support
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto btn-press"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Assistance Request</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-[20px] border border-[#E5EDF5] shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'open', 'assigned', 'resolved'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'all' ? 'All Requests' : st}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none input-interactive"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-12 text-center shadow-xs space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Requests Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no active assistance requests in this view.
            </p>
          </div>
        ) : (
          filtered.map(req => {
            const badge = getStatusBadge(req.status);
            return (
              <div
                key={req.id}
                className="bg-white rounded-[20px] border border-[#E5EDF5] p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-slate-300"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.class}`}>
                      {badge.label}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {req.resident_name || 'Resident'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{req.locality_name}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      • {formatTimeAgo(req.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {req.description}
                  </p>

                  {req.resolution_notes && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-800 text-xs">
                      <span className="font-bold">Resolution: </span>
                      <span>{req.resolution_notes}</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  {isVolunteer && req.status === 'open' && (
                    <button
                      onClick={() => handleAssignToMe(req.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#1E60F2] text-white text-xs font-semibold hover:bg-[#184FD0] transition-colors btn-press shadow-xs"
                    >
                      Accept Request
                    </button>
                  )}

                  {isVolunteer && req.status === 'assigned' && (
                    <button
                      onClick={() => setResolvingId(req.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors btn-press shadow-xs"
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
        <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 border border-[#E5EDF5] shadow-modal space-y-4 animate-modal-enter">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Resolve Assistance Request</h3>
              <button onClick={() => setResolvingId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-semibold text-slate-700 block">Resolution Notes / Action Taken</label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="E.g., Delivered 5L potable water & ORS packets to residence."
                rows={3}
                className="w-full p-3 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none input-interactive"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResolvingId(null)}
                className="px-4 py-2 rounded-xl border border-[#E5EDF5] text-slate-600 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolveSubmit(resolvingId)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
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
          setIsModalOpen(false);
          refreshList();
        }}
      />
    </div>
  );
};

export default RequestsPage;
