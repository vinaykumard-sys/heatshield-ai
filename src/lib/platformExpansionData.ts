import { 
  WaterStation, 
  SmartHeatAlert, 
  HeatAlertSubscription, 
  WorkerOrganization, 
  WorkerWorkplace, 
  OutdoorWorker, 
  FamilyGroup, 
  SchoolRegistration, 
  HospitalResource, 
  SituationReport, 
  AcademyCourse,
  HeatSafeRoute 
} from '../types';

// ==============================================================================
// 1. WATER STATIONS (PART 4)
// ==============================================================================
export const INITIAL_WATER_STATIONS: WaterStation[] = [
  {
    id: 'ws-1',
    name: 'Hebbal Flyover BMTC Bus Shelter RO ATM',
    address: 'Near Hebbal Bus Depot, Outer Ring Road Junction, Hebbal',
    locality_name: 'Hebbal Flyover & Kempapura Slum Cluster',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 13.0365,
    longitude: 77.5975,
    status: 'available',
    water_type: 'mineral_water_atm',
    operating_hours: '05:30 AM - 11:00 PM',
    free_access: true,
    price_per_litre: 0.00,
    wheelchair_accessible: true,
    reported_empty_count: 0,
    verified_by: 'BWSSB Municipal Water Authority',
    last_verified_at: '2026-05-01T09:30:00Z',
    created_at: '2026-04-10T08:00:00Z'
  },
  {
    id: 'ws-2',
    name: 'Chokkanahalli Gram Panchayat Chilled Water Booth',
    address: 'Opposite Govt Primary School, Thanisandra Main Road',
    locality_name: 'Chokkanahalli Road & Thanisandra Hub',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 13.0855,
    longitude: 77.6315,
    status: 'available',
    water_type: 'purified_chilled',
    operating_hours: '06:00 AM - 10:00 PM',
    free_access: true,
    price_per_litre: 0.00,
    wheelchair_accessible: true,
    reported_empty_count: 0,
    verified_by: 'Gram Panchayat Public Utilities',
    last_verified_at: '2026-05-02T08:15:00Z',
    created_at: '2026-04-12T09:00:00Z'
  },
  {
    id: 'ws-3',
    name: 'Shivaji Nagar Bus Terminus Public Drinking Fountain',
    address: 'Platform 3 Entrance, Shivaji Nagar',
    locality_name: 'Shivaji Nagar & Commercial St Market',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9860,
    longitude: 77.6035,
    status: 'limited',
    water_type: 'mineral_water_atm',
    operating_hours: '24 Hours',
    free_access: false,
    price_per_litre: 1.00,
    wheelchair_accessible: false,
    reported_empty_count: 2,
    verified_by: 'BMTC Transit Authority',
    last_verified_at: '2026-05-01T14:45:00Z',
    created_at: '2026-04-15T11:00:00Z'
  },
  {
    id: 'ws-4',
    name: 'Peenya 1st Stage Labour Rest Shed Water Point',
    address: 'Near Cross 4, Peenya Industrial Area',
    locality_name: 'Peenya Industrial Area & Labour Settlements',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 13.0290,
    longitude: 77.5255,
    status: 'available',
    water_type: 'purified_chilled',
    operating_hours: '06:00 AM - 08:30 PM',
    free_access: true,
    price_per_litre: 0.00,
    wheelchair_accessible: true,
    reported_empty_count: 0,
    verified_by: 'Peenya Industries Association Safety Cell',
    last_verified_at: '2026-05-02T10:00:00Z',
    created_at: '2026-04-18T10:00:00Z'
  },
  {
    id: 'ws-5',
    name: 'Indiranagar 100ft Road Metro Pillar 42 ATM',
    address: '100 Feet Road, Near CMH Hospital Junction',
    locality_name: 'Indiranagar 100ft Road & BDA Complex',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9775,
    longitude: 77.6415,
    status: 'maintenance',
    water_type: 'mineral_water_atm',
    operating_hours: '07:00 AM - 10:00 PM',
    free_access: false,
    price_per_litre: 2.00,
    wheelchair_accessible: true,
    reported_empty_count: 4,
    verified_by: 'BMRCL Metro Utilities',
    last_verified_at: '2026-05-01T17:00:00Z',
    created_at: '2026-04-20T12:00:00Z'
  },
  {
    id: 'ws-6',
    name: 'Whitefield ITPL Main Gate Hydration Kiosk',
    address: 'Main Gate, International Tech Park, Whitefield',
    locality_name: 'Whitefield ITPL & Garudacharpalya',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9865,
    longitude: 77.7380,
    status: 'available',
    water_type: 'purified_chilled',
    operating_hours: '07:00 AM - 09:00 PM',
    free_access: true,
    price_per_litre: 0.00,
    wheelchair_accessible: true,
    reported_empty_count: 0,
    verified_by: 'Whitefield Municipal Health Cell',
    last_verified_at: '2026-05-02T09:00:00Z',
    created_at: '2026-04-22T08:30:00Z'
  }
];

