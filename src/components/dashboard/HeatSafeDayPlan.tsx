import React from 'react';
import { DayPlanMilestone } from '../../lib/actionEngine';
import { Clock, Sun, Flame, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeatSafeDayPlanProps {
  dayPlan: DayPlanMilestone[];
  peakTime: string;
  className?: string;
}

export const HeatSafeDayPlan: React.FC<HeatSafeDayPlanProps> = ({
  dayPlan,
  peakTime,
  className = ''
}) => {
  if (!dayPlan || dayPlan.length === 0) return null;

  return (
    <div className={`bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5 ${className}`}>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Heat-Safe Day Plan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic timeline calculated from today's real forecast curve. Plan your movements around peak heat.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
            Peak Expected: {peakTime}
          </span>
        </div>
      </div>

      {/* Timeline Steps (Desktop & Tablet: Horizontal Flow; Mobile: Vertical Clean Timeline) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-1">
        {dayPlan.map((milestone, idx) => {
          const isPeak = milestone.isPeak;
          const isSafe = milestone.isSafeOutdoorWindow;

          return (
            <div
              key={`${milestone.timeLabel}-${idx}`}
              className={`p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between space-y-3 ${
                isPeak
                  ? 'border-red-300 bg-red-50/60 ring-2 ring-red-500/20 shadow-xs'
                  : isSafe
                  ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/60'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-white'
              }`}
            >
              {/* Top Time and Badge */}
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900">
                  {milestone.timeLabel}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isPeak
                      ? 'bg-red-600 text-white'
                      : isSafe
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {milestone.badgeText}
                </span>
              </div>

              {/* Temperature & Headline */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-black tracking-tight ${isPeak ? 'text-red-700' : 'text-slate-900'}`}>
                    {milestone.temperature}°C
                  </span>
                  <span className="text-xs text-slate-400">
                    feels {milestone.feelsLike}°C
                  </span>
                </div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  {milestone.headline}
                </h4>
              </div>

              {/* Plain-English Advice */}
              <p className="text-[11px] text-slate-600 leading-snug">
                {milestone.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer Link */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          Generated automatically from authoritative hourly atmospheric telemetry.
        </span>
        <Link
          to="/predictions"
          className="font-bold text-[#1E60F2] hover:underline inline-flex items-center gap-1"
        >
          <span>View 7-day extended outlook</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default HeatSafeDayPlan;
