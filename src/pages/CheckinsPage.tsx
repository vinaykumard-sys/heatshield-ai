import React, { useState, useMemo } from 'react';
import { 
  HeartPulse, 
  CheckCircle2, 
  Phone, 
  Search,
  AlertTriangle,
  UserCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  Activity,
  Flame,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  Users
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { WelfareCheckin, CheckinStatus, Resident, UserProfile, LocationZone } from '../types';
import { CheckinModal } from '../components/checkins/CheckinModal';
import { computeRankedWelfareCheckins, WelfarePriorityItem } from '../lib/welfarePriorityEngine';
import { useAuth } from '../context/AuthContext';

export const CheckinsPage: React.FC = () => {
  const { user } = useAuth();
  const [locations] = useState<LocationZone[]>(() => mockDb.getLocations());

  const [activeTab, setActiveTab] = useState<'priority_queue' | 'volunteer_view' | 'all_logs'>('priority_queue');
  const [tierFilter, setTierFilter] = useState<'all' | 'immediate' | 'urgent' | 'elevated' | 'routine'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Active modal targets
  const [activeCheckinModal, setActiveCheckinModal] = useState<WelfareCheckin | null>(null);
  const [assignModalTarget, setAssignModalTarget] = useState<WelfarePriorityItem | null>(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('');
  
  // Data state
  const [residents, setResidents] = useState<Resident[]>(() => mockDb.getResidents());
  const [checkins, setCheckins] = useState<WelfareCheckin[]>(() => mockDb.getCheckins());
  const users = useMemo<UserProfile[]>(() => mockDb.getUsers(), []);

  const volunteers = useMemo(() => {
    return users.filter(u => u.role === 'volunteer' || u.role === 'admin');
  }, [users]);

  const refreshData = () => {
    setResidents(mockDb.getResidents());
    setCheckins(mockDb.getCheckins());
  };

  // Compute smart priority ranked queue
  const rankedPriorities = useMemo(() => {
    return computeRankedWelfareCheckins(residents, checkins, locations);
  }, [residents, checkins, locations]);

  // Priority queue filtered
  const filteredPriorityQueue = useMemo(() => {
    return rankedPriorities.filter(item => {
      if (tierFilter !== 'all' && item.calculation.priority_tier !== tierFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = item.resident.full_name.toLowerCase().includes(q) ||
          (item.resident.locality_name || '').toLowerCase().includes(q) ||
          (item.resident.assigned_volunteer_name || '').toLowerCase().includes(q) ||
          (item.checkin?.volunteer_name || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [rankedPriorities, tierFilter, searchQuery]);

  // Volunteer field assignments (current user if volunteer, or all pending field visits)
  const volunteerAssignments = useMemo(() => {
    const volunteerName = user?.full_name || '';
    return rankedPriorities.filter(item => {
      // If user is volunteer, match their assigned tasks; otherwise show all assigned & high-priority
      if (user?.role === 'volunteer') {
        return item.resident.assigned_volunteer_name === volunteerName ||
          item.checkin?.volunteer_name === volunteerName;
      }
      return item.resident.assigned_volunteer_name || item.calculation.priority_tier === 'immediate';
    });
  }, [rankedPriorities, user]);

  // Historical check-in logs filtered
  const filteredLogs = useMemo(() => {
    return checkins.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = (c.resident_name || '').toLowerCase().includes(q) ||
          (c.locality_name || '').toLowerCase().includes(q) ||
          (c.volunteer_name || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [checkins, statusFilter, searchQuery]);

  // Overview metric stats
  const metrics = useMemo(() => {
    const immediateCount = rankedPriorities.filter(p => p.calculation.priority_tier === 'immediate').length;
    const urgentCount = rankedPriorities.filter(p => p.calculation.priority_tier === 'urgent').length;
    const completedCount = checkins.filter(c => c.status === 'completed').length;
    const overdueCount = rankedPriorities.filter(p => p.calculation.days_overdue >= 2 || p.calculation.days_overdue === -1).length;
    const escalatedCount = checkins.filter(c => c.status === 'escalated').length;

    return { immediateCount, urgentCount, completedCount, overdueCount, escalatedCount };
  }, [rankedPriorities, checkins]);

  const toggleExpand = (residentId: string) => {
    setExpandedItems(prev => ({ ...prev, [residentId]: !prev[residentId] }));
  };

  const getTierBadge = (tier: string, score: number) => {
    switch (tier) {
      case 'immediate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            CRITICAL ({score})
          </span>
        );
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
            URGENT ({score})
          </span>
        );
      case 'elevated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            ELEVATED ({score})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            ROUTINE ({score})
          </span>
        );
    }
  };

  const handleOpenCheckinModal = (item: WelfarePriorityItem) => {
    if (item.checkin) {
      setActiveCheckinModal(item.checkin);
    } else {
      // Create on-the-fly checkin object for recording
      const newCheckin: WelfareCheckin = {
        id: `chk-temp-${Date.now()}`,
        resident_id: item.resident.id,
        resident_name: item.resident.full_name,
        locality_name: item.resident.locality_name || 'Assigned Area',
        resident_phone: item.resident.contact_phone,
        volunteer_name: user?.full_name || 'Community Volunteer',
        scheduled_for: new Date().toISOString().split('T')[0],
        status: 'pending',
        safety_confirmed: false,
        hydration_adequate: false,
        cooling_accessible: false,
        risk_score: item.calculation.priority_score,
        created_at: new Date().toISOString()
      };
      mockDb.addCheckin(newCheckin);
      setActiveCheckinModal(newCheckin);
    }
  };

  const handleAssignVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalTarget || !selectedVolunteerId) return;

    const vol = volunteers.find(v => v.id === selectedVolunteerId);
    if (!vol) return;

    // Update resident assignment
    const updatedResident = {
      ...assignModalTarget.resident,
      assigned_volunteer_name: vol.full_name
    };
    mockDb.saveResident(updatedResident);

    // If an existing pending checkin exists, assign to volunteer too
    if (assignModalTarget.checkin) {
      mockDb.updateCheckinStatus(assignModalTarget.checkin.id, 'in_progress', {
        volunteerName: vol.full_name
      });
    } else {
      mockDb.addCheckin({
        id: `chk-${Date.now()}`,
        resident_id: assignModalTarget.resident.id,
        resident_name: assignModalTarget.resident.full_name,
        locality_name: assignModalTarget.resident.locality_name || 'Assigned Ward',
        resident_phone: assignModalTarget.resident.contact_phone,
        volunteer_id: vol.id,
        volunteer_name: vol.full_name,
        scheduled_for: new Date().toISOString().split('T')[0],
        status: 'in_progress',
        safety_confirmed: false,
        hydration_adequate: false,
        cooling_accessible: false,
        risk_score: assignModalTarget.calculation.priority_score,
        created_at: new Date().toISOString()
      });
    }

    refreshData();
    setAssignModalTarget(null);
    setSelectedVolunteerId('');
  };

  const handleQuickEscalate = (item: WelfarePriorityItem) => {
    const reason = window.prompt(
      `URGENT ESCALATION for ${item.resident.full_name}:\nEnter primary symptom or acute heat emergency reason for medical/coordinator dispatch:`,
      'Extreme thermal distress / uncontactable in critical heat zone'
    );
    if (!reason) return;

    if (item.checkin) {
      mockDb.updateCheckinStatus(item.checkin.id, 'escalated', {
        escalationReason: reason,
        notes: `Emergency escalation initiated via Priority Queue at ${new Date().toLocaleTimeString()}`,
        volunteerName: user?.full_name || 'Field Coordinator'
      });
    } else {
      mockDb.addCheckin({
        id: `chk-esc-${Date.now()}`,
        resident_id: item.resident.id,
        resident_name: item.resident.full_name,
        locality_name: item.resident.locality_name || 'Assigned Ward',
        resident_phone: item.resident.contact_phone,
        volunteer_name: user?.full_name || 'Field Coordinator',
        scheduled_for: new Date().toISOString().split('T')[0],
        status: 'escalated',
        safety_confirmed: false,
        hydration_adequate: false,
        cooling_accessible: false,
        escalation_reason: reason,
        risk_score: item.calculation.priority_score,
        created_at: new Date().toISOString()
      });
    }

    // Trigger urgent notification
    mockDb.addNotification({
      user_id: 'all',
      title: `URGENT WELFARE ESCALATION: ${item.resident.full_name}`,
      message: `Critical intervention triggered for ${item.resident.full_name} (${item.resident.locality_name}). Reason: ${reason}. Priority Score: ${item.calculation.priority_score}.`,
      type: 'critical_risk',
      priority: 'critical',
      is_read: false
    });

    refreshData();
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Smart Welfare Check-in System</h1>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
              FEATURE 4 • AI PRIORITY ENGINE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Intelligent, explainable priority dispatch protecting high-risk community members during acute heatwaves.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('priority_queue')}
            className={`px-3 py-1.5 rounded-md font-semibold btn-press transition-all ${
              activeTab === 'priority_queue'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AI Priority Queue ({rankedPriorities.length})
          </button>
          <button
            onClick={() => setActiveTab('volunteer_view')}
            className={`px-3 py-1.5 rounded-md font-semibold btn-press transition-all ${
              activeTab === 'volunteer_view'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Volunteer Field View ({volunteerAssignments.length})
          </button>
          <button
            onClick={() => setActiveTab('all_logs')}
            className={`px-3 py-1.5 rounded-md font-semibold btn-press transition-all ${
              activeTab === 'all_logs'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Check-in Logs ({checkins.length})
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white border border-red-200 rounded-xl shadow-sm card-interactive">
          <div className="flex items-center justify-between text-xs text-red-600 font-semibold mb-1">
            <span>Critical Priority</span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-700">{metrics.immediateCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Score ≥ 75 (Immediate)</p>
        </div>

        <div className="p-3.5 bg-white border border-orange-200 rounded-xl shadow-sm card-interactive">
          <div className="flex items-center justify-between text-xs text-orange-600 font-semibold mb-1">
            <span>Urgent Attention</span>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-orange-700">{metrics.urgentCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Score 50-74 (Same-day)</p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm card-interactive">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>Overdue (&gt;48h)</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{metrics.overdueCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Require fresh status check</p>
        </div>

        <div className="p-3.5 bg-white border border-emerald-200 rounded-xl shadow-sm card-interactive">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold mb-1">
            <span>Confirmed Safe</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">{metrics.completedCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Verified safely hydrated</p>
        </div>

        <div className="p-3.5 bg-white border border-red-200 rounded-xl shadow-sm col-span-2 sm:col-span-1 card-interactive">
          <div className="flex items-center justify-between text-xs text-red-600 font-semibold mb-1">
            <span>Active Escalations</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-600">{metrics.escalatedCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Flagged for EMS / Lead</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search residents by name, neighbourhood, ward, or volunteer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {activeTab === 'priority_queue' && (
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg text-xs overflow-x-auto shadow-sm">
            {(['all', 'immediate', 'urgent', 'elevated', 'routine'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-1 rounded capitalize font-medium transition-colors ${
                  tierFilter === t
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'all_logs' && (
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg text-xs overflow-x-auto shadow-sm">
            {['all', 'pending', 'in_progress', 'completed', 'unable_to_contact', 'escalated'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded capitalize whitespace-nowrap font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AI PRIORITY QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'priority_queue' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 flex items-center justify-between px-1">
            <span>
              Showing <strong>{filteredPriorityQueue.length}</strong> community residents ranked by thermal vulnerability risk
            </span>
            <span className="text-[11px] text-slate-400">
              Factors: Ambient heat (35%) + Vulnerabilities (35%) + Days elapsed (30%)
            </span>
          </div>

          <div className="space-y-3">
            {filteredPriorityQueue.map((item) => {
              const isExpanded = !!expandedItems[item.resident.id];
              return (
                <div
                  key={item.resident.id}
                  className={`bg-white border rounded-xl shadow-sm transition-all overflow-hidden ${
                    item.calculation.priority_tier === 'immediate'
                      ? 'border-red-200 hover:border-red-300'
                      : item.calculation.priority_tier === 'urgent'
                      ? 'border-orange-200 hover:border-orange-300'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Resident Profile & Rank */}
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 mt-0.5">
                          <HeartPulse className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-base">
                              {item.resident.full_name}
                            </h3>
                            {getTierBadge(item.calculation.priority_tier, item.calculation.priority_score)}
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              Age: {item.resident.age_range.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                            <span>Locality: <strong className="text-slate-800">{item.resident.locality_name || 'Ward Area'}</strong></span>
                            {item.locality && (
                              <span className="font-mono text-red-600">
                                Ambient: {(item.locality.current_reading?.temperature_c ?? 36.5).toFixed(1)}°C
                              </span>
                            )}
                            <span>
                              Last Check-in:{' '}
                              <strong className={item.calculation.days_overdue >= 2 ? 'text-amber-700' : 'text-slate-700'}>
                                {item.calculation.days_overdue === -1
                                  ? 'Never'
                                  : `${item.calculation.days_overdue} days ago`}
                              </strong>
                            </span>
                            <span>
                              Assigned:{' '}
                              <strong className="text-slate-800">
                                {item.resident.assigned_volunteer_name || item.checkin?.volunteer_name || 'Unassigned'}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                        {item.resident.contact_phone && (
                          <a
                            href={`tel:${item.resident.contact_phone}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                            title="Direct phone check"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                        )}

                        <button
                          onClick={() => setAssignModalTarget(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Assign</span>
                        </button>

                        <button
                          onClick={() => handleOpenCheckinModal(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Record Visit</span>
                        </button>

                        <button
                          onClick={() => handleQuickEscalate(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors"
                          title="Trigger emergency escalation"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Escalate</span>
                        </button>

                        <button
                          onClick={() => toggleExpand(item.resident.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                          title={isExpanded ? 'Hide explanation' : 'View AI score explanation'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Quick Recommended Action Notice */}
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2 text-xs">
                      <span className="font-semibold text-slate-700 whitespace-nowrap">Recommended Action:</span>
                      <span className="text-slate-600">{item.recommended_action}</span>
                    </div>

                    {/* Expandable Explainable AI Scoring Drawer */}
                    {isExpanded && (
                      <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Weight Breakdown */}
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <h4 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-blue-600" />
                              <span>Scoring Breakdown (Total: {item.calculation.priority_score}/100)</span>
                            </h4>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between text-slate-600">
                                <span>Thermal Risk Score Weight:</span>
                                <strong className="font-mono text-slate-900">+{item.calculation.risk_factor_weight} pts</strong>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Vulnerability Indicators Weight:</span>
                                <strong className="font-mono text-slate-900">+{item.calculation.vulnerability_factor_weight} pts</strong>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Elapsed Days Overdue:</span>
                                <strong className="font-mono text-slate-900">+{item.calculation.days_overdue === -1 ? 25 : item.calculation.days_overdue >= 2 ? 16 : 0} pts</strong>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Prior Unsuccessful Attempts / History:</span>
                                <strong className="font-mono text-slate-900">+{item.calculation.unsuccessful_attempts_weight} pts</strong>
                              </div>
                            </div>
                          </div>

                          {/* Contributing Factors Bullet List */}
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <h4 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                              <span>Explainable Risk Drivers</span>
                            </h4>
                            <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                              {item.calculation.reasons.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Resident Vulnerability Tags */}
                        {item.resident.vulnerability_indicators?.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                              Vulnerability Tags:
                            </span>
                            {item.resident.vulnerability_indicators.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredPriorityQueue.length === 0 && (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-xl text-slate-400">
                <HeartPulse className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-sm font-medium text-slate-600">No residents match selected filter criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VOLUNTEER FIELD VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'volunteer_view' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-700" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Volunteer Dispatch Dashboard</h3>
                <p className="text-xs text-blue-700">
                  Showing active field assignments for <strong>{user?.full_name || 'Community Volunteers'}</strong>.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white rounded-lg border border-blue-200 text-blue-800 shadow-sm">
              {volunteerAssignments.length} Target Visits
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {volunteerAssignments.map(item => (
              <div key={item.resident.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{item.resident.full_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.resident.locality_name || 'Ward Area'} • Age {item.resident.age_range.replace('_', ' ')}
                    </p>
                  </div>
                  {getTierBadge(item.calculation.priority_tier, item.calculation.priority_score)}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 text-slate-600 border border-slate-100">
                  <div>
                    <strong>Address / Location notes:</strong> {item.resident.address_notes || 'Dwelling verified in registration registry'}
                  </div>
                  {item.resident.emergency_contact_name && (
                    <div>
                      <strong>Emergency Contact:</strong> {item.resident.emergency_contact_name} ({item.resident.emergency_contact_phone || 'None'})
                    </div>
                  )}
                  <div>
                    <strong>Action:</strong> {item.recommended_action}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {item.resident.contact_phone && (
                    <a
                      href={`tel:${item.resident.contact_phone}`}
                      className="flex-1 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Resident</span>
                    </a>
                  )}

                  <button
                    onClick={() => handleOpenCheckinModal(item)}
                    className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Check Vitals & Safe</span>
                  </button>

                  <button
                    onClick={() => handleQuickEscalate(item)}
                    className="py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors"
                    title="Escalate emergency"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {volunteerAssignments.length === 0 && (
              <div className="col-span-2 text-center py-16 bg-white border border-slate-200 rounded-xl text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-500" />
                <p className="text-sm font-medium text-slate-700">No pending assignments in your queue.</p>
                <p className="text-xs text-slate-400 mt-1">Check the Priority Queue to pick up high-priority residents.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ALL CHECK-IN LOGS & AUDIT */}
      {/* ========================================================================= */}
      {activeTab === 'all_logs' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="p-4">Resident & Locality</th>
                  <th className="p-4">Risk Telemetry</th>
                  <th className="p-4">Assigned Volunteer</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Observations / Field Notes</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((chk) => (
                  <tr key={chk.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Resident Info */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{chk.resident_name}</div>
                      <div className="text-xs text-slate-500">{chk.locality_name}</div>
                      {chk.resident_phone && (
                        <a href={`tel:${chk.resident_phone}`} className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5 font-medium">
                          <Phone className="w-3 h-3" />
                          <span>{chk.resident_phone}</span>
                        </a>
                      )}
                    </td>

                    {/* Risk Telemetry */}
                    <td className="p-4">
                      <span className="font-mono text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        Score: {chk.risk_score ? chk.risk_score.toFixed(0) : '82'} / 100
                      </span>
                    </td>

                    {/* Volunteer */}
                    <td className="p-4">
                      <div className="text-xs font-medium text-slate-900">{chk.volunteer_name || 'Unassigned'}</div>
                      <div className="text-[11px] text-slate-500">Scheduled: {chk.scheduled_for}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      {chk.status === 'completed' ? (
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Completed (Safe)</span>
                      ) : chk.status === 'in_progress' ? (
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">In Progress</span>
                      ) : chk.status === 'unable_to_contact' ? (
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">Unable to Contact</span>
                      ) : chk.status === 'escalated' ? (
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">Escalated</span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Pending</span>
                      )}
                      {chk.safety_confirmed && (
                        <span className="block text-[10px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Confirmed Safe
                        </span>
                      )}
                    </td>

                    {/* Notes / Escalation */}
                    <td className="p-4 max-w-xs">
                      {chk.escalation_reason ? (
                        <p className="text-xs text-red-800 bg-red-50 p-2 rounded-lg border border-red-200">
                          <strong>Escalation:</strong> {chk.escalation_reason}
                        </p>
                      ) : chk.checkin_notes ? (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {chk.checkin_notes}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No field notes recorded</span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setActiveCheckinModal(chk)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs transition-colors"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <HeartPulse className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
              <p className="text-sm">No welfare check-in records found.</p>
            </div>
          )}
        </div>
      )}

      {/* Volunteer Assignment Modal */}
      {assignModalTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Assign Field Volunteer</h3>
              <button
                onClick={() => setAssignModalTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Assign a trained community volunteer to conduct physical / phone welfare checks for:
              <br />
              <strong className="text-slate-900 text-sm">{assignModalTarget.resident.full_name}</strong> ({assignModalTarget.resident.locality_name || 'Assigned Area'})
            </p>

            <form onSubmit={handleAssignVolunteer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Volunteer
                </label>
                <select
                  value={selectedVolunteerId}
                  onChange={(e) => setSelectedVolunteerId(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Choose active volunteer --</option>
                  {volunteers.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.full_name} ({v.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalTarget(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedVolunteerId}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkin Update Modal */}
      {activeCheckinModal && (
        <CheckinModal
          checkin={activeCheckinModal}
          isOpen={!!activeCheckinModal}
          onClose={() => setActiveCheckinModal(null)}
          onSuccess={refreshData}
        />
      )}
    </div>
  );
};
