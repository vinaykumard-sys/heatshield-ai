import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Droplets, 
  Building2, 
  Stethoscope, 
  PhoneCall, 
  MapPin, 
  ArrowRight,
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
  if (distKm === undefined) return 'Nearby';
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
}

export const EmergencyHelpSection: React.FC<EmergencyHelpSectionProps> = ({
  nearestWater,
  nearestCooling,
  nearestHospital,
  onOpenEmergencyModal,
  stateName = 'Karnataka',
  className = '',
}) => {
  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-[#1E60F2]" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Nearby Help
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          Closest verified facilities
        </span>
      </div>

      {/* 3 Proximity Cards Grid (Section 21) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Water Card */}
        <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-blue-200 transition-colors">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                <span>Water</span>
              </span>
              <span className="text-xs font-bold text-slate-700 font-sans">
                {formatDist(nearestWater?.distKm)}
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {nearestWater?.name || 'Verified water point'}
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {nearestWater?.address || 'Drinking water ATM'}
              </p>
            </div>
          </div>
          <Link
            to="/water-stations"
            className="w-full py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E60F2] text-xs font-semibold text-center transition-colors btn-press"
          >
            Locate
          </Link>
        </div>

        {/* 2. Cooling Card */}
        <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-emerald-200 transition-colors">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span>Cooling</span>
              </span>
              <span className="text-xs font-bold text-slate-700 font-sans">
                {formatDist(nearestCooling?.distKm)}
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {nearestCooling?.name || 'Cooling shelter'}
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {nearestCooling?.address || 'Air-conditioned public haven'}
              </p>
            </div>
          </div>
          <Link
            to="/cooling-centres"
            className="w-full py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold text-center transition-colors btn-press"
          >
            View
          </Link>
        </div>

        {/* 3. Medical Card */}
        <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-red-200 transition-colors">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100 flex items-center gap-1">
                <Stethoscope className="w-3 h-3" />
                <span>Medical</span>
              </span>
              <span className="text-xs font-bold text-slate-700 font-sans">
                {formatDist(nearestHospital?.distKm)}
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {nearestHospital?.name || 'Emergency clinic'}
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {nearestHospital?.address || '24x7 emergency medical aid'}
              </p>
            </div>
          </div>
          <Link
            to="/hospital-directory"
            className="w-full py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold text-center transition-colors btn-press"
          >
            Directions
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmergencyHelpSection;
