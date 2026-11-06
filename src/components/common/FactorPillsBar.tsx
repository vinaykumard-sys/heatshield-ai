import React, { useState } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Flame, 
  Sun, 
  Building2, 
  Info, 
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  TrendingUp,
  Activity
} from 'lucide-react';

export interface FactorPillItem {
  id: string;
  name: string;
  shortLabel: string;
  value: string | number;
  unit?: string;
  status: 'safe' | 'moderate' | 'elevated' | 'high' | 'critical';
  statusLabel: string;
  benchmark?: string;
  explanation: string;
  icon: React.ReactNode;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
}

export interface FactorPillsBarProps {
  /**
   * Ambient Temperature in Celsius (e.g. 38)
   */
  ambientTemp?: number;
  /**
   * Humidity-adjusted Heat Index in Celsius (e.g. 42)
   */
  heatIndex?: number;
  /**
   * Wet Bulb Temperature in Celsius (e.g. 29.5)
   */
  wetBulbTemp?: number;
  /**
   * Urban Heat Island effect differential in Celsius (e.g. 3.6)
   */
  urbanHeatIsland?: number;
  /**
   * Solar UV Index rating (e.g. 8.2)
   */
  uvIndex?: number;
  /**
   * Optional custom title above bar
   */
  title?: string;
  /**
   * Callback when user selects a factor pill
   */
  onSelectFactor?: (factorId: string) => void;
  /**
   * Additional container CSS classes
   */
  className?: string;
  /**
   * Show interactive AI explainability tooltip/modal
   */
  showExplanation?: boolean;
}

