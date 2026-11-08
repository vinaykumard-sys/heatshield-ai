import React from 'react';
import { Shield } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Verifying thermal defense credentials...' 
}) => {
  return (
    <div className="min-h-screen w-full bg-[#030712] flex flex-col items-center justify-center p-6 text-white select-none">
      <div className="relative flex items-center justify-center mb-6">
        {/* Ambient pulse glow */}
        <div className="absolute w-24 h-24 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
        <div className="absolute w-16 h-16 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        
        {/* Shield Icon */}
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1E60F2] to-blue-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(30,96,242,0.6)] border border-blue-400/40">
          <Shield className="w-6 h-6 fill-current animate-pulse text-white" />
        </div>
      </div>

      <div className="text-center space-y-2 max-w-xs">
        <h3 className="text-sm font-bold tracking-tight text-white flex items-center justify-center gap-2">
          <span>HeatShield</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-400/30">
            AI OS
          </span>
        </h3>
        <p className="text-xs text-blue-200/70 font-mono">
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
