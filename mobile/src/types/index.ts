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

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  shadeLevel: 'HIGH' | 'MODERATE' | 'LOW';
}

export interface RouteResult {
  mode: 'walk' | 'cycle' | 'drive';
  distanceMeters: number;
  durationSeconds: number;
  averageHeatIndex: number;
  shadeCoveragePercent: number;
  coolingStopsCount: number;
  steps: RouteStep[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  severity?: 'normal' | 'urgent';
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isNotifiedOnAlert: boolean;
}
