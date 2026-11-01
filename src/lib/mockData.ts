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

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr-admin-1',
    email: 'admin@heatshield.gov.in',
    full_name: 'Dr. Ramesh Sundaram',
    role: 'admin',
    phone: '+91 98450 12345',
    preferred_language: 'en',
    locality_id: 'loc-3',
    is_active: true,
    created_at: '2026-04-10T08:00:00Z'
  },
  {
    id: 'usr-vol-1',
    email: 'volunteer.kavita@heatshield.org',
    full_name: 'Kavita Deshmukh',
    role: 'volunteer',
    phone: '+91 97654 32109',
    preferred_language: 'hi',
    locality_id: 'loc-7',
    is_active: true,
    created_at: '2026-04-12T09:30:00Z'
  },
  {
    id: 'usr-vol-2',
    email: 'volunteer.arun@heatshield.org',
    full_name: 'Arun Kumar Gowda',
    role: 'volunteer',
    phone: '+91 98860 55443',
    preferred_language: 'kn',
    locality_id: 'loc-4',
    is_active: true,
    created_at: '2026-04-14T11:00:00Z'
  },
  {
    id: 'usr-res-1',
    email: 'resident.sham@gmail.com',
    full_name: 'Sham Lal Verma',
    role: 'resident',
    phone: '+91 98112 34567',
    preferred_language: 'hi',
    locality_id: 'loc-1',
    is_active: true,
    created_at: '2026-04-18T14:20:00Z'
  }
];

