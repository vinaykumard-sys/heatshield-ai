export interface Locality {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  currentTemp: number;
  heatIndex: number;
  wetBulb: number;
  humidity: number;
  uvIndex: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  urbanHeatIslandFactor: number;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  heatIndex: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  humidity?: number;
  uvIndex?: number;
  condition?: string;
  rainProb?: number;
}

export interface DailyForecast {
  id: string;
  dayName: string;
  dateStr: string;
  tempMax: number;
  tempMin: number;
  heatIndexMax: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  condition: string;
  heatwaveRiskPct: number;
  uvIndex: number;
}

export interface CoolingCentre {
  id: string;
  name: string;
  address: string;
  locality: string;
  city: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  operatingHours: string;
  isOpen: boolean;
  distanceKm?: number;
  amenities: string[];
}

export interface WaterPoint {
  id: string;
  name: string;
  address: string;
  locality: string;
  latitude: number;
  longitude: number;
  isOperational: boolean;
  waterType: 'Chilled RO Purified' | 'Potable Water Kiosk' | 'Municipal Hydrant';
  distanceKm?: number;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  shadeLevel: 'HIGH' | 'MODERATE' | 'LOW';
  landmark?: string;
}

export interface RouteCheckpoint {
  title: string;
  desc: string;
  type: 'start' | 'end' | 'cooling' | 'water' | 'hazard';
  distanceMeters?: number;
}

export type RouteVariantType = 'coolest' | 'respite' | 'fastest';

export interface RouteResult {
  variant: RouteVariantType;
  title: string;
  subtitle: string;
  mode: 'walk' | 'cycle' | 'drive';
  distanceMeters: number;
  durationSeconds: number;
  averageHeatIndex: number;
  shadeCoveragePercent: number;
  coolingStopsCount: number;
  waterStopsCount: number;
  steps: RouteStep[];
  checkpoints: RouteCheckpoint[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  severity?: 'normal' | 'urgent';
  relatedShelter?: CoolingCentre;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isNotifiedOnAlert: boolean;
}

export interface AssistanceRequest {
  id: string;
  category: string;
  requesterName: string;
  requesterPhone: string;
  localityName: string;
  urgency: 'CRITICAL_IMMEDIATE' | 'HIGH_PRIORITY' | 'ROUTINE_AID';
  notes: string;
  status: 'SUBMITTED' | 'DISPATCHED' | 'EN_ROUTE' | 'DELIVERED';
  timestamp: string;
  etaMinutes: number;
  assignedResponder?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  role: 'Resident' | 'Community Heat Warden' | 'Health Officer' | 'NGO Volunteer';
  hasElderlyAtHome: boolean;
  outdoorWorker: boolean;
}
