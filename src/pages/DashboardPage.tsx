import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { WeatherHeroCard } from '../components/common/WeatherHeroCard';
import { HeatRiskCard } from '../components/common/HeatRiskCard';
import { TemperatureGraph } from '../components/common/TemperatureGraph';
import { UpcomingHeatList } from '../components/common/UpcomingHeatList';
import { ActionAdviceCard } from '../components/common/ActionAdviceCard';
import { EmergencyHelpSection } from '../components/common/EmergencyHelpSection';
import { DashboardHeroSkeleton } from '../components/common/SkeletonLoader';
import { HeatRiskMap } from '../components/map/HeatRiskMap';
import { useLocationTracker } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../lib/mockDb';
import { EmergencyModal } from '../components/common/EmergencyModal';

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

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    currentLocation,
    currentReading, 
    currentRisk, 
    forecastHourly, 
    forecastDaily,
    isLiveWeather,
    selectedZone,
    selectCustomLocality,
    forceTelemetryRefresh,
    lastSyncTime
  } = useLocationTracker();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  const locations = mockDb.getLocations();
  const smartAlerts = mockDb.getSmartAlerts();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await forceTelemetryRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const currentTemp = currentReading?.temperature_c ?? 32.5;
  const feelsLike = currentReading?.feels_like_c ?? 35.0;
  const riskScore = currentRisk?.risk_score ?? 58;
  const riskCategory = currentRisk?.risk_category ?? 'moderate';

  // Peak Heat Period calculation
  const peakHeatPeriod = useMemo(() => {
    if (forecastHourly && forecastHourly.length > 0) {
      const highest = [...forecastHourly].sort((a, b) => (b.heat_index_c || b.temperature_c) - (a.heat_index_c || a.temperature_c))[0];
      if (highest) {
        return `${highest.time || '13:00'} (${Math.round(highest.heat_index_c || highest.temperature_c)}°C)`;
      }
    }
    return '12:30 PM - 03:30 PM';
  }, [forecastHourly]);

  // Proximity Sorted Lifelines (Water, Cooling, Hospital)
  const { nearestWater, nearestCooling, nearestHospital } = useMemo(() => {
    const lat = currentLocation?.latitude || selectedZone?.latitude || 13.0854;
    const lon = currentLocation?.longitude || selectedZone?.longitude || 77.6250;

    const waterStations = mockDb.getWaterStations();
    const coolingCentres = mockDb.getCoolingCentres();
    const hospitals = mockDb.getHospitals();

    const sortedWater = [...waterStations].map(w => ({
      ...w,
      distKm: getDistanceKm(lat, lon, w.latitude, w.longitude)
    })).sort((a, b) => a.distKm - b.distKm);

    const sortedCooling = [...coolingCentres].map(c => ({
      ...c,
      distKm: getDistanceKm(lat, lon, c.latitude, c.longitude)
    })).sort((a, b) => a.distKm - b.distKm);

    const sortedHospitals = [...hospitals].map(h => ({
      ...h,
      distKm: getDistanceKm(lat, lon, h.latitude, h.longitude)
    })).sort((a, b) => a.distKm - b.distKm);

    return {
      nearestWater: sortedWater[0] || null,
      nearestCooling: sortedCooling[0] || null,
      nearestHospital: sortedHospitals[0] || null
    };
  }, [currentLocation, selectedZone]);

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Emergency Modal */}
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />

      {/* Temporary Deployment Marker */}
      <div className="px-4 py-2 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold flex items-center justify-between shadow-2xs">
        <span>HEATSHIELD UI BUILD TEST — REDESIGN-TEST-2026-11-05-1425</span>
        <span className="text-[10px] text-blue-500">PROD-VERCEL-SYNC-ACTIVE</span>
      </div>

      {/* Hyperlocal Location Command Bar */}
      <LocationTrackerBar />

      {/* 3-COLUMN / 2-ZONE COMPOSITION: CENTER & RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CENTER COLUMN: Main HeatShield Telemetry & Actions (7 / 12 on lg, 8 / 12 on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* 1. Hero Weather Card (Apple Weather Style) */}
          {!currentReading && !currentRisk ? (
            <DashboardHeroSkeleton />
          ) : (
            <WeatherHeroCard
              currentLocation={currentLocation}
              currentReading={currentReading}
              currentRisk={currentRisk}
              peakHeatPeriod={peakHeatPeriod}
              lastSyncTime={lastSyncTime}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
              selectedZone={selectedZone}
              locations={locations}
              onSelectLocality={selectCustomLocality}
              userName={user?.full_name}
              showGauge={false}
            />
          )}

          {/* 2. Temperature & Thermal Stress Curve (Recharts AreaChart) */}
          {forecastHourly && forecastHourly.length > 0 && (
            <TemperatureGraph
              hourly={forecastHourly}
            />
          )}

          {/* 3. Safety Recommendations ("What should you do now?") */}
          <ActionAdviceCard
            riskCategory={riskCategory}
            feelsLikeTemp={feelsLike}
          />

          {/* 4. Neighbourhood Heat Risk Map */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Neighbourhood Heat Risk Map
                </h3>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  • Live Water ATMs & Cooling Sanctuaries
                </span>
              </div>
              <Link 
                to="/map" 
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                <span>Open Full Interactive Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <HeatRiskMap 
              locations={locations} 
              selectedLocationId={selectedZone?.id} 
              onSelectLocation={selectCustomLocality}
              className="h-[380px] rounded-3xl shadow-[0_2px_12px_rgba(15,23,42,0.04)] border border-slate-200" 
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Upcoming Heat, Risk Gauge, Forecast, Lifelines (5 / 12 on lg, 4 / 12 on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* 1. Dedicated Heat Risk Gauge Card */}
          <HeatRiskCard
            score={riskScore}
            category={riskCategory}
            peakWindow={peakHeatPeriod}
          />

          {/* 2. Upcoming Heat (Next Few Hours Strip) */}
          {forecastHourly && forecastHourly.length > 0 && (
            <UpcomingHeatList
              hourly={forecastHourly}
            />
          )}

          {/* 3. 7-Day Ward Heat Forecast */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">7-Day Ward Outlook</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">High / Low</span>
            </div>

            <div className="space-y-2">
              {forecastDaily.map((day, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-slate-50/60 border border-slate-100 flex items-center justify-between gap-2 text-xs hover:bg-slate-50 transition-colors"
                >
                  <span className="text-[11px] font-mono font-semibold text-slate-600 w-16 truncate">
                    {day.date}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900">{day.max_temp_c}°</span>
                    <span className="text-[11px] text-slate-400">/ {day.min_temp_c}°</span>
                  </div>
                  <RiskBadge category={day.risk_level} size="sm" showPulse={false} />
                </div>
              ))}
            </div>
          </div>

          {/* 4. Verified Nearby Lifelines (Water, Cooling, Clinics) */}
          <EmergencyHelpSection
            nearestWater={nearestWater}
            nearestCooling={nearestCooling}
            nearestHospital={nearestHospital}
            onOpenEmergencyModal={() => setIsEmergencyOpen(true)}
            stateName={currentLocation.state}
          />

          {/* 5. Active Heat Warnings & Bulletins or Verified Baseline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Active Heat Warnings</h3>
              </div>
              <Link to="/alerts" className="text-xs text-blue-600 font-semibold hover:underline">
                View All
              </Link>
            </div>

            {smartAlerts.length > 0 ? (
              <div className="space-y-2.5">
                {smartAlerts.slice(0, 2).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between gap-2.5 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase text-[10px]">
                          {alert.severity}
                        </span>
                        <strong className="text-slate-900 font-bold truncate">{alert.headline}</strong>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px] line-clamp-2">
                        {alert.description}
                      </p>
                    </div>
                    <Link
                      to="/alerts"
                      className="self-start px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-sm transition-colors btn-interact"
                    >
                      Read Advisory
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px]">No active heatwave warnings in this ward. Normal seasonal range.</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 shrink-0">
                  NORMAL
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
