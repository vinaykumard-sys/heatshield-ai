import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Phone, 
  Navigation, 
  Droplets, 
  Wind, 
  Users, 
  Plus, 
  ShieldCheck, 
  Flag, 
  Filter,
  X,
  ExternalLink
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { CoolingCentre, CoolingCentreVerificationStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLocationTracker } from '../context/LocationContext';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export const CoolingCentresPage: React.FC = () => {
  const { user, isAdmin, isVolunteer } = useAuth();
  const { currentLocation } = useLocationTracker();
  
  const [centres, setCentres] = useState<CoolingCentre[]>(() => mockDb.getCoolingCentres());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [selectedCentre, setSelectedCentre] = useState<CoolingCentre | null>(centres[0] || null);

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingCentre, setReportingCentre] = useState<CoolingCentre | null>(null);
  const [reportIssueType, setReportIssueType] = useState<'closed_unexpectedly' | 'no_water' | 'overcrowded' | 'incorrect_location' | 'other'>('closed_unexpectedly');
  const [reportNotes, setReportNotes] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Registration Form State
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formLocality, setFormLocality] = useState('Yelahanka');
  const [formCity, setFormCity] = useState('Bengaluru');
  const [formPhone, setFormPhone] = useState('+91 80 ');
  const [formHours, setFormHours] = useState('09:00 AM - 07:00 PM');
  const [formCapacity, setFormCapacity] = useState(60);
  const [formAC, setFormAC] = useState(true);
  const [formWater, setFormWater] = useState(true);
  const [formWheelchair, setFormWheelchair] = useState(true);

  // Calculate distances from user location
  const centresWithDistance = useMemo(() => {
    return centres.map(c => {
      let dist: number | undefined = undefined;
      if (currentLocation.latitude && currentLocation.longitude) {
        dist = calculateDistanceKm(
          currentLocation.latitude, 
          currentLocation.longitude, 
          c.latitude, 
          c.longitude
        );
      }
      return { ...c, distance_km: dist };
    });
  }, [centres, currentLocation.latitude, currentLocation.longitude]);

  // Filtered List
  const filteredCentres = useMemo(() => {
    return centresWithDistance.filter(c => {
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = c.name.toLowerCase().includes(q) || 
                      c.address.toLowerCase().includes(q) || 
                      c.locality_name.toLowerCase().includes(q) ||
                      c.city.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Verification Status filter
      if (verificationFilter === 'verified' && c.verification_status !== 'verified') return false;
      if (verificationFilter === 'pending' && c.verification_status !== 'pending_verification') return false;

      // Facility filters
      if (selectedFacility === 'ac' && !c.air_conditioned) return false;
      if (selectedFacility === 'water' && !c.drinking_water_available) return false;
      if (selectedFacility === 'wheelchair' && !c.wheelchair_accessible) return false;

      return true;
    }).sort((a, b) => {
      if (a.distance_km !== undefined && b.distance_km !== undefined) {
        return a.distance_km - b.distance_km;
      }
      return 0;
    });
  }, [centresWithDistance, searchQuery, selectedFacility, verificationFilter]);

  // Handle Verify Action (Admin or Volunteer)
  const handleVerifyCentre = (id: string, status: CoolingCentreVerificationStatus) => {
    const verifiedBy = user?.full_name || 'Authorized Verifier';
    mockDb.verifyCoolingCentre(id, status, verifiedBy);
    setCentres(mockDb.getCoolingCentres());
  };

  // Handle Register New Centre
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAddress.trim()) return;

    const newCentre: CoolingCentre = {
      id: `cool-custom-${Date.now()}`,
      name: formName.trim(),
      address: formAddress.trim(),
      locality_name: formLocality,
      city: formCity,
      state: 'Karnataka',
      latitude: (currentLocation.latitude || 13.0854) + (Math.random() * 0.02 - 0.01),
      longitude: (currentLocation.longitude || 77.6250) + (Math.random() * 0.02 - 0.01),
      contact_phone: formPhone.trim(),
      operating_hours: formHours.trim(),
      operating_status: 'open',
      capacity_estimate: Number(formCapacity),
      wheelchair_accessible: formWheelchair,
      drinking_water_available: formWater,
      air_conditioned: formAC,
      indoor_seating: true,
      medical_kit_available: true,
      verification_status: isAdmin ? 'verified' : 'pending_verification',
      verified_by: isAdmin ? user?.full_name : undefined,
      last_verified_at: isAdmin ? new Date().toISOString() : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockDb.saveCoolingCentre(newCentre);
    setCentres(mockDb.getCoolingCentres());
    setIsRegisterModalOpen(false);
    // Reset form
    setFormName('');
    setFormAddress('');
  };

  // Handle Report Incorrect Info
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingCentre) return;

    mockDb.addCoolingCentreReport({
      centre_id: reportingCentre.id,
      reported_by: user?.id,
      reporter_name: user?.full_name || 'Community Member',
      issue_type: reportIssueType,
      description: reportNotes.trim() || `Reported ${reportIssueType} by citizen.`,
      status: 'pending_review'
    });

    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setIsReportModalOpen(false);
      setReportNotes('');
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Verified Public Cooling Shelters
            </h1>
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
              HEAT RESPITE NETWORK
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Locate verified government and civic cooling shelters, misting pavilions, and public air-conditioned relief hubs.
          </p>
        </div>

        {/* Action Button for Admins/Volunteers */}
        <div className="flex items-center gap-2">
          {(isAdmin || isVolunteer) && (
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm btn-interact"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Shelter</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search shelter name, locality, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:bg-white input-interactive focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Facility Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto text-xs">
          <span className="text-slate-400 font-medium px-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Facility:</span>
          </span>
          {[
            { id: 'all', label: 'All Shelters' },
            { id: 'ac', label: '❄️ AC / Cooler' },
            { id: 'water', label: '💧 Drinking Water' },
            { id: 'wheelchair', label: '♿ Wheelchair Accessible' }
          ].map(fac => (
            <button
              key={fac.id}
              onClick={() => setSelectedFacility(fac.id)}
              className={`px-2.5 py-1 rounded-lg font-medium btn-press transition-all ${
                selectedFacility === fac.id 
                  ? 'bg-blue-600 text-white shadow-xs font-semibold' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {fac.label}
            </button>
          ))}
        </div>

        {/* Verification Status Filter */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setVerificationFilter(verificationFilter === 'verified' ? 'all' : 'verified')}
            className={`px-2.5 py-1 rounded-lg border font-medium btn-press transition-all ${
              verificationFilter === 'verified'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            ✓ Verified Only ({centres.filter(c => c.verification_status === 'verified').length})
          </button>
        </div>
      </div>

      {/* Main Content Layout: List Cards + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Cooling Centre Cards */}
        <div className="lg:col-span-2 space-y-3.5">
          {filteredCentres.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-xs font-medium">
              No verified facilities found nearby
            </div>
          ) : (
            filteredCentres.map((centre) => {
              const isSelected = selectedCentre?.id === centre.id;
              const isVerified = centre.verification_status === 'verified';

              return (
                <div
                  key={centre.id}
                  onClick={() => setSelectedCentre(centre)}
                  className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer bg-white shadow-sm space-y-3 card-interactive ${
                    isSelected ? 'border-blue-600 ring-2 ring-blue-600/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Badges & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                          isVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          <span className="capitalize">{centre.verification_status.replace('_', ' ')}</span>
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                          ● {centre.operating_status.toUpperCase()}
                        </span>

                        {centre.distance_km !== undefined && (
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-bold">
                            📍 {centre.distance_km} km away
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{centre.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{centre.address} ({centre.locality_name})</span>
                      </p>
                    </div>

                    {/* Directions External Link */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 border border-blue-200"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Directions</span>
                    </a>
                  </div>

                  {/* Amenities Strip */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{centre.operating_hours}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Cap: ~{centre.capacity_estimate}</span>
                    </div>

                    {centre.air_conditioned && (
                      <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        ❄️ AC Air-Cooled
                      </span>
                    )}

                    {centre.drinking_water_available && (
                      <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                        💧 Clean Water
                      </span>
                    )}

                    {centre.wheelchair_accessible && (
                      <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        ♿ Accessible
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Centre Detail Card & Verification Workflow */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 h-fit">
          {selectedCentre ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Shelter Inspection Profile
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedCentre.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedCentre.address}</p>
              </div>

              {/* Operating Status Info */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Operating Status:</span>
                  <span className="font-bold text-emerald-700 uppercase">
                    ● {selectedCentre.operating_status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Daily Hours:</span>
                  <span className="font-bold text-slate-800">{selectedCentre.operating_hours}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Contact Telephone:</span>
                  <span className="font-mono font-bold text-blue-600">{selectedCentre.contact_phone || 'None recorded'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Last Verified:</span>
                  <span className="font-mono text-slate-700">
                    {selectedCentre.last_verified_at 
                      ? new Date(selectedCentre.last_verified_at).toLocaleDateString()
                      : 'Pending Initial Verification'}
                  </span>
                </div>
                {selectedCentre.verified_by && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Verified By:</span>
                    <span className="font-medium text-slate-800">{selectedCentre.verified_by}</span>
                  </div>
                )}
              </div>

              {/* Verified Facilities Checklist */}
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                  Verified Safety Amenities
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2 rounded border flex items-center gap-1.5 ${
                    selectedCentre.drinking_water_available ? 'bg-sky-50/60 border-sky-200 text-sky-800 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}>
                    <span>💧</span>
                    <span>Drinking Water</span>
                  </div>
                  <div className={`p-2 rounded border flex items-center gap-1.5 ${
                    selectedCentre.air_conditioned ? 'bg-blue-50/60 border-blue-200 text-blue-800 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}>
                    <span>❄️</span>
                    <span>Indoor AC</span>
                  </div>
                  <div className={`p-2 rounded border flex items-center gap-1.5 ${
                    selectedCentre.wheelchair_accessible ? 'bg-slate-50 border-slate-200 text-slate-800 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}>
                    <span>♿</span>
                    <span>Wheelchair Access</span>
                  </div>
                  <div className={`p-2 rounded border flex items-center gap-1.5 ${
                    selectedCentre.medical_kit_available ? 'bg-rose-50/60 border-rose-200 text-rose-800 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}>
                    <span>🩹</span>
                    <span>First Aid Kit</span>
                  </div>
                </div>
              </div>

              {/* Verification Controls for Admins and Volunteers */}
              {(isAdmin || isVolunteer) && (
                <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-200 space-y-2">
                  <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Staff Verification Actions</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerifyCentre(selectedCentre.id, 'verified')}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                    >
                      Confirm Verified
                    </button>
                    <button
                      onClick={() => handleVerifyCentre(selectedCentre.id, 'temporarily_unavailable')}
                      className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
                    >
                      Mark Unavailable
                    </button>
                  </div>
                </div>
              )}

              {/* Citizen Reporting Option */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setReportingCentre(selectedCentre);
                    setIsReportModalOpen(true);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report Incorrect Info</span>
                </button>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCentre.latitude},${selectedCentre.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Open in Navigation</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 text-xs py-8">
              Select any shelter card to inspect verification and amenities.
            </div>
          )}
        </div>
      </div>

      {/* Register New Centre Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Register Public Cooling Centre</span>
              </h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Centre / Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indiranagar Civic Air-Cooled Community Hall"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Physical Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near 100ft Road Metro Pillar 42, Indiranagar"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City</label>
                  <select
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900"
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Telephone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={formHours}
                    onChange={(e) => setFormHours(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estimated Capacity</label>
                  <input
                    type="number"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Amenities Checkboxes */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formAC} onChange={(e) => setFormAC(e.target.checked)} />
                  <span>Air Conditioning</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formWater} onChange={(e) => setFormWater(e.target.checked)} />
                  <span>Clean Water</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formWheelchair} onChange={(e) => setFormWheelchair(e.target.checked)} />
                  <span>Wheelchair Ramp</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Citizen Report Modal */}
      {isReportModalOpen && reportingCentre && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-600" />
                <span>Report Discrepancy</span>
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 text-center font-bold text-xs">
                Thank you. Report filed successfully for admin verification.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Reporting information for <b>{reportingCentre.name}</b>:
                </p>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Observed Issue</label>
                  <select
                    value={reportIssueType}
                    onChange={(e: any) => setReportIssueType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="closed_unexpectedly">Closed During Advertised Hours</option>
                    <option value="no_water">Drinking Water Unavailable / Broken</option>
                    <option value="overcrowded">Overcrowded / Over Capacity</option>
                    <option value="incorrect_location">Incorrect Address / Coordinates</option>
                    <option value="other">Other Facility Defect</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Details & Context</label>
                  <textarea
                    rows={3}
                    placeholder="Provide specific notes to assist municipal verifiers..."
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
