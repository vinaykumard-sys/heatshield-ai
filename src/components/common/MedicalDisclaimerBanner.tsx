import React, { useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface MedicalDisclaimerBannerProps {
  compact?: boolean;
}

export const MedicalDisclaimerBanner: React.FC<MedicalDisclaimerBannerProps> = ({ compact = false }) => {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (compact) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1.5 text-xs text-amber-200/90 flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{t('medicalDisclaimerShort')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-950/20 border border-amber-500/25 rounded-2xl p-3.5 sm:p-4 text-xs text-amber-200/90 shadow-card flex items-start justify-between gap-3 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-amber-300 block mb-0.5">
            Public Safety & Non-Medical Assessment Disclaimer
          </span>
          <p className="leading-relaxed text-slate-300 text-xs">
            {t('medicalDisclaimer')} If someone is experiencing symptoms of heatstroke (altered mental state, confusion, cessation of sweating, seizures, or loss of consciousness), call government emergency helpline <strong>108 / 112</strong> or seek emergency clinical hospital care immediately.
          </p>
        </div>
      </div>
      <button 
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        title="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
