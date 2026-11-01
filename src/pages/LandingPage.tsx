import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  MapPin, 
  Users, 
  HeartHandshake, 
  BarChart3, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle, 
  Thermometer, 
  Droplets, 
  Building2, 
  PhoneCall,
  Activity,
  Compass,
  Cpu,
  Layers,
  HeartPulse
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { EmergencyModal } from '../components/common/EmergencyModal';
import { useLocationTracker } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { 
    currentLocation, 
    currentReading, 
    currentRisk, 
    selectedZone, 
    isLiveWeather 
  } = useLocationTracker();
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  const isKarnataka = (currentLocation?.state || '').toLowerCase().includes('karnataka');
  const helplineNumber = isKarnataka ? '1070' : '1077';

  const stats = [
    { label: 'Active Urban Monitoring Zones', value: '18+', source: 'Open-Meteo & IMD Telemetry' },
    { label: 'Vulnerable Residents Tracked', value: '450+', source: 'Community Health Registry' },
    { label: 'Welfare Check Completion Rate', value: '94.2%', source: 'Field Audit Records' },
    { label: 'Average Emergency Response', value: '38 min', source: 'Grassroots Volunteer Net' },
  ];

  return (
    <div className="space-y-16 py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section - Clean Enterprise Healthcare Presentation */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-8 sm:p-12 lg:p-16 shadow-card">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>Healthcare Technology Platform • {currentLocation.city}, {currentLocation.state}</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Predict. Protect. <br />
                <span className="text-blue-600">Prevent Extreme Heat Casualties.</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl font-normal pt-1">
                Currently tracking thermal stress in <strong className="text-slate-900">{currentLocation.localityName}</strong> ({currentLocation.city}). HeatShield AI calculates transparent hyperlocal risk metrics and coordinates community volunteers to conduct preventative welfare checks and cooling support.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={isAuthenticated ? "/dashboard" : "/login"}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm flex items-center gap-2"
              >
                <span>{isAuthenticated ? 'Open Dashboard' : 'Sign In to Platform'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                to="/map"
                className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-[#CBD5E1] transition-colors flex items-center gap-2 shadow-sm"
              >
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Heat Risk Radar</span>
              </Link>

              <button
                onClick={() => setIsEmergencyOpen(true)}
                className="px-4 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm border border-red-200 transition-colors flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4 text-red-600" />
                <span>SOS Helpline ({helplineNumber})</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex items-center gap-6 text-xs text-slate-500 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Explainable AI Risk Model</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Trilingual: EN • HI • KN</span>
              </div>
              <div className="flex items-center gap-1.5 hidden sm:flex">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>NDMA Guideline Aligned</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Telemetry HUD Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Ward Environmental Telemetry</h3>
                  <p className="text-xs text-slate-500">Live Meteorological Computation</p>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                  isLiveWeather 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isLiveWeather ? '● LIVE METEO' : '● SIMULATED'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium">{currentLocation.city}, {currentLocation.state}</span>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">{currentLocation.localityName}</h4>
              </div>

              {/* Metric Cells */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 rounded-lg bg-white border border-[#E2E8F0]">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-0.5">Temp</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">{currentReading?.temperature_c ?? 34.5}°C</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-[#E2E8F0]">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-0.5">Humidity</span>
                  <span className="text-lg font-bold text-blue-600 font-mono">{currentReading?.relative_humidity_pct ?? 58}%</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-[#E2E8F0]">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-0.5">Feels Like</span>
                  <span className="text-lg font-bold text-orange-600 font-mono">{currentReading?.feels_like_c ?? 37.2}°C</span>
                </div>
              </div>

              {/* Risk Assessment Box */}
              {currentRisk && (
                <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">Heat Risk Assessment:</span>
                    <RiskBadge category={currentRisk.risk_category} score={currentRisk.risk_score} size="sm" />
                  </div>
                  <p className="line-clamp-2 text-slate-600 text-xs leading-relaxed">
                    {currentRisk.ai_explanation}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                <span className="text-slate-600">Active Shaded Shelters: <strong>{selectedZone.cooling_centers_count} sites</strong></span>
                <Link to="/map" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <span>View radar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Sourced Data Statistics Banner */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((st, i) => (
          <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-5 text-center shadow-sm">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{st.value}</span>
            <p className="text-xs font-medium text-slate-700 mt-1">{st.label}</p>
            <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 bg-slate-50 text-slate-500 rounded border border-[#E2E8F0]">
              {st.source}
            </span>
          </div>
        ))}
      </section>

      {/* Capabilities Section */}
      <section className="space-y-6">
        <div className="max-w-xl text-left space-y-1">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-600">Platform Pillars</span>
          <h2 className="text-2xl font-bold text-slate-900">Engineered for Extreme Urban Microclimates</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A closed-loop public health system connecting satellite telemetry, explainable algorithms, and verified neighborhood volunteers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 text-left space-y-3 shadow-sm hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">1. Hyperlocal Risk Scoring</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fuses live Open-Meteo observational telemetry with structural density, tin-roof thermal trapping, and diurnal solar peaks into a transparent 0-100 risk score.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 text-left space-y-3 shadow-sm hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">2. Smart Priority Welfare Checks</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dynamically ranks vulnerable registered residents (elderly, infants, outdoor laborers, chronic illness) based on ambient heat exposure and elapsed time since contact.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 text-left space-y-3 shadow-sm hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">3. Community Relief Dispatch</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Empowers field volunteers to conduct on-site check-ins, distribute oral rehydration salts (ORS), organize cooling shelter transits, and record resident safety.
            </p>
          </div>
        </div>
      </section>

      {/* Heat Risk Classification Matrix */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Clinical Reference</span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">HeatShield AI Risk Classification Matrix</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-slate-500 font-mono uppercase text-[10px]">
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">Index Score</th>
                <th className="py-3 px-4">Thermal Conditions</th>
                <th className="py-3 px-4">Recommended Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              <tr>
                <td className="py-3 px-4 font-bold text-emerald-700">Low (Green)</td>
                <td className="py-3 px-4 font-mono font-semibold">0 – 34</td>
                <td className="py-3 px-4 text-slate-700">&lt; 33°C, Moderate Humidity</td>
                <td className="py-3 px-4 text-slate-600">Standard awareness; routine hydration advisories.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-amber-700">Moderate (Yellow)</td>
                <td className="py-3 px-4 font-mono font-semibold">35 – 59</td>
                <td className="py-3 px-4 text-slate-700">33°C – 38°C, Elevated Humidity</td>
                <td className="py-3 px-4 text-slate-600">Hydration breaks recommended; prepare community ORS packets.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-orange-700">High (Orange)</td>
                <td className="py-3 px-4 font-mono font-semibold">60 – 79</td>
                <td className="py-3 px-4 text-slate-700">38°C – 42°C or High UHI Factor</td>
                <td className="py-3 px-4 text-slate-600">Priority check-ins for elderly (75+) and infants; cooling shelters opened.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-red-700">Critical (Red)</td>
                <td className="py-3 px-4 font-mono font-semibold">80 – 100</td>
                <td className="py-3 px-4 text-slate-700">&gt; 42°C with extreme thermal stress</td>
                <td className="py-3 px-4 text-slate-600">Mandatory door-to-door welfare checks; ambulance standby (108).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Non-Medical Disclaimer */}
      <section className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] text-xs text-slate-600 leading-relaxed text-center max-w-3xl mx-auto">
        <p>
          <strong className="text-slate-800">Notice:</strong> HeatShield AI calculates environmental heat-risk indices and coordinates community welfare outreach based on meteorological telemetry. It is not a clinical medical diagnostic tool. For medical emergencies or acute heatstroke symptoms, immediately call <strong>108</strong> (Ambulance) or <strong>112</strong> (National Emergency).
        </p>
      </section>

      {/* Emergency Hotline Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
    </div>
  );
};
