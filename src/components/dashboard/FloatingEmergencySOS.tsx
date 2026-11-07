import React from 'react';
import { PhoneCall, AlertTriangle, ShieldAlert } from 'lucide-react';

interface FloatingEmergencySOSProps {
  onOpenEmergency: () => void;
  className?: string;
}

export const FloatingEmergencySOS: React.FC<FloatingEmergencySOSProps> = ({
  onOpenEmergency,
  className = '',
}) => {
  return (
    <div className={`fixed bottom-36 right-4 sm:bottom-22 sm:right-6 z-40 pointer-events-auto ${className}`}>
      <button
        onClick={onOpenEmergency}
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-extrabold text-xs shadow-xl shadow-red-500/35 hover:shadow-2xl hover:shadow-red-500/50 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/30"
        title="Immediate Heat Emergency Hotline & Ambulance (108 / 112)"
        aria-label="Emergency Heat SOS"
      >
        {/* Pulsing beacon glow ring */}
        <span className="absolute -inset-1 rounded-full bg-red-500/30 animate-ping pointer-events-none" />

        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <PhoneCall className="w-3.5 h-3.5 text-white animate-bounce" />
        </div>

        <span className="tracking-wider uppercase text-[11px] font-black drop-shadow-xs">
          Heat SOS 108
        </span>
      </button>
    </div>
  );
};

export default FloatingEmergencySOS;
