-- ==============================================================================
-- HEATSHIELD AI — SUPABASE DATABASE MIGRATION
-- AI-Powered Hyperlocal Heat Risk Prediction & Community Protection Platform
-- Version: 1.0.0
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Extends auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'volunteer', 'resident')) DEFAULT 'resident',
    phone TEXT,
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'kn')),
    locality_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. LOCATIONS TABLE (Localities, wards, neighborhoods across Indian urban centers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    baseline_vulnerability_score NUMERIC(5,2) DEFAULT 30.00 CHECK (baseline_vulnerability_score BETWEEN 0 AND 100),
    urban_heat_island_factor NUMERIC(3,2) DEFAULT 1.15 CHECK (urban_heat_island_factor >= 1.0),
    cooling_centers_count INT DEFAULT 1,
    estimated_population INT DEFAULT 25000,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Add foreign key back to profiles
ALTER TABLE public.profiles 
    ADD CONSTRAINT fk_profiles_locality 
    FOREIGN KEY (locality_id) REFERENCES public.locations(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 3. ENVIRONMENTAL READINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.environmental_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    temperature_c NUMERIC(4,1) NOT NULL,
    relative_humidity_pct NUMERIC(4,1) NOT NULL,
    feels_like_c NUMERIC(4,1) NOT NULL,
    heat_index_c NUMERIC(4,1) NOT NULL,
    wet_bulb_c NUMERIC(4,1),
    uv_index NUMERIC(3,1) DEFAULT 8.0,
    wind_speed_kmh NUMERIC(4,1) DEFAULT 12.0,
    weather_condition TEXT DEFAULT 'Clear / Extreme Sun',
    data_source TEXT NOT NULL CHECK (data_source IN ('open_meteo', 'imd_station', 'community_sensor', 'simulated')),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. HEAT RISK ASSESSMENTS TABLE (AI Explainable Engine Output)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.heat_risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    risk_score NUMERIC(5,2) NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    risk_category TEXT NOT NULL CHECK (risk_category IN ('low', 'moderate', 'high', 'critical')),
    contributing_factors JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_explanation TEXT NOT NULL,
    preventive_actions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    checkin_priority TEXT NOT NULL CHECK (checkin_priority IN ('routine', 'elevated', 'urgent', 'immediate')),
    confidence_score NUMERIC(3,2) DEFAULT 0.94,
    calculated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. RESIDENTS TABLE (Vulnerable community members registered for welfare)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    age_range TEXT NOT NULL CHECK (age_range IN ('under_5', '5_to_17', '18_to_59', '60_to_74', '75_plus')),
    locality_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
    contact_phone TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    address_notes TEXT,
    vulnerability_indicators TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'kn')),
    consent_status BOOLEAN NOT NULL DEFAULT true,
    consent_date TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    last_welfare_checkin TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. VOLUNTEER ASSIGNMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.volunteer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'reassigned')) DEFAULT 'active',
    assigned_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 7. WELFARE CHECKINS TABLE (Auditable check-in logs and vital checks)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.welfare_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    volunteer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    scheduled_for DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'unable_to_contact', 'escalated')) DEFAULT 'pending',
    safety_confirmed BOOLEAN DEFAULT false,
    hydration_adequate BOOLEAN DEFAULT true,
    cooling_accessible BOOLEAN DEFAULT true,
    checkin_notes TEXT,
    escalation_reason TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 8. ASSISTANCE REQUESTS TABLE (Water, cooling, shelter aid)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assistance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
    requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    locality_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
    category TEXT NOT NULL CHECK (category IN ('water', 'cooling', 'general_welfare', 'cooling_centre_transport', 'other')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'cancelled')) DEFAULT 'open',
    assigned_volunteer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 9. NOTIFICATIONS TABLE (In-app notifications and alerts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('environmental_alert', 'critical_risk', 'missed_checkin', 'request_update', 'volunteer_assignment', 'system')),
    priority TEXT NOT NULL CHECK (priority IN ('info', 'warning', 'critical')) DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 10. ACTIVITY LOGS TABLE (Comprehensive security audit trail)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 11. RISK THRESHOLDS TABLE (Admin-configurable model weights & limits)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.risk_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'India Urban Heat Baseline (NDMA Guidelines)',
    low_max NUMERIC(5,2) NOT NULL DEFAULT 35.00,
    moderate_max NUMERIC(5,2) NOT NULL DEFAULT 60.00,
    high_max NUMERIC(5,2) NOT NULL DEFAULT 80.00,
    critical_min NUMERIC(5,2) NOT NULL DEFAULT 80.01,
    temp_weight NUMERIC(3,2) NOT NULL DEFAULT 0.35,
    humidity_weight NUMERIC(3,2) NOT NULL DEFAULT 0.25,
    vulnerability_weight NUMERIC(3,2) NOT NULL DEFAULT 0.20,
    diurnal_weight NUMERIC(3,2) NOT NULL DEFAULT 0.20,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 12. CONSENT RECORDS TABLE (Data protection and voluntary participation)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL DEFAULT 'welfare_monitoring_and_assistance',
    granted BOOLEAN NOT NULL DEFAULT true,
    consent_version TEXT NOT NULL DEFAULT 'v1.0-heatshield-2026',
    ip_hash TEXT,
    user_agent TEXT,
    recorded_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_locations_city ON public.locations(city);
