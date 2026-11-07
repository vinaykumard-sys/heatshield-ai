import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Droplets, 
  Navigation, 
  HelpCircle, 
  ArrowRight, 
  Zap,
  ExternalLink
} from 'lucide-react';

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  borderHover: string;
  badge?: string;
  badgeStyle?: string;
  ctaText: string;
  ctaColor: string;
}

export interface QuickActionsGridProps {
  className?: string;
  showHeader?: boolean;
  onRequestAid?: () => void;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
  className = '',
  showHeader = true,
  onRequestAid,
}) => {
  const actions: QuickActionItem[] = [
    {
      id: 'cooling-shelter',
      title: 'Find Cooling Shelter',
      description: 'Air-conditioned sanctuaries nearby.',
      path: '/cooling-centres',
      icon: Building2,
      iconBg: 'bg-emerald-50 border border-emerald-100/80',
      iconColor: 'text-emerald-600',
      borderHover: 'hover:border-emerald-300',
      badge: 'Nearby Free AC',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ctaText: 'Find shelter',
      ctaColor: 'text-emerald-600 group-hover:text-emerald-700',
    },
    {
      id: 'locate-water',
      title: 'Locate Water',
      description: 'Verified clean drinking water ATMs.',
      path: '/water-stations',
      icon: Droplets,
      iconBg: 'bg-blue-50 border border-blue-100/80',
      iconColor: 'text-[#1E60F2]',
      borderHover: 'hover:border-blue-300',
      badge: 'Verified Clean',
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
      ctaText: 'Locate water',
      ctaColor: 'text-[#1E60F2] group-hover:text-blue-700',
    },
    {
      id: 'safe-route',
      title: 'Plan Safe Route',
      description: 'Heat-safe, tree-shaded walking paths.',
      path: '/safe-routes',
      icon: Navigation,
      iconBg: 'bg-cyan-50 border border-cyan-100/80',
      iconColor: 'text-cyan-600',
      borderHover: 'hover:border-cyan-300',
      badge: 'Shaded Paths',
      badgeStyle: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      ctaText: 'Plan route',
      ctaColor: 'text-cyan-600 group-hover:text-cyan-700',
    },
    {
      id: 'request-aid',
      title: 'Request Aid',
      description: 'Water, ORS, or emergency welfare visits.',
      path: '/requests',
      icon: HelpCircle,
      iconBg: 'bg-rose-50 border border-rose-100/80',
      iconColor: 'text-rose-600',
      borderHover: 'hover:border-rose-300',
      badge: '24/7 Response',
      badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200',
      ctaText: 'Request aid',
      ctaColor: 'text-rose-600 group-hover:text-rose-700',
    },
  ];

  return (
    <section aria-label="Quick Actions" className={`space-y-3 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Quick Actions</span>
            </h3>
            <span className="text-[11px] font-medium text-slate-400">
              Immediate community lifelines
            </span>
          </div>

          <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium">
            Fast 1-tap navigation
          </span>
        </div>
      )}

      {/* 4 Beautiful Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const isRequestAid = action.id === 'request-aid';

          const content = (
            <>
              <div className="space-y-3">
                {/* Header row: Soft-tinted icon container + Micro Badge */}
                <div className="flex items-center justify-between">
                  <div 
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform duration-200 ${action.iconBg}`}
                  >
                    <Icon className={`w-5 h-5 ${action.iconColor}`} />
                  </div>

                  {action.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${action.badgeStyle}`}>
                      {action.badge}
                    </span>
                  )}
                </div>

                {/* Bold title and 1-line plain explanation */}
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">
                    {action.title}
                  </div>
                  <div className="text-xs text-slate-500 leading-snug line-clamp-1">
                    {action.description}
                  </div>
                </div>
              </div>

              {/* Seamless Action CTA link with animated arrow */}
              <div className={`mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold ${action.ctaColor}`}>
                <span>{action.ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </>
          );

          if (isRequestAid && onRequestAid) {
            return (
              <button
                key={action.id}
                type="button"
                onClick={onRequestAid}
                className={`text-left p-4 sm:p-5 rounded-[22px] bg-white border border-[#E5EDF5] shadow-xs hover:shadow-card-hover transition-all duration-200 ease-out group flex flex-col justify-between hover:-translate-y-1 active:scale-[0.98] cursor-pointer ${action.borderHover}`}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={action.id}
              to={action.path}
              className={`p-4 sm:p-5 rounded-[22px] bg-white border border-[#E5EDF5] shadow-xs hover:shadow-card-hover transition-all duration-200 ease-out group flex flex-col justify-between hover:-translate-y-1 active:scale-[0.98] ${action.borderHover}`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default QuickActionsGrid;
