/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Security Middlewares & Error Boundaries
 * Enforces RBAC permissions, sliding-window rate limiting, input sanitization, and structured operational error handling.
 */

import { UserRole } from '../../packages/shared-types/index.ts';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.ts';
import { logger } from '../../packages/logger/index.ts';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode: string = 'ERR_INTERNAL', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Role-Based Access Control (RBAC) permission map
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    'shipments:read',
    'shipments:write',
    'shipments:delete',
    'fleet:read',
    'fleet:write',
    'fleet:control',
    'warehouse:read',
    'warehouse:write',
    'compliance:read',
    'compliance:sign',
    'system:configure',
  ],
  DISPATCHER: [
    'shipments:read',
    'shipments:write',
    'fleet:read',
    'fleet:control',
    'routes:optimize',
    'alerts:manage',
  ],
  WAREHOUSE_MANAGER: [
    'warehouse:read',
    'warehouse:write',
    'inventory:cycle_count',
    'shipments:read',
    'docks:manage',
  ],
  FLEET_DRIVER: [
    'fleet:read_assigned',
    'telematics:ping',
    'hos:log',
    'shipments:read_assigned',
  ],
  COMPLIANCE_AUDITOR: [
    'shipments:read',
    'compliance:read',
    'compliance:sign',
    'audit:export',
    'hazmat:verify',
  ],
};

export function hasPermission(role: UserRole, requiredPermission: string): boolean {
  if (role === 'ADMIN') return true;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(requiredPermission);
}

/**
 * Sliding Window Rate Limiter (InMemory sliding log)
 */
class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number = 60000; // 1 minute
  private readonly maxRequestsPerWindow: number = 300;

  public checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(clientId) || [];

    // Filter out timestamps outside window
    const activeTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (activeTimestamps.length >= this.maxRequestsPerWindow) {
      logger.warn('RATE_LIMIT', `Rate limit exceeded for client: ${clientId} (${activeTimestamps.length} reqs/min)`);
      return false; // Rate limit exceeded
    }

    activeTimestamps.push(now);
    this.requests.set(clientId, activeTimestamps);
    return true;
  }
}

export const rateLimiter = new SlidingWindowRateLimiter();
