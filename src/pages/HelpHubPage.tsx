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
  ChevronDown,
  ChevronUp, 
  Send, 
  ExternalLink,
  ShieldAlert,
  Search,
  HelpCircle,
  HeartHandshake,
  Heart,
  Thermometer,
  Shield,
  LifeBuoy,
  FileQuestion,
  Users,
  Compass
} from 'lucide-react';
import { useLocationTracker } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../lib/mockDb';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { EmergencyModal } from '../components/common/EmergencyModal';
import { NewRequestModal } from '../components/requests/NewRequestModal';
import { WaterStation, CoolingCentre, HospitalResource, AssistanceRequest } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

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

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'safety' | 'facilities' | 'advisory' | 'civic';
}

const FAQ_LIST: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'safety',
    question: 'What is the critical difference between heat exhaustion and heatstroke?',
    answer: 'Heat exhaustion causes heavy sweating, pale cold clammy skin, dizziness, headache, and nausea. The victim is fully conscious and will recover with shade, rest, and electrolyte hydration. Heatstroke is a life-threatening medical emergency where the body loses ability to cool itself: body temperature exceeds 40°C, skin turns hot and dry (or profusely sweating), the person becomes confused, slurs speech, or faints. In suspected heatstroke, call 108 immediately and begin active cold-water cooling without forcing drinks.'
  },
  {
    id: 'faq-2',
    category: 'facilities',
    question: 'Where can I access free air-conditioned respite and clean drinking water?',
    answer: 'During declared heatwave days, all municipal cooling sanctuaries, public libraries, community halls, and Metro station concourses operate as free public heat respite shelters. They provide air-conditioned seating, clean drinking water, and ORS packets. Free reverse-osmosis (RO) drinking water ATMs are open 24/7 across major transit hubs, parks, and bus terminals. Use the "Cooling Shelters" and "Water ATMs" tabs on this page for live walking directions.'
  },
  {
    id: 'faq-3',
    category: 'advisory',
    question: 'How does HeatShield calculate my local heat risk level?',
    answer: 'HeatShield analyzes real-time weather readings from IMD and Open-Meteo weather stations, combining dry-bulb ambient temperature, relative humidity ("feels-like" thermal index), solar UV intensity, and wind speed. We then adjust this against NDMA (National Disaster Management Authority) clinical thresholds and your personal health vulnerability flags (e.g., senior citizen, heart condition, or outdoor laborer) to deliver actionable safety precautions.'
  },
  {
    id: 'faq-4',
    category: 'safety',
    question: 'Who qualifies for priority home check-ins during red heatwave warnings?',
    answer: 'During Severe or Extreme heatwave alerts, community welfare volunteers and municipal health teams prioritize visits to: seniors living alone (60+), individuals with diagnosed cardiovascular or respiratory conditions, pregnant mothers, households with infants under 5, and residents living in tin or sheet-roof housing. You can flag these in your "My Account" settings to ensure your household is included.'
  },
  {
    id: 'faq-5',
    category: 'safety',
    question: 'How do I prepare an emergency Oral Rehydration Solution (ORS) at home?',
    answer: 'Mix exactly: 1 Liter of clean drinking water + 6 level teaspoons of sugar + 1/2 level teaspoon of table salt. Stir until completely dissolved. Drink small sips (around 250ml) every 20-30 minutes during prolonged heat exposure. Discard any solution left over after 24 hours.'
  },
  {
    id: 'faq-6',
    category: 'civic',
    question: 'What should I do if a nearby water ATM is dry or a cooling shelter is closed?',
    answer: 'If you encounter an empty drinking water ATM or an unexpectedly closed respite shelter, report it immediately through HeatShield or dial the Municipal Corporation Control Center at 1533 (toll-free). Civic authorities will dispatch mobile water tankers and inspect the facility.'
  },
  {
    id: 'faq-7',
    category: 'advisory',
    question: 'What are the mandatory worker safety guidelines during peak afternoon hours?',
    answer: 'Under NDMA and state labor guidelines during heatwave warnings, outdoor construction, manual loading, and road work must pause between 12:00 PM and 3:00 PM. Employers are legally required to provide covered shaded rest areas, cool potable drinking water with electrolytes, and on-site first-aid kits.'
  },
  {
    id: 'faq-8',
    category: 'safety',
    question: 'Can pets and community animals suffer heatstroke, and how can we protect them?',
    answer: 'Yes! Animals cannot sweat like humans and heat up rapidly. Keep pets indoors during peak hours, never leave animals inside parked vehicles (even with windows cracked), and place shallow clay bowls of fresh water in shaded street corners for community dogs, cats, and birds.'
  }
];

