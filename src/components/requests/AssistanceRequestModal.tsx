import React, { useState, useEffect } from 'react';
import { 
  X, 
  Droplets, 
  Stethoscope, 
  Wind, 
  Users, 
  Flame, 
  MapPin, 
  Phone, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Truck, 
  Check, 
  Copy, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Send,
  Radio
} from 'lucide-react';
import { RequestCategory, RequestPriority } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLocationTracker } from '../../context/LocationContext';
import { AssistanceRequestsService } from '../../lib/assistanceRequestsService';

export interface AssistanceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (requestId?: string) => void;
  defaultCategory?: RequestCategory;
}

// 5 Core Categories requested in task specification
const CATEGORIES: {
  id: RequestCategory | 'emergency';
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  borderColor: string;
  glowColor: string;
  badgeBg: string;
  priorityDefault: RequestPriority;
}[] = [
  {
    id: 'water',
    label: 'Water',
    sublabel: 'Emergency drinking water & hydration kits',
    icon: Droplets,
    color: 'text-blue-600',
    borderColor: 'border-blue-500/40 hover:border-blue-500',
    glowColor: 'shadow-[0_8px_20px_-4px_rgba(30,96,242,0.3)]',
    badgeBg: 'bg-blue-50 text-blue-700',
    priorityDefault: 'medium',
  },
  {
    id: 'medical',
    label: 'Medical',
    sublabel: 'Heat exhaustion, dizziness & medical aid',
    icon: Stethoscope,
    color: 'text-rose-600',
    borderColor: 'border-rose-500/40 hover:border-rose-500',
    glowColor: 'shadow-[0_8px_20px_-4px_rgba(244,63,94,0.3)]',
    badgeBg: 'bg-rose-50 text-rose-700',
    priorityDefault: 'high',
  },
  {
    id: 'cooling',
    label: 'Cooling',
    sublabel: 'Cooling shelter transit, misting & shaded relief',
    icon: Wind,
    color: 'text-cyan-600',
    borderColor: 'border-cyan-500/40 hover:border-cyan-500',
    glowColor: 'shadow-[0_8px_20px_-4px_rgba(6,182,212,0.3)]',
    badgeBg: 'bg-cyan-50 text-cyan-700',
    priorityDefault: 'medium',
  },
  {
    id: 'general_welfare',
    label: 'General Welfare',
    sublabel: 'Senior check-ins, disability & pet heat safety',
    icon: Users,
    color: 'text-emerald-600',
    borderColor: 'border-emerald-500/40 hover:border-emerald-500',
    glowColor: 'shadow-[0_8px_20px_-4px_rgba(16,185,129,0.3)]',
    badgeBg: 'bg-emerald-50 text-emerald-700',
    priorityDefault: 'medium',
  },
  {
    id: 'emergency',
    label: 'Emergency',
    sublabel: 'Immediate heatstroke SOS & critical rescue',
    icon: Flame,
    color: 'text-amber-600',
    borderColor: 'border-amber-500/40 hover:border-amber-500',
    glowColor: 'shadow-[0_8px_20px_-4px_rgba(245,158,11,0.35)]',
    badgeBg: 'bg-amber-50 text-amber-700',
    priorityDefault: 'urgent',
  },
];

// Timeline steps: Pending -> Assigned -> In Progress -> Completed
const TIMELINE_STEPS = [
  { key: 'pending', label: 'Pending', desc: 'Dispatched to central queue', icon: Radio },
  { key: 'assigned', label: 'Assigned', desc: 'Field volunteer appointed', icon: UserCheck },
  { key: 'in_progress', label: 'In Progress', desc: 'Responder on route to location', icon: Truck },
  { key: 'completed', label: 'Completed', desc: 'Relief verified on site', icon: CheckCircle2 },
] as const;

