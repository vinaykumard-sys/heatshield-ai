-- ==============================================================================
-- HEATSHIELD AI — PLATFORM EXPANSION ADDITIVE MIGRATION
-- Version: 2.0.0
-- Modules: Smart Alerts, Water Tracker, Worker Safety, Family Groups,
--          School Safety, Hospital Directory, Developer API, Situation Reports
-- ==============================================================================

-- 1. SMART HEAT ALERTS & SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.heat_alert_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    location_name TEXT NOT NULL,
    high_threshold NUMERIC(5,2) DEFAULT 50.00,
    critical_threshold NUMERIC(5,2) DEFAULT 75.00,
    channels TEXT[] DEFAULT ARRAY['in_app', 'push']::TEXT[],
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TEXT DEFAULT '22:00',
    quiet_hours_end TEXT DEFAULT '06:00',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.smart_heat_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    location_name TEXT NOT NULL,
    city TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('advisory', 'high', 'critical')),
    headline TEXT NOT NULL,
    description TEXT NOT NULL,
    risk_score NUMERIC(5,2) NOT NULL,
    trigger_reason TEXT NOT NULL,
    expected_duration_hours INT DEFAULT 6,
    recommended_actions TEXT[] DEFAULT ARRAY[]::TEXT[],
    issued_by TEXT DEFAULT 'HeatShield Autonomous Engine',
    is_active BOOLEAN DEFAULT true,
    delivery_stats JSONB DEFAULT '{"in_app_count": 0, "push_count": 0, "email_count": 0, "delivered_count": 0}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. WATER AVAILABILITY TRACKER
CREATE TABLE IF NOT EXISTS public.water_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    locality_name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('available', 'limited', 'unavailable', 'maintenance', 'unverified')) DEFAULT 'available',
    water_type TEXT NOT NULL CHECK (water_type IN ('purified_chilled', 'mineral_water_atm', 'filtered_tap', 'tanker_point')) DEFAULT 'mineral_water_atm',
    operating_hours TEXT DEFAULT '06:00 AM - 10:00 PM',
    free_access BOOLEAN DEFAULT true,
    price_per_litre NUMERIC(4,2) DEFAULT 0.00,
    wheelchair_accessible BOOLEAN DEFAULT true,
    reported_empty_count INT DEFAULT 0,
    verified_by TEXT,
    last_verified_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.water_station_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID REFERENCES public.water_stations(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    issue_type TEXT NOT NULL CHECK (issue_type IN ('empty', 'broken', 'unhygienic', 'working_properly')),
    comments TEXT,
    photo_url TEXT,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. OUTDOOR WORKER SAFETY MANAGER
CREATE TABLE IF NOT EXISTS public.worker_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    industry TEXT NOT NULL CHECK (industry IN ('construction', 'delivery_logistics', 'street_vending', 'agriculture', 'municipal')),
    contact_person TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.worker_workplaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.worker_organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    locality_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    shift_start TEXT DEFAULT '07:00',
    shift_end TEXT DEFAULT '16:00',
    wbgt_threshold NUMERIC(4,1) DEFAULT 30.0,
    rest_interval_minutes INT DEFAULT 15,
    drinking_water_nearby BOOLEAN DEFAULT true,
    shaded_shelter_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.outdoor_workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.worker_organizations(id) ON DELETE CASCADE,
    workplace_id UUID REFERENCES public.worker_workplaces(id) ON DELETE CASCADE,
    worker_id_code TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    shift_name TEXT DEFAULT 'full_day',
    preferred_language TEXT DEFAULT 'en',
    emergency_contact TEXT,
    consent_agreed BOOLEAN DEFAULT true,
    is_on_duty BOOLEAN DEFAULT true,
    last_checkin_status TEXT,
    last_checkin_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. FAMILY SAFETY GROUPS
CREATE TABLE IF NOT EXISTS public.family_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone TEXT,
    locality_name TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    consent_given BOOLEAN DEFAULT true,
    location_sharing_active BOOLEAN DEFAULT false,
    last_status TEXT DEFAULT 'safe',
    last_checkin_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. SCHOOL SAFETY MODE
CREATE TABLE IF NOT EXISTS public.school_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    principal_name TEXT NOT NULL,
    student_count INT DEFAULT 450,
    operating_hours TEXT DEFAULT '08:00 AM - 03:00 PM',
    outdoor_activity_curfew_temp NUMERIC(4,1) DEFAULT 36.0,
    has_shaded_playgrounds BOOLEAN DEFAULT true,
    water_fountains_count INT DEFAULT 8,
    ac_halls_count INT DEFAULT 2,
    verification_status TEXT DEFAULT 'verified',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. HOSPITAL RESOURCE DIRECTORY
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    emergency_phone TEXT NOT NULL,
    general_phone TEXT NOT NULL,
    operating_hours TEXT DEFAULT '24/7 Emergency',
    emergency_department_open BOOLEAN DEFAULT true,
    has_heatstroke_ward BOOLEAN DEFAULT true,
    has_burn_icu BOOLEAN DEFAULT true,
    has_pediatric_emergency BOOLEAN DEFAULT true,
    ambulance_available BOOLEAN DEFAULT true,
    verification_status TEXT DEFAULT 'verified',
    last_verified_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 7. DEVELOPER API KEYS
CREATE TABLE IF NOT EXISTS public.developer_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_name TEXT NOT NULL,
    key_name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    rate_limit_per_minute INT DEFAULT 60,
    daily_quota INT DEFAULT 5000,
    used_today INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    scopes TEXT[] DEFAULT ARRAY['read:heat_risk', 'read:forecasts', 'read:cooling_centres', 'read:water_points', 'read:alerts']::TEXT[],
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    last_used_at TIMESTAMPTZ
);

-- 8. COMMAND CENTRE SITUATION REPORTS
CREATE TABLE IF NOT EXISTS public.situation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    overall_status TEXT NOT NULL CHECK (overall_status IN ('normal', 'heightened_vigilance', 'severe_heat_emergency')),
    summary_text TEXT NOT NULL,
    key_concerns TEXT[] DEFAULT ARRAY[]::TEXT[],
    most_affected_localities JSONB DEFAULT '[]'::JSONB,
    resource_status JSONB DEFAULT '{}'::JSONB,
    recommended_administrative_actions TEXT[] DEFAULT ARRAY[]::TEXT[],
    data_freshness_pct INT DEFAULT 98,
    generated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS for all new tables
ALTER TABLE public.heat_alert_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_heat_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_station_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_workplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outdoor_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.situation_reports ENABLE ROW LEVEL SECURITY;

-- Public read policies for verified public infrastructure
CREATE POLICY "Public read water stations" ON public.water_stations FOR SELECT USING (true);
CREATE POLICY "Public read hospitals" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "Public read schools" ON public.school_registrations FOR SELECT USING (true);
CREATE POLICY "Public read active smart alerts" ON public.smart_heat_alerts FOR SELECT USING (is_active = true);
CREATE POLICY "Public read situation reports" ON public.situation_reports FOR SELECT USING (true);
