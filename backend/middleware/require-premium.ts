/**
 * ════════════════════════════════════════════
 *  Premium Middleware — requirePremium
 * ════════════════════════════════════════════
 *  Must be called AFTER requireAuth.
 *  Checks that the user has an active premium
 *  subscription. Returns 403 if not.
 */

import type { Response } from 'express';
import type { AuthenticatedUser } from '../types';
import { sendError, Errors } from '../lib/errors';

/**
 * Assert that the authenticated user has a premium subscription.
 *
 * @param user - The user from requireAuth()
 * @param res  - The Vercel response (to send 403 if needed)
 * @returns true if premium, false if not (response already sent)
 */
export function requirePremium(
  user: AuthenticatedUser,
  res: Response
): boolean {
  if (user.hasPremium) return true;

  sendError(res, Errors.premiumRequired());
  return false;
}
