import React, { useState } from 'react';
import { 
  PhoneCall, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  HeartPulse, 
  MapPin
} from 'lucide-react';
import { EMERGENCY_CONTACTS, HEATSTROKE_FIRST_AID } from '../../lib/emergencyContacts';
import { useLocationTracker } from '../../context/LocationContext';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const { currentLocation } = useLocationTracker();

  // Determine key from current state or city
  const determineStateKey = (loc: typeof currentLocation) => {
    const s = (loc.state + ' ' + loc.city).toLowerCase();
    if (s.includes('karnataka') || s.includes('bengaluru') || s.includes('bangalore')) return 'karnataka';
    if (s.includes('delhi')) return 'delhi';
    if (s.includes('maharashtra') || s.includes('mumbai') || s.includes('nagpur')) return 'maharashtra';
    if (s.includes('gujarat') || s.includes('ahmedabad')) return 'gujarat';
    if (s.includes('rajasthan') || s.includes('jaipur')) return 'rajasthan';
    if (s.includes('telangana') || s.includes('hyderabad')) return 'telangana';
    if (s.includes('tamil') || s.includes('chennai')) return 'tamilnadu';
    return 'karnataka';
  };

  const [selectedStateKey, setSelectedStateKey] = useState<string>(() => determineStateKey(currentLocation));

  React.useEffect(() => {
    setSelectedStateKey(determineStateKey(currentLocation));
  }, [currentLocation.state, currentLocation.city]);

  const activeContact = EMERGENCY_CONTACTS[selectedStateKey] || EMERGENCY_CONTACTS.karnataka;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-modal-enter">
        {/* Urgent Header */}
        <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 rounded-xl text-white shadow-sm sos-breathe-subtle">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Emergency Heatwave & Medical Hotlines
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  24x7 Active
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Instant one-tap direct state disaster assistance & ambulance dispatch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white btn-press transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
          {/* Current Detected Location Alert */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                  Your Current Detected Location
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {currentLocation.localityName}, {currentLocation.city} ({currentLocation.state})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 whitespace-nowrap">State:</span>
              <select
                value={selectedStateKey}
                onChange={(e) => setSelectedStateKey(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
              >
                {Object.entries(EMERGENCY_CONTACTS).map(([key, item]) => (
                  <option key={key} value={key} className="text-slate-800">
                    {item.state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick-Dial Big SOS Buttons */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Tap Any Number to Call Immediately</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Primary State Disaster Helpline */}
              <a
                href={`tel:${activeContact.disasterHelpline}`}
                className="group p-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all btn-press hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase font-semibold tracking-wider opacity-90">
                    Disaster Heat Control
                  </span>
                  <PhoneCall className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <div>
                  <span className="text-3xl font-extrabold font-mono tracking-tight block">
                    {activeContact.disasterHelpline}
                  </span>
                  <span className="text-[11px] opacity-90 block mt-1 leading-tight line-clamp-2">
                    {activeContact.disasterLabel}
                  </span>
                </div>
              </a>

              {/* Medical Emergency Ambulance (108) */}
              <a
                href={`tel:${activeContact.medicalHelpline}`}
                className="group p-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-all btn-press hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase font-semibold tracking-wider opacity-90">
                    Ambulance Rescue
                  </span>
                  <HeartPulse className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <div>
                  <span className="text-3xl font-extrabold font-mono tracking-tight block">
                    {activeContact.medicalHelpline}
                  </span>
                  <span className="text-[11px] opacity-90 block mt-1 leading-tight">
                    Emergency Medical Ambulance (Government 24x7)
                  </span>
                </div>
              </a>

              {/* National Unified Emergency (112) */}
              <a
                href="tel:112"
                className="group p-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all btn-press hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase font-semibold tracking-wider text-slate-300">
                    National Emergency
                  </span>
                  <PhoneCall className="w-4 h-4 text-slate-300 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <span className="text-3xl font-extrabold font-mono tracking-tight text-white block">
                    112
                  </span>
                  <span className="text-[11px] text-slate-300 block mt-1 leading-tight">
                    All-in-One Police, Fire & Medical Response
                  </span>
                </div>
              </a>
            </div>
          </div>

          {/* District Control Rooms for Selected State */}
          {activeContact.districtOffices.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 block">
                Local District Heat Action Control Rooms ({activeContact.state})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeContact.districtOffices.map((office, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 text-xs block">{office.name}</span>
                      {office.address && (
                        <span className="text-[11px] text-slate-500">{office.address}</span>
                      )}
                    </div>
                    <a
                      href={`tel:${office.phone.replace(/[^0-9]/g, '')}`}
                      className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-mono font-bold shrink-0 ml-2 transition-colors"
                    >
                      {office.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Heatstroke Urgent First-Aid Protocol */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Immediate First Aid for Heat Exhaustion & Heatstroke</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              {HEATSTROKE_FIRST_AID.map((step) => (
                <div key={step.step} className="p-2.5 rounded-lg bg-white border border-amber-100 flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[11px] font-mono">
                    {step.step}
                  </span>
                  <div>
                    <strong className="text-slate-900 block">{step.title}</strong>
                    <span className="text-[11px] text-slate-600 leading-relaxed">{step.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>HeatShield AI Emergency Support Network</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
