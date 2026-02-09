/**
 * ════════════════════════════════════════════
 *  RevenueCat Integration
 * ════════════════════════════════════════════
 *  Handles subscription status checks and
 *  webhook signature verification.
 */

import crypto from 'crypto';

// ── Subscription Plan Mapping ─────────────

const PRODUCT_TO_PLAN: Record<string, 'monthly' | 'annual'> = {
  'flourish_premium_monthly':  'monthly',
  'flourish_premium_annual':   'annual',
  // Add your real RevenueCat product IDs here
  'rc_premium_monthly_4_99':   'monthly',
  'rc_premium_annual_49_99':   'annual',
};

/**
 * Map a RevenueCat product ID to our internal plan name.
 */
export function productToPlan(productId: string): 'monthly' | 'annual' | null {
  return PRODUCT_TO_PLAN[productId] ?? null;
}

// ── Entitlement Events ────────────────────

/** Events that grant premium access */
const GRANT_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',        // upgrade / crossgrade
]);

/** Events that revoke premium access */
const REVOKE_EVENTS = new Set([
  'EXPIRATION',
  'CANCELLATION',
  'BILLING_ISSUE',
]);

/**
 * Determine whether a RevenueCat webhook event should
 * grant or revoke premium status.
 */
export function classifyEvent(eventType: string): 'grant' | 'revoke' | 'ignore' {
  if (GRANT_EVENTS.has(eventType)) return 'grant';
  if (REVOKE_EVENTS.has(eventType)) return 'revoke';
  return 'ignore';
}

// ── Webhook Signature Verification ────────

/**
 * Verify the RevenueCat webhook signature.
 * RevenueCat signs webhooks with a shared secret using HMAC-SHA256.
 *
 * @param rawBody   - The raw request body as a string
 * @param signature - The value of the X-RevenueCat-Signature header
 * @returns true if the signature is valid
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | undefined
): boolean {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;

  // If no secret is configured, skip verification (dev mode)
  if (!secret) {
    console.warn('[RevenueCat] No webhook secret configured — skipping verification');
    return true;
  }

  if (!signature) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// ── Subscriber Status (REST API) ──────────

/**
 * Fetch a subscriber's entitlements directly from RevenueCat.
 * Useful for real-time premium checks (fallback if webhook is delayed).
 */
export async function getSubscriberStatus(appUserId: string): Promise<{
  hasPremium: boolean;
  plan: string;
}> {
  const apiKey = process.env.REVENUECAT_API_KEY;

  if (!apiKey) {
    console.warn('[RevenueCat] No API key — returning free status (mock)');
    return { hasPremium: false, plan: 'free' };
  }

  try {
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${appUserId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!res.ok) {
      console.error(`[RevenueCat] API returned ${res.status}`);
      return { hasPremium: false, plan: 'free' };
    }

    const data = (await res.json()) as { subscriber?: { entitlements?: Record<string, { expires_date: string; product_identifier?: string }> } };
    const entitlements = data?.subscriber?.entitlements ?? {};

    // Check for an active "premium" entitlement
    const premium = entitlements['premium'];
    if (premium && new Date(premium.expires_date) > new Date()) {
      const productId = premium.product_identifier ?? '';
      const plan = productToPlan(productId) ?? 'monthly';
      return { hasPremium: true, plan };
    }

    return { hasPremium: false, plan: 'free' };
  } catch (err) {
    console.error('[RevenueCat] Failed to fetch subscriber status:', err);
    return { hasPremium: false, plan: 'free' };
  }
}
