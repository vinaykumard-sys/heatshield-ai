import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  Flame, 
  Navigation, 
  PhoneCall, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { AppDownloadModal } from './AppDownloadModal';

export interface AppDownloadSectionProps {
  onOpenModal?: () => void;
  className?: string;
}

export const AppDownloadSection: React.FC<AppDownloadSectionProps> = ({
  onOpenModal,
  className = '',
}) => {
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  const handleOpen = () => {
    if (onOpenModal) {
      onOpenModal();
    } else {
      setInternalModalOpen(true);
    }
  };

  const apkUrl = '/downloads/HeatShield-AI.apk';
  const apkFileName = 'HeatShield-AI-v1.0.0.apk';
  const apkSize = '28.4 MB';

  return (
    <>
      <section 
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F224A] via-[#16356B] to-[#1E4280] text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-blue-400/20 ${className}`}
        aria-label="Download HeatShield AI Mobile App"
      >
        {/* Ambient atmospheric glows */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-10 top-1/2 w-48 h-48 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-7 space-y-5 text-left">
            {/* Top pill badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0001s.4482-.9997.9993-.9997c.5516 0 .9997.4482.9997.9997 0 .5515-.4481 1.0001-.9997 1.0001m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0001s.4482-.9997.9993-.9997c.5516 0 .9997.4482.9997.9997 0 .5515-.4481 1.0001-.9997 1.0001m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.411 13.856 8.125 12 8.125c-1.856 0-3.5902.286-5.1368.8247L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.152 5676l1.9972 3.4592C2.6889 11.1867.3432 14.6589 0 18.7917h24c-.3432-4.1328-2.6889-7.605-6.1185-9.4703" />
                </svg>
                <span>Android Release</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30">
                v1.0.0 • {apkSize}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium border border-white/20">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Offline Capable</span>
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Get HeatShield AI on Your Phone
              </h2>
              <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed max-w-xl">
                Stay protected outdoors. Download the official Android APK for real-time wet bulb warnings, tree-canopy heat-safe routing, and instant 1-tap emergency dispatch.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-100">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Real-Time Wet Bulb &amp; Heat Risk Alerts</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-blue-100">
                <Navigation className="w-4 h-4 text-sky-400 shrink-0" />
                <span>OSRM Shaded &amp; Heat-Safe Routes</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-blue-100">
                <PhoneCall className="w-4 h-4 text-rose-400 shrink-0" />
                <span>1-Tap SOS Emergency Dispatch (1070)</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-blue-100">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified Cooling Shelters &amp; Water Hubs</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <a
                href={apkUrl}
                download={apkFileName}
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-lg shadow-blue-950/40 hover:shadow-xl transition-all transform active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-700" />
                <span>Download APK ({apkSize})</span>
              </a>

              <button
                type="button"
                onClick={handleOpen}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-blue-200" />
                <span>Scan QR Code</span>
              </button>
            </div>
          </div>

          {/* Right Column: Visual Showcase Device Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[340px] rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-5 shadow-2xl space-y-4">
              
              {/* Device Header Bar */}
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">HeatShield Mobile</div>
                    <div className="text-[10px] text-blue-200">Android Application</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/30">
                  Ready
                </span>
              </div>

              {/* Mini Preview Mockup */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-blue-200">Active Heat Risk</div>
                    <div className="text-sm font-black text-amber-300">MODERATE (42 WBGT)</div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                </div>

                <div className="p-3 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-sky-300" />
                    <div>
                      <div className="text-xs font-semibold text-white">Shaded Route Active</div>
                      <div className="text-[10px] text-blue-200">82% Canopy Cover</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-300">12 min</span>
                </div>
              </div>

              {/* Install guide teaser */}
              <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-blue-200">
                <span className="text-[11px]">Direct Android APK</span>
                <button
                  type="button"
                  onClick={handleOpen}
                  className="font-bold text-white hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Install Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Internal modal fallback when onOpenModal is not supplied */}
      {!onOpenModal && (
        <AppDownloadModal
          isOpen={internalModalOpen}
          onClose={() => setInternalModalOpen(false)}
        />
      )}
    </>
  );
};

export default AppDownloadSection;
