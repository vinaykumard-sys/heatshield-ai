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
  Briefcase
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

type ActivityLevel = 'resting' | 'walking' | 'active' | 'heavy_work';

interface ActivityOption {
  id: ActivityLevel;
  icon: string;
  title: string;
  description: string;
  riskOffset: number;
}

const ACTIVITIES: ActivityOption[] = [
  {
    id: 'resting',
    icon: '🪑',
    title: 'Resting',
    description: 'Indoor sitting, shade rest, light office work',
    riskOffset: 0
  },
  {
    id: 'walking',
    icon: '🚶',
    title: 'Walking',
    description: 'Casual errands, light walking, gentle commuting',
    riskOffset: 4
  },
  {
    id: 'active',
    icon: '🏃',
    title: 'Active',
    description: 'Jogging, cycling, vigorous sports & workouts',
    riskOffset: 10
  },
  {
    id: 'heavy_work',
    icon: '☀️',
    title: 'Heavy outdoor work',
    description: 'Construction, delivery, loading, street vending',
    riskOffset: 16
  }
];

export const HeatSimulatorPage: React.FC = () => {
  // Step 1: Temperature slider (25°C to 40°C, default ~34°C)
  const [temperature, setTemperature] = useState<number>(34);

  // Step 2: Humidity slider (30% to 90%, default ~60%)
  const [humidity, setHumidity] = useState<number>(60);

  // Step 3: Activity choices
  const [activity, setActivity] = useState<ActivityLevel>('walking');

  // Advanced details expandable toggle
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Scientific Heat Index Calculation (NOAA Rothfusz regression equation)
  const heatIndex = useMemo(() => {
    const T = temperature;
    const RH = humidity;
    // Standard Rothfusz equation in Celsius
    // Converts to F for standard NOAA polynomial then back to C
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

    // Simple adjustment for lower temperatures where formula is gentle
    if (T_F < 80) {
      HI_F = 0.5 * (T_F + 61.0 + ((T_F - 68.0) * 1.2) + (RH * 0.094));
    }

    const HI_C = ((HI_F - 32) * 5) / 9;
    return Math.round(HI_C * 10) / 10;
  }, [temperature, humidity]);

  // Risk Score calculation (0 to 100) combining Heat Index and Activity Level
  const { riskScore, category, colorClass, borderClass, bgLightClass, explanation, action } = useMemo(() => {
    const selectedAct = ACTIVITIES.find(a => a.id === activity) || ACTIVITIES[1];
    
    // Base risk normalized to Heat Index
    // HI 25C -> score 20
    // HI 32C -> score 50
    // HI 38C -> score 75
    // HI 45C+ -> score 95+
    let rawScore = Math.round(((heatIndex - 22) / 24) * 75);
    rawScore = Math.max(15, Math.min(84, rawScore));
    
    // Add activity thermal strain offset
    const finalScore = Math.min(100, Math.max(10, rawScore + selectedAct.riskOffset));

    let cat: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    let color = 'text-emerald-700';
    let border = 'border-emerald-200';
    let bgLight = 'bg-emerald-50';
    let expl = '';
    let actAdv = '';

    if (finalScore >= 80) {
      cat = 'critical';
      color = 'text-red-700';
      border = 'border-red-200';
      bgLight = 'bg-red-50';
      expl = `Dangerous heat stress conditions. High humidity (${humidity}%) prevents sweat evaporation, and your feels-like temperature reaches ${heatIndex}°C. Performing ${selectedAct.title.toLowerCase()} puts extreme strain on your cardiovascular and thermoregulation systems.`;
      actAdv = 'Stop non-essential outdoor exertion immediately. Stay in shaded or air-conditioned spaces. Drink cool water with electrolytes every 15-20 minutes. Watch for dizziness, cramping, or nausea.';
    } else if (finalScore >= 60) {
      cat = 'high';
      color = 'text-amber-700';
      border = 'border-amber-200';
      bgLight = 'bg-amber-50';
      expl = `High heat risk. The combination of ${temperature}°C and ${humidity}% humidity creates an apparent temperature of ${heatIndex}°C. Your body requires significantly more water and cooling breaks during ${selectedAct.title.toLowerCase()}.`;
      actAdv = 'Drink at least 250ml of water every 30 minutes. Schedule breaks under deep shade or fan cooling every 45 minutes. Avoid direct midday sun between 12:00 PM and 3:30 PM.';
    } else if (finalScore >= 40) {
      cat = 'moderate';
      color = 'text-blue-700';
      border = 'border-blue-200';
      bgLight = 'bg-blue-50';
      expl = `Moderate heat load. Conditions feel like ${heatIndex}°C. While safe for healthy adults at rest, prolonged ${selectedAct.title.toLowerCase()} will accelerate dehydration and fatigue over time.`;
      actAdv = 'Carry a reusable water bottle. Wear light, breathable cotton clothing. Take a hydration break after an hour of continuous outdoor movement.';
    } else {
      cat = 'low';
      color = 'text-emerald-700';
      border = 'border-emerald-200';
      bgLight = 'bg-emerald-50';
      expl = `Comfortable conditions. Apparent temperature is ${heatIndex}°C. Heat stress risk is minimal across all routine daily activities.`;
      actAdv = 'Enjoy regular outdoor routines. Maintain baseline daily hydration of 2 to 2.5 litres.';
    }

    return {
      riskScore: finalScore,
      category: cat,
      colorClass: color,
      borderClass: border,
      bgLightClass: bgLight,
      explanation: expl,
      action: actAdv
    };
  }, [heatIndex, activity, temperature, humidity]);

  // Wet-Bulb approximation for scientific toggle
  const wetBulbApprox = useMemo(() => {
    // Stull simplified formula approximation
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

  const handleReset = () => {
    setTemperature(34);
    setHumidity(60);
    setActivity('walking');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
      {/* Title & Introduction */}
      <div className="text-center sm:text-left space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#1E60F2] text-xs font-semibold">
          <Flame className="w-3.5 h-3.5" />
          <span>Resident Heat Interactive Calculator</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How will the heat feel?
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
          See how changes in temperature and humidity can affect heat risk. Adjust the sliders below to explore how weather and physical activity impact your safety.
        </p>
      </div>

      {/* Main Interactive Controls & Results Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 3 Clean Interactive Steps (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: TEMPERATURE SLIDER */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Air Temperature</h2>
                  <p className="text-xs text-slate-500">Outdoor thermometer reading</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {temperature}°C
                </span>
                <span className="block text-[11px] text-slate-400">
                  {Math.round((temperature * 9) / 5 + 32)}°F
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <input
                type="range"
                min="25"
                max="40"
                step="0.5"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E60F2]"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-400">
                <span>25°C (Pleasant)</span>
                <span>32°C (Warm)</span>
                <span>40°C (Extreme)</span>
              </div>
            </div>
          </div>

          {/* STEP 2: HUMIDITY SLIDER */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-blue-50 text-[#1E60F2] flex items-center justify-center font-bold text-sm">
                  2
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Relative Humidity</h2>
                  <p className="text-xs text-slate-500">Moisture in the air (reduces sweat cooling)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-[#1E60F2] tracking-tight">
                  {humidity}%
                </span>
                <span className="block text-[11px] text-slate-400">
                  {humidity > 70 ? 'Very Humid' : humidity < 40 ? 'Dry Air' : 'Moderate'}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <input
                type="range"
                min="30"
                max="90"
                step="1"
                value={humidity}
                onChange={(e) => setHumidity(parseInt(e.target.value, 10))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E60F2]"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-400">
                <span>30% (Dry)</span>
                <span>60% (Typical)</span>
                <span>90% (Oppressive)</span>
              </div>
            </div>
          </div>

          {/* STEP 3: ACTIVITY SELECTOR */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  3
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Physical Activity</h2>
                  <p className="text-xs text-slate-500">How much internal heat your body is generating</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#1E60F2] transition-colors"
                title="Reset to default values"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {ACTIVITIES.map((act) => {
                const isSelected = activity === act.id;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setActivity(act.id)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#1E60F2] bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-2xl">{act.icon}</span>
                      <span className={`text-sm font-bold ${isSelected ? 'text-[#1E60F2]' : 'text-slate-800'}`}>
                        {act.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {act.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Results & Action Advice (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Heat Risk Outcome Card */}
          <div className={`rounded-3xl p-6 sm:p-7 border ${borderClass} ${bgLightClass} shadow-md space-y-6 transition-all duration-200`}>
            {/* Top Score Banner */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                  Estimated Heat Risk
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl sm:text-5xl font-black ${colorClass} tracking-tight`}>
                    {riskScore}
                  </span>
                  <span className="text-lg font-bold text-slate-400">/ 100</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-white/90 shadow-2xs border ${borderClass} ${colorClass}`}>
                  {category} Risk
                </span>
                <span className="block text-xs font-medium text-slate-600 mt-1.5">
                  Feels like ~<strong>{heatIndex}°C</strong>
                </span>
              </div>
            </div>

            {/* Visual Risk Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-white/80 rounded-full overflow-hidden p-0.5 border border-black/5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    category === 'critical'
                      ? 'bg-red-500'
                      : category === 'high'
                      ? 'bg-amber-500'
                      : category === 'moderate'
                      ? 'bg-blue-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>0 Safe</span>
                <span>40 Moderate</span>
                <span>65 High</span>
                <span>80+ Critical</span>
              </div>
            </div>

            {/* Plain-English "What this means" */}
            <div className="bg-white/90 rounded-2xl p-4 border border-black/5 space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-[#1E60F2]" />
                <span>What this means</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {explanation}
              </p>
            </div>

            {/* Clear "Recommended action" */}
            <div className="bg-white/90 rounded-2xl p-4 border border-black/5 space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Recommended action</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {action}
              </p>
            </div>
          </div>

          {/* Expandable Advanced Details Toggle */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
            >
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span>Advanced scientific metrics</span>
              </span>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <span>{showAdvanced ? 'Hide' : 'Show details'}</span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {showAdvanced && (
              <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-3.5 text-xs text-slate-600 bg-slate-50/50">
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Calculated Heat Index</span>
                    <span className="text-base font-bold text-slate-900">{heatIndex}°C</span>
                    <span className="text-[10px] text-slate-500 block">NOAA Rothfusz Model</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Est. Wet-Bulb Temp</span>
                    <span className="text-base font-bold text-slate-900">{wetBulbApprox}°C</span>
                    <span className="text-[10px] text-slate-500 block">Stull Psychrometric Formula</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Thermal Strain Note</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    A wet-bulb temperature above 30°C impairs the body's natural evaporative cooling capacity. Above 35°C wet-bulb, physiological cooling via sweat evaporation becomes physically impossible even in shaded outdoor settings.
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
