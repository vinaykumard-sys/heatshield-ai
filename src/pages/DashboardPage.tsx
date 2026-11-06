import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { EmergencyModal } from '../components/common/EmergencyModal';
import { SolarArcGauge } from '../components/common/SolarArcGauge';
import { HeatRiskCard } from '../components/common/HeatRiskCard';
import { HeatRiskMap } from '../components/map/HeatRiskMap';
import { useLocationTracker } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../lib/mockDb';

// HeatShield 2.0 Dashboard Components (Requirement 3 Strict Hierarchy)
import { TopHeroSection } from '../components/dashboard/TopHeroSection';
import { ConfirmSafeCelebration } from '../components/dashboard/ConfirmSafeCelebration';
import { SafetyRecommendations } from '../components/dashboard/SafetyRecommendations';
import { QuickActionsGrid } from '../components/dashboard/QuickActionsGrid';
import { HeatOutlookCard } from '../components/dashboard/HeatOutlookCard';
import { HorizontalForecastStrip } from '../components/dashboard/HorizontalForecastStrip';
import { TodayConditionsGrid } from '../components/dashboard/TodayConditionsGrid';
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
  const smartAlerts = mockDb.getSmartAlerts();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await forceTelemetryRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Weather metrics with fallback realism
  const currentTemp = currentReading?.temperature_c ?? 38.5;
  const feelsLike = currentReading?.feels_like_c ?? 42.1;
  const riskCategory = currentRisk?.risk_category ?? (
    currentTemp >= 40 ? 'critical' : currentTemp >= 36 ? 'high' : currentTemp >= 31 ? 'moderate' : 'low'
  );

  // Smooth scroll handler to highlight heat map
  const handleLocateOnMap = () => {
    const mapElement = document.getElementById('thermal-heat-risk-map');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-7 pb-28 max-w-7xl mx-auto px-2 sm:px-4 animate-page-enter">
      {/* 0. GPS & TELEMETRY LIVE STATUS BAR */}
      <LocationTrackerBar />

      {/* ===================================================================
          REQUIREMENT 3: STRICT HIERARCHY FOR 3-SECOND COMPREHENSION
          =================================================================== */}

      {/* 1. LOCATION HEADER & HERO WEATHER (Location, Temp, Feels Like, Heat Risk, Peak Heat) */}
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

      {/* 2. DAILY HEAT SAFETY CHECK-IN ("Are you feeling okay in today's heat? [ I'm safe ]") */}
      <section aria-label="Daily Safety Check-in">
        <ConfirmSafeCelebration 
          userName={user?.full_name} 
          userId={user?.id}
          localityName={currentLocation.localityName || currentLocation.city}
        />
      </section>

      {/* 3. WHAT SHOULD YOU DO NOW? (SafetyRecommendations - 3-4 concise recommendations) */}
      <section aria-label="What Should You Do Now">
        <SafetyRecommendations 
          riskCategory={riskCategory} 
          feelsLikeTemp={feelsLike}
          onOpenEmergencyModal={() => setIsEmergencyOpen(true)}
        />
      </section>

      {/* 4. QUICK ACTIONS (QuickActionsGrid - 4 buttons: Find Cooling Shelter, Locate Water, Plan Safe Route, Request Aid) */}
      <section aria-label="Quick Action Cards">
        <QuickActionsGrid 
          showHeader={true}
        />
      </section>

      {/* 5. TODAY'S HEAT OUTLOOK (HeatOutlookCard - Peak heat 34°C at 2:00 PM, Expected risk Moderate, View full forecast →) */}
      <section aria-label="Today's Heat Outlook">
        <HeatOutlookCard
          forecastHourly={forecastHourly}
          currentRisk={currentRisk}
          currentReading={currentReading}
        />
      </section>

      {/* 6. FORECAST (HorizontalForecastStrip with smooth spline chart TemperatureGraph) */}
      <section aria-label="Forecast Strip & Temperature Graph">
        <HorizontalForecastStrip
          forecastDaily={forecastDaily}
          forecastHourly={forecastHourly}
          showHourlyGraph={true}
        />
      </section>

      {/* 7. TODAY'S CONDITIONS (TodayConditionsGrid - Feels Like, Wind, Humidity, UV, Rain) */}
      <section aria-label="Today's Conditions">
        <TodayConditionsGrid
          currentReading={currentReading}
          currentRisk={currentRisk}
          selectedZone={selectedZone}
        />
      </section>

      {/* 8. NEARBY HELP (NearbyHelpCards - Water, Cooling, Medical) */}
      <section aria-label="Nearby Help Lifelines">
        <NearbyHelpCards
          userLat={currentLocation?.latitude}
          userLon={currentLocation?.longitude}
          onLocateOnMap={handleLocateOnMap}
        />
      </section>

      {/* 9. HEAT MAP (HeatRiskMap - Large rounded map with floating controls) */}
      <section id="thermal-heat-risk-map" aria-label="Thermal Heat Risk Map">
        <div className="bg-white rounded-[26px] border border-[#E5EDF5] p-5 sm:p-6 shadow-xs space-y-4 hover:shadow-card-hover transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>High-Resolution Thermal Heat Map</span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200/70">
                  Thermal Satellite Layer
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Microclimatic surface temperature, asphalt traps, and urban heat contours around {currentLocation.localityName || currentLocation.city}
              </p>
            </div>
            
            <Link 
              to="/map" 
              className="text-xs text-[#1E60F2] font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Full interactive map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <HeatRiskMap 
            locations={locations} 
            selectedLocationId={selectedZone?.id} 
            onSelectLocation={selectCustomLocality}
            className="h-[400px] sm:h-[440px] rounded-[22px] shadow-xs border border-[#E5EDF5] overflow-hidden" 
          />
        </div>
      </section>

      {/* 10. WHY IS MY HEAT RISK {LEVEL}? (WhyRiskLevelCards - 5 clean factor cards) */}
      <section aria-label="Explainable AI Factor Breakdown">
        <WhyRiskLevelCards
          currentReading={currentReading}
          currentRisk={currentRisk}
          selectedZone={selectedZone}
        />
      </section>

      {/* 11. OTHER MONITORED HOTSPOTS / CITIES & CELESTIAL SOLAR TRACKER */}
      <section aria-label="Other Hotspots & Solar Arc Tracker" className="space-y-6">
        {/* Other Monitored Hotspots / Cities Rail */}
        <OtherCitiesRail />

        {/* Heat Risk Index & Solar Tracker Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Heat Risk Card (Requirement 5) */}
          <div className="lg:col-span-6">
            <HeatRiskCard
              score={currentRisk?.risk_score ?? 53}
              category={currentRisk?.risk_category ?? 'moderate'}
              hourlyForecast={forecastHourly}
              trend={(forecastHourly && forecastHourly.length >= 2 && ((forecastHourly[1].temperature_c ?? 0) < (forecastHourly[0].temperature_c ?? 0))) ? 'Decreasing' : 'Increasing'}
              className="h-full"
            />
          </div>

          {/* Celestial Solar Arc Tracker */}
          <div className="lg:col-span-6">
            <SolarArcGauge
              sunrise="05:48 AM"
              sunset="06:42 PM"
              title="Celestial Solar Arc"
              showControls={true}
              className="h-full"
            />
          </div>
        </div>

        {/* Active Heat Warnings & IMD Advisories */}
        <div className="bg-white rounded-[26px] border border-[#E5EDF5] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Active IMD Heat Bulletins & Ward Advisories
                </h3>
              </div>
              <Link to="/heat-alerts" className="text-xs text-[#1E60F2] font-semibold hover:underline">
                View all bulletins
              </Link>
            </div>

            {smartAlerts.length > 0 ? (
              <div className="space-y-3">
                {smartAlerts.slice(0, 2).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-[20px] bg-amber-50/70 border border-amber-200/80 flex flex-col justify-between gap-2.5 text-xs hover:-translate-y-0.5 transition-all duration-200"
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
                      className="self-start px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors btn-press shadow-xs"
                    >
                      View guidance
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-[20px] bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No severe heatwave warnings in this ward. Normal daytime hydration recommended.</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 shrink-0">
                  NORMAL
                </span>
              </div>
            )}
          </div>
      </section>

      {/* 12. FLOATING SOS HOTLINE BUTTON & EMERGENCY HOTLINE MODAL */}
      <EmergencyModal 
        isOpen={isEmergencyOpen} 
        onClose={() => setIsEmergencyOpen(false)} 
      />
      <FloatingEmergencySOS 
        onOpenEmergency={() => setIsEmergencyOpen(true)} 
      />
    </div>
  );
};

export default DashboardPage;
