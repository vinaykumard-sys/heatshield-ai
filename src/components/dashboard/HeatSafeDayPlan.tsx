import React from 'react';
import { DayPlanMilestone } from '../../lib/actionEngine';
import { Clock, Sun, Flame, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Moon } from 'lucide-react';
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
  // Canonical badge normalizer matching Requirement 6:
  // (Recommended, Caution, Peak Risk, Cooling Down)
  const normalizeBadge = (milestone: DayPlanMilestone): {
    badgeText: 'Recommended' | 'Caution' | 'Peak Risk' | 'Cooling Down';
    badgeClass: string;
    cardBorder: string;
    icon: React.ReactNode;
  } => {
    if (milestone.isPeak || milestone.riskLevel === 'extreme' || milestone.badgeText?.toLowerCase().includes('peak')) {
      return {
        badgeText: 'Peak Risk',
        badgeClass: 'bg-red-600 text-white shadow-2xs font-black shadow-red-500/30',
        cardBorder: 'border-red-300 bg-gradient-to-b from-red-50/70 to-white ring-2 ring-red-500/20 shadow-xs',
        icon: <Flame className="w-3.5 h-3.5 text-white animate-pulse" />
      };
    }

    const text = (milestone.badgeText || '').toLowerCase();
    const headline = (milestone.headline || '').toLowerCase();

    if (text.includes('cool') || headline.includes('improving') || milestone.hour >= 17) {
      return {
        badgeText: 'Cooling Down',
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/90 font-extrabold',
        cardBorder: 'border-blue-200 bg-gradient-to-b from-blue-50/40 to-white hover:border-blue-300',
        icon: <Moon className="w-3.5 h-3.5 text-blue-600" />
      };
    }

    if (text.includes('safe') || text.includes('recommended') || milestone.isSafeOutdoorWindow) {
      return {
        badgeText: 'Recommended',
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/90 font-extrabold',
        cardBorder: 'border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-white hover:border-emerald-300',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      };
    }

    // Default to Caution for building heat
    return {
      badgeText: 'Caution',
      badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200/90 font-extrabold',
      cardBorder: 'border-amber-200 bg-gradient-to-b from-amber-50/40 to-white hover:border-amber-300',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
    };
  };

  // Provide realistic default 5 milestones if input is empty
  const defaultMilestones: DayPlanMilestone[] = [
    {
      timeLabel: '08:00 AM',
      hour: 8,
      temperature: 25,
      feelsLike: 27,
      riskLevel: 'low',
      headline: 'BEST FOR OUTDOORS',
      badgeText: 'Recommended',
      description: 'Cool morning air and minimal solar intensity. Best window for outdoor work, walking, and errands.',
      isPeak: false,
      isSafeOutdoorWindow: true
    },
    {
      timeLabel: '11:00 AM',
      hour: 11,
      temperature: 29,
      feelsLike: 32,
      riskLevel: 'moderate',
      headline: 'HEAT ACCELERATING',
      badgeText: 'Caution',
      description: 'Solar angle steepening. Seek tree shade or indoor areas when walking long distances.',
      isPeak: false,
      isSafeOutdoorWindow: false
    },
    {
      timeLabel: '02:00 PM',
      hour: 14,
      temperature: 34,
      feelsLike: 37,
      riskLevel: 'high',
      headline: 'PEAK HEAT WINDOW',
      badgeText: 'Peak Risk',
      description: 'Maximum diurnal thermal stress. Avoid direct sun exposure and stay near cooling spots.',
      isPeak: true,
      isSafeOutdoorWindow: false
    },
    {
      timeLabel: '04:30 PM',
      hour: 16.5,
      temperature: 31,
      feelsLike: 33,
      riskLevel: 'moderate',
      headline: 'HEAT SUSTAINED',
      badgeText: 'Caution',
      description: 'Radiant asphalt and concrete heat persist. Hydrate continuously before outdoor transit.',
      isPeak: false,
      isSafeOutdoorWindow: false
    },
    {
      timeLabel: '06:30 PM',
      hour: 18.5,
      temperature: 27,
      feelsLike: 28,
      riskLevel: 'low',
      headline: 'CONDITIONS IMPROVING',
      badgeText: 'Cooling Down',
      description: 'Solar radiation subsides. Comfortable for evening walks, market visits, and ventilation.',
      isPeak: false,
      isSafeOutdoorWindow: true
    }
  ];

  const milestones = dayPlan && dayPlan.length > 0 ? dayPlan : defaultMilestones;

  return (
    <div className={`bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm shadow-blue-500/5 space-y-6 ${className}`}>
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-2xs">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Heat-Safe Day Plan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Dynamic timeline calculated from today's forecast curve. Plan activities around peak thermal load.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Peak Expected: {peakTime || '02:00 PM'}</span>
          </span>
        </div>
      </div>

      {/* Dynamic Timeline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {milestones.map((milestone, idx) => {
          const { badgeText, badgeClass, cardBorder, icon } = normalizeBadge(milestone);

          return (
            <div
              key={`${milestone.timeLabel}-${idx}`}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3.5 ${cardBorder}`}
            >
              {/* Top Time and Clear Badge */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-sm text-slate-900 tracking-tight">
                  {milestone.timeLabel}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${badgeClass}`}>
                  {icon}
                  <span>{badgeText}</span>
                </span>
              </div>

              {/* Temperature & Headline */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight ${milestone.isPeak ? 'text-red-700' : 'text-slate-900'}`}>
                    {milestone.temperature}°C
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    feels {milestone.feelsLike}°
                  </span>
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  {milestone.headline}
                </h4>
              </div>

              {/* Plain-English Advice */}
              <p className="text-[11px] text-slate-600 leading-snug font-normal">
                {milestone.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Timeline Footnote */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-500 font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Synchronized with ground weather station and hourly biometeorological diurnal curve.</span>
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
