import React from 'react';
import { ActionItem } from '../../lib/actionEngine';
import { CheckCircle2, ShieldCheck, ArrowRight, Droplets, Sun, AlertTriangle, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WhatShouldIDoNowProps {
  actions: ActionItem[];
  slogan: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
  className?: string;
}

export const WhatShouldIDoNow: React.FC<WhatShouldIDoNowProps> = ({
  actions,
  slogan,
  riskLevel,
  className = ''
}) => {
  const getBadgeStyle = (urgency: ActionItem['urgency']) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'priority':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'advisory':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'routine':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getCategoryLabel = (type: ActionItem['type']) => {
    switch (type) {
      case 'hydration':
        return 'Hydration Target';
      case 'sun':
        return 'Sun & Glare Defense';
      case 'cooling':
        return 'Cool-Down Shelter';
      case 'activity':
        return 'Physical Exertion';
      case 'medical':
        return 'Medical Caution';
      default:
        return 'Health Protocol';
    }
  };

  // Provide realistic fallback 4 actions if action list has fewer
  const displayedActions: ActionItem[] = actions && actions.length >= 4 
    ? actions.slice(0, 4) 
    : [
        {
          id: 'fallback-water',
          icon: '💧',
          title: 'Drink 350ml water every 30 minutes',
          description: 'Sip steadily even if not feeling thirsty. Electrolytes or lemon pinch help sustain minerals.',
          type: 'hydration',
          urgency: 'priority'
        },
        {
          id: 'fallback-sun',
          icon: '☀️',
          title: 'Avoid direct solar exposure between 12 PM – 3:30 PM',
          description: 'Use tree canopies, covered transit walkways, or wear a wide-brim UV-blocking hat.',
          type: 'sun',
          urgency: 'priority'
        },
        {
          id: 'fallback-cool',
          icon: '🧊',
          title: 'Take 15-minute cool-down breaks in shaded rooms',
          description: 'Rest in well-ventilated or air-cooled spaces to allow core internal temperature to stabilize.',
          type: 'cooling',
          urgency: 'priority'
        },
        {
          id: 'fallback-activity',
          icon: '🏃',
          title: 'Postpone intense outdoor workouts until evening',
          description: 'Reschedule rigorous sports or heavy exertion to after 6:00 PM when radiation drops.',
          type: 'activity',
          urgency: 'routine'
        }
      ];

  return (
    <div className={`bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm shadow-blue-500/5 space-y-6 ${className}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center font-bold shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-[#1E60F2]" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              What should you do now?
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Personalized safety guidance based on your current temperature, humidity, and solar heat index
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-blue-50 text-[#1E60F2] border border-blue-200/80 shadow-2xs self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>{slogan}</span>
        </span>
      </div>

      {/* 4 Actionable Safety Guidance Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {displayedActions.map((act) => {
          const badgeClass = getBadgeStyle(act.urgency);
          const categoryName = getCategoryLabel(act.type);

          return (
            <div
              key={act.id}
              className="p-5 rounded-2xl border border-slate-100 bg-[#F9FBFE] hover:bg-white hover:border-blue-200/90 hover:shadow-xs transition-all duration-200 flex flex-col justify-between group space-y-3.5"
            >
              <div className="flex items-start gap-3.5">
                {/* Emoji / Icon Container */}
                <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/70 flex items-center justify-center text-2xl shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  {act.icon}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  {/* Category and Urgency Tags */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">
                      {categoryName}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeClass}`}>
                      {act.urgency}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-extrabold text-slate-900 leading-snug pt-0.5">
                    {act.title}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {act.description}
                  </p>
                </div>
              </div>

              {/* Action helper bar */}
              <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">
                  {act.type === 'hydration' ? 'Target: 2.5L+ today' : act.type === 'sun' ? 'UV Index: Peak midday' : act.type === 'cooling' ? 'Cooling shelters open' : 'Light effort recommended'}
                </span>
                <span className="text-[#1E60F2] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  <span>Action guidance</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Help Footer */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-500 font-medium flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Follow these steps to prevent dehydration, heat cramps, and thermal exhaustion.</span>
        </span>

        <div className="flex items-center gap-3">
          <Link
            to="/cooling-centres"
            className="font-bold text-[#1E60F2] hover:underline inline-flex items-center gap-1"
          >
            <span>Nearest Cooling Centres</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <span className="text-slate-300">•</span>
          <Link
            to="/requests"
            className="font-bold text-[#1E60F2] hover:underline inline-flex items-center gap-1"
          >
            <span>Request Water Aid</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WhatShouldIDoNow;
