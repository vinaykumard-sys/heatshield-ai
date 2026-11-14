-- ==============================================================================
-- HEATSHIELD AI — GOOGLE OAUTH & PROFILE CONFLICT RESOLUTION
-- Migration: 20261114000001_fix_oauth_profile_linking.sql
-- ==============================================================================

-- 1. Ensure handle_new_user() gracefully handles existing accounts during OAuth linking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        role, 
        preferred_language,
        is_email_verified,
        email_verified_at,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name', 
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(NEW.raw_user_meta_data->>'role', 'resident'),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
        Boolean(NEW.email_confirmed_at IS NOT NULL),
        NEW.email_confirmed_at,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        is_email_verified = EXCLUDED.is_email_verified,
        email_verified_at = EXCLUDED.email_verified_at,
        updated_at = NOW();

    RETURN NEW;
EXCEPTION WHEN unique_violation THEN
    -- If a profile with this email already exists (e.g. created via password first, now linking Google OAuth),
    -- update the profile with the new auth ID and retain verified role and preferences
    UPDATE public.profiles
    SET id = NEW.id,
        full_name = COALESCE(
            NEW.raw_user_meta_data->>'full_name', 
            NEW.raw_user_meta_data->>'name',
            public.profiles.full_name
        ),
        is_email_verified = Boolean(NEW.email_confirmed_at IS NOT NULL),
        email_verified_at = NEW.email_confirmed_at,
        updated_at = NOW()
    WHERE email = NEW.email;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Rebind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
