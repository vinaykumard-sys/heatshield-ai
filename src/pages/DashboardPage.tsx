import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Thermometer, 
  Droplets, 
  Flame, 
  Users, 
  HeartPulse, 
  AlertTriangle, 
  RefreshCw, 
  Calendar, 
  CheckCircle, 
  TrendingUp,
  MapPin,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { TempTrendChart } from '../components/charts/TempTrendChart';
import { HumidityTrendChart } from '../components/charts/HumidityTrendChart';
import { RiskDistributionChart } from '../components/charts/RiskDistributionChart';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { HeatRiskMap } from '../components/map/HeatRiskMap';
import { useLocationTracker } from '../context/LocationContext';
import { mockDb } from '../lib/mockDb';
import { fetchLiveWeather } from '../lib/weatherApi';
import { evaluateHeatRisk } from '../lib/riskEngine';
import { useLanguage } from '../context/LanguageContext';
import { LocationZone, HeatRiskAssessment, EnvironmentalReading } from '../types';

export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const { 
    currentReading, 
    currentRisk, 
    forecastHourly, 
    forecastDaily,
    isLiveWeather: isLiveTelemetry,
    selectedZone,
    selectCustomLocality,
    forceTelemetryRefresh
  } = useLocationTracker();

  const locations = mockDb.getLocations();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const residents = mockDb.getResidents();
  const checkins = mockDb.getCheckins();
  const requests = mockDb.getRequests();
  const activityLogs = mockDb.getActivityLogs();
  const notifications = mockDb.getNotifications();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await forceTelemetryRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Aggregate Stats
  const pendingCheckinsCount = checkins.filter(c => c.status === 'pending').length;

  const distribution = {
    critical: locations.filter(l => l.baseline_vulnerability_score >= 80).length,
    high: locations.filter(l => l.baseline_vulnerability_score >= 70 && l.baseline_vulnerability_score < 80).length,
    moderate: locations.filter(l => l.baseline_vulnerability_score >= 50 && l.baseline_vulnerability_score < 70).length,
    low: locations.filter(l => l.baseline_vulnerability_score < 50).length,
  };

  const highRiskNeighborhoodsCount = distribution.critical + distribution.high;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Hyperlocal Location Tracker & Command Bar */}
      <LocationTrackerBar />

      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Executive Heat Risk Console</h1>
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
              isLiveTelemetry ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {isLiveTelemetry ? 'LIVE SATELLITE METEO' : 'OFFLINE TESTBED'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time urban thermal exposure monitoring, explainable risk scoring, and volunteer dispatch stream.
          </p>
        </div>

        {/* Locality Selector and Refresh Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedZone?.id || ''}
              onChange={(e) => {
                const found = locations.find(l => l.id === e.target.value);
                if (found) selectCustomLocality(found);
              }}
              className="bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm rounded-xl px-3 py-2 pr-8 focus:outline-none input-interactive shadow-sm font-medium"
            >
              {!locations.some(l => l.id === selectedZone?.id) && selectedZone && (
                <option value={selectedZone.id}>
                  📍 {selectedZone.name} ({selectedZone.city}) [Selected]
                </option>
              )}
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="text-slate-900">
                  {loc.name} ({loc.city})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm btn-press hover:scale-105 active:scale-95"
            title="Refresh weather data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 6 Minimal White KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Current Temperature */}
        <StatCard
          className="animate-card-enter stagger-1"
          title="Current Temperature"
          value={`${currentReading?.temperature_c ?? 34.5}°C`}
          subtitle={`Feels like ${currentReading?.feels_like_c ?? 37.2}°C`}
          icon={Thermometer}
          colorScheme="orange"
          trend={{ value: '+1.8°C today', isPositive: false }}
        />

        {/* 2. Humidity */}
        <StatCard
          className="animate-card-enter stagger-2"
          title="Humidity"
          value={`${currentReading?.relative_humidity_pct ?? 58}%`}
          subtitle="Relative moisture"
          icon={Droplets}
          colorScheme="blue"
          trend={{ value: 'Elevated dew point', isNeutral: true }}
        />

        {/* 3. Heat Risk Score */}
        <StatCard
          className="animate-card-enter stagger-3"
          title="Heat Risk Score"
          value={`${currentRisk?.risk_score.toFixed(0) ?? 68} / 100`}
          subtitle={currentRisk ? currentRisk.risk_category.toUpperCase() : 'MODERATE'}
          icon={Flame}
          colorScheme="red"
          trend={{ value: 'UHI Exposure', isPositive: false }}
        />

        {/* 4. High-risk Neighbourhoods */}
        <StatCard
          className="animate-card-enter stagger-4"
          title="High-risk Zones"
          value={highRiskNeighborhoodsCount}
          subtitle={`${distribution.critical} critical, ${distribution.high} elevated`}
          icon={AlertTriangle}
          colorScheme="amber"
          trend={{ value: 'Priority clusters', isNeutral: true }}
        />

        {/* 5. Registered Residents */}
        <StatCard
          className="animate-card-enter stagger-5"
          title="Registered Residents"
          value={residents.length}
          subtitle="Vulnerable community roster"
          icon={Users}
          colorScheme="blue"
          trend={{ value: '+4 verified today', isPositive: true }}
        />

        {/* 6. Pending Welfare Check-ins */}
        <StatCard
          className="animate-card-enter stagger-6"
          title="Pending Check-ins"
          value={pendingCheckinsCount}
          subtitle={`${checkins.length} scheduled today`}
          icon={HeartPulse}
          colorScheme="amber"
          trend={{ value: 'Volunteer dispatch ready', isNeutral: true }}
        />
      </div>

      {/* Primary Visual Element: Heat Risk Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Interactive Hyperlocal Heat Risk Map</h2>
            <span className="text-xs text-slate-500 hidden sm:inline">• Live UHI layer & assistance telemetry</span>
          </div>
          <Link 
            to="/map" 
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Full Map Screen</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <HeatRiskMap 
          locations={locations} 
          selectedLocationId={selectedZone?.id} 
          onSelectLocation={selectCustomLocality}
          className="h-[520px]" 
        />
      </div>

      {/* AI Risk Explanation Alert Banner */}
      {currentRisk && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs uppercase font-mono font-bold text-slate-900 tracking-wider">
                {t('aiAnalysisHeader')} • {selectedZone?.name || 'Selected Ward'}
              </span>
              <RiskBadge category={currentRisk.risk_category} score={currentRisk.risk_score} size="sm" />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {currentRisk.ai_explanation}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/map"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm btn-interact"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Inspect on Map</span>
            </Link>
          </div>
        </div>
      )}

      {/* Environmental Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature & Heat Index Curve */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover-elevate space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">12-Hour Temperature & Heat Index Curve</h3>
              <p className="text-xs text-slate-500">Ambient Temperature vs. Human Physiological Thermal Stress (Feels Like)</p>
            </div>
            <span className="text-xs font-mono font-bold text-orange-600">
              Peak: {Math.max(...(forecastHourly.map(f => f.heat_index_c) || [38]))}°C
            </span>
          </div>
          <TempTrendChart data={forecastHourly} />
        </div>

        {/* Relative Humidity & Wet-Bulb Load */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover-elevate space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Relative Humidity Trend</h3>
              <p className="text-xs text-slate-500">Moisture impedes evaporative cooling (sweating) in the human body</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600">
              Avg: 58%
            </span>
          </div>
          <HumidityTrendChart data={forecastHourly} />
        </div>
      </div>

      {/* Seven-Day Trend & Risk Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Environmental Forecast */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover-elevate space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">7-Day Ward Heat Outlook</h3>
              <p className="text-xs text-slate-500">Predicted daily high/low temperatures & heatwave alert level</p>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
            {forecastDaily.map((day, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1.5 card-interactive cursor-default"
              >
                <span className="text-[11px] font-mono font-semibold text-slate-500 block truncate">{day.date}</span>
                <div className="text-base font-bold text-slate-900 font-mono">{day.max_temp_c}°C</div>
                <div className="text-xs text-slate-500 font-mono">Min {day.min_temp_c}°C</div>
                <div className="pt-1">
                  <RiskBadge category={day.risk_level} size="sm" showPulse={false} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Risk Distribution</h3>
              <p className="text-xs text-slate-500">Active monitoring zones by risk category</p>
            </div>
          </div>
          <RiskDistributionChart distribution={distribution} />
        </div>
      </div>

      {/* Bottom Row: Recent High-Priority Alerts & Community Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Community Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Active Community Alerts</h3>
            </div>
            <Link to="/requests" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>

          <div className="space-y-2.5">
            {notifications.slice(0, 3).map((notif) => (
              <div key={notif.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="p-1.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200 shrink-0 mt-0.5">
                  <Flame className="w-3.5 h-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{notif.title}</h4>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{notif.priority}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Community Welfare Activity Logs */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Recent Field Operations</h3>
            </div>
            <Link to="/checkins" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View check-ins
            </Link>
          </div>

          <div className="space-y-2.5">
            {activityLogs.slice(0, 3).map((act) => (
              <div key={act.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{act.actor_name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Action: <span className="text-slate-800 font-medium">{act.action.replace(/_/g, ' ')}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
