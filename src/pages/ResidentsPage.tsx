import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  ShieldCheck, 
  MapPin, 
  X 
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { useAuth } from '../context/AuthContext';
import { Resident, SupportedLanguage } from '../types';
import { formatTimeAgo } from '../lib/utils';
import { prioritizeResidents } from '../lib/riskEngine';

export const ResidentsPage: React.FC = () => {
  const { isVolunteer } = useAuth();
  const [residents, setResidents] = useState<Resident[]>(() => {
    return prioritizeResidents(mockDb.getResidents(), 75);
  });
  const locations = mockDb.getLocations();

  const [searchQuery, setSearchQuery] = useState('');
  const [localityFilter, setLocalityFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New resident form states
  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState<Resident['age_range']>('60_to_74');
  const [localityId, setLocalityId] = useState(locations[0]?.id || '');
  const [phone, setPhone] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [language, setLanguage] = useState<SupportedLanguage>('hi');
  const [notes, setNotes] = useState('');

  const refreshList = () => {
    setResidents(prioritizeResidents(mockDb.getResidents(), 75));
  };

  const handleToggleIndicator = (indicator: string) => {
    setSelectedIndicators(prev => 
      prev.includes(indicator) ? prev.filter(i => i !== indicator) : [...prev, indicator]
    );
  };

  const handleAddResident = (e: React.FormEvent) => {
    e.preventDefault();
    const loc = locations.find(l => l.id === localityId);

    const newRes: Resident = {
      id: `res-${Date.now()}`,
      full_name: name,
      age_range: ageRange,
      locality_id: localityId,
      locality_name: loc ? `${loc.name}, ${loc.city}` : 'Local Ward',
      contact_phone: phone,
      emergency_contact_name: emergencyName,
      emergency_contact_phone: emergencyPhone,
      address_notes: address,
      vulnerability_indicators: selectedIndicators.length > 0 ? selectedIndicators : ['Elderly Care'],
      preferred_language: language,
      consent_status: true,
      consent_date: new Date().toISOString(),
      notes,
      created_at: new Date().toISOString(),
    };

    mockDb.saveResident(newRes);
    refreshList();
    setIsAddModalOpen(false);

    // Reset form
    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setSelectedIndicators([]);
  };

  // Filtered residents list
  const filtered = residents.filter(r => {
    if (localityFilter !== 'all' && r.locality_id !== localityFilter) return false;
    if (ageFilter !== 'all' && r.age_range !== ageFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = r.full_name.toLowerCase().includes(q) ||
        (r.address_notes && r.address_notes.toLowerCase().includes(q)) ||
        (r.locality_name && r.locality_name.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  const indicatorOptions = [
    'Elderly (75+)',
    'Elderly (60-74)',
    'Infant / Under 5',
    'Tin/Asbestos Roof',
    'Chronic Respiratory (Asthma/COPD)',
    'Chronic Cardiac Condition',
    'Outdoor Street Laborer',
    'Limited Mobility / Bedridden',
    'No Power / Electric Fan',
    'Lives Alone',
  ];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Vulnerable Resident Registry</h1>
            <span className="text-[10px] font-mono uppercase font-semibold tracking-wider px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
              PROTECTED DIRECTORY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Registered high-risk community members prioritized for preventative hydration checks and cooling support.
          </p>
        </div>

        {isVolunteer && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Vulnerable Resident</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search resident by name, locality, or housing conditions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={localityFilter}
            onChange={(e) => setLocalityFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 shadow-sm font-medium"
          >
            <option value="all">All Localities</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.city}: {loc.name}</option>
            ))}
          </select>

          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 shadow-sm font-medium"
          >
            <option value="all">All Age Groups</option>
            <option value="75_plus">75+ Years</option>
            <option value="60_to_74">60 - 74 Years</option>
            <option value="under_5">Under 5 Years</option>
            <option value="18_to_59">18 - 59 Years</option>
          </select>
        </div>
      </div>

      {/* Residents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((res) => (
          <div
            key={res.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all space-y-4 relative flex flex-col justify-between"
          >
            <div>
              {/* Card Top: Rank & Age */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
                  Priority Rank #{res.calculated_priority_rank}
                </span>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {res.age_range.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Resident Name & Locality */}
              <h3 className="text-base font-bold text-slate-900">{res.full_name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{res.locality_name}</span>
              </p>

              {/* Housing / Address Context */}
              {res.address_notes && (
                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2.5 leading-relaxed">
                  {res.address_notes}
                </p>
              )}

              {/* Vulnerability Tags */}
              <div className="mt-3">
                <span className="text-[10px] uppercase font-mono font-semibold text-slate-500 tracking-wider block mb-1.5">
                  Vulnerability Indicators
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {res.vulnerability_indicators.map((ind, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-medium"
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Bottom: Contact & Check-in status */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Last Welfare Check:</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {formatTimeAgo(res.last_welfare_checkin)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Consent Verified</span>
                </div>

                {res.contact_phone && (
                  <a
                    href={`tel:${res.contact_phone}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors"
                  >
                    <Phone className="w-3 h-3 text-blue-600" />
                    <span>Call</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 bg-white border border-slate-200 rounded-xl">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
          <p className="text-sm">No vulnerable residents found matching the criteria.</p>
        </div>
      )}

      {/* Add Resident Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Register Vulnerable Resident</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddResident} className="p-5 space-y-4 text-xs sm:text-sm max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Resident full name"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age Range</label>
                  <select
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value as Resident['age_range'])}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="75_plus">75+ Years (Critical Priority)</option>
                    <option value="60_to_74">60 - 74 Years (High Priority)</option>
                    <option value="under_5">Under 5 Years (Infant)</option>
                    <option value="18_to_59">18 - 59 Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Locality / Ward</label>
                <select
                  value={localityId}
                  onChange={(e) => setLocalityId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.city}, {loc.state})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Relative or neighbor"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address & Roof / Housing Conditions
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Tenement 14, Top floor under direct asbestos tin sheet"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Vulnerability Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Vulnerability Indicators
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {indicatorOptions.map((ind) => {
                    const isSelected = selectedIndicators.includes(ind);
                    return (
                      <button
                        type="button"
                        key={ind}
                        onClick={() => handleToggleIndicator(ind)}
                        className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-800 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {ind}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked required className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                  <span>
                    Resident provided informed voluntary consent for welfare check-in monitoring.
                  </span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  Save Resident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
