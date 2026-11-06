import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck, CheckCircle2, HeartHandshake, Sparkles, Clock, Shield } from 'lucide-react';
import { mockDb } from '../../lib/mockDb';
import { WelfareCheckin } from '../../types';

interface ConfirmSafeCelebrationProps {
  userName?: string;
  userId?: string;
  localityName?: string;
  className?: string;
}

export const ConfirmSafeCelebration: React.FC<ConfirmSafeCelebrationProps> = ({
  userName = 'Resident',
  userId = 'current_user',
  localityName = 'Local Ward',
  className = '',
}) => {
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Initialize verified safe state from localStorage or mockDb to prevent duplicates
  const [isSafeConfirmed, setIsSafeConfirmed] = useState<boolean>(() => {
    try {
      // 1. Check local storage
      const stored = localStorage.getItem('heatshield_safe_status_today');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === todayDateStr || parsed.dateString === new Date().toDateString()) {
          return true;
        }
      }

      // 2. Check mockDb checkins
      const checkins = mockDb.getCheckins();
      const existing = checkins.find(
        c => (c.scheduled_for === todayDateStr || c.completed_at?.startsWith(todayDateStr)) && 
             (c.safety_confirmed || c.status === 'completed')
      );
      if (existing) {
        return true;
      }
    } catch (err) {
      console.warn('Error reading check-in status:', err);
    }
    return false;
  });

  const [confirmedTime, setConfirmedTime] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('heatshield_safe_status_today');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.time || '12:00 PM';
      }
      const checkins = mockDb.getCheckins();
      const existing = checkins.find(
        c => (c.scheduled_for === todayDateStr || c.completed_at?.startsWith(todayDateStr)) && 
             (c.safety_confirmed || c.status === 'completed')
      );
      if (existing && existing.completed_at) {
        const d = new Date(existing.completed_at);
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      }
    } catch {}
    return '';
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmSafe = () => {
    if (isSafeConfirmed || isSubmitting) return; // Prevent duplicate check-ins
    setIsSubmitting(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    // 1. Trigger celebratory confetti feedback
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.62 },
        colors: ['#10B981', '#34D399', '#3B82F6', '#F59E0B', '#6EE7B7'],
      });
    } catch (e) {
      console.warn('Confetti feedback error:', e);
    }

    // 2. Persist actual checkin to mockDb
    const newCheckin: WelfareCheckin = {
      id: `checkin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      resident_id: userId,
      resident_name: userName,
      scheduled_for: todayDateStr,
      status: 'completed',
      safety_confirmed: true,
      hydration_adequate: true,
      cooling_accessible: true,
      checkin_notes: "Daily heat safety check: Resident confirmed feeling okay and safe in today's heat.",
      completed_at: now.toISOString(),
      created_at: now.toISOString(),
      locality_name: localityName,
    };

    try {
      mockDb.addCheckin(newCheckin);
    } catch (err) {
      console.warn('Could not save checkin to mockDb:', err);
    }

    // 3. Persist to local storage to prevent duplicate check-ins for today
    try {
      localStorage.setItem(
        'heatshield_safe_status_today',
        JSON.stringify({
          date: todayDateStr,
          dateString: now.toDateString(),
          time: timeStr,
          timestamp: now.toISOString(),
          confirmed: true,
          checkinId: newCheckin.id,
        })
      );
    } catch (err) {
      console.warn('Could not save checkin to localStorage:', err);
    }

    setConfirmedTime(timeStr);
    setIsSafeConfirmed(true);
    setIsSubmitting(false);
  };

  return (
    <div className={`transition-all duration-300 ${className}`}>
      {isSafeConfirmed ? (
        /* Verified Confirmation State (Prevents duplicate check-ins for today) */
        <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border border-emerald-200/90 rounded-[24px] p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1),0_1px_3px_0_rgba(16,185,129,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25">
              <CheckCircle2 className="w-6 h-6 animate-scale-up" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Daily heat safety check
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  VERIFIED • Today at {confirmedTime || 'Just now'}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Thank you for checking in. You confirmed feeling okay in today's heat. Your wellness record has been securely logged in the community registry.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-emerald-200/80 text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Status active for today</span>
            </div>
          </div>
        </div>
      ) : (
        /* Unchecked State: Clean, calm, prominent card */
        <div className="bg-white rounded-[24px] border border-[#E5EDF5] p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06),0_1px_3px_0_rgba(15,23,42,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <HeartHandshake className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Daily heat safety check
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold">
                  PENDING TODAY
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Are you feeling okay in today's heat?
              </p>
              <p className="text-[11px] text-slate-400 font-normal">
                One-tap wellness confirmation shared with health coordinators and family circle.
              </p>
            </div>
          </div>

          {/* Action button: [ I'm safe ] */}
          <button
            onClick={handleConfirmSafe}
            disabled={isSubmitting}
            className="self-stretch sm:self-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all btn-press shrink-0 cursor-pointer"
            aria-label="Confirm I am safe"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-100" />
            <span>I'm safe</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ConfirmSafeCelebration;
