import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { WeatherHeroCard } from '../components/common/WeatherHeroCard';
import { ActionAdviceCard } from '../components/common/ActionAdviceCard';
import { HeatTimeline } from '../components/common/HeatTimeline';
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

      {/* Hyperlocal Location Command Bar */}
      <LocationTrackerBar />

      {/* 1. HERO WEATHER & HEAT-RISK STATUS CARD (Apple Weather + Health style) */}
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
        />
      )}

      {/* 2. "WHAT SHOULD I DO NOW?" SECTION */}
      <ActionAdviceCard
        riskCategory={riskCategory}
        feelsLikeTemp={feelsLike}
      />

      {/* 3. TODAY'S HEAT TIMELINE (HOURLY) */}
      {forecastHourly && forecastHourly.length > 0 && (
        <HeatTimeline
          hourly={forecastHourly}
          currentTemp={currentTemp}
        />
      )}

      {/* 4. WHERE CAN I GET HELP? (NEAREST LIFELINES & EMERGENCY SOS) */}
      <EmergencyHelpSection
        nearestWater={nearestWater}
        nearestCooling={nearestCooling}
        nearestHospital={nearestHospital}
        onOpenEmergencyModal={() => setIsEmergencyOpen(true)}
        stateName={currentLocation.state}
      />

      {/* 5. ACTIVE LOCAL HEAT WARNINGS OR VERIFIED BASELINE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Active Heat Warnings & Bulletins</h3>
          </div>
          <Link to="/alerts" className="text-xs text-blue-600 font-semibold hover:underline">
            View All Advisories
          </Link>
        </div>

        {smartAlerts.length > 0 ? (
          <div className="space-y-2.5">
            {smartAlerts.slice(0, 2).map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase text-[10px]">
                      {alert.severity}
                    </span>
                    <strong className="text-slate-900 font-bold">{alert.headline}</strong>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {alert.description}
                  </p>
                </div>
                <Link
                  to="/alerts"
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-sm text-center transition-colors btn-interact"
                >
                  Read Actions
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>No severe heatwave warnings currently active in your sector. Thermal conditions are within normal seasonal range.</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 shrink-0">
              NORMAL
            </span>
          </div>
        )}
      </div>

      {/* 6. INTERACTIVE NEIGHBOURHOOD HEAT MAP */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Interactive Neighbourhood Heat Map</h3>
            <span className="text-xs text-slate-400 hidden sm:inline">• Live Water ATMs & Cooling Sanctuaries</span>
          </div>
          <Link to="/map" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
            <span>Open Full Interactive Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <HeatRiskMap 
          locations={locations} 
          selectedLocationId={selectedZone?.id} 
          onSelectLocation={selectCustomLocality}
          className="h-[440px] rounded-3xl shadow-[0_2px_12px_rgba(15,23,42,0.04)] border border-slate-200" 
        />
      </div>

      {/* 7. 7-DAY WARD HEAT OUTLOOK */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">7-Day Ward Heat Outlook</h3>
            <p className="text-xs text-slate-500">Predicted daily high/low temperatures & heat safety category</p>
          </div>
          <Calendar className="w-4 h-4 text-slate-400" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
          {forecastDaily.map((day, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 text-center space-y-1.5 cursor-default hover:bg-slate-50 hover:border-slate-200 transition-colors"
            >
              <span className="text-[11px] font-mono font-semibold text-slate-500 block truncate">{day.date}</span>
              <div className="text-base font-bold text-slate-900 font-mono">{day.max_temp_c}°C</div>
              <div className="text-xs text-slate-400 font-mono">Min {day.min_temp_c}°C</div>
              <div className="pt-1">
                <RiskBadge category={day.risk_level} size="sm" showPulse={false} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
