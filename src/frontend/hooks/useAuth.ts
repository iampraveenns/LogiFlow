/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Authentication & Real JWT Session Hook
 * Manages RFC 7519 JWT access tokens, refresh tokens, PBKDF2 credential verification,
 * TOTP MFA verification, and multi-tenant RBAC privilege scopes.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserRole, UserSession, Organization, JwtTokenPair, JwtClaims, SignInRequest, SignUpRequest } from '../../packages/shared-types/index.ts';
import { JwtAuthService } from '../../backend/services/jwtAuthService.ts';
import { ROLE_PERMISSIONS, hasPermission } from '../../backend/middlewares/index.ts';

export const ORGANIZATIONS: Organization[] = [
  {
    id: 'tenant-apex',
    name: 'Apex Global Logistics & Freight',
    code: 'APEX',
    tier: 'ENTERPRISE',
    country: 'Netherlands',
    defaultCurrency: 'EUR',
    fleetCount: 142,
    activeShipments: 890,
  },
  {
    id: 'tenant-nordic',
    name: 'Nordic Trans-Baltic Intermodal',
    code: 'NTB',
    tier: 'GLOBAL_PARTNER',
    country: 'Sweden',
    defaultCurrency: 'SEK',
    fleetCount: 68,
    activeShipments: 340,
  },
  {
    id: 'tenant-pacific',
    name: 'Pacific Rim Express Air & Sea',
    code: 'PRX',
    tier: 'ENTERPRISE',
    country: 'Singapore',
    defaultCurrency: 'USD',
    fleetCount: 210,
    activeShipments: 1420,
  },
];

const DEFAULT_USERS: Record<UserRole, UserSession> = {
  ADMIN: {
    userId: 'usr-admin-01',
    tenantId: 'tenant-apex',
    organizationName: 'Apex Global Logistics & Freight',
    name: 'Elena Rostova',
    email: 'elena.rostova@apexlogistics.io',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    permissions: ROLE_PERMISSIONS['ADMIN'],
    mfaEnabled: true,
    tokenExpiresAt: Date.now() + 3600000,
  },
  DISPATCHER: {
    userId: 'usr-disp-02',
    tenantId: 'tenant-apex',
    organizationName: 'Apex Global Logistics & Freight',
    name: 'Frank Mueller',
    email: 'frank.mueller@apexlogistics.io',
    role: 'DISPATCHER',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    permissions: ROLE_PERMISSIONS['DISPATCHER'],
    mfaEnabled: true,
    tokenExpiresAt: Date.now() + 3600000,
  },
  WAREHOUSE_MANAGER: {
    userId: 'usr-wm-03',
    tenantId: 'tenant-apex',
    organizationName: 'Apex Global Logistics & Freight',
    name: 'Astrid Lindberg',
    email: 'astrid.l@apexlogistics.io',
    role: 'WAREHOUSE_MANAGER',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    permissions: ROLE_PERMISSIONS['WAREHOUSE_MANAGER'],
    mfaEnabled: false,
    tokenExpiresAt: Date.now() + 3600000,
  },
  FLEET_DRIVER: {
    userId: 'usr-drv-04',
    tenantId: 'tenant-apex',
    organizationName: 'Apex Global Logistics & Freight',
    name: 'Lars van der Beek',
    email: 'lars.vanderbeek@apexlogistics.io',
    role: 'FLEET_DRIVER',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    permissions: ROLE_PERMISSIONS['FLEET_DRIVER'],
    mfaEnabled: false,
    tokenExpiresAt: Date.now() + 3600000,
  },
  COMPLIANCE_AUDITOR: {
    userId: 'usr-aud-05',
    tenantId: 'tenant-apex',
    organizationName: 'Apex Global Logistics & Freight',
    name: 'Sarah Chen, Esq.',
    email: 'sarah.chen@apexlogistics.io',
    role: 'COMPLIANCE_AUDITOR',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    permissions: ROLE_PERMISSIONS['COMPLIANCE_AUDITOR'],
    mfaEnabled: true,
    tokenExpiresAt: Date.now() + 3600000,
  },
};

