import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Droplets, 
  Sun, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Sparkles,
  Info,
  PhoneCall,
  Check
} from 'lucide-react';
import { RiskCategory } from '../../types';

export interface SafetyRecommendationItem {
  id: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  timingBadge?: string;
  badgeColor?: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}

export interface SafetyRecommendationsProps {
  riskCategory?: RiskCategory | string;
  feelsLikeTemp?: number;
  className?: string;
  onOpenEmergencyModal?: () => void;
}

export const SafetyRecommendations: React.FC<SafetyRecommendationsProps> = ({
  riskCategory = 'critical',
  feelsLikeTemp = 42,
  className = '',
  onOpenEmergencyModal,
}) => {
  // Gamified resident check-off tracker for quick safety compliance
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  const toggleComplete = (id: string) => {
    setCompletedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Get recommendations tailored specifically to the active risk level
  const getRiskGuidance = () => {
    const normalizedRisk = (riskCategory || 'critical').toLowerCase();

    switch (normalizedRisk) {
      case 'critical':
      case 'extreme':
        return {
          title: 'What should you do now?',
          levelLabel: 'Critical Heat Emergency',
          levelBadgeStyle: 'bg-red-50 text-red-700 border-red-200',
          indicatorDot: 'bg-red-500 animate-pulse',
          summary: `Dangerous heat index (${Math.round(feelsLikeTemp)}°C). Immediate physiological cooling and hydration required.`,
          isEmergency: true,
          items: [
            {
              id: 'crit-water',
              emoji: '💧',
              icon: Droplets,
              title: 'Drink water regularly',
              desc: 'Consume 250ml water every 20–30 minutes, even if not thirsty. Add ORS or electrolytes.',
              timingBadge: 'Every 20–30m',
              badgeColor: 'bg-blue-100 text-blue-800',
              iconBg: 'bg-blue-50 border-blue-100 text-[#1E60F2]',
              iconColor: 'text-[#1E60F2]',
              borderColor: 'hover:border-blue-300',
            },
            {
              id: 'crit-sun',
              emoji: '☀️',
              icon: Sun,
              title: 'Avoid direct sun',
              desc: 'Stay indoors or under canopy between 11:30 AM and 4:30 PM. Cease outdoor strenuous labor.',
              timingBadge: '11:30 AM – 4:30 PM',
              badgeColor: 'bg-amber-100 text-amber-800',
              iconBg: 'bg-amber-50 border-amber-100 text-amber-600',
              iconColor: 'text-amber-600',
              borderColor: 'hover:border-amber-300',
            },
            {
              id: 'crit-gear',
              emoji: '🧢',
              icon: ShieldCheck,
              title: 'Sun protection',
              desc: 'Wear wide-brim hat, UV sunglasses, loose light cotton clothing, and SPF 50+ sunscreen.',
              timingBadge: 'Essential Gear',
              badgeColor: 'bg-indigo-100 text-indigo-800',
              iconBg: 'bg-indigo-50 border-indigo-100 text-indigo-600',
              iconColor: 'text-indigo-600',
              borderColor: 'hover:border-indigo-300',
            },
            {
              id: 'crit-rest',
              emoji: '🧊',
              icon: Flame,
              title: 'Cool rest breaks',
              desc: 'Take 15-minute breaks in air-cooled or shaded environments every 45 minutes.',
              timingBadge: '15-min Rest',
              badgeColor: 'bg-emerald-100 text-emerald-800',
              iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
              iconColor: 'text-emerald-600',
              borderColor: 'hover:border-emerald-300',
            },
          ] as SafetyRecommendationItem[]
        };

      case 'high':
        return {
          title: 'What should you do now?',
          levelLabel: 'High Heat Advisory',
          levelBadgeStyle: 'bg-orange-50 text-orange-700 border-orange-200',
          indicatorDot: 'bg-orange-500',
          summary: `High thermal stress (${Math.round(feelsLikeTemp)}°C). Follow proactive daytime cooling and hydration routines.`,
          isEmergency: false,
          items: [
            {
              id: 'high-water',
              emoji: '💧',
              icon: Droplets,
              title: 'Drink water regularly',
              desc: 'Consume 250ml water every 30 minutes, even if not thirsty. Keep a refillable bottle handy.',
              timingBadge: 'Every 30m',
              badgeColor: 'bg-blue-100 text-blue-800',
              iconBg: 'bg-blue-50 border-blue-100 text-[#1E60F2]',
              iconColor: 'text-[#1E60F2]',
              borderColor: 'hover:border-blue-300',
            },
            {
              id: 'high-sun',
              emoji: '☀️',
              icon: Sun,
              title: 'Avoid direct sun',
              desc: 'Stay indoors or under canopy between 12:00 PM and 4:00 PM during peak solar exposure.',
              timingBadge: '12:00 PM – 4:00 PM',
              badgeColor: 'bg-amber-100 text-amber-800',
              iconBg: 'bg-amber-50 border-amber-100 text-amber-600',
              iconColor: 'text-amber-600',
              borderColor: 'hover:border-amber-300',
            },
            {
              id: 'high-gear',
              emoji: '🧢',
              icon: ShieldCheck,
              title: 'Sun protection',
              desc: 'Wear wide-brim hat, UV sunglasses, and loose cotton clothing to reflect thermal radiation.',
              timingBadge: 'High UV',
              badgeColor: 'bg-indigo-100 text-indigo-800',
              iconBg: 'bg-indigo-50 border-indigo-100 text-indigo-600',
              iconColor: 'text-indigo-600',
              borderColor: 'hover:border-indigo-300',
            },
            {
              id: 'high-rest',
              emoji: '🧊',
              icon: Clock,
              title: 'Cool rest breaks',
              desc: 'Take 15-minute breaks in air-cooled or shaded environments if outdoors.',
              timingBadge: 'Routine Rest',
              badgeColor: 'bg-emerald-100 text-emerald-800',
              iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
              iconColor: 'text-emerald-600',
              borderColor: 'hover:border-emerald-300',
            },
          ] as SafetyRecommendationItem[]
        };

      case 'moderate':
        return {
          title: 'What should you do now?',
          levelLabel: 'Moderate Heat Warmth',
          levelBadgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
          indicatorDot: 'bg-amber-500',
          summary: `Warm ambient conditions (${Math.round(feelsLikeTemp)}°C). Maintain steady hydration and shade habits.`,
          isEmergency: false,
          items: [
            {
              id: 'mod-water',
              emoji: '💧',
              icon: Droplets,
              title: 'Drink water regularly',
              desc: 'Sip 250ml water every 45 minutes; supplement with coconut water or buttermilk.',
              timingBadge: 'Every 45m',
              badgeColor: 'bg-blue-100 text-blue-800',
              iconBg: 'bg-blue-50 border-blue-100 text-[#1E60F2]',
              iconColor: 'text-[#1E60F2]',
              borderColor: 'hover:border-blue-300',
            },
            {
              id: 'mod-sun',
              emoji: '☀️',
              icon: Sun,
              title: 'Limit afternoon sun',
              desc: 'Seek shade under trees or canopies between 12:30 PM and 3:30 PM.',
              timingBadge: '12:30 – 3:30 PM',
              badgeColor: 'bg-amber-100 text-amber-800',
              iconBg: 'bg-amber-50 border-amber-100 text-amber-600',
              iconColor: 'text-amber-600',
              borderColor: 'hover:border-amber-300',
            },
            {
              id: 'mod-gear',
              emoji: '🧢',
              icon: ShieldCheck,
              title: 'Sun protection',
              desc: 'Wear sunglasses, lightweight cotton, and apply sunscreen when out for extended periods.',
              timingBadge: 'Recommended',
              badgeColor: 'bg-indigo-100 text-indigo-800',
              iconBg: 'bg-indigo-50 border-indigo-100 text-indigo-600',
              iconColor: 'text-indigo-600',
              borderColor: 'hover:border-indigo-300',
            },
            {
              id: 'mod-rest',
              emoji: '🧊',
              icon: Clock,
              title: 'Cool rest breaks',
              desc: 'Pace strenuous outdoor work and rest in ventilated corridors or tree shades.',
              timingBadge: 'Pace Activity',
              badgeColor: 'bg-emerald-100 text-emerald-800',
              iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
              iconColor: 'text-emerald-600',
              borderColor: 'hover:border-emerald-300',
            },
          ] as SafetyRecommendationItem[]
        };

      case 'low':
      case 'normal':
      default:
        return {
          title: 'What should you do now?',
          levelLabel: 'Safe / Favorable Weather',
          levelBadgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          indicatorDot: 'bg-emerald-500',
          summary: `Favorable microclimate (${Math.round(feelsLikeTemp)}°C). Safe for sports, walking, and outdoor work.`,
          isEmergency: false,
          items: [
            {
              id: 'low-water',
              emoji: '💧',
              icon: Droplets,
              title: 'Drink water regularly',
              desc: 'Maintain standard hydration of 2–3 liters daily across regular intervals.',
              timingBadge: '2–3 L / day',
              badgeColor: 'bg-blue-100 text-blue-800',
              iconBg: 'bg-blue-50 border-blue-100 text-[#1E60F2]',
              iconColor: 'text-[#1E60F2]',
              borderColor: 'hover:border-blue-300',
            },
            {
              id: 'low-sun',
              emoji: '☀️',
              icon: Sun,
              title: 'Comfortable outdoor travel',
              desc: 'Safe for cycling, daytime commuting, sports, and outdoor activities with minimal thermal strain.',
              timingBadge: 'All Day',
              badgeColor: 'bg-emerald-100 text-emerald-800',
              iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
              iconColor: 'text-emerald-600',
              borderColor: 'hover:border-emerald-300',
            },
            {
              id: 'low-gear',
              emoji: '🧢',
              icon: ShieldCheck,
              title: 'Standard sun protection',
              desc: 'Standard UV protection and comfortable casual wear recommended for prolonged daylight trips.',
              timingBadge: 'Normal',
              badgeColor: 'bg-indigo-100 text-indigo-800',
              iconBg: 'bg-indigo-50 border-indigo-100 text-indigo-600',
              iconColor: 'text-indigo-600',
              borderColor: 'hover:border-indigo-300',
            },
            {
              id: 'low-rest',
              emoji: '🧊',
              icon: CheckCircle2,
              title: 'Community services active',
              desc: 'Neighborhood cooling sanctuaries, drinking fountains, and shaded parks remain open for public use.',
              timingBadge: 'Open',
              badgeColor: 'bg-cyan-100 text-cyan-800',
              iconBg: 'bg-cyan-50 border-cyan-100 text-cyan-600',
              iconColor: 'text-cyan-600',
              borderColor: 'hover:border-cyan-300',
            },
          ] as SafetyRecommendationItem[]
        };
    }
  };

  const guidance = getRiskGuidance();
  const completedCount = Object.values(completedItems).filter(Boolean).length;

  return (
    <section 
      aria-label="Safety Recommendations"
      className={`bg-white rounded-[24px] border border-[#E5EDF5] p-5 sm:p-6 shadow-xs space-y-4 hover:shadow-card-hover transition-all duration-300 ${className}`}
    >
      {/* SECTION HEADER: Title "What should you do now?" + Status Badge + Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: guidance.isEmergency ? '#EF4444' : '#10B981' }} />
              What should you do now?
            </h3>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${guidance.levelBadgeStyle}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${guidance.indicatorDot}`} />
              {guidance.levelLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            {guidance.summary}
          </p>
        </div>

        {/* Quick link to resident safety hub */}
        <div className="flex items-center gap-3 shrink-0">
          {guidance.isEmergency && onOpenEmergencyModal && (
            <button
              onClick={onOpenEmergencyModal}
              className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 btn-press shadow-2xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>SOS Helpline</span>
            </button>
          )}

          <Link
            to="/resident-dashboard"
            className="text-xs font-semibold text-[#1E60F2] hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors self-start sm:self-auto py-1"
          >
            <span>Full resident guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 ACTIONABLE RECOMMENDATIONS GRID (Scannable within 3 seconds) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
        {guidance.items.map((item) => {
          const isDone = !!completedItems[item.id];
          const IconComponent = item.icon;

          return (
            <div
              key={item.id}
              onClick={() => toggleComplete(item.id)}
              className={`p-3.5 sm:p-4 rounded-[20px] bg-[#F8FAFC] border transition-all duration-200 cursor-pointer select-none group flex items-start gap-3.5 ${
                isDone 
                  ? 'bg-emerald-50/40 border-emerald-200 shadow-2xs' 
                  : `border-[#E5EDF5] hover:bg-white hover:shadow-card-hover ${item.borderColor}`
              }`}
              title="Click to check off action"
            >
              {/* Colored icon badge container */}
              <div 
                className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200 relative ${item.iconBg}`}
              >
                <IconComponent className={`w-5 h-5 ${item.iconColor}`} />
                {isDone && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Text content: Emoji + Bold Title + Concise Description */}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#1E60F2] transition-colors truncate flex items-center gap-1.5">
                    <span className="text-sm shrink-0">{item.emoji}</span>
                    <span className={`truncate ${isDone ? 'line-through text-slate-400' : ''}`}>
                      {item.title}
                    </span>
                  </div>

                  {item.timingBadge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor}`}>
                      {item.timingBadge}
                    </span>
                  )}
                </div>

                <p className={`text-xs leading-relaxed text-slate-600 line-clamp-2 ${isDone ? 'text-slate-400' : ''}`}>
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER BAR: Instant completion status & 3-second scan assurance */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100/80">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>
            {completedCount === 0 ? (
              <span>Tip: Click any recommendation after completing to track your daily safety routine.</span>
            ) : completedCount === guidance.items.length ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All safety measures taken! Stay protected indoors.
              </span>
            ) : (
              <span className="text-blue-600 font-medium">
                {completedCount} of {guidance.items.length} safety actions completed today.
              </span>
            )}
          </span>
        </div>

        <div className="text-[11px] text-slate-400 self-end sm:self-auto flex items-center gap-1">
          <span>Advisory updated based on real-time heat telemetry</span>
        </div>
      </div>
    </section>
  );
};

export default SafetyRecommendations;