export const INITIAL_RESIDENTS: Resident[] = [
  {
    id: 'res-blr-1',
    full_name: 'Anjinappa N.',
    age_range: '75_plus',
    locality_id: 'blr-chokkanahalli',
    locality_name: 'Chokkanahalli Road & Thanisandra Hub, Bengaluru',
    contact_phone: '+91 98450 77123',
    emergency_contact_name: 'Gowramma (Daughter)',
    emergency_contact_phone: '+91 98450 88234',
    address_notes: 'Opposite Government Primary School, Chokkanahalli Main Road, Tin Roof House',
    vulnerability_indicators: ['Elderly (75+)', 'Lives Alone', 'Tin/Sheet Roof', 'Hypertension'],
    preferred_language: 'kn',
    consent_status: true,
    consent_date: '2026-04-19T10:00:00Z',
    last_welfare_checkin: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    notes: 'Lives under sheet roof. Needs afternoon hydration check-in and electrolyte packets.',
    created_at: '2026-04-19T10:00:00Z',
    assigned_volunteer_name: 'Arun Kumar Gowda'
  },
  {
    id: 'res-2',
    full_name: 'Parvatiamma K.',
    age_range: '75_plus',
    locality_id: 'blr-shivajinagar',
    locality_name: 'Shivajinagar Settlement, Bengaluru',
    contact_phone: '+91 94481 22334',
    emergency_contact_name: 'Manjula (Neighbor)',
    emergency_contact_phone: '+91 94481 99001',
    address_notes: 'Lane 4, Near Russell Market Canal, Single Room',
    vulnerability_indicators: ['Elderly (75+)', 'Lives Alone', 'No Fan / Poor Ventilation'],
    preferred_language: 'kn',
    consent_status: true,
    consent_date: '2026-04-15T10:00:00Z',
    last_welfare_checkin: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    notes: 'Received ORS packets last week. Check electric fan circuit.',
    created_at: '2026-04-15T10:00:00Z',
    assigned_volunteer_name: 'Arun Kumar Gowda'
  },
  {
    id: 'res-1',
    profile_id: 'usr-res-1',
    full_name: 'Sham Lal Verma',
    age_range: '75_plus',
    locality_id: 'delhi-chandni-chowk',
    locality_name: 'Chandni Chowk Old Ward, Delhi',
    contact_phone: '+91 98112 34567',
    emergency_contact_name: 'Rohit Verma (Son)',
    emergency_contact_phone: '+91 98112 99887',
    address_notes: 'House #42, Gali Paranthe Wali, 2nd Floor (Tin Shed Roof)',
    vulnerability_indicators: ['Elderly (75+)', 'Tin/Asbestos Roof', 'Chronic Cardiac Condition', 'Limited Mobility'],
    preferred_language: 'hi',
    consent_status: true,
    consent_date: '2026-04-18T14:20:00Z',
    last_welfare_checkin: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    notes: 'Needs daily hydration check-in. Lives alone on upper floor under direct tin roof.',
    created_at: '2026-04-18T14:20:00Z',
    assigned_volunteer_name: 'Kavita Deshmukh'
  },
  {
    id: 'res-3',
    full_name: 'Mohammad Farooq',
    age_range: '60_to_74',
    locality_id: 'loc-6',
    locality_name: 'Ahmedabad Old City & Dariapur',
    contact_phone: '+91 98250 88776',
    emergency_contact_name: 'Amina Farooq (Wife)',
    emergency_contact_phone: '+91 98250 88775',
    address_notes: 'Chawl 12, Dariapur Gate, Ground Floor',
    vulnerability_indicators: ['Chronic Respiratory (Asthma)', 'Asbestos Roof', 'Outdoor Street Vendor'],
    preferred_language: 'hi',
    consent_status: true,
    consent_date: '2026-04-16T11:30:00Z',
    last_welfare_checkin: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
    notes: 'Missed yesterday check-in. Asthmatic attacks triggered during hot afternoons.',
    created_at: '2026-04-16T11:30:00Z',
    assigned_volunteer_name: 'Kavita Deshmukh'
  },
  {
    id: 'res-4',
    full_name: 'Muniyappa & Lakshmi (Household)',
    age_range: '60_to_74',
    locality_id: 'loc-3',
    locality_name: 'Peenya Industrial Area & Labour Colony',
    contact_phone: '+91 97410 44556',
    emergency_contact_name: 'Suresh (Community Ward Member)',
    emergency_contact_phone: '+91 97410 99999',
    address_notes: 'Behind Foundry Road, Block B Hutment',
    vulnerability_indicators: ['Elderly Couple', 'Outdoor Brick Worker', 'Lack of Running Potable Water'],
    preferred_language: 'kn',
    consent_status: true,
    consent_date: '2026-04-19T09:15:00Z',
    last_welfare_checkin: undefined, // Never checked in
    notes: 'Urgent need for clean water jerrycan and cooling station location flyer.',
    created_at: '2026-04-19T09:15:00Z',
    assigned_volunteer_name: 'Arun Kumar Gowda'
  },
  {
    id: 'res-5',
    full_name: 'Karpagam V.',
    age_range: 'under_5',
    locality_id: 'loc-5',
    locality_name: 'Vyasarpadi North Industrial Zone, Chennai',
    contact_phone: '+91 94440 66778',
    emergency_contact_name: 'Selvi (Mother)',
    emergency_contact_phone: '+91 94440 66778',
    address_notes: 'Near Railway Siding Line, Tenement Block 8',
    vulnerability_indicators: ['Infant / Under 5', 'Tin Roof', 'High Humidity Prone'],
    preferred_language: 'en',
    consent_status: true,
    consent_date: '2026-04-20T16:00:00Z',
    last_welfare_checkin: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    notes: 'Mother informed child had heat rash. Advised on cool sponge baths.',
    created_at: '2026-04-20T16:00:00Z',
    assigned_volunteer_name: 'Kavita Deshmukh'
  }
];