export function useAuth() {
  const [currentRole, setCurrentRole] = useState<UserRole>('DISPATCHER');
  const [user, setUser] = useState<UserSession>(DEFAULT_USERS['DISPATCHER']);
  const [selectedOrg, setSelectedOrg] = useState<Organization>(ORGANIZATIONS[0]);
  const [tokens, setTokens] = useState<JwtTokenPair | null>(null);
  const [decodedClaims, setDecodedClaims] = useState<JwtClaims | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [secondsUntilTokenExpiry, setSecondsUntilTokenExpiry] = useState<number>(3600);

  // Initialize a real signed JWT for the active session on mount
  useEffect(() => {
    const defaultUser = DEFAULT_USERS[currentRole];
    const initialJwt = JwtAuthService.signJwt({
      sub: defaultUser.userId,
      role: defaultUser.role,
      tenantId: selectedOrg.id,
      organizationName: selectedOrg.name,
      email: defaultUser.email,
      name: defaultUser.name,
      permissions: ROLE_PERMISSIONS[defaultUser.role],
      mfaVerified: defaultUser.mfaEnabled,
      sessionId: `sess_${Date.now()}`,
    });

    const refreshToken = JwtAuthService.generateRefreshToken(defaultUser.userId);
    const verification = JwtAuthService.verifyJwt(initialJwt);

    if (verification.valid && verification.claims) {
      setTokens({
        accessToken: initialJwt,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 3600,
        claims: verification.claims,
      });
      setDecodedClaims(verification.claims);
    }
  }, [currentRole, selectedOrg]);

  // Token countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (decodedClaims?.exp) {
        const remaining = Math.max(0, decodedClaims.exp - Math.floor(Date.now() / 1000));
        setSecondsUntilTokenExpiry(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [decodedClaims]);

  /**
   * Switch active role persona
   */
  const switchRole = useCallback((newRole: UserRole) => {
    setCurrentRole(newRole);
    const newUser = {
      ...DEFAULT_USERS[newRole],
      tenantId: selectedOrg.id,
      organizationName: selectedOrg.name,
    };
    setUser(newUser);

    const newJwt = JwtAuthService.signJwt({
      sub: newUser.userId,
      role: newUser.role,
      tenantId: selectedOrg.id,
      organizationName: selectedOrg.name,
      email: newUser.email,
      name: newUser.name,
      permissions: ROLE_PERMISSIONS[newUser.role],
      mfaVerified: newUser.mfaEnabled,
      sessionId: `sess_${Date.now()}`,
    });

    const refreshToken = JwtAuthService.generateRefreshToken(newUser.userId);
    const verification = JwtAuthService.verifyJwt(newJwt);

    if (verification.valid && verification.claims) {
      setTokens({
        accessToken: newJwt,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 3600,
        claims: verification.claims,
      });
      setDecodedClaims(verification.claims);
    }
  }, [selectedOrg]);

  /**
   * Switch active tenant organization
   */
  const switchOrganization = useCallback((orgId: string) => {
    const org = ORGANIZATIONS.find((o) => o.id === orgId);
    if (org) {
      setSelectedOrg(org);
      setUser((prev) => ({
        ...prev,
        tenantId: org.id,
        organizationName: org.name,
      }));
    }
  }, []);

  /**
   * Sign In with credentials and optional MFA token
   */
  const signInWithCredentials = useCallback(async (req: SignInRequest) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await JwtAuthService.signIn({
        ...req,
        tenantId: req.tenantId || selectedOrg.id,
      });

      if (!res.success) {
        setAuthError(res.message);
        return res;
      }

      if (res.tokens && res.user) {
        setTokens(res.tokens);
        setDecodedClaims(res.tokens.claims);
        setUser(res.user);
        setCurrentRole(res.user.role);
      }

      return res;
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication error');
      return { success: false, message: err?.message || 'Failed to authenticate' };
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrg]);

  /**
   * Sign Up new account
   */
  const signUpNewAccount = useCallback(async (req: SignUpRequest) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await JwtAuthService.signUp(req);
      if (!res.success) {
        setAuthError(res.message);
        return res;
      }

      if (res.tokens && res.user) {
        setTokens(res.tokens);
        setDecodedClaims(res.tokens.claims);
        setUser(res.user);
        setCurrentRole(res.user.role);
      }

      return res;
    } catch (err: any) {
      setAuthError(err?.message || 'Registration error');
      return { success: false, message: err?.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh current access token
   */
  const refreshCurrentToken = useCallback(async () => {
    if (!tokens?.refreshToken) return;
    try {
      const res = await JwtAuthService.refreshAccessToken(tokens.refreshToken);
      if (res.success && res.tokens) {
        setTokens(res.tokens);
        setDecodedClaims(res.tokens.claims);
      }
    } catch (err) {
      console.error('Failed refreshing token:', err);
    }
  }, [tokens]);

  /**
   * Sign Out
   */
  const signOut = useCallback(() => {
    if (tokens?.accessToken) {
      JwtAuthService.revokeToken(tokens.accessToken);
    }
    // Switch to guest/dispatcher state
    switchRole('DISPATCHER');
  }, [tokens, switchRole]);

  /**
   * Check RBAC permission for current session
   */
  const can = useCallback((requiredPermission: string): boolean => {
    return hasPermission(currentRole, requiredPermission);
  }, [currentRole]);

  return {
    user,
    currentRole,
    selectedOrg,
    switchRole,
    switchOrganization,
    organizations: ORGANIZATIONS,
    can,
    tokens,
    rawAccessToken: tokens?.accessToken || '',
    decodedClaims,
    secondsUntilTokenExpiry,
    isLoading,
    authError,
    signInWithCredentials,
    signUpNewAccount,
    refreshCurrentToken,
    signOut,
  };
}