// ==============================================================================
// 2. SMART HEAT ALERTS (PART 3)
// ==============================================================================
export const INITIAL_SMART_ALERTS: SmartHeatAlert[] = [
  {
    id: 'alt-1',
    location_id: 'loc-del-1',
    location_name: 'Chandni Chowk & Old Delhi Rail Station',
    city: 'Delhi',
    severity: 'critical',
    headline: 'Severe Diurnal Heatwave Warning (41.5°C Ambient)',
    description: 'Hyperlocal urban canyoning and high building thermal inertia have driven ambient temperatures above 41°C. Outdoor exposure strictly discouraged between 11:30 AM and 4:30 PM.',
    risk_score: 88.5,
    trigger_reason: 'Ambient temperature crossed 40.0°C and feels-like index exceeded 46°C with extreme solar irradiance.',
    expected_duration_hours: 8,
    recommended_actions: [
      'Relocate vulnerable elders to air-conditioned community respite rooms immediately.',
      'Halt direct outdoor construction and manual unshaded labor.',
      'Municipal water tankers dispatched to Old Delhi railway cluster.'
    ],
    issued_by: 'HeatShield Autonomous AI Engine',
    is_active: true,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    delivery_stats: {
      in_app_count: 1420,
      push_count: 980,
      email_count: 650,
      delivered_count: 3050
    }
  },
  {
    id: 'alt-2',
    location_id: 'loc-1',
    location_name: 'Hebbal Flyover & Kempapura Slum Cluster',
    city: 'Bengaluru',
    severity: 'high',
    headline: 'High Heat Advisory & Dry Air Heat Spike (35.8°C)',
    description: 'Slum cluster tin roofs exhibiting surface temperatures up to 48°C. Active welfare volunteer rounds initiated for infants and elderly residents.',
    risk_score: 72.4,
    trigger_reason: 'Sustained temperature above 35.0°C threshold with elevated asphalt heat emission.',
    expected_duration_hours: 5,
    recommended_actions: [
      'Drink 500ml of ORS or water hourly.',
      'Visit Hebbal Govt Health Post Cooling Center for free hydration and cold air respite.',
      'Keep curtains and reflective window blinds drawn.'
    ],
    issued_by: 'HeatShield Autonomous AI Engine',
    is_active: true,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    delivery_stats: {
      in_app_count: 850,
      push_count: 610,
      email_count: 420,
      delivered_count: 1880
    }
  },
  {
    id: 'alt-3',
    location_id: 'loc-4',
    location_name: 'Peenya Industrial Area & Labour Settlements',
    city: 'Bengaluru',
    severity: 'high',
    headline: 'Occupational Heat Exposure Warning for Metal & Chemical Units',
    description: 'High indoor factory temperatures compounding outdoor 35.2°C ambient reading. Mandatory 15-minute rest breaks every hour recommended.',
    risk_score: 69.8,
    trigger_reason: 'Industrial microclimate compounding high afternoon humidity and radiation.',
    expected_duration_hours: 6,
    recommended_actions: [
      'Employers must ensure chilled drinking water access within 50 meters of workstations.',
      'Rotate outdoor loading bay workers every 45 minutes.',
      'Watch for muscle cramps, dizziness, and rapid pulse.'
    ],
    issued_by: 'State Disaster Management Authority',
    is_active: true,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    delivery_stats: {
      in_app_count: 0,
      push_count: 0,
      email_count: 0,
      delivered_count: 0
    }
  }
];

