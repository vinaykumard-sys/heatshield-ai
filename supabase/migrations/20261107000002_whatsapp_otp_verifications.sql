-- ==============================================================================
-- HEATSHIELD AI — WHATSAPP OTP VERIFICATION SCHEMA (MIGRATION)
-- ==============================================================================
-- Purpose:
-- Store securely hashed WhatsApp OTP verification records with anti-brute-force
-- controls, expiration timestamps, request cooldown tracking, and strict RLS.
-- Plaintext OTPs are NEVER stored and never exposed.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optimize queries by phone, expiry, and creation timestamp
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone 
  ON public.otp_verifications (phone);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at 
  ON public.otp_verifications (expires_at);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_created_at 
  ON public.otp_verifications (created_at DESC);

-- Enable Row-Level Security
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Block direct public/anon read/write.
-- All OTP operations MUST be executed through Supabase Edge Functions with service_role.
DROP POLICY IF EXISTS "Deny direct public access to otp_verifications" ON public.otp_verifications;
CREATE POLICY "Deny direct public access to otp_verifications"
  ON public.otp_verifications
  FOR ALL
  USING (false);

-- Grant full access to service_role (used by Edge Functions)
GRANT ALL ON public.otp_verifications TO service_role;
