/**
 * RECOVERABLE BACKUP OF PRE-SEED DEMO FIXTURES
 * Preserved for offline development and historical record.
 * These records are strictly isolated from production environments.
 * Backup Date: 2026-11-04
 */

export const BACKUP_DEMO_USERS = [
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

export const BACKUP_DEMO_RESIDENTS = [
  {
    id: 'res-blr-1',
    full_name: 'Anjinappa N.',
    age_range: '75_plus',
    locality_id: 'blr-chokkanahalli',
    locality_name: 'Chokkanahalli Road & Thanisandra Hub, Bengaluru',
    contact_phone: '+91 98450 77123',
    emergency_contact_name: 'Gowramma (Daughter)',
    emergency_contact_phone: '+91 98450 77124',
    address_notes: 'House near Chokkanahalli Main Gate, ground floor',
    vulnerability_indicators: ['advanced_age', 'hypertension', 'limited_mobility'],
    preferred_language: 'kn',
    consent_status: true,
    consent_date: '2026-04-15T10:00:00Z',
    last_welfare_checkin: '2026-04-20T11:30:00Z'
  },
  {
    id: 'res-blr-2',
    full_name: 'Sunita Bai',
    age_range: '60_to_74',
    locality_id: 'blr-jakkur',
    locality_name: 'Jakkur Aerodrome & Nehru Nagar, Bengaluru',
    contact_phone: '+91 99001 22334',
    emergency_contact_name: 'Raju (Son)',
    emergency_contact_phone: '+91 99001 22335',
    address_notes: 'Nehru Nagar, 2nd Cross, tin-roof dwelling',
    vulnerability_indicators: ['asbestos_tin_roof', 'cardiovascular_condition', 'outdoor_worker_household'],
    preferred_language: 'kn',
    consent_status: true,
    consent_date: '2026-04-16T14:00:00Z',
    last_welfare_checkin: '2026-04-20T09:15:00Z'
  }
];
