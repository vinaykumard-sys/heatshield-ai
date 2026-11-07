/**
 * HEATSHIELD AI — CUSTOM WHATSAPP OTP AUTHENTICATION SERVICE
 * -------------------------------------------------------------
 * Custom, secure WhatsApp OTP authentication layer using Supabase Edge Functions
 * (`send-whatsapp-otp` and `verify-whatsapp-otp`), Supabase PostgreSQL, and official
 * WhatsApp Business Cloud API.
 *
 * Rules:
 *  - Does NOT require Supabase's paid phone-auth or MFA features.
 *  - Frontend NEVER generates, stores, or verifies OTPs.
 *  - Cryptographic 6-digit random OTP is generated & hashed server-side in the Edge Function.
 *  - OTPs expire in 5 minutes with anti-brute-force attempt limits (max 5).
 *  - All numbers are normalized to E.164 format (+91XXXXXXXXXX).
 *  - 60-second cooldown is enforced to prevent spam and rate-limit abuse.
 */

import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from './supabase';

export interface PhoneAuthRequestResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  errorCode?: string;
  provider?: string;
}

export interface PhoneAuthVerifyResult {
  success: boolean;
  message: string;
  session?: any;
  user?: any;
  errorCode?: string;
}

// In-memory request timestamp store for client-side spam protection
const requestCooldownTimestamps = new Map<string, number>();

/**
 * Normalizes a phone number to standard E.164 format.
 * Defaults to India (+91) if no country code is present.
 * Example: '9945744948' -> '+919945744948'
 * Example: '+91 99457-44948' -> '+919945744948'
 */
export function normalizeToE164(countryCode: string, localNumber: string): string {
  const cleanCode = (countryCode || '+91').trim().replace(/[^0-9+]/g, '');
  const prefix = cleanCode.startsWith('+') ? cleanCode : `+${cleanCode}`;
  const cleanNumber = localNumber.replace(/[^0-9]/g, '');

  if (cleanNumber.length > 10 && cleanNumber.startsWith('91')) {
    return `+${cleanNumber}`;
  }

  return `${prefix}${cleanNumber}`;
}

/**
 * Validates Indian mobile phone number format:
 * Exactly 10 digits, starting with 6, 7, 8, or 9.
 */
export function isValidIndianMobileNumber(phoneStr: string): boolean {
  const digitsOnly = phoneStr.replace(/[^0-9]/g, '');
  if (digitsOnly.length === 10) {
    return /^[6-9]\d{9}$/.test(digitsOnly);
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return /^91[6-9]\d{9}$/.test(digitsOnly);
  }
  return false;
}

/**
 * Helper to invoke Supabase Edge Functions with automatic fallback to direct HTTP fetch
 */