// ==============================================================================
// 3. OUTDOOR WORKER SAFETY MANAGER (PART 5)
// ==============================================================================
export const INITIAL_WORKER_ORGS: WorkerOrganization[] = [
  {
    id: 'org-1',
    name: 'L&T Metro Infrastructure Project Zone 4',
    industry: 'construction',
    contact_person: 'Er. Rajesh Narang',
    contact_phone: '+91 98450 11223',
    contact_email: 'rajesh.narang@ltmetro.com',
    total_workers: 180,
    created_at: '2026-03-15T08:00:00Z'
  },
  {
    id: 'org-2',
    name: 'QuickBite Logistics & Delivery Fleet (North Hub)',
    industry: 'delivery_logistics',
    contact_person: 'Vikas Mehra',
    contact_phone: '+91 99001 44556',
    contact_email: 'vikas.m@quickbitelogistics.in',
    total_workers: 95,
    created_at: '2026-03-20T09:00:00Z'
  },
  {
    id: 'org-3',
    name: 'BBMP Ward 12 Sanitation & Waste Handlers',
    industry: 'municipal',
    contact_person: 'Sunita Patil',
    contact_phone: '+91 94480 77889',
    contact_email: 'sunita.bbmp12@karnataka.gov.in',
    total_workers: 64,
    created_at: '2026-03-25T10:00:00Z'
  }
];

export const INITIAL_WORKPLACES: WorkerWorkplace[] = [
  {
    id: 'wp-1',
    org_id: 'org-1',
    org_name: 'L&T Metro Infrastructure Project Zone 4',
    name: 'Hebbal Elevated Metro Flyover Pillar Site',
    address: 'Near Hebbal Lake Junction, Outer Ring Rd',
    locality_name: 'Hebbal Flyover & Kempapura Slum Cluster',
    latitude: 13.0370,
    longitude: 77.5980,
    shift_start: '06:30',
    shift_end: '15:30',
    wbgt_threshold: 29.5,
    rest_interval_minutes: 15,
    drinking_water_nearby: true,
    shaded_shelter_available: true,
    created_at: '2026-03-16T08:00:00Z'
  },
  {
    id: 'wp-2',
    org_id: 'org-2',
    org_name: 'QuickBite Logistics & Delivery Fleet (North Hub)',
    name: 'Thanisandra Delivery Transit & Sorting Node',
    address: 'Chokkanahalli Main Road, Thanisandra',
    locality_name: 'Chokkanahalli Road & Thanisandra Hub',
    latitude: 13.0860,
    longitude: 77.6310,
    shift_start: '10:00',
    shift_end: '19:00',
    wbgt_threshold: 30.5,
    rest_interval_minutes: 20,
    drinking_water_nearby: true,
    shaded_shelter_available: true,
    created_at: '2026-03-22T09:00:00Z'
  }
];

export const INITIAL_OUTDOOR_WORKERS: OutdoorWorker[] = [
  {
    id: 'wrk-1',
    org_id: 'org-1',
    workplace_id: 'wp-1',
    worker_id_code: 'LT-HEB-041',
    full_name: 'Bablu Yadav',
    role_title: 'Rebar Steel Fixer',
    shift_name: 'morning',
    preferred_language: 'hi',
    emergency_contact: '+91 97112 00334 (Brother)',
    consent_agreed: true,
    is_on_duty: true,
    last_checkin_status: 'hydrated_safe',
    last_checkin_time: new Date(Date.now() - 3600000).toISOString(),
    created_at: '2026-04-01T08:00:00Z'
  },
  {
    id: 'wrk-2',
    org_id: 'org-1',
    workplace_id: 'wp-1',
    worker_id_code: 'LT-HEB-088',
    full_name: 'Muthuvelan K',
    role_title: 'Scaffolding Technician',
    shift_name: 'morning',
    preferred_language: 'en',
    emergency_contact: '+91 98410 44551 (Wife)',
    consent_agreed: true,
    is_on_duty: true,
    last_checkin_status: 'needs_rest',
    last_checkin_time: new Date(Date.now() - 1800000).toISOString(),
    created_at: '2026-04-01T08:30:00Z'
  },
  {
    id: 'wrk-3',
    org_id: 'org-2',
    workplace_id: 'wp-2',
    worker_id_code: 'QB-THN-104',
    full_name: 'Abhishek Gouda',
    role_title: 'Two-Wheeler Delivery Rider',
    shift_name: 'afternoon',
    preferred_language: 'kn',
    emergency_contact: '+91 88840 99881 (Father)',
    consent_agreed: true,
    is_on_duty: true,
    last_checkin_status: 'hydrated_safe',
    last_checkin_time: new Date(Date.now() - 2400000).toISOString(),
    created_at: '2026-04-05T09:00:00Z'
  }
];

