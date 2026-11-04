-- ==============================================================================
-- HEATSHIELD AI — RESIDENT-FIRST & NOTIFICATION SYSTEM MIGRATION
-- Migration Version: 20261104000000
-- Scope: Resident Verification, Compulsory Contact Info, Hourly Email/SMS
--        Notification Engine, Delivery Tracking, Idempotency, and Safety Checklists
-- ==============================================================================

-- 1. EXTEND PROFILES TABLE WITH RESIDENT VERIFICATION & CONTACT DATA
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT '+91',
    ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS hourly_notification_consent BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS notification_consent_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    ADD COLUMN IF NOT EXISTS primary_locality_name TEXT DEFAULT 'Bengaluru Urban',
    ADD COLUMN IF NOT EXISTS primary_latitude DOUBLE PRECISION DEFAULT 13.0854,
    ADD COLUMN IF NOT EXISTS primary_longitude DOUBLE PRECISION DEFAULT 77.6250;

-- 2. NOTIFICATION CONSENTS TABLE (Auditable explicit consent records)
CREATE TABLE IF NOT EXISTS public.notification_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('hourly_heat_updates', 'critical_emergency_alerts')),
    channels TEXT[] NOT NULL DEFAULT ARRAY['email', 'sms']::TEXT[],
    phone_number TEXT,
    email_address TEXT,
    ip_address TEXT,
    user_agent TEXT,
    consented_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. USER NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true NOT NULL,
    sms_enabled BOOLEAN DEFAULT true NOT NULL,
    in_app_enabled BOOLEAN DEFAULT true NOT NULL,
    hourly_updates_enabled BOOLEAN DEFAULT true NOT NULL,
    critical_alerts_enabled BOOLEAN DEFAULT true NOT NULL,
    quiet_hours_enabled BOOLEAN DEFAULT false NOT NULL,
    quiet_hours_start TEXT DEFAULT '22:00',
    quiet_hours_end TEXT DEFAULT '06:00',
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. USER FAVOURITE & MONITORED LOCATIONS
CREATE TABLE IF NOT EXISTS public.user_favourite_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    label TEXT NOT NULL CHECK (label IN ('Home', 'Workplace', 'School', 'Parents', 'Other')),
    name TEXT NOT NULL,
    locality TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. SCHEDULED NOTIFICATION JOBS TABLE
CREATE TABLE IF NOT EXISTS public.scheduled_notification_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_for TIMESTAMPTZ NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    duration_ms INT DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    total_eligible_residents INT DEFAULT 0,
    emails_dispatched INT DEFAULT 0,
    sms_dispatched INT DEFAULT 0,
    failures INT DEFAULT 0,
    error_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. NOTIFICATION DELIVERY LOGS TABLE (Delivery receipts & idempotency)
CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.scheduled_notification_jobs(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    resident_name TEXT NOT NULL,
    recipient_masked TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
    locality_name TEXT NOT NULL,
    temperature_c NUMERIC(4,1) NOT NULL,
    feels_like_c NUMERIC(4,1) NOT NULL,
    heat_risk_category TEXT NOT NULL CHECK (heat_risk_category IN ('low', 'moderate', 'high', 'critical')),
    heat_risk_score NUMERIC(5,2) NOT NULL,
    idempotency_key TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'skipped')),
    provider TEXT NOT NULL CHECK (provider IN ('resend_email', 'transactional_sms', 'supabase_edge')),
    provider_message_id TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 7. COMMUNITY ISSUE REPORTS TABLE (Reporting broken water ATMs, closed centres)
CREATE TABLE IF NOT EXISTS public.community_issue_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reporter_name TEXT,
    facility_type TEXT NOT NULL CHECK (facility_type IN ('water_station', 'cooling_centre', 'hospital', 'general_hazard')),
    facility_id TEXT,
    facility_name TEXT NOT NULL,
    locality_name TEXT NOT NULL,
    issue_type TEXT NOT NULL CHECK (issue_type IN ('empty_water', 'broken_dispenser', 'closed_unexpectedly', 'unhygienic', 'overcrowded', 'other')),
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending_review', 'investigating', 'resolved', 'dismissed')) DEFAULT 'pending_review',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

-- 8. SAFETY CHECKLISTS TABLE (Resident daily hydration & heat safety habit tracker)
CREATE TABLE IF NOT EXISTS public.safety_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    checklist_date DATE NOT NULL DEFAULT CURRENT_DATE,
    drank_recommended_water BOOLEAN DEFAULT false,
    took_electrolytes BOOLEAN DEFAULT false,
    avoided_midday_sun BOOLEAN DEFAULT false,
    checked_elderly_family BOOLEAN DEFAULT false,
    curtains_closed_ventilated BOOLEAN DEFAULT false,
    wore_protective_clothing BOOLEAN DEFAULT false,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(user_id, checklist_date)
);

-- ------------------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE & IDEMPOTENCY
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_delivery_logs_user ON public.notification_delivery_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_idempotency ON public.notification_delivery_logs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_created ON public.notification_delivery_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favourite_locations_user ON public.user_favourite_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON public.community_issue_reports(status);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.notification_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favourite_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_checklists ENABLE ROW LEVEL SECURITY;

-- Consents & Preferences: Users manage own, Admins view
CREATE POLICY "Users manage own notification consent"
    ON public.notification_consents FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all notification consents"
    ON public.notification_consents FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Users manage own preferences"
    ON public.user_notification_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own favourite locations"
    ON public.user_favourite_locations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own delivery logs"
    ON public.notification_delivery_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins view all delivery logs and jobs"
    ON public.notification_delivery_logs FOR ALL
    USING (public.is_admin());

CREATE POLICY "Admins view all scheduled jobs"
    ON public.scheduled_notification_jobs FOR ALL
    USING (public.is_admin());

CREATE POLICY "Users manage own checklists"
    ON public.safety_checklists FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone authenticated can submit community issue reports"
    ON public.community_issue_reports FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view community reports they submitted"
    ON public.community_issue_reports FOR SELECT
    USING (auth.uid() = reporter_id OR public.is_admin() OR public.is_volunteer());

CREATE POLICY "Admins and volunteers can update community reports"
    ON public.community_issue_reports FOR UPDATE
    USING (public.is_admin() OR public.is_volunteer());
