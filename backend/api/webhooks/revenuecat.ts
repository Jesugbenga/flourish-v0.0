/**
 * ════════════════════════════════════════════
 *  POST /api/webhooks/revenuecat
 * ════════════════════════════════════════════
 *  Receives webhook events from RevenueCat when
 *  a subscription is purchased, renewed, cancelled,
 *  or expires. Updates the user's premium status.
 *
 *  ⚠️  No Firebase auth — uses webhook signature verification instead.
 */

import type { Request, Response } from 'express';
import { db } from '../../lib/firebase';
import { verifyWebhookSignature, classifyEvent, productToPlan } from '../../lib/revenuecat';
import { sendSuccess, sendError, assertMethod, Errors } from '../../lib/errors';
import type { RevenueCatWebhookEvent } from '../../types';

export default async function handler(req: Request, res: Response) {
  if (!assertMethod(req.method, 'POST', res)) return;

  try {
    // ── Derive raw body string (works with Buffer / string / parsed object) ──
    let rawBody: string;
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('utf8');
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else {
      rawBody = JSON.stringify(req.body);
    }

    // ── Verify webhook signature ──────────
    const signature = req.headers['x-revenuecat-signature'] as string | undefined;

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('[RevenueCat] Invalid webhook signature');
      sendError(res, Errors.unauthorized());
      return;
    }

    // ── Parse event ───────────────────────
    let payload: RevenueCatWebhookEvent;
    try {
      payload = JSON.parse(rawBody) as RevenueCatWebhookEvent;
    } catch {
      sendError(res, Errors.badRequest('Invalid JSON body'));
      return;
    }
    const event = payload.event;

    if (!event?.type || !event?.app_user_id) {
      sendError(res, Errors.badRequest('Invalid webhook payload'));
      return;
    }

    console.log(`[RevenueCat] Event: ${event.type} for user ${event.app_user_id}`);

    // ── Classify the event ────────────────
    const action = classifyEvent(event.type);

    if (action === 'ignore') {
      console.log(`[RevenueCat] Ignoring event type: ${event.type}`);
      sendSuccess(res, { received: true, action: 'ignored' });
      return;
    }

    // ── Find the user ─────────────────────
    // The app_user_id should be the Firebase UID
    let userId: string | null = null;

    // First try: direct document lookup (Firebase UID = document ID)
    const directSnap = await db.collection('users').doc(event.app_user_id).get();
    if (directSnap.exists) {
      userId = directSnap.id;
    }

    // Second try: lookup by revenuecat_id field
    if (!userId) {
      const rcSnap = await db
        .collection('users')
        .where('revenuecat_id', '==', event.app_user_id)
        .limit(1)
        .get();

      if (!rcSnap.empty) {
        userId = rcSnap.docs[0].id;
      }
    }

    if (!userId) {
      console.error('[RevenueCat] User not found:', event.app_user_id);
      // Still return 200 to prevent RevenueCat from retrying
      sendSuccess(res, { received: true, action: 'user_not_found' });
      return;
    }

    const userRef = db.collection('users').doc(userId);

    // ── Update premium status ─────────────
    if (action === 'grant') {
      const plan = productToPlan(event.product_id) ?? 'monthly';

      await userRef.update({
        has_premium: true,
        premium_plan: plan,
        revenuecat_id: event.app_user_id,
        updated_at: new Date().toISOString(),
      });

      // Log activity
      await db.collection('users').doc(userId).collection('activityLog').add({
        action: 'app_open',
        metadata: {
          event: 'subscription_granted',
          type: event.type,
          product: event.product_id,
          plan,
        },
        created_at: new Date().toISOString(),
      });

      console.log(`[RevenueCat] ✅ Granted premium (${plan}) to user ${userId}`);
    }

    if (action === 'revoke') {
      await userRef.update({
        has_premium: false,
        premium_plan: 'free',
        updated_at: new Date().toISOString(),
      });

      // Log activity
      await db.collection('users').doc(userId).collection('activityLog').add({
        action: 'app_open',
        metadata: {
          event: 'subscription_revoked',
          type: event.type,
          product: event.product_id,
        },
        created_at: new Date().toISOString(),
      });

      console.log(`[RevenueCat] ❌ Revoked premium for user ${userId}`);
    }

    sendSuccess(res, { received: true, action });
  } catch (err) {
    console.error('[RevenueCat] Webhook error:', err);
    // Always return 200 for webhooks to prevent retry storms
    res.status(200).json({ ok: true, received: true, error: 'internal' });
  }
}
