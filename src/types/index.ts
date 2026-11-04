export type UserRole = 'admin' | 'volunteer' | 'resident';

export type RiskCategory = 'low' | 'moderate' | 'high' | 'critical';

export type CheckinPriority = 'routine' | 'elevated' | 'urgent' | 'immediate';

export type CheckinStatus = 'pending' | 'in_progress' | 'completed' | 'unable_to_contact' | 'escalated';

export type RequestCategory = 'water' | 'cooling' | 'general_welfare' | 'cooling_centre_transport' | 'other';

export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export type RequestStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';

export type NotificationType = 'environmental_alert' | 'critical_risk' | 'missed_checkin' | 'request_update' | 'volunteer_assignment' | 'system';

export type NotificationPriority = 'info' | 'warning' | 'critical';

export type SupportedLanguage = 'en' | 'hi' | 'kn';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  country_code?: string;
  is_phone_verified?: boolean;
  is_email_verified?: boolean;
  phone_verified_at?: string;
  email_verified_at?: string;
  hourly_notification_consent?: boolean;
  notification_consent_at?: string;
  primary_locality_name?: string;
  primary_latitude?: number;
  primary_longitude?: number;
  preferred_language: SupportedLanguage;
  locality_id?: string;
  is_active: boolean;
  created_at: string;
}

// --- RESIDENT-FIRST EXPANSIONS & NOTIFICATION SYSTEM ---
export interface NotificationConsent {
  id: string;
  user_id: string;
  consent_type: 'hourly_heat_updates' | 'critical_emergency_alerts';
  channels: Array<'email' | 'sms' | 'in_app'>;
  phone_number?: string;
  email_address?: string;
  consented_at: string;
  ip_address?: string;
}

export interface UserNotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  hourly_updates_enabled: boolean;
  critical_alerts_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  updated_at: string;
}

export interface UserFavouriteLocation {
  id: string;
  user_id: string;
  label: 'Home' | 'Workplace' | 'School' | 'Parents' | 'Other';
  name: string;
  locality: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  is_primary: boolean;
  created_at: string;
}

export interface ScheduledNotificationJob {
  id: string;
  scheduled_for: string;
  executed_at: string;
  duration_ms: number;
  status: 'running' | 'completed' | 'failed';
  total_eligible_residents: number;
  emails_dispatched: number;
  sms_dispatched: number;
  failures: number;
  error_summary?: string;
}

export interface NotificationDeliveryLog {
  id: string;
  job_id?: string;
  user_id: string;
  resident_name: string;
  recipient_masked: string;
  channel: 'email' | 'sms';
  locality_name: string;
  temperature_c: number;
  feels_like_c: number;
  heat_risk_category: RiskCategory;
  heat_risk_score: number;
  idempotency_key: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'skipped';
  provider: 'resend_email' | 'transactional_sms' | 'supabase_edge';
  provider_message_id?: string;
  error_message?: string;
  created_at: string;
}

