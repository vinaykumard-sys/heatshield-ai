import React from 'react';
import { ActionItem } from '../../lib/actionEngine';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
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

  return (
    <div className={`bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-[#1E60F2]" />
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              What should you do now?
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personalized safety actions based on your current temperature and solar heat index
          </p>
        </div>

        <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-blue-50 text-[#1E60F2] border border-blue-200 shadow-2xs self-start sm:self-auto">
          {slogan}
        </span>
      </div>

      {/* Dynamic Recommendation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {actions.map((act) => (
          <div
            key={act.id}
            className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-xs transition-all duration-150 flex items-start gap-3.5"
          >
            <span className="text-2xl shrink-0 mt-0.5">{act.icon}</span>
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  {act.title}
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {act.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Help Footer */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-500 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Follow these steps to prevent heat exhaustion and thermal cramps.</span>
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
