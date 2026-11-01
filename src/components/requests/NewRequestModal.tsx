import React, { useState } from 'react';
import { X, HelpCircle, AlertCircle, Droplets, Wind, HeartHandshake, Bus, PlusCircle } from 'lucide-react';
import { RequestCategory, RequestPriority } from '../../types';
import { mockDb } from '../../lib/mockDb';
import { useAuth } from '../../context/AuthContext';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const locations = mockDb.getLocations();

  const [category, setCategory] = useState<RequestCategory>('water');
  const [priority, setPriority] = useState<RequestPriority>('medium');
  const [localityId, setLocalityId] = useState<string>(locations[0]?.id || '');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState(user?.full_name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedLoc = locations.find(l => l.id === localityId);

    mockDb.saveRequest({
      id: `req-${Date.now()}`,
      requested_by: user?.id,
      locality_id: localityId,
      locality_name: selectedLoc?.name || 'Selected Ward',
      resident_name: contactName || 'Community Member',
      contact_phone: contactPhone,
      category,
      priority,
      description,
      status: 'open',
      created_at: new Date().toISOString()
    });

    setIsSubmitting(false);
    onSuccess();
    onClose();
  };

  const categories = [
    { id: 'water', label: 'Water / ORS Aid', icon: Droplets, color: 'text-blue-600' },
    { id: 'cooling', label: 'Cooling Support (Fan/Shade)', icon: Wind, color: 'text-cyan-600' },
    { id: 'general_welfare', label: 'Welfare Check-in', icon: HeartHandshake, color: 'text-orange-600' },
    { id: 'cooling_centre_transport', label: 'Cooling Centre Escort', icon: Bus, color: 'text-amber-600' },
    { id: 'other', label: 'Other Relief Aid', icon: PlusCircle, color: 'text-purple-600' },
  ];

  return (
    <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Submit Assistance Request</h3>
              <p className="text-xs text-slate-500">Community Volunteer Relief Coordination</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Important Non-emergency Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Non-Emergency Notice:</strong> Submitting this request coordinates community volunteers and cooling aid. It does <em>not</em> summon ambulance or government 108/112 emergency services.
            </p>
          </div>

          {/* Assistance Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Assistance Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id as RequestCategory)}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-900 font-semibold ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${cat.color}`} />
                    <span className="text-xs font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Level */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Urgency / Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'low', label: 'Low', color: 'text-slate-600' },
                { id: 'medium', label: 'Medium', color: 'text-amber-700' },
                { id: 'high', label: 'High', color: 'text-orange-700' },
                { id: 'urgent', label: 'Urgent', color: 'text-red-700' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id as RequestPriority)}
                  className={`py-1.5 px-2 rounded-md border text-xs font-semibold uppercase tracking-wide transition-all ${
                    priority === p.id
                      ? 'border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={p.color}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Locality Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Affected Locality / Ward
            </label>
            <select
              value={localityId}
              onChange={(e) => setLocalityId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.city}, {loc.state})
                </option>
              ))}
            </select>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                placeholder="Full name"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
                placeholder="+91 98XXX XXXXX"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Request Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Description of Need
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              placeholder="Describe what assistance is needed (e.g. resident cannot leave bed, tin roof temperature excessive, need drinking water cans)..."
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
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
              {isSubmitting ? 'Submitting...' : 'Dispatch Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
