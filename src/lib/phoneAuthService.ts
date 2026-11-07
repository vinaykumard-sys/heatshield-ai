/**
 * HEATSHIELD AI — REAL SERVER-SIDE PHONE OTP AUTHENTICATION & VERIFICATION SERVICE
 * ---------------------------------------------------------------------------------
 * Integrates with the HeatShield AI backend WhatsApp/OTP service (`whatsapp-service`).
 * Implements cryptographically generated 6-digit OTPs, server-side SHA-256 validation,
 * rate limiting (max 3 per 10 mins, 60s cooldown), 5-minute single-use expiration,
 * and anti-brute-force safeguards.
 *
 * Sender Identity: HeatShield AI
 */

import { requestServerOtp, verifyServerOtp } from './whatsappGateway';

export interface PhoneVerificationResult {
  success: boolean;
  message: string;
  verifiedAt?: string;
  token?: string;
  cooldownSeconds?: number;
  channel?: 'whatsapp' | 'dev_simulated';
  gatewayConnected?: boolean;
  devOtp?: string;
}

// Format canonical phone number (e.g. +91 9845012345 or +919845012345)
export function formatCanonicalPhone(countryCode: string, localNumber: string): string {
  const cleanCode = countryCode.trim().startsWith('+') ? countryCode.trim() : `+${countryCode.trim()}`;
  const cleanNumber = localNumber.replace(/[^0-9]/g, '');
  return `${cleanCode}${cleanNumber}`;
}

/**
 * Initiates real server-side OTP challenge via WhatsApp Gateway.
 * Backend generates a cryptographically secure 6-digit code, enforces 60s cooldown,
 * and caps at 3 requests per 10 minutes.
 */
export async function requestPhoneOtp(
  countryCode: string,
  localNumber: string
): Promise<PhoneVerificationResult> {
  const digitsOnly = localNumber.replace(/[^0-9]/g, '');
  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    return {
      success: false,
      message: 'Please enter a valid mobile phone number (8 to 15 digits).'
    };
  }

  try {
    const res = await requestServerOtp(countryCode, localNumber);

    if (res.success) {
      return {
        success: true,
        message: res.message || 'HeatShield AI verification code sent.',
        cooldownSeconds: res.cooldownSeconds || 60,
        channel: res.channel,
        gatewayConnected: res.gatewayConnected,
        devOtp: res.devOtp
      };
    }

    return {
      success: false,
      message: res.message || 'Failed to request verification code.',
      cooldownSeconds: res.cooldownSeconds
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'HeatShield OTP service is unreachable. Please ensure gateway is running.'
    };
  }
}

/**
 * Validates the resident's entered 6-digit OTP code against the server challenge.
 * Enforces single-use consumption and max 5 attempts before invalidation.
 */
export async function verifyPhoneOtp(
  countryCode: string,
  localNumber: string,
  enteredCode: string,
  options?: { userId?: string; preferences?: any }
): Promise<PhoneVerificationResult> {
  const cleanEntered = enteredCode.trim().replace(/[^0-9]/g, '');
  if (cleanEntered.length !== 6) {
    return {
      success: false,
      message: 'Verification code must be exactly 6 digits.'
    };
  }

  const canonical = formatCanonicalPhone(countryCode, localNumber);

  try {
    const res = await verifyServerOtp(countryCode, localNumber, cleanEntered, options);

    if (!res.success) {
      return {
        success: false,
        message: res.message || 'Verification failed. Please check the code.'
      };
    }

    const verifiedAt = res.verifiedAt || new Date().toISOString();

    // Persist verified status locally
    try {
      const verifiedPhones = JSON.parse(localStorage.getItem('heatshield_verified_phones') || '{}');
      verifiedPhones[canonical] = {
        verifiedAt,
        countryCode,
        number: localNumber,
        token: res.token
      };
      localStorage.setItem('heatshield_verified_phones', JSON.stringify(verifiedPhones));
    } catch {
      // ignore storage failure
    }

    return {
      success: true,
      message: res.message || 'Mobile number verified successfully with HeatShield AI!',
      verifiedAt,
      token: res.token
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Verification failed. Please try again.'
    };
  }
}
