import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Droplets, 
  Building2, 
  Stethoscope, 
  PhoneCall, 
  MapPin, 
  ArrowRight,
  ShieldAlert,
  HeartPulse
} from 'lucide-react';
import { WaterStation, CoolingCentre, HospitalResource } from '../../types';

interface EmergencyHelpSectionProps {
  nearestWater: (WaterStation & { distKm?: number }) | null;
  nearestCooling: (CoolingCentre & { distKm?: number }) | null;
  nearestHospital: (HospitalResource & { distKm?: number }) | null;
  onOpenEmergencyModal: () => void;
  stateName?: string;
  className?: string;
}

function formatDist(distKm?: number): string {
  if (distKm === undefined) return '';
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m away`;
  }
  return `${distKm.toFixed(1)} km away`;
}

export const EmergencyHelpSection: React.FC<EmergencyHelpSectionProps> = ({
  nearestWater,
  nearestCooling,
  nearestHospital,
  onOpenEmergencyModal,
  stateName = 'Karnataka',
  className = '',
}) => {
  const isKarnataka = (stateName || '').toLowerCase().includes('karnataka');
  const helplineNum = isKarnataka ? '1070' : '1077';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Where to Find Help Nearby
            </h3>
            <p className="text-[11px] text-slate-500">
              Verified public water points, shaded sanctuaries, and emergency clinics
            </p>
          </div>
        </div>

        {/* SOS Action Button */}
        <button
          onClick={onOpenEmergencyModal}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all btn-interact self-start sm:self-auto"
        >
          <PhoneCall className="w-3.5 h-3.5 text-red-600 animate-pulse" />
          <span>Emergency Hotlines (108 / {helplineNum})</span>
        </button>
      </div>

      {/* 3 Proximity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nearest Water ATM */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex flex-col justify-between gap-3 hover:border-blue-200 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-100 font-mono">
                <Droplets className="w-3 h-3" />
                <span>Water ATM</span>
              </span>
              {nearestWater?.distKm !== undefined && (
                <span className="text-[11px] font-mono font-semibold text-slate-500">
                  {formatDist(nearestWater.distKm)}
                </span>
              )}
            </div>

            {nearestWater ? (
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {nearestWater.name}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {nearestWater.address}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-1">Searching nearby water stations...</p>
            )}
          </div>

          <Link
            to="/water-stations"
            className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors btn-interact"
          >
            <span>Locate Water</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Nearest Cooling Sanctuary */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex flex-col justify-between gap-3 hover:border-emerald-200 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-100 font-mono">
                <Building2 className="w-3 h-3" />
                <span>Cooling Shelter</span>
              </span>
              {nearestCooling?.distKm !== undefined && (
                <span className="text-[11px] font-mono font-semibold text-slate-500">
                  {formatDist(nearestCooling.distKm)}
                </span>
              )}
            </div>

            {nearestCooling ? (
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {nearestCooling.name}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {nearestCooling.address}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-1">Searching nearby cooling centers...</p>
            )}
          </div>

          <Link
            to="/cooling-centres"
            className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors btn-interact"
          >
            <span>View Shelter</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Nearest Hospital / Heatstroke Ward */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex flex-col justify-between gap-3 hover:border-red-200 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-100 font-mono">
                <Stethoscope className="w-3 h-3" />
                <span>Emergency Clinic</span>
              </span>
              {nearestHospital?.distKm !== undefined && (
                <span className="text-[11px] font-mono font-semibold text-slate-500">
                  {formatDist(nearestHospital.distKm)}
                </span>
              )}
            </div>

            {nearestHospital ? (
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {nearestHospital.name}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {nearestHospital.address}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-1">Searching nearby hospitals...</p>
            )}
          </div>

          <Link
            to="/hospital-directory"
            className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100/80 text-red-700 text-xs font-semibold border border-red-200 transition-colors btn-interact"
          >
            <span>Direct to Clinic</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmergencyHelpSection;
