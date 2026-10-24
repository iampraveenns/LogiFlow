/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Auth Controller
 * Handles HTTP/RPC authentication requests, token issuance, refresh cycles, and user identity profile queries.
 */

import { JwtAuthService } from '../services/jwtAuthService.ts';
import { SignUpRequest, SignInRequest, AuthResponse, UserSession } from '../../packages/shared-types/index.ts';
import { AppError } from '../middlewares/index.ts';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.ts';
import { logger } from '../../packages/logger/index.ts';

export class AuthController {
  /**
   * Sign-in user with credentials and optional MFA token
   */
  public static async signIn(req: SignInRequest): Promise<AuthResponse> {
    if (!req.email || !req.password) {
      throw new AppError('Email and password are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }
    const result = await JwtAuthService.signIn(req);
    if (!result.success && !result.mfaRequired) {
      throw new AppError(result.message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }
    return result;
  }

  /**
   * Register new user account
   */
  public static async signUp(req: SignUpRequest): Promise<AuthResponse> {
    if (!req.email || !req.password || !req.name || !req.role || !req.tenantId) {
      throw new AppError('All registration fields are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }
    const result = await JwtAuthService.signUp(req);
    if (!result.success) {
      throw new AppError(result.message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }
    return result;
  }

  /**
   * Refresh expired access token with valid refresh token
   */
  public static async refreshToken(token: string): Promise<AuthResponse> {
    if (!token) {
      throw new AppError('Refresh token must be provided', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }
    const result = await JwtAuthService.refreshAccessToken(token);
    if (!result.success) {
      throw new AppError(result.message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }
    return result;
  }

  /**
   * Invalidate active session and blacklist token
   */
  public static async logout(token: string): Promise<{ success: boolean; message: string }> {
    if (!token) return { success: true, message: 'Logged out' };
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    JwtAuthService.revokeToken(cleanToken);
    logger.info('AUTH_LOGOUT', `Logged out token`);
    return { success: true, message: 'Successfully signed out and revoked session token.' };
  }

  /**
   * Inspect current identity from Bearer token
   */
  public static async getCurrentUser(authHeader?: string): Promise<{ user: UserSession; tokenExp: number }> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Missing or malformed Authorization header', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }
    const token = authHeader.slice(7);
    const verified = JwtAuthService.verifyJwt(token);
    if (!verified.valid || !verified.claims) {
      throw new AppError(verified.error || 'Invalid or expired token', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }

    const c = verified.claims;
    const session: UserSession = {
      userId: c.sub,
      tenantId: c.tenantId,
      organizationName: c.organizationName,
      name: c.name,
      email: c.email,
      role: c.role,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      permissions: c.permissions,
      mfaEnabled: c.mfaVerified,
      tokenExpiresAt: c.exp * 1000,
    };

    return { user: session, tokenExp: c.exp };
  }

  /**
   * Get list of standard demonstration users for quick sign-in
   */
  public static getDemoUsers() {
    return JwtAuthService.listAvailableUsers();
  }

  /**
   * Get TOTP secret for demonstration 2FA code generation
   */
  public static getTotpSecret(email: string): string | undefined {
    return JwtAuthService.getTotpSecretForUser(email);
  }
}
