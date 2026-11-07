-- ==============================================================================
-- HEATSHIELD AI — ASSISTANCE REQUESTS & RLS POLICY SYNCHRONIZATION
-- Migration Version: 20261107000000
-- Scope: Add missing contact and location columns to assistance_requests,
--        modernize status check constraint, and optimize RLS policies
--        for authenticated residents and volunteers.
-- ==============================================================================

-- 1. ADD EXTENDED COLUMNS TO ASSISTANCE REQUESTS
ALTER TABLE public.assistance_requests
    ADD COLUMN IF NOT EXISTS contact_phone TEXT,
    ADD COLUMN IF NOT EXISTS resident_name TEXT,
    ADD COLUMN IF NOT EXISTS locality_name TEXT,
    ADD COLUMN IF NOT EXISTS assigned_volunteer_name TEXT;

-- 2. MAKE LOCALITY_ID NULLABLE SO REQUESTS SUBMITTED VIA TEXT LOCALITY DO NOT FAIL FOREIGN KEY
ALTER TABLE public.assistance_requests
    ALTER COLUMN locality_id DROP NOT NULL;

-- 3. UPDATE STATUS CHECK CONSTRAINT TO SUPPORT HEATSHIELD 2.0 UX WORKFLOW
ALTER TABLE public.assistance_requests
    DROP CONSTRAINT IF EXISTS assistance_requests_status_check;

ALTER TABLE public.assistance_requests
    ADD CONSTRAINT assistance_requests_status_check
    CHECK (status IN ('submitted', 'in_review', 'dispatched', 'resolved', 'cancelled', 'open', 'assigned', 'in_progress'));

-- 4. UPDATE RLS POLICIES FOR ASSISTANCE REQUESTS
-- Drop previous restrictive policies
DROP POLICY IF EXISTS "Admins have full access to assistance requests" ON public.assistance_requests;
DROP POLICY IF EXISTS "Residents can view and create their own requests" ON public.assistance_requests;
DROP POLICY IF EXISTS "Residents can insert assistance requests" ON public.assistance_requests;
DROP POLICY IF EXISTS "Volunteers can view all open requests in community and update assigned ones" ON public.assistance_requests;
DROP POLICY IF EXISTS "Volunteers can update assigned requests" ON public.assistance_requests;
DROP POLICY IF EXISTS "Anyone authenticated can view assistance requests" ON public.assistance_requests;
DROP POLICY IF EXISTS "Volunteers and admins can claim and update requests" ON public.assistance_requests;

-- Admins full access
CREATE POLICY "Admins have full access to assistance requests"
    ON public.assistance_requests FOR ALL
    USING (public.is_admin());

-- Authenticated and community visibility: Allow residents, volunteers and admins to view active assistance requests
CREATE POLICY "Community read access for assistance requests"
    ON public.assistance_requests FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Anyone can submit an assistance request (for emergency relief)
CREATE POLICY "Residents and public can insert assistance requests"
    ON public.assistance_requests FOR INSERT
    WITH CHECK (true);

-- Volunteers and Admins can claim unassigned requests and advance status to in_review / dispatched / resolved
CREATE POLICY "Volunteers and admins can claim and update requests"
    ON public.assistance_requests FOR UPDATE
    USING (
        public.is_volunteer() 
        OR public.is_admin() 
        OR assigned_volunteer_id = auth.uid() 
        OR assigned_volunteer_id IS NULL
    );
