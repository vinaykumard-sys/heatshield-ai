import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  HardHat, 
  ShieldCheck, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Plus, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Info,
  Thermometer,
  X,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocationTracker } from '../context/LocationContext';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockDb } from '../lib/mockDb';
import { formatTimeAgo } from '../lib/utils';
import { Link } from 'react-router-dom';

export interface WorkplaceOrganization {
  id: string;
  name: string;
  industry: 'construction' | 'delivery_logistics' | 'street_vending' | 'agriculture' | 'municipal';
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  total_workers: number;
  wbgt_threshold: number;
  created_at: string;
}

export const OrganizationPage: React.FC = () => {
  const { user, isAdmin, isVolunteer } = useAuth();
  const { currentLocation, currentReading } = useLocationTracker();

  const [organizations, setOrganizations] = useState<WorkplaceOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgIndustry, setOrgIndustry] = useState<WorkplaceOrganization['industry']>('construction');
  const [orgContactPerson, setOrgContactPerson] = useState('');
  const [orgContactPhone, setOrgContactPhone] = useState('');
  const [orgContactEmail, setOrgContactEmail] = useState('');
  const [orgWorkersCount, setOrgWorkersCount] = useState<number>(25);
  const [orgWbgtThreshold, setOrgWbgtThreshold] = useState<number>(30.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Fetch organizations
  const loadOrganizations = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. If Supabase is configured, try querying the remote table
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('worker_organizations')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          setOrganizations(data as WorkplaceOrganization[]);
          setIsLoading(false);
          return;
        }
      }

      // 2. Resilient local storage (honest records only, no demo fakes)
      const saved = localStorage.getItem('heatshield_registered_organizations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setOrganizations(parsed);
          setIsLoading(false);
          return;
        }
      }

      // Default to empty array - NO FABRICATED DATA
      setOrganizations([]);
    } catch (e: any) {
      console.warn('Error loading organizations:', e);
      setErrorMessage('Could not load organizations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  const handleRegisterOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !orgContactPerson.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const newOrg: WorkplaceOrganization = {
      id: `org-${Date.now()}`,
      name: orgName.trim(),
      industry: orgIndustry,
      contact_person: orgContactPerson.trim(),
      contact_phone: orgContactPhone.trim(),
      contact_email: orgContactEmail.trim(),
      total_workers: Number(orgWorkersCount) || 1,
      wbgt_threshold: Number(orgWbgtThreshold) || 30.0,
      created_at: new Date().toISOString()
    };

    try {
      // Try Supabase insert if available
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('worker_organizations').insert(newOrg);
        if (error) {
          console.warn('Supabase remote insert fallback to local persistence:', error.message);
        }
      }

      // Update local storage
      const updated = [newOrg, ...organizations];
      setOrganizations(updated);
      localStorage.setItem('heatshield_registered_organizations', JSON.stringify(updated));

      setSubmitSuccessMsg(`Organization "${newOrg.name}" registered successfully.`);
      setTimeout(() => {
        setSubmitSuccessMsg(null);
        setShowRegisterModal(false);
        setOrgName('');
        setOrgContactPerson('');
        setOrgContactPhone('');
        setOrgContactEmail('');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save organization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // ACCESS CONTROL VIEW FOR RESIDENTS (Non-Admin / Non-Coordinator)
  // --------------------------------------------------------------------------
  const isAuthorizedManager = isAdmin || isVolunteer;

  if (!isAuthorizedManager) {
    return (
      <div className="space-y-6 pb-20 max-w-5xl mx-auto px-4 sm:px-6">
        <LocationTrackerBar />

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1E60F2] mx-auto flex items-center justify-center border border-blue-100 shadow-2xs">
            <Building2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              Workplace & Employer Heat Protocols
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Organization Safety Portal
            </h1>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              This portal is reserved for registered employers, municipal departments, and site supervisors managing work-rest cycles for outdoor labor crews.
            </p>
          </div>

          {/* Resident guidance card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#1E60F2]" />
              <span>Are you an employee or outdoor worker?</span>
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Under National Heat Action Plans, outdoor workers are entitled to mandatory shade pauses, drinking water points, and modified shift hours during orange and red heatwave alerts.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <Link
                to="/worker-safety"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold text-xs hover:border-[#1E60F2] hover:text-[#1E60F2] shadow-2xs transition-colors"
              >
                <HardHat className="w-4 h-4 text-amber-600" />
                <span>Open Worker Safety Guide</span>
              </Link>
              <Link
                to="/requests"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E60F2] text-white font-semibold text-xs hover:bg-[#184FD0] shadow-xs transition-colors"
              >
                <span>Request Workplace Relief</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-400">
            Employer coordinator looking to register your organization? Contact your designated district disaster management officer or sign in with administrative credentials.
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // ADMIN / COORDINATOR VIEW
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#1E60F2]" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Workplace Organizations
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1E60F2] border border-blue-200">
              Admin & Coordinator Portal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Register workplaces, track occupational heat thresholds, and supervise outdoor shift safety
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRegisterModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Organization</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={loadOrganizations}
            className="text-xs font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-[#1E60F2] rounded-full animate-spin" />
          <span>Loading organization records...</span>
        </div>
      ) : organizations.length === 0 ? (
        /* HONEST EMPTY STATE - NO FABRICATED DATA */
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center max-w-xl mx-auto shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center border border-slate-200">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">No organizations registered yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Register your municipal department, construction workplace, or logistics fleet to establish automated WBGT heat alerts and mandatory work-rest cycles.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E60F2] text-white text-xs font-bold hover:bg-[#184FD0] transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Organization</span>
            </button>
          </div>
        </div>
      ) : (
        /* REGISTERED ORGANIZATIONS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 hover:border-blue-200 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{org.name}</h3>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                    {org.industry.replace('_', ' ')}
                  </span>
                </div>
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Contact Officer:</span>
                  <span className="font-semibold text-slate-900">{org.contact_person}</span>
                </div>
                {org.contact_phone && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Phone:</span>
                    <span className="font-mono text-[11px] text-slate-700">{org.contact_phone}</span>
                  </div>
                )}
                {org.contact_email && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Email:</span>
                    <span className="text-[11px] text-slate-700 truncate max-w-[180px]">{org.contact_email}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Tracked Workers</span>
                  <span className="text-base font-bold text-[#1E60F2]">{org.total_workers}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">WBGT Alert Limit</span>
                  <span className="text-base font-bold text-amber-700">{org.wbgt_threshold}°C</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Registered {formatTimeAgo(org.created_at)}
                </span>
                <Link
                  to="/worker-safety"
                  className="font-semibold text-[#1E60F2] hover:underline flex items-center gap-1"
                >
                  <span>Workplace Roster</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REGISTER ORGANIZATION MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-[#1E60F2] rounded-xl border border-blue-200">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Register Workplace Organization</h3>
                  <p className="text-xs text-slate-500">Configure workplace occupational heat safety</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccessMsg ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Success</h4>
                <p className="text-xs text-slate-600">{submitSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleRegisterOrg} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organization / Workplace Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Metro Construction Site Sector 4"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Industry Sector <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={orgIndustry}
                      onChange={(e) => setOrgIndustry(e.target.value as WorkplaceOrganization['industry'])}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100 bg-white"
                    >
                      <option value="construction">Construction & Infrastructure</option>
                      <option value="delivery_logistics">Delivery & Logistics</option>
                      <option value="street_vending">Street Vending & Markets</option>
                      <option value="agriculture">Agriculture & Farms</option>
                      <option value="municipal">Municipal & Waste Management</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Approx. Outdoor Workers
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={orgWorkersCount}
                      onChange={(e) => setOrgWorkersCount(parseInt(e.target.value, 10))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Safety Officer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={orgContactPerson}
                      onChange={(e) => setOrgContactPerson(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={orgContactPhone}
                      onChange={(e) => setOrgContactPhone(e.target.value)}
                      placeholder="+91 98450 11223"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={orgContactEmail}
                      onChange={(e) => setOrgContactEmail(e.target.value)}
                      placeholder="safety@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      WBGT Threshold (°C)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="26"
                      max="36"
                      value={orgWbgtThreshold}
                      onChange={(e) => setOrgWbgtThreshold(parseFloat(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Standard OSHA/NDMA trigger: 30.0°C</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Registering...' : 'Register Organization'}
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

export default OrganizationPage;
