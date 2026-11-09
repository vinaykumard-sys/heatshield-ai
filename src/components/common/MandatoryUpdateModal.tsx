import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Lock, 
  Compass, 
  RefreshCw,
  QrCode,
  Copy,
  Check
} from 'lucide-react';
import QRCode from 'qrcode';
import { VersionCheckResult, DEFAULT_DOWNLOAD_URL } from '../../lib/versionService';

export interface MandatoryUpdateModalProps {
  isOpen: boolean;
  updateInfo?: Partial<VersionCheckResult> | null;
}

export const MandatoryUpdateModal: React.FC<MandatoryUpdateModalProps> = ({
  isOpen,
  updateInfo,
}) => {
  const [qrSvg, setQrSvg] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const installedVersion = updateInfo?.installedVersion || '1.0.2';
  const minimumVersion = updateInfo?.minimumVersion || '1.2.0';
  const latestVersion = updateInfo?.latestVersion || '1.2.0';
  const downloadUrl = updateInfo?.downloadUrl || DEFAULT_DOWNLOAD_URL;

  // Generate QR code for mobile scanning fallback
  useEffect(() => {
    if (!isOpen || dismissed) return;

    QRCode.toString(downloadUrl, {
      type: 'svg',
      margin: 1,
      width: 140,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((svg) => setQrSvg(svg))
      .catch((err) => console.warn('QR generation error:', err));
  }, [isOpen, dismissed, downloadUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.warn('Failed to copy link:', err);
    }
  };

  const handleDirectDownload = () => {
    // Immediate native download trigger
    window.location.href = downloadUrl;
  };

  if (!isOpen || dismissed) return null;

  return (
    <AnimatePresence>
      <div 
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="mandatory-update-title"
        aria-describedby="mandatory-update-desc"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/85 backdrop-blur-xl selection:bg-blue-600 selection:text-white"
      >
        {/* Subtle Ambient Background Flare */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-amber-500/10 rounded-full blur-[100px]" />
        </div>

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg my-auto bg-white rounded-3xl shadow-[0_32px_80px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.15)] border border-slate-200/80 overflow-hidden text-slate-800"
        >
          {/* Top Banner Accent */}
          <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-blue-600" />

          <div className="p-6 sm:p-8">
            {/* HeatShield AI Branded Emblem with Animated Update Badge */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-5">
                {/* Glowing Outer Ring */}
                <div className="absolute -inset-2.5 rounded-full bg-gradient-to-r from-blue-600 to-amber-500 opacity-30 blur-md animate-pulse" />
                
                {/* Emblem Icon */}
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 p-0.5 shadow-xl flex items-center justify-center ring-4 ring-white">
                  <div className="w-full h-full rounded-[14px] bg-[#0A1428] flex flex-col items-center justify-center relative overflow-hidden">
                    <ShieldAlert className="w-9 h-9 text-amber-400 mb-0.5 animate-bounce" style={{ animationDuration: '2.5s' }} />
                    <span className="text-[10px] font-black tracking-widest text-blue-200 uppercase">HEATSHIELD</span>
                  </div>
                </div>

                {/* Animated Badge */}
                <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow-md border-2 border-white flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  v{latestVersion}
                </div>
              </div>

              {/* Title */}
              <h2 
                id="mandatory-update-title"
                className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-slate-900"
              >
                Mandatory Update Required
              </h2>

              {/* Version Comparison Pill */}
              <div className="mt-2.5 inline-flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                <span className="text-slate-500">Installed Version:</span>
                <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                  v{installedVersion}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">Required Version:</span>
                <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  v{minimumVersion}
                </span>
              </div>

              <p 
                id="mandatory-update-desc"
                className="mt-3 text-sm text-slate-600 max-w-sm leading-relaxed"
              >
                A critical platform upgrade is ready. To maintain uninterrupted life-saving alerts and map accuracy, updating your application is mandatory.
              </p>
            </div>

            {/* Summary of Major Fixes in v1.1.0 */}
            <div className="mt-6 rounded-2xl bg-gradient-to-b from-slate-50 to-blue-50/40 p-4 border border-blue-100/80 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  What's New in Version {latestVersion}
                </h3>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="shrink-0 p-1 rounded-md bg-blue-100 text-blue-700 mt-0.5 font-bold">
                    ⚡
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">Fully responsive</span> mobile, tablet & desktop layout
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="shrink-0 p-1 rounded-md bg-emerald-100 text-emerald-700 mt-0.5 font-bold">
                    🔒
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">Enhanced secure</span> login-first authentication
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="shrink-0 p-1 rounded-md bg-indigo-100 text-indigo-700 mt-0.5 font-bold">
                    🗺️
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">Turn-by-turn road navigation</span> & real-time heat canopy corridors
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="shrink-0 p-1 rounded-md bg-amber-100 text-amber-700 mt-0.5 font-bold">
                    📱
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">Universal Android compatibility</span> (Android 7.0 to 14+) & crash-free performance
                  </div>
                </li>
              </ul>
            </div>

            {/* Big Prominent Action Button: [ UPDATE NOW (APK) ] */}
            <div className="mt-6 flex flex-col gap-3">
              <a
                href={downloadUrl}
                download="HeatShield-AI.apk"
                onClick={handleDirectDownload}
                className="group relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-3 shadow-[0_12px_28px_-6px_rgba(37,99,235,0.45)] hover:shadow-[0_16px_36px_-6px_rgba(37,99,235,0.6)] active:scale-[0.98] transition-all duration-200 select-none overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Download className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                <span>UPDATE NOW (APK)</span>
              </a>

              {/* Optional dismiss for testing / reviewer verification */}
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Live Dashboard (Preview / Testing)</span>
              </button>

              {/* Secondary Helper Controls: Scan QR / Copy Direct Link */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 px-1">
                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  className="inline-flex items-center gap-1.5 hover:text-blue-600 font-medium transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-slate-400" />
                  <span>{showQr ? 'Hide QR Code' : 'Scan QR from Phone'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 hover:text-blue-600 font-medium transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied APK URL!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Download Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Collapsible QR Code Viewer */}
              {showQr && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center text-center"
                >
                  {qrSvg ? (
                    <div 
                      className="p-2 bg-white rounded-xl shadow-xs border border-slate-200"
                      dangerouslySetInnerHTML={{ __html: qrSvg }} 
                    />
                  ) : (
                    <div className="w-[140px] h-[140px] bg-slate-200 animate-pulse rounded-xl" />
                  )}
                  <p className="mt-2 text-[11px] text-slate-500 font-medium">
                    Point your camera to download directly onto your device
                  </p>
                </motion.div>
              )}
            </div>

            {/* Required Footnote Notice */}
            <p className="mt-5 text-[11px] text-center text-slate-500 leading-normal border-t border-slate-100 pt-3">
              This update is required to ensure accurate heatwave alerts, real-road navigation, and uninterrupted security protection.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
