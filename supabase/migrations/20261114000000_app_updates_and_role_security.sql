-- ============================================================================
-- HeatShield AI — Mobile App Updates & Strict Role-Based Security Migration
-- Migration Version: 20261114000000
-- Scope: App updates management, Role integrity, Admin RLS isolation
-- ============================================================================

-- 1. APP UPDATES TABLE
-- Supports multi-platform version control (Android, iOS, Web) and mandatory update gates
CREATE TABLE IF NOT EXISTS public.app_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
    minimum_version TEXT NOT NULL,
    latest_version TEXT NOT NULL,
    android_version_code INTEGER DEFAULT 1,
    update_type TEXT NOT NULL DEFAULT 'binary' CHECK (update_type IN ('binary', 'ota')),
    update_url TEXT NOT NULL,
    release_notes TEXT,
    is_required BOOLEAN NOT NULL DEFAULT true,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for version lookup
CREATE INDEX IF NOT EXISTS idx_app_updates_platform_published ON public.app_updates(platform, published_at DESC);

-- Enable RLS on app_updates
ALTER TABLE public.app_updates ENABLE ROW LEVEL SECURITY;

-- Helper function to securely check if current authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- Allow public read access to app_updates so native mobile app and web clients can check update status
DROP POLICY IF EXISTS "Public can view app updates" ON public.app_updates;
CREATE POLICY "Public can view app updates"
    ON public.app_updates
    FOR SELECT
    TO public
    USING (true);

-- Restrict mutations (insert, update, delete) on app_updates exclusively to admins
DROP POLICY IF EXISTS "Admins can manage app updates" ON public.app_updates;
CREATE POLICY "Admins can manage app updates"
    ON public.app_updates
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Seed initial valid Android releases (v1.1.0 code 4, and v1.2.0 code 5)
INSERT INTO public.app_updates (
    platform,
    minimum_version,
    latest_version,
    android_version_code,
    update_type,
    update_url,
    release_notes,
    is_required,
    published_at
) VALUES 
(
    'android',
    '1.1.0',
    '1.1.0',
    4,
    'binary',
    'https://heatshield-ai-eight.vercel.app/downloads/HeatShield-AI.apk',
    'Initial Android release with real-time heat index monitoring, early heatwave warnings, and SOS emergency beacon.',
    true,
    NOW() - INTERVAL '2 days'
),
(
    'android',
    '1.3.0',
    '1.4.0',
    7,
    'binary',
    'https://heatshield-ai-eight.vercel.app/downloads/HeatShield-AI.apk',
    'Version 1.4.0: Native system browser OAuth flow, Android deep linking, responsive Profile bottom sheet, and touch interaction fixes.',
    true,
    NOW()
)
ON CONFLICT DO NOTHING;

-- 2. ENSURE PROFILES TABLE HAS ROLE COLUMN WITH 'resident' DEFAULT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'admin', 'volunteer'));
    ELSE
        ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'resident';
    END IF;
END $$;

-- Enforce Role Tampering Protection on Profiles
-- Prevents non-admins from self-promoting or altering roles
CREATE OR REPLACE FUNCTION public.prevent_role_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT public.is_admin() THEN
            NEW.role := OLD.role; -- Revert unauthorized role change
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_tampering ON public.profiles;
CREATE TRIGGER trg_prevent_role_tampering
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_tampering();

-- 3. ADMIN-ONLY TABLES & STRICT RLS ISOLATION

-- Table: admin_audit_logs (Strictly Admin-Only)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_name TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can access audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Non-admins denied access to audit logs" ON public.admin_audit_logs;

CREATE POLICY "Admins can access audit logs"
    ON public.admin_audit_logs
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Table: broadcast_alerts (Admin managed, residents can only view active broadcasts)
CREATE TABLE IF NOT EXISTS public.broadcast_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('advisory', 'warning', 'critical', 'emergency')),
    target_wards TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.broadcast_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to broadcast_alerts" ON public.broadcast_alerts;
DROP POLICY IF EXISTS "Residents can view active broadcast alerts" ON public.broadcast_alerts;

-- Only admins can insert, update, or delete broadcast alerts
CREATE POLICY "Admins have full access to broadcast_alerts"
    ON public.broadcast_alerts
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Authenticated residents and public can view only active broadcast alerts
CREATE POLICY "Residents can view active broadcast alerts"
    ON public.broadcast_alerts
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Verify and enforce RLS policies on assistance_requests
-- Admins have full access; residents can create and view their own; non-admins cannot delete or modify other records
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assistance_requests') THEN
        ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DROP POLICY IF EXISTS "Admins have full access to assistance requests" ON public.assistance_requests;
CREATE POLICY "Admins have full access to assistance requests"
    ON public.assistance_requests
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
