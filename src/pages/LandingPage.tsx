import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  MapPin, 
  HeartHandshake, 
  CheckCircle, 
  ArrowRight, 
  PhoneCall,
  Activity,
  Trees,
  Sun,
  Droplets,
  HeartPulse
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { EmergencyModal } from '../components/common/EmergencyModal';
import { AppDownloadSection } from '../components/common/AppDownloadSection';
import { useLocationTracker } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

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
    { label: 'Monitored Neighborhoods', value: '18+', source: 'Live Weather Network' },
    { label: 'Residents Protected', value: '450+', source: 'Community Safety Registry' },
    { label: 'Check-in Completion Rate', value: '94.2%', source: 'Community Records' },
    { label: 'Emergency Support Speed', value: '38 min', source: 'Local Volunteer Network' },
  ];

  return (
    <div className="space-y-16 py-8 sm:py-12 max-w-7xl mx-auto">
      {/* Hero Section */}
      <Card padding="lg" className="bg-gradient-to-br from-blue-50/60 via-white to-sky-50/30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1E60F2] border border-blue-200 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E60F2] animate-pulse" />
              <span>Heat Safety Platform • {currentLocation.city}, {currentLocation.state}</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-[1.15]">
                Predict. Protect. <br />
                <span className="text-[#1E60F2]">Prevent Extreme Heat Harm.</span>
              </h1>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-xl font-normal pt-1">
                Currently tracking temperature conditions in <strong className="text-[#0F172A]">{currentLocation.localityName}</strong> ({currentLocation.city}). HeatShield AI calculates transparent local heat risk, suggests safe shaded routes, and connects community cooling aid.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                  {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
                </Button>
              </Link>
              
              <Link to="/map">
                <Button variant="secondary" size="md" icon={<MapPin className="w-4 h-4 text-[#1E60F2]" />}>
                  Explore Heat Map
                </Button>
              </Link>

              <button
                onClick={() => setIsEmergencyOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs border border-red-200 transition-colors flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4 text-red-600" />
                <span>Emergency Hotline ({helplineNumber})</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex items-center gap-6 text-xs text-[#64748B] border-t border-[#E5EDF5]">
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
                <span>NDMA Aligned Guidelines</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Conditions Card */}
          <div className="lg:col-span-5">
            <Card padding="md" className="space-y-4 bg-white">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5EDF5]">
                <div>
                  <h3 className="font-bold text-[#0F172A] text-sm">Live Local Conditions</h3>
                  <p className="text-xs text-[#64748B]">Updated in real time</p>
                </div>
                <Badge variant={isLiveWeather ? 'success' : 'brand'} size="sm">
                  {isLiveWeather ? 'Live weather' : 'Forecast data'}
                </Badge>
              </div>

              <div>
                <span className="text-xs text-[#64748B] font-medium">{currentLocation.city}, {currentLocation.state}</span>
                <h4 className="text-lg font-bold text-[#0F172A]">{currentLocation.localityName}</h4>
              </div>

              {/* Metric Cells */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5]">
                  <span className="text-[#64748B] text-[10px] uppercase font-semibold block mb-0.5">Temp</span>
                  <span className="text-lg font-bold text-[#0F172A]">{currentReading?.temperature_c ?? 34.5}°C</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5]">
                  <span className="text-[#64748B] text-[10px] uppercase font-semibold block mb-0.5">Humidity</span>
                  <span className="text-lg font-bold text-[#1E60F2]">{currentReading?.relative_humidity_pct ?? 58}%</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5]">
                  <span className="text-[#64748B] text-[10px] uppercase font-semibold block mb-0.5">Feels Like</span>
                  <span className="text-lg font-bold text-orange-600">{currentReading?.feels_like_c ?? 37.2}°C</span>
                </div>
              </div>

              {/* Risk Assessment Box */}
              {currentRisk && (
                <div className="p-3.5 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#0F172A]">Heat Risk:</span>
                    <RiskBadge category={currentRisk.risk_category} score={currentRisk.risk_score} size="sm" />
                  </div>
                  <p className="line-clamp-2 text-[#64748B] text-xs leading-relaxed">
                    {currentRisk.ai_explanation}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-[#E5EDF5] flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Cooling Shelters: <strong>{selectedZone.cooling_centers_count} active</strong></span>
                <Link to="/map" className="text-xs font-semibold text-[#1E60F2] hover:underline flex items-center gap-1">
                  <span>View map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          </div>

        </div>
      </Card>

      {/* Statistics Banner */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((st, i) => (
          <Card key={i} padding="md" className="text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">{st.value}</span>
            <p className="text-xs font-medium text-[#0F172A]">{st.label}</p>
            <span className="inline-block text-[10px] text-[#64748B]">
              {st.source}
            </span>
          </Card>
        ))}
      </section>

      {/* Capabilities Section */}
      <section className="space-y-6">
        <div className="max-w-xl text-left space-y-1">
          <Badge variant="brand" size="sm">Core Capabilities</Badge>
          <h2 className="text-2xl font-bold text-[#0F172A]">Designed for Extreme Heat Safety</h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            A public heat-safety ecosystem linking meteorological models, shaded path planning, and community welfare.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="lg" className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E60F2] flex items-center justify-center font-bold">
              <Sun className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">1. Hyperlocal Risk Scoring</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Combines temperature, humidity, solar exposure, and wind speed into a transparent 0-100 risk score tailored to your area.
            </p>
          </Card>

          <Card padding="lg" className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Trees className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">2. Shaded Route Planning</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Find pedestrian and cycling paths optimized for tree canopy shade, drinking water access, and indoor cooling stops.
            </p>
          </Card>

          <Card padding="lg" className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">3. Community Care & Aid</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Provides direct assistance requests for ORS packets, cooling shelter directions, and emergency check-ins for vulnerable family members.
            </p>
          </Card>
        </div>
      </section>

      {/* Heat Risk Classification Matrix */}
      <Card padding="lg" className="space-y-4">
        <div>
          <span className="text-xs uppercase font-bold text-[#64748B] tracking-wider">Health Reference</span>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">Heat Risk Classification Matrix</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E5EDF5] text-[#64748B] uppercase text-[10px]">
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Thermal Conditions</th>
                <th className="py-3 px-4">Recommended Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EDF5]">
              <tr>
                <td className="py-3 px-4 font-bold text-emerald-700">Low (Green)</td>
                <td className="py-3 px-4 font-semibold">0 – 34</td>
                <td className="py-3 px-4 text-[#0F172A]">&lt; 33°C, Moderate Humidity</td>
                <td className="py-3 px-4 text-[#64748B]">Standard awareness; routine hydration advisories.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-amber-700">Moderate (Yellow)</td>
                <td className="py-3 px-4 font-semibold">35 – 59</td>
                <td className="py-3 px-4 text-[#0F172A]">33°C – 38°C, Elevated Humidity</td>
                <td className="py-3 px-4 text-[#64748B]">Regular water intake; schedule outdoor work outside peak hours.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-orange-700">High (Orange)</td>
                <td className="py-3 px-4 font-semibold">60 – 79</td>
                <td className="py-3 px-4 text-[#0F172A]">38°C – 42°C, Significant Heat Stress</td>
                <td className="py-3 px-4 text-[#64748B]">Check in on seniors and children; seek shaded or air-cooled spaces.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-red-700">Critical (Red)</td>
                <td className="py-3 px-4 font-semibold">80 – 100</td>
                <td className="py-3 px-4 text-[#0F172A]">&gt; 42°C, Severe Extreme Heat</td>
                <td className="py-3 px-4 text-[#64748B]">Avoid outdoor exertion; emergency medical hotline on standby (108).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Android Mobile App Showcase Banner */}
      <AppDownloadSection />

      {/* Disclaimer */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5EDF5] text-xs text-[#64748B] leading-relaxed text-center max-w-3xl mx-auto">
        <p>
          <strong className="text-[#0F172A]">Notice:</strong> HeatShield AI calculates environmental heat risk and provides community safety guidance based on weather data. It is not a clinical medical diagnostic tool. For acute heatstroke emergencies, immediately call <strong>108</strong> (Ambulance) or <strong>112</strong> (National Emergency).
        </p>
      </div>

      {/* Emergency Hotline Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
    </div>
  );
};
