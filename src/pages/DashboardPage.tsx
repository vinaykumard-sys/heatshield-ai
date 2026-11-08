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
import { NewRequestModal } from '../components/requests/NewRequestModal';
import { SolarArcGauge } from '../components/common/SolarArcGauge';
import { HeatRiskCard } from '../components/common/HeatRiskCard';
import { HeatRiskMap } from '../components/map/HeatRiskMap';
import { CityHeatMap3D, TemperatureOrb3D } from '../components/3d';
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
import { HourlyWeatherModal } from '../components/dashboard/HourlyWeatherModal';
import { DailyForecastModal } from '../components/dashboard/DailyForecastModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    currentLocation, 
    currentReading, 
    currentRisk, 
    forecastHourly, 
    forecastDaily,
    todayHourly,
    liveBanner,
    selectedZone,
    selectCustomLocality,
    forceTelemetryRefresh,
    lastSyncTime
  } = useLocationTracker();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isHourlyModalOpen, setIsHourlyModalOpen] = useState(false);
  const [dailyModalDayIndex, setDailyModalDayIndex] = useState<number | null>(null);
  const [mapViewMode, setMapViewMode] = useState<'3d_city' | '2d_map'>('3d_city');

  const locations = mockDb.getLocations();
  const coolingCentres = useMemo(() => mockDb.getCoolingCentres(), []);

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
          todayHourly={todayHourly}
          liveBanner={liveBanner}
          lastSyncTime={lastSyncTime}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          selectedZone={selectedZone}
          locations={locations}
          onSelectLocality={selectCustomLocality}
          onOpenHourlyModal={() => setIsHourlyModalOpen(true)}
          onOpenDailyModal={(dayIdx) => setDailyModalDayIndex(dayIdx)}
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
        <QuickActionsGrid 
          showHeader={true} 
          onRequestAid={() => setIsRequestModalOpen(true)}
        />
      </section>

      {/* 6. FORECAST STRIP & 24-HOUR DIURNAL TEMPERATURE WAVE */}
      <section aria-label="Forecast Strip & Temperature Graph">
        <HorizontalForecastStrip
          forecastDaily={forecastDaily}
          forecastHourly={forecastHourly}
          showHourlyGraph={true}
          onOpenDailyModal={(dayIdx) => setDailyModalDayIndex(dayIdx)}
          onOpenHourlyModal={() => setIsHourlyModalOpen(true)}
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

      {/* 8. SMART HEAT MAP (3D DIGITAL TWIN & 2D MULTIMODAL MAP) */}
      <section id="thermal-heat-risk-map" aria-label="Thermal Heat Risk Map">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-7 shadow-sm shadow-blue-500/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Smart Interactive Heat Map</span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E60F2] border border-blue-200/80">
                  {mapViewMode === '3d_city' ? '3D Digital Twin City' : 'Multimodal 2D Layers'}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  WebGL Accelerated
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {mapViewMode === '3d_city'
                  ? `Interactive 3D procedural simulation, cooling shelters, and heatwave radiation for ${currentLocation.localityName || currentLocation.city}`
                  : `Explore Heat Risk, Cooling Centers, Drinking Water Points, and Hospitals in ${currentLocation.localityName || currentLocation.city}`}
              </p>
            </div>
            
            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
              {/* 3D vs 2D Mode Switcher */}
              <div className="flex items-center p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 text-xs font-bold shadow-2xs">
                <button
                  type="button"
                  onClick={() => setMapViewMode('3d_city')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    mapViewMode === '3d_city'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Switch to 3D Digital Twin View"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#1E60F2]" />
                  <span>3D City View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapViewMode('2d_map')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    mapViewMode === '2d_map'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Switch to 2D Geospatial Map"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>2D Map</span>
                </button>
              </div>

              <Link 
                to="/map" 
                className="text-xs text-[#1E60F2] font-bold hover:underline flex items-center gap-1"
              >
                <span>Full map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {mapViewMode === '3d_city' ? (
            <CityHeatMap3D
              localityName={currentLocation.localityName || currentLocation.city}
              cityName={currentLocation.city}
              temperature={Math.round(currentTemp)}
              feelsLike={Math.round(feelsLike)}
              riskCategory={actionResult.riskLevel}
              riskScore={actionResult.riskScore}
              coolingCentres={coolingCentres}
              height={460}
              onSelectShelter={() => handleLocateOnMap()}
            />
          ) : (
            <HeatRiskMap 
              locations={locations} 
              selectedLocationId={selectedZone?.id} 
              onSelectLocation={selectCustomLocality}
              className="h-[380px] sm:h-[420px] rounded-2xl shadow-2xs border border-slate-100 overflow-hidden" 
            />
          )}
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

      {/* 10. OTHER REGIONAL HOTSPOTS & 3D THERMAL TELEMETRY */}
      <section aria-label="Other Hotspots & Solar Arc Tracker" className="space-y-6">
        <OtherCitiesRail />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          <div>
            <HeatRiskCard
              score={actionResult.riskScore}
              category={actionResult.riskLevel === 'extreme' ? 'critical' : actionResult.riskLevel}
              hourlyForecast={forecastHourly}
              trend={(forecastHourly && forecastHourly.length >= 2 && ((forecastHourly[1].temperature_c ?? 0) < (forecastHourly[0].temperature_c ?? 0))) ? 'Decreasing' : 'Increasing'}
              className="h-full rounded-3xl border border-slate-100 shadow-sm shadow-blue-500/5"
            />
          </div>

          <div>
            <TemperatureOrb3D
              temperature={currentTemp}
              feelsLike={feelsLike}
              riskCategory={actionResult.riskLevel}
              riskScore={actionResult.riskScore}
              condition={currentReading?.weather_condition || 'Active Telemetry'}
              localityName={currentLocation.localityName || currentLocation.city}
              height="100%"
              className="h-full min-h-[320px]"
              onClick={() => setIsHourlyModalOpen(true)}
            />
          </div>

          <div className="md:col-span-2 lg:col-span-1">
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

      {/* New Assistance Request Modal Triggered Immediately from Quick Actions */}
      <NewRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={() => setIsRequestModalOpen(false)}
      />

      {/* Floating Emergency SOS Pill */}
      <FloatingEmergencySOS onOpenEmergency={() => setIsEmergencyOpen(true)} />

      {/* Hourly 24-Hour Forecast Modal */}
      <HourlyWeatherModal
        isOpen={isHourlyModalOpen}
        onClose={() => setIsHourlyModalOpen(false)}
        todayHourly={todayHourly || []}
        currentReading={currentReading}
        liveBanner={liveBanner}
        locationName={currentLocation.localityName || currentLocation.locality || currentLocation.city}
        cityName={currentLocation.city}
        lastSyncTime={lastSyncTime}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Detailed 7-Day Daily Forecast Modal */}
      <DailyForecastModal
        isOpen={dailyModalDayIndex !== null}
        initialDayIndex={dailyModalDayIndex ?? 0}
        onClose={() => setDailyModalDayIndex(null)}
        forecastDaily={forecastDaily || []}
        locationName={currentLocation.localityName || currentLocation.locality || currentLocation.city}
        cityName={currentLocation.city}
      />
    </div>
  );
};

export default DashboardPage;