// ==============================================================================
// 4. FAMILY SAFETY GROUPS (PART 9) — STRICT OPT-IN, NO MOCK RESIDENTS
// ==============================================================================
export const INITIAL_FAMILY_GROUPS: FamilyGroup[] = [];

// ==============================================================================
// 5. SCHOOL SAFETY MODE (PART 10)
// ==============================================================================
export const INITIAL_SCHOOLS: SchoolRegistration[] = [
  {
    id: 'sch-1',
    name: 'Kendriya Vidyalaya Hebbal Air Force Station',
    address: 'Mekhri Circle / Bellary Road, Hebbal',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 13.0245,
    longitude: 77.5890,
    contact_email: 'kv.hebbal@kvs.ac.in',
    contact_phone: '+91 80 2341 5566',
    principal_name: 'Dr. Meenakshi Sundaram',
    student_count: 850,
    operating_hours: '08:00 AM - 02:30 PM',
    outdoor_activity_curfew_temp: 35.0,
    has_shaded_playgrounds: true,
    water_fountains_count: 14,
    ac_halls_count: 3,
    verification_status: 'verified',
    created_at: '2026-03-10T08:00:00Z'
  },
  {
    id: 'sch-2',
    name: 'Govt Model Higher Primary School Thanisandra',
    address: 'Main Road, Chokkanahalli Cross, Thanisandra',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 13.0840,
    longitude: 77.6295,
    contact_email: 'gmhps.thanisandra@kar.nic.in',
    contact_phone: '+91 80 2846 7788',
    principal_name: 'Shankarappa H. M.',
    student_count: 420,
    operating_hours: '08:30 AM - 03:00 PM',
    outdoor_activity_curfew_temp: 34.5,
    has_shaded_playgrounds: false,
    water_fountains_count: 6,
    ac_halls_count: 1,
    verification_status: 'verified',
    created_at: '2026-03-18T09:00:00Z'
  },
  {
    id: 'sch-3',
    name: 'Delhi Public School East Sarjapur-Whitefield Link',
    address: 'Survey 35, Kodathi Gate, Whitefield Extension',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9120,
    longitude: 77.7150,
    contact_email: 'admin@dpseast.edu.in',
    contact_phone: '+91 80 2844 1122',
    principal_name: 'Geeta Balakrishnan',
    student_count: 1250,
    operating_hours: '07:45 AM - 02:15 PM',
    outdoor_activity_curfew_temp: 35.5,
    has_shaded_playgrounds: true,
    water_fountains_count: 22,
    ac_halls_count: 6,
    verification_status: 'verified',
    created_at: '2026-03-25T11:00:00Z'
  }
];

