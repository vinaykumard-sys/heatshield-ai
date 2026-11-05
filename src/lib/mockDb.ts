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
import {
  INITIAL_WATER_STATIONS,
  INITIAL_SMART_ALERTS,
  INITIAL_WORKER_ORGS,
  INITIAL_WORKPLACES,
  INITIAL_OUTDOOR_WORKERS,
  INITIAL_FAMILY_GROUPS,
  INITIAL_SCHOOLS,
  INITIAL_HOSPITALS,
  INITIAL_SITUATION_REPORT,
  INITIAL_ACADEMY_COURSES,
  INITIAL_SAFE_ROUTES
} from './platformExpansionData';
import {
  WaterStation,
  WaterStationReport,
  SmartHeatAlert,
  HeatAlertSubscription,
  WorkerOrganization,
  WorkerWorkplace,
  OutdoorWorker,
  FamilyGroup,
  FamilyMember,
  SchoolRegistration,
  HospitalResource,
  SituationReport,
  AcademyCourse,
  HeatSafeRoute
} from '../types';

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
  SIMULATIONS: 'heatshield_simulations',
  LOCATION_REPORTS: 'heatshield_location_reports',
  FAVORITE_PLACES: 'heatshield_favorite_places',
  RECENT_PLACES: 'heatshield_recent_places',
  // Expansion storage keys
  WATER_STATIONS: 'heatshield_water_stations',
  WATER_STATION_REPORTS: 'heatshield_water_station_reports',
  SMART_ALERTS: 'heatshield_smart_alerts',
  ALERT_SUBSCRIPTIONS: 'heatshield_alert_subscriptions',
  WORKER_ORGS: 'heatshield_worker_orgs',
  WORKPLACES: 'heatshield_workplaces',
  OUTDOOR_WORKERS: 'heatshield_outdoor_workers',
  FAMILY_GROUPS: 'heatshield_family_groups',
  SCHOOLS: 'heatshield_schools',
  HOSPITALS: 'heatshield_hospitals',
  SITUATION_REPORT: 'heatshield_situation_report',
  ACADEMY_PROGRESS: 'heatshield_academy_progress',
  OFFLINE_QUEUE: 'heatshield_offline_queue'
};

const isProduction = import.meta.env.VITE_APP_ENV === 'production' || import.meta.env.PROD;

