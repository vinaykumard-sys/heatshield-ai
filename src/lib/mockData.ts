import { 
  LocationZone, 
  Resident, 
  UserProfile, 
  WelfareCheckin, 
  AssistanceRequest, 
  AppNotification, 
  ActivityLog, 
  RiskThresholdConfig 
} from '../types';
import { DELHI_LOCALITIES } from './delhiLocalities';
import { BENGALURU_LOCALITIES } from './bengaluruLocalities';

export const INITIAL_LOCATIONS: LocationZone[] = [
  ...BENGALURU_LOCALITIES,
  ...DELHI_LOCALITIES,
  {
    id: 'loc-6',
    name: 'Ahmedabad Old City & Dariapur',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380001',
    latitude: 23.0338,
    longitude: 72.5850,
    baseline_vulnerability_score: 88.0,
    urban_heat_island_factor: 1.50,
    cooling_centers_count: 4,
    estimated_population: 60000,
  },
  {
    id: 'loc-10',
    name: 'Dharavi Sector 5',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400017',
    latitude: 19.0402,
    longitude: 72.8530,
    baseline_vulnerability_score: 91.0,
    urban_heat_island_factor: 1.55,
    cooling_centers_count: 3,
    estimated_population: 75000,
  }
];

export const INITIAL_USERS: UserProfile[] = [];

export const INITIAL_RESIDENTS: Resident[] = [];

export const INITIAL_CHECKINS: WelfareCheckin[] = [];

export const INITIAL_REQUESTS: AssistanceRequest[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];

export const DEFAULT_RISK_CONFIG: RiskThresholdConfig = {
  id: 'cfg-default',
  name: 'NDMA & IMD Indian Heatwave Risk Protocol v2',
  low_max: 35.0,
  moderate_max: 60.0,
  high_max: 80.0,
  critical_min: 80.01,
  temp_weight: 0.35,
  humidity_weight: 0.25,
  vulnerability_weight: 0.20,
  diurnal_weight: 0.20,
  is_active: true,
  updated_at: '2026-04-20T00:00:00Z'
};
