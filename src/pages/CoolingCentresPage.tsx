import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  Phone, 
  Navigation, 
  Users, 
  Plus, 
  ShieldCheck, 
  Flag, 
  Filter,
  X,
  ExternalLink,
  Snowflake,
  Droplets,
  Accessibility,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { CoolingCentre, CoolingCentreVerificationStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLocationTracker } from '../context/LocationContext';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

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
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Public Cooling Shelters
            </h1>
            <Badge variant="brand" size="sm">Verified Network</Badge>
          </div>
          <p className="text-sm text-[#64748B] mt-1">
            Find air-conditioned public relief hubs, community centres, and shaded misting pavilions near you.
          </p>
        </div>

        {/* Action Button for Admins/Volunteers */}
        {(isAdmin || isVolunteer) && (
          <Button
            variant="primary"
            onClick={() => setIsRegisterModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Register Shelter
          </Button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search shelter name, locality, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F8FC] border border-[#E5EDF5] text-sm text-[#0F172A] pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:bg-white focus:border-[#1E60F2] transition-colors"
            />
          </div>

          {/* Facility Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#64748B] font-medium px-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Filter:</span>
            </span>
            {[
              { id: 'all', label: 'All Shelters' },
              { id: 'ac', label: 'AC / Air Cooled' },
              { id: 'water', label: 'Drinking Water' },
              { id: 'wheelchair', label: 'Wheelchair Ramp' }
            ].map(fac => (
              <button
                key={fac.id}
                onClick={() => setSelectedFacility(fac.id)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  selectedFacility === fac.id 
                    ? 'bg-[#1E60F2] text-white shadow-xs font-semibold' 
                    : 'bg-[#F5F8FC] text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A]'
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
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                verificationFilter === 'verified'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                  : 'bg-white text-[#64748B] border-[#E5EDF5] hover:bg-[#F5F8FC]'
              }`}
            >
              ✓ Verified Only ({centres.filter(c => c.verification_status === 'verified').length})
            </button>
          </div>
        </div>
      </Card>

      {/* Main Content Layout: List Cards + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Cooling Centre Cards */}
        <div className="lg:col-span-2 space-y-4">
          {filteredCentres.length === 0 ? (
            <Card padding="lg" className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-[#64748B]">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#0F172A]">No shelters match your criteria</h3>
              <p className="text-xs text-[#64748B] mt-1">Try clearing filters or searching for another locality.</p>
            </Card>
          ) : (
            filteredCentres.map((centre) => {
              const isSelected = selectedCentre?.id === centre.id;
              const isVerified = centre.verification_status === 'verified';

              return (
                <div
                  key={centre.id}
                  onClick={() => setSelectedCentre(centre)}
                  className={`p-5 rounded-[20px] border transition-all cursor-pointer bg-white shadow-card space-y-3.5 hover:shadow-card-hover ${
                    isSelected ? 'border-[#1E60F2] ring-2 ring-[#1E60F2]/10' : 'border-[#E5EDF5] hover:border-slate-300'
                  }`}
                >
                  {/* Top Badges & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={isVerified ? 'success' : 'warning'} size="sm">
                          {isVerified ? 'Verified Shelter' : 'Community Reported'}
                        </Badge>

                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          ● {centre.operating_status === 'open' ? 'Open now' : centre.operating_status}
                        </span>

                        {centre.distance_km !== undefined && (
                          <span className="text-[11px] font-medium text-[#64748B] bg-[#F5F8FC] px-2 py-0.5 rounded-full">
                            📍 {centre.distance_km} km away
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-[#0F172A] pt-1">{centre.name}</h3>
                      <p className="text-xs text-[#64748B] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#1E60F2] shrink-0" />
                        <span>{centre.address} ({centre.locality_name})</span>
                      </p>
                    </div>

                    {/* Directions External Link */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-3.5 py-1.5 rounded-xl bg-[#F5F8FC] hover:bg-blue-50 text-[#1E60F2] text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 border border-[#E5EDF5] hover:border-[#1E60F2]/30"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Directions</span>
                    </a>
                  </div>

                  {/* Amenities Strip */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#E5EDF5] text-xs text-[#64748B]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>{centre.operating_hours}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>Capacity ~{centre.capacity_estimate}</span>
                    </div>

                    {centre.air_conditioned && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E60F2] bg-blue-50 px-2 py-0.5 rounded-full">
                        <Snowflake className="w-3 h-3" />
                        <span>Air Conditioned</span>
                      </span>
                    )}

                    {centre.drinking_water_available && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                        <Droplets className="w-3 h-3" />
                        <span>Clean Water</span>
                      </span>
                    )}

                    {centre.wheelchair_accessible && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Accessibility className="w-3 h-3" />
                        <span>Wheelchair Ramp</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Centre Detail Card & Verification Workflow */}
        <div className="space-y-4">
          {selectedCentre ? (
            <Card padding="lg" className="space-y-5 sticky top-24">
              <div>
                <span className="text-[11px] uppercase font-bold text-[#64748B] tracking-wider">
                  Shelter Details
                </span>
                <h3 className="text-lg font-bold text-[#0F172A] mt-1">{selectedCentre.name}</h3>
                <p className="text-xs text-[#64748B] mt-0.5">{selectedCentre.address}</p>
              </div>

              {/* Operating Status Info */}
              <div className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#E5EDF5] text-xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Operating Status</span>
                  <span className="font-bold text-emerald-700">
                    ● {selectedCentre.operating_status === 'open' ? 'Open now' : selectedCentre.operating_status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Daily Hours</span>
                  <span className="font-semibold text-[#0F172A]">{selectedCentre.operating_hours}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Contact Phone</span>
                  <span className="font-medium text-[#1E60F2]">{selectedCentre.contact_phone || 'None listed'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Last Verified</span>
                  <span className="text-[#0F172A] font-medium">
                    {selectedCentre.last_verified_at 
                      ? new Date(selectedCentre.last_verified_at).toLocaleDateString()
                      : 'Recently updated'}
                  </span>
                </div>
                {selectedCentre.verified_by && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Verified By</span>
                    <span className="font-medium text-[#0F172A]">{selectedCentre.verified_by}</span>
                  </div>
                )}
              </div>

              {/* Verified Facilities Checklist */}
              <div>
                <p className="text-[11px] uppercase font-bold text-[#64748B] tracking-wider mb-2.5">
                  Available Amenities
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    selectedCentre.drinking_water_available ? 'bg-sky-50/70 border-sky-200 text-sky-900 font-medium' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}>
                    <Droplets className="w-4 h-4 text-sky-600" />
                    <span>Drinking Water</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    selectedCentre.air_conditioned ? 'bg-blue-50/70 border-blue-200 text-[#1E60F2] font-medium' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}>
                    <Snowflake className="w-4 h-4 text-[#1E60F2]" />
                    <span>Indoor AC</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    selectedCentre.wheelchair_accessible ? 'bg-slate-50 border-slate-200 text-[#0F172A] font-medium' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}>
                    <Accessibility className="w-4 h-4 text-slate-600" />
                    <span>Ramp Access</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    selectedCentre.medical_kit_available ? 'bg-rose-50/70 border-rose-200 text-rose-900 font-medium' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-rose-600" />
                    <span>First Aid Kit</span>
                  </div>
                </div>
              </div>

              {/* Verification Controls for Admins and Volunteers */}
              {(isAdmin || isVolunteer) && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2.5">
                  <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#1E60F2]" />
                    <span>Staff Verification Actions</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerifyCentre(selectedCentre.id, 'verified')}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      Confirm Verified
                    </button>
                    <button
                      onClick={() => handleVerifyCentre(selectedCentre.id, 'temporarily_unavailable')}
                      className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      Mark Unavailable
                    </button>
                  </div>
                </div>
              )}

              {/* Citizen Reporting Option & External Link */}
              <div className="pt-3 border-t border-[#E5EDF5] flex items-center justify-between">
                <button
                  onClick={() => {
                    setReportingCentre(selectedCentre);
                    setIsReportModalOpen(true);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report issue</span>
                </button>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCentre.latitude},${selectedCentre.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#1E60F2] hover:underline flex items-center gap-1"
                >
                  <span>Open Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </Card>
          ) : (
            <Card padding="md" className="text-center text-[#64748B] text-xs py-8">
              Select any shelter card to view details and facilities.
            </Card>
          )}
        </div>
      </div>

      {/* Register New Centre Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#E5EDF5] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5EDF5] pb-3">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#1E60F2]" />
                <span>Register Public Cooling Shelter</span>
              </h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-[#64748B] hover:text-[#0F172A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indiranagar Civic Air-Cooled Community Hall"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#F5F8FC] border border-[#E5EDF5] p-2.5 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#1E60F2]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near 100ft Road Metro Pillar 42, Indiranagar"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-[#F5F8FC] border border-[#E5EDF5] p-2.5 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#1E60F2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#0F172A] block mb-1">City</label>
                  <select
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full bg-[#F5F8FC] border border-[#E5EDF5] p-2.5 rounded-xl text-[#0F172A]"
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#0F172A] block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-[#F5F8FC] border border-[#E5EDF5] p-2.5 rounded-xl text-[#0F172A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#0F172A] block mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={formHours}
                    onChange={(e) => setFormHours(e.target.value)}
                    className="w-full bg-[#F5F8FC] border border-[#E5EDF5] p-2.5 rounded-xl text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#0F172A] block mb-1">Estimated Capacity</label>
                  <input
                    type="number"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full bg-[#F5F8FC] border border-[#E5EDF5] p-2.5 rounded-xl text-[#0F172A]"
                  />
                </div>
              </div>

              {/* Amenities Checkboxes */}
              <div className="pt-2 border-t border-[#E5EDF5] flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-[#0F172A]">
                  <input type="checkbox" checked={formAC} onChange={(e) => setFormAC(e.target.checked)} className="rounded text-[#1E60F2]" />
                  <span>Air Conditioning</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-[#0F172A]">
                  <input type="checkbox" checked={formWater} onChange={(e) => setFormWater(e.target.checked)} className="rounded text-[#1E60F2]" />
                  <span>Clean Water</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-[#0F172A]">
                  <input type="checkbox" checked={formWheelchair} onChange={(e) => setFormWheelchair(e.target.checked)} className="rounded text-[#1E60F2]" />
                  <span>Wheelchair Ramp</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5EDF5]">
                <Button variant="ghost" size="sm" onClick={() => setIsRegisterModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Shelter
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Citizen Report Modal */}
      {isReportModalOpen && reportingCentre && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#E5EDF5] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5EDF5] pb-3">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-600" />
                <span>Report Shelter Issue</span>
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-[#64748B] hover:text-[#0F172A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-center font-bold text-xs">
                Thank you. Your report has been submitted for verification.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3.5 text-xs">
                <p className="text-[#64748B]">
                  Reporting issue for <b className="text-[#0F172A]">{reportingCentre.name}</b>:
                </p>

                <div>
                  <label className="font-semibold text-[#0F172A] block mb-1">Observed Issue</label>
                  <select
                    value={reportIssueType}
                    onChange={(e: any) => setReportIssueType(e.target.value)}
                    className="w-full bg-[#F5F8FC] border border-[#E5EDF5] p-2.5 rounded-xl text-[#0F172A] font-medium"
                  >
                    <option value="closed_unexpectedly">Closed During Advertised Hours</option>
                    <option value="no_water">Drinking Water Unavailable / Broken</option>
                    <option value="overcrowded">Overcrowded / Full Capacity</option>
                    <option value="incorrect_location">Incorrect Address or Location</option>
                    <option value="other">Other Issue</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#0F172A] block mb-1">Details & Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details to assist community verifiers..."
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    className="w-full bg-[#F5F8FC] border border-[#E5EDF5] p-2.5 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#1E60F2]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsReportModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" type="submit">
                    Submit Report
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