export const HelpHubPage: React.FC = () => {
  const { user } = useAuth();
  const { currentLocation, selectedZone } = useLocationTracker();

  const [activeTab, setActiveTab] = useState<'faq' | 'cooling' | 'water' | 'hospitals' | 'assistance' | 'assistant' | 'civic'>('faq');
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>('faq-1');

  // AI Assistant embedded quick-chat state
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantMessages, setAssistantMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([
    {
      sender: 'assistant',
      text: 'Hello! I am your HeatShield Safety Advisor. Ask me anything about heat symptoms, cooling tips, ORS preparation, or nearest relief centres.',
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

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_LIST;
    const q = searchQuery.toLowerCase();
    return FAQ_LIST.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  }, [searchQuery]);

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto px-4 sm:px-6">
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
      <Card padding="lg" className="border-rose-200/90 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="danger" size="sm">24x7 Emergency Lifeline</Badge>
                <span className="text-xs text-[#64748B]">Toll-Free Direct Calls</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#0F172A]">
                Immediate Heat Emergency Assistance
              </h2>
              <p className="text-xs text-[#64748B]">
                Medical Ambulance: <strong className="text-rose-700">108</strong> &bull; All-India Emergency: <strong className="text-[#1E60F2]">112</strong> &bull; Disaster Desk: <strong className="text-amber-700">1070 / 1077</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="tel:108"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call 108</span>
            </a>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsNewRequestOpen(true)}
              icon={<PlusCircle className="w-4 h-4 text-[#1E60F2]" />}
            >
              <span>Request Aid</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* HEADER: RESIDENT LIFELINES & RELIEF HUB */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#1E60F2] uppercase tracking-wider">
          <HeartHandshake className="w-4 h-4" />
          <span>Resident Lifelines & Relief Hub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Help Hub & Community Protection
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-3xl">
          Everything you need during extreme weather: emergency first-aid protocols, clean drinking water ATMs, air-conditioned cooling sanctuaries, civic helplines, and clear answers.
        </p>
      </div>

      {/* 4-STEP HEAT EMERGENCY ACTION GUIDE */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EDF5]">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">
              Extreme Heat Emergency: 4 Life-Saving Action Steps
            </h2>
            <p className="text-xs text-[#64748B]">
              Follow this sequence if someone exhibits signs of thermal distress or heatstroke.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-[#1E60F2] text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <Badge variant="subtle" size="sm">Recognize</Badge>
            </div>
            <h3 className="text-xs font-bold text-[#0F172A]">Spot Danger Symptoms</h3>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Check for dizziness, confusion, hot dry or heavily sweating skin, rapid pulse, and inability to stand.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-[#1E60F2] text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <Badge variant="subtle" size="sm">Cooling</Badge>
            </div>
            <h3 className="text-xs font-bold text-[#0F172A]">Move to Cooler Respite</h3>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Move indoors to an air-conditioned room or dense tree canopy immediately. Loosen restrictive clothing.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-[#1E60F2] text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <Badge variant="subtle" size="sm">Hydration</Badge>
            </div>
            <h3 className="text-xs font-bold text-[#0F172A]">Active Cooling & ORS</h3>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Apply cool wet cloths to the neck, armpits, and groin. Sip small amounts of cool water with ORS if conscious.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                4
              </span>
              <Badge variant="danger" size="sm">Emergency</Badge>
            </div>
            <h3 className="text-xs font-bold text-red-950">Call 108 Ambulance</h3>
            <p className="text-[11px] text-red-900 leading-relaxed">
              If victim is incoherent, vomiting, or body temperature remains dangerously elevated, dial 108 immediately.
            </p>
          </div>
        </div>
      </Card>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#E5EDF5]">
        {[
          { id: 'faq', label: 'Safety FAQs', icon: FileQuestion },
          { id: 'cooling', label: 'Cooling Shelters', icon: Building2, count: coolingCentres.length },
          { id: 'water', label: 'Drinking Water ATMs', icon: Droplets, count: waterStations.length },
          { id: 'hospitals', label: 'Hospitals & ICUs', icon: Stethoscope, count: hospitals.length },
          { id: 'assistance', label: 'My Help Requests', icon: HelpCircle, badge: userRequests.length > 0 ? userRequests.length : undefined },
          { id: 'assistant', label: 'AI Heat Advisor', icon: Bot },
          { id: 'civic', label: 'Civic Directory', icon: PhoneCall }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-[#1E60F2] text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-[#64748B] hover:bg-slate-50 border border-[#E5EDF5]'
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

      {/* TAB 1: FAQ ACCORDION */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Frequently Asked Heatwave Questions
              </h3>
              <p className="text-xs text-[#64748B]">
                Clear, verified medical and community advice for staying safe during high temperatures.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search safety questions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E5EDF5] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map(faq => {
              const isOpen = expandedFaq === faq.id;
              return (
                <Card
                  key={faq.id}
                  padding="none"
                  className="overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isOpen ? 'bg-blue-50 text-[#1E60F2]' : 'bg-slate-100 text-[#64748B]'
                      }`}>
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#0F172A]">
                        {faq.question}
                      </span>
                    </div>

                    <div className="shrink-0 text-[#64748B]">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#1E60F2]" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-[#E5EDF5] bg-slate-50/40">
                      <p className="mt-2 text-slate-700">{faq.answer}</p>
                    </div>
                  )}
                </Card>
              );
            })}

            {filteredFaqs.length === 0 && (
              <Card padding="lg" className="text-center py-10 space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-[#0F172A]">No Questions Match "{searchQuery}"</h4>
                <p className="text-xs text-[#64748B]">
                  Try another keyword or tap the "AI Heat Advisor" tab to ask our virtual assistant directly.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COOLING SHELTERS */}
      {activeTab === 'cooling' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Verified Public Cooling Sanctuaries
              </h3>
              <p className="text-xs text-[#64748B]">
                Free community respite centers with cold air, rehydration salts, and seating.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search cooling shelters..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E5EDF5] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coolingCentres
              .filter(c => searchQuery === '' || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.address.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(centre => (
                <Card key={centre.id} padding="md" className="space-y-3 flex flex-col justify-between hoverable">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="success" size="sm">
                        {formatDistance(centre.distKm)}
                      </Badge>
                      <span className="text-[11px] font-mono text-[#64748B] font-semibold">
                        {centre.operating_hours}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#0F172A] leading-snug">{centre.name}</h4>
                    <p className="text-[11px] text-[#64748B] flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#1E60F2] shrink-0 mt-0.5" />
                      <span>{centre.address}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E5EDF5] flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B] font-medium">Capacity: ~{centre.capacity_estimate || 80}</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1E60F2] font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: WATER STATIONS */}
      {activeTab === 'water' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Public Drinking Water ATMs & RO Stations
              </h3>
              <p className="text-xs text-[#64748B]">
                Reverse-osmosis chilled drinking water stations and transit hydration booths.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search water ATMs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E5EDF5] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waterStations
              .filter(w => searchQuery === '' || w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.address.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(station => (
                <Card key={station.id} padding="md" className="space-y-3 flex flex-col justify-between hoverable">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="primary" size="sm">
                        {formatDistance(station.distKm)}
                      </Badge>
                      <Badge variant={station.free_access ? 'success' : 'warning'} size="sm">
                        {station.free_access ? '100% Free' : `₹${station.price_per_litre}/Litre`}
                      </Badge>
                    </div>

                    <h4 className="text-xs font-bold text-[#0F172A] leading-snug">{station.name}</h4>
                    <p className="text-[11px] text-[#64748B] flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#1E60F2] shrink-0 mt-0.5" />
                      <span>{station.address}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E5EDF5] flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B] font-mono">{station.operating_hours}</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1E60F2] font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: HOSPITALS */}
      {activeTab === 'hospitals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Hospital Emergency Heatstroke Treatment Units
              </h3>
              <p className="text-xs text-[#64748B]">
                Hospitals equipped with active ice immersion units and specialized heatstroke ICU beds.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search hospitals..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E5EDF5] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hospitals
              .filter(h => searchQuery === '' || h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.address.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(hosp => (
                <Card key={hosp.id} padding="md" className="space-y-3 flex flex-col justify-between hoverable">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="danger" size="sm">
                        {formatDistance(hosp.distKm)}
                      </Badge>
                      <Badge variant={hosp.has_heatstroke_ward ? 'primary' : 'neutral'} size="sm">
                        {hosp.has_heatstroke_ward ? 'Heatstroke Ward' : 'Emergency 24x7'}
                      </Badge>
                    </div>

                    <h4 className="text-xs font-bold text-[#0F172A] leading-snug">{hosp.name}</h4>
                    <p className="text-[11px] text-[#64748B] flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{hosp.address}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E5EDF5] flex items-center justify-between text-[11px]">
                    <a
                      href={`tel:${hosp.emergency_phone}`}
                      className="text-red-700 font-bold hover:underline inline-flex items-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{hosp.emergency_phone}</span>
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.latitude},${hosp.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1E60F2] font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* TAB 5: MY ASSISTANCE REQUESTS */}
      {activeTab === 'assistance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Your Submitted Relief Requests</h3>
              <p className="text-xs text-[#64748B]">
                Track the status of your water deliveries, elder welfare check-ins, or transport requests.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewRequestOpen(true)}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              <span>New Assistance Request</span>
            </Button>
          </div>

          {userRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userRequests.map(req => {
                const statusVariant: 'success' | 'primary' | 'warning' = 
                  req.status === 'resolved' ? 'success' :
                  req.status === 'in_progress' ? 'primary' : 'warning';

                return (
                  <Card key={req.id} padding="md" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="subtle" size="sm">
                        {req.category.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant={statusVariant} size="sm">
                        {req.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xs text-[#0F172A] font-semibold">{req.description}</p>
                      <span className="text-[11px] text-[#64748B] block mt-1">
                        Neighborhood: {req.locality_id} &bull; Contact: {req.requested_by || 'Resident'}
                      </span>
                    </div>

                    <div className="pt-2.5 border-t border-[#E5EDF5] flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>Submitted: {new Date(req.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="capitalize font-semibold text-[#0F172A]">{req.priority} Priority</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card padding="lg" className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E60F2] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#0F172A]">No Active Assistance Requests</h4>
                <p className="text-xs text-[#64748B] max-w-md mx-auto">
                  You do not have any pending requests. If you or a family member needs emergency drinking water, elder welfare checks, or cooling transport, submit a request below.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsNewRequestOpen(true)}
                icon={<PlusCircle className="w-4 h-4" />}
              >
                <span>Submit Assistance Request</span>
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* TAB 6: AI HEAT SAFETY ADVISOR */}
      {activeTab === 'assistant' && (
        <Card padding="none" className="max-w-3xl mx-auto overflow-hidden flex flex-col h-[560px]">
          <div className="p-4 bg-white text-[#0F172A] border-b border-[#E5EDF5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                  HeatShield AI Safety Advisor
                </h3>
                <span className="text-[11px] text-[#1E60F2] font-semibold">
                  English &bull; हिन्दी &bull; ಕನ್ನಡ
                </span>
              </div>
            </div>
            <Badge variant="success" dot size="sm">Online</Badge>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F5F8FC]/60">
            {assistantMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#1E60F2] text-white rounded-br-none shadow-xs'
                      : 'bg-white border border-[#E5EDF5] text-[#0F172A] rounded-bl-none shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-[#64748B] mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendAssistant} className="p-3.5 bg-white border-t border-[#E5EDF5] flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask about dizziness, hydration recipe, cooling shelters, or symptoms..."
              value={assistantInput}
              onChange={e => setAssistantInput(e.target.value)}
              className="flex-1 bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-4 py-2.5 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Send className="w-3.5 h-3.5" />}
            >
              <span>Send</span>
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 7: CIVIC & EMERGENCY DIRECTORY */}
      {activeTab === 'civic' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">
              Civic Helplines & Municipal Disaster Directory
            </h3>
            <p className="text-xs text-[#64748B]">
              Direct cellular and landline contact numbers for government disaster authorities, water tankers, and medical services.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Karnataka State Disaster Management (KSDMA)',
                number: '1070',
                role: 'State Emergency Operations Center',
                desc: 'Apex coordination desk for statewide heatwave relief, thermal emergency warnings, and district aid dispatch.'
              },
              {
                title: 'District Disaster Control Room',
                number: '1077',
                role: 'District Collectorate Cell',
                desc: 'Local district administration helpline for community shelters, water tanker requests, and welfare check-ins.'
              },
              {
                title: 'Ambulance & Trauma Medical Dispatch',
                number: '108',
                role: 'Emergency Medical Services',
                desc: 'Immediate ambulance dispatch for suspected heatstroke, fainting, syncope, or severe dehydration.'
              },
              {
                title: 'Emergency Response Support System (ERSS)',
                number: '112',
                role: 'All-India Unified Emergency',
                desc: 'Centralized emergency helpline linking police, fire, rescue, and ambulance coordination.'
              },
              {
                title: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
                number: '1533',
                role: 'Municipal Corporation Call Center',
                desc: 'Civic heatwave control desk, emergency tanker supply, and community hall respite access.'
              },
              {
                title: 'Bangalore Water Supply (BWSSB)',
                number: '1916',
                role: 'Drinking Water & Tanker Helpline',
                desc: 'Direct helpline for potable water tanker dispatch and reporting dry community water points.'
              },
              {
                title: 'Arogya Sahayavani (Health Helpline)',
                number: '104',
                role: 'State Health Advice Line',
                desc: '24/7 medical advice for non-emergency heat symptoms, dehydration guidance, and physician tele-consultation.'
              },
              {
                title: 'Indian Red Cross Society',
                number: '080-22264205',
                role: 'Community Relief & First Aid',
                desc: 'NGO disaster assistance, volunteer first-aid stations, and community rehydration camps.'
              }
            ].map((civic, idx) => (
              <Card key={idx} padding="md" className="space-y-3 flex flex-col justify-between hoverable">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E60F2]">
                      {civic.role}
                    </span>
                    <Badge variant="success" size="sm">24x7 Active</Badge>
                  </div>
                  <h4 className="text-xs font-bold text-[#0F172A] leading-snug">{civic.title}</h4>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">{civic.desc}</p>
                </div>

                <div className="pt-3 border-t border-[#E5EDF5]">
                  <a
                    href={`tel:${civic.number.replace(/[^0-9]/g, '')}`}
                    className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-[#1E60F2] font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Dial {civic.number}</span>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpHubPage;
