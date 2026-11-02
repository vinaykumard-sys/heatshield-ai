import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  ShieldAlert, 
  MapPin, 
  Users, 
  Building2, 
  Droplets, 
  Thermometer, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  Download, 
  Layers, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  FileText,
  Activity,
  HardHat,
  HeartPulse,
  Compass
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { SituationReport } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';

export const CommandCentrePage: React.FC = () => {
  const [sitRep, setSitRep] = useState<SituationReport>(() => mockDb.getSituationReport());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportNotice, setExportNotice] = useState(false);

  // Layer Toggles
  const [showHeatLayer, setShowHeatLayer] = useState(true);
  const [showCoolingLayer, setShowCoolingLayer] = useState(true);
  const [showWaterLayer, setShowWaterLayer] = useState(true);
  const [showHospitalLayer, setShowHospitalLayer] = useState(true);
  const [showSchoolLayer, setShowSchoolLayer] = useState(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer Groups
  const heatLayerRef = useRef<L.LayerGroup | null>(null);
  const coolingLayerRef = useRef<L.LayerGroup | null>(null);
  const waterLayerRef = useRef<L.LayerGroup | null>(null);
  const hospitalLayerRef = useRef<L.LayerGroup | null>(null);
  const schoolLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Command Center Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [13.0100, 77.6000],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    // Dark command tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      className: 'heatshield-dark-tiles',
      maxZoom: 19
    }).addTo(map);

    heatLayerRef.current = L.layerGroup().addTo(map);
    coolingLayerRef.current = L.layerGroup().addTo(map);
    waterLayerRef.current = L.layerGroup().addTo(map);
    hospitalLayerRef.current = L.layerGroup().addTo(map);
    schoolLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Layers based on toggles
  useEffect(() => {
    const heat = heatLayerRef.current;
    const cooling = coolingLayerRef.current;
    const water = waterLayerRef.current;
    const hosp = hospitalLayerRef.current;
    const sch = schoolLayerRef.current;

    if (!heat || !cooling || !water || !hosp || !sch) return;

    heat.clearLayers();
    cooling.clearLayers();
    water.clearLayers();
    hosp.clearLayers();
    sch.clearLayers();

    // 1. Heat Risk Circles
    if (showHeatLayer) {
      const locations = mockDb.getLocations();
      locations.forEach(loc => {
        const isNorth = loc.latitude > 25.0;
        const temp = isNorth ? 40.5 : 34.8;
        if (temp > 35.0) {
          L.circle([loc.latitude, loc.longitude], {
            radius: 2600,
            color: '#EF4444',
            weight: 2,
            fillColor: '#DC2626',
            fillOpacity: 0.25,
            dashArray: '6, 6'
          }).bindPopup(`<b>${loc.name}</b><br>Ambient Temp: ${temp}°C`).addTo(heat);
        }
      });
    }

    // 2. Cooling Centres
    if (showCoolingLayer) {
      const coolingCentres = mockDb.getCoolingCentres();
      coolingCentres.forEach(c => {
        const icon = L.divIcon({
          html: `<div style="background: #0284C7; color: white; padding: 2px 6px; border-radius: 9999px; font-size: 9px; font-weight: 800; border: 1px solid white;">❄️ Shelter</div>`,
          className: 'cool-icon',
          iconSize: [60, 20]
        });
        L.marker([c.latitude, c.longitude], { icon }).bindPopup(`<b>${c.name}</b><br>${c.address}`).addTo(cooling);
      });
    }

    // 3. Water Stations
    if (showWaterLayer) {
      const waterStations = mockDb.getWaterStations();
      waterStations.forEach(w => {
        const icon = L.divIcon({
          html: `<div style="background: #0369A1; color: white; padding: 2px 6px; border-radius: 9999px; font-size: 9px; font-weight: 800; border: 1px solid #7DD3FC;">💧 Water</div>`,
          className: 'water-icon',
          iconSize: [55, 20]
        });
        L.marker([w.latitude, w.longitude], { icon }).bindPopup(`<b>${w.name}</b><br>Status: ${w.status}`).addTo(water);
      });
    }

    // 4. Hospitals
    if (showHospitalLayer) {
      const hospitals = mockDb.getHospitals();
      hospitals.forEach(h => {
        const icon = L.divIcon({
          html: `<div style="background: #DC2626; color: white; padding: 2px 6px; border-radius: 9999px; font-size: 9px; font-weight: 800; border: 1.5px solid white;">🏥 Hosp</div>`,
          className: 'hosp-icon',
          iconSize: [55, 20]
        });
        L.marker([h.latitude, h.longitude], { icon }).bindPopup(`<b>${h.name}</b><br>Emergency: ${h.emergency_phone}`).addTo(hosp);
      });
    }

    // 5. Schools
    if (showSchoolLayer) {
      const schools = mockDb.getSchools();
      schools.forEach(s => {
        const icon = L.divIcon({
          html: `<div style="background: #D97706; color: white; padding: 2px 6px; border-radius: 9999px; font-size: 9px; font-weight: 800; border: 1px solid white;">🏫 School</div>`,
          className: 'school-icon',
          iconSize: [60, 20]
        });
        L.marker([s.latitude, s.longitude], { icon }).bindPopup(`<b>${s.name}</b><br>Curfew: ${s.outdoor_activity_curfew_temp}°C`).addTo(sch);
      });
    }
  }, [showHeatLayer, showCoolingLayer, showWaterLayer, showHospitalLayer, showSchoolLayer]);

  const handleManualBriefingRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const updated = {
        ...sitRep,
        generated_at: new Date().toISOString(),
        data_freshness_pct: 100
      };
      mockDb.saveSituationReport(updated);
      setSitRep(updated);
      setIsRefreshing(false);
    }, 800);
  };

  const handleExportBriefing = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-blue-600" />
              <span>Smart City Heat Command Operations Center</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              RESTRICTED: ADMIN
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time urban heat risk oversight, multi-agency resource monitoring, volunteer deployment, and AI operational briefings.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleManualBriefingRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all btn-press hover:scale-105 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync Live Telemetry</span>
          </button>

          <button
            onClick={handleExportBriefing}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all btn-interact hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Official Dossier</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Official HeatShield Situation Briefing exported to PDF format.</span>
        </div>
      )}

      {/* Command KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">
            Peak City Temp
          </span>
          <div className="text-xl font-black text-red-600 font-mono mt-0.5">
            41.5°C
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Delhi (Old City)</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">
            High-Risk Wards
          </span>
          <div className="text-xl font-black text-orange-600 font-mono mt-0.5">
            6 Wards
          </div>
          <span className="text-[10px] text-orange-600 font-medium">Threshold &gt; 35°C</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">
            Cooling Shelters
          </span>
          <div className="text-xl font-black text-sky-600 font-mono mt-0.5">
            {sitRep.resource_status.cooling_centres_open} Open
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">100% Operational</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">
            Public Water ATMs
          </span>
          <div className="text-xl font-black text-teal-600 font-mono mt-0.5">
            {sitRep.resource_status.water_stations_operational} Active
          </div>
          <span className="text-[10px] text-amber-600 font-medium">2 Queued for Refill</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">
            Field Volunteers
          </span>
          <div className="text-xl font-black text-indigo-600 font-mono mt-0.5">
            {sitRep.resource_status.active_volunteers} Deployed
          </div>
          <span className="text-[10px] text-indigo-600 font-medium">Welfare check-ins active</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">
            Data Freshness
          </span>
          <div className="text-xl font-black text-emerald-600 font-mono mt-0.5">
            {sitRep.data_freshness_pct}%
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Open-Meteo High-Res</span>
        </div>
      </div>

      {/* Main Command Map with Multi-Layer Radar */}
      <div className="bg-[#090D16] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Layer Controls Bar */}
        <div className="p-3 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-[11px] uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Geospatial Radar Layers:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
            <button
              onClick={() => setShowHeatLayer(!showHeatLayer)}
              className={`px-2.5 py-1 rounded-xl border transition-all btn-press hover:scale-105 active:scale-95 ${
                showHeatLayer ? 'bg-red-950 text-red-300 border-red-700 shadow-2xs font-semibold' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              ⚠️ Heat Risk Circles
            </button>
            <button
              onClick={() => setShowCoolingLayer(!showCoolingLayer)}
              className={`px-2.5 py-1 rounded-xl border transition-all btn-press hover:scale-105 active:scale-95 ${
                showCoolingLayer ? 'bg-sky-950 text-sky-300 border-sky-700 shadow-2xs font-semibold' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              ❄️ Cooling Centres
            </button>
            <button
              onClick={() => setShowWaterLayer(!showWaterLayer)}
              className={`px-2.5 py-1 rounded-xl border transition-all btn-press hover:scale-105 active:scale-95 ${
                showWaterLayer ? 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-2xs font-semibold' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              💧 Water ATMs
            </button>
            <button
              onClick={() => setShowHospitalLayer(!showHospitalLayer)}
              className={`px-2.5 py-1 rounded-xl border transition-all btn-press hover:scale-105 active:scale-95 ${
                showHospitalLayer ? 'bg-rose-950 text-rose-300 border-rose-700 shadow-2xs font-semibold' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              🏥 Hospitals
            </button>
            <button
              onClick={() => setShowSchoolLayer(!showSchoolLayer)}
              className={`px-2.5 py-1 rounded-xl border transition-all btn-press hover:scale-105 active:scale-95 ${
                showSchoolLayer ? 'bg-amber-950 text-amber-300 border-amber-700 shadow-2xs font-semibold' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              🏫 Schools
            </button>
          </div>
        </div>

        <div ref={mapContainerRef} className="w-full h-[520px]" />
      </div>

      {/* AI Daily Situation Briefing & Incident Response Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AI Operational Situation Report (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="font-bold text-sm text-cyan-300 uppercase font-mono tracking-wider">
                Autonomous AI Situation Briefing
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Synced {new Date(sitRep.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {sitRep.summary_text}
          </p>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider block">
              Key Vulnerability Concerns
            </span>
            <ul className="text-xs text-slate-300 space-y-1.5">
              {sitRep.key_concerns.map((kc, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-400 font-bold shrink-0">⚠️</span>
                  <span>{kc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 tracking-wider block">
              Recommended Administrative Directives
            </span>
            <ul className="text-xs text-slate-300 space-y-1.5">
              {sitRep.recommended_administrative_actions.map((act, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold shrink-0">→</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Affected Localities & Resource Queue (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-600" />
            <span>Highest-Risk Monitored Localities</span>
          </h2>

          <div className="space-y-3">
            {sitRep.most_affected_localities.map((loc, i) => (
              <div 
                key={i}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">{loc.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Pending Welfare Check-ins: <b>{loc.pending_checkins}</b>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black font-mono text-red-600">
                    {loc.temperature}°C
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-red-100 text-red-800">
                    Risk {loc.risk_score}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
              <span className="font-bold block">Inter-Agency Municipal Link</span>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Emergency health dispatch channels open with Victoria Hospital, BBMP Health Department, and Disaster Helplines (112, 1070).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};