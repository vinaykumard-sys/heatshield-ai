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
  Navigation
} from 'lucide-react';
import { HeatRiskMap } from '../components/map/HeatRiskMap';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { FullLocationReportModal } from '../components/map/FullLocationReportModal';
import { mockDb } from '../lib/mockDb';
import { LocationZone, LocationHeatReport, GeocodedPlace } from '../types';
import { Card } from '../components/common/Card';
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
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Location Bar */}
      <LocationTrackerBar />

      {/* Header (Section 19: Heat Map • Live conditions around you) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#1E60F2]" />
            <span>Heat Map</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Live conditions around you: verified water points, cooling shelters, and medical facilities
          </p>
        </div>

        {/* Quick shortcut pills */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <Link
            to="/water-stations"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-[#1E60F2] text-xs font-semibold hover:bg-blue-100 transition-colors btn-press"
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Water ATMs</span>
          </Link>
          <Link
            to="/cooling-centres"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors btn-press"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Cooling Shelters</span>
          </Link>
          <Link
            to="/hospital-directory"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors btn-press"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Hospitals</span>
          </Link>
          <Link
            to="/safe-routes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-800 text-xs font-semibold hover:bg-cyan-100 transition-colors btn-press"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Safe Routes</span>
          </Link>
        </div>
      </div>

      {/* Main Interactive Map (occupies significant space, soft rounded-[28px]) */}
      <HeatRiskMap
        locations={locations}
        className="h-[520px] sm:h-[620px] lg:h-[720px] rounded-[28px] border border-[#E5EDF5] shadow-[0_12px_40px_-8px_rgba(15,23,42,0.08)] overflow-hidden bg-white"
      />

      {/* Clean Legend & Guidance Card */}
      <div className="p-4 sm:p-5 bg-white border border-[#E5EDF5] rounded-[24px] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-600 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1E60F2] ring-2 ring-blue-100 animate-pulse" />
          <span className="font-medium text-slate-700">
            Click anywhere on the map or type in search to view hyperlocal heat index, air temp, and nearby shelters.
          </span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 text-xs font-semibold flex-wrap">
          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Low &lt;25</span>
          <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Moderate 25–49</span>
          <span className="text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">High 50–74</span>
          <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 font-bold">Critical &ge;75</span>
        </div>
      </div>

      {/* Recent Location Reports & Bookmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports List */}
        <div className="lg:col-span-2 bg-white border border-[#E5EDF5] rounded-[28px] p-6 shadow-[0_6px_25px_rgba(15,23,42,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Recent Area Assessments
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {reports.length} Generated
            </span>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-[#E5EDF5] rounded-2xl text-slate-400 text-xs space-y-1">
              <Compass className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">No Location Reports Generated Yet</p>
              <p className="text-[11px] text-slate-400">
                Click any point on the map to generate a live neighborhood report.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {reports.slice(0, 6).map((rep) => (
                <div 
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className="p-3.5 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] hover:bg-slate-100/60 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
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
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rep.risk_score >= 75 ? 'bg-red-50 text-red-700' :
                      rep.risk_score >= 50 ? 'bg-orange-50 text-orange-700' :
                      rep.risk_score >= 25 ? 'bg-amber-50 text-amber-700' :
                      'bg-emerald-50 text-emerald-700'
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
        <div className="bg-white border border-[#E5EDF5] rounded-[28px] p-6 shadow-[0_6px_25px_rgba(15,23,42,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Bookmarked Places
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {favoritePlaces.length} Saved
            </span>
          </div>

          {favoritePlaces.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-[#E5EDF5] rounded-2xl text-slate-400 text-xs space-y-1">
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
                  className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] flex items-center justify-between gap-2 text-xs"
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
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
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
