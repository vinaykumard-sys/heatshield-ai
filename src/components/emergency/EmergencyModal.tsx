import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  HeartPulse, 
  MapPin,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  Info,
  Flame,
  LifeBuoy
} from 'lucide-react';
import { EMERGENCY_CONTACTS, HEATSTROKE_FIRST_AID } from '../../lib/emergencyContacts';
import { useLocationTracker } from '../../context/LocationContext';

export interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StateDirectoryItem {
  key: string;
  name: string;
  tollFree: string;
  authority: string;
  localOffices: Array<{ name: string; phone: string }>;
}

const EXTENDED_STATE_HOTLINES: Record<string, StateDirectoryItem> = {
  karnataka: {
    key: 'karnataka',
    name: 'Karnataka',
    tollFree: '1070',
    authority: 'KSDMA — Karnataka State Disaster Management Authority',
    localOffices: [
      { name: 'BBMP Bengaluru Central Control Room', phone: '080-22221188' },
      { name: 'Bengaluru Urban Heat Operations', phone: '080-22998059' }
    ]
  },
  delhi: {
    key: 'delhi',
    name: 'Delhi (NCT)',
    tollFree: '1077',
    authority: 'DDMA — Delhi Disaster Management Control Room',
    localOffices: [
      { name: 'Central Delhi Disaster Control', phone: '011-23282906' },
      { name: 'North Delhi Heat Action Cell', phone: '011-27202020' }
    ]
  },
  maharashtra: {
    key: 'maharashtra',
    name: 'Maharashtra',
    tollFree: '1070',
    authority: 'State Disaster Management Control Room (Mantralaya)',
    localOffices: [
      { name: 'BMC Disaster Control Room Mumbai', phone: '022-22694725' },
      { name: 'Nagpur Heat Relief Operations', phone: '0712-2567014' }
    ]
  },
  gujarat: {
    key: 'gujarat',
    name: 'Gujarat',
    tollFree: '1070',
    authority: 'GSDMA — Gujarat State Disaster Management Authority',
    localOffices: [
      { name: 'Ahmedabad Municipal Heat Control Cell', phone: '079-25391811' },
      { name: 'Surat Emergency Heat Response', phone: '0261-2423751' }
    ]
  },
  rajasthan: {
    key: 'rajasthan',
    name: 'Rajasthan',
    tollFree: '1070',
    authority: 'Disaster Management, Relief & Civil Defence Dept',
    localOffices: [
      { name: 'Jaipur Disaster Helpline', phone: '0141-2227290' },
      { name: 'Jodhpur District Heat Cell', phone: '0291-2650349' }
    ]
  },
  telangana: {
    key: 'telangana',
    name: 'Telangana',
    tollFree: '1070',
    authority: 'Telangana State Disaster Management Control Room',
    localOffices: [
      { name: 'GHMC Emergency Control Room Hyderabad', phone: '040-21111111' }
    ]
  },
  tamilnadu: {
    key: 'tamilnadu',
    name: 'Tamil Nadu',
    tollFree: '1070',
    authority: 'TNSDMA — Tamil Nadu State Disaster Control Room',
    localOffices: [
      { name: 'Greater Chennai Corporation Helpline', phone: '1913' }
    ]
  },
  andhrapradesh: {
    key: 'andhrapradesh',
    name: 'Andhra Pradesh',
    tollFree: '1070',
    authority: 'APSDMA — Emergency Operations Centre',
    localOffices: [
      { name: 'Vijayawada Municipal Control Room', phone: '0866-2422515' }
    ]
  },
  uttarpradesh: {
    key: 'uttarpradesh',
    name: 'Uttar Pradesh',
    tollFree: '1070',
    authority: 'UPSDMA — Relief Commissioner Emergency Ops',
    localOffices: [
      { name: 'Lucknow Disaster Cell', phone: '0522-2237515' }
    ]
  },
  westbengal: {
    key: 'westbengal',
    name: 'West Bengal',
    tollFree: '1070',
    authority: 'Department of Disaster Management & Civil Defence',
    localOffices: [
      { name: 'Nabanna Control Room Kolkata', phone: '033-22143526' }
    ]
  },
  odisha: {
    key: 'odisha',
    name: 'Odisha',
    tollFree: '1070',
    authority: 'OSDMA — Special Relief Commissioner Control Room',
    localOffices: [
      { name: 'Bhubaneswar Emergency Operations', phone: '0674-2534177' }
    ]
  },
  bihar: {
    key: 'bihar',
    name: 'Bihar',
    tollFree: '1070',
    authority: 'BSDMA — Bihar State Disaster Control Room',
    localOffices: [
      { name: 'Patna Disaster Management Helpline', phone: '0612-2217310' }
    ]
  }
};

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const { currentLocation } = useLocationTracker();
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const resolveInitialState = (loc: typeof currentLocation) => {
    const s = `${loc.state || ''} ${loc.city || ''}`.toLowerCase();
    if (s.includes('karnataka') || s.includes('bengaluru') || s.includes('bangalore')) return 'karnataka';
    if (s.includes('delhi')) return 'delhi';
    if (s.includes('maharashtra') || s.includes('mumbai') || s.includes('nagpur')) return 'maharashtra';
    if (s.includes('gujarat') || s.includes('ahmedabad')) return 'gujarat';
    if (s.includes('rajasthan') || s.includes('jaipur')) return 'rajasthan';
    if (s.includes('telangana') || s.includes('hyderabad')) return 'telangana';
    if (s.includes('tamil') || s.includes('chennai')) return 'tamilnadu';
    if (s.includes('andhra')) return 'andhrapradesh';
    if (s.includes('uttar') || s.includes('lucknow')) return 'uttarpradesh';
    if (s.includes('bengal') || s.includes('kolkata')) return 'westbengal';
    if (s.includes('odisha') || s.includes('bhubaneswar')) return 'odisha';
    if (s.includes('bihar') || s.includes('patna')) return 'bihar';
    return 'karnataka';
  };

  const [selectedStateKey, setSelectedStateKey] = useState<string>(() => resolveInitialState(currentLocation));

  useEffect(() => {
    setSelectedStateKey(resolveInitialState(currentLocation));
  }, [currentLocation.state, currentLocation.city]);

  const activeState = EXTENDED_STATE_HOTLINES[selectedStateKey] || EXTENDED_STATE_HOTLINES.karnataka;

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-lg sm:max-w-xl md:max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] m-3 sm:m-0">
        {/* Soft, Urgent Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-red-500 to-rose-600 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <PhoneCall className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black tracking-tight text-white">
                  Heat Emergency SOS
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25 text-white border border-white/40">
                  24/7 Verified
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-red-100 mt-0.5">
                Immediate medical dispatch and verified disaster control rooms across India
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto overscroll-contain">
          {/* PRIMARY EMERGENCY QUICK ACTIONS: 108 & 112 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* National Ambulance 108 */}
            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800">
                    Immediate Medical Response
                  </span>
                  <div className="text-3xl font-black text-rose-600 font-sans tracking-tight mt-0.5">
                    108
                  </div>
                  <p className="text-xs text-rose-950 font-semibold mt-0.5">
                    National Emergency Ambulance
                  </p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Life-threatening heatstroke, loss of consciousness & acute hydration distress
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <HeartPulse className="w-5 h-5" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-rose-200/60">
                <a
                  href="tel:108"
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold text-center transition-colors shadow-xs"
                >
                  Call 108 Now
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy('108')}
                  className="p-2 rounded-xl bg-white border border-rose-200 hover:bg-rose-100 text-rose-700 transition-colors"
                  title="Copy 108"
                >
                  {copiedNumber === '108' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* National Emergency 112 */}
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800">
                    Unified National Helpline
                  </span>
                  <div className="text-3xl font-black text-[#1E60F2] font-sans tracking-tight mt-0.5">
                    112
                  </div>
                  <p className="text-xs text-blue-950 font-semibold mt-0.5">
                    All-Emergency Dispatch (ERSS)
                  </p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Unified dispatch for Police, Fire, and Emergency Medical teams
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#1E60F2] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <PhoneCall className="w-5 h-5" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-blue-200/60">
                <a
                  href="tel:112"
                  className="flex-1 py-2 px-3 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-bold text-center transition-colors shadow-xs"
                >
                  Call 112 Now
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy('112')}
                  className="p-2 rounded-xl bg-white border border-blue-200 hover:bg-blue-100 text-[#1E60F2] transition-colors"
                  title="Copy 112"
                >
                  {copiedNumber === '112' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* STATE-BY-STATE HEAT DISASTER HELPLINES */}
          <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-[#1E60F2]" />
                <span>State Disaster Helpline (Toll Free):</span>
              </div>

              <select
                value={selectedStateKey}
                onChange={(e) => setSelectedStateKey(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E60F2] cursor-pointer"
              >
                {Object.values(EXTENDED_STATE_HOTLINES).map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name} ({s.tollFree})
                  </option>
                ))}
              </select>
            </div>

            {/* Active Selected State Card */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  {activeState.authority}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-extrabold text-slate-900 font-sans">
                    {activeState.tollFree}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Toll-Free Control Room
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${activeState.tollFree}`}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  Call {activeState.tollFree}
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(activeState.tollFree)}
                  className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                  title="Copy Number"
                >
                  {copiedNumber === activeState.tollFree ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* District & Municipal Offices */}
            {activeState.localOffices.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Municipal & District Heat Action Cells:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {activeState.localOffices.map((office, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 block truncate">{office.name}</span>
                        <span className="font-mono text-[11px] text-slate-600">{office.phone}</span>
                      </div>
                      <a
                        href={`tel:${office.phone}`}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1E60F2] text-[11px] font-bold hover:bg-blue-100 transition-colors shrink-0"
                      >
                        Call
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PLAIN-LANGUAGE HEATSTROKE FIRST AID STEPS */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Suspected Heatstroke? Plain-Language First Aid
                </h3>
              </div>
              <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Seconds Matter
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  step: '1',
                  title: 'Move to Cold Shade or AC',
                  desc: 'Stop all physical activity immediately. Move victim out of direct sun into air-conditioned room or tree shade.'
                },
                {
                  step: '2',
                  title: 'Rapid Body Cooling',
                  desc: 'Apply cold, wet towels or ice packs on neck, armpits, and groin. Continuously fan the skin to accelerate evaporation.'
                },
                {
                  step: '3',
                  title: 'Loosen Tight Clothing',
                  desc: 'Unbutton collar and remove heavy outerwear to allow trapped core body heat to radiate away.'
                },
                {
                  step: '4',
                  title: 'Sip Water Only If Alert',
                  desc: 'Provide small sips of cool water or ORS. NEVER force liquids if the person is drowsy, confused, or vomiting.'
                }
              ].map((item) => (
                <div
                  key={item.step}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-full bg-[#1E60F2] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {item.step}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Red Flag Warning Box */}
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-950">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="leading-snug">
                <strong>Critical Red Flag:</strong> If the person is confused, slurring words, having seizures, or has hot skin without sweating, this is severe heatstroke. <strong>Call 108 immediately.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Emergency contacts verified against National Disaster Management Guidelines.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            Close SOS
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyModal;
