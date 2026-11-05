import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Droplets, 
  Building2, 
  Navigation, 
  HeartHandshake, 
  ArrowRight,
  ShieldAlert,
  Sun,
  AlertCircle
} from 'lucide-react';
import { RiskCategory } from '../../types';

interface ActionAdviceCardProps {
  riskCategory: RiskCategory | string;
  feelsLikeTemp?: number;
  className?: string;
}

export const ActionAdviceCard: React.FC<ActionAdviceCardProps> = ({
  riskCategory,
  feelsLikeTemp = 34,
  className = '',
}) => {
  // Tailored recommendations based on the 4 canonical severity levels
  const getAdviceData = () => {
    switch (riskCategory) {
      case 'critical':
      case 'extreme':
        return {
          title: 'Immediate Protective Actions',
          subtitle: 'Extreme thermal conditions detected. Minimize physical exposure.',
          badge: 'High Precaution',
          badgeStyle: 'bg-red-50 text-red-700 border-red-200',
          items: [
            { icon: Droplets, title: 'Hydrate continuously', desc: 'Drink water or ORS every 15-20 minutes, even if not thirsty.' },
            { icon: Building2, title: 'Remain in cool spaces', desc: 'Stay indoors with fans, coolers, or visit a nearby cooling centre.' },
            { icon: Sun, title: 'Avoid direct sunlight', desc: 'Postpone outdoor errands until evening temperatures drop.' },
            { icon: HeartHandshake, title: 'Check vulnerable family', desc: 'Ensure elderly members, infants, and pets remain cool and comfortable.' },
          ]
        };
      case 'high':
        return {
          title: 'What should you do now?',
          subtitle: 'Elevated heat index. Take preventive safety measures.',
          badge: 'Advisory Active',
          badgeStyle: 'bg-orange-50 text-orange-700 border-orange-200',
          items: [
            { icon: Droplets, title: 'Drink plenty of fluids', desc: 'Carry water and drink 1 glass every 30-45 minutes outdoors.' },
            { icon: Sun, title: 'Limit midday sun exposure', desc: 'Avoid strenuous activity during the peak solar window (12 PM - 3:30 PM).' },
            { icon: Navigation, title: 'Stick to tree-shaded paths', desc: 'Use shaded walking routes to avoid radiative asphalt heat.' },
            { icon: HeartHandshake, title: 'Care for outdoor workers', desc: 'Encourage mandatory shaded breaks and electrolyte replenishment.' },
          ]
        };
      case 'moderate':
        return {
          title: 'What should you do now?',
          subtitle: 'Warm seasonal conditions. Maintain routine hydration.',
          badge: 'Moderate Heat',
          badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
          items: [
            { icon: Droplets, title: 'Stay hydrated', desc: 'Keep a water bottle handy and drink throughout your day.' },
            { icon: Sun, title: 'Wear sun protection', desc: 'Use lightweight cotton clothing, a wide-brim hat, or an umbrella.' },
            { icon: Building2, title: 'Rest in shade when fatigued', desc: 'Take short breaks in ventilated or shaded spaces during midday.' },
            { icon: CheckCircle2, title: 'Safe for daily commutes', desc: 'Routine outdoor activities are safe with standard precautions.' },
          ]
        };
      case 'low':
      case 'normal':
      default:
        return {
          title: 'What should you do now?',
          subtitle: 'Optimal thermal comfort. Conditions are favorable.',
          badge: 'Safe Baseline',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          items: [
            { icon: CheckCircle2, title: 'Favorable conditions', desc: 'Safe for all outdoor recreation, errands, and physical exercise.' },
            { icon: Droplets, title: 'Maintain baseline hydration', desc: 'Drink 2 to 3 liters of water across the day.' },
            { icon: Sun, title: 'Mild UV protection', desc: 'Standard sun protection recommended if spending long hours outside.' },
            { icon: Building2, title: 'All lifelines operational', desc: 'Neighborhood cooling centers and water ATMs are open and accessible.' },
          ]
        };
    }
  };

  const advice = getAdviceData();

  return (
    <div className={`bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {advice.title}
            </h2>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${advice.badgeStyle}`}>
              {advice.badge}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {advice.subtitle}
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono self-start sm:self-auto">
          Heat Health Advice
        </div>
      </div>

      {/* Actionable Guideline Chips / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {advice.items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3 hover:bg-slate-50 hover:border-slate-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 leading-snug">
                  {item.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono mr-1">
            Quick Actions:
          </span>
          <Link
            to="/cooling-centres"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-all btn-interact"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Find Cooling Shelter</span>
          </Link>
          <Link
            to="/water-stations"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 text-xs font-semibold border border-blue-200 transition-all btn-interact"
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Locate Water ATM</span>
          </Link>
          <Link
            to="/safe-routes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100/80 text-cyan-700 text-xs font-semibold border border-cyan-200 transition-all btn-interact"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Plan Safe Route</span>
          </Link>
          <Link
            to="/requests"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold border border-slate-200 transition-all btn-interact"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Request Aid</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ActionAdviceCard;