// Purge legacy mock data from browser localStorage so demo users/records don't linger
export function purgeLegacyMockStorage(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    // Always remove developer keys
    localStorage.removeItem('heatshield_developer_keys');

    const demoKeywords = [
      'Anjinappa', 'Farooq', 'Ramesh', 'Sundaram', 'Kavita', 'Deshmukh', 
      'Arun Kumar', 'Gowda', 'Sham Lal', 'Muniyappa', 'Parvatiamma', 
      'Laxmi Bai', 'Rukmini', 'res-blr-1', 'res-1', 'res-2', 'res-3', 'res-4', 'res-5', 'res-6',
      'usr-admin-1', 'usr-vol-1', 'usr-vol-2', 'usr-res-1',
      'chk-1', 'chk-2', 'chk-3', 'chk-4', 'chk-blr',
      'req-1', 'req-2', 'req-3', 'req-blr',
      'act-1', 'act-2', 'act-3', 'act-4',
      'notif-1', 'notif-2', 'notif-3',
      'sit-rep-today'
    ];

    const keysToCheck = [
      STORAGE_KEYS.RESIDENTS,
      STORAGE_KEYS.USERS,
      STORAGE_KEYS.CHECKINS,
      STORAGE_KEYS.REQUESTS,
      STORAGE_KEYS.ACTIVITY_LOGS,
      STORAGE_KEYS.NOTIFICATIONS,
      STORAGE_KEYS.SITUATION_REPORT,
      STORAGE_KEYS.SMART_ALERTS
    ];

    keysToCheck.forEach(key => {
      const val = localStorage.getItem(key);
      if (val && demoKeywords.some(kw => val.includes(kw))) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    // ignore
  }
}

// Run cleanup immediately
purgeLegacyMockStorage();

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;

    // Discard any storage item contaminated with legacy demo fixtures
    const demoKeywords = [
      'Anjinappa', 'Farooq', 'Ramesh', 'Sundaram', 'Kavita', 'Deshmukh',
      'Arun Kumar', 'Gowda', 'Sham Lal', 'Muniyappa', 'Parvatiamma',
      'Laxmi Bai', 'Rukmini', 'res-blr-1', 'res-1', 'res-2', 'res-3',
      'usr-admin-1', 'usr-vol-1', 'usr-vol-2', 'usr-res-1',
      'chk-1', 'chk-2', 'chk-3', 'chk-blr',
      'req-1', 'req-2', 'req-blr',
      'act-1', 'act-2', 'act-3', 'act-4',
      'sit-rep-today'
    ];

    if (demoKeywords.some(kw => item.includes(kw))) {
      localStorage.removeItem(key);
      return defaultValue;
    }

    return JSON.parse(item);
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
    // In production, strictly avoid pre-seeded demo residents
    const initial = isProduction ? [] : INITIAL_RESIDENTS;
    return getStorage<Resident[]>(STORAGE_KEYS.RESIDENTS, initial);
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
    const initial = isProduction ? [] : INITIAL_CHECKINS;
    return getStorage<WelfareCheckin[]>(STORAGE_KEYS.CHECKINS, initial);
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
    const initial = isProduction ? [] : INITIAL_REQUESTS;
    return getStorage<AssistanceRequest[]>(STORAGE_KEYS.REQUESTS, initial);
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
    const initial = isProduction ? [] : INITIAL_NOTIFICATIONS;
    const notifs = getStorage(STORAGE_KEYS.NOTIFICATIONS, initial);
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
    const initial = isProduction ? [] : INITIAL_ACTIVITY_LOGS;
    return getStorage(STORAGE_KEYS.ACTIVITY_LOGS, initial);
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
      actor_name: 'Administrator',
      action: 'UPDATE_RISK_MODEL_THRESHOLDS',
      target_type: 'risk_thresholds',
      target_id: config.id,
      details: { temp_weight: config.temp_weight, humidity_weight: config.humidity_weight }
    });
  },

  getUsers(): UserProfile[] {
    const initial = isProduction ? [] : INITIAL_USERS;
    return getStorage(STORAGE_KEYS.USERS, initial);
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

  // Location Heat Reports (Feature 7)
  getLocationReports(): any[] {
    return getStorage<any[]>(STORAGE_KEYS.LOCATION_REPORTS, []);
  },

  saveLocationReport(report: any): void {
    const list = this.getLocationReports();
    // Keep last 30 reports, newest first
    const filtered = list.filter(r => r.id !== report.id);
    setStorage(STORAGE_KEYS.LOCATION_REPORTS, [report, ...filtered].slice(0, 30));
  },

  getRecentPlaces(): any[] {
    return getStorage<any[]>(STORAGE_KEYS.RECENT_PLACES, [
      {
        id: 'bengaluru-hebbal',
        displayName: 'Hebbal, Bengaluru, Karnataka (560024)',
        shortName: 'Hebbal',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560024',
        latitude: 13.0358,
        longitude: 77.5970,
        type: 'locality'
      },
      {
        id: 'bengaluru-whitefield',
        displayName: 'Whitefield EPIP Zone, Bengaluru (560066)',
        shortName: 'Whitefield',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560066',
        latitude: 12.9698,
        longitude: 77.7500,
        type: 'locality'
      },
      {
        id: 'bengaluru-indiranagar',
        displayName: 'Indiranagar 100ft Rd, Bengaluru (560038)',
        shortName: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        latitude: 12.9784,
        longitude: 77.6408,
        type: 'locality'
      }
    ]);
  },

  addRecentPlace(place: any): void {
    const current = this.getRecentPlaces();
    const updated = [place, ...current.filter(p => p.displayName !== place.displayName)].slice(0, 10);
    setStorage(STORAGE_KEYS.RECENT_PLACES, updated);
  },

  getFavoritePlaces(): any[] {
    return getStorage<any[]>(STORAGE_KEYS.FAVORITE_PLACES, []);
  },

  toggleFavoritePlace(place: any): boolean {
    const favorites = this.getFavoritePlaces();
    const exists = favorites.some(p => p.displayName === place.displayName || (p.latitude === place.latitude && p.longitude === place.longitude));
    let next: any[];
    let isFav: boolean;
    if (exists) {
      next = favorites.filter(p => p.displayName !== place.displayName);
      isFav = false;
    } else {
      next = [place, ...favorites];
      isFav = true;
    }
    setStorage(STORAGE_KEYS.FAVORITE_PLACES, next);
    return isFav;
  },

  isFavoritePlace(placeOrName: any): boolean {
    const favorites = this.getFavoritePlaces();
    if (typeof placeOrName === 'string') {
      return favorites.some(p => p.displayName === placeOrName || p.shortName === placeOrName);
    }
    return favorites.some(p => p.displayName === placeOrName.displayName || (p.latitude === placeOrName.latitude && p.longitude === placeOrName.longitude));
  },

  // --- WATER STATIONS (PART 4) ---
  getWaterStations(): WaterStation[] {
    return getStorage<WaterStation[]>(STORAGE_KEYS.WATER_STATIONS, INITIAL_WATER_STATIONS);
  },

  saveWaterStation(station: WaterStation): void {
    const list = this.getWaterStations();
    const idx = list.findIndex(s => s.id === station.id);
    if (idx >= 0) list[idx] = station;
    else list.unshift(station);
    setStorage(STORAGE_KEYS.WATER_STATIONS, list);
  },

  reportWaterStation(stationId: string, issueType: 'empty' | 'broken' | 'unhygienic' | 'working_properly', comments?: string): void {
    const list = this.getWaterStations();
    const target = list.find(s => s.id === stationId);
    if (target) {
      if (issueType === 'empty') target.status = 'limited';
      if (issueType === 'broken') target.status = 'unavailable';
      if (issueType === 'working_properly') target.status = 'available';
      target.reported_empty_count += (issueType === 'empty' ? 1 : 0);
      setStorage(STORAGE_KEYS.WATER_STATIONS, list);
    }
  },

  // --- SMART HEAT ALERTS (PART 3) ---
  getSmartAlerts(): SmartHeatAlert[] {
    return getStorage<SmartHeatAlert[]>(STORAGE_KEYS.SMART_ALERTS, []);
  },

  saveSmartAlert(alert: SmartHeatAlert): void {
    const list = this.getSmartAlerts();
    const idx = list.findIndex(a => a.id === alert.id);
    if (idx >= 0) list[idx] = alert;
    else list.unshift(alert);
    setStorage(STORAGE_KEYS.SMART_ALERTS, list);
  },

  getAlertSubscriptions(): HeatAlertSubscription[] {
    return getStorage<HeatAlertSubscription[]>(STORAGE_KEYS.ALERT_SUBSCRIPTIONS, []);
  },

  saveAlertSubscription(sub: HeatAlertSubscription): void {
    const list = this.getAlertSubscriptions();
    const idx = list.findIndex(s => s.id === sub.id);
    if (idx >= 0) list[idx] = sub;
    else list.push(sub);
    setStorage(STORAGE_KEYS.ALERT_SUBSCRIPTIONS, list);
  },

  // --- OUTDOOR WORKER SAFETY (PART 5) ---
  getWorkerOrganizations(): WorkerOrganization[] {
    return getStorage<WorkerOrganization[]>(STORAGE_KEYS.WORKER_ORGS, []);
  },

  getWorkerWorkplaces(): WorkerWorkplace[] {
    return getStorage<WorkerWorkplace[]>(STORAGE_KEYS.WORKPLACES, []);
  },

  getOutdoorWorkers(): OutdoorWorker[] {
    return getStorage<OutdoorWorker[]>(STORAGE_KEYS.OUTDOOR_WORKERS, []);
  },

  saveOutdoorWorker(worker: OutdoorWorker): void {
    const list = this.getOutdoorWorkers();
    const idx = list.findIndex(w => w.id === worker.id);
    if (idx >= 0) list[idx] = worker;
    else list.push(worker);
    setStorage(STORAGE_KEYS.OUTDOOR_WORKERS, list);
  },

  checkinWorker(workerId: string, status: 'hydrated_safe' | 'needs_rest' | 'feeling_unwell'): void {
    const list = this.getOutdoorWorkers();
    const target = list.find(w => w.id === workerId);
    if (target) {
      target.last_checkin_status = status;
      target.last_checkin_time = new Date().toISOString();
      setStorage(STORAGE_KEYS.OUTDOOR_WORKERS, list);
    }
  },

  // --- FAMILY SAFETY (PART 9) ---
  getFamilyGroups(): FamilyGroup[] {
    return getStorage<FamilyGroup[]>(STORAGE_KEYS.FAMILY_GROUPS, []);
  },

  saveFamilyGroup(group: FamilyGroup): void {
    const list = this.getFamilyGroups();
    const idx = list.findIndex(g => g.id === group.id);
    if (idx >= 0) list[idx] = group;
    else list.push(group);
    setStorage(STORAGE_KEYS.FAMILY_GROUPS, list);
  },

  // --- SCHOOL SAFETY (PART 10) ---
  getSchools(): SchoolRegistration[] {
    const initial = isProduction ? [] : INITIAL_SCHOOLS;
    return getStorage<SchoolRegistration[]>(STORAGE_KEYS.SCHOOLS, initial);
  },

  saveSchool(school: SchoolRegistration): void {
    const list = this.getSchools();
    const idx = list.findIndex(s => s.id === school.id);
    if (idx >= 0) list[idx] = school;
    else list.push(school);
    setStorage(STORAGE_KEYS.SCHOOLS, list);
  },

  // --- HOSPITAL DIRECTORY (PART 11) ---
  getHospitals(): HospitalResource[] {
    return getStorage<HospitalResource[]>(STORAGE_KEYS.HOSPITALS, INITIAL_HOSPITALS);
  },

  saveHospital(hospital: HospitalResource): void {
    const list = this.getHospitals();
    const idx = list.findIndex(h => h.id === hospital.id);
    if (idx >= 0) list[idx] = hospital;
    else list.push(hospital);
    setStorage(STORAGE_KEYS.HOSPITALS, list);
  },

  // --- SITUATION REPORTS (PART 6) ---
  getSituationReport(): SituationReport {
    const cleanDefault: SituationReport = {
      id: 'sit-rep-live',
      title: 'Municipal Heat Command Situation Briefing',
      generated_at: new Date().toISOString(),
      overall_status: 'normal',
      summary_text: 'Atmospheric telemetry monitored continuously. No verified heat emergency field operations active.',
      key_concerns: [],
      most_affected_localities: [],
      resource_status: {
        cooling_centres_open: 0,
        water_stations_operational: 0,
        active_volunteers: 0,
        emergency_dispatches: 0
      },
      recommended_administrative_actions: [
        'Monitor live telemetry across all ward sectors.',
        'Maintain operational readiness of local drinking water ATMs and cooling centres.'
      ],
      data_freshness_pct: 100
    };
    if (isProduction) return cleanDefault;
    return getStorage<SituationReport>(STORAGE_KEYS.SITUATION_REPORT, cleanDefault);
  },

  saveSituationReport(report: SituationReport): void {
    setStorage(STORAGE_KEYS.SITUATION_REPORT, report);
  },

  // --- HEAT AWARENESS ACADEMY (PART 15) ---
  getAcademyCourses(): AcademyCourse[] {
    return INITIAL_ACADEMY_COURSES;
  },

  getAcademyProgress(): Record<string, { completedLessons: string[]; quizScore?: number }> {
    return getStorage<Record<string, { completedLessons: string[]; quizScore?: number }>>(STORAGE_KEYS.ACADEMY_PROGRESS, {
      'course-residents': { completedLessons: ['res-l1'], quizScore: 100 }
    });
  },

  recordLessonComplete(courseId: string, lessonId: string): void {
    const prog = this.getAcademyProgress();
    if (!prog[courseId]) prog[courseId] = { completedLessons: [] };
    if (!prog[courseId].completedLessons.includes(lessonId)) {
      prog[courseId].completedLessons.push(lessonId);
    }
    setStorage(STORAGE_KEYS.ACADEMY_PROGRESS, prog);
  },

  recordQuizScore(courseId: string, score: number): void {
    const prog = this.getAcademyProgress();
    if (!prog[courseId]) prog[courseId] = { completedLessons: [] };
    prog[courseId].quizScore = score;
    setStorage(STORAGE_KEYS.ACADEMY_PROGRESS, prog);
  },

  // --- SAFE ROUTES (PART 8) ---
  getSafeRoutes(): HeatSafeRoute[] {
    return INITIAL_SAFE_ROUTES;
  },

  // --- OFFLINE SYNC QUEUE (PART 7) ---
  getOfflineQueue(): Array<{ id: string; type: string; payload: any; queuedAt: string }> {
    return getStorage<Array<{ id: string; type: string; payload: any; queuedAt: string }>>(STORAGE_KEYS.OFFLINE_QUEUE, []);
  },

  queueOfflineAction(type: string, payload: any): void {
    const queue = this.getOfflineQueue();
    queue.push({
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      payload,
      queuedAt: new Date().toISOString()
    });
    setStorage(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  },

  clearOfflineQueue(): void {
    setStorage(STORAGE_KEYS.OFFLINE_QUEUE, []);
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
