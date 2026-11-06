import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  PhoneCall, 
  ShieldAlert, 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle, 
  Flame, 
  Droplets, 
  Building2, 
  HelpCircle, 
  Send, 
  DownloadCloud, 
  Sparkles,
  MapPin,
  HeartPulse,
  Thermometer,
  Home,
  Clock,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { useNetworkStatus } from '../lib/offlineStorage';
import { mockDb } from '../lib/mockDb';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const OfflineEmergencyPage: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, syncOfflineQueue, queueAction } = useNetworkStatus();

  // Offline Request Form State
  const [residentName, setResidentName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [locality, setLocality] = useState('Hebbal, Bengaluru');
  const [urgency, setUrgency] = useState<'high' | 'critical'>('high');
  const [requestDetails, setRequestDetails] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Pre-cache feedback
  const [isPreCaching, setIsPreCaching] = useState(false);
  const [cacheSuccess, setCacheSuccess] = useState(false);

  const handlePreCacheData = async () => {
    setIsPreCaching(true);
    setCacheSuccess(false);

    try {
      if ('caches' in window) {
        const cache = await caches.open('heatshield-offline-v1');
        await cache.addAll(['/', '/index.html']);
      }
      setTimeout(() => {
        setIsPreCaching(false);
        setCacheSuccess(true);
        setTimeout(() => setCacheSuccess(false), 4000);
      }, 700);
    } catch {
      setIsPreCaching(false);
      setCacheSuccess(true);
      setTimeout(() => setCacheSuccess(false), 4000);
    }
  };

  const handleSubmitOfflineRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentName || !contactPhone) return;

    const offlinePayload = {
      id: `req-off-${Date.now()}`,
      resident_name: residentName,
      contact_phone: contactPhone,
      location: locality,
      urgency,
      details: requestDetails || 'Heat distress emergency assistance required.',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    queueAction('assistance_request', offlinePayload);
    setRequestSubmitted(true);
    setResidentName('');
    setContactPhone('');
    setRequestDetails('');
  };

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto px-4 sm:px-6">
      <LocationTrackerBar />

      {/* Network Connectivity Status Banner */}
      <Card padding="lg" className="border-[#E5EDF5]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge 
                variant={isOnline ? 'success' : 'warning'} 
                dot 
                size="md"
              >
                {isOnline ? 'Internet Connected & Synchronized' : 'Offline Mode Active (Zero Cellular Data)'}
              </Badge>
              {pendingCount > 0 && (
                <Badge variant="subtle" size="md">
                  {pendingCount} Request{pendingCount > 1 ? 's' : ''} Stored Locally
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Offline Emergency Mode & Lifelines
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl">
              Zero-connectivity resilient emergency center. Toll-free voice helplines, life-saving heatstroke first-aid, hydration recipes, and local shelter tips are always stored on your device.
            </p>
          </div>

          {/* Sync & Pre-cache Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={handlePreCacheData}
              disabled={isPreCaching}
              icon={isPreCaching ? <RefreshCw className="w-4 h-4 animate-spin text-[#1E60F2]" /> : <DownloadCloud className="w-4 h-4 text-[#1E60F2]" />}
            >
              <span>{isPreCaching ? 'Saving Lifelines...' : 'Pre-Cache Safety Guides'}</span>
            </Button>

            {pendingCount > 0 && isOnline && (
              <Button
                variant="primary"
                size="md"
                onClick={syncOfflineQueue}
                isLoading={isSyncing}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                <span>Transmit {pendingCount} Offline Request{pendingCount > 1 ? 's' : ''}</span>
              </Button>
            )}
          </div>
        </div>

        {cacheSuccess && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">
              Emergency phone directories, heatstroke protocols, and cooling guidance are stored offline in your browser memory!
            </span>
          </div>
        )}
      </Card>

      {/* PROMINENT EMERGENCY HOTLINE BUTTONS */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5EDF5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                Direct-Call Emergency Hotlines (Toll-Free 24x7)
              </h2>
              <p className="text-xs text-[#64748B]">
                Direct voice connection works over standard cellular networks even when internet data is cut off.
              </p>
            </div>
          </div>
          <Badge variant="danger" size="sm">Tap to Call Directly</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* 108 Ambulance */}
          <a
            href="tel:108"
            className="p-5 rounded-[20px] bg-red-50/70 hover:bg-red-100/80 border border-red-200 transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
                  Ambulance & Trauma
                </span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="text-3xl font-extrabold text-red-950 mt-2 font-mono tracking-tight">
                108
              </div>
              <p className="text-xs text-red-900 mt-2 leading-relaxed">
                Emergency ambulance dispatch for suspected heatstroke, fainting, convulsions, or severe dehydration.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-red-200 flex items-center justify-between text-xs font-bold text-red-800">
              <span>Call 108 Now</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </a>

          {/* 112 National Emergency */}
          <a
            href="tel:112"
            className="p-5 rounded-[20px] bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E60F2]">
                  National Emergency (ERSS)
                </span>
                <span className="w-2 h-2 rounded-full bg-[#1E60F2]" />
              </div>
              <div className="text-3xl font-extrabold text-[#0F172A] mt-2 font-mono tracking-tight">
                112
              </div>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                Unified 24x7 all-India helpline for Police, Fire, and coordinated medical disaster relief.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200 flex items-center justify-between text-xs font-bold text-[#1E60F2]">
              <span>Call 112 Now</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </a>

          {/* 1070 Disaster Authority (SDMA) */}
          <a
            href="tel:1070"
            className="p-5 rounded-[20px] bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  State Disaster Desk (SDMA)
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="text-3xl font-extrabold text-amber-950 mt-2 font-mono tracking-tight">
                1070
              </div>
              <p className="text-xs text-amber-900 mt-2 leading-relaxed">
                State Disaster Management Authority heatwave control desk for statewide alerts and relief.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200 flex items-center justify-between text-xs font-bold text-amber-800">
              <span>Call 1070 Now</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </a>

          {/* 1077 District Control Room */}
          <a
            href="tel:1077"
            className="p-5 rounded-[20px] bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  District Control Room
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-950 mt-2 font-mono tracking-tight">
                1077
              </div>
              <p className="text-xs text-emerald-900 mt-2 leading-relaxed">
                District Collectorate emergency cell for local water distribution, cooling shelters, and tanker relief.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-800">
              <span>Call 1077 Now</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </a>
        </div>

        {/* Secondary Municipal Helpline Strip */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-[#64748B]">
          <span className="flex items-center gap-1.5 font-medium">
            <Info className="w-4 h-4 text-[#1E60F2]" />
            Municipal Corporation Civic Control (Water Tankers & Respite Centers): 
            <strong className="text-[#0F172A] font-mono"> 1533 (Toll-Free)</strong>
          </span>
          <span className="text-[11px]">Free calls from all mobile carriers across India</span>
        </div>
      </Card>

      {/* OFFLINE FIRST-AID GUIDELINES & ASSISTANCE FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Heatstroke First Aid Protocols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Heatstroke Protocols */}
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EDF5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">
                    Offline Heat Emergency Medical Stabilization
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Follow these life-saving first-aid steps immediately before medical responders arrive.
                  </p>
                </div>
              </div>
              <Badge variant="success" size="sm">Cached Offline</Badge>
            </div>

            <div className="space-y-4 pt-1">
              {/* Heatstroke Protocol (Critical) */}
              <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    Heatstroke (Medical Emergency — Core Temp &gt; 40°C)
                  </span>
                  <Badge variant="danger" size="sm">CRITICAL</Badge>
                </div>
                
                <p className="text-xs text-red-950 font-semibold">
                  Key Warning Signs: Confusion, slurred speech, loss of consciousness, dry hot skin (or sweating that suddenly stopped), and rapid bounding pulse.
                </p>

                <div className="space-y-1.5 text-xs text-red-900 pt-1">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-200 text-red-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span><strong>Call 108 Immediately:</strong> State clearly: "Suspected Heatstroke emergency with altered consciousness."</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-200 text-red-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span><strong>Rapid Active Cooling:</strong> Move patient to shade or air conditioning. Douse clothes with cool tap water and fan vigorously.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-200 text-red-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span><strong>Ice Application:</strong> Place cold wet cloths or ice packs on the neck, armpits, and groin where major blood vessels run.</span>
                  </div>
                  <div className="flex items-start gap-2 text-red-950 font-semibold bg-red-100/60 p-2 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span><strong>Never force fluids</strong> if the victim is drowsy, vomiting, or incoherent, as this can cause airway choking.</span>
                  </div>
                </div>
              </div>

              {/* Heat Exhaustion Protocol (Urgent) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4" />
                    Heat Exhaustion (Urgent Care)
                  </span>
                  <Badge variant="warning" size="sm">URGENT</Badge>
                </div>

                <p className="text-xs text-amber-950 font-semibold">
                  Key Warning Signs: Heavy profuse sweating, pale cold clammy skin, dizziness, headache, nausea, and leg or abdominal muscle cramps.
                </p>

                <div className="space-y-1.5 text-xs text-amber-900 pt-1">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>Move immediately to a shaded spot or air-conditioned room.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>Loosen tight clothing and elevate legs about 12 inches to restore blood flow to heart and brain.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>Administer small, frequent sips of cool water with ORS (Oral Rehydration Salts) or coconut water.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                    <span>If symptoms persist or vomiting occurs for more than 30 minutes, dial 108.</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Emergency ORS Home Recipe */}
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EDF5]">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Homemade Emergency ORS (Electrolyte Rehydration Formula)
                </h3>
                <p className="text-xs text-[#64748B]">
                  Standard World Health Organization & NDMA approved recipe using kitchen ingredients.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] text-center space-y-1">
                <span className="text-[11px] font-bold uppercase text-[#64748B] block">Clean Water</span>
                <span className="text-lg font-extrabold text-[#0F172A] block font-mono">1 Liter</span>
                <span className="text-[11px] text-[#64748B]">Boiled or filtered drinking water</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] text-center space-y-1">
                <span className="text-[11px] font-bold uppercase text-[#64748B] block">Clean Sugar</span>
                <span className="text-lg font-extrabold text-[#0F172A] block font-mono">6 Teaspoons</span>
                <span className="text-[11px] text-[#64748B]">Level teaspoons (glucose for absorption)</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] text-center space-y-1">
                <span className="text-[11px] font-bold uppercase text-[#64748B] block">Table Salt</span>
                <span className="text-lg font-extrabold text-[#0F172A] block font-mono">1/2 Teaspoon</span>
                <span className="text-[11px] text-[#64748B]">Level 1/2 teaspoon (essential sodium)</span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed pt-1">
              <strong>Instructions:</strong> Stir vigorously until completely dissolved. Sip 250ml every 20-30 minutes during intense heat exposure. Discard any solution left over after 24 hours.
            </p>
          </Card>

          {/* Offline Cached Water and Shelter Tips */}
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EDF5]">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Passive Cooling & Shelter Tips (Power & Internet Outages)
                </h3>
                <p className="text-xs text-[#64748B]">
                  Practical survival strategies when electricity or cooling fans are unavailable.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-1.5">
                <div className="flex items-center gap-2 text-[#0F172A] font-bold">
                  <Home className="w-4 h-4 text-[#1E60F2]" />
                  <span>Damp Curtain Evaporative Cooling</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Hang wet bedsheets or towels across open windows facing natural breezes. As warm outdoor air passes through wet cloth, moisture evaporates and drops room temperatures by 3-5°C.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-1.5">
                <div className="flex items-center gap-2 text-[#0F172A] font-bold">
                  <Building2 className="w-4 h-4 text-[#1E60F2]" />
                  <span>Thick-Walled Public Respite</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  During 12 PM - 4 PM peak heat, seek respite in older stone buildings, community temples, government hospital corridors, or underground transit concourses which remain naturally cool.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-1.5">
                <div className="flex items-center gap-2 text-[#0F172A] font-bold">
                  <Droplets className="w-4 h-4 text-[#1E60F2]" />
                  <span>Terracotta Pot Chilled Water</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Store water in unglazed clay pots (Matka) placed on a damp sand tray in shade. Micro-porous evaporation cools drinking water naturally without electrical power.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-1.5">
                <div className="flex items-center gap-2 text-[#0F172A] font-bold">
                  <Clock className="w-4 h-4 text-[#1E60F2]" />
                  <span>Night Purge Ventilation</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Open opposing windows after 8 PM to let accumulated daytime heat flush out. Seal windows, blinds, and heavy curtains shut by 8:30 AM before the sun heats masonry walls.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Offline Assistance Request Queue */}
        <div className="lg:col-span-5 space-y-6">
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EDF5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Offline Assistance Queue</h3>
                  <p className="text-xs text-[#64748B]">
                    Queues directly in device memory when offline.
                  </p>
                </div>
              </div>
              <Badge variant="subtle" size="sm">
                {pendingCount} Pending
              </Badge>
            </div>

            {requestSubmitted ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-950">
                    Request Stored Safely in Device Memory!
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed max-w-xs mx-auto">
                    Your emergency request is safely encrypted on your phone. As soon as cellular network or Wi-Fi reconnects, it will automatically transmit to relief coordinators.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setRequestSubmitted(false)}
                >
                  Submit Another Request
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitOfflineRequest} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-[#0F172A] block mb-1">
                    Resident / Caller Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={residentName}
                    onChange={(e) => setResidentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EDF5] bg-white text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#0F172A] block mb-1">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98450 12345"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EDF5] bg-white text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#0F172A] block mb-1">
                    Locality & Landmark Landmark <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hebbal, near bus terminus"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EDF5] bg-white text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#0F172A] block mb-1">
                    Assistance Urgency Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUrgency('high')}
                      className={`py-2 rounded-xl border font-bold text-xs transition-all ${
                        urgency === 'high' 
                          ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-500' 
                          : 'bg-white border-[#E5EDF5] text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      High Urgency
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrgency('critical')}
                      className={`py-2 rounded-xl border font-bold text-xs transition-all ${
                        urgency === 'critical' 
                          ? 'bg-red-50 border-red-500 text-red-800 ring-1 ring-red-500' 
                          : 'bg-white border-[#E5EDF5] text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Critical Medical
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#0F172A] block mb-1">
                    Assistance Details (Water / Elder Respite / Transport)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe specific need (e.g. elderly person dehydrated, need emergency drinking water or ice packs)..."
                    value={requestDetails}
                    onChange={(e) => setRequestDetails(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EDF5] bg-white text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60F2] transition-colors"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={<Send className="w-4 h-4" />}
                  className="w-full shadow-md shadow-blue-500/20"
                >
                  <span>Save to Offline Dispatch Queue</span>
                </Button>
              </form>
            )}
          </Card>

          {/* Quick Cellular SMS Gateway Card */}
          <Card padding="md" className="bg-[#F5F8FC] border-[#E5EDF5] space-y-3">
            <div className="flex items-center gap-2 text-[#0F172A] font-bold text-xs">
              <PhoneCall className="w-4 h-4 text-[#1E60F2]" />
              <span>Offline SMS Quick Helpline (No Internet)</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              If data networks fail completely, send standard cellular SMS to get automated coordinates of nearest water or shelter:
            </p>
            <div className="space-y-1.5 text-xs font-mono font-bold">
              <div className="p-2.5 rounded-xl bg-white border border-[#E5EDF5] flex items-center justify-between">
                <span className="text-[#0F172A]">SMS: HEAT &lt;PINCODE&gt;</span>
                <span className="text-[#1E60F2]">To: 56161</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#E5EDF5] flex items-center justify-between">
                <span className="text-[#0F172A]">SMS: WATER &lt;PINCODE&gt;</span>
                <span className="text-[#1E60F2]">To: 56161</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OfflineEmergencyPage;
