import React, { useState, useMemo } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  RotateCcw,
  Sun,
  Flame,
  Wind,
  Footprints,
  Briefcase,
  Sparkles,
  Zap
} from 'lucide-react';
import { CountUp } from '../components/common/CountUp';

export type ActivityLevel = 'resting' | 'walking' | 'rigorous_work';

interface ActivityOption {
  id: ActivityLevel;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  riskOffset: number;
}

const ACTIVITIES: ActivityOption[] = [
  {
    id: 'resting',
    icon: '🪑',
    title: 'Resting',
    subtitle: 'Low metabolic rate',
    description: 'Indoor rest, sitting in shade or fan/AC room, light desk tasks',
    riskOffset: 0
  },
  {
    id: 'walking',
    icon: '🚶',
    title: 'Walking',
    subtitle: 'Moderate metabolic exertion',
    description: 'Casual neighborhood errands, dog walking, leisurely commuting',
    riskOffset: 8
  },
  {
    id: 'rigorous_work',
    icon: '⚒️',
    title: 'Rigorous Work',
    subtitle: 'High cardiovascular strain',
    description: 'Outdoor manual labor, construction, jogging, athletic sports',
    riskOffset: 18
  }
];

interface QuickPreset {
  label: string;
  temp: number;
  humidity: number;
  activity: ActivityLevel;
}

const PRESETS: QuickPreset[] = [
  { label: 'Mild Spring', temp: 26, humidity: 42, activity: 'resting' },
  { label: 'Warm Afternoon', temp: 33, humidity: 55, activity: 'walking' },
  { label: 'Humid Monsoon', temp: 34, humidity: 82, activity: 'walking' },
  { label: 'Peak Heatwave', temp: 43, humidity: 48, activity: 'rigorous_work' }
];