export interface CommunityIssueReport {
  id: string;
  reporter_id?: string;
  reporter_name?: string;
  facility_type: 'water_station' | 'cooling_centre' | 'hospital' | 'general_hazard';
  facility_id?: string;
  facility_name: string;
  locality_name: string;
  issue_type: 'empty_water' | 'broken_dispenser' | 'closed_unexpectedly' | 'unhygienic' | 'overcrowded' | 'other';
  description: string;
  status: 'pending_review' | 'investigating' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface LocationZone {
  id: string;
  name: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  baseline_vulnerability_score: number; // 0-100
  urban_heat_island_factor: number;    // e.g. 1.15 to 1.55
  cooling_centers_count: number;
  estimated_population: number;
  // Dynamic fields
  current_reading?: EnvironmentalReading;
  current_risk?: HeatRiskAssessment;
}

export interface EnvironmentalReading {
  id: string;
  location_id: string;
  temperature_c: number;
  relative_humidity_pct: number;
  feels_like_c: number;
  heat_index_c: number;
  wet_bulb_c?: number;
  uv_index: number;
  wind_speed_kmh: number;
  weather_condition: string;
  data_source: 'open_meteo' | 'imd_station' | 'community_sensor' | 'simulated';
  recorded_at: string;
}

export interface ContributingFactors {
  ambient_temperature_score: number;
  humidity_heat_index_score: number;
  urban_exposure_score: number;
  diurnal_peak_score: number;
  vulnerability_baseline_score: number;
  weights: {
    temp: number;
    humidity: number;
    vulnerability: number;
    diurnal: number;
  };
}

export interface HeatRiskAssessment {
  id: string;
  location_id: string;
  risk_score: number; // 0-100
  risk_category: RiskCategory;
  contributing_factors: ContributingFactors;
  ai_explanation: string;
  preventive_actions: string[];
  checkin_priority: CheckinPriority;
  confidence_score: number;
  calculated_at: string;
}

export interface Resident {
  id: string;
  profile_id?: string;
  full_name: string;
  age_range: 'under_5' | '5_to_17' | '18_to_59' | '60_to_74' | '75_plus';
  locality_id: string;
  locality_name?: string;
  contact_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address_notes?: string;
  vulnerability_indicators: string[]; // e.g. ["Elderly (75+)", "Tin/Asbestos Roof", "Respiratory Condition", "Outdoor Worker"]
  preferred_language: SupportedLanguage;
  consent_status: boolean;
  consent_date: string;
  last_welfare_checkin?: string;
  notes?: string;
  created_at: string;
  // Computed fields
  assigned_volunteer_name?: string;
  active_request_count?: number;
  calculated_priority_rank?: number;
}

export interface VolunteerAssignment {
  id: string;
  volunteer_id: string;
  resident_id: string;
  assigned_by?: string;
  status: 'active' | 'completed' | 'reassigned';
  assigned_at: string;
  // Joins
  volunteer_name?: string;
  resident_name?: string;
  resident_locality?: string;
}

export interface WelfareCheckin {
  id: string;
  resident_id: string;
  volunteer_id?: string;
  scheduled_for: string; // YYYY-MM-DD
  status: CheckinStatus;
  safety_confirmed: boolean;
  hydration_adequate: boolean;
  cooling_accessible: boolean;
  checkin_notes?: string;
  escalation_reason?: string;
  completed_at?: string;
  created_at: string;
  // Joins
  resident_name?: string;
  resident_phone?: string;
  locality_name?: string;
  volunteer_name?: string;
  risk_score?: number;
}

export interface AssistanceRequest {
  id: string;
  resident_id?: string;
  requested_by?: string;
  locality_id: string;
  category: RequestCategory;
  priority: RequestPriority;
  description: string;
  status: RequestStatus;
  assigned_volunteer_id?: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  // Joins
  resident_name?: string;
  locality_name?: string;
  assigned_volunteer_name?: string;
  contact_phone?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id?: string;
  actor_name?: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface RiskThresholdConfig {
  id: string;
  name: string;
  low_max: number;
  moderate_max: number;
  high_max: number;
  critical_min: number;
  temp_weight: number;
  humidity_weight: number;
  vulnerability_weight: number;
  diurnal_weight: number;
  is_active: boolean;
  updated_at: string;
}

// ==============================================================================
// ADVANCED FEATURE 1: AI HEATWAVE PREDICTION TYPES
// ==============================================================================
export interface HeatForecast {
  id: string;
  location_id: string;
  location_name?: string;
  city?: string;
  forecast_horizon_hours: 24 | 48 | 72;
  forecast_date: string; // ISO string
  predicted_temperature_c: number;
  predicted_humidity_pct: number;
  predicted_feels_like_c: number;
  predicted_heat_index_c: number;
  predicted_risk_score: number; // 0-100
  risk_category: RiskCategory;
  risk_trend: 'rising' | 'steady' | 'declining';
  confidence_score: number; // 0-1
  contributing_factors: ContributingFactors;
  ai_explanation: string;
  preventive_actions: string[];
  is_live_telemetry: boolean;
  created_at: string;
}

export interface PredictionComparison {
  horizon: '24h' | '48h' | '72h';
  predicted_temp: number;
  actual_temp?: number;
  predicted_risk: number;
  actual_risk?: number;
  variance_pct?: number;
  accuracy_label: string;
}

// ==============================================================================
// ADVANCED FEATURE 2 & 3: COOLING CENTRE TYPES
// ==============================================================================
export type CoolingCentreVerificationStatus = 
  | 'verified' 
  | 'pending_verification' 
  | 'temporarily_unavailable' 
  | 'rejected' 
  | 'needs_reverification';

export interface CoolingCentre {
  id: string;
  name: string;
  address: string;
  locality_id?: string;
  locality_name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  contact_phone?: string;
  operating_hours: string; // e.g. "09:00 AM - 07:00 PM"
  operating_status: 'open' | 'closed' | 'overcapacity';
  capacity_estimate: number;
  wheelchair_accessible: boolean;
  drinking_water_available: boolean;
  air_conditioned: boolean;
  indoor_seating: boolean;
  medical_kit_available: boolean;
  verification_status: CoolingCentreVerificationStatus;
  verified_by?: string;
  last_verified_at?: string;
  created_at: string;
  updated_at: string;
  // Computed distance
  distance_km?: number;
}

export interface CoolingCentreReport {
  id: string;
  centre_id: string;
  reported_by?: string;
  reporter_name?: string;
  issue_type: 'closed_unexpectedly' | 'no_water' | 'overcrowded' | 'incorrect_location' | 'other';
  description: string;
  status: 'pending_review' | 'resolved' | 'dismissed';
  created_at: string;
}

// Public Water Point for Map Layers
export interface PublicWaterPoint {
  id: string;
  name: string;
  locality_name: string;
  latitude: number;
  longitude: number;
  water_type: 'purified_tap' | 'chilled_dispenser' | 'tanker' | 'civic_kiosk';
  is_operational: boolean;
}

// ==============================================================================
// ADVANCED FEATURE 4: SMART WELFARE PRIORITY ENGINE TYPES
// ==============================================================================
export interface WelfarePriorityCalculation {
  resident_id: string;
  priority_score: number; // 0-100
  priority_tier: 'immediate' | 'urgent' | 'elevated' | 'routine';
  reasons: string[];
  days_overdue: number;
  risk_factor_weight: number;
  vulnerability_factor_weight: number;
  unsuccessful_attempts_weight: number;
  calculated_at: string;
}

// ==============================================================================
// ADVANCED FEATURE 5: MULTILINGUAL AI VOICE ASSISTANT TYPES
// ==============================================================================
export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  language: SupportedLanguage;
  intent?: string;
  data_payload?: Record<string, any>;
  audio_available?: boolean;
  created_at: string;
}

export interface AssistantSuggestedPrompt {
  id: string;
  text: string;
  language: SupportedLanguage;
  category: 'heat_risk' | 'forecast' | 'cooling_centre' | 'welfare' | 'safety';
}

// ==============================================================================
// ADVANCED FEATURE 6: WHAT-IF HEAT SIMULATION ENGINE TYPES
// ==============================================================================
export interface SimulationParameters {
  temperature_delta_c: number;     // e.g. -5 to +8
  humidity_delta_pct: number;      // e.g. -20 to +30
  wind_speed_kmh: number;          // 0 to 40
  vegetation_coverage_pct: number; // 0 to 100
  cooling_centres_offline: boolean;
  additional_volunteers: number;   // 0 to 50
  target_locality_id?: string;     // 'all' or specific locality
}

export interface SimulationLocalityResult {
  location_id: string;
  location_name: string;
  baseline_temp: number;
  simulated_temp: number;
  baseline_risk: number;
  simulated_risk: number;
  baseline_category: RiskCategory;
  simulated_category: RiskCategory;
  is_above_35: boolean; // Triggers red circle if > 35°C
  resource_deficit: string;
}

export interface HeatSimulationResult {
  id: string;
  name: string;
  description?: string;
  parameters: SimulationParameters;
  created_at: string;
  created_by?: string;
  summary: {
    average_risk_delta: number;
    critical_neighbourhoods_count: number;
    additional_at_risk_residents: number;
    recommended_interventions: string[];
  };
  locality_results: SimulationLocalityResult[];
  ai_impact_analysis: string;
}

// ==============================================================================
// ADVANCED FEATURE 7: GEOSPATIAL INTELLIGENCE & LOCATION HEAT REPORTS
// ==============================================================================
export interface GeocodedPlace {
  id: string;
  displayName: string;
  shortName: string;
  subArea?: string;
  city: string;
  state: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  type: 'city' | 'locality' | 'road' | 'postcode' | 'landmark' | 'coordinate';
}

export interface LocationHeatReport {
  id: string;
  user_id?: string;
  location_name: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  feels_like: number;
  wind_speed_kmh?: number;
  weather_condition?: string;
  risk_score: number;
  risk_category: 'low' | 'moderate' | 'high' | 'critical';
  contributing_factors?: {
    temperature_factor: number;
    humidity_factor: number;
    solar_diurnal_factor: number;
    urban_exposure_factor: number;
  };
  forecast_data: {
    pred24h_temp: number;
    pred24h_risk: number;
    pred48h_temp: number;
    pred48h_risk: number;
    pred72h_temp: number;
    pred72h_risk: number;
  };
  ai_explanation: string;
  recommended_actions: string[];
  data_source: string;
  data_timestamp: string;
  created_at: string;
}



// ==============================================================================
// ADVANCED PLATFORM EXPANSION TYPES
// ==============================================================================

// --- PART 3: SMART HEAT ALERTS ---
export type AlertSeverity = 'advisory' | 'high' | 'critical';
export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms' | 'whatsapp';

export interface HeatAlertSubscription {
  id: string;
  user_id: string;
  location_id: string;
  location_name: string;
  high_threshold: number; // default 50
  critical_threshold: number; // default 75
  channels: NotificationChannel[];
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string; // e.g. "22:00"
  quiet_hours_end?: string;   // e.g. "06:00"
  is_active: boolean;
  created_at: string;
}

export interface SmartHeatAlert {
  id: string;
  location_id: string;
  location_name: string;
  city: string;
  severity: AlertSeverity;
  headline: string;
  description: string;
  risk_score: number;
  trigger_reason: string;
  expected_duration_hours: number;
  recommended_actions: string[];
  issued_by: string; // e.g. "HeatShield Autonomous Engine" or "Admin"
  is_active: boolean;
  created_at: string;
  delivery_stats?: {
    in_app_count: number;
    push_count: number;
    email_count: number;
    delivered_count: number;
  };
}

// --- PART 4: WATER AVAILABILITY TRACKER ---
export type WaterStationStatus = 'available' | 'limited' | 'unavailable' | 'maintenance' | 'unverified';
export type WaterType = 'purified_chilled' | 'mineral_water_atm' | 'filtered_tap' | 'tanker_point';

export interface WaterStation {
  id: string;
  name: string;
  address: string;
  locality_name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  status: WaterStationStatus;
  water_type: WaterType;
  operating_hours: string;
  free_access: boolean;
  price_per_litre?: number;
  wheelchair_accessible: boolean;
  reported_empty_count: number;
  last_verified_at: string;
  verified_by?: string;
  photo_url?: string;
  created_at: string;
}

export interface WaterStationReport {
  id: string;
  station_id: string;
  reporter_name?: string;
  issue_type: 'empty' | 'broken' | 'unhygienic' | 'working_properly';
  comments?: string;
  photo_url?: string;
  created_at: string;
  is_resolved: boolean;
}

// --- PART 5: OUTDOOR WORKER SAFETY MANAGER ---
export interface WorkerOrganization {
  id: string;
  name: string;
  industry: 'construction' | 'delivery_logistics' | 'street_vending' | 'agriculture' | 'municipal';
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  total_workers: number;
  created_at: string;
}

export interface WorkerWorkplace {
  id: string;
  org_id: string;
  org_name: string;
  name: string;
  address: string;
  locality_name: string;
  latitude: number;
  longitude: number;
  shift_start: string; // "07:00"
  shift_end: string;   // "16:00"
  wbgt_threshold: number; // Wet Bulb Globe Temp threshold e.g. 30.0°C
  rest_interval_minutes: number; // e.g. 15 min per hour at high heat
  drinking_water_nearby: boolean;
  shaded_shelter_available: boolean;
  created_at: string;
}

export interface OutdoorWorker {
  id: string;
  org_id: string;
  workplace_id: string;
  worker_id_code: string;
  full_name: string;
  role_title: string;
  shift_name: 'morning' | 'afternoon' | 'full_day';
  preferred_language: 'en' | 'hi' | 'kn';
  emergency_contact?: string;
  consent_agreed: boolean;
  is_on_duty: boolean;
  last_checkin_status?: 'hydrated_safe' | 'needs_rest' | 'feeling_unwell';
  last_checkin_time?: string;
  created_at: string;
}

export interface WorkerSafetyReport {
  workplace_id: string;
  workplace_name: string;
  ambient_temp_c: number;
  humidity_pct: number;
  estimated_wbgt_c: number;
  wbgt_risk_level: 'low' | 'moderate' | 'high' | 'extreme';
  work_rest_cycle: string; // e.g. "45 min work / 15 min rest"
  hydration_target_litres_per_hour: number; // e.g. 0.75 L/hr
  active_workers_count: number;
  pending_checkins_count: number;
}

// --- PART 6: COMMAND CENTRE & SITUATION REPORTS ---
export interface SituationReport {
  id: string;
  title: string;
  generated_at: string;
  overall_status: 'normal' | 'heightened_vigilance' | 'severe_heat_emergency';
  summary_text: string;
  key_concerns: string[];
  most_affected_localities: Array<{
    name: string;
    temperature: number;
    risk_score: number;
    pending_checkins: number;
  }>;
  resource_status: {
    cooling_centres_open: number;
    water_stations_operational: number;
    active_volunteers: number;
    emergency_dispatches: number;
  };
  recommended_administrative_actions: string[];
  data_freshness_pct: number;
}

// --- PART 8: HEAT-SAFE ROUTE PLANNER ---
export interface RouteWaypoint {
  name: string;
  latitude: number;
  longitude: number;
  type: 'start' | 'end' | 'shade_canopy' | 'cooling_centre' | 'water_atm';
}

export interface HeatSafeRoute {
  id: string;
  route_type: 'shortest' | 'low_heat_exposure' | 'respite_optimized';
  label: string;
  distance_km: number;
  duration_minutes: number;
  heat_exposure_score: number; // 0-100 (lower is better)
  shade_coverage_pct: number;  // 0-100
  water_points_count: number;
  cooling_centres_count: number;
  coordinates: Array<[number, number]>;
  summary: string;
  warnings?: string[];
}

// --- PART 9: FAMILY SAFETY DASHBOARD ---
export interface FamilyMember {
  id: string;
  group_id: string;
  name: string;
  relationship: 'parent' | 'child' | 'spouse' | 'grandparent' | 'sibling' | 'relative';
  phone?: string;
  locality_name: string;
  latitude?: number;
  longitude?: number;
  consent_given: boolean;
  location_sharing_active: boolean;
  last_status: 'safe' | 'cooling_down' | 'needs_water' | 'emergency';
  last_checkin_at: string;
  temperature_at_location?: number;
  risk_at_location?: number;
}

export interface FamilyGroup {
  id: string;
  owner_id: string;
  group_name: string;
  invite_code: string;
  members: FamilyMember[];
  created_at: string;
}

// --- PART 10: SCHOOL SAFETY MODE ---
export interface SchoolRegistration {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  contact_email: string;
  contact_phone: string;
  principal_name: string;
  student_count: number;
  operating_hours: string;
  outdoor_activity_curfew_temp: number; // e.g. 36.0°C
  has_shaded_playgrounds: boolean;
  water_fountains_count: number;
  ac_halls_count: number;
  verification_status: 'verified' | 'pending';
  created_at: string;
}

export interface SchoolActivityGuidance {
  outdoor_status: 'permitted' | 'restricted_shade_only' | 'suspended_indoor_only';
  status_headline: string;
  status_explanation: string;
  hydration_interval_minutes: number;
  recess_recommendation: string;
  sports_recommendation: string;
}

// --- PART 11: HOSPITAL RESOURCE DIRECTORY ---
export interface HospitalResource {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
  emergency_phone: string;
  general_phone: string;
  operating_hours: string; // e.g. "24/7 Emergency"
  emergency_department_open: boolean;
  has_heatstroke_ward: boolean;
  has_burn_icu: boolean;
  has_pediatric_emergency: boolean;
  ambulance_available: boolean;
  verification_status: 'verified' | 'unverified';
  last_verified_at: string;
}

// --- PART 14: IMPACT METRICS ---
export interface ImpactStatistics {
  total_neighbourhoods_monitored: number;
  total_registered_residents: number;
  total_active_volunteers: number;
  welfare_checkins_completed: number;
  welfare_checkins_pending: number;
  assistance_requests_submitted: number;
  assistance_requests_resolved: number;
  verified_cooling_centres: number;
  verified_water_stations: number;
  participating_schools: number;
  registered_workplace_orgs: number;
  heat_alerts_delivered: number;
  historical_trends: Array<{
    date: string;
    avg_temp: number;
    max_temp: number;
    alerts_count: number;
    checkins_count: number;
  }>;
}

// --- PART 15: HEAT AWARENESS ACADEMY ---
export interface AcademyQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface AcademyLesson {
  id: string;
  title: string;
  reading_time_mins: number;
  summary: string;
  content: string[];
  key_takeaways: string[];
}

export interface AcademyCourse {
  id: string;
  role_target: 'residents' | 'workers' | 'schools' | 'volunteers';
  badge_title: string;
  title: string;
  description: string;
  icon_name: string;
  lessons: AcademyLesson[];
  quiz: AcademyQuizQuestion[];
}
