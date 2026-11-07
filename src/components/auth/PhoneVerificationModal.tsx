import React from 'react';
import { X, MessageCircle } from 'lucide-react';
import { PhoneOtpAuthCard } from './PhoneOtpAuthCard';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  required?: boolean;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  isOpen,
  onClose,
  required = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
        {!required && onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Official Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-inner">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                HeatShield AI
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
              Official Mobile Verification
            </h3>
          </div>
        </div>

        {/* Embedded Phone OTP Card */}
        <PhoneOtpAuthCard
          isModal={true}
          onSuccess={() => {
            if (onClose) onClose();
          }}
        />
      </div>
    </div>
  );
};

export default PhoneVerificationModal;
