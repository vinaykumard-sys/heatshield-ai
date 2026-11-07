import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// E.164 Normalization and validation for Indian mobile numbers
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
      error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
    };
  }

  return { valid: true, phone: `+91${digits}` };
}

// Cryptographic hash for OTP
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
        JSON.stringify({ success: false, error: 'Server configuration error: Missing Supabase credentials.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const rawPhone = body.phone || '';

    // Validate and normalize
    const { valid, phone: normalizedPhone, error: validationError } = normalizeAndValidatePhone(rawPhone);
    if (!valid || !normalizedPhone) {
      return new Response(
        JSON.stringify({ success: false, error: validationError || 'Invalid phone number format.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate Limiting — 1) 60-Second Cooldown per number
    const sixtySecsAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentOtp } = await supabase
      .from('otp_verifications')
      .select('created_at, last_sent_at')
      .eq('phone', normalizedPhone)
      .gt('last_sent_at', sixtySecsAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOtp) {
      const elapsed = Math.floor((Date.now() - new Date(recentOtp.last_sent_at).getTime()) / 1000);
      const remainingCooldown = Math.max(1, 60 - elapsed);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Please wait ${remainingCooldown}s before requesting another verification code.`,
          cooldownSeconds: remainingCooldown
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate Limiting — 2) Abuse window: max 5 requests per 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count: windowCount } = await supabase
      .from('otp_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('phone', normalizedPhone)
      .gt('created_at', fifteenMinsAgo);

    if ((windowCount || 0) >= 5) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Maximum OTP request limit reached for this number. Please wait 15 minutes.'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate cryptographically secure random 6-digit OTP (100000–999999)
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const otpNumber = 100000 + (randomBuffer[0] % 900000);
    const otp = otpNumber.toString();

    // Securely hash OTP
    const otpHash = await hashOtp(normalizedPhone, otp, otpHashSalt);

    // Invalidate prior unverified codes for this phone
    await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('phone', normalizedPhone)
      .eq('verified', false);

    // Insert new verification record with 5-minute expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: insertError } = await supabase
      .from('otp_verifications')
      .insert({
        phone: normalizedPhone,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempts: 0,
        max_attempts: 5,
        verified: false,
        created_at: new Date().toISOString(),
        last_sent_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[send-whatsapp-otp] DB Insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error storing verification challenge.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Dispatch via Official WhatsApp Provider ────────────────────────────
    const waToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const waTemplateName = Deno.env.get('WHATSAPP_OTP_TEMPLATE_NAME') || 'heatshield_otp';

    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioWaFrom = Deno.env.get('TWILIO_WHATSAPP_NUMBER') || '+14155238886';

    const otpMessageText = `Your HeatShield AI verification code is ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`;

    let deliverySuccess = false;
    let providerUsed = 'none';
    let providerError = '';

    // 1. Meta WhatsApp Business Cloud API
    if (waToken && waPhoneId) {
      providerUsed = 'meta_cloud_api';
      const recipientDigits = normalizedPhone.replace(/\D/g, '');

      // Attempt 1: Approved Template format
      const templatePayload = {
        messaging_product: 'whatsapp',
        to: recipientDigits,
        type: 'template',
        template: {
          name: waTemplateName,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: otp }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                { type: 'text', text: otp }
              ]
            }
          ]
        }
      };

      try {
        let metaRes = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${waToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templatePayload)
        });

        if (metaRes.ok) {
          deliverySuccess = true;
        } else {
          // If template not found or failed, try direct transactional text
          const textPayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientDigits,
            type: 'text',
            text: { preview_url: false, body: otpMessageText }
          };

          metaRes = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${waToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(textPayload)
          });

          if (metaRes.ok) {
            deliverySuccess = true;
          } else {
            const errData = await metaRes.json().catch(() => ({}));
            providerError = errData?.error?.message || `Meta API HTTP ${metaRes.status}`;
            console.error('[send-whatsapp-otp] Meta API error:', providerError);
          }
        }
      } catch (err: any) {
        providerError = err.message || 'Meta Cloud API fetch failed';
        console.error('[send-whatsapp-otp] Meta error:', err);
      }
    } 
    // 2. Twilio WhatsApp API (Official Fallback)
    else if (twilioSid && twilioToken) {
      providerUsed = 'twilio_whatsapp';
      try {
        const formData = new URLSearchParams();
        formData.append('From', `whatsapp:${twilioWaFrom}`);
        formData.append('To', `whatsapp:${normalizedPhone}`);
        formData.append('Body', otpMessageText);

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
          }
        );

        if (twilioRes.ok) {
          deliverySuccess = true;
        } else {
          const errData = await twilioRes.json().catch(() => ({}));
          providerError = errData?.message || `Twilio HTTP ${twilioRes.status}`;
          console.error('[send-whatsapp-otp] Twilio error:', providerError);
        }
      } catch (err: any) {
        providerError = err.message || 'Twilio fetch failed';
      }
    } else {
      // Neither provider configured in Supabase Edge Function Secrets
      return new Response(
        JSON.stringify({
          success: false,
          error: 'WhatsApp Business API is not yet configured. Please add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in Supabase Edge Function secrets.',
          requiresConfiguration: true
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!deliverySuccess) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `WhatsApp delivery failed: ${providerError || 'Unknown provider error'}`
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Success response: Never return the OTP or hash
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification code sent to your WhatsApp number.',
        cooldownSeconds: 60,
        expiresInSeconds: 300,
        provider: providerUsed
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[send-whatsapp-otp] Unhandled exception:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected server error occurred while sending OTP.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
