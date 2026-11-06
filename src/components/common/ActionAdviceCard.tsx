import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Droplets, 
  Building2, 
  Navigation, 
  HeartHandshake, 
  ArrowRight,
  Sun,
  ShieldCheck,
  Compass
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
  const getAdviceData = () => {
    switch (riskCategory) {
      case 'critical':
      case 'extreme':
        return {
          title: 'WHAT SHOULD YOU DO NOW?',
          subtitle: 'Extreme conditions. Take immediate protective measures.',
          badge: 'Emergency Precaution',
          badgeStyle: 'bg-red-50 text-red-700 border-red-200',
          items: [
            { icon: Droplets, title: 'Drink water regularly', desc: 'Sip water or electrolyte fluids every 15 minutes, even before feeling thirsty.' },
            { icon: Building2, title: 'Use shaded or cooled areas', desc: 'Stay in well-ventilated indoor areas or visit a local cooling center.' },
            { icon: Sun, title: 'Avoid direct sunlight', desc: 'Postpone outdoor work and non-essential travel until evening.' },
            { icon: HeartHandshake, title: 'Avoid strenuous activity', desc: 'Rest frequently and check on elderly neighbors and young children.' },
          ]
        };
      case 'high':
        return {
          title: 'WHAT SHOULD YOU DO NOW?',
          subtitle: 'High heat stress. Follow daytime safety precautions.',
          badge: 'High Advisory',
          badgeStyle: 'bg-orange-50 text-orange-700 border-orange-200',
          items: [
            { icon: Droplets, title: 'Drink water regularly', desc: 'Carry a refillable water bottle and drink a glass every 30-40 minutes.' },
            { icon: Sun, title: 'Avoid prolonged direct sunlight', desc: 'Limit unshaded exposure during peak hours (11:30 AM to 3:30 PM).' },
            { icon: Building2, title: 'Use shaded or cooled areas', desc: 'Take routine breaks in tree-shaded or air-conditioned spots.' },
            { icon: Navigation, title: 'Avoid strenuous activity', desc: 'Take cooler walking routes and pace yourself outdoors.' },
          ]
        };
      case 'moderate':
        return {
          title: 'WHAT SHOULD YOU DO NOW?',
          subtitle: 'Warm weather. Maintain routine hydration.',
          badge: 'Moderate Warmth',
          badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
          items: [
            { icon: Droplets, title: 'Drink water regularly', desc: 'Keep yourself hydrated with water, coconut water, or buttermilk.' },
            { icon: Sun, title: 'Wear sun protection', desc: 'Use loose cotton clothes, sunglasses, and an umbrella if out in the sun.' },
            { icon: Building2, title: 'Use shaded areas', desc: 'Rest in shade during afternoon walks or outdoor commutes.' },
            { icon: CheckCircle2, title: 'Safe for daily activities', desc: 'Standard routines are safe with normal hydration.' },
          ]
        };
      case 'low':
      case 'normal':
      default:
        return {
          title: 'WHAT SHOULD YOU DO NOW?',
          subtitle: 'Comfortable seasonal conditions. Safe for all outdoor activities.',
          badge: 'Safe Conditions',
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          items: [
            { icon: CheckCircle2, title: 'Conditions are favorable', desc: 'Safe for recreation, outdoor work, sports, and daily travel.' },
            { icon: Droplets, title: 'Drink water regularly', desc: 'Maintain normal daily water intake of 2 to 3 liters.' },
            { icon: Sun, title: 'Mild sun awareness', desc: 'Standard protection if spending extended hours under midday sun.' },
            { icon: Building2, title: 'Community services open', desc: 'Neighborhood cooling centers and water ATMs are accessible.' },
          ]
        };
    }
  };

  const advice = getAdviceData();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. WHAT SHOULD YOU DO NOW? CARD */}
      <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {advice.title}
              </h3>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${advice.badgeStyle}`}>
                {advice.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {advice.subtitle}
            </p>
          </div>
          <Link
            to="/resident-dashboard"
            className="text-xs font-semibold text-[#1E60F2] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View safety guidance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Recommendations based on actual data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {advice.items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] flex items-start gap-3 hover:bg-slate-100/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-[#E5EDF5] text-[#1E60F2] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-500 leading-snug">
                    {item.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SECTION 16: FOUR QUICK ACTION CARDS */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Quick Actions
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action 1: Cooling Shelter */}
          <Link
            to="/cooling-centres"
            className="p-4 rounded-[20px] bg-white border border-[#E5EDF5] hover:border-emerald-300 shadow-xs hover:shadow-card-hover transition-all duration-200 ease-out group flex flex-col justify-between btn-press"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Find Cooling Shelter
                </div>
                <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  Air-conditioned centers & shaded resting sanctuaries
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600 gap-1">
              <span>View shelters</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Action 2: Locate Water */}
          <Link
            to="/water-stations"
            className="p-4 rounded-[20px] bg-white border border-[#E5EDF5] hover:border-blue-300 shadow-xs hover:shadow-card-hover transition-all duration-200 ease-out group flex flex-col justify-between btn-press"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-[#1E60F2] transition-colors">
                  Locate Water
                </div>
                <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  Drinking water ATMs & free community hydration points
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-[#1E60F2] gap-1">
              <span>Find water</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Action 3: Plan Safe Route */}
          <Link
            to="/safe-routes"
            className="p-4 rounded-[20px] bg-white border border-[#E5EDF5] hover:border-cyan-300 shadow-xs hover:shadow-card-hover transition-all duration-200 ease-out group flex flex-col justify-between btn-press"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                  Plan Safe Route
                </div>
                <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  Tree-canopied paths with lower solar exposure
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-cyan-600 gap-1">
              <span>Plan route</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Action 4: Request Aid */}
          <Link
            to="/requests"
            className="p-4 rounded-[20px] bg-white border border-[#E5EDF5] hover:border-amber-300 shadow-xs hover:shadow-card-hover transition-all duration-200 ease-out group flex flex-col justify-between btn-press"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  Request Aid
                </div>
                <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  Urgent water delivery, ORS kits, or volunteer help
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-amber-600 gap-1">
              <span>Request help</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ActionAdviceCard;
