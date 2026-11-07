import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function normalizeAndValidatePhone(rawPhone: string): { valid: boolean; phone: string; error?: string } {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { valid: false, phone: '', error: 'Phone number is required.' };
  }

  let cleaned = rawPhone.trim().replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  const digits = cleaned.replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return {
      valid: false,
      phone: '',
      error: 'Please enter a valid 10-digit Indian mobile number.'
    };
  }

  return { valid: true, phone: `+91${digits}` };
}

async function hashOtp(phone: string, otp: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${phone}:${otp}:${salt}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const otpHashSalt = Deno.env.get('OTP_HASH_SALT') || 'heatshield-secure-salt-2026';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const rawPhone = body.phone || '';
    const rawOtp = String(body.otp || '').trim();

    // 1. Phone validation
    const { valid, phone: normalizedPhone, error: phoneErr } = normalizeAndValidatePhone(rawPhone);
    if (!valid || !normalizedPhone) {
      return new Response(
        JSON.stringify({ success: false, error: phoneErr || 'Invalid phone number format.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. OTP format validation (strictly 6 digits)
    if (!/^\d{6}$/.test(rawOtp)) {
      return new Response(
        JSON.stringify({ success: false, error: 'OTP must be exactly 6 numeric digits.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Find active OTP challenge
    const { data: record, error: dbError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone', normalizedPhone)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbError || !record) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired OTP. Please request a new code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Check maximum attempts
    if (record.attempts >= record.max_attempts) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Maximum verification attempts exceeded. Please request a new code.'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Check expiration (5 minutes)
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Verification code has expired. Please request a new code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Hash submitted OTP & Compare securely
    const submittedHash = await hashOtp(normalizedPhone, rawOtp, otpHashSalt);
    if (submittedHash !== record.otp_hash) {
      const nextAttempts = record.attempts + 1;
      await supabase
        .from('otp_verifications')
        .update({ attempts: nextAttempts })
        .eq('id', record.id);

      const remaining = Math.max(0, record.max_attempts - nextAttempts);
      return new Response(
        JSON.stringify({
          success: false,
          error: remaining > 0
            ? `Invalid verification code. ${remaining} attempts remaining.`
            : 'Maximum verification attempts exceeded. Please request a new code.',
          remainingAttempts: remaining
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. OTP matches! Mark verified immediately to prevent replay
    await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', record.id);

    // 8. Connect to existing HeatShield Auth and Profile
    const phoneDigits = normalizedPhone.replace(/\D/g, '');
    const internalEmail = `${phoneDigits}@whatsapp.heatshield.internal`;

    let authUser: any = null;
    const { data: userList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = userList?.users?.find((u: any) =>
      u.email === internalEmail ||
      u.phone === normalizedPhone ||
      u.user_metadata?.phone === normalizedPhone
    );

    if (existing) {
      authUser = existing;
    } else {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: internalEmail,
        email_confirm: true,
        phone: normalizedPhone,
        phone_confirm: true,
        user_metadata: {
          phone: normalizedPhone,
          full_name: 'Resident',
          role: 'resident',
          is_phone_verified: true
        }
      });
      if (createError) {
        console.error('[verify-whatsapp-otp] Create auth user failed:', createError);
      } else {
        authUser = created.user;
      }
    }

    // Ensure Profile exists and preserve existing role
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const verifiedTimestamp = new Date().toISOString();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            phone: normalizedPhone,
            is_phone_verified: true,
            phone_verified_at: verifiedTimestamp
          })
          .eq('id', authUser.id);
      } else {
        await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            email: authUser.email,
            phone: normalizedPhone,
            role: 'resident',
            full_name: 'Resident',
            is_phone_verified: true,
            phone_verified_at: verifiedTimestamp,
            is_active: true,
            created_at: verifiedTimestamp
          });
      }
    }

    // Generate authenticated session magic link token
    let tokenHash = '';
    if (authUser?.email) {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: authUser.email,
      });
      tokenHash = linkData?.properties?.hashed_token || '';
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp verification successful.',
        phone: normalizedPhone,
        token_hash: tokenHash,
        email: authUser?.email,
        userId: authUser?.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[verify-whatsapp-otp] Unhandled exception:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error during verification.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