// ==============================================================================
// 6. HOSPITAL RESOURCE DIRECTORY (PART 11)
// ==============================================================================
export const INITIAL_HOSPITALS: HospitalResource[] = [
  {
    id: 'hosp-1',
    name: 'Victoria Hospital & Trauma Emergency Center (Govt)',
    address: 'Fort Road, Near City Market, Kalasipalya',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9625,
    longitude: 77.5750,
    emergency_phone: '+91 80 2670 1150',
    general_phone: '+91 80 2670 1155',
    operating_hours: '24/7 Emergency & Critical Care',
    emergency_department_open: true,
    has_heatstroke_ward: true,
    has_burn_icu: true,
    has_pediatric_emergency: true,
    ambulance_available: true,
    verification_status: 'verified',
    last_verified_at: '2026-05-01T10:00:00Z'
  },
  {
    id: 'hosp-2',
    name: 'Manipal Hospital Hebbal Emergency Dept',
    address: 'Kirloskar Business Park, Bellary Road, Hebbal',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 13.0530,
    longitude: 77.5925,
    emergency_phone: '+91 80 2502 4444',
    general_phone: '+91 80 2502 4455',
    operating_hours: '24/7 Level 1 Trauma & Resuscitation',
    emergency_department_open: true,
    has_heatstroke_ward: true,
    has_burn_icu: true,
    has_pediatric_emergency: true,
    ambulance_available: true,
    verification_status: 'verified',
    last_verified_at: '2026-05-02T08:00:00Z'
  },
  {
    id: 'hosp-3',
    name: 'KC General Hospital Malleshwaram (Govt)',
    address: '5th Cross Road, Malleshwaram',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 13.0035,
    longitude: 77.5705,
    emergency_phone: '+91 80 2334 1771',
    general_phone: '+91 80 2334 1775',
    operating_hours: '24/7 Emergency',
    emergency_department_open: true,
    has_heatstroke_ward: true,
    has_burn_icu: false,
    has_pediatric_emergency: true,
    ambulance_available: true,
    verification_status: 'verified',
    last_verified_at: '2026-05-01T15:30:00Z'
  },
  {
    id: 'hosp-4',
    name: 'St. John’s Medical College Hospital',
    address: 'Sarjapur Road, John Nagar, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9315,
    longitude: 77.6210,
    emergency_phone: '+91 80 2206 5000',
    general_phone: '+91 80 2206 5001',
    operating_hours: '24/7 Tertiary Emergency',
    emergency_department_open: true,
    has_heatstroke_ward: true,
    has_burn_icu: true,
    has_pediatric_emergency: true,
    ambulance_available: true,
    verification_status: 'verified',
    last_verified_at: '2026-05-02T07:30:00Z'
  },
  {
    id: 'hosp-5',
    name: 'Vaidhehi Institute of Medical Sciences & Hospital',
    address: 'EPIP Zone, Whitefield, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9785,
    longitude: 77.7290,
    emergency_phone: '+91 80 4906 9000',
    general_phone: '+91 80 4906 9005',
    operating_hours: '24/7 Emergency',
    emergency_department_open: true,
    has_heatstroke_ward: true,
    has_burn_icu: true,
    has_pediatric_emergency: true,
    ambulance_available: true,
    verification_status: 'verified',
    last_verified_at: '2026-05-01T12:00:00Z'
  }
];

// ==============================================================================
// 8. SITUATION REPORT (PART 6)
// ==============================================================================
export const INITIAL_SITUATION_REPORT: SituationReport = {
  id: 'sit-rep-today',
  title: 'HeatShield AI Command Situation Briefing',
  generated_at: new Date().toISOString(),
  overall_status: 'heightened_vigilance',
  summary_text: 'Atmospheric telemetry confirms elevated diurnal heat across 6 monitored zones. Chandni Chowk (Delhi) and Hebbal (Bengaluru) show ambient peaks exceeding 35.5°C. Welfare check-in response rate stands at 88.2%, with 2 public water facilities currently queued for replenishment.',
  key_concerns: [
    'Urban heat island canyon effect driving Old Delhi railway precinct feels-like to 46.2°C.',
    'Peenya Industrial sector worker heat exposure index at high warning tier.',
    '2 verified water stations reported empty on Indiranagar and Shivaji Nagar corridors.'
  ],
  most_affected_localities: [
    { name: 'Chandni Chowk, Delhi', temperature: 41.5, risk_score: 88.5, pending_checkins: 4 },
    { name: 'Hebbal, Bengaluru', temperature: 35.8, risk_score: 72.4, pending_checkins: 2 },
    { name: 'Peenya Industrial, Bengaluru', temperature: 35.2, risk_score: 69.8, pending_checkins: 3 }
  ],
  resource_status: {
    cooling_centres_open: 14,
    water_stations_operational: 28,
    active_volunteers: 42,
    emergency_dispatches: 3
  },
  recommended_administrative_actions: [
    'Authorize BBMP secondary water tanker deployment to Shivaji Nagar platform.',
    'Broadcast automated SMS push to registered outdoor delivery partner fleet.',
    'Pre-alert Victoria Hospital Heatstroke Emergency triage team for evening inward admissions.'
  ],
  data_freshness_pct: 99
};

