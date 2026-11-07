/**
 * HEATSHIELD AI — PRODUCTION SUPABASE PHONE OTP AUTHENTICATION SERVICE
 * --------------------------------------------------------------------
 * Connects directly to Supabase Phone Authentication (`supabase.auth.signInWithOtp`
 * and `supabase.auth.verifyOtp`).
 *
 * Rules:
 *  - Frontend NEVER generates, displays, or verifies OTPs.
 *  - Official Supabase Auth handles OTP generation, SMS dispatch, expiration, and verification.
 *  - All numbers are normalized to E.164 format (e.g. +919945744948).
 *  - Cooldowns and rate-limiting safeguards are enforced.
 */

import { supabase, isSupabaseConfigured } from './supabase';

export interface PhoneAuthRequestResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  errorCode?: string;
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

  // If localNumber already includes country code
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
  // 10 digits starting with 6-9
  if (digitsOnly.length === 10) {
    return /^[6-9]\d{9}$/.test(digitsOnly);
  }
  // 12 digits starting with 91 followed by 6-9
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return /^91[6-9]\d{9}$/.test(digitsOnly);
  }
  return false;
}

/**
 * Requests an SMS OTP from Supabase Phone Authentication.
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

  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      message: 'Supabase authentication service is not configured. Please check your environment configuration.',
      errorCode: 'supabase_not_configured'
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        channel: 'sms'
      }
    });

    if (error) {
      console.warn('Supabase signInWithOtp error:', error);
      let userFriendlyMsg = error.message;

      if (error.message.includes('Unsupported phone provider') || (error as any).code === 'phone_provider_disabled') {
        userFriendlyMsg = 'SMS Provider is not yet enabled in the Supabase Dashboard. Please enable the Phone provider in Auth Settings.';
      } else if (error.message.includes('rate limit') || error.status === 429) {
        userFriendlyMsg = 'Too many requests. Please wait a few minutes before trying again.';
      } else if (error.message.includes('Invalid phone number')) {
        userFriendlyMsg = 'The phone number entered was rejected by the SMS gateway. Please check the digits and try again.';
      }

      return {
        success: false,
        message: userFriendlyMsg,
        errorCode: (error as any).code || 'request_failed'
      };
    }

    // Set cooldown
    requestCooldownTimestamps.set(normalizedPhone, Date.now());

    return {
      success: true,
      message: `Verification code sent via SMS to ${normalizedPhone}.`,
      cooldownSeconds: 60
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error: could not connect to Supabase Auth service.',
      errorCode: 'network_error'
    };
  }
}

/**
 * Verifies the 6-digit SMS OTP using official Supabase Phone Auth API.
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

  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      message: 'Supabase authentication service is not configured.',
      errorCode: 'supabase_not_configured'
    };
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: cleanToken,
      type: 'sms'
    });

    if (error) {
      console.warn('Supabase verifyOtp error:', error);
      let userFriendlyMsg = error.message;

      if (error.message.toLowerCase().includes('token has expired') || error.message.toLowerCase().includes('expired')) {
        userFriendlyMsg = 'Verification code has expired. Please request a new code.';
      } else if (error.message.toLowerCase().includes('invalid token') || error.message.toLowerCase().includes('token is invalid')) {
        userFriendlyMsg = 'Incorrect verification code. Please check your SMS and enter the 6 digits again.';
      } else if (error.status === 429) {
        userFriendlyMsg = 'Too many failed verification attempts. Please request a new code.';
      }

      return {
        success: false,
        message: userFriendlyMsg,
        errorCode: (error as any).code || 'verification_failed'
      };
    }

    // Clear cooldown on successful verification
    requestCooldownTimestamps.delete(normalizedPhone);

    return {
      success: true,
      message: 'Mobile number verified successfully!',
      session: data.session,
      user: data.user
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error during verification. Please try again.',
      errorCode: 'network_error'
    };
  }
}
