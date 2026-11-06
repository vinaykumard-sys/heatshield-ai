import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
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
  AlertTriangle,
  Building2,
  Droplets,
  Stethoscope,
  Navigation,
  PhoneCall
} from 'lucide-react';
import { HeatRiskMap } from '../components/map/HeatRiskMap';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { NearbyHelpCards } from '../components/dashboard/NearbyHelpCards';
import { FullLocationReportModal } from '../components/map/FullLocationReportModal';
import { mockDb } from '../lib/mockDb';
import { LocationHeatReport, GeocodedPlace } from '../types';
import { formatTimeAgo } from '../lib/utils';

export const HeatRiskMapPage: React.FC = () => {
  const locations = mockDb.getLocations();
  const [reports, setReports] = useState<LocationHeatReport[]>(() => mockDb.getLocationReports());
  const [favoritePlaces, setFavoritePlaces] = useState<GeocodedPlace[]>(() => mockDb.getFavoritePlaces());
  const [selectedReport, setSelectedReport] = useState<LocationHeatReport | null>(null);

  useEffect(() => {
    const syncReports = () => {
      setReports(mockDb.getLocationReports());
      setFavoritePlaces(mockDb.getFavoritePlaces());
    };
    window.addEventListener('focus', syncReports);
    const interval = setInterval(syncReports, 5000);
    return () => {
      window.removeEventListener('focus', syncReports);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-3 sm:px-4">
      {/* Location Bar */}
      <LocationTrackerBar />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#1E60F2]" />
            <span>Smart Heat Map & Safety Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time conditions, verified water points, cooling shelters, and emergency lifelines
          </p>
        </div>

        {/* Quick Lifeline Directory Shortcut Pills */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <Link
            to="/water-stations"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-blue-200/80 bg-blue-50/80 text-[#1E60F2] text-xs font-bold hover:bg-blue-100 transition-colors shadow-2xs btn-press"
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Water ATMs</span>
          </Link>
          <Link
            to="/cooling-centres"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-2xs btn-press"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Cooling Shelters</span>
          </Link>
          <Link
            to="/hospital-directory"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-rose-200/80 bg-rose-50/80 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors shadow-2xs btn-press"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Emergency ICUs</span>
          </Link>
          <Link
            to="/safe-routes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-cyan-200/80 bg-cyan-50/80 text-cyan-800 text-xs font-bold hover:bg-cyan-100 transition-colors shadow-2xs btn-press"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Safe Corridors</span>
          </Link>
        </div>
      </div>

      {/* Main Interactive Smart Map (rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white) */}
      <HeatRiskMap
        locations={locations}
        className="h-[540px] sm:h-[640px] lg:h-[740px] rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white"
      />

      {/* Nearby Help & Lifeline Directory Section */}
      <NearbyHelpCards />

      {/* Recent Location Reports & Bookmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Area Assessments */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-blue-50 text-[#1E60F2] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Recent Neighborhood Assessments
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium font-mono">
              {reports.length} Generated
            </span>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs space-y-1">
              <Compass className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">No Location Reports Generated Yet</p>
              <p className="text-[11px] text-slate-400">
                Click any coordinate on the map to generate a verified neighborhood assessment.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {reports.slice(0, 6).map((rep) => (
                <div 
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] hover:bg-slate-100/60 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {rep.location_name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {rep.city}, {rep.state} • {formatTimeAgo(rep.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-slate-900">{Math.round(rep.temperature)}°C</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      rep.risk_score >= 75 ? 'bg-red-50 text-red-700 border border-red-200' :
                      rep.risk_score >= 50 ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                      rep.risk_score >= 25 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {rep.risk_category.toUpperCase()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Favorites */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Bookmarked Places
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium font-mono">
              {favoritePlaces.length} Saved
            </span>
          </div>

          {favoritePlaces.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs space-y-1">
              <Heart className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">No Saved Places</p>
              <p className="text-[11px] text-slate-400">
                Tap the heart on any location card to save frequent places.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {favoritePlaces.map((place) => (
                <div
                  key={place.id}
                  className="p-3 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-bold text-slate-900 truncate">{place.displayName}</div>
                    <div className="text-[11px] text-slate-400 truncate">{place.city}, {place.state}</div>
                  </div>
                  <button
                    onClick={() => {
                      mockDb.toggleFavoritePlace(place);
                      setFavoritePlaces(mockDb.getFavoritePlaces());
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Modal Viewer for Generated Reports */}
      {selectedReport && (
        <FullLocationReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
};

export default HeatRiskMapPage;
