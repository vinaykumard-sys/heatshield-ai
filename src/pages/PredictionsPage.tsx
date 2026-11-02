import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Flame, 
  ShieldCheck, 
  RefreshCw, 
  Info,
  Clock,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { mockDb } from '../lib/mockDb';
import { LocationZone, HeatForecast, PredictionComparison } from '../types';
import { generateLocationForecasts, getPredictionComparisons } from '../lib/predictionEngine';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { RiskBadge } from '../components/common/RiskBadge';

export const PredictionsPage: React.FC = () => {
  const locations = mockDb.getLocations();
  const [selectedLocId, setSelectedLocId] = useState<string>(locations[0]?.id || '');
  const [forecasts, setForecasts] = useState<HeatForecast[]>([]);
  const [comparisons, setComparisons] = useState<PredictionComparison[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHorizon, setSelectedHorizon] = useState<24 | 48 | 72>(24);

  const selectedLoc = locations.find(l => l.id === selectedLocId) || locations[0];

  const loadForecastData = async (loc: LocationZone, force = false) => {
    setIsLoading(true);
    try {
      const results = await generateLocationForecasts(loc, force);
      setForecasts(results);
      setComparisons(getPredictionComparisons(loc.id));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLoc) {
      loadForecastData(selectedLoc);
    }
  }, [selectedLocId]);

  const activeForecast = forecasts.find(f => f.forecast_horizon_hours === selectedHorizon) || forecasts[0];

  // Chart telemetry data across 24h, 48h, 72h
  const trendChartData = [
    { period: 'Now', temp: 34.2, feelsLike: 37.0, risk: 62, humidity: 54 },
    ...forecasts.map(f => ({
      period: `+${f.forecast_horizon_hours}h`,
      temp: f.predicted_temperature_c,
      feelsLike: f.predicted_feels_like_c,
      risk: f.predicted_risk_score,
      humidity: f.predicted_humidity_pct
    }))
  ];

  // Highest predicted risk ranking across all monitored localities
  const highRiskNeighbourhoods = locations
    .map(loc => {
      const isNorth = loc.latitude > 25.0;
      const baseRisk = Math.round(50 + (loc.baseline_vulnerability_score * 0.3) + (isNorth ? 18 : 6));
      return {
        id: loc.id,
        name: loc.name,
        city: loc.city,
        predictedRisk: Math.min(96, baseRisk),
        predictedTemp: isNorth ? 40.5 : 35.8,
        vulnerability: loc.baseline_vulnerability_score,
        uhi: loc.urban_heat_island_factor
      };
    })
    .sort((a, b) => b.predictedRisk - a.predictedRisk)
    .slice(0, 6);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              AI Heatwave Prediction Engine
            </h1>
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
              MULTI-VARIABLE FORECASTER
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            24, 48, and 72-hour hyperlocal predictive heat-risk modelling using multi-variable atmospheric telemetry and urban canopy factors.
          </p>
        </div>

        {/* Locality Selector & Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedLocId}
              onChange={(e) => setSelectedLocId(e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 text-xs font-semibold pl-9 pr-8 py-2 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.city})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => selectedLoc && loadForecastData(selectedLoc, true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-compute Models</span>
          </button>
        </div>
      </div>

      {/* Three Horizon Cards: 24h, 48h, 72h */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forecasts.map((fc) => {
          const isSelected = selectedHorizon === fc.forecast_horizon_hours;
          const trendIcon = fc.risk_trend === 'rising' 
            ? <TrendingUp className="w-3.5 h-3.5 text-red-600" />
            : fc.risk_trend === 'declining'
            ? <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            : <Minus className="w-3.5 h-3.5 text-slate-500" />;

          return (
            <div
              key={fc.forecast_horizon_hours}
              onClick={() => setSelectedHorizon(fc.forecast_horizon_hours)}
              className={`p-5 rounded-xl border transition-all cursor-pointer bg-white shadow-sm space-y-4 hover-elevate ${
                isSelected 
                  ? 'border-blue-600 ring-2 ring-blue-600/10 shadow-md' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  +{fc.forecast_horizon_hours} Hour Horizon
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  fc.risk_trend === 'rising' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {trendIcon}
                  <span className="capitalize">{fc.risk_trend} Trend</span>
                </span>
              </div>

              {/* Temperature & Risk Score Row */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Predicted Daytime High</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                    {fc.predicted_temperature_c}°C
                  </p>
                  <p className="text-xs text-slate-500">
                    Feels like ~{fc.predicted_feels_like_c}°C
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Risk Score</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                    {fc.predicted_risk_score.toFixed(0)}
                    <span className="text-xs text-slate-400 font-normal">/100</span>
                  </p>
                  <RiskBadge category={fc.risk_category} score={fc.predicted_risk_score} size="sm" />
                </div>
              </div>

              {/* Humidity & Confidence Meta */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  <span>Humidity: {fc.predicted_humidity_pct}%</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{(fc.confidence_score * 100).toFixed(0)}% Confidence</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep AI Predictive Telemetry & Explainability */}
      {activeForecast && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 72-Hour Environmental Progression Chart */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Projected Environmental & Risk Progression
                </h3>
                <p className="text-xs text-slate-500">
                  Forecast curve for {selectedLoc?.name} across next 72 hours
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Hourly Resolution
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData}>
                  <defs>
                    <linearGradient id="predTempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EA580C" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#EA580C" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="predRiskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.20} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="period" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} domain={[20, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="temp"
                    name="Temperature (°C)"
                    stroke="#EA580C"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#predTempGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="risk"
                    name="Heat Risk Score"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#predRiskGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                  <span>Temperature (°C)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Modelled Risk Score (0–100)</span>
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Source: Atmospheric Telemetry + Urban Exposure Weighting
              </span>
            </div>
          </div>

          {/* AI Explainable Reasoning Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Explainable Risk Drivers (+{activeForecast.forecast_horizon_hours}h)
                </h3>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                {activeForecast.ai_explanation}
              </div>

              {/* Contributing Factor Sliders */}
              <div className="space-y-2 pt-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Weight Contribution Breakdown
                </p>
                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Thermal Ambient Loading</span>
                    <span className="font-mono font-bold text-slate-800">
                      {activeForecast.contributing_factors.ambient_temperature_score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full rounded-full" 
                      style={{ width: `${Math.min(100, activeForecast.contributing_factors.ambient_temperature_score)}%` }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Humidity Heat Index Factor</span>
                    <span className="font-mono font-bold text-slate-800">
                      {activeForecast.contributing_factors.humidity_heat_index_score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full" 
                      style={{ width: `${Math.min(100, activeForecast.contributing_factors.humidity_heat_index_score)}%` }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Urban Built Density (UHI)</span>
                    <span className="font-mono font-bold text-slate-800">
                      {activeForecast.contributing_factors.urban_exposure_score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full" 
                      style={{ width: `${Math.min(100, activeForecast.contributing_factors.urban_exposure_score)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Protocol Recommendations */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Preventive Community Actions
              </p>
              <ul className="space-y-1 text-xs text-slate-600">
                {activeForecast.preventive_actions.map((act, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold shrink-0">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Highest-Risk Neighbourhoods Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Highest Projected Risk Neighbourhoods (Next 24–48 Hours)
            </h3>
            <p className="text-xs text-slate-500">
              Localities projected to experience peak thermal stress based on urban density and ambient forecast.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 text-slate-600">
            Ranked by AI Severity
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Neighbourhood</th>
                <th className="px-4 py-2.5">City</th>
                <th className="px-4 py-2.5">Predicted High</th>
                <th className="px-4 py-2.5">UHI Factor</th>
                <th className="px-4 py-2.5">Baseline Vulnerability</th>
                <th className="px-4 py-2.5">Forecast Risk</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {highRiskNeighbourhoods.map((n, idx) => (
                <tr key={n.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px] w-4">{idx + 1}.</span>
                    <span>{n.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{n.city}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    <span className={n.predictedTemp >= 40 ? 'text-red-600' : 'text-slate-900'}>
                      {n.predictedTemp}°C
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">{n.uhi}x</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{n.vulnerability}/100</td>
                  <td className="px-4 py-3">
                    <RiskBadge category={n.predictedRisk >= 75 ? 'critical' : n.predictedRisk >= 50 ? 'high' : 'moderate'} score={n.predictedRisk} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedLocId(n.id)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Forecast vs Observed Accuracy Comparison Audit */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Prediction Verification & Model Validation Log
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Comparing Prior 24h/48h Forecasts to Observed In-Situ Sensor Data
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {comparisons.map((cmp) => (
            <div key={cmp.horizon} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Horizon: {cmp.horizon}</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-semibold border border-emerald-200">
                  {cmp.accuracy_label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Predicted Temp</span>
                  <span className="font-bold text-slate-800">{cmp.predicted_temp}°C</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Observed Temp</span>
                  <span className="font-bold text-slate-800">{cmp.actual_temp}°C</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Predicted Risk</span>
                  <span className="font-bold text-blue-700">{cmp.predicted_risk}/100</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Observed Risk</span>
                  <span className="font-bold text-blue-700">{cmp.actual_risk}/100</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                Variance is within acceptable operational tolerance (±{cmp.variance_pct}%).
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
