import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  Droplets, 
  MapPin, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Filter, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  X,
  Droplet,
  Compass
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { WaterStation, WaterStationStatus, WaterType } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';

export const WaterStationsPage: React.FC = () => {
  const [stations, setStations] = useState<WaterStation[]>(() => mockDb.getWaterStations());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WaterStationStatus>('all');
  const [selectedStation, setSelectedStation] = useState<WaterStation | null>(null);

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [issueType, setIssueType] = useState<'empty' | 'broken' | 'unhygienic' | 'working_properly'>('empty');
  const [reportComment, setReportComment] = useState('');

  // Suggest Form
  const [newStationName, setNewStationName] = useState('');
  const [newStationAddress, setNewStationAddress] = useState('');
  const [newStationType, setNewStationType] = useState<WaterType>('mineral_water_atm');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const filteredStations = stations.filter(st => {
    const matchesSearch = st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.locality_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || st.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [13.0100, 77.6000],
      zoom: 12,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Map Markers on filter change
  useEffect(() => {
    const markers = markersRef.current;
    if (!markers) return;

    markers.clearLayers();

    filteredStations.forEach(st => {
      const isAvail = st.status === 'available';
      const isMaint = st.status === 'maintenance' || st.status === 'unavailable';
      const color = isAvail ? '#0284C7' : isMaint ? '#EF4444' : '#F59E0B';

      const icon = L.divIcon({
        html: `
          <div style="
            background: ${color};
            color: white;
            padding: 3px 7px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 3px;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 1.5px solid white;
            cursor: pointer;
          ">
            <span>💧</span>
            <span>${st.name.split(' ')[0]}</span>
          </div>
        `,
        className: 'water-atm-icon',
        iconSize: [85, 24],
        iconAnchor: [42, 12]
      });

      const m = L.marker([st.latitude, st.longitude], { icon }).addTo(markers);
      m.on('click', () => {
        setSelectedStation(st);
      });
    });
  }, [filteredStations]);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation) return;
    mockDb.reportWaterStation(selectedStation.id, issueType, reportComment);
    setStations(mockDb.getWaterStations());
    setShowReportModal(false);
    setReportComment('');
  };

  const handleSuggestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newWs: WaterStation = {
      id: `ws-${Date.now()}`,
      name: newStationName,
      address: newStationAddress,
      locality_name: 'Bengaluru Urban',
      city: 'Bengaluru',
      state: 'Karnataka',
      latitude: 13.0150 + (Math.random() - 0.5) * 0.05,
      longitude: 77.6050 + (Math.random() - 0.5) * 0.05,
      status: 'available',
      water_type: newStationType,
      operating_hours: '06:00 AM - 10:00 PM',
      free_access: true,
      price_per_litre: 0.00,
      wheelchair_accessible: true,
      reported_empty_count: 0,
      verified_by: 'Community Submitted (Pending Verification)',
      last_verified_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    mockDb.saveWaterStation(newWs);
    setStations(mockDb.getWaterStations());
    setShowSuggestModal(false);
    setNewStationName('');
    setNewStationAddress('');
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Droplets className="w-6 h-6 text-sky-600" />
              <span>Drinking Water Availability Tracker</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
              COMMUNITY VERIFIED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time public water ATMs, chilled dispensers, and crowdsourced empty/broken station reporting.
          </p>
        </div>

        <button
          onClick={() => setShowSuggestModal(true)}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Suggest New Water Point</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by locality, street or landmark..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          {(['all', 'available', 'limited', 'unavailable', 'maintenance'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Map & List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Map (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 text-xs">
            <span className="font-bold text-slate-700 font-mono flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-sky-600" />
              <span>Interactive Water Point Radar</span>
            </span>
            <span className="text-slate-400 font-mono text-[11px]">{filteredStations.length} Water Points Visible</span>
          </div>
          <div ref={mapContainerRef} className="w-full h-[460px]" />
        </div>

        {/* Stations Directory List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {filteredStations.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-xs">
              No water stations found matching your criteria.
            </div>
          ) : (
            filteredStations.map(st => {
              const isAvail = st.status === 'available';
              const isLim = st.status === 'limited';
              return (
                <div 
                  key={st.id}
                  onClick={() => {
                    setSelectedStation(st);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([st.latitude, st.longitude], 15);
                    }
                  }}
                  className={`p-4 rounded-xl border bg-white transition-all cursor-pointer hover:border-sky-300 shadow-xs ${
                    selectedStation?.id === st.id ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isAvail ? 'bg-emerald-100 text-emerald-800' :
                      isLim ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {st.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Verified {new Date(st.last_verified_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 mb-0.5">
                    {st.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-2 truncate">
                    {st.address}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg mb-2.5">
                    <div>⏰ Hours: <b>{st.operating_hours}</b></div>
                    <div>💧 Type: <b>{st.water_type.replace('_', ' ')}</b></div>
                    <div>♿ Accessible: <b>{st.wheelchair_accessible ? 'Yes' : 'No'}</b></div>
                    <div>🪙 Cost: <b>{st.free_access ? 'Free' : `₹${st.price_per_litre}/L`}</b></div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStation(st);
                        setShowReportModal(true);
                      }}
                      className="text-red-600 hover:text-red-700 font-bold text-[11px] flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Report Empty / Broken</span>
                    </button>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="px-2.5 py-1 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-[11px] flex items-center gap-1"
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && selectedStation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Report Water Station Status</h3>
              <button onClick={() => setShowReportModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Reporting for: <b>{selectedStation.name}</b>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Encountered</label>
                <select
                  value={issueType}
                  onChange={e => setIssueType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                >
                  <option value="empty">Empty / No Water Flowing</option>
                  <option value="broken">Broken Tap / ATM Hardware Error</option>
                  <option value="unhygienic">Unhygienic / Cloudy Water</option>
                  <option value="working_properly">Restored / Working Normally</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Comments (Optional)</label>
                <textarea
                  value={reportComment}
                  onChange={e => setReportComment(e.target.value)}
                  placeholder="e.g. Dispenser card reader not reading, tank empty since 1 PM..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suggest Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Suggest New Drinking Water Point</h3>
              <button onClick={() => setShowSuggestModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSuggestSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={newStationName}
                  onChange={e => setNewStationName(e.target.value)}
                  placeholder="e.g. Metro Pillar 128 Drinking Water ATM"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={newStationAddress}
                  onChange={e => setNewStationAddress(e.target.value)}
                  placeholder="e.g. Near Bus Stand, Thanisandra Main Road"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Water Dispenser Type</label>
                <select
                  value={newStationType}
                  onChange={e => setNewStationType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                >
                  <option value="mineral_water_atm">Mineral Water ATM</option>
                  <option value="purified_chilled">Purified Chilled Cooler</option>
                  <option value="filtered_tap">Filtered Municipal Tap</option>
                  <option value="tanker_point">Emergency Tanker Respite Point</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSuggestModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  Save & Queue for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};