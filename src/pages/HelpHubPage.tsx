import React, { useState, useMemo } from 'react';
import { 
  PhoneCall, 
  Droplets, 
  Building2, 
  Stethoscope, 
  Bot, 
  WifiOff, 
  PlusCircle, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Send, 
  ExternalLink,
  ShieldAlert,
  Search,
  HelpCircle,
  HeartHandshake
} from 'lucide-react';
import { useLocationTracker } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../lib/mockDb';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { EmergencyModal } from '../components/common/EmergencyModal';
import { NewRequestModal } from '../components/requests/NewRequestModal';
import { WaterStation, CoolingCentre, HospitalResource, AssistanceRequest } from '../types';

type WaterWithDist = WaterStation & { distKm: number };
type CoolingWithDist = CoolingCentre & { distKm: number };
type HospitalWithDist = HospitalResource & { distKm: number };

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distKm: number): string {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m away`;
  }
  return `${distKm.toFixed(1)} km away`;
}

export const HelpHubPage: React.FC = () => {
  const { user } = useAuth();
  const { currentLocation, selectedZone } = useLocationTracker();

  const [activeTab, setActiveTab] = useState<'assistance' | 'cooling' | 'water' | 'hospitals' | 'assistant' | 'offline'>('assistance');
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // AI Assistant embedded quick-chat state
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantMessages, setAssistantMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([
    {
      sender: 'assistant',
      text: 'Hello! I am your HeatShield AI Safety Advisor. Ask me anything about heat symptoms, cooling tips, ORS preparation, or nearest relief centres.',
      time: 'Just now'
    }
  ]);

  const lat = currentLocation?.latitude || selectedZone?.latitude || 13.0854;
  const lon = currentLocation?.longitude || selectedZone?.longitude || 77.6250;

  // Retrieve resources
  const requests: AssistanceRequest[] = mockDb.getRequests();
  const userRequests = useMemo(() => {
    if (!user) return [];
    return requests.filter(r => r.resident_id === user.id || r.requested_by === user.full_name || r.resident_name === user.full_name);
  }, [requests, user]);

  const waterStations: WaterWithDist[] = useMemo(() => {
    const list = mockDb.getWaterStations();
    return [...list].map(w => ({
      ...w,
      distKm: getDistanceKm(lat, lon, w.latitude, w.longitude)
    })).sort((a, b) => a.distKm - b.distKm);
  }, [lat, lon]);

  const coolingCentres: CoolingWithDist[] = useMemo(() => {
    const list = mockDb.getCoolingCentres();
    return [...list].map(c => ({
      ...c,
      distKm: getDistanceKm(lat, lon, c.latitude, c.longitude)
    })).sort((a, b) => a.distKm - b.distKm);
  }, [lat, lon]);

  const hospitals: HospitalWithDist[] = useMemo(() => {
    const list = mockDb.getHospitals();
    return [...list].map(h => ({
      ...h,
      distKm: getDistanceKm(lat, lon, h.latitude, h.longitude)
    })).sort((a, b) => a.distKm - b.distKm);
  }, [lat, lon]);

  const handleSendAssistant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim()) return;

    const userText = assistantInput;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setAssistantMessages(prev => [...prev, { sender: 'user', text: userText, time }]);
    setAssistantInput('');

    // Generate responsive guidance based on query
    setTimeout(() => {
      let reply = 'For general heat safety: hydrate frequently with electrolyte water or ORS, stay in shade between 12 PM - 4 PM, and seek air-conditioned respite if feeling dizzy.';
      const lower = userText.toLowerCase();

      if (lower.includes('dizzy') || lower.includes('faint') || lower.includes('headache') || lower.includes('vomit')) {
        reply = 'WARNING: Dizziness and nausea can indicate heat exhaustion! Move immediately to a shaded or air-conditioned room, sip cold water with ORS, and loosen tight clothing. If symptoms worsen or sweating stops, call 108 immediately.';
      } else if (lower.includes('ors') || lower.includes('hydrate') || lower.includes('drink')) {
        reply = 'ORS Recipe: Mix 6 level teaspoons of sugar and 1/2 level teaspoon of salt in 1 liter of clean drinking water. Drink 250ml every 20-30 minutes during high heat exposure.';
      } else if (lower.includes('water') || lower.includes('atm')) {
        reply = `Nearest Water ATM: ${waterStations[0]?.name || 'Municipal Water Hub'} (${formatDistance(waterStations[0]?.distKm || 0.8)}). Tap the "Water ATMs" tab above for directions.`;
      } else if (lower.includes('cooling') || lower.includes('shelter')) {
        reply = `Nearest Cooling Shelter: ${coolingCentres[0]?.name || 'Community Respite Center'} (${formatDistance(coolingCentres[0]?.distKm || 1.2)}). Open daily with air conditioning and cold water.`;
      } else if (lower.includes('hospital') || lower.includes('doctor') || lower.includes('emergency')) {
        reply = `For emergency medical assistance: Call 108 (Ambulance) or 112. Nearest hospital: ${hospitals[0]?.name || 'District Hospital'} (${formatDistance(hospitals[0]?.distKm || 1.5)}).`;
      }

      setAssistantMessages(prev => [...prev, { sender: 'assistant', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 400);
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Emergency Hotline Modal */}
      <EmergencyModal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} />

      {/* New Assistance Request Modal */}
      <NewRequestModal 
        isOpen={isNewRequestOpen} 
        onClose={() => setIsNewRequestOpen(false)} 
        onSuccess={() => setIsNewRequestOpen(false)} 
      />

      <LocationTrackerBar />

      {/* TOP EMERGENCY LIFELINES BANNER */}
      <div className="bg-gradient-to-r from-rose-900 via-red-900 to-rose-950 text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-red-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-rose-300 shrink-0">
            <PhoneCall className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-200 border border-rose-400/30">
                24x7 Rapid Lifeline
              </span>
              <span className="text-xs text-rose-200">No data connection required</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
              Immediate Heat Emergency Response
            </h2>
            <p className="text-xs text-rose-200">
              National Emergency: <strong className="text-white">112</strong> &bull; Ambulance: <strong className="text-white">108</strong> &bull; Disaster Helpline: <strong className="text-white">1077</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="tel:112"
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-rose-50 text-red-900 font-extrabold text-xs shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PhoneCall className="w-4 h-4 text-red-700" />
            <span>Call 112</span>
          </a>
          <button
            onClick={() => setIsNewRequestOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Request Help</span>
          </button>
        </div>
      </div>

      {/* QUESTION 4 ANSWER HEADER: "What Should I Do?" */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
          <HeartHandshake className="w-4 h-4" />
          <span>Resident Lifelines & Relief Hub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Find Help & Immediate Relief
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
          Everything you need when facing extreme heat: submit emergency relief requests, locate air-conditioned shelters, free drinking water ATMs, and hospitals.
        </p>
      </div>

      {/* 6 HELP TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        {[
          { id: 'assistance', label: 'My Help Requests', icon: HelpCircle, badge: userRequests.length > 0 ? userRequests.length : undefined },
          { id: 'cooling', label: 'Cooling Shelters', icon: Building2, count: coolingCentres.length },
          { id: 'water', label: 'Drinking Water ATMs', icon: Droplets, count: waterStations.length },
          { id: 'hospitals', label: 'Hospital Emergency ICUs', icon: Stethoscope, count: hospitals.length },
          { id: 'assistant', label: 'AI Heat Advisor', icon: Bot },
          { id: 'offline', label: 'Offline Guidelines', icon: WifiOff }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && !isActive && (
                <span className="text-[10px] font-mono opacity-60">
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ASSISTANCE REQUESTS */}
      {activeTab === 'assistance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Your Submitted Relief Requests</h3>
              <p className="text-xs text-slate-500">Track real-time status of water requests, welfare checks, or medical transport.</p>
            </div>
            <button
              onClick={() => setIsNewRequestOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Assistance Request</span>
            </button>
          </div>

          {userRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {userRequests.map(req => {
                const statusColor = 
                  req.status === 'resolved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                  req.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  'bg-amber-100 text-amber-800 border-amber-200';

                return (
                  <div key={req.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {req.category.replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-900 font-semibold">{req.description}</p>
                      <span className="text-[11px] text-slate-400 font-mono block mt-1">
                        Locality: {req.locality_id} &bull; Contact: {req.requested_by || 'Resident'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Submitted: {new Date(req.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="capitalize font-medium text-slate-600">{req.priority} Priority</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">No Pending Assistance Requests</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You have not submitted any active requests. If you or a family member needs emergency drinking water, elder welfare check, or shade relief, submit a request below.
                </p>
              </div>
              <button
                onClick={() => setIsNewRequestOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Assistance Request</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COOLING SHELTERS */}
      {activeTab === 'cooling' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Verified Air-Conditioned Cooling Sanctuaries</h3>
              <p className="text-xs text-slate-500">Free community respite centres with cold air, rehydration salts, and seating.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search cooling shelters..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {coolingCentres
              .filter(c => searchQuery === '' || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.address.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(centre => (
                <div key={centre.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {formatDistance(centre.distKm)}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 font-semibold">
                        {centre.operating_hours}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{centre.name}</h4>
                    <p className="text-[11px] text-slate-500 flex items-start gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span>{centre.address}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">Capacity: ~{centre.capacity_estimate || 80} persons</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: WATER STATIONS */}
      {activeTab === 'water' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Verified Public Drinking Water ATMs</h3>
              <p className="text-xs text-slate-500">Reverse-osmosis chilled drinking water stations and transit hydration booths.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search water ATMs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {waterStations
              .filter(w => searchQuery === '' || w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.address.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(station => (
                <div key={station.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {formatDistance(station.distKm)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        station.free_access ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {station.free_access ? '100% Free' : `₹${station.price_per_litre}/Litre`}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{station.name}</h4>
                    <p className="text-[11px] text-slate-500 flex items-start gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span>{station.address}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono">{station.operating_hours}</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: HOSPITALS & MEDICAL ICUs */}
      {activeTab === 'hospitals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Hospital Heatstroke Treatment Units</h3>
              <p className="text-xs text-slate-500">Government & tertiary hospitals equipped with ice immersion and heatstroke emergency beds.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search hospitals..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {hospitals
              .filter(h => searchQuery === '' || h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.address.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(hosp => (
                <div key={hosp.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {formatDistance(hosp.distKm)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                        {hosp.has_heatstroke_ward ? 'Heatstroke Ward Ready' : '24/7 Emergency Care'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{hosp.name}</h4>
                    <p className="text-[11px] text-slate-500 flex items-start gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span>{hosp.address}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <a
                      href={`tel:${hosp.emergency_phone}`}
                      className="text-red-700 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>{hosp.emergency_phone}</span>
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.latitude},${hosp.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 5: AI HEAT ADVISOR */}
      {activeTab === 'assistant' && (
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[540px]">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold">HeatShield Safety AI Assistant</h3>
                <span className="text-[10px] text-cyan-300">English &bull; हिन्दी &bull; ಕನ್ನಡ</span>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {assistantMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendAssistant} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask about dizziness, hydration recipe, cooling tips..."
              value={assistantInput}
              onChange={e => setAssistantInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: OFFLINE GUIDELINES */}
      {activeTab === 'offline' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-800">
              <WifiOff className="w-5 h-5" />
              <h3 className="font-bold text-sm">Offline SMS Lifeline Service</h3>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed max-w-2xl">
              During mobile network outages or when mobile data is unavailable, send an SMS to our emergency gateway to receive immediate cooling shelter coordinates and heat alerts:
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono font-bold">
              <span className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900">
                SMS: HEAT &lt;PINCODE&gt; to 56161
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900">
                SMS: WATER &lt;PINCODE&gt; to 56161
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                1. Immediate Heat Stroke First Aid
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Call <strong>108</strong> (Ambulance) immediately.</li>
                <li>Move person to shade or air-conditioned shelter.</li>
                <li>Apply cool wet cloths to neck, armpits, and groin.</li>
                <li>Fan vigorously while misting with cool water.</li>
                <li>Do NOT give fluids if person is unconscious or semi-conscious.</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                2. Emergency ORS Home Preparation
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Take <strong>1 Liter</strong> of clean drinking water.</li>
                <li>Add <strong>6 level teaspoons</strong> of sugar.</li>
                <li>Add <strong>1/2 level teaspoon</strong> of salt.</li>
                <li>Stir until completely dissolved.</li>
                <li>Sip 250ml every 20-30 minutes during intense heat exposure.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpHubPage;
