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
  preferred_language: SupportedLanguage;
  locality_id?: string;
  is_active: boolean;
  created_at: string;
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

