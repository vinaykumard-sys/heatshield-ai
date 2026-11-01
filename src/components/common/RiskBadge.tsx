import React from 'react';
import { RiskCategory } from '../../types';
import { getRiskColorClass } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';

interface RiskBadgeProps {
  category: RiskCategory;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  category,
  score,
  size = 'md',
  showPulse = true
}) => {
  const { t } = useLanguage();
  const styles = getRiskColorClass(category);

  let label = t('riskLow');
  if (category === 'moderate') label = t('riskModerate');
  if (category === 'high') label = t('riskHigh');
  if (category === 'critical') label = t('riskCritical');

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-2',
    lg: 'text-base px-3.5 py-1.5 gap-2.5 font-semibold'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium transition-all ${styles.badge} ${sizeClasses[size]}`}
    >
      {showPulse && (
        <span className="relative flex h-2 w-2">
          {category === 'critical' || category === 'high' ? (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                category === 'critical' ? 'bg-red-400' : 'bg-orange-400'
              }`}
            />
          ) : null}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.dot}`} />
        </span>
      )}
      <span>{label}</span>
      {score !== undefined && (
        <span className="font-mono opacity-85 text-xs font-semibold pl-1 border-l border-current/30">
          {score.toFixed(0)}
        </span>
      )}
    </span>
  );
};
