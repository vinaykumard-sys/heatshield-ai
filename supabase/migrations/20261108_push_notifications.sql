-- ==============================================================================
-- HEATSHIELD AI — PUSH NOTIFICATIONS & EXPO TOKEN MANAGEMENT MIGRATION
-- Migration Version: 20261108_push_notifications
-- Scope: Expo Push Tokens for Android/Cross-Platform, RLS Policies, Device Management
-- ==============================================================================

-- 1. CREATE PUSH_TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    expo_push_token TEXT NOT NULL UNIQUE,
    platform TEXT DEFAULT 'android',
    device_name TEXT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    last_seen_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. CREATE INDEXES FOR FAST LOOKUP & BATCH TARGETING
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_enabled ON public.push_tokens(enabled);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(expo_push_token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_platform ON public.push_tokens(platform);

-- 3. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER tr_push_tokens_updated_at
    BEFORE UPDATE ON public.push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_push_tokens_updated_at();

-- 4. STRICT ROW LEVEL SECURITY (RLS)
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Drop prior policies if they exist
DROP POLICY IF EXISTS "Users can only insert, select, update, and delete their own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Service role has full access on push_tokens" ON public.push_tokens;

-- Policy: Users can only insert, select, update, and delete their own push tokens (auth.uid() = user_id)
CREATE POLICY "Users can only insert, select, update, and delete their own push tokens"
    ON public.push_tokens
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access (for Edge Functions and Dispatcher backend tasks)
CREATE POLICY "Service role has full access on push_tokens"
    ON public.push_tokens
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. EXTEND USER NOTIFICATION PREFERENCES IF PRESENT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_notification_preferences'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'user_notification_preferences' 
              AND column_name = 'push_enabled'
        ) THEN
            ALTER TABLE public.user_notification_preferences 
                ADD COLUMN push_enabled BOOLEAN DEFAULT true NOT NULL;
        END IF;
    END IF;
END $$;

-- 6. GRANT APPROPRIATE PRIVILEGES
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;
GRANT ALL ON public.push_tokens TO service_role;