CREATE INDEX IF NOT EXISTS idx_env_readings_loc_time ON public.environmental_readings(location_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_heat_risk_loc_time ON public.heat_risk_assessments(location_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_residents_locality ON public.residents(locality_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_vol ON public.volunteer_assignments(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_welfare_checkins_status ON public.welfare_checkins(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_status ON public.assistance_requests(status, priority);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Helper function to fetch current authenticated user's role securely
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper to check if current user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper to check if current user is a volunteer
CREATE OR REPLACE FUNCTION public.is_volunteer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'volunteer' OR role = 'admin')
  );
$$;

-- Enable RLS on all 12 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heat_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welfare_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Admins have full access to profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Volunteers can view other volunteers and admins for coordination"
    ON public.profiles FOR SELECT
    USING (public.is_volunteer() AND role IN ('volunteer', 'admin'));

-- 2. LOCATIONS (Publicly viewable by all authenticated users, editable only by admins)
CREATE POLICY "Anyone authenticated can view locations"
    ON public.locations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can insert or update locations"
    ON public.locations FOR ALL
    USING (public.is_admin());

-- 3. ENVIRONMENTAL READINGS (Viewable by authenticated users)
CREATE POLICY "Anyone authenticated can view readings"
    ON public.environmental_readings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins and service roles can insert readings"
    ON public.environmental_readings FOR INSERT
    WITH CHECK (public.is_admin());

-- 4. HEAT RISK ASSESSMENTS (Viewable by authenticated users)
CREATE POLICY "Anyone authenticated can view risk assessments"
    ON public.heat_risk_assessments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can insert risk assessments"
    ON public.heat_risk_assessments FOR INSERT
    WITH CHECK (public.is_admin());

-- 5. RESIDENTS POLICIES (Sensitive data protection)
CREATE POLICY "Admins have full access to residents"
    ON public.residents FOR ALL
    USING (public.is_admin());

CREATE POLICY "Residents can view and update their own record"
    ON public.residents FOR SELECT
    USING (profile_id = auth.uid());

CREATE POLICY "Residents can update their own record"
    ON public.residents FOR UPDATE
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Volunteers can view residents assigned to them"
    ON public.residents FOR SELECT
    USING (
        public.is_volunteer() AND (
            EXISTS (
                SELECT 1 FROM public.volunteer_assignments va 
                WHERE va.resident_id = residents.id 
                AND va.volunteer_id = auth.uid() 
                AND va.status = 'active'
            )
            OR
            EXISTS (
                SELECT 1 FROM public.assistance_requests ar 
                WHERE ar.resident_id = residents.id 
                AND ar.assigned_volunteer_id = auth.uid()
            )
        )
    );

-- 6. VOLUNTEER ASSIGNMENTS POLICIES
CREATE POLICY "Admins have full access to assignments"
    ON public.volunteer_assignments FOR ALL
    USING (public.is_admin());

CREATE POLICY "Volunteers can view their own assignments"
    ON public.volunteer_assignments FOR SELECT
    USING (volunteer_id = auth.uid());

-- 7. WELFARE CHECKINS POLICIES
CREATE POLICY "Admins have full access to checkins"
    ON public.welfare_checkins FOR ALL
    USING (public.is_admin());

CREATE POLICY "Volunteers can view and update assigned checkins"
    ON public.welfare_checkins FOR SELECT
    USING (
        volunteer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.volunteer_assignments va 
            WHERE va.resident_id = welfare_checkins.resident_id 
            AND va.volunteer_id = auth.uid()
        )
    );

CREATE POLICY "Volunteers can update their assigned checkins"
    ON public.welfare_checkins FOR UPDATE
    USING (volunteer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Residents can view their own checkins"
    ON public.welfare_checkins FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.residents r 
            WHERE r.id = welfare_checkins.resident_id 
            AND r.profile_id = auth.uid()
        )
    );

-- 8. ASSISTANCE REQUESTS POLICIES
CREATE POLICY "Admins have full access to assistance requests"
    ON public.assistance_requests FOR ALL
    USING (public.is_admin());

CREATE POLICY "Residents can view and create their own requests"
    ON public.assistance_requests FOR SELECT
    USING (requested_by = auth.uid());

CREATE POLICY "Residents can insert assistance requests"
    ON public.assistance_requests FOR INSERT
    WITH CHECK (requested_by = auth.uid() OR requested_by IS NULL);

CREATE POLICY "Volunteers can view all open requests in community and update assigned ones"
    ON public.assistance_requests FOR SELECT
    USING (public.is_volunteer());

CREATE POLICY "Volunteers can update assigned requests"
    ON public.assistance_requests FOR UPDATE
    USING (assigned_volunteer_id = auth.uid() OR public.is_admin());

-- 9. NOTIFICATIONS POLICIES
CREATE POLICY "Users can view and update their own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can mark own notifications as read"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 10. ACTIVITY LOGS POLICIES
CREATE POLICY "Only admins can view activity logs"
    ON public.activity_logs FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Authenticated users can append activity logs"
    ON public.activity_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- 11. RISK THRESHOLDS POLICIES
CREATE POLICY "All authenticated users can view risk thresholds"
    ON public.risk_thresholds FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can update risk thresholds"
    ON public.risk_thresholds FOR ALL
    USING (public.is_admin());

-- 12. CONSENT RECORDS POLICIES
CREATE POLICY "Admins can view consent records"
    ON public.consent_records FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Residents can view their own consent records"
    ON public.consent_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.residents r 
            WHERE r.id = consent_records.resident_id 
            AND r.profile_id = auth.uid()
        )
    );

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, preferred_language)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'resident'),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- SEED DATA (Indian Urban & Semi-Urban Localities)
-- ==============================================================================
INSERT INTO public.locations (name, city, state, pincode, latitude, longitude, baseline_vulnerability_score, urban_heat_island_factor, cooling_centers_count, estimated_population)
VALUES
    ('Chandni Chowk Old Ward', 'Delhi', 'Delhi', '110006', 28.6506, 77.2304, 82.5, 1.45, 2, 45000),
    ('Rohini Sector 16 Slum Cluster', 'Delhi', 'Delhi', '110089', 28.7350, 77.1120, 78.0, 1.30, 1, 32000),
    ('Peenya Industrial Area & Labour Colony', 'Bengaluru', 'Karnataka', '560058', 13.0285, 77.5186, 72.0, 1.35, 1, 55000),
    ('Shivajinagar Slum Settlement', 'Bengaluru', 'Karnataka', '560051', 12.9856, 77.6057, 68.5, 1.25, 3, 38000),
    ('Vyasarpadi North Industrial Zone', 'Chennai', 'Tamil Nadu', '600039', 13.1118, 80.2520, 84.0, 1.40, 2, 49000),
    ('Ahmedabad Old City & Dariapur', 'Ahmedabad', 'Gujarat', '380001', 23.0338, 72.5850, 88.0, 1.50, 4, 60000),
    ('Sitabuldi & Cotton Market Colony', 'Nagpur', 'Maharashtra', '440012', 21.1458, 79.0882, 85.0, 1.42, 2, 42000),
    ('Charminar Old Quarter & Yakutpura', 'Hyderabad', 'Telangana', '500002', 17.3616, 78.4747, 76.0, 1.30, 2, 51000),
    ('Sanganer Artisan Settlement', 'Jaipur', 'Rajasthan', '302029', 26.8188, 75.7899, 79.0, 1.35, 1, 36000),
    ('Dharavi Transition Sector 5', 'Mumbai', 'Maharashtra', '400017', 19.0402, 72.8530, 91.0, 1.55, 3, 75000)
