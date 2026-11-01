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
