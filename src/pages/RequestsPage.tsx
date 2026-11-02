import React, { useState } from 'react';
import { 
  HelpCircle, 
  PlusCircle, 
  Droplets, 
  Wind, 
  HeartHandshake, 
  Bus, 
  AlertCircle, 
  Search
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { useAuth } from '../context/AuthContext';
import { AssistanceRequest } from '../types';
import { NewRequestModal } from '../components/requests/NewRequestModal';
import { formatTimeAgo } from '../lib/utils';

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

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">Urgent</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">Low</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Community Response System</h1>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
              RELIEF AID DISPATCH
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Submit, coordinate, and track localized hydration, shade, and welfare assistance requests.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm btn-interact self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit Assistance Request</span>
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-slate-700 shadow-sm">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-900">Public Coordination Notice:</strong> This community request hub coordinates volunteers, ORS delivery, and cooling shelter access. In medical crises (fainting, heatstroke, convulsions), immediately contact government emergency lines <strong>108 / 112</strong>.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search requests by resident, ward, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 input-interactive focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg text-xs overflow-x-auto shadow-sm">
          {['all', 'open', 'assigned', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded capitalize whitespace-nowrap font-medium btn-press transition-all ${
                statusFilter === st
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((req) => (
          <div
            key={req.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 card-interactive transition-all space-y-3.5 flex flex-col justify-between"
          >
            <div>
              {/* Card Header: Category & Priority */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  {req.category === 'water' && <Droplets className="w-3.5 h-3.5 text-blue-600" />}
                  {req.category === 'cooling' && <Wind className="w-3.5 h-3.5 text-cyan-600" />}
                  {req.category === 'cooling_centre_transport' && <Bus className="w-3.5 h-3.5 text-amber-600" />}
                  {req.category === 'general_welfare' && <HeartHandshake className="w-3.5 h-3.5 text-orange-600" />}
                  <span>{req.category.replace(/_/g, ' ')}</span>
                </span>
                {getPriorityBadge(req.priority)}
              </div>

              {/* Resident & Locality */}
              <div className="mt-2">
                <h3 className="text-sm font-bold text-slate-900">{req.resident_name}</h3>
                <p className="text-xs text-slate-500">{req.locality_name}</p>
                {req.contact_phone && (
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Contact: {req.contact_phone}</p>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2.5 leading-relaxed">
                {req.description}
              </p>

              {/* Resolution Notes if Resolved */}
              {req.resolution_notes && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  <span className="font-semibold block mb-0.5">Resolution Note:</span>
                  <p>{req.resolution_notes}</p>
                </div>
              )}
            </div>

            {/* Bottom: Volunteer & Status Actions */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Volunteer Assigned:</span>
                <span className="font-medium text-slate-900">
                  {req.assigned_volunteer_name || 'None'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Logged {formatTimeAgo(req.created_at)}</span>
                <span className={`font-semibold capitalize px-2 py-0.5 rounded ${
                  req.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  req.status === 'assigned' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {req.status}
                </span>
              </div>

              {/* Volunteer Action Buttons */}
              {isVolunteer && req.status !== 'resolved' && (
                <div className="pt-2 flex items-center gap-2">
                  {!req.assigned_volunteer_name && (
                    <button
                      onClick={() => handleAssignToMe(req.id)}
                      className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors"
                    >
                      Assign to Me
                    </button>
                  )}

                  {resolvingId === req.id ? (
                    <div className="w-full space-y-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Resolution details (e.g. delivered 20L potable water jar and ORS)..."
                        rows={2}
                        className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setResolvingId(null)}
                          className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleResolveSubmit(req.id)}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                        >
                          Confirm Resolved
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResolvingId(req.id)}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs transition-colors text-center"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 bg-white border border-slate-200 rounded-xl">
          <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
          <p className="text-sm">No assistance requests found for selected filter.</p>
        </div>
      )}

      {/* New Request Modal */}
      {isModalOpen && (
        <NewRequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={refreshList}
        />
      )}
    </div>
  );
};