export const INITIAL_CHECKINS: WelfareCheckin[] = [
  {
    id: 'chk-blr-1',
    resident_id: 'res-blr-1',
    volunteer_id: 'usr-vol-2',
    scheduled_for: new Date().toISOString().slice(0, 10),
    status: 'pending',
    safety_confirmed: false,
    hydration_adequate: true,
    cooling_accessible: false,
    checkin_notes: 'Chokkanahalli Road visit: Deliver ORS electrolyte sachets, check shade temperature and drinking water storage.',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    resident_name: 'Anjinappa N.',
    resident_phone: '+91 98450 77123',
    locality_name: 'Chokkanahalli Road & Thanisandra Hub, Bengaluru',
    volunteer_name: 'Arun Kumar Gowda',
    risk_score: 74.0
  },
  {
    id: 'chk-1',
    resident_id: 'res-1',
    volunteer_id: 'usr-vol-1',
    scheduled_for: new Date().toISOString().slice(0, 10),
    status: 'pending',
    safety_confirmed: false,
    hydration_adequate: true,
    cooling_accessible: false,
    checkin_notes: 'Follow-up on upper floor ventilation and water pot filling.',
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    resident_name: 'Sham Lal Verma',
    resident_phone: '+91 98112 34567',
    locality_name: 'Chandni Chowk Old Ward, Delhi',
    volunteer_name: 'Kavita Deshmukh',
    risk_score: 84.5
  },
  {
    id: 'chk-2',
    resident_id: 'res-2',
    volunteer_id: 'usr-vol-2',
    scheduled_for: new Date().toISOString().slice(0, 10),
    status: 'completed',
    safety_confirmed: true,
    hydration_adequate: true,
    cooling_accessible: true,
    checkin_notes: 'Visited at 11:30 AM. Resident is resting in shade. Drinking boiled water. Fan operational.',
    completed_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    resident_name: 'Parvatiamma K.',
    resident_phone: '+91 94481 22334',
    locality_name: 'Shivajinagar Settlement, Bengaluru',
    volunteer_name: 'Arun Kumar Gowda',
    risk_score: 64.0
  },
  {
    id: 'chk-3',
    resident_id: 'res-3',
    volunteer_id: 'usr-vol-1',
    scheduled_for: new Date().toISOString().slice(0, 10),
    status: 'unable_to_contact',
    safety_confirmed: false,
    hydration_adequate: false,
    cooling_accessible: false,
    checkin_notes: 'Phone unreachable after 3 attempts. Neighbor says he may be at the street market.',
    escalation_reason: 'Unreachable in critical heat condition for >48 hours',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    resident_name: 'Mohammad Farooq',
    resident_phone: '+91 98250 88776',
    locality_name: 'Ahmedabad Old City & Dariapur',
    volunteer_name: 'Kavita Deshmukh',
    risk_score: 89.2
  },
  {
    id: 'chk-4',
    resident_id: 'res-4',
    volunteer_id: 'usr-vol-2',
    scheduled_for: new Date().toISOString().slice(0, 10),
    status: 'pending',
    safety_confirmed: false,
    hydration_adequate: false,
    cooling_accessible: false,
    checkin_notes: 'First time welfare visit. Verify potable water availability.',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    resident_name: 'Muniyappa & Lakshmi (Household)',
    resident_phone: '+91 97410 44556',
    locality_name: 'Peenya Industrial Area & Labour Colony',
    volunteer_name: 'Arun Kumar Gowda',
    risk_score: 72.8
  }
];