async function invokeEdgeFunction(functionName: string, payload: any): Promise<any> {
  // Method 1: Supabase JS Client Functions API
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (!error && data) {
        return data;
      }

      if (error) {
        // Parse error body if available
        let detailedError = error.message;
        try {
          if ((error as any).context && typeof (error as any).context.json === 'function') {
            const errJson = await (error as any).context.json();
            if (errJson.error) detailedError = errJson.error;
          }
        } catch (_) {}
        return { success: false, error: detailedError };
      }
    } catch (e: any) {
      console.warn(`[EdgeFunction ${functionName}] supabase.functions.invoke error, trying fetch fallback:`, e);
    }
  }

  // Method 2: Direct HTTP Fetch to Edge Function
  if (supabaseUrl && supabaseAnonKey) {
    const endpoint = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/${functionName}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${res.status}: Edge function request failed.`
      };
    }
    return data;
  }

  return {
    success: false,
    error: 'Supabase configuration is missing. Please check your environment variables.'
  };
}

/**
 * Requests a secure 6-digit WhatsApp OTP from the Supabase Edge Function.
 */
export async function requestPhoneOtp(
  countryCode: string,
  localNumber: string
): Promise<PhoneAuthRequestResult> {
  const digitsOnly = localNumber.replace(/[^0-9]/g, '');

  if (!digitsOnly || digitsOnly.length < 10) {
    return {
      success: false,
      message: 'Please enter a valid 10-digit mobile number.',
      errorCode: 'invalid_number'
    };
  }

  const normalizedPhone = normalizeToE164(countryCode, localNumber);

  // Validate Indian format if +91
  if (normalizedPhone.startsWith('+91')) {
    const withoutCode = normalizedPhone.replace(/^\+91/, '');
    if (!/^[6-9]\d{9}$/.test(withoutCode)) {
      return {
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number (must begin with 6, 7, 8, or 9).',
        errorCode: 'invalid_indian_mobile'
      };
    }
  }

  // Client-side 60-second cooldown protection
  const lastRequested = requestCooldownTimestamps.get(normalizedPhone);
  if (lastRequested && Date.now() - lastRequested < 60000) {
    const remaining = Math.ceil((60000 - (Date.now() - lastRequested)) / 1000);
    return {
      success: false,
      message: `Please wait ${remaining} seconds before requesting another code.`,
      cooldownSeconds: remaining,
      errorCode: 'rate_limited'
    };
  }

  try {
    const data = await invokeEdgeFunction('send-whatsapp-otp', { phone: normalizedPhone });

    if (!data.success) {
      return {
        success: false,
        message: data.error || 'Failed to send WhatsApp verification code. Please try again.',
        cooldownSeconds: data.cooldownSeconds,
        errorCode: 'request_failed'
      };
    }

    // Set cooldown
    requestCooldownTimestamps.set(normalizedPhone, Date.now());

    return {
      success: true,
      message: data.message || `Verification code sent to WhatsApp (${normalizedPhone}).`,
      cooldownSeconds: data.cooldownSeconds || 60,
      provider: data.provider
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error: could not connect to WhatsApp OTP service.',
      errorCode: 'network_error'
    };
  }
}

/**
 * Verifies the 6-digit WhatsApp OTP using the Supabase Edge Function
 * and establishes the authenticated Supabase session.
 */
export async function verifyPhoneOtp(
  countryCode: string,
  localNumber: string,
  token: string
): Promise<PhoneAuthVerifyResult> {
  const cleanToken = token.trim().replace(/[^0-9]/g, '');

  if (cleanToken.length !== 6) {
    return {
      success: false,
      message: 'Please enter the full 6-digit verification code.',
      errorCode: 'invalid_token_length'
    };
  }

  const normalizedPhone = normalizeToE164(countryCode, localNumber);

  try {
    const data = await invokeEdgeFunction('verify-whatsapp-otp', {
      phone: normalizedPhone,
      otp: cleanToken
    });

    if (!data.success) {
      return {
        success: false,
        message: data.error || 'Invalid or expired verification code.',
        errorCode: 'verification_failed'
      };
    }

    // Clear cooldown on successful verification
    requestCooldownTimestamps.delete(normalizedPhone);

    // If an authentication token_hash was returned, establish the official Supabase session
    let authenticatedSession = null;
    let authenticatedUser = null;

    if (data.token_hash && isSupabaseConfigured && supabase) {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: 'email'
        });

        if (!sessionError && sessionData?.session) {
          authenticatedSession = sessionData.session;
          authenticatedUser = sessionData.user;
        } else if (sessionError) {
          console.warn('[verifyPhoneOtp] Session exchange notice:', sessionError);
        }
      } catch (sessErr) {
        console.warn('[verifyPhoneOtp] Session verify exception:', sessErr);
      }
    }

    // Fallback user object if session exchange is handled via background context
    if (!authenticatedUser) {
      authenticatedUser = {
        id: data.userId || `usr-${Date.now()}`,
        phone: normalizedPhone,
        email: data.email || `${normalizedPhone.replace(/\D/g, '')}@whatsapp.heatshield.internal`,
        role: 'resident',
        is_phone_verified: true
      };
    }

    return {
      success: true,
      message: data.message || 'WhatsApp number verified successfully!',
      session: authenticatedSession,
      user: authenticatedUser
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error during WhatsApp verification.',
      errorCode: 'network_error'
    };
  }
}