// ==============================================================================
// 9. HEAT AWARENESS ACADEMY (PART 15)
// ==============================================================================
export const INITIAL_ACADEMY_COURSES: AcademyCourse[] = [
  {
    id: 'course-residents',
    role_target: 'residents',
    badge_title: 'Certified Community Heat Guardian',
    title: 'Extreme Heat Protection for Families & Elders',
    description: 'Learn physiological thermal limits, high-risk symptom recognition, home cooling strategies without AC, and life-saving first aid.',
    icon_name: 'ShieldCheck',
    lessons: [
      {
        id: 'res-l1',
        title: 'Heat Exhaustion vs. Life-Threatening Heatstroke',
        reading_time_mins: 4,
        summary: 'How to distinguish between standard dehydration and a medical emergency where the body loses thermal regulation.',
        content: [
          'Heat exhaustion is characterized by heavy sweating, weakness, cold/pale/clammy skin, rapid weak pulse, and nausea.',
          'Heatstroke is a medical emergency: body temperature rises above 40°C, skin is hot and red (often dry), confusion occurs, and unconsciousness can follow rapidly.',
          'If someone stops sweating, exhibits slurred speech, or collapses, call 112 or 108 immediately and begin active ice/water cooling while waiting.'
        ],
        key_takeaways: [
          'Heat exhaustion: Move to shade, sip cool water, loosen clothes.',
          'Heatstroke: CALL 112/108 IMMEDIATELY. Pour water over chest, apply ice to armpits/neck.'
        ]
      },
      {
        id: 'res-l2',
        title: 'Hyperlocal Hydration & Electrolyte Science',
        reading_time_mins: 3,
        summary: 'Why drinking plain water is often insufficient during heavy perspiration.',
        content: [
          'Sweat depletes essential sodium and potassium. Drinking excessive plain water without salts can trigger dangerous hyponatremia.',
          'Use Oral Rehydration Salts (ORS), coconut water, buttermilk (chaas), or light lemon water with a pinch of salt and sugar.',
          'Target at least 500ml fluid every 2 hours when ambient temperature exceeds 33°C.'
        ],
        key_takeaways: [
          'Electrolytes matter: Pair water with ORS or light salt.',
          'Avoid sweet caffeinated sodas and alcohol, which exacerbate dehydration.'
        ]
      }
    ],
    quiz: [
      {
        id: 'q1',
        question: 'Which of the following symptoms strongly indicates heatstroke rather than mild exhaustion?',
        options: [
          'Slight thirst and mild perspiration',
          'Confusion, hot red dry skin, and body temperature above 40°C',
          'Mild sneezing and runny nose',
          'Normal appetite'
        ],
        correct_index: 1,
        explanation: 'Confusion, hot dry skin, and core temperature above 40°C are classic indicators of life-threatening heatstroke requiring immediate emergency triage.'
      },
      {
        id: 'q2',
        question: 'What is the recommended response if a person collapses from suspected severe heatstroke?',
        options: [
          'Give them hot tea and cover them with a blanket',
          'Call 112/108 immediately and actively douse their body with cool water while fanning',
          'Leave them in the sun to rest for an hour',
          'Wait 2 hours before contacting anyone'
        ],
        correct_index: 1,
        explanation: 'Heatstroke requires emergency medical dispatch (112/108) while immediately initiating rapid cooling with water and air circulation.'
      }
    ]
  },
  {
    id: 'course-workers',
    role_target: 'workers',
    badge_title: 'Workplace Heat Safety Champion',
    title: 'Occupational Heat Exposure & WBGT Protocols',
    description: 'Guidelines for site supervisors, contractors, and outdoor delivery partners to prevent work-related heat illness.',
    icon_name: 'HardHat',
    lessons: [
      {
        id: 'wrk-l1',
        title: 'Wet Bulb Globe Temperature (WBGT) vs Ambient Temp',
        reading_time_mins: 5,
        summary: 'Why ambient air temperature alone is misleading for workers under radiant sun and physical exertion.',
        content: [
          'WBGT accounts for four factors: air temperature, humidity, wind velocity, and radiant sun load.',
          'When WBGT exceeds 30.0°C, heavy manual labor must follow a 45 min work / 15 min rest cycle.',
          'When WBGT reaches 32.2°C, direct heavy physical labor should be shifted to cooler early morning hours.'
        ],
        key_takeaways: [
          'Humidity multiplies heat strain because sweat cannot evaporate.',
          'Rest breaks in shaded areas are a medical necessity, not lost productivity.'
        ]
      }
    ],
    quiz: [
      {
        id: 'qw1',
        question: 'Why is high relative humidity particularly dangerous during heavy outdoor labor?',
        options: [
          'It makes the sky cloudier',
          'It prevents sweat from evaporating, stopping the body from naturally shedding heat',
          'It decreases ambient air pressure',
          'It makes clothing heavier'
        ],
        correct_index: 1,
        explanation: 'Evaporative cooling is the primary mechanism humans use to dissipate metabolic heat. High humidity blocks evaporation, causing core body temperature to surge.'
      }
    ]
  },
  {
    id: 'course-schools',
    role_target: 'schools',
    badge_title: 'Certified School Heat Safety Officer',
    title: 'Campus Heat Safety & Physical Education Guidelines',
    description: 'Standard safety protocols for morning assemblies, sports periods, shaded playground management, and pediatric dehydration signs.',
    icon_name: 'School',
    lessons: [
      {
        id: 'sch-l1',
        title: 'Heat Thresholds for Outdoor Recess & Assemblies',
        reading_time_mins: 4,
        summary: 'When to suspend outdoor playground activities and transition assemblies indoors based on temperature thresholds.',
        content: [
          'Children absorb environmental heat faster than adults and produce more metabolic heat per kilogram of body weight during physical activity.',
          'When ambient temperature exceeds 36.0°C or WBGT reaches 30°C, outdoor physical sports and midday playground activities must be moved to indoor shaded zones.',
          'Schools should mandate shaded rest breaks every 20 minutes and establish chilled drinking water refill points across campus.'
        ],
        key_takeaways: [
          'Suspend unshaded sports when temperatures hit or exceed 36°C.',
          'Ensure water breaks every 20-30 minutes during warm school days.'
        ]
      },
      {
        id: 'sch-l2',
        title: 'Identifying Heat Distress in Young Students',
        reading_time_mins: 3,
        summary: 'Recognizing subtle behavioral and physiological signs of heat illness in children who may not voice thirst.',
        content: [
          'Young students often ignore early thirst while playing. Watch for flushed cheeks, sudden drowsiness, irritability, nausea, or headache.',
          'Immediate campus protocol: escort student to the infirmary or air-cooled sanctuary, apply cool damp washcloths to neck, and offer small sips of ORS or water.',
          'Never leave a child showing lethargy or dizziness unattended; notify parents and school medical staff promptly.'
        ],
        key_takeaways: [
          'Watch for flushed skin, lethargy, or headaches after outdoor play.',
          'Keep an air-cooled infirmary with ORS sachets and cold towels.'
        ]
      }
    ],
    quiz: [
      {
        id: 'q_sch1',
        question: 'What is the recommended maximum temperature threshold before outdoor physical sports must be suspended?',
        options: [
          '45.0°C',
          '36.0°C',
          '25.0°C',
          '50.0°C'
        ],
        correct_index: 1,
        explanation: 'Under NDMA and national school heat guidelines, outdoor physical exertion and sports should be suspended or moved indoors once temperatures exceed 36.0°C.'
      },
      {
        id: 'q_sch2',
        question: 'Which of the following is an early sign of heat exhaustion in school children?',
        options: [
          'Extreme shivering and cold skin',
          'Flushed cheeks, sudden lethargy, and complaints of headache or nausea',
          'High energy and excessive talking',
          'Immediate hunger for heavy snacks'
        ],
        correct_index: 1,
        explanation: 'Children often manifest heat strain through flushed skin, sudden fatigue or lethargy, and complaints of headaches or nausea after playing in the heat.'
      }
    ]
  },
  {
    id: 'course-volunteers',
    role_target: 'volunteers',
    badge_title: 'Certified Community Heat Relief Volunteer',
    title: 'Vulnerable Resident Welfare & Relief Triage',
    description: 'Door-to-door welfare check-in protocols, hydration booth operations, and identifying vulnerable elders or infants.',
    icon_name: 'HeartPulse',
    lessons: [
      {
        id: 'vol-l1',
        title: 'Door-to-Door High-Risk Welfare Visits',
        reading_time_mins: 4,
        summary: 'Essential checklist for visiting elderly neighbors and low-income households during orange and red heatwave alerts.',
        content: [
          'Seniors over 65 living alone face the highest mortality risk during prolonged heatwaves due to impaired thermoregulation and reduced thirst perception.',
          'When conducting a welfare visit, assess indoor temperature, cross-ventilation, fan availability, and current water intake.',
          'Verify that the resident has enough drinking water and essential medications stored away from direct sunlight.'
        ],
        key_takeaways: [
          'Check on isolated elderly neighbors at least twice daily during extreme alerts.',
          'Ensure indoor living areas have adequate airflow and shaded window curtains.'
        ]
      },
      {
        id: 'vol-l2',
        title: 'Field First Aid & Rapid Cooling Techniques',
        reading_time_mins: 4,
        summary: 'Practical steps for establishing makeshift hydration stations and assisting heat-stressed community members.',
        content: [
          'Set up shade canopies and hydration tables along busy pedestrian corridors and transit stops.',
          'Provide cool drinking water mixed with approved ORS packets for dehydrated walkers and manual laborers.',
          'In suspected heat exhaustion cases, loosen tight clothing, elevate feet slightly, and fan the person while misting them with water.'
        ],
        key_takeaways: [
          'Position hydration relief tables in shaded high-footfall spots.',
          'If a resident is disoriented or non-responsive, dial 108/112 immediately and begin rapid cold-water fanning.'
        ]
      }
    ],
    quiz: [
      {
        id: 'q_vol1',
        question: 'Why are isolated elderly residents at the highest risk during urban heatwaves?',
        options: [
          'They spend too much time outdoors running',
          'Their natural thirst perception and thermal regulation are diminished, and indoor homes can trap heat',
          'They consume too much cold water',
          'They have higher sweat production than young adults'
        ],
        correct_index: 1,
        explanation: 'Aging bodies have reduced sweating capacity and diminished thirst sensitivity. Heat trapped in uncooled homes poses severe risks to isolated seniors.'
      },
      {
        id: 'q_vol2',
        question: 'When administering first aid to someone with heat exhaustion at a community relief post, what is the best first step?',
        options: [
          'Give them a hot cup of coffee',
          'Move them to shade or air conditioning, loosen restrictive clothing, and offer cool sips of water with electrolytes',
          'Advise them to continue their walk quickly',
          'Cover them tightly with heavy blankets'
        ],
        correct_index: 1,
        explanation: 'Immediate removal from radiant heat into shade, loosening clothing, and offering electrolyte-rich cool water are critical first-response interventions.'
      }
    ]
  }
];

