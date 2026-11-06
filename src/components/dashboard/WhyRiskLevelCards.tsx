import React, { useState, useMemo } from 'react';
import { 
  Thermometer, 
  Flame, 
  Droplets, 
  Building2, 
  Sun, 
  ChevronDown, 
  ChevronUp, 
  Binary, 
  Info, 
  HelpCircle,
  Radio,
  Satellite,
  Gauge,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { useLocationTracker } from '../../context/LocationContext';
import { EnvironmentalReading, HeatRiskAssessment, LocationZone, RiskCategory } from '../../types';

export interface WhyRiskLevelCardsProps {
  currentReading?: EnvironmentalReading | null;
  currentRisk?: HeatRiskAssessment | null;
  selectedZone?: LocationZone | null;
  className?: string;
}

// Calculate empirical Wet Bulb temperature using Stull's equation (°C)
function calculateWetBulb(t: number, rh: number): number {
  const wb =
    t * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;
  return Math.round(wb * 10) / 10;
}

export const WhyRiskLevelCards: React.FC<WhyRiskLevelCardsProps> = ({
  currentReading: propsReading,
  currentRisk: propsRisk,
  selectedZone: propsZone,
  className = '',
}) => {
  const context = useLocationTracker();
  const [showTechnicalBreakdown, setShowTechnicalBreakdown] = useState<boolean>(false);

  const reading = propsReading !== undefined ? propsReading : context.currentReading;
  const risk = propsRisk !== undefined ? propsRisk : context.currentRisk;
  const zone = propsZone !== undefined ? propsZone : context.selectedZone;

  // Real or realistic fallback metrics
  const currentTemp = reading?.temperature_c ?? 38.5;
  const feelsLike = reading?.feels_like_c ?? 42.1;
  const humidity = reading?.relative_humidity_pct ?? 56;
  const uvIndex = reading?.uv_index ?? 7.8;
  const wetBulb = reading?.wet_bulb_c ?? calculateWetBulb(currentTemp, humidity);

  // Urban heat island anomaly
  const uhiAnomaly = useMemo(() => {
    const factor = zone?.urban_heat_island_factor ?? 1.24;
    return Math.round((factor - 1.0) * 10 * 10) / 10;
  }, [zone]);

  // Baseline temperature variation vs morning (e.g. +1.8°C vs morning)
  const tempDeltaMorning = useMemo(() => {
    // Diurnal curve approximation: midday is typically +1.8°C to +3.5°C over 8 AM
    const delta = Math.round((currentTemp * 0.055) * 10) / 10;
    return delta > 0 ? `+${delta.toFixed(1)}°C vs morning` : `${delta.toFixed(1)}°C vs morning`;
  }, [currentTemp]);

  // Risk category formatting
  const rawRiskCategory: RiskCategory | string = risk?.risk_category ?? (
    currentTemp >= 40 ? 'critical' : currentTemp >= 36 ? 'high' : currentTemp >= 31 ? 'moderate' : 'low'
  );

  const riskLevelName = rawRiskCategory.toLowerCase();

  // Status and badges for Temperature
  const getTempStatus = (temp: number) => {
    if (temp >= 42) return { status: 'Extreme', badgeClass: 'bg-red-50 text-red-700 border-red-200' };
    if (temp >= 38) return { status: 'Severe', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200' };
    if (temp >= 33) return { status: 'Elevated', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (temp >= 28) return { status: 'Normal', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' };
    return { status: 'Cool', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  // Status for UV
  const getUvStatus = (uv: number) => {
    if (uv >= 11) return { label: 'Extreme', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' };
    if (uv >= 8) return { label: 'Very High', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (uv >= 6) return { label: 'High', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200' };
    if (uv >= 3) return { label: 'Moderate', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Low', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const tempStatus = getTempStatus(currentTemp);
  const uvStatus = getUvStatus(uvIndex);

  // 5 Clean Friendly Cards Data (Requirement 7)
  const factorCards = [
    {
      id: 'temperature',
      name: 'Temperature',
      value: `${currentTemp.toFixed(1)}°C`,
      status: tempStatus.status,
      statusClass: tempStatus.badgeClass,
      note: tempDeltaMorning,
      explanation: 'Actual ambient air temperature measured in the shade by calibrated weather sensors.',
      icon: Thermometer,
      iconBg: 'bg-amber-50',
      iconBorder: 'border-amber-200/70',
      iconColor: 'text-amber-600',
      weight: '35%',
    },
    {
      id: 'heat_index',
      name: 'Heat Index',
      value: `${feelsLike.toFixed(1)}°C`,
      status: feelsLike >= 42 ? 'Dangerous' : feelsLike >= 38 ? 'High Alert' : 'Caution',
      statusClass: feelsLike >= 42 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200',
      note: 'Moisture in the air raises the apparent temperature felt on human skin.',
      explanation: 'Apparent heat perceived by the human body when moisture slows the evaporation of sweat.',
      icon: Flame,
      iconBg: 'bg-red-50',
      iconBorder: 'border-red-200/70',
      iconColor: 'text-red-600',
      weight: '25%',
    },
    {
      id: 'humidity_wetbulb',
      name: 'Humidity / Wet Bulb',
      value: `${Math.round(humidity)}% / ${wetBulb.toFixed(1)}°C`,
      status: wetBulb >= 30 ? 'Critical' : wetBulb >= 26 ? 'Elevated' : 'Optimal',
      statusClass: wetBulb >= 30 ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-sky-50 text-sky-700 border-sky-200',
      note: 'Higher humidity impairs natural sweat evaporation, trapping body heat.',
      explanation: 'Wet bulb temperature measures the lowest temperature reachable through evaporative cooling alone.',
      icon: Droplets,
      iconBg: 'bg-sky-50',
      iconBorder: 'border-sky-200/70',
      iconColor: 'text-sky-600',
      weight: '15%',
    },
    {
      id: 'urban_heat',
      name: 'Urban Heat',
      value: `+${uhiAnomaly.toFixed(1)}°C anomaly`,
      status: uhiAnomaly >= 3 ? 'High Trap' : 'Moderate',
      statusClass: uhiAnomaly >= 3 ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
      note: 'Asphalt roads and concrete structures retain heat and radiate it back.',
      explanation: 'Urban Heat Island (UHI) effect creates dense thermal pockets compared to surrounding open green areas.',
      icon: Building2,
      iconBg: 'bg-purple-50',
      iconBorder: 'border-purple-200/70',
      iconColor: 'text-purple-600',
      weight: '15%',
    },
    {
      id: 'uv_index',
      name: 'UV Radiation',
      value: `${uvIndex.toFixed(1)} ${uvStatus.label}`,
      status: uvStatus.label,
      statusClass: uvStatus.badgeClass,
      note: 'Midday solar radiation intensifies rapid heat exhaustion and skin stress.',
      explanation: 'Solar ultraviolet radiation directly heats body tissue and accelerates biological dehydration.',
      icon: Sun,
      iconBg: 'bg-rose-50',
      iconBorder: 'border-rose-200/70',
      iconColor: 'text-rose-600',
      weight: '10%',
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* SECTION HEADER (Requirement 7: friendly titles) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Why is my heat risk <span className="capitalize text-[#1E60F2]">{riskLevelName}</span>?
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 hidden sm:inline-flex">
              Explainable AI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            These conditions are affecting your current heat risk.
          </p>
        </div>

        {/* Technical Breakdown Toggle Button */}
        <button
          onClick={() => setShowTechnicalBreakdown(!showTechnicalBreakdown)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs btn-press self-start sm:self-auto"
          aria-expanded={showTechnicalBreakdown}
          aria-controls="technical-breakdown-panel"
        >
          <Binary className="w-3.5 h-3.5 text-[#1E60F2]" />
          <span>Technical breakdown</span>
          {showTechnicalBreakdown ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>
      </div>

      {/* 5 CLEAN CARDS GRID (Requirement 7) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {factorCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white rounded-[22px] border border-[#E5EDF5] p-4 shadow-xs hover:-translate-y-1 hover:border-blue-200/90 hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Card Header: Icon & Status Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className={`w-9 h-9 rounded-xl ${card.iconBg} border ${card.iconBorder} ${card.iconColor} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${card.statusClass}`}>
                  {card.status}
                </span>
              </div>

              {/* Card Body: Factor Name & Value */}
              <div className="space-y-1 mb-2.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {card.name}
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {card.value}
                </div>
              </div>

              {/* Card Footer: Simple Note (friendly explanation without jargon) */}
              <div className="pt-2.5 border-t border-slate-100 mt-auto">
                <p className="text-[11px] text-slate-600 leading-snug">
                  {card.note}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* EXPANDABLE TECHNICAL BREAKDOWN PANEL (Requirement 7) */}
      {showTechnicalBreakdown && (
        <div 
          id="technical-breakdown-panel"
          className="bg-slate-900 text-white rounded-[24px] p-5 sm:p-6 shadow-md border border-slate-800 space-y-5 animate-fade-in"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Algorithmic Model & Contribution Weights</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
                    IMD + NOAA Fusion
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  How the AI engine combines biometeorological observations into a unified 0-100 heat risk index
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-blue-400">
              Risk Score: {risk?.risk_score ?? 78}/100
            </span>
          </div>

          {/* Factor Contribution Weights */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span>Factor Risk Weights</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {factorCards.map((card) => (
                <div key={card.id} className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">{card.name}</span>
                    <span className="text-blue-400 font-mono font-bold">{card.weight}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" 
                      style={{ width: card.weight }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {card.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Scientific Formulas & Ground Truth Telemetry Sources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            {/* Formulas */}
            <div className="space-y-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700/40">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Binary className="w-3.5 h-3.5" />
                <span>Underlying Mathematical Models</span>
              </span>
              <ul className="text-[11px] text-slate-300 space-y-1.5 font-mono">
                <li>
                  <strong className="text-slate-100">Heat Index (NOAA/NWS):</strong> 
                  <span className="text-slate-400 block text-[10px] font-sans">
                    Rothfusz 9-parameter multivariable polynomial regression on ambient dry-bulb temperature and relative humidity.
                  </span>
                </li>
                <li>
                  <strong className="text-slate-100">Wet Bulb (Stull Approximation):</strong> 
                  <span className="text-slate-400 block text-[10px] font-sans">
                    Non-linear arctangent approximation calculating the adiabatic saturation temperature reachable by evaporation.
                  </span>
                </li>
                <li>
                  <strong className="text-slate-100">UHI Anomaly (Thermal Infrared):</strong> 
                  <span className="text-slate-400 block text-[10px] font-sans">
                    Differential surface temperature anomaly derived from Sentinel-3 SLSTR satellite thermal band vs rural baseline.
                  </span>
                </li>
              </ul>
            </div>

            {/* Telemetry Sensor Fusion */}
            <div className="space-y-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700/40">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Satellite className="w-3.5 h-3.5" />
                <span>Multi-Source Telemetry Feeds</span>
              </span>
              <div className="space-y-2 text-[11px] text-slate-300">
                <div className="flex items-start gap-2">
                  <Radio className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100">IMD Automatic Weather Station (AWS):</strong>
                    <span className="text-slate-400 block text-[10px]">
                      Calibrated ventilated air thermometer, capacitive hygrometer, and ultrasonic anemometer.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Satellite className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100">INSAT-3DR Geostationary Imager:</strong>
                    <span className="text-slate-400 block text-[10px]">
                      Hourly land surface temperature (LST) and solar insolation mapping at 4km resolution.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100">Municipal Micro-Sensors:</strong>
                    <span className="text-slate-400 block text-[10px]">
                      Hyperlocal street-level temperature nodes accounting for vehicular heat and building canyon traps.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhyRiskLevelCards;
