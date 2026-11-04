import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  Info, 
  Clock, 
  Heart, 
  FileText, 
  Sparkles, 
  Thermometer, 
  Flame, 
  MapPin, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { HeatRiskMap } from '../components/map/HeatRiskMap';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { FullLocationReportModal } from '../components/map/FullLocationReportModal';
import { mockDb } from '../lib/mockDb';
import { LocationZone, LocationHeatReport, GeocodedPlace } from '../types';

export const HeatRiskMapPage: React.FC = () => {
  const locations = mockDb.getLocations();
  const [reports, setReports] = useState<LocationHeatReport[]>(() => mockDb.getLocationReports());
  const [favoritePlaces, setFavoritePlaces] = useState<GeocodedPlace[]>(() => mockDb.getFavoritePlaces());
  const [selectedReport, setSelectedReport] = useState<LocationHeatReport | null>(null);

  // Sync reports periodically or when focus returns
  useEffect(() => {
    const syncReports = () => {
      setReports(mockDb.getLocationReports());
      setFavoritePlaces(mockDb.getFavoritePlaces());
    };
    window.addEventListener('focus', syncReports);
    const interval = setInterval(syncReports, 6000);
    return () => {
      window.removeEventListener('focus', syncReports);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-5 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Hyperlocal Device Location Tracker & Command Bar */}
      <LocationTrackerBar />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Compass className="w-6 h-6 text-blue-600" />
              <span>Explore & Find Help</span>
            </h1>
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
              UNIFIED RESIDENT MAP
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Interactive heat safety radar combining verified drinking water ATMs, air-conditioned cooling centres, hospital emergency wards, and shaded transit corridors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/water-stations"
            className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors"
          >
            Water ATMs
          </Link>
          <Link
            to="/cooling-centres"
            className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
          >
            Cooling Centres
          </Link>
          <Link
            to="/hospital-directory"
            className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors"
          >
            Hospitals
          </Link>
          <Link
            to="/safe-routes"
            className="px-3 py-1.5 rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-800 text-xs font-bold hover:bg-cyan-100 transition-colors"
          >
            Safe Routes
          </Link>
        </div>
      </div>

      {/* Main Interactive Futuristic Map Canvas */}
      <HeatRiskMap
        locations={locations}
        className="h-auto lg:h-[740px] xl:h-[780px] rounded-2xl border border-slate-800 shadow-2xl"
      />

      {/* Map Guidance Footer */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600 shadow-sm">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <b>Interactive Instructions:</b> Click anywhere on the map or type in the top search bar to analyze any Indian coordinate. Red circles render strictly when ambient temperature exceeds 35.0°C.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono">
          <span className="text-emerald-700 font-semibold">● Low &lt;25</span>
          <span className="text-amber-700 font-semibold">● Moderate 25-49</span>
          <span className="text-orange-700 font-semibold">● High 50-74</span>
          <span className="text-red-700 font-semibold">● Critical &ge;75</span>
          <span className="text-red-600 font-bold pl-2 border-l border-slate-200">⚠️ &gt;35°C Red Circle</span>
        </div>
      </div>

      {/* =========================================================================
          RECENT LOCATION REPORTS & SAVED FAVORITES (FEATURE 10)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Generated Location Reports */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Recent Environmental Reports
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {reports.length} Generated
            </span>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
              <Compass className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-600" />
              <p className="font-semibold text-slate-600">No Location Reports Generated Yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click any coordinate on the map or search above to generate your first AI location report.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {reports.slice(0, 8).map(rep => (
                <div 
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all hover-elevate group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      rep.temperature > 35 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {rep.temperature.toFixed(0)}°C
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600 truncate">
                        {rep.location_name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                        <span>Risk: <b>{rep.risk_score.toFixed(0)}/100 ({rep.risk_category.toUpperCase()})</b></span>
                        <span>•</span>
                        <span>{new Date(rep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      rep.risk_category === 'critical' ? 'bg-red-100 text-red-700' :
                      rep.risk_category === 'high' ? 'bg-orange-100 text-orange-700' :
                      rep.risk_category === 'moderate' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {rep.risk_category}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Favorite Locations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <Heart className="w-4 h-4 fill-rose-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Bookmarked Localities
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {favoritePlaces.length} Saved
            </span>
          </div>

          {favoritePlaces.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
              <Heart className="w-7 h-7 mx-auto mb-2 opacity-30 text-rose-500" />
              <p className="font-semibold text-slate-600">No Saved Locations</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click the heart icon on any location report to save it here for instant monitoring.
              </p>
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto">
              {favoritePlaces.map(fav => (
                <div 
                  key={fav.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {fav.shortName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      {fav.city}, {fav.state}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      mockDb.toggleFavoritePlace(fav);
                      setFavoritePlaces(mockDb.getFavoritePlaces());
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Report Modal */}
      {selectedReport && (
        <FullLocationReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
};
