import { 
  LocationZone, 
  Resident, 
  UserProfile, 
  WelfareCheckin, 
  AssistanceRequest, 
  AppNotification, 
  ActivityLog, 
  RiskThresholdConfig,
  CheckinStatus,
  RequestStatus,
  CoolingCentre,
  CoolingCentreVerificationStatus,
  CoolingCentreReport,
  PublicWaterPoint,
  HeatForecast,
  AssistantMessage,
  HeatSimulationResult
} from '../types';
import { 
  INITIAL_LOCATIONS, 
  INITIAL_USERS, 
  INITIAL_RESIDENTS, 
  INITIAL_CHECKINS, 
  INITIAL_REQUESTS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_ACTIVITY_LOGS, 
  DEFAULT_RISK_CONFIG 
} from './mockData';
import { INITIAL_COOLING_CENTRES, INITIAL_WATER_POINTS } from './coolingCentresData';

const STORAGE_KEYS = {
  LOCATIONS: 'heatshield_locations',
  USERS: 'heatshield_users',
  RESIDENTS: 'heatshield_residents',
  CHECKINS: 'heatshield_checkins',
  REQUESTS: 'heatshield_requests',
  NOTIFICATIONS: 'heatshield_notifications',
  ACTIVITY_LOGS: 'heatshield_activity_logs',
  RISK_CONFIG: 'heatshield_risk_config',
  COOLING_CENTRES: 'heatshield_cooling_centres',
  COOLING_REPORTS: 'heatshield_cooling_reports',
  WATER_POINTS: 'heatshield_water_points',
  FORECASTS: 'heatshield_forecasts',
  ASSISTANT_MESSAGES: 'heatshield_assistant_messages',
  SIMULATIONS: 'heatshield_simulations'
};

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage write failed:', e);
  }
}