// ==============================================================================
// 10. HEAT-SAFE ROUTES (PART 8)
// ==============================================================================
export const INITIAL_SAFE_ROUTES: HeatSafeRoute[] = [
  {
    id: 'rte-1',
    route_type: 'shortest',
    label: 'Direct Highway Corridor (Bellary Rd)',
    distance_km: 3.2,
    duration_minutes: 42,
    heat_exposure_score: 84, // High heat exposure
    shade_coverage_pct: 12,
    water_points_count: 1,
    cooling_centres_count: 0,
    coordinates: [
      [13.0358, 77.5970],
      [13.0420, 77.5950],
      [13.0480, 77.5930],
      [13.0530, 77.5925]
    ],
    summary: 'Direct arterial route with unshaded asphalt. 84% direct solar radiation exposure during afternoon hours.',
    warnings: ['High asphalt radiant reflection (>46°C surface temp)', 'Zero tree canopy along flyover stretch']
  },
  {
    id: 'rte-2',
    route_type: 'low_heat_exposure',
    label: 'Canopy & Park Protected Route (Lake Greenway)',
    distance_km: 3.6,
    duration_minutes: 48,
    heat_exposure_score: 42, // Much safer
    shade_coverage_pct: 74,
    water_points_count: 2,
    cooling_centres_count: 1,
    coordinates: [
      [13.0358, 77.5970],
      [13.0375, 77.6010],
      [13.0440, 77.6025],
      [13.0495, 77.5980],
      [13.0530, 77.5925]
    ],
    summary: 'Follows Hebbal Lake walking tree corridor. 74% shaded canopy with 3.4°C lower apparent temperature.',
    warnings: ['Slightly longer distance (+400m), but avoids direct UV exposure']
  },
  {
    id: 'rte-3',
    route_type: 'respite_optimized',
    label: 'Hydration & Cooling Hub Route',
    distance_km: 3.8,
    duration_minutes: 52,
    heat_exposure_score: 38,
    shade_coverage_pct: 65,
    water_points_count: 3,
    cooling_centres_count: 2,
    coordinates: [
      [13.0358, 77.5970],
      [13.0365, 77.5975],
      [13.0410, 77.6040],
      [13.0480, 77.6010],
      [13.0530, 77.5925]
    ],
    summary: 'Intersects 3 operational water refill ATMs and the Hebbal Health Respite Center. Recommended for elderly walkers and delivery riders.',
    warnings: []
  }
];
