import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  AlertCircle, 
  Droplets, 
  Wind, 
  HeartHandshake, 
  Bus, 
  PlusCircle, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  User, 
  HeartPulse, 
  AlertTriangle,
  RotateCcw,
  Check,
  Copy
} from 'lucide-react';
import { RequestCategory, RequestPriority } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLocationTracker } from '../../context/LocationContext';
import { AssistanceRequestsService } from '../../lib/assistanceRequestsService';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (requestId?: string) => void;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { currentLocation } = useLocationTracker();

  // Form Fields
  const [category, setCategory] = useState<RequestCategory>('water');
  const [priority, setPriority] = useState<RequestPriority>('medium');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState(
    currentLocation?.localityName || currentLocation?.city || 'Bengaluru Urban'
  );
  const [contactName, setContactName] = useState(user?.full_name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    requestId: string;
    status: string;
  } | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSubmissionError(null);

    // Client-side strict validation
    if (!category) {
      setValidationError('Please select an assistance category.');
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setValidationError('Please provide at least 5 characters describing what assistance is needed.');
      return;
    }

    if (!locationName.trim() || locationName.trim().length < 3) {
      setValidationError('Please provide a specific street, landmark, or neighborhood for dispatch.');
      return;
    }

    setIsSubmitting(true);

    const result = await AssistanceRequestsService.submitRequest({
      category,
      priority,
      description,
      locationName,
      contactName,
      contactPhone,
      userId: user?.id
    });

    setIsSubmitting(false);

    if (result.success && result.requestId) {
      setSubmissionSuccess({
        requestId: result.requestId,
        status: 'Submitted'
      });
      onSuccess(result.requestId);
    } else {
      setSubmissionError(result.error || 'Failed to submit assistance request. Please try again.');
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleClose = () => {
    setSubmissionSuccess(null);
    setSubmissionError(null);
    setValidationError(null);
    onClose();
  };

  const categories = [
    { id: 'water', label: '💧 Water', desc: 'Bottled water, ORS electrolyte sachets' },
    { id: 'cooling', label: '🧊 Cooling / shelter', desc: 'Misting, shade access, fan cooling' },
    { id: 'general_welfare', label: '👤 Welfare check', desc: 'Check on isolated senior citizen or child' },
    { id: 'cooling_centre_transport', label: '🚌 Transport aid', desc: 'Assistance to reach nearest cooling centre' },
    { id: 'other', label: '➕ Other relief aid', desc: 'Emergency thermal supplies or guidance' },
  ];

  return (
    <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-[#1E60F2] rounded-2xl border border-blue-200">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Community Assistance Request</h3>
              <p className="text-xs text-slate-500">Mutual aid, cooling shelters, and hydration supply</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* SUCCESS CONFIRMATION STATE */}
        {/* ------------------------------------------------------------------ */}
        {submissionSuccess ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xl font-bold text-slate-900 tracking-tight">Request Received & Registered</h4>
              <p className="text-xs sm:text-sm text-slate-600">
                Your request has been officially recorded and queued for nearby community responders.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-sm mx-auto space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">Request Tracking ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {submissionSuccess.requestId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyId(submissionSuccess.requestId)}
                    title="Copy Tracking ID"
                    className="p-1 text-slate-500 hover:text-[#1E60F2] transition-colors"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">Live Status:</span>
                <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-amber-50 text-amber-800 border border-amber-200">
                  {submissionSuccess.status}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white font-bold text-xs shadow-xs transition-colors"
              >
                Done / View Requests
              </button>
            </div>
          </div>
        ) : submissionError ? (
          /* ------------------------------------------------------------------ */
          /* FAILURE / HONEST ERROR STATE */
          /* ------------------------------------------------------------------ */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 mx-auto flex items-center justify-center border border-red-200 shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xl font-bold text-slate-900 tracking-tight">
                Could Not Submit Request
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                {submissionError}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSubmissionError(null)}
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-[#1E60F2] text-white font-bold text-xs hover:bg-[#184FD0] transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try again</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------------ */
          /* ACTIVE REQUEST FORM */
          /* ------------------------------------------------------------------ */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs sm:text-sm">
            {/* Non-Emergency Notice */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-snug">
                <strong>Non-Emergency Aid:</strong> For severe symptoms, sudden confusion, or heatstroke, dial <strong>108</strong> (Ambulance) or <strong>112</strong> (Emergency) immediately.
              </p>
            </div>

            {/* Validation Error Banner */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Step: Category */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900">
                Assistance Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id as RequestCategory)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#1E60F2] bg-blue-50/70 text-slate-900 font-semibold ring-2 ring-blue-500/20 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold block">{cat.label}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{cat.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Short Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-900">
                  Description of Need <span className="text-red-500">*</span>
                </label>
                <span className={`text-[10px] ${description.trim().length >= 5 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {description.trim().length}/5 min characters
                </span>
              </div>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what is needed (e.g. 2 cold drinking water bottles and ORS sachets for elderly street vendor resting in shade)"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Location & Landmark <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Street name, landmark, cross road, or ward"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact / Resident Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1E60F2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Callback Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1E60F2]"
                  />
                </div>
              </div>
            </div>

            {/* Priority Selector */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-700">Urgency Level:</span>
              <div className="flex items-center gap-1.5">
                {(['low', 'medium', 'urgent'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                      priority === p
                        ? p === 'urgent'
                          ? 'bg-red-600 text-white'
                          : 'bg-[#1E60F2] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !description.trim() || !locationName.trim()}
                className="px-6 py-2.5 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Registering request...' : 'Submit Assistance Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewRequestModal;
