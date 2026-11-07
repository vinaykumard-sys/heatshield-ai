import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  MessageCircle, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  ShieldAlert,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CompulsoryPhoneAlertBannerProps {
  onOpenPhoneModal: () => void;
  className?: string;
}

export const CompulsoryPhoneAlertBanner: React.FC<CompulsoryPhoneAlertBannerProps> = ({
  onOpenPhoneModal,
  className = '',
}) => {
  const { user, isAuthenticated } = useAuth();
  
  // Check if phone is verified
  const isVerified = Boolean(
    user?.is_phone_verified && 
    user?.phone && 
    user.phone.replace(/[^0-9]/g, '').length >= 8
  );

  // Check snooze state from localStorage
  const [isSnoozed, setIsSnoozed] = useState<boolean>(() => {
    try {
      const snoozedUntil = localStorage.getItem('heatshield_phone_prompt_snoozed_until');
      if (snoozedUntil) {
        return Date.now() < parseInt(snoozedUntil, 10);
      }
    } catch {
      // fallback
    }
    return false;
  });

  const handleRemindLater = () => {
    // Snooze full banner for 4 hours, but keep compact ribbon active
    const snoozeTime = Date.now() + 4 * 60 * 60 * 1000;
    try {
      localStorage.setItem('heatshield_phone_prompt_snoozed_until', snoozeTime.toString());
    } catch {
      // ignore
    }
    setIsSnoozed(true);
  };

  const handleReopen = () => {
    setIsSnoozed(false);
    onOpenPhoneModal();
  };

  // If verified, do not render anything
  if (isVerified) {
    return null;
  }

  // If snoozed, render an elegant, persistent compact indicator
  if (isSnoozed) {
    return (
      <aside 
        aria-label="Climate safety alert status"
        className={`w-full bg-gradient-to-r from-amber-50 via-sky-50 to-blue-50 border-b border-amber-200/80 px-4 py-1.5 transition-all duration-200 z-30 ${className}`}
      >
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-medium min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="truncate">
              <strong className="font-bold">WhatsApp Alert Inactive:</strong> Add & verify your number for urgent heatwave warnings.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReopen}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Verify Now</span>
            </button>
            <button
              onClick={() => setIsSnoozed(false)}
              className="text-[10px] text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer"
              title="Expand alert banner"
            >
              Details
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Full prominent compulsory alert banner
  return (
    <aside 
      aria-label="Critical climate safety WhatsApp alert prompt"
      className={`w-full bg-gradient-to-r from-[#EFF6FF] via-[#F0FDF4] to-[#EFF6FF] border-b-2 border-blue-400/30 px-4 sm:px-6 py-3 shadow-[0_4px_20px_-4px_rgba(30,96,242,0.12)] relative z-30 animate-fade-in ${className}`}
    >
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        
        {/* Left Side: Alert Badge & Compulsory Warning Text */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                Action Required
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-emerald-600" />
                <span>Official WhatsApp Safety Gateway</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
              ⚠️ <strong className="font-bold text-slate-950">Critical Climate Safety Alert:</strong> Please add and verify your WhatsApp number to receive official HeatShield AI early heatwave warnings and morning reports.
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0 pt-1 md:pt-0">
          <button
            onClick={handleRemindLater}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            Remind Later
          </button>

          <button
            onClick={onOpenPhoneModal}
            className="group inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200 transform active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>Add Number Now</span>
            <ArrowRight className="w-3.5 h-3.5 text-white/80 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default CompulsoryPhoneAlertBanner;