export const HeatSimulatorPage: React.FC = () => {
  // Step 1: Ambient Temperature (25°C to 45°C slider, default 34°C)
  const [temperature, setTemperature] = useState<number>(34);

  // Step 2: Relative Humidity (30% to 90% slider, default 55%)
  const [humidity, setHumidity] = useState<number>(55);

  // Step 3: Activity type (Resting, Walking, Rigorous Work, default 'walking')
  const [activity, setActivity] = useState<ActivityLevel>('walking');

  // Collapsible Advanced Thermal Physics toggle
  const [showAdvancedPhysics, setShowAdvancedPhysics] = useState<boolean>(false);

  // 1. NOAA Rothfusz Heat Index Regression Calculation
  const heatIndex = useMemo(() => {
    const T = temperature;
    const RH = humidity;
    const T_F = (T * 9) / 5 + 32;

    let HI_F =
      -42.379 +
      2.04901523 * T_F +
      10.14333127 * RH -
      0.22475541 * T_F * RH -
      0.00683783 * T_F * T_F -
      0.05481717 * RH * RH +
      0.00122874 * T_F * T_F * RH +
      0.00085282 * T_F * RH * RH -
      0.00000199 * T_F * T_F * RH * RH;

    // Adjust for lower temperatures
    if (T_F < 80) {
      HI_F = 0.5 * (T_F + 61.0 + (T_F - 68.0) * 1.2 + RH * 0.094);
    }

    const HI_C = ((HI_F - 32) * 5) / 9;
    return Math.round(HI_C * 10) / 10;
  }, [temperature, humidity]);

  // 2. Stull Psychrometric Formula for Wet-Bulb Temperature (Tw)
  const wetBulb = useMemo(() => {
    const T = temperature;
    const RH = humidity;
    const tw =
      T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
      Math.atan(T + RH) -
      Math.atan(RH - 1.676331) +
      0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
      4.686035;
    return Math.round(tw * 10) / 10;
  }, [temperature, humidity]);

  // Evaporative sweat cooling efficiency estimation
  const evaporativeEfficiency = useMemo(() => {
    // Relative sweat evaporation diminishes as humidity increases above 40%
    const eff = Math.max(12, Math.round(100 - (humidity - 30) * 1.25));
    return Math.min(100, eff);
  }, [humidity]);

  // 3. Dynamic Animated Risk Score (0 to 100) and 4-tier Color-Coded Risk Meter
  // Categories: Safe green (0-29), Caution yellow (30-54), High orange (55-79), Extreme red (80-100)
  const riskAnalysis = useMemo(() => {
    const selectedAct = ACTIVITIES.find(a => a.id === activity) || ACTIVITIES[1];

    // Thermal strain baseline derived from apparent heat index
    // HI 25C -> raw ~ 15
    // HI 32C -> raw ~ 38
    // HI 38C -> raw ~ 62
    // HI 46C+ -> raw ~ 85+
    let rawStrain = Math.round(((heatIndex - 23) / 27) * 75);
    rawStrain = Math.max(5, Math.min(84, rawStrain));

    // Combine with activity metabolic strain
    const finalScore = Math.min(100, Math.max(5, rawStrain + selectedAct.riskOffset));

    if (finalScore >= 80) {
      return {
        score: finalScore,
        category: 'Extreme' as const,
        theme: 'red',
        headline: 'Extreme Hazard — Stay Indoors & Cool Down',
        badgeBg: 'bg-red-50 text-red-700 border-red-200 ring-red-100',
        meterColor: 'bg-red-500',
        accentColor: '#EF4444',
        explanation: `Extreme heat stress danger. Wet-bulb reaches ${wetBulb}°C and apparent temperature feels like ${heatIndex}°C. High humidity (${humidity}%) restricts sweat evaporation to ~${evaporativeEfficiency}%, leading to dangerously fast core body overheating.`,
        guidance: 'Stop all outdoor exertion immediately. Remain in air-conditioned rooms or visit the nearest verified cooling shelter. Sip cool water with electrolytes every 15 minutes. Seek medical care if anyone feels confused or stops sweating.',
        recommendationShort: 'Emergency heat precautions required'
      };
    } else if (finalScore >= 55) {
      return {
        score: finalScore,
        category: 'High' as const,
        theme: 'orange',
        headline: 'Caution Advised — Reduce Continuous Exertion',
        badgeBg: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-100',
        meterColor: 'bg-orange-500',
        accentColor: '#F97316',
        explanation: `Substantial thermal strain. Combined ${temperature}°C air temperature and ${humidity}% humidity feel like ${heatIndex}°C. Physical activity (${selectedAct.title.toLowerCase()}) rapidly elevates heart rate and dehydration rate.`,
        guidance: 'Drink 250ml water every 20-30 minutes. Take mandatory 15-minute breaks in deep shade every 45 minutes of activity. Reschedule intense outdoor work to early morning or late evening.',
        recommendationShort: 'Limit sun exposure and hydrate regularly'
      };
    } else if (finalScore >= 30) {
      return {
        score: finalScore,
        category: 'Caution' as const,
        theme: 'yellow',
        headline: 'Take It Easy — Plan Around the Heat',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-100',
        meterColor: 'bg-amber-400',
        accentColor: '#F59E0B',
        explanation: `Warm ambient conditions feeling like ${heatIndex}°C. While manageable for healthy adults at rest, prolonged ${selectedAct.title.toLowerCase()} will slowly drain electrolytes and cause mild heat fatigue.`,
        guidance: 'Keep a water bottle on hand and drink water every 45 minutes. Wear lightweight cotton clothes, wear sunglasses outdoors, and pace yourself during sustained movement.',
        recommendationShort: 'Stay hydrated and take shade pauses'
      };
    } else {
      return {
        score: finalScore,
        category: 'Safe' as const,
        theme: 'green',
        headline: 'Comfortable Conditions — Normal Routine Safe',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
        meterColor: 'bg-emerald-500',
        accentColor: '#10B981',
        explanation: `Comfortable thermal comfort. Sensible temperature is ${heatIndex}°C with optimal evaporative cooling (~${evaporativeEfficiency}% efficiency). Minimal physical risk across daily resident routines.`,
        guidance: 'Enjoy regular outdoor routines and walking. Maintain standard baseline hydration of 2 to 2.5 litres daily.',
        recommendationShort: 'Standard hydration and daily activities safe'
      };
    }
  }, [heatIndex, wetBulb, evaporativeEfficiency, activity, temperature, humidity]);

  const handleReset = () => {
    setTemperature(34);
    setHumidity(55);
    setActivity('walking');
  };

  const applyPreset = (preset: QuickPreset) => {
    setTemperature(preset.temp);
    setHumidity(preset.humidity);
    setActivity(preset.activity);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/90 text-[#1E60F2] text-xs font-bold tracking-wide shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-[#1E60F2]" />
            <span>Resident Thermal Assessment Tool</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            How Will the Heat Feel?
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            A simple 3-step resident simulator to see how changes in ambient temperature, humidity, and physical activity impact your real-feel thermal risk.
          </p>
        </div>

        {/* Quick Weather Presets */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-end">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#1E60F2]" />
            Presets:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-[#1E60F2] hover:text-[#1E60F2] shadow-2xs hover:shadow-xs transition-all active:scale-95"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-Step Resident Tool & Live Risk Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 3 Clean Interactive Steps (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* STEP 1: AMBIENT TEMPERATURE SLIDER (25°C to 45°C) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5EDF5] shadow-card space-y-4 hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-black text-sm shadow-2xs">
                  1
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#0F172A]">Ambient Temperature</h2>
                    <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      Step 1
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Outdoor shade thermometer reading</p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
                    {temperature}
                  </span>
                  <span className="text-lg font-bold text-slate-500">°C</span>
                </div>
                <span className="block text-xs font-medium text-slate-400">
                  {Math.round((temperature * 9) / 5 + 32)}°F
                </span>
              </div>
            </div>

            {/* Slider Control */}
            <div className="space-y-3 pt-2">
              <div className="relative flex items-center">
                <input
                  type="range"
                  min="25"
                  max="45"
                  step="0.5"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  aria-label="Ambient Temperature"
                  className="w-full h-3 bg-gradient-to-r from-emerald-200 via-amber-200 via-orange-300 to-red-400 rounded-lg appearance-none cursor-pointer accent-[#1E60F2] focus:outline-none"
                />
              </div>

              <div className="flex justify-between text-xs font-semibold text-slate-400 px-0.5">
                <span className={temperature <= 28 ? 'text-emerald-600 font-bold' : ''}>25°C (Mild)</span>
                <span className={temperature > 28 && temperature <= 35 ? 'text-amber-600 font-bold' : ''}>35°C (Warm)</span>
                <span className={temperature > 35 && temperature <= 40 ? 'text-orange-600 font-bold' : ''}>40°C (Hot)</span>
                <span className={temperature > 40 ? 'text-red-600 font-bold' : ''}>45°C (Extreme)</span>
              </div>
            </div>
          </div>

          {/* STEP 2: RELATIVE HUMIDITY SLIDER (30% to 90%) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5EDF5] shadow-card space-y-4 hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-[#1E60F2] flex items-center justify-center font-black text-sm shadow-2xs">
                  2
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#0F172A]">Relative Humidity</h2>
                    <span className="text-[11px] font-semibold text-[#1E60F2] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      Step 2
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Moisture in air (slows down natural sweat cooling)</p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-[#1E60F2] tracking-tight">
                    {humidity}
                  </span>
                  <span className="text-lg font-bold text-[#1E60F2]/70">%</span>
                </div>
                <span className="block text-xs font-medium text-slate-400">
                  {humidity >= 75 ? 'Oppressive moisture' : humidity <= 40 ? 'Dry air' : 'Typical moderate'}
                </span>
              </div>
            </div>

            {/* Slider Control */}
            <div className="space-y-3 pt-2">
              <div className="relative flex items-center">
                <input
                  type="range"
                  min="30"
                  max="90"
                  step="1"
                  value={humidity}
                  onChange={(e) => setHumidity(parseInt(e.target.value, 10))}
                  aria-label="Relative Humidity"
                  className="w-full h-3 bg-gradient-to-r from-blue-100 via-blue-300 to-indigo-400 rounded-lg appearance-none cursor-pointer accent-[#1E60F2] focus:outline-none"
                />
              </div>

              <div className="flex justify-between text-xs font-semibold text-slate-400 px-0.5">
                <span className={humidity <= 40 ? 'text-blue-600 font-bold' : ''}>30% (Dry)</span>
                <span className={humidity > 40 && humidity <= 65 ? 'text-blue-600 font-bold' : ''}>60% (Moderate)</span>
                <span className={humidity > 65 ? 'text-indigo-600 font-bold' : ''}>90% (Very Humid)</span>
              </div>
            </div>
          </div>

          {/* STEP 3: ACTIVITY TYPE SELECTOR (Resting, Walking, Rigorous Work) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5EDF5] shadow-card space-y-4 hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm shadow-2xs">
                  3
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#0F172A]">Physical Activity</h2>
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      Step 3
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Internal heat metabolic generation level</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#1E60F2] transition-colors px-2.5 py-1 rounded-lg hover:bg-blue-50"
                title="Reset simulation parameters to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* 3 Activity Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {ACTIVITIES.map((act) => {
                const isSelected = activity === act.id;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setActivity(act.id)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#1E60F2] bg-blue-50/70 ring-2 ring-blue-500/20 shadow-sm translate-y-[-1px]'
                        : 'border-slate-200/90 bg-white hover:bg-slate-50/90 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl p-1 bg-white rounded-xl shadow-2xs border border-slate-100">
                          {act.icon}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#1E60F2] text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <h3 className={`text-sm font-bold ${isSelected ? 'text-[#1E60F2]' : 'text-[#0F172A]'}`}>
                        {act.title}
                      </h3>
                      <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
                        {act.subtitle}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug pt-1 border-t border-slate-100">
                      {act.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Animated Risk Score & Guidance (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Risk Outcome Card */}
          <div
            className={`rounded-3xl p-6 sm:p-7 border shadow-card transition-all duration-300 ${
              riskAnalysis.category === 'Extreme'
                ? 'bg-gradient-to-b from-red-50/90 to-white border-red-200 ring-2 ring-red-100'
                : riskAnalysis.category === 'High'
                ? 'bg-gradient-to-b from-orange-50/90 to-white border-orange-200 ring-2 ring-orange-100'
                : riskAnalysis.category === 'Caution'
                ? 'bg-gradient-to-b from-amber-50/90 to-white border-amber-200 ring-2 ring-amber-100'
                : 'bg-gradient-to-b from-emerald-50/90 to-white border-emerald-200 ring-2 ring-emerald-100'
            }`}
          >
            {/* Top Score & Category Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-black/5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Estimated Heat Risk
                </span>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-5xl sm:text-6xl font-black tracking-tight ${
                      riskAnalysis.category === 'Extreme'
                        ? 'text-red-600'
                        : riskAnalysis.category === 'High'
                        ? 'text-orange-600'
                        : riskAnalysis.category === 'Caution'
                        ? 'text-amber-700'
                        : 'text-emerald-600'
                    }`}
                  >
                    <CountUp value={riskAnalysis.score} durationMs={400} />
                  </span>
                  <span className="text-lg font-bold text-slate-400">/ 100</span>
                </div>
              </div>

              <div className="text-right space-y-1.5">
                <span
                  className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide border shadow-2xs ${riskAnalysis.badgeBg}`}
                >
                  {riskAnalysis.category} Risk
                </span>
                <div className="text-xs text-slate-600 font-medium">
                  Feels like ~<strong className="text-slate-900 text-sm font-bold">{heatIndex}°C</strong>
                </div>
              </div>
            </div>

            {/* Color-Coded 4-Zone Risk Meter (Safe green, Caution yellow, High orange, Extreme red) */}
            <div className="space-y-2 py-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Color-Coded Risk Scale</span>
                <span
                  className={
                    riskAnalysis.category === 'Extreme'
                      ? 'text-red-600'
                      : riskAnalysis.category === 'High'
                      ? 'text-orange-600'
                      : riskAnalysis.category === 'Caution'
                      ? 'text-amber-700'
                      : 'text-emerald-600'
                  }
                >
                  {riskAnalysis.recommendationShort}
                </span>
              </div>

              {/* Multi-segment Meter Track */}
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80 relative">
                <div
                  className={`h-full rounded-full transition-all duration-300 shadow-xs ${riskAnalysis.meterColor}`}
                  style={{ width: `${riskAnalysis.score}%` }}
                />
              </div>

              {/* 4 Tier Labels */}
              <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-bold pt-1">
                <span className="px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Safe (0-29)
                </span>
                <span className="px-1 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-100">
                  Caution (30-54)
                </span>
                <span className="px-1 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100">
                  High (55-79)
                </span>
                <span className="px-1 py-0.5 rounded bg-red-50 text-red-700 border border-red-100">
                  Extreme (80+)
                </span>
              </div>
            </div>

            {/* Plain-Language Guidance Callout */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    riskAnalysis.category === 'Extreme'
                      ? 'bg-red-100 text-red-600'
                      : riskAnalysis.category === 'High'
                      ? 'bg-orange-100 text-orange-600'
                      : riskAnalysis.category === 'Caution'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Plain-Language Guidance
                  </h3>
                  <p className="text-sm font-extrabold text-[#0F172A] tracking-tight">
                    "{riskAnalysis.headline}"
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
                <p>
                  <strong className="text-slate-800">Conditions Assessment:</strong> {riskAnalysis.explanation}
                </p>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-slate-800 font-medium">
                  <strong className="text-[#1E60F2] block mb-0.5">Recommended Action:</strong>
                  {riskAnalysis.guidance}
                </p>
              </div>
            </div>

            {/* Ambient Conditions Mini Matrix */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200/70">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Air Temp</span>
                <span className="text-sm font-black text-slate-800">{temperature}°C</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200/70">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Humidity</span>
                <span className="text-sm font-black text-[#1E60F2]">{humidity}%</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200/70">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Apparent</span>
                <span className="text-sm font-black text-slate-800">{heatIndex}°C</span>
              </div>
            </div>
          </div>

          {/* Collapsible "Advanced Thermal Physics" Section */}
          <div className="bg-white rounded-3xl border border-[#E5EDF5] shadow-card overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvancedPhysics(!showAdvancedPhysics)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
              aria-expanded={showAdvancedPhysics}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-bold text-[#0F172A] block">
                    Advanced Thermal Physics & Models
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Rothfusz Heat Index & Stull Wet-Bulb Psychrometric Calculation
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E60F2] bg-blue-50/70 px-2.5 py-1 rounded-xl">
                <span>{showAdvancedPhysics ? 'Collapse' : 'Expand Physics'}</span>
                {showAdvancedPhysics ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {showAdvancedPhysics && (
              <div className="px-6 pb-6 pt-3 border-t border-slate-100 space-y-4 text-xs text-slate-600 bg-slate-50/40 animate-fade-in">
                {/* 2 Main Physics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Rothfusz Heat Index */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        NOAA Heat Index
                      </span>
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        Rothfusz Formula
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      {heatIndex}°C
                      <span className="text-xs font-medium text-slate-400 ml-1.5">
                        ({Math.round((heatIndex * 9) / 5 + 32)}°F)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Multivariate polynomial calculating apparent temperature by factoring atmospheric vapor pressure on human skin cooling.
                    </p>
                  </div>

                  {/* Stull Wet-Bulb */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Est. Wet-Bulb Temp
                      </span>
                      <span className="text-xs font-bold text-[#1E60F2] bg-blue-50 px-2 py-0.5 rounded-full">
                        Stull Psychrometric
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      {wetBulb}°C
                      <span className="text-xs font-medium text-slate-400 ml-1.5">
                        (Tw threshold)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      The lowest temperature reachable by evaporative cooling alone. A wet-bulb above 30°C severely impedes human thermoregulation.
                    </p>
                  </div>
                </div>

                {/* Evaporative Efficiency & Physiological Limits */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">
                      Evaporative Sweat Efficiency: ~{evaporativeEfficiency}%
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Baseline: 100% at ≤30% RH
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1E60F2] rounded-full transition-all duration-300"
                      style={{ width: `${evaporativeEfficiency}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                    <strong>Physiological principle:</strong> Sweat does not cool the human body by mere secretion; cooling happens exclusively through phase change evaporation. When relative humidity reaches {humidity}%, the vapor gradient between skin and surrounding air narrows, trapping metabolic heat inside vital organs.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatSimulatorPage;