ON CONFLICT DO NOTHING;

-- Seed default risk threshold configuration
INSERT INTO public.risk_thresholds (name, low_max, moderate_max, high_max, critical_min, temp_weight, humidity_weight, vulnerability_weight, diurnal_weight, is_active)
VALUES ('NDMA & IMD Indian Heatwave Risk Protocol v2', 35.00, 60.00, 80.00, 80.01, 0.35, 0.25, 0.20, 0.20, true)
ON CONFLICT DO NOTHING;
-- ==============================================================================
-- HEATSHIELD AI — ADVANCED FEATURES DATABASE MIGRATION
-- Additive Schema Extensions for AI Forecasting, Cooling Centres, Welfare Engine,
-- Voice Assistant, and Heat Simulations
-- Migration Version: 20261101000000
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HEAT FORECASTS TABLE (24h, 48h, 72h Neighbourhood Predictions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.heat_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    forecast_horizon_hours INT NOT NULL CHECK (forecast_horizon_hours IN (24, 48, 72)),
    forecast_timestamp TIMESTAMPTZ NOT NULL,
    predicted_temperature_c NUMERIC(4,1) NOT NULL,
    predicted_humidity_pct NUMERIC(4,1) NOT NULL,
    predicted_feels_like_c NUMERIC(4,1) NOT NULL,
    predicted_heat_index_c NUMERIC(4,1) NOT NULL,
    predicted_risk_score NUMERIC(5,2) NOT NULL CHECK (predicted_risk_score BETWEEN 0 AND 100),
    risk_category TEXT NOT NULL CHECK (risk_category IN ('low', 'moderate', 'high', 'critical')),
    risk_trend TEXT NOT NULL CHECK (risk_trend IN ('rising', 'steady', 'declining')),
    confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.92,
    contributing_factors JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_explanation TEXT NOT NULL,
    preventive_actions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_live_telemetry BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. COOLING CENTRES TABLE (Verified Heat Respite Locations)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cooling_centres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    locality_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    locality_name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    contact_phone TEXT,
    operating_hours TEXT NOT NULL DEFAULT '09:00 AM - 07:00 PM',
    operating_status TEXT NOT NULL CHECK (operating_status IN ('open', 'closed', 'overcapacity')) DEFAULT 'open',
    capacity_estimate INT NOT NULL DEFAULT 60,
    wheelchair_accessible BOOLEAN NOT NULL DEFAULT true,
    drinking_water_available BOOLEAN NOT NULL DEFAULT true,
    air_conditioned BOOLEAN NOT NULL DEFAULT true,
    indoor_seating BOOLEAN NOT NULL DEFAULT true,
    medical_kit_available BOOLEAN NOT NULL DEFAULT true,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('verified', 'pending_verification', 'temporarily_unavailable', 'rejected', 'needs_reverification')) DEFAULT 'verified',
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    last_verified_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. COOLING CENTRE REPORTS TABLE (Citizen & Volunteer Discrepancy Reports)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cooling_centre_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES public.cooling_centres(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reporter_name TEXT,
    issue_type TEXT NOT NULL CHECK (issue_type IN ('closed_unexpectedly', 'no_water', 'overcrowded', 'incorrect_location', 'other')),
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending_review', 'resolved', 'dismissed')) DEFAULT 'pending_review',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. WELFARE CHECKIN PRIORITY LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.welfare_checkin_priorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    priority_score NUMERIC(5,2) NOT NULL CHECK (priority_score BETWEEN 0 AND 100),
    priority_tier TEXT NOT NULL CHECK (priority_tier IN ('routine', 'elevated', 'urgent', 'immediate')),
    factors JSONB NOT NULL DEFAULT '{}'::jsonb,
    calculated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. ASSISTANT CONVERSATIONS & MESSAGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assistant_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('en', 'hi', 'kn')) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.assistant_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.assistant_conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
    text TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('en', 'hi', 'kn')),
    intent TEXT,
    data_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. HEAT SIMULATIONS TABLE (What-If Simulation Scenarios - Strictly Isolated)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.heat_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    parameters JSONB NOT NULL,
    summary JSONB NOT NULL,
    locality_results JSONB NOT NULL,
    ai_impact_analysis TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_heat_forecasts_loc ON public.heat_forecasts(location_id, forecast_horizon_hours);
