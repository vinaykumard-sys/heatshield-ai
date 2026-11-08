import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Download, 
  Smartphone, 
  ShieldCheck, 
  Flame, 
  Navigation, 
  PhoneCall, 
  Copy, 
  Check, 
  Sparkles, 
  QrCode, 
  FileCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>('');

  const apkUrl = '/downloads/HeatShield-AI.apk';
  const apkFileName = 'HeatShield-AI-v1.1.0.apk';
  const apkVersion = 'v1.1.0';
  const apkSize = '1.3 MB';
  const releaseDate = 'November 2026';

  // Generate full scannable URL and QR code
  useEffect(() => {
    if (!isOpen) return;

    const fullUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${apkUrl}`
      : `https://heatshield-ai.vercel.app${apkUrl}`;

    QRCode.toString(fullUrl, {
      type: 'svg',
      margin: 1,
      width: 180,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((svg) => {
        setQrSvg(svg);
      })
      .catch((err) => {
        console.error('Failed to generate APK QR code:', err);
      });
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCopyLink = () => {
    const fullUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${apkUrl}`
      : `https://heatshield-ai.vercel.app${apkUrl}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1250] overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-download-modal-title"
    >
      {/* Click outside backdrop */}
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="bg-white border border-slate-200 w-full max-w-lg sm:max-w-2xl md:max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 relative m-3 sm:m-0">
        
        {/* Header with vibrant blue brand gradient */}
        <div className="relative px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0 shadow-sm overflow-hidden">
          {/* Subtle decorative glow circles */}
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-10 w-44 h-44 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/25 shadow-inner">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  Android APK
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Official Build
                </span>
              </div>
              <h2 id="app-download-modal-title" className="text-lg sm:text-2xl font-black tracking-tight text-white mt-0.5">
                Get HeatShield AI on Android
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative z-10 p-2 rounded-2xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close download modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="p-4 sm:p-7 space-y-5 sm:space-y-6 overflow-y-auto overscroll-contain bg-slate-50/50">
          
          {/* App Specs Badge Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-3">
              <BrandLogo size="sm" showBadge={false} />
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>HeatShield AI Mobile</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
                    {apkVersion}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Release: {releaseDate} • Universal ARM64 &amp; x86_64
                </div>
              </div>
            </div>

            {/* Android Compatibility & Size Badges */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                <svg className="w-3.5 h-3.5 text-emerald-600 fill-current" viewBox="0 0 24 24">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0001s.4482-.9997.9993-.9997c.5516 0 .9997.4482.9997.9997 0 .5515-.4481 1.0001-.9997 1.0001m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0001s.4482-.9997.9993-.9997c.5516 0 .9997.4482.9997.9997 0 .5515-.4481 1.0001-.9997 1.0001m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.411 13.856 8.125 12 8.125c-1.856 0-3.5902.286-5.1368.8247L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.152 5676l1.9972 3.4592C2.6889 11.1867.3432 14.6589 0 18.7917h24c-.3432-4.1328-2.6889-7.605-6.1185-9.4703" />
                </svg>
                <span>Android 7.0+ (API 24+)</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>{apkSize}</span>
              </span>
            </div>
          </div>

          {/* Main 2-Column Grid: Features & Direct CTA vs Interactive QR Code */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Left: Key Features & Primary Download Action */}
            <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Core Mobile Capabilities
                </h3>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Real-Time Heat Risk &amp; Wet Bulb Alerts
                      </div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        Hyperlocal WBGT thresholds and proactive push warnings before extreme thermal spikes.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        OSRM Heat-Safe Route Navigation
                      </div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        Tree-canopy shaded pedestrian navigation and low-exposure travel path planner.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        1-Tap SOS Emergency Dispatch (1070)
                      </div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        One-click emergency caller transmitting your GPS coordinates to state disaster control rooms.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Verified Civic Cooling Centres &amp; Water Stations
                      </div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        Live crowd-verified shelters, drinking water kiosks, and medical first-aid hubs.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Direct Download CTA Button */}
              <div className="pt-2">
                <a
                  href={apkUrl}
                  download={apkFileName}
                  className="w-full group flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all transform active:scale-[0.98] cursor-pointer"
                  id="direct-apk-download-btn"
                >
                  <Download className="w-5 h-5 text-white group-hover:translate-y-0.5 transition-transform" />
                  <span>Download HeatShield AI APK ({apkSize})</span>
                </a>
                <div className="text-center text-[11px] text-slate-400 mt-2">
                  Direct package installer • Virus &amp; malware verified clean
                </div>
              </div>
            </div>

            {/* Right: Scan QR Code & Phone Installation */}
            <div className="md:col-span-5 flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wide border border-blue-100 mb-2">
                  <QrCode className="w-3 h-3 text-blue-600" />
                  <span>Scan to Download</span>
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Scan with Phone Camera
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Point your smartphone camera at the code below to open the download link immediately.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="relative mx-auto p-3.5 bg-white rounded-2xl border-2 border-dashed border-blue-200 shadow-inner max-w-[210px] flex items-center justify-center min-h-[190px]">
                {qrSvg ? (
                  <div 
                    className="w-44 h-44 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:rounded-lg"
                    dangerouslySetInnerHTML={{ __html: qrSvg }} 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 text-xs gap-2 py-6">
                    <QrCode className="w-8 h-8 animate-pulse text-blue-500" />
                    <span>Generating QR Code...</span>
                  </div>
                )}
                
                {/* Floating mini badge in center of QR */}
                <div className="absolute inset-0 m-auto w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md border-2 border-white pointer-events-none">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
              </div>

              {/* Copy Direct Link button */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
                title="Copy download link to clipboard"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Link Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy APK Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3 Simple Installation Steps Guide */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/60 via-slate-50 to-indigo-50/60 border border-blue-100/80">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
              <span>Quick 3-Step Installation Guide</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span className="text-xs font-bold text-slate-800">Download APK</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Tap &ldquo;Download HeatShield AI APK&rdquo; or scan the QR code using your phone camera.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span className="text-xs font-bold text-slate-800">Tap File &amp; Allow</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Open the downloaded file. When prompted, toggle &ldquo;Allow from this source&rdquo; in settings.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span className="text-xs font-bold text-slate-800">Open HeatShield</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Tap &ldquo;Install&rdquo; and launch HeatShield AI to enable real-time heat defense and alerts!
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>HeatShield AI Mobile Edition • Clean &amp; Ad-Free</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default AppDownloadModal;
