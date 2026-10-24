/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Authentication & Multi-Tenant RBAC State
 */

import { useState } from 'react';
import { UserRole, UserSession, Organization } from '../../packages/shared-types/index.ts';
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
    tokenExpiresAt: Date.now() + 86400000,
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
    tokenExpiresAt: Date.now() + 86400000,
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
    tokenExpiresAt: Date.now() + 86400000,
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
    tokenExpiresAt: Date.now() + 86400000,
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
    tokenExpiresAt: Date.now() + 86400000,
  },
};

export function useAuth() {
  const [currentRole, setCurrentRole] = useState<UserRole>('DISPATCHER');
  const [selectedOrg, setSelectedOrg] = useState<Organization>(ORGANIZATIONS[0]);

  const user = {
    ...DEFAULT_USERS[currentRole],
    tenantId: selectedOrg.id,
    organizationName: selectedOrg.name,
  };

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
  };

  const switchOrganization = (orgId: string) => {
    const org = ORGANIZATIONS.find((o) => o.id === orgId);
    if (org) setSelectedOrg(org);
  };

  const checkPermission = (perm: string) => {
    return hasPermission(currentRole, perm);
  };

  return {
    user,
    currentRole,
    selectedOrg,
    switchRole,
    switchOrganization,
    checkPermission,
    organizations: ORGANIZATIONS,
  };
}
