import React from 'react';
import { SafetyRecommendations } from '../dashboard/SafetyRecommendations';
import { QuickActionsGrid } from '../dashboard/QuickActionsGrid';
import { RiskCategory } from '../../types';

export interface ActionAdviceCardProps {
  riskCategory: RiskCategory | string;
  feelsLikeTemp?: number;
  className?: string;
  onOpenEmergencyModal?: () => void;
}

export const ActionAdviceCard: React.FC<ActionAdviceCardProps> = ({
  riskCategory,
  feelsLikeTemp,
  className = '',
  onOpenEmergencyModal,
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <SafetyRecommendations
        riskCategory={riskCategory}
        feelsLikeTemp={feelsLikeTemp}
        onOpenEmergencyModal={onOpenEmergencyModal}
      />
      <QuickActionsGrid />
    </div>
  );
};

export default ActionAdviceCard;
export { SafetyRecommendations, QuickActionsGrid };
