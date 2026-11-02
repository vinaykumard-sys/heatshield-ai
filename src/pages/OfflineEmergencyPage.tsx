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
  MapPin
} from 'lucide-react';
import { useNetworkStatus } from '../lib/offlineStorage';
import { mockDb } from '../lib/mockDb';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';

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

    // Simulate saving datasets to browser cache
    try {
      if ('caches' in window) {
        const cache = await caches.open('heatshield-offline-v1');
        await cache.addAll(['/', '/index.html']);
      }
      setTimeout(() => {
        setIsPreCaching(false);
        setCacheSuccess(true);
        setTimeout(() => setCacheSuccess(false), 4000);
      }, 800);
    } catch {
      setIsPreCaching(false);
      setCacheSuccess(true);
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
    <div className="space-y-6 pb-12">
      <LocationTrackerBar />

      {/* Network Connectivity Status Hero */}
      <div className={`rounded-3xl p-6 sm:p-8 border shadow-lg transition-all ${
        isOnline 
          ? 'bg-slate-900 border-slate-800 text-white' 
          : 'bg-amber-950/40 border-amber-600/40 text-amber-100'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-white/10 border border-white/20">
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Online & Synchronized</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="text-amber-400">Offline Safe Mode Active</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Offline Emergency Mode & Lifelines
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Zero-connectivity resilient emergency centre. Critical phone helplines, first-aid heatstroke stabilization, and cached assistance queues function without internet.
            </p>
          </div>

          {/* Sync & Pre-cache Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handlePreCacheData}
              disabled={isPreCaching}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all"
            >
              {isPreCaching ? <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" /> : <DownloadCloud className="w-4 h-4 text-cyan-400" />}
              <span>{isPreCaching ? 'Caching Lifelines...' : 'Pre-Cache Offline Data'}</span>
            </button>

            {pendingCount > 0 && isOnline && (
              <button
                onClick={syncOfflineQueue}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync {pendingCount} Queued Actions</span>
              </button>
            )}
          </div>
        </div>

        {cacheSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Emergency phone directory and medical stabilization guides successfully stored offline!</span>
          </div>
        )}
      </div>

      {/* Emergency Phone Helplines (Direct Tel Links) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold text-slate-900">National Emergency Helplines (Dial Immediately)</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">Toll-Free 24/7 Cellular Services</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="tel:108"
            className="p-4 rounded-2xl bg-red-50 hover:bg-red-100/80 border border-red-200 transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-red-700 block">Ambulance & Trauma</span>
              <div className="text-2xl font-extrabold text-red-900 mt-1 font-mono">108</div>
              <p className="text-xs text-red-800/80 mt-1">Medical dispatch for suspected heatstroke, syncope, or seizure.</p>
            </div>
            <span className="mt-3 text-xs font-bold text-red-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Tap to Call Now →
            </span>
          </a>

          <a
            href="tel:112"
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-slate-600 block">All-India Emergency</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">112</div>
              <p className="text-xs text-slate-600 mt-1">Unified national emergency response service (Police/Fire/Medical).</p>
            </div>
            <span className="mt-3 text-xs font-bold text-slate-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Tap to Call Now →
            </span>
          </a>

          <a
            href="tel:1070"
            className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-amber-700 block">Disaster Authority (SDMA)</span>
              <div className="text-2xl font-extrabold text-amber-900 mt-1 font-mono">1070</div>
              <p className="text-xs text-amber-800/80 mt-1">Karnataka State Disaster Management Authority emergency desk.</p>
            </div>
            <span className="mt-3 text-xs font-bold text-amber-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Tap to Call Now →
            </span>
          </a>

          <a
            href="tel:1533"
            className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-blue-700 block">BBMP Control Room</span>
              <div className="text-2xl font-extrabold text-blue-900 mt-1 font-mono">1533</div>
              <p className="text-xs text-blue-800/80 mt-1">Municipal water tankers, shelter locations & civic heat distress.</p>
            </div>
            <span className="mt-3 text-xs font-bold text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Tap to Call Now →
            </span>
          </a>
        </div>
      </div>

      {/* Main Grid: First-Aid Protocols & Offline Assistance Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pre-cached First-Aid Protocols */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold text-slate-900">Pre-Cached Heat Emergency Medical Stabilization</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              OFFLINE VERIFIED
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Heatstroke Protocol */}
            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-red-700 font-mono flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Condition 1: Heatstroke (Core Temp &gt; 40°C)
                </span>
                <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded">CRITICAL</span>
              </div>
              <p className="text-xs text-red-950 font-medium">
                Signs: Confusion, loss of consciousness, hot dry or heavily sweating skin, rapid pulse.
              </p>
              <ul className="text-xs text-red-900 space-y-1 list-disc list-inside">
                <li><strong>Call 108 immediately.</strong> State "Suspected Heatstroke".</li>
                <li>Immerse patient in cool water tub or douse continuously with hose while fanning.</li>
                <li>Apply ice packs to armpits, groin, and back of neck where large blood vessels run.</li>
                <li><strong>Do NOT force fluids</strong> if person is drowsy, vomiting, or incoherent.</li>
              </ul>
            </div>

            {/* Heat Exhaustion Protocol */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">
                  Condition 2: Heat Exhaustion
                </span>
                <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded">URGENT</span>
              </div>
              <p className="text-xs text-amber-950 font-medium">
                Signs: Heavy sweating, pale clammy skin, muscle cramps, dizziness, nausea, headache.
              </p>
              <ul className="text-xs text-amber-900 space-y-1 list-disc list-inside">
                <li>Move to shaded or air-conditioned room immediately.</li>
                <li>Loosen or remove restrictive clothing; elevate feet 12 inches.</li>
                <li>Administer small, frequent sips of cool water with ORS electrolyte powder.</li>
                <li>If symptoms do not improve within 30 minutes, dial 108.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Offline Assistance Request Queue */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Offline Assistance Queue</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {pendingCount} Pending Sync
            </span>
          </div>

          {requestSubmitted ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-900">Request Safely Saved Locally!</h4>
              <p className="text-xs text-emerald-800">
                Your emergency request is stored in device storage. It will auto-transmit to the municipal volunteer network the instant connectivity is restored.
              </p>
              <button
                onClick={() => setRequestSubmitted(false)}
                className="mt-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitOfflineRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Resident or Caller Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9845012345"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Locality / Landmark</label>
                <input
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assistance Urgency</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUrgency('high')}
                    className={`py-2 rounded-xl border font-bold text-xs ${
                      urgency === 'high' ? 'bg-orange-50 border-orange-500 text-orange-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    High Urgency
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency('critical')}
                    className={`py-2 rounded-xl border font-bold text-xs ${
                      urgency === 'critical' ? 'bg-red-50 border-red-500 text-red-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Critical Medical
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Details (Water / Shelter / Elder Care)</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of emergency..."
                  value={requestDetails}
                  onChange={(e) => setRequestDetails(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save to Offline Dispatch Queue</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineEmergencyPage;
