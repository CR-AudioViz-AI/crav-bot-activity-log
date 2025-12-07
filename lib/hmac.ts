import { createHmac, timingSafeEqual } from 'crypto';
import { getErrorMessage, logError, formatApiError } from '@/lib/utils/error-utils';

/**
 * Generate HMAC signature for activity data
 */
export function generateHmac(secret: string, data: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify HMAC signature using timing-safe comparison
 */
export function verifyHmac(
  secret: string,
  data: string,
  signature: string
): boolean {
  try {
    const expected = generateHmac(secret, data);
    const actual = signature;

    // Ensure same length for timing-safe comparison
    if (expected.length !== actual.length) {
      return false;
    }

    return timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(actual, 'hex')
    );
  } catch (error: unknown) {
    logError('HMAC verification error:', error);
    return false;
  }
}

/**
 * Extract HMAC signature from request headers
 */
export function extractSignature(headers: Headers): string | null {
  return headers.get('x-bot-signature') || headers.get('x-hmac-signature');
}
