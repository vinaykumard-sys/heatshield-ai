import React, { useState } from 'react';
import { Compass, Info } from 'lucide-react';
import { HeatRiskMap } from '../components/map/HeatRiskMap';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { mockDb } from '../lib/mockDb';
import { LocationZone } from '../types';

export const HeatRiskMapPage: React.FC = () => {
  const locations = mockDb.getLocations();
  const [selectedLoc, setSelectedLoc] = useState<LocationZone | undefined>(locations[0]);

  return (
    <div className="space-y-4 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Hyperlocal Device Location Tracker & Command Bar */}
      <LocationTrackerBar />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">AI Heat Risk Map</h1>
            <span className="text-[10px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
              GEOSPATIAL RADAR
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Geospatial visualization of Indian urban microclimates, thermal absorption zones, and community vulnerability hotspots.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Compass className="w-4 h-4 text-blue-600" />
          <span>Covering Bengaluru, Delhi & major urban zones</span>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <HeatRiskMap
        locations={locations}
        selectedLocationId={selectedLoc?.id}
        onSelectLocation={(loc) => setSelectedLoc(loc)}
        className="h-[620px] sm:h-[680px] rounded-xl border border-slate-200 shadow-sm"
      />

      {/* Map Guidance Footer */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600 shadow-sm">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Map markers indicate active municipal monitoring zones. Colored circles represent modeled heat absorption and urban heat island (UHI) exposure radius.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono">
          <span className="text-emerald-700 font-semibold">● Low &lt;38</span>
          <span className="text-amber-700 font-semibold">● Moderate 38-61</span>
          <span className="text-orange-700 font-semibold">● High 62-79</span>
          <span className="text-red-700 font-semibold">● Critical &ge;80</span>
        </div>
      </div>
    </div>
  );
};