export const AssistanceRequestModal: React.FC<AssistanceRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultCategory = 'water',
}) => {
  const { user, isAuthenticated } = useAuth();
  const { currentLocation } = useLocationTracker();

  // Selected Category (Water, Medical, Cooling, General Welfare, Emergency)
  const [selectedCategory, setSelectedCategory] = useState<RequestCategory | 'emergency'>(defaultCategory);
  const [priority, setPriority] = useState<RequestPriority>('medium');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState(
    currentLocation?.localityName || currentLocation?.displayName || 'Bengaluru Urban'
  );
  const [contactName, setContactName] = useState(user?.full_name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');

  // Submission & Timeline States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0); // 0: Pending, 1: Assigned, 2: In Progress, 3: Completed
  const [copiedId, setCopiedId] = useState(false);

  // Sync initial location & auth values
  useEffect(() => {
    if (user?.full_name && !contactName) setContactName(user.full_name);
    if (user?.phone && !contactPhone) setContactPhone(user.phone);
  }, [user]);

  useEffect(() => {
    if (currentLocation?.localityName && locationName === 'Bengaluru Urban') {
      setLocationName(currentLocation.localityName);
    }
  }, [currentLocation]);

  // Adjust default priority when category changes
  useEffect(() => {
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
    if (cat) {
      setPriority(cat.priorityDefault);
    }
  }, [selectedCategory]);

  // Manage body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      // Reset submission state when closing
      setSubmittedRequestId(null);
      setCurrentStepIndex(0);
      setValidationError(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!description.trim() || description.trim().length < 5) {
      setValidationError('Please provide at least 5 characters describing the assistance required.');
      return;
    }

    if (!locationName.trim() || locationName.trim().length < 3) {
      setValidationError('Please enter a specific address, locality or landmark for dispatch.');
      return;
    }

    if (!contactName.trim() || contactName.trim().length < 2) {
      setValidationError('Please enter the resident or contact person name.');
      return;
    }

    const cleanPhone = contactPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      setValidationError('Please enter a valid telephone or mobile number for responder coordination.');
      return;
    }

    setIsSubmitting(true);

    // Map 'emergency' to 'medical' category with urgent priority
    const actualCategory: RequestCategory = selectedCategory === 'emergency' ? 'medical' : selectedCategory;
    const actualPriority: RequestPriority = selectedCategory === 'emergency' ? 'urgent' : priority;

    try {
      const result = await AssistanceRequestsService.submitRequest({
        category: actualCategory,
        priority: actualPriority,
        description: description.trim(),
        locationName: locationName.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        userId: user?.id,
      });

      setIsSubmitting(false);

      if (result.success && result.requestId) {
        setSubmittedRequestId(result.requestId);
        setCurrentStepIndex(0); // Start at Pending
        onSuccess?.(result.requestId);

        // Auto-progress demo timeline after 1.8s to show assignment
        setTimeout(() => {
          setCurrentStepIndex(1); // Assigned
        }, 1800);
      } else {
        setValidationError(result.error || 'Failed to submit request. Please try again.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setValidationError(err?.message || 'Network error while contacting HeatShield dispatch.');
    }
  };

  const handleCopyId = () => {
    if (!submittedRequestId) return;
    navigator.clipboard.writeText(submittedRequestId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* 3D Immersive Backdrop Blur Overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Floating 3D Modal Box with Depth and Soft Glow */}
      <div 
        className="relative z-10 w-full max-w-2xl bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35),0_0_0_1px_rgba(255,255,255,0.8)] overflow-hidden transition-all duration-300 animate-scale-in"
        style={{
          boxShadow: '0 30px 70px -15px rgba(15, 23, 42, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)'
        }}
      >
        {/* Header Bar */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-50/90 via-white to-blue-50/50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1E60F2] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(30,96,242,0.35)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Assistance Dispatch</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 text-[#1E60F2] border border-blue-200">
                  Live 24/7
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Rapid thermal safety, hydration & emergency relief dispatch
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-all active:scale-95"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[calc(88vh-130px)] overflow-y-auto">
          {/* Post-Submission Animated 3D-styled Status Progression Timeline */}
          {submittedRequestId ? (
            <div className="space-y-6 py-2 animate-fade-in">
              {/* Success Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-extrabold text-emerald-950">
                    Assistance Request Dispatched
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Your request has been broadcasted to local field response units and volunteers.
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-emerald-900">Request ID:</span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 border border-emerald-300 text-emerald-900 font-mono text-[11px] font-bold hover:bg-white shadow-2xs transition-all active:scale-95"
                    >
                      <span>{submittedRequestId.slice(0, 13)}...</span>
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3D-Styled Animated Status Progression Timeline */}
              <div className="p-5 rounded-3xl bg-gradient-to-b from-slate-50/90 to-white border border-slate-200/90 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-bold text-slate-800 tracking-tight uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#1E60F2]" />
                    <span>Live Response Progression</span>
                  </span>
                  <span className="text-[11px] font-semibold text-[#1E60F2] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Step {currentStepIndex + 1} of 4
                  </span>
                </div>

                {/* Stepper Grid with Connected Animated Energy Line */}
                <div className="relative">
                  {/* Background Progress Track */}
                  <div className="hidden sm:block absolute top-7 left-8 right-8 h-1 bg-slate-200 rounded-full pointer-events-none" />
                  
                  {/* Dynamic Glowing Progress Fill */}
                  <div 
                    className="hidden sm:block absolute top-7 left-8 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(30,96,242,0.5)] pointer-events-none"
                    style={{
                      width: `calc(${((currentStepIndex) / (TIMELINE_STEPS.length - 1)) * 100}% - 3rem)`,
                    }}
                  />

                  {/* 4 Step Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-2 relative z-10">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const Icon = step.icon;
                      const isPast = idx < currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      const isFuture = idx > currentStepIndex;

                      return (
                        <div
                          key={step.key}
                          onClick={() => setCurrentStepIndex(idx)}
                          className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer text-center flex flex-col items-center select-none ${
                            isCurrent
                              ? 'bg-white border-[#1E60F2] shadow-[0_12px_24px_-6px_rgba(30,96,242,0.35)] ring-2 ring-blue-100 scale-105'
                              : isPast
                              ? 'bg-blue-50/60 border-blue-200 text-slate-700'
                              : 'bg-white/80 border-slate-200/80 opacity-60 hover:opacity-90'
                          }`}
                        >
                          {/* 3D Icon Node */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 mb-2 shadow-xs ${
                              isCurrent
                                ? 'bg-[#1E60F2] text-white shadow-[0_4px_12px_rgba(30,96,242,0.4)] animate-pulse'
                                : isPast
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {isPast ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                          </div>

                          <div className="font-extrabold text-xs text-slate-900 leading-tight">
                            {step.label}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                            {step.desc}
                          </div>

                          {isCurrent && (
                            <span className="mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-[#1E60F2]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1E60F2] animate-ping" />
                              Active
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Responder Simulation Buttons for Verification */}
                <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Advance timeline state:</span>
                  <div className="flex items-center gap-1.5">
                    {TIMELINE_STEPS.map((step, idx) => (
                      <button
                        key={step.key}
                        type="button"
                        onClick={() => setCurrentStepIndex(idx)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${
                          currentStepIndex === idx
                            ? 'bg-[#1E60F2] text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {step.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl bg-[#1E60F2] hover:bg-[#184FD0] text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <span>Done</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {validationError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="font-semibold">{validationError}</span>
                </div>
              )}

              {/* 1. Category 3D Floating Cards Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Select Relief Assistance Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.id;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between group ${
                          isSelected
                            ? `bg-white ${cat.borderColor} ${cat.glowColor} ring-2 ring-blue-500/20 scale-[1.02]`
                            : 'bg-slate-50/60 border-slate-200/90 hover:bg-white hover:border-slate-300'
                        } ${cat.id === 'emergency' ? 'col-span-2 sm:col-span-1' : ''}`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs ${
                                isSelected ? cat.badgeBg : 'bg-white text-slate-500 border border-slate-200/80'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-[#1E60F2] ring-4 ring-blue-100" />
                            )}
                          </div>
                          <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-[#1E60F2] transition-colors">
                            {cat.label}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                            {cat.sublabel}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Location / Dispatch Landmark */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">
                  Exact Location or Street Landmark <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. 5th Main, Indiranagar near City Metro Station"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* 3. Description & Specific Needs */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">
                  Assistance Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the situation, number of people needing water/cooling, senior citizen assistance, or symptoms..."
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                />
              </div>

              {/* 4. Contact & Telephone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">
                    Resident / Contact Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">
                    Callback Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-[#1E60F2] hover:bg-[#184FD0] disabled:opacity-50 text-white font-extrabold text-xs shadow-[0_8px_20px_-4px_rgba(30,96,242,0.4)] transition-all active:scale-95 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting to Dispatch...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit Assistance Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssistanceRequestModal;