export const FactorPillsBar: React.FC<FactorPillsBarProps> = ({
  ambientTemp = 38.2,
  heatIndex = 42.4,
  wetBulbTemp = 29.5,
  urbanHeatIsland = 3.6,
  uvIndex = 8.2,
  title = 'Explainable AI Heat Factors',
  onSelectFactor,
  className = '',
  showExplanation = true,
}) => {
  const [activeFactorId, setActiveFactorId] = useState<string | null>(null);

  // Status mapping for Ambient Temperature (Celsius)
  const getAmbientStatus = (val: number): { status: FactorPillItem['status']; label: string } => {
    if (val >= 43) return { status: 'critical', label: 'Extreme' };
    if (val >= 39) return { status: 'high', label: 'Severe' };
    if (val >= 35) return { status: 'elevated', label: 'High' };
    if (val >= 30) return { status: 'moderate', label: 'Warm' };
    return { status: 'safe', label: 'Normal' };
  };

  // Status mapping for Heat Index (Celsius)
  const getHeatIndexStatus = (val: number): { status: FactorPillItem['status']; label: string } => {
    if (val >= 46) return { status: 'critical', label: 'Danger' };
    if (val >= 40) return { status: 'high', label: 'High Alert' };
    if (val >= 35) return { status: 'elevated', label: 'Caution' };
    return { status: 'safe', label: 'Comfort' };
  };

  // Status mapping for Wet Bulb Temperature (Celsius) - Critical human limit is ~35°C, 28°C+ dangerous for workers
  const getWetBulbStatus = (val: number): { status: FactorPillItem['status']; label: string } => {
    if (val >= 31) return { status: 'critical', label: 'Emergency' };
    if (val >= 29) return { status: 'high', label: 'Critical' };
    if (val >= 26) return { status: 'elevated', label: 'Elevated' };
    return { status: 'safe', label: 'Safe' };
  };

  // Status mapping for Urban Heat Island (differential in °C)
  const getUhiStatus = (val: number): { status: FactorPillItem['status']; label: string } => {
    if (val >= 4.0) return { status: 'critical', label: 'Severe Trap' };
    if (val >= 3.0) return { status: 'high', label: 'Heavy Island' };
    if (val >= 1.5) return { status: 'moderate', label: 'Moderate' };
    return { status: 'safe', label: 'Mild' };
  };

  // Status mapping for UV Index
  const getUvStatus = (val: number): { status: FactorPillItem['status']; label: string } => {
    if (val >= 11) return { status: 'critical', label: 'Extreme' };
    if (val >= 8) return { status: 'high', label: 'Very High' };
    if (val >= 6) return { status: 'elevated', label: 'High' };
    if (val >= 3) return { status: 'moderate', label: 'Moderate' };
    return { status: 'safe', label: 'Low' };
  };

  // Theme styling per status
  const getTheme = (status: FactorPillItem['status']) => {
    switch (status) {
      case 'critical':
        return {
          bgClass: 'bg-rose-50/90 hover:bg-rose-100/90',
          borderClass: 'border-rose-200/90',
          textClass: 'text-rose-700',
          badgeClass: 'bg-rose-100 text-rose-700 border-rose-200',
        };
      case 'high':
        return {
          bgClass: 'bg-orange-50/90 hover:bg-orange-100/90',
          borderClass: 'border-orange-200/90',
          textClass: 'text-orange-700',
          badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
        };
      case 'elevated':
        return {
          bgClass: 'bg-amber-50/90 hover:bg-amber-100/90',
          borderClass: 'border-amber-200/90',
          textClass: 'text-amber-700',
          badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
        };
      case 'moderate':
        return {
          bgClass: 'bg-blue-50/90 hover:bg-blue-100/90',
          borderClass: 'border-blue-200/90',
          textClass: 'text-blue-700',
          badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
        };
      case 'safe':
      default:
        return {
          bgClass: 'bg-emerald-50/90 hover:bg-emerald-100/90',
          borderClass: 'border-emerald-200/90',
          textClass: 'text-emerald-700',
          badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        };
    }
  };

  const amb = getAmbientStatus(ambientTemp);
  const ambTheme = getTheme(amb.status);

  const hi = getHeatIndexStatus(heatIndex);
  const hiTheme = getTheme(hi.status);

  const wb = getWetBulbStatus(wetBulbTemp);
  const wbTheme = getTheme(wb.status);

  const uhi = getUhiStatus(urbanHeatIsland);
  const uhiTheme = getTheme(uhi.status);

  const uv = getUvStatus(uvIndex);
  const uvTheme = getTheme(uv.status);

  const factorItems: FactorPillItem[] = [
    {
      id: 'ambient',
      name: 'Ambient Temperature',
      shortLabel: 'Ambient Temp',
      value: `${ambientTemp.toFixed(1)}°C`,
      status: amb.status,
      statusLabel: amb.label,
      benchmark: 'Baseline: 34°C',
      explanation: 'Dry bulb atmospheric air temperature recorded by IMD and satellite stations.',
      icon: <Thermometer className="w-4 h-4" />,
      ...ambTheme,
    },
    {
      id: 'heat_index',
      name: 'Humidity Heat Index',
      shortLabel: 'Heat Index',
      value: `${heatIndex.toFixed(1)}°C`,
      status: hi.status,
      statusLabel: hi.label,
      benchmark: 'Threshold: 40°C',
      explanation: 'Perceived "feels like" thermal load combining relative humidity with ambient heat.',
      icon: <Droplets className="w-4 h-4" />,
      ...hiTheme,
    },
    {
      id: 'wet_bulb',
      name: 'Wet Bulb Temperature',
      shortLabel: 'Wet Bulb',
      value: `${wetBulbTemp.toFixed(1)}°C`,
      status: wb.status,
      statusLabel: wb.label,
      benchmark: 'Limit: 30°C',
      explanation: 'Critical physiological threshold at which human sweating ceases to cool the body effectively.',
      icon: <Activity className="w-4 h-4" />,
      ...wbTheme,
    },
    {
      id: 'uhi',
      name: 'Urban Heat Island',
      shortLabel: 'Urban Island',
      value: `+${urbanHeatIsland.toFixed(1)}°C`,
      status: uhi.status,
      statusLabel: uhi.label,
      benchmark: 'Density Trap',
      explanation: 'Excess microclimate heat retained by concrete, asphalt, and tin roof density compared to rural areas.',
      icon: <Building2 className="w-4 h-4" />,
      ...uhiTheme,
    },
    {
      id: 'uv',
      name: 'Solar UV Radiation',
      shortLabel: 'Solar UV Index',
      value: `${uvIndex.toFixed(1)}`,
      status: uv.status,
      statusLabel: uv.label,
      benchmark: 'UV Scale (1-12)',
      explanation: 'Solar irradiance strength; values > 8.0 require immediate eye, skin, and hydration protection.',
      icon: <Sun className="w-4 h-4" />,
      ...uvTheme,
    },
  ];

  const handlePillClick = (item: FactorPillItem) => {
    setActiveFactorId(activeFactorId === item.id ? null : item.id);
    if (onSelectFactor) onSelectFactor(item.id);
  };

  const activeItem = factorItems.find((f) => f.id === activeFactorId);

  return (
    <div className={`w-full bg-white rounded-card-lg border border-app-border p-5 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
            <Flame className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">{title}</span>
        </div>
        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          5 Key Telemetry Vectors
        </span>
      </div>

      {/* Multi-Pill Bar (Inspired directly by Reference Image 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {factorItems.map((item) => {
          const isSelected = activeFactorId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handlePillClick(item)}
              className={`flex flex-col items-center justify-between p-3 rounded-2xl border transition-all duration-200 text-center relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-brand/40 ${
                item.bgClass
              } ${item.borderClass} ${
                isSelected ? 'ring-2 ring-brand ring-offset-1 shadow-md scale-[1.02]' : 'hover:scale-[1.01]'
              }`}
            >
              {/* Top Row: Icon + Status Tag */}
              <div className="w-full flex items-center justify-between mb-1.5">
                <span className={`${item.textClass} opacity-80 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${item.badgeClass}`}>
                  {item.statusLabel}
                </span>
              </div>

              {/* Main Metric Value (Bold and Prominent) */}
              <div className={`text-xl font-extrabold tracking-tight font-mono ${item.textClass} my-0.5`}>
                {item.value}
              </div>

              {/* Bottom Factor Label */}
              <div className="text-[11px] font-semibold text-slate-700 tracking-tight leading-tight mt-1">
                {item.shortLabel}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Factor AI Explanation Drawer */}
      {showExplanation && activeItem && (
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 animate-fadeIn flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs text-brand shrink-0 mt-0.5">
            {activeItem.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">{activeItem.name} ({activeItem.value})</span>
              <span className="text-[10px] text-slate-500 font-mono">{activeItem.benchmark}</span>
            </div>
            <p className="mt-1 text-slate-600 leading-relaxed text-[11px]">
              {activeItem.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
