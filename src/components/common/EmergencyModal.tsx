import React, { useState } from 'react';
import { 
  PhoneCall, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  HeartPulse, 
  MapPin,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { EMERGENCY_CONTACTS, HEATSTROKE_FIRST_AID } from '../../lib/emergencyContacts';
import { useLocationTracker } from '../../context/LocationContext';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const { currentLocation } = useLocationTracker();

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
    <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-[#E5EDF5] w-full max-w-xl rounded-[20px] shadow-modal overflow-hidden animate-modal-enter">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-red-50/60 border-b border-red-100/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EF4444] text-white flex items-center justify-center shadow-xs">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Emergency Hotlines
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  24x7 Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Immediate medical aid and state disaster relief helplines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State Selector */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#F5F8FC] rounded-xl border border-[#E5EDF5]">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <MapPin className="w-4 h-4 text-[#1E60F2]" />
              <span>Location: {currentLocation.localityName || currentLocation.city}</span>
            </div>
            <select
              value={selectedStateKey}
              onChange={(e) => setSelectedStateKey(e.target.value)}
              className="bg-white border border-[#E5EDF5] rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E60F2] cursor-pointer"
            >
              <option value="karnataka">Karnataka (1070)</option>
              <option value="delhi">Delhi NCT (1077)</option>
              <option value="maharashtra">Maharashtra (1070)</option>
              <option value="gujarat">Gujarat (1070)</option>
              <option value="rajasthan">Rajasthan (1070)</option>
              <option value="telangana">Telangana (1070)</option>
              <option value="tamilnadu">Tamil Nadu (1070)</option>
            </select>
          </div>

          {/* Primary Quick Call Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={`tel:${activeContact.disasterHelpline}`}
              className="p-4 rounded-xl bg-red-50 hover:bg-red-100/80 border border-red-200/80 flex items-center justify-between text-left transition-all btn-press group"
            >
              <div>
                <div className="text-xs font-semibold text-red-900">State Disaster Management</div>
                <div className="text-xl font-extrabold text-[#EF4444] mt-0.5 font-sans">
                  {activeContact.disasterHelpline}
                </div>
                <div className="text-[11px] text-red-600">Toll-Free Control Room</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <PhoneCall className="w-4 h-4" />
              </div>
            </a>

            <a
              href="tel:108"
              className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 flex items-center justify-between text-left transition-all btn-press group"
            >
              <div>
                <div className="text-xs font-semibold text-blue-900">National Ambulance</div>
                <div className="text-xl font-extrabold text-[#1E60F2] mt-0.5 font-sans">
                  108
                </div>
                <div className="text-[11px] text-blue-600">Immediate Medical Dispatch</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#1E60F2] text-white flex items-center justify-center shrink-0 shadow-xs">
                <HeartPulse className="w-4 h-4" />
              </div>
            </a>
          </div>

          {/* Secondary Helpline Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <a
              href="tel:112"
              className="p-2.5 rounded-xl border border-[#E5EDF5] bg-white hover:bg-slate-50 text-center transition-colors"
            >
              <div className="text-[11px] text-slate-500">All Emergency</div>
              <div className="text-sm font-bold text-slate-900">112</div>
            </a>
            <a
              href="tel:102"
              className="p-2.5 rounded-xl border border-[#E5EDF5] bg-white hover:bg-slate-50 text-center transition-colors"
            >
              <div className="text-[11px] text-slate-500">Maternity & Child</div>
              <div className="text-sm font-bold text-slate-900">102</div>
            </a>
            <a
              href="tel:1077"
              className="p-2.5 rounded-xl border border-[#E5EDF5] bg-white hover:bg-slate-50 text-center transition-colors col-span-2 sm:col-span-1"
            >
              <div className="text-[11px] text-slate-500">District Collector</div>
              <div className="text-sm font-bold text-slate-900">1077</div>
            </a>
          </div>

          {/* Heatstroke Immediate First Aid */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Suspected Heatstroke? Take Immediate Action:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              {HEATSTROKE_FIRST_AID.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{item.title}: {item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-[#E5EDF5] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E5EDF5] text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyModal;