// Singleton storage wrapper
export const mockDb = {
  getLocations(): LocationZone[] {
    const list = getStorage<LocationZone[]>(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
    const existing = new Set(list.map(l => l.id));
    const missing = INITIAL_LOCATIONS.filter(l => !existing.has(l.id));
    if (missing.length > 0) {
      const merged = [...missing, ...list];
      setStorage(STORAGE_KEYS.LOCATIONS, merged);
      return merged;
    }
    return list;
  },

  saveLocation(location: LocationZone): void {
    const list = this.getLocations();
    const idx = list.findIndex(l => l.id === location.id);
    if (idx >= 0) list[idx] = location;
    else list.unshift(location);
    setStorage(STORAGE_KEYS.LOCATIONS, list);
  },

  getResidents(): Resident[] {
    const list = getStorage<Resident[]>(STORAGE_KEYS.RESIDENTS, INITIAL_RESIDENTS);
    const existing = new Set(list.map(r => r.id));
    const missing = INITIAL_RESIDENTS.filter(r => !existing.has(r.id));
    if (missing.length > 0) {
      const merged = [...missing, ...list];
      setStorage(STORAGE_KEYS.RESIDENTS, merged);
      return merged;
    }
    return list;
  },

  saveResident(resident: Resident): void {
    const list = this.getResidents();
    const idx = list.findIndex(r => r.id === resident.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...resident };
    else list.unshift(resident);
    setStorage(STORAGE_KEYS.RESIDENTS, list);

    this.logActivity({
      actor_name: 'System / User',
      action: idx >= 0 ? 'UPDATE_RESIDENT_PROFILE' : 'REGISTER_NEW_RESIDENT',
      target_type: 'resident',
      target_id: resident.id,
      details: { name: resident.full_name, locality: resident.locality_name }
    });
  },

  getCheckins(): WelfareCheckin[] {
    const list = getStorage<WelfareCheckin[]>(STORAGE_KEYS.CHECKINS, INITIAL_CHECKINS);
    const existing = new Set(list.map(c => c.id));
    const missing = INITIAL_CHECKINS.filter(c => !existing.has(c.id));
    if (missing.length > 0) {
      const merged = [...missing, ...list];
      setStorage(STORAGE_KEYS.CHECKINS, merged);
      return merged;
    }
    return list;
  },

  updateCheckinStatus(
    id: string, 
    status: CheckinStatus, 
    data: {
      notes?: string;
      safetyConfirmed?: boolean;
      hydrationAdequate?: boolean;
      coolingAccessible?: boolean;
      escalationReason?: string;
      volunteerName?: string;
    }
  ): WelfareCheckin | undefined {
    const list = this.getCheckins();
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status,
        checkin_notes: data.notes ?? list[idx].checkin_notes,
        safety_confirmed: data.safetyConfirmed ?? list[idx].safety_confirmed,
        hydration_adequate: data.hydrationAdequate ?? list[idx].hydration_adequate,
        cooling_accessible: data.coolingAccessible ?? list[idx].cooling_accessible,
        escalation_reason: data.escalationReason ?? list[idx].escalation_reason,
        completed_at: status === 'completed' ? new Date().toISOString() : list[idx].completed_at
      };
      setStorage(STORAGE_KEYS.CHECKINS, list);

      // If completed or safe, update resident's last welfare check-in timestamp
      if (status === 'completed' || data.safetyConfirmed) {
        const residents = this.getResidents();
        const rIdx = residents.findIndex(r => r.id === list[idx].resident_id);
        if (rIdx >= 0) {
          residents[rIdx].last_welfare_checkin = new Date().toISOString();
          setStorage(STORAGE_KEYS.RESIDENTS, residents);
        }
      }

      this.logActivity({
        actor_name: data.volunteerName || 'Volunteer',
        action: `CHECKIN_${status.toUpperCase()}`,
        target_type: 'welfare_checkin',
        target_id: id,
        details: { status, resident: list[idx].resident_name }
      });

      return list[idx];
    }
    return undefined;
  },

  addCheckin(checkin: WelfareCheckin): void {
    const list = this.getCheckins();
    list.unshift(checkin);
    setStorage(STORAGE_KEYS.CHECKINS, list);
  },

  getRequests(): AssistanceRequest[] {
    const list = getStorage<AssistanceRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
    const existing = new Set(list.map(r => r.id));
    const missing = INITIAL_REQUESTS.filter(r => !existing.has(r.id));
    if (missing.length > 0) {
      const merged = [...missing, ...list];
      setStorage(STORAGE_KEYS.REQUESTS, merged);
      return merged;
    }
    return list;
  },

  saveRequest(req: AssistanceRequest): void {
    const list = this.getRequests();
    const idx = list.findIndex(r => r.id === req.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...req };
    else list.unshift(req);
    setStorage(STORAGE_KEYS.REQUESTS, list);

    this.logActivity({
      actor_name: req.resident_name || 'Community Member',
      action: idx >= 0 ? `REQUEST_UPDATED_${req.status.toUpperCase()}` : 'SUBMIT_ASSISTANCE_REQUEST',
      target_type: 'assistance_request',
      target_id: req.id,
      details: { category: req.category, priority: req.priority, locality: req.locality_name }
    });
  },

  updateRequestStatus(id: string, status: RequestStatus, resolutionNotes?: string, volunteerName?: string): void {
    const list = this.getRequests();
    const idx = list.findIndex(r => r.id === id);
    if (idx >= 0) {
      list[idx].status = status;
      if (resolutionNotes) list[idx].resolution_notes = resolutionNotes;
      if (status === 'resolved') list[idx].resolved_at = new Date().toISOString();
      if (volunteerName) list[idx].assigned_volunteer_name = volunteerName;
      setStorage(STORAGE_KEYS.REQUESTS, list);

      this.logActivity({
        actor_name: volunteerName || 'Admin / Volunteer',
        action: `REQUEST_${status.toUpperCase()}`,
        target_type: 'assistance_request',
        target_id: id,
        details: { status, resolution: resolutionNotes }
      });
    }
  },

  getNotifications(userId?: string): AppNotification[] {
    const notifs = getStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    if (!userId) return notifs;
    return notifs.filter(n => n.user_id === userId || n.user_id === 'all');
  },

  markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.is_read = true;
      setStorage(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  },

  markAllNotificationsRead(): void {
    const list = this.getNotifications();
    list.forEach(n => n.is_read = true);
    setStorage(STORAGE_KEYS.NOTIFICATIONS, list);
  },

  addNotification(notif: Omit<AppNotification, 'id' | 'created_at'>): AppNotification {
    const list = this.getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString()
    };
    list.unshift(newNotif);
    setStorage(STORAGE_KEYS.NOTIFICATIONS, list);
    return newNotif;
  },

  getActivityLogs(): ActivityLog[] {
    return getStorage(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
  },

  logActivity(log: Omit<ActivityLog, 'id' | 'created_at'>): void {
    const list = this.getActivityLogs();
    const newLog: ActivityLog = {
      ...log,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString()
    };
    list.unshift(newLog);
    // Keep last 100 activity logs
    setStorage(STORAGE_KEYS.ACTIVITY_LOGS, list.slice(0, 100));
  },

  getRiskConfig(): RiskThresholdConfig {
    return getStorage(STORAGE_KEYS.RISK_CONFIG, DEFAULT_RISK_CONFIG);
  },

  saveRiskConfig(config: RiskThresholdConfig): void {
    setStorage(STORAGE_KEYS.RISK_CONFIG, config);
    this.logActivity({
      actor_name: 'Dr. Ramesh Sundaram (Admin)',
      action: 'UPDATE_RISK_MODEL_THRESHOLDS',
      target_type: 'risk_thresholds',
      target_id: config.id,
      details: { temp_weight: config.temp_weight, humidity_weight: config.humidity_weight }
    });
  },

  getUsers(): UserProfile[] {
    return getStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  // ============================================================================
  // COOLING CENTRES
  // ============================================================================
  getCoolingCentres(): CoolingCentre[] {
    const list = getStorage<CoolingCentre[]>(STORAGE_KEYS.COOLING_CENTRES, INITIAL_COOLING_CENTRES);
    const existing = new Set(list.map(c => c.id));
    const missing = INITIAL_COOLING_CENTRES.filter(c => !existing.has(c.id));
    if (missing.length > 0) {
      const merged = [...list, ...missing];
      setStorage(STORAGE_KEYS.COOLING_CENTRES, merged);
      return merged;
    }
    return list;
  },

  saveCoolingCentre(centre: CoolingCentre): void {
    const list = this.getCoolingCentres();
    const idx = list.findIndex(c => c.id === centre.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...centre, updated_at: new Date().toISOString() };
    else list.unshift({ ...centre, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    setStorage(STORAGE_KEYS.COOLING_CENTRES, list);

    this.logActivity({
      actor_name: centre.verified_by || 'Admin',
      action: idx >= 0 ? 'UPDATE_COOLING_CENTRE' : 'REGISTER_NEW_COOLING_CENTRE',
      target_type: 'cooling_centre',
      target_id: centre.id,
      details: { name: centre.name, locality: centre.locality_name, status: centre.verification_status }
    });
  },

  verifyCoolingCentre(id: string, status: CoolingCentreVerificationStatus, verifiedBy: string): CoolingCentre | undefined {
    const list = this.getCoolingCentres();
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) {
      list[idx].verification_status = status;
      list[idx].verified_by = verifiedBy;
      list[idx].last_verified_at = new Date().toISOString();
      list[idx].updated_at = new Date().toISOString();
      setStorage(STORAGE_KEYS.COOLING_CENTRES, list);

      this.logActivity({
        actor_name: verifiedBy,
        action: `COOLING_CENTRE_${status.toUpperCase()}`,
        target_type: 'cooling_centre',
        target_id: id,
        details: { status, centre_name: list[idx].name }
      });
      return list[idx];
    }
    return undefined;
  },

  getCoolingCentreReports(): CoolingCentreReport[] {
    return getStorage<CoolingCentreReport[]>(STORAGE_KEYS.COOLING_REPORTS, []);
  },

  addCoolingCentreReport(report: Omit<CoolingCentreReport, 'id' | 'created_at'>): CoolingCentreReport {
    const list = this.getCoolingCentreReports();
    const newReport: CoolingCentreReport = {
      ...report,
      id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString()
    };
    list.unshift(newReport);
    setStorage(STORAGE_KEYS.COOLING_REPORTS, list);

    this.logActivity({
      actor_name: report.reporter_name || 'Resident',
      action: 'SUBMIT_COOLING_CENTRE_REPORT',
      target_type: 'cooling_centre_report',
      target_id: newReport.id,
      details: { centre_id: report.centre_id, issue_type: report.issue_type }
    });

    return newReport;
  },

  getWaterPoints(): PublicWaterPoint[] {
    return getStorage<PublicWaterPoint[]>(STORAGE_KEYS.WATER_POINTS, INITIAL_WATER_POINTS);
  },

  // ============================================================================
  // PREDICTIONS & FORECASTS
  // ============================================================================
  getForecasts(locationId?: string): HeatForecast[] {
    const list = getStorage<HeatForecast[]>(STORAGE_KEYS.FORECASTS, []);
    if (!locationId || locationId === 'all') return list;
    return list.filter(f => f.location_id === locationId);
  },

  saveForecasts(forecasts: HeatForecast[]): void {
    const existing = getStorage<HeatForecast[]>(STORAGE_KEYS.FORECASTS, []);
    // Replace forecasts for matching location and horizon, keep others
    const newMap = new Map(existing.map(f => [`${f.location_id}-${f.forecast_horizon_hours}`, f]));
    forecasts.forEach(f => {
      newMap.set(`${f.location_id}-${f.forecast_horizon_hours}`, f);
    });
    setStorage(STORAGE_KEYS.FORECASTS, Array.from(newMap.values()));
  },

  // ============================================================================
  // ASSISTANT CONVERSATION HISTORY
  // ============================================================================
  getAssistantMessages(): AssistantMessage[] {
    return getStorage<AssistantMessage[]>(STORAGE_KEYS.ASSISTANT_MESSAGES, []);
  },

  saveAssistantMessage(msg: AssistantMessage): void {
    const list = this.getAssistantMessages();
    list.push(msg);
    // Keep last 150 messages
    setStorage(STORAGE_KEYS.ASSISTANT_MESSAGES, list.slice(-150));
  },

  clearAssistantMessages(): void {
    setStorage(STORAGE_KEYS.ASSISTANT_MESSAGES, []);
  },

  // ============================================================================
  // HEAT SIMULATIONS (STRICTLY ISOLATED)
  // ============================================================================
  getSimulations(): HeatSimulationResult[] {
    return getStorage<HeatSimulationResult[]>(STORAGE_KEYS.SIMULATIONS, []);
  },

  saveSimulation(simulation: HeatSimulationResult): void {
    const list = this.getSimulations();
    const idx = list.findIndex(s => s.id === simulation.id);
    if (idx >= 0) list[idx] = simulation;
    else list.unshift(simulation);
    setStorage(STORAGE_KEYS.SIMULATIONS, list.slice(0, 50));

    this.logActivity({
      actor_name: simulation.created_by || 'Admin',
      action: 'SAVE_HEAT_SIMULATION_SCENARIO',
      target_type: 'heat_simulation',
      target_id: simulation.id,
      details: { name: simulation.name, temp_delta: simulation.parameters.temperature_delta_c }
    });
  },

  resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.LOCATIONS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.RESIDENTS);
    localStorage.removeItem(STORAGE_KEYS.CHECKINS);
    localStorage.removeItem(STORAGE_KEYS.REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
    localStorage.removeItem(STORAGE_KEYS.RISK_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.COOLING_CENTRES);
    localStorage.removeItem(STORAGE_KEYS.COOLING_REPORTS);
    localStorage.removeItem(STORAGE_KEYS.WATER_POINTS);
    localStorage.removeItem(STORAGE_KEYS.FORECASTS);
    localStorage.removeItem(STORAGE_KEYS.ASSISTANT_MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.SIMULATIONS);
  }
};
