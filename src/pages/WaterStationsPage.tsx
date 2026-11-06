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
  Compass,
  Navigation
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { WaterStation, WaterStationStatus, WaterType } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { useLocationTracker } from '../context/LocationContext';

export const WaterStationsPage: React.FC = () => {
  const { currentLocation } = useLocationTracker();
  const [stations, setStations] = useState<WaterStation[]>(() => mockDb.getWaterStations());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'limited' | 'maintenance'>('all');
  const [selectedStation, setSelectedStation] = useState<WaterStation | null>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [issueType, setIssueType] = useState<'empty' | 'broken' | 'unhygienic' | 'working_properly'>('empty');
  const [reportComment, setReportComment] = useState('');

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
      center: [currentLocation.latitude || 13.0854, currentLocation.longitude || 77.6250],
      zoom: 13,
      zoomControl: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
      className: 'heatshield-clean-tiles'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!markersRef.current || !mapInstanceRef.current) return;

    markersRef.current.clearLayers();

    filteredStations.forEach(st => {
      const isOperational = st.status === 'available' || (st.status as string) === 'operational';
      const icon = L.divIcon({
        className: 'heatshield-place-pill-icon',
        html: `
          <div style="
            background: ${isOperational ? '#1E60F2' : '#F59E0B'};
            color: #FFFFFF;
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 12px rgba(15,23,42,0.18);
            border: 2px solid #FFFFFF;
            cursor: pointer;
            white-space: nowrap;
          ">
            💧 ${st.name.split(' ')[0]}
          </div>
        `,
        iconSize: [80, 26],
        iconAnchor: [40, 13]
      });

      const marker = L.marker([st.latitude, st.longitude], { icon })
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px; padding: 2px;">
            <strong style="color: #0F172A; font-size: 13px;">${st.name}</strong><br/>
            <span style="color: #64748B;">${st.address}</span><br/>
            <div style="margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="color: ${isOperational ? '#10B981' : '#F59E0B'}; font-weight: 700;">
                ${isOperational ? '● Working' : '● Maintenance'}
              </span>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}" target="_blank" style="color: #1E60F2; font-weight: 600; text-decoration: underline;">Directions</a>
            </div>
          </div>
        `, { className: 'heatshield-climate-popup' });

      marker.on('click', () => {
        setSelectedStation(st);
      });

      markersRef.current?.addLayer(marker);
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
    const newSt: WaterStation = {
      id: `ws-${Date.now()}`,
      name: newStationName,
      address: newStationAddress,
      locality_name: currentLocation.localityName || 'Local Ward',
      city: currentLocation.city || 'Bengaluru',
      state: currentLocation.state || 'Karnataka',
      latitude: (currentLocation.latitude || 13.0854) + (Math.random() - 0.5) * 0.02,
      longitude: (currentLocation.longitude || 77.6250) + (Math.random() - 0.5) * 0.02,
      status: 'available',
      water_type: newStationType,
      operating_hours: '24x7',
      free_access: true,
      price_per_litre: 0,
      wheelchair_accessible: true,
      reported_empty_count: 0,
      last_verified_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    mockDb.saveWaterStation(newSt);
    setStations(mockDb.getWaterStations());
    setShowSuggestModal(false);
    setNewStationName('');
    setNewStationAddress('');
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Droplets className="w-6 h-6 text-[#1E60F2]" />
            <span>Public Water & Hydration Points</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verified drinking water ATMs, purified refilling kiosks, and community hydration points
          </p>
        </div>

        <button
          onClick={() => setShowSuggestModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto btn-press"
        >
          <Plus className="w-4 h-4" />
          <span>Add Water Point</span>
        </button>
      </div>

      {/* Map & List Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Canvas */}
        <div className="lg:col-span-7 bg-white rounded-[24px] border border-[#E5EDF5] overflow-hidden shadow-xs h-[420px] sm:h-[480px] lg:h-[620px] relative">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Stations Sidebar List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Filter */}
          <div className="bg-white rounded-[20px] border border-[#E5EDF5] p-4 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search water points or areas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E5EDF5] text-xs bg-[#F5F8FC] focus:bg-white focus:outline-none input-interactive"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {(['all', 'available', 'limited', 'maintenance'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all capitalize ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-[#F5F8FC] text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st === 'all' ? 'All' : st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredStations.map(st => {
              const isWorking = st.status === 'available' || (st.status as string) === 'operational';
              return (
                <div
                  key={st.id}
                  className="bg-white rounded-[20px] border border-[#E5EDF5] p-4 shadow-xs space-y-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isWorking ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {isWorking ? 'Operational' : 'Maintenance'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">{st.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{st.address}</p>
                    </div>

                    <span className="text-[11px] font-bold text-[#1E60F2] bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                      {st.free_access ? 'Free' : st.price_per_litre ? `₹${st.price_per_litre}/L` : 'Paid'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] text-slate-400">
                      Hours: {st.operating_hours}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedStation(st);
                          setShowReportModal(true);
                        }}
                        className="text-slate-500 hover:text-red-600 transition-colors"
                      >
                        Report issue
                      </button>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E60F2] font-semibold transition-colors flex items-center gap-1"
                      >
                        <span>Directions</span>
                        <Navigation className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && selectedStation && (
        <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 border border-[#E5EDF5] shadow-modal space-y-4 animate-modal-enter">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Report Water Station Status</h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-3.5 text-xs">
              <p className="text-slate-600">
                Reporting condition for <strong>{selectedStation.name}</strong>:
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Status Issue</label>
                <select
                  value={issueType}
                  onChange={(e: any) => setIssueType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none"
                >
                  <option value="empty">Out of Water / Empty</option>
                  <option value="broken">Broken ATM / Machine Error</option>
                  <option value="unhygienic">Unhygienic Surroundings</option>
                  <option value="working_properly">Working Properly (Verify Good)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Comments (Optional)</label>
                <textarea
                  value={reportComment}
                  onChange={(e) => setReportComment(e.target.value)}
                  placeholder="Additional details..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none input-interactive"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5EDF5] text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1E60F2] text-white font-semibold shadow-xs hover:bg-[#184FD0]"
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
        <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 border border-[#E5EDF5] shadow-modal space-y-4 animate-modal-enter">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Water Point</h3>
              <button onClick={() => setShowSuggestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSuggestSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Water Point Name</label>
                <input
                  type="text"
                  placeholder="e.g., Metro Water ATM, Bus Stand Fountain"
                  value={newStationName}
                  onChange={(e) => setNewStationName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none input-interactive"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Address / Location</label>
                <input
                  type="text"
                  placeholder="e.g., Near Hebbal BMTC Bus Stop"
                  value={newStationAddress}
                  onChange={(e) => setNewStationAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EDF5] bg-[#F5F8FC] text-slate-900 focus:outline-none input-interactive"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSuggestModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5EDF5] text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1E60F2] text-white font-semibold shadow-xs hover:bg-[#184FD0]"
                >
                  Save Water Point
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterStationsPage;
