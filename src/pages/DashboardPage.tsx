import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  MapPin,
  Flame,
  Sun,
  ShieldAlert,
  Layers,
  Sparkles,
  HelpCircle,
  Clock,
  Compass
} from 'lucide-react';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { EmergencyModal } from '../components/common/EmergencyModal';
import { SolarArcGauge } from '../components/common/SolarArcGauge';
import { HeatRiskCard } from '../components/common/HeatRiskCard';
import { HeatRiskMap } from '../components/map/HeatRiskMap';
import { useLocationTracker } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../lib/mockDb';
import { evaluateHeatSafety } from '../lib/actionEngine';

// Signature HeatShield Components
import { TopHeroSection } from '../components/dashboard/TopHeroSection';
import { WhatShouldIDoNow } from '../components/dashboard/WhatShouldIDoNow';
import { HeatSafeDayPlan } from '../components/dashboard/HeatSafeDayPlan';
import { ConfirmSafeCelebration } from '../components/dashboard/ConfirmSafeCelebration';
import { QuickActionsGrid } from '../components/dashboard/QuickActionsGrid';
import { HorizontalForecastStrip } from '../components/dashboard/HorizontalForecastStrip';
import { NearbyHelpCards } from '../components/dashboard/NearbyHelpCards';
import { WhyRiskLevelCards } from '../components/dashboard/WhyRiskLevelCards';
import { OtherCitiesRail } from '../components/dashboard/OtherCitiesRail';
import { FloatingEmergencySOS } from '../components/dashboard/FloatingEmergencySOS';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    currentLocation, 
    currentReading, 
    currentRisk, 
    forecastHourly, 
    forecastDaily,
    selectedZone,
    selectCustomLocality,
    forceTelemetryRefresh,
    lastSyncTime
  } = useLocationTracker();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  const locations = mockDb.getLocations();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await forceTelemetryRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Weather metrics
  const currentTemp = currentReading?.temperature_c ?? 28;
  const feelsLike = currentReading?.feels_like_c ?? (currentTemp + 2);
  const humidity = currentReading?.relative_humidity_pct ?? 55;
  const uv = currentReading?.uv_index ?? 6.2;
  const wind = currentReading?.wind_speed_kmh ?? 12.5;

  // Single authoritative Action Engine evaluation for entire page
  const actionResult = useMemo(() => {
    return evaluateHeatSafety({
      currentTemp,
      feelsLikeTemp: feelsLike,
      humidity,
      uvIndex: uv,
      windSpeedKmH: wind,
      forecastHourly,
      observedAt: lastSyncTime ? lastSyncTime.toISOString() : undefined
    });
  }, [currentTemp, feelsLike, humidity, uv, wind, forecastHourly, lastSyncTime]);

  const handleLocateOnMap = () => {
    const mapElement = document.getElementById('thermal-heat-risk-map');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="bg-[#f4f7fc] min-h-screen -m-2 sm:-m-4 p-3 sm:p-5 lg:p-6 space-y-7 pb-28 max-w-[1600px] mx-auto animate-page-enter">
      {/* 0. GPS & TELEMETRY LIVE STATUS BAR */}
      <LocationTrackerBar />

      {/* ===================================================================
          1. TOP HERO SECTION: Hero Weather Card, 4-Day Forecast, Highlights Grid
          =================================================================== */}
      <section aria-label="Hero Weather & Location Status">
        <TopHeroSection
          userName={user?.full_name}
          currentLocation={currentLocation}
          currentReading={currentReading}
          currentRisk={currentRisk}
          forecastDaily={forecastDaily}
          forecastHourly={forecastHourly}
          lastSyncTime={lastSyncTime}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          selectedZone={selectedZone}
          locations={locations}
          onSelectLocality={selectCustomLocality}
        />
      </section>

      {/* 2. WHAT SHOULD YOU DO NOW? (Signature 4 Actionable Safety Cards) */}
      <section aria-label="What Should You Do Now">
        <WhatShouldIDoNow
          actions={actionResult.immediateActions}
          slogan={actionResult.residentSlogan}
          riskLevel={actionResult.riskLevel}
        />
      </section>

      {/* 3. HEAT-SAFE DAY PLAN (Dynamic Timeline with Clear Badges) */}
      <section aria-label="Heat Safe Day Plan">
        <HeatSafeDayPlan
          dayPlan={actionResult.dayPlan}
          peakTime={actionResult.peakHeat.timeLabel}
        />
      </section>

      {/* 4. DAILY WELLNESS CHECK-IN */}
      <section aria-label="Daily Safety Check-in">
        <ConfirmSafeCelebration 
          userName={user?.full_name} 
          userId={user?.id}
          localityName={currentLocation.localityName || currentLocation.city}
        />
      </section>

      {/* 5. QUICK ACTIONS BAR (Cooling Shelter, Locate Water, Plan Safe Route, Request Aid) */}
      <section aria-label="Quick Action Cards">
        <QuickActionsGrid showHeader={true} />
      </section>

      {/* 6. FORECAST STRIP & 24-HOUR DIURNAL TEMPERATURE WAVE */}
      <section aria-label="Forecast Strip & Temperature Graph">
        <HorizontalForecastStrip
          forecastDaily={forecastDaily}
          forecastHourly={forecastHourly}
          showHourlyGraph={true}
        />
      </section>

      {/* 7. NEARBY HELP LIFELINES (Water, Cooling, Medical) */}
      <section aria-label="Nearby Help Lifelines">
        <NearbyHelpCards
          userLat={currentLocation?.latitude}
          userLon={currentLocation?.longitude}
          onLocateOnMap={handleLocateOnMap}
        />
      </section>

      {/* 8. SMART HEAT MAP */}
      <section id="thermal-heat-risk-map" aria-label="Thermal Heat Risk Map">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-7 shadow-sm shadow-blue-500/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Smart Interactive Heat Map</span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E60F2] border border-blue-200/80">
                  Multimodal Layers
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Explore Heat Risk, Cooling Centers, Drinking Water Points, and Hospitals in {currentLocation.localityName || currentLocation.city}
              </p>
            </div>
            
            <Link 
              to="/map" 
              className="text-xs text-[#1E60F2] font-bold hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Full interactive map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <HeatRiskMap 
            locations={locations} 
            selectedLocationId={selectedZone?.id} 
            onSelectLocation={selectCustomLocality}
            className="h-[380px] sm:h-[420px] rounded-2xl shadow-2xs border border-slate-100 overflow-hidden" 
          />
        </div>
      </section>

      {/* 9. WHY IS MY HEAT RISK {LEVEL}? (Explainable AI Factor Breakdown) */}
      <section aria-label="Explainable AI Factor Breakdown">
        <WhyRiskLevelCards
          currentReading={currentReading}
          currentRisk={currentRisk}
          selectedZone={selectedZone}
        />
      </section>

      {/* 10. OTHER REGIONAL HOTSPOTS & SOLAR ARC TRACKER */}
      <section aria-label="Other Hotspots & Solar Arc Tracker" className="space-y-6">
        <OtherCitiesRail />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-6">
            <HeatRiskCard
              score={actionResult.riskScore}
              category={actionResult.riskLevel === 'extreme' ? 'critical' : actionResult.riskLevel}
              hourlyForecast={forecastHourly}
              trend={(forecastHourly && forecastHourly.length >= 2 && ((forecastHourly[1].temperature_c ?? 0) < (forecastHourly[0].temperature_c ?? 0))) ? 'Decreasing' : 'Increasing'}
              className="h-full rounded-3xl border border-slate-100 shadow-sm shadow-blue-500/5"
            />
          </div>

          <div className="lg:col-span-6">
            <SolarArcGauge
              sunrise="05:48 AM"
              sunset="06:42 PM"
              title="Celestial Solar Arc"
              showControls={true}
              className="h-full rounded-3xl border border-slate-100 shadow-sm shadow-blue-500/5"
            />
          </div>
        </div>
      </section>

      {/* Emergency Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      {/* Floating Emergency SOS Pill */}
      <FloatingEmergencySOS onOpenEmergency={() => setIsEmergencyOpen(true)} />
    </div>
  );
};

export default DashboardPage;