export const INITIAL_REQUESTS: AssistanceRequest[] = [
  {
    id: 'req-blr-1',
    resident_id: 'res-blr-1',
    locality_id: 'blr-chokkanahalli',
    category: 'water',
    priority: 'urgent',
    description: 'Chokkanahalli Road tin-sheet dwelling: High afternoon heat (>35°C), resident feeling fatigued and dehydrated. Emergency cool water canister & electrolytes requested.',
    status: 'assigned',
    assigned_volunteer_id: 'usr-vol-2',
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    resident_name: 'Anjinappa N.',
    locality_name: 'Chokkanahalli Road & Thanisandra Hub, Bengaluru',
    assigned_volunteer_name: 'Arun Kumar Gowda',
    contact_phone: '+91 98450 77123'
  },
  {
    id: 'req-1',
    resident_id: 'res-1',
    requested_by: 'usr-res-1',
    locality_id: 'loc-1',
    category: 'water',
    priority: 'urgent',
    description: 'Municipal water supply cut off since yesterday. Upper tin roof is extremely hot; elderly resident needs emergency 20L drinking water and ORS packets.',
    status: 'open',
    assigned_volunteer_id: 'usr-vol-1',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    resident_name: 'Sham Lal Verma',
    locality_name: 'Chandni Chowk Old Ward, Delhi',
    assigned_volunteer_name: 'Kavita Deshmukh',
    contact_phone: '+91 98112 34567'
  },
  {
    id: 'req-2',
    resident_id: 'res-4',
    locality_id: 'loc-3',
    category: 'cooling_centre_transport',
    priority: 'high',
    description: 'Tin hut reaching unbearable temperatures (estimated >44C). Elderly resident feeling dizzy; requests volunteer guidance/escort to Peenya Community Cooling Hall.',
    status: 'assigned',
    assigned_volunteer_id: 'usr-vol-2',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    resident_name: 'Muniyappa & Lakshmi',
    locality_name: 'Peenya Industrial Area, Bengaluru',
    assigned_volunteer_name: 'Arun Kumar Gowda',
    contact_phone: '+91 97410 44556'
  },
  {
    id: 'req-3',
    locality_id: 'loc-6',
    category: 'cooling',
    priority: 'medium',
    description: 'Ceiling fan capacitor burnt out in community childcare center. Requesting spare table fan or shaded shelter referral.',
    status: 'resolved',
    assigned_volunteer_id: 'usr-vol-1',
    resolution_notes: 'Delivered an emergency solar rechargeable fan courtesy of Red Cross Community Shelter.',
    resolved_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    resident_name: 'Dariapur Balwadi Childcare',
    locality_name: 'Ahmedabad Old City & Dariapur',
    assigned_volunteer_name: 'Kavita Deshmukh',
    contact_phone: '+91 98250 11223'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    user_id: 'usr-admin-1',
    title: 'Severe Heatwave Alert (Red Level)',
    message: 'Ahmedabad Old City & Dariapur has exceeded 42.5°C with 55% RH. AI Heat Risk Score: 89.2 (Critical). Immediate volunteer dispatch activated.',
    type: 'critical_risk',
    priority: 'critical',
    is_read: false,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: 'notif-2',
    user_id: 'usr-vol-1',
    title: 'New Urgent Assistance Request',
    message: 'Sham Lal Verma (Chandni Chowk Old Ward) submitted an Urgent Water & Hydration Assistance request.',
    type: 'request_update',
    priority: 'warning',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'notif-3',
    user_id: 'usr-vol-1',
    title: 'Missed Check-in Flagged',
    message: 'Resident Mohammad Farooq was marked "Unable to Contact" during afternoon high heat window.',
    type: 'missed_checkin',
    priority: 'warning',
    is_read: false,
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  },
  {
    id: 'notif-4',
    user_id: 'usr-admin-1',
    title: 'Daily IMD Environmental Telemetry Synced',
    message: '10 Urban Monitoring Zones updated with Open-Meteo & IMD observational telemetry.',
    type: 'system',
    priority: 'info',
    is_read: true,
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act-1',
    actor_id: 'usr-admin-1',
    actor_name: 'Dr. Ramesh Sundaram (Admin)',
    action: 'DISPATCH_COMMUNITY_ALERT',
    target_type: 'location',
    target_id: 'loc-6',
    details: { reason: 'Heat Index exceeded 46°C threshold', locality: 'Ahmedabad Old City' },
    ip_address: '103.21.124.8',
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString()
  },
  {
    id: 'act-2',
    actor_id: 'usr-vol-2',
    actor_name: 'Arun Kumar Gowda (Volunteer)',
    action: 'COMPLETE_WELFARE_CHECKIN',
    target_type: 'welfare_checkin',
    target_id: 'chk-2',
    details: { resident: 'Parvatiamma K.', status: 'completed', hydration: true },
    ip_address: '49.207.210.14',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  },
  {
    id: 'act-3',
    actor_id: 'usr-vol-1',
    actor_name: 'Kavita Deshmukh (Volunteer)',
    action: 'FLAG_UNABLE_TO_CONTACT',
    target_type: 'welfare_checkin',
    target_id: 'chk-3',
    details: { resident: 'Mohammad Farooq', attempts: 3 },
    ip_address: '14.139.110.5',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  },
  {
    id: 'act-4',
    actor_id: 'usr-admin-1',
    actor_name: 'Dr. Ramesh Sundaram (Admin)',
    action: 'ASSIGN_VOLUNTEER',
    target_type: 'assistance_request',
    target_id: 'req-2',
    details: { volunteer: 'Arun Kumar Gowda', request_category: 'cooling_centre_transport' },
    ip_address: '103.21.124.8',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  }
];

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
