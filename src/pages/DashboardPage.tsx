import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  MapPin,
  Sun,
  Flame,
  CloudSun
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
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const currentTemp = currentReading?.temperature_c ?? 32.5;
  const feelsLike = currentReading?.feels_like_c ?? 35.0;
  const riskScore = currentRisk?.risk_score ?? 58;
  const riskCategory = currentRisk?.risk_category ?? 'moderate';

  // Peak Heat Period calculation from real forecast
  const peakHeatPeriod = useMemo(() => {
    if (forecastHourly && forecastHourly.length > 0) {
      const highest = [...forecastHourly].sort((a, b) => (b.heat_index_c || b.temperature_c) - (a.heat_index_c || a.temperature_c))[0];
      if (highest) {
        return `${highest.time || '1:00 PM'} (${Math.round(highest.heat_index_c || highest.temperature_c)}°C)`;
      }
    }
    return '1:30 PM - 3:30 PM';
  }, [forecastHourly]);

  // Risk Trend Calculation
  const riskTrend = useMemo<'Increasing' | 'Stable' | 'Decreasing'>(() => {
    if (forecastHourly && forecastHourly.length >= 3) {
      const first = forecastHourly[0].heat_index_c || forecastHourly[0].temperature_c;
      const third = forecastHourly[2].heat_index_c || forecastHourly[2].temperature_c;
      if (third - first > 1.2) return 'Increasing';
      if (first - third > 1.2) return 'Decreasing';
    }
    return 'Stable';
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
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Emergency Hotline Modal */}
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />

      {/* 1. LOCATION BAR */}
      <LocationTrackerBar />

      {/* 2. MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CENTER COLUMN: Main Heat & Safety Content (8 / 12 on lg) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* 2. CURRENT CONDITIONS (Hero Weather Card) */}
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

          {/* 3. SAFETY RECOMMENDATION & 4 QUICK ACTIONS */}
          <ActionAdviceCard
            riskCategory={riskCategory}
            feelsLikeTemp={feelsLike}
          />

          {/* 4. HOURLY TEMPERATURE & HEAT CURVE (FORECAST) */}
          {forecastHourly && forecastHourly.length > 0 && (
            <TemperatureGraph
              hourly={forecastHourly}
            />
          )}

          {/* 5. INTERACTIVE HEAT MAP (Section 19) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Heat Map
                </h3>
                <p className="text-xs text-slate-500">
                  Live conditions around you
                </p>
              </div>
              <Link 
                to="/map" 
                className="text-xs text-[#1E60F2] font-semibold hover:underline flex items-center gap-1"
              >
                <span>Full map view</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <HeatRiskMap 
              locations={locations} 
              selectedLocationId={selectedZone?.id} 
              onSelectLocation={selectCustomLocality}
              className="h-[400px] rounded-[24px] shadow-xs border border-[#E5EDF5]" 
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Heat Risk Gauge, Upcoming Hours, Daily Forecast, Nearby Help, Warnings */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* 1. HEAT RISK CARD (Section 14: 78/100, Gauge, Peak heat, Risk trend) */}
          <HeatRiskCard
            score={riskScore}
            category={riskCategory}
            peakWindow={peakHeatPeriod}
            trend={riskTrend}
          />

          {/* 2. UPCOMING HEAT HOURS */}
          {forecastHourly && forecastHourly.length > 0 && (
            <UpcomingHeatList
              hourly={forecastHourly}
            />
          )}

          {/* 3. DAILY FORECAST (Section 18: Today, Tomorrow, Wed... High / Low / Risk) */}
          <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#1E60F2]" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">7-Day Forecast</h3>
              </div>
              <span className="text-[11px] text-slate-400">High / Low</span>
            </div>

            <div className="space-y-2">
              {forecastDaily.map((day, idx) => {
                const dayLabel = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : day.date;
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] flex items-center justify-between gap-2 text-xs hover:bg-slate-100/60 transition-colors"
                  >
                    <span className="font-semibold text-slate-700 w-20 truncate">
                      {dayLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{day.max_temp_c}°</span>
                      <span className="text-[11px] text-slate-400">/ {day.min_temp_c}°</span>
                    </div>
                    <RiskBadge category={day.risk_level} size="sm" showPulse={false} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. NEARBY HELP (Section 21: Water, Cooling, Medical) */}
          <EmergencyHelpSection
            nearestWater={nearestWater}
            nearestCooling={nearestCooling}
            nearestHospital={nearestHospital}
            onOpenEmergencyModal={() => setIsEmergencyOpen(true)}
            stateName={currentLocation.state}
          />

          {/* 5. ACTIVE HEAT WARNINGS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Active Heat Warnings</h3>
              </div>
              <Link to="/heat-alerts" className="text-xs text-[#1E60F2] font-semibold hover:underline">
                View all
              </Link>
            </div>

            {smartAlerts.length > 0 ? (
              <div className="space-y-2.5">
                {smartAlerts.slice(0, 2).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-[20px] bg-amber-50/70 border border-amber-200/80 flex flex-col justify-between gap-2.5 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase text-[10px]">
                          {alert.severity}
                        </span>
                        <strong className="text-slate-900 font-bold truncate">{alert.headline}</strong>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-xs line-clamp-2">
                        {alert.description}
                      </p>
                    </div>
                    <Link
                      to="/heat-alerts"
                      className="self-start px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors btn-press"
                    >
                      View guidance
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-[20px] bg-white border border-[#E5EDF5] text-xs text-slate-600 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs">No active heatwave warnings in this area. Conditions normal.</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 shrink-0">
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
