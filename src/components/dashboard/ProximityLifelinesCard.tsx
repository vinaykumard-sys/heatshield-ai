import React from 'react';
import { Link } from 'react-router-dom';
import { Droplets, Building2, Stethoscope, Navigation, Phone, ChevronRight } from 'lucide-react';
import { WaterStation, CoolingCentre, HospitalResource } from '../../types';

interface ProximityLifelinesCardProps {
  nearestWater: (WaterStation & { distKm?: number }) | null;
  nearestCooling: (CoolingCentre & { distKm?: number }) | null;
  nearestHospital: (HospitalResource & { distKm?: number }) | null;
  onOpenEmergencyModal?: () => void;
  className?: string;
}

function formatDist(distKm?: number): string {
  if (distKm === undefined) return 'Nearby';
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)}m`;
  }
  return `${distKm.toFixed(1)}km`;
}

export const ProximityLifelinesCard: React.FC<ProximityLifelinesCardProps> = ({
  nearestWater,
  nearestCooling,
  nearestHospital,
  onOpenEmergencyModal,
  className = '',
}) => {
  const lifelines = [
    {
      id: 'water',
      type: 'Water ATM',
      name: nearestWater?.name || 'Municipal Water ATM Point',
      address: nearestWater?.address || 'Filtered drinking water dispenser',
      dist: formatDist(nearestWater?.distKm),
      icon: Droplets,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200/60',
      badgeColor: 'bg-blue-50 text-blue-700',
      link: '/water-stations',
      actionLabel: 'Find ATM',
    },
    {
      id: 'cooling',
      type: 'Cooling Shelter',
      name: nearestCooling?.name || 'Community Climate Cooling Centre',
      address: nearestCooling?.address || 'Air-conditioned public relief center',
      dist: formatDist(nearestCooling?.distKm),
      icon: Building2,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200/60',
      badgeColor: 'bg-emerald-50 text-emerald-700',
      link: '/cooling-centres',
      actionLabel: 'Visit Centre',
    },
    {
      id: 'hospital',
      type: 'Heat Emergency Hospital',
      name: nearestHospital?.name || 'District General Hospital',
      address: nearestHospital?.address || '24/7 Heat stroke ICU & saline ward',
      dist: formatDist(nearestHospital?.distKm),
      icon: Stethoscope,
      iconColor: 'text-rose-500',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200/60',
      badgeColor: 'bg-rose-50 text-rose-700',
      link: '/hospitals',
      actionLabel: 'Emergency Ward',
    },
  ];

  return (
    <div className={`bg-white rounded-[24px] border border-[#E5EDF5] p-5 shadow-xs hover:-translate-y-1 transition-all duration-300 space-y-3.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[#1E60F2] shadow-xs">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Proximity Lifelines</h3>
            <p className="text-[11px] text-slate-500">Closest verified critical facilities</p>
          </div>
        </div>

        {onOpenEmergencyModal && (
          <button
            onClick={onOpenEmergencyModal}
            className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors flex items-center gap-1 btn-press"
          >
            <Phone className="w-3 h-3" />
            <span>SOS 108</span>
          </button>
        )}
      </div>

      {/* Lifeline items */}
      <div className="space-y-2.5">
        {lifelines.map((item) => {
          const IconComp = item.icon;
          return (
            <Link
              key={item.id}
              to={item.link}
              className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E9F0FA] hover:bg-white hover:border-blue-200 hover:shadow-xs transition-all duration-200 flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-xl ${item.bgColor} border ${item.borderColor} flex items-center justify-center ${item.iconColor} shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {item.type}
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-slate-700">
                      {item.dist}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-[#1E60F2] transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {item.address}
                  </p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1E60F2] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ProximityLifelinesCard;