CREATE INDEX IF NOT EXISTS idx_cooling_centres_status ON public.cooling_centres(verification_status, operating_status);
CREATE INDEX IF NOT EXISTS idx_cooling_centres_loc ON public.cooling_centres(city, locality_id);
CREATE INDEX IF NOT EXISTS idx_welfare_priorities_score ON public.welfare_checkin_priorities(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_conv ON public.assistant_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_heat_simulations_created ON public.heat_simulations(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================================================
ALTER TABLE public.heat_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooling_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooling_centre_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welfare_checkin_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heat_simulations ENABLE ROW LEVEL SECURITY;

-- Public can view verified cooling centres & forecasts
CREATE POLICY "Public can view verified cooling centres"
    ON public.cooling_centres FOR SELECT
    USING (verification_status = 'verified');

CREATE POLICY "Public can view heat forecasts"
    ON public.heat_forecasts FOR SELECT
    USING (true);

-- Authenticated users can manage assistant conversations
CREATE POLICY "Users can manage own assistant conversations"
    ON public.assistant_conversations FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own assistant messages"
    ON public.assistant_messages FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.assistant_conversations c 
        WHERE c.id = assistant_messages.conversation_id AND c.user_id = auth.uid()
    ));

-- Admins and volunteers can verify cooling centres
CREATE POLICY "Staff can manage cooling centres"
    ON public.cooling_centres FOR ALL
    USING (public.current_user_role() IN ('admin', 'volunteer'));

-- Admins can run and save simulations
CREATE POLICY "Admins can manage heat simulations"
    ON public.heat_simulations FOR ALL
    USING (public.current_user_role() = 'admin');


-- ------------------------------------------------------------------------------
-- 7. LOCATION HEAT REPORTS TABLE (Geospatial Intelligence & Location Search)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.location_heat_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    location_name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    pincode TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    temperature NUMERIC(4,1) NOT NULL,
    humidity NUMERIC(4,1) NOT NULL,
    feels_like NUMERIC(4,1) NOT NULL,
    risk_score NUMERIC(5,2) NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    risk_category TEXT NOT NULL CHECK (risk_category IN ('low', 'moderate', 'high', 'critical')),
    forecast_data JSONB DEFAULT '{}'::jsonb,
    ai_explanation TEXT NOT NULL,
    data_source TEXT DEFAULT 'open_meteo',
    data_timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.location_heat_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view location heat reports"
    ON public.location_heat_reports FOR SELECT
    USING (true);

CREATE POLICY "Users can insert location heat reports"
    ON public.location_heat_reports FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
