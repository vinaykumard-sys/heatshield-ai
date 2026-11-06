import React from 'react';
import { 
  Thermometer, 
  Flame, 
  Droplet, 
  Building2, 
  Sun, 
  Info,
  AlertTriangle 
} from 'lucide-react';

interface FactorBreakdownRowProps {
  ambientTemp?: number;
  heatIndex?: number;
  wetBulbTemp?: number;
  uhiAnomaly?: number;
  uvIndex?: number;
  className?: string;
}

export const FactorBreakdownRow: React.FC<FactorBreakdownRowProps> = ({
  ambientTemp = 41.2,
  heatIndex = 45.4,
  wetBulbTemp = 30.5,
  uhiAnomaly = 3.4,
  uvIndex = 9.8,
  className = '',
}) => {
  const factors = [
    {
      id: 'ambient',
      title: 'Ambient Temp',
      value: `${ambientTemp.toFixed(1)}°C`,
      delta: '+3.2°C vs normal',
      status: ambientTemp >= 40 ? 'Severe' : ambientTemp >= 35 ? 'Elevated' : 'Normal',
      statusColor: ambientTemp >= 40 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200',
      icon: Thermometer,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50/50',
      tip: 'Dry bulb ambient air temperature measured in shaded Stevenson screen.'
    },
    {
      id: 'heat_index',
      title: 'Heat Index',
      value: `${heatIndex.toFixed(1)}°C`,
      delta: 'Dangerous strain',
      status: heatIndex >= 42 ? 'Critical' : 'High',
      statusColor: heatIndex >= 42 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200',
      icon: Flame,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50/50',
      tip: 'Combined physiological effect of heat + relative humidity on core body temperature.'
    },
    {
      id: 'wet_bulb',
      title: 'Wet Bulb',
      value: `${wetBulbTemp.toFixed(1)}°C`,
      delta: 'Threshold: 32°C',
      status: wetBulbTemp >= 31 ? 'Critical' : wetBulbTemp >= 29 ? 'Severe' : 'Moderate',
      statusColor: wetBulbTemp >= 30 ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-sky-50 text-sky-700 border-sky-200',
      icon: Droplet,
      iconColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50/50',
      tip: 'Lowest temperature achievable by evaporative cooling. Fatal human limit is 35°C.'
    },
    {
      id: 'uhi',
      title: 'Urban Heat Island',
      value: `+${uhiAnomaly.toFixed(1)}°C`,
      delta: 'Concrete & asphalt trap',
      status: uhiAnomaly >= 3.0 ? 'High Anomaly' : 'Moderate',
      statusColor: uhiAnomaly >= 3.0 ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Building2,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50/50',
      tip: 'Thermal differential between high-density built environment vs open rural green space.'
    },
    {
      id: 'uv',
      title: 'Solar UV Index',
      value: `${uvIndex.toFixed(1)}`,
      delta: 'Burn risk <15 min',
      status: uvIndex >= 8 ? 'Very High' : uvIndex >= 6 ? 'High' : 'Moderate',
      statusColor: uvIndex >= 8 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Sun,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50/50',
      tip: 'Solar ultraviolet radiation intensity. Maximum UV during 11:30 AM to 3:00 PM.'
    },
  ];

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1E60F2] animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Explainable AI Factor Breakdown
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Multi-sensor telemetry & satellite fusion
        </span>
      </div>

      {/* Pill Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {factors.map((factor) => {
          const IconComp = factor.icon;
          return (
            <div
              key={factor.id}
              className="bg-white rounded-[22px] border border-[#E5EDF5] p-3.5 shadow-xs hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 flex flex-col justify-between gap-2.5 relative group"
              title={factor.tip}
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-xl ${factor.bgColor} flex items-center justify-center ${factor.iconColor} shadow-xs`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${factor.statusColor}`}>
                  {factor.status}
                </span>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-500">
                  {factor.title}
                </div>
                <div className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {factor.value}
                </div>
                <div className="text-[10px] font-medium text-slate-400 truncate mt-0.5">
                  {factor.delta}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FactorBreakdownRow;
