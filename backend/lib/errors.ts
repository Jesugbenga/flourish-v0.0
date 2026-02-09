/**
 * ════════════════════════════════════════════
 *  Error Handling Utilities
 * ════════════════════════════════════════════
 *  Consistent, friendly error responses.
 */

import type { Response } from 'express';
import type { ApiResponse } from '../types';

/**
 * Custom API error class with status code.
 */
export class ApiError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

// ── Pre-built Errors ──────────────────────

export const Errors = {
  unauthorized: () => new ApiError(401, 'You must be logged in to do that.'),
  forbidden: () => new ApiError(403, 'You don\'t have permission to do that.'),
  premiumRequired: () => new ApiError(403, 'This feature requires a Flourish Premium subscription 💎'),
  notFound: (resource = 'Resource') => new ApiError(404, `${resource} not found.`),
  badRequest: (detail: string) => new ApiError(400, detail),
  conflict: (detail: string) => new ApiError(409, detail),
  tooManyRequests: () => new ApiError(429, 'Slow down! Too many requests. Try again in a moment. 🌿'),
  internal: (detail?: string) => new ApiError(500, detail ?? 'Something went wrong on our end. Please try again.'),
  methodNotAllowed: (allowed: string) => new ApiError(405, `Method not allowed. Use ${allowed}.`),
} as const;

// ── Response Helpers ──────────────────────

/**
 * Send a success response.
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiResponse<T> = { ok: true, data };
  res.status(statusCode).json(body);
}

/**
 * Send an error response. Handles both ApiError and unexpected errors.
 */
export function sendError(res: Response, err: unknown): void {
  if (err instanceof ApiError) {
    const body: ApiResponse = { ok: false, error: err.message };
    res.status(err.statusCode).json(body);
    return;
  }

  // Unexpected error — log it, but don't leak details
  console.error('[Unhandled Error]', err);
  const body: ApiResponse = {
    ok: false,
    error: 'Something went wrong. Please try again.',
  };
  res.status(500).json(body);
}

/**
 * Validate that the request method is allowed.
 * Returns true if allowed, sends 405 and returns false if not.
 */
export function assertMethod(
  method: string | undefined,
  allowed: string | string[],
  res: Response
): boolean {
  const allowedArr = Array.isArray(allowed) ? allowed : [allowed];

  if (!method || !allowedArr.includes(method.toUpperCase())) {
    sendError(res, Errors.methodNotAllowed(allowedArr.join(', ')));
    return false;
  }

  return true;
}
