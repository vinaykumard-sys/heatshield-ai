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
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from 'recharts';
import { mockDb } from '../lib/mockDb';
import { LocationZone, HeatForecast, PredictionComparison } from '../types';
import { generateLocationForecasts, getPredictionComparisons } from '../lib/predictionEngine';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { RiskBadge } from '../components/common/RiskBadge';
import { useLocationTracker } from '../context/LocationContext';

export const PredictionsPage: React.FC = () => {
  const { currentReading, currentRisk } = useLocationTracker();
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

  const nowTemp = currentReading?.temperature_c ? Number(currentReading.temperature_c.toFixed(1)) : (forecasts[0] ? Number((forecasts[0].predicted_temperature_c - 1.2).toFixed(1)) : 33.2);
  const nowFeelsLike = currentReading?.feels_like_c ? Number(currentReading.feels_like_c.toFixed(1)) : (forecasts[0] ? Number((forecasts[0].predicted_feels_like_c - 1.0).toFixed(1)) : 35.4);
  const nowRisk = currentRisk?.risk_score ?? (forecasts[0] ? Math.max(30, forecasts[0].predicted_risk_score - 4) : 52);
  const nowHumidity = currentReading?.relative_humidity_pct ?? (forecasts[0] ? forecasts[0].predicted_humidity_pct : 54);

  const trendChartData = [
    { period: 'Now', temp: nowTemp, feelsLike: nowFeelsLike, risk: nowRisk, humidity: nowHumidity },
    ...forecasts.map(f => ({
      period: `+${f.forecast_horizon_hours}h`,
      temp: f.predicted_temperature_c,
      feelsLike: f.predicted_feels_like_c,
      risk: f.predicted_risk_score,
      humidity: f.predicted_humidity_pct
    }))
  ];

  const baseLiveTemp = currentReading?.temperature_c || 33.0;
  const highRiskNeighbourhoods = locations
    .map(loc => {
      const isNorth = loc.latitude > 25.0;
      const baseRisk = Math.round(50 + (loc.baseline_vulnerability_score * 0.3) + (isNorth ? 12 : 4));
      const predT = Number((baseLiveTemp * loc.urban_heat_island_factor).toFixed(1));
      return {
        id: loc.id,
        name: loc.name,
        city: loc.city,
        predictedRisk: Math.min(96, baseRisk),
        predictedTemp: predT,
        vulnerability: loc.baseline_vulnerability_score,
        uhi: loc.urban_heat_island_factor
      };
    })
    .sort((a, b) => b.predictedRisk - a.predictedRisk)
    .slice(0, 6);

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#1E60F2]" />
            <span>Heat Forecast & Risk Projection</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            24, 48, and 72-hour hyperlocal predictive heat modeling for your area
          </p>
        </div>

        {/* Locality Selector & Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedLocId}
              onChange={(e) => setSelectedLocId(e.target.value)}
              className="appearance-none bg-white border border-[#E5EDF5] text-slate-900 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl shadow-xs input-interactive focus:outline-none cursor-pointer"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.city})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => selectedLoc && loadForecastData(selectedLoc, true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-[#E5EDF5] btn-press transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1E60F2] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Update Forecast</span>
          </button>
        </div>
      </div>

      {/* Three Horizon Cards: 24h, 48h, 72h */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forecasts.map((fc) => {
          const isSelected = selectedHorizon === fc.forecast_horizon_hours;
          const trendIcon = fc.risk_trend === 'rising' 
            ? <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
            : fc.risk_trend === 'declining'
            ? <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            : <Minus className="w-3.5 h-3.5 text-slate-400" />;

          return (
            <div
              key={fc.forecast_horizon_hours}
              onClick={() => setSelectedHorizon(fc.forecast_horizon_hours)}
              className={`p-5 rounded-[20px] border transition-all cursor-pointer bg-white space-y-4 ${
                isSelected 
                  ? 'border-[#1E60F2] ring-2 ring-[#1E60F2]/10 shadow-card-hover' 
                  : 'border-[#E5EDF5] hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#1E60F2]" />
                  <span>+{fc.forecast_horizon_hours} Hours</span>
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  fc.risk_trend === 'rising' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {trendIcon}
                  <span className="capitalize">{fc.risk_trend}</span>
                </span>
              </div>

              {/* Temperature & Risk Score Row */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <p className="text-[11px] font-medium text-slate-400">Daytime High</p>
                  <p className="text-3xl font-extrabold text-slate-900 font-sans">
                    {fc.predicted_temperature_c}°C
                  </p>
                  <p className="text-xs text-slate-500">
                    Feels like ~{fc.predicted_feels_like_c}°C
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-medium text-slate-400">Heat Index</p>
                  <p className="text-3xl font-extrabold text-slate-900 font-sans">
                    {fc.predicted_risk_score.toFixed(0)}
                    <span className="text-xs text-slate-400 font-normal">/100</span>
                  </p>
                  <RiskBadge category={fc.risk_category} score={fc.predicted_risk_score} size="sm" />
                </div>
              </div>

              {/* Humidity & Confidence */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span>Humidity: {fc.predicted_humidity_pct}%</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{(fc.confidence_score * 100).toFixed(0)}% Confidence</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Forecast Chart & Explainability */}
      {activeForecast && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 72-Hour Environmental Progression Chart */}
          <div className="lg:col-span-2 bg-white border border-[#E5EDF5] rounded-[20px] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Projected Temperature & Risk Progression
                </h3>
                <p className="text-xs text-slate-500">
                  Forecast for {selectedLoc?.name} over the next 72 hours
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Hourly resolution
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData}>
                  <defs>
                    <linearGradient id="predTempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="predRiskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E60F2" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#1E60F2" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="period" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} dy={5} />
                  <YAxis stroke="#94A3B8" fontSize={11} domain={[20, 100]} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E5EDF5',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="temp"
                    name="Temperature (°C)"
                    stroke="#F97316"
                    strokeWidth={2.4}
                    fillOpacity={1}
                    fill="url(#predTempGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="risk"
                    name="Heat Risk Index"
                    stroke="#1E60F2"
                    strokeWidth={2.4}
                    fillOpacity={1}
                    fill="url(#predRiskGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                  <span>Temperature (°C)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1E60F2]" />
                  <span>Risk Score (0–100)</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Atmospheric conditions and urban tree canopy data
              </span>
            </div>
          </div>

          {/* AI Explainable Reasoning Card */}
          <div className="bg-white border border-[#E5EDF5] rounded-[20px] p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Risk Factors (+{activeForecast.forecast_horizon_hours}h)
                </h3>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] text-xs text-slate-700 leading-relaxed">
                {activeForecast.ai_explanation}
              </div>

              {/* Contributing Factor Sliders */}
              <div className="space-y-2.5 pt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Impact Breakdown
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Solar Temperature</span>
                    <span className="font-bold text-slate-800">
                      {activeForecast.contributing_factors.ambient_temperature_score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full rounded-full" 
                      style={{ width: `${Math.min(100, activeForecast.contributing_factors.ambient_temperature_score)}%` }} 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Humidity Heat Index</span>
                    <span className="font-bold text-slate-800">
                      {activeForecast.contributing_factors.humidity_heat_index_score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#1E60F2] h-full rounded-full" 
                      style={{ width: `${Math.min(100, activeForecast.contributing_factors.humidity_heat_index_score)}%` }} 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Urban Density & Tree Cover</span>
                    <span className="font-bold text-slate-800">
                      {activeForecast.contributing_factors.urban_exposure_score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full" 
                      style={{ width: `${Math.min(100, activeForecast.contributing_factors.urban_exposure_score)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Recommended Actions
              </p>
              <ul className="space-y-1 text-xs text-slate-600">
                {activeForecast.preventive_actions.map((act, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#1E60F2] font-bold shrink-0">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Highest-Risk Neighbourhoods Table */}
      <div className="bg-white border border-[#E5EDF5] rounded-[20px] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Highest Projected Risk Neighborhoods (Next 24–48 Hours)
            </h3>
            <p className="text-xs text-slate-500">
              Areas projected to experience peak warmth based on urban canopy and daytime highs
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-[#1E60F2] border border-blue-100 self-start sm:self-auto">
            Ranked by Heat Index
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F5F8FC] text-slate-500 uppercase tracking-wider font-semibold border-y border-[#E5EDF5]">
              <tr>
                <th className="px-4 py-3">Neighborhood</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Predicted High</th>
                <th className="px-4 py-3">Density Factor</th>
                <th className="px-4 py-3">Forecast Risk</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {highRiskNeighbourhoods.map((n, idx) => (
                <tr key={n.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                    <span className="text-slate-400 text-xs w-4">{idx + 1}.</span>
                    <span>{n.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{n.city}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    <span className={n.predictedTemp >= 40 ? 'text-red-600' : 'text-slate-900'}>
                      {n.predictedTemp}°C
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{n.uhi}x</td>
                  <td className="px-4 py-3">
                    <RiskBadge category={n.predictedRisk >= 75 ? 'critical' : n.predictedRisk >= 50 ? 'high' : 'moderate'} score={n.predictedRisk} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedLocId(n.id)}
                      className="text-xs font-semibold text-[#1E60F2] hover:underline inline-flex items-center gap-1"
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

      {/* Model Verification Comparison Cards */}
      <div className="bg-white border border-[#E5EDF5] rounded-[20px] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Forecast Accuracy & Verification
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Comparing prior predictions with measured conditions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {comparisons.map((cmp) => (
            <div key={cmp.horizon} className="p-4 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Horizon: {cmp.horizon}</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200 text-[11px]">
                  {cmp.accuracy_label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Predicted Temp</span>
                  <span className="font-bold text-slate-800">{cmp.predicted_temp}°C</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Measured Temp</span>
                  <span className="font-bold text-slate-800">{cmp.actual_temp}°C</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Predicted Risk</span>
                  <span className="font-bold text-[#1E60F2]">{cmp.predicted_risk}/100</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Measured Risk</span>
                  <span className="font-bold text-[#1E60F2]">{cmp.actual_risk}/100</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PredictionsPage;
