import React from 'react';
import { ExternalLink, Info, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-obsidian-950 border-t border-white/[0.08] text-slate-400 text-xs mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <BrandLogo size="md" showBadge={true} />
            <p className="text-slate-400 leading-relaxed text-xs pt-1">
              AI-Powered Hyperlocal Heat Risk Prediction & Community Protection Platform for India.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] text-slate-300 border border-white/[0.08] text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                SYSTEM OPERATIONAL
              </span>
            </div>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="font-mono font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors">Risk Console</Link>
              </li>
              <li>
                <Link to="/map" className="text-slate-400 hover:text-white transition-colors">AI Heat Risk Map</Link>
              </li>
              <li>
                <Link to="/requests" className="text-slate-400 hover:text-white transition-colors">Assistance Dispatch</Link>
              </li>
              <li>
                <Link to="/portal" className="text-slate-400 hover:text-white transition-colors">Citizen Safety Portal</Link>
              </li>
              <li>
                <Link to="/analytics" className="text-slate-400 hover:text-white transition-colors">Analytics & Reports</Link>
              </li>
            </ul>
          </div>

          {/* Guidelines & Sourced Data */}
          <div>
            <h4 className="font-mono font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Telemetry & Frameworks
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <span className="text-slate-300">NDMA Heat Wave Action Guidelines</span>
              </li>
              <li>
                <span className="text-slate-300">Open-Meteo & IMD Observational Telemetry</span>
              </li>
              <li>
                <span className="text-slate-300">Urban Heat Island (UHI) Indexing</span>
              </li>
              <li>
                <span className="text-slate-300">Trilingual: English • हिन्दी • ಕನ್ನಡ</span>
              </li>
            </ul>
          </div>

          {/* Legal & Medical Notice */}
          <div>
            <h4 className="font-mono font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Public Safety Notice
            </h4>
            <div className="p-3.5 bg-obsidian-900 border border-white/[0.08] rounded-xl space-y-1.5 shadow-card">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Non-Clinical Notice</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                HeatShield AI estimates environmental risk and vulnerability factors. It does not provide medical diagnoses or replace emergency medical rescue (Dial 108 / 112).
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} HeatShield AI. Open Public Safety Infrastructure.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Framework</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Citizen Consent Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
