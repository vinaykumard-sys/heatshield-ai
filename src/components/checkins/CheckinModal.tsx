import React, { useState } from 'react';
import { X, Phone, HeartPulse, AlertTriangle } from 'lucide-react';
import { WelfareCheckin, CheckinStatus } from '../../types';
import { mockDb } from '../../lib/mockDb';
import { useAuth } from '../../context/AuthContext';

interface CheckinModalProps {
  checkin: WelfareCheckin;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckinModal: React.FC<CheckinModalProps> = ({
  checkin,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<CheckinStatus>(checkin.status);
  const [notes, setNotes] = useState(checkin.checkin_notes || '');
  const [safetyConfirmed, setSafetyConfirmed] = useState(checkin.safety_confirmed);
  const [hydrationAdequate, setHydrationAdequate] = useState(checkin.hydration_adequate);
  const [coolingAccessible, setCoolingAccessible] = useState(checkin.cooling_accessible);
  const [escalationReason, setEscalationReason] = useState(checkin.escalation_reason || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    mockDb.updateCheckinStatus(checkin.id, status, {
      notes,
      safetyConfirmed: status === 'completed' ? true : safetyConfirmed,
      hydrationAdequate,
      coolingAccessible,
      escalationReason: status === 'escalated' ? escalationReason : undefined,
      volunteerName: user?.full_name || 'Community Volunteer',
    });

    setIsSubmitting(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col m-3 sm:m-0">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Record Welfare Check-in</h3>
              <p className="text-xs text-slate-500">
                Resident: <span className="text-slate-800 font-semibold">{checkin.resident_name}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm overflow-y-auto overscroll-contain max-h-[calc(90vh-80px)]">
          {/* Resident Contact Info Quick Access */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">Locality</span>
              <span className="font-medium text-slate-900 text-xs">{checkin.locality_name}</span>
            </div>
            {checkin.resident_phone && (
              <a
                href={`tel:${checkin.resident_phone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Resident</span>
              </a>
            )}
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Check-in Outcome Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'completed', label: 'Completed (Safe)', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
                { id: 'in_progress', label: 'In Progress', color: 'border-blue-300 bg-blue-50 text-blue-800' },
                { id: 'pending', label: 'Pending', color: 'border-slate-200 bg-slate-50 text-slate-700' },
                { id: 'unable_to_contact', label: 'Unable to Contact', color: 'border-amber-300 bg-amber-50 text-amber-800' },
                { id: 'escalated', label: 'Escalated', color: 'border-red-300 bg-red-50 text-red-800' },
              ].map((st) => (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => setStatus(st.id as CheckinStatus)}
                  className={`p-2 rounded-lg border text-xs font-medium text-center transition-all ${
                    status === st.id ? `${st.color} ring-2 ring-blue-600 font-bold` : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vital Safeguard Questions */}
          <div className="space-y-2.5 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-700 block mb-1">
              Field Welfare Verifications
            </span>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={safetyConfirmed}
                onChange={(e) => setSafetyConfirmed(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700">
                Resident confirmed safe and conscious
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hydrationAdequate}
                onChange={(e) => setHydrationAdequate(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700">
                Has access to adequate drinking water / ORS fluids
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={coolingAccessible}
                onChange={(e) => setCoolingAccessible(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700">
                Has functioning fan, cross-ventilation or shade
              </span>
            </label>
          </div>

          {/* Escalation field if escalated */}
          {status === 'escalated' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1.5 animate-in fade-in">
              <label className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>Reason for Urgent Escalation</span>
              </label>
              <textarea
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="Explain why this case requires team lead or medical intervention..."
                rows={2}
                required
                className="w-full bg-white border border-red-200 rounded-lg p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          )}

          {/* Check-in Field Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Check-in Notes & Observations
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Visited in person. Delivered ORS packets. Resident advised to rest during peak heat..."
              rows={3}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save Check-in Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
