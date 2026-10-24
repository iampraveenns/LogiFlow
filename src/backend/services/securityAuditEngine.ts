/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Zero-Trust Security SIEM & Cryptographic Audit Merkle Engine
 * Implements IP Geo-Velocity Impossible Travel Detection, JWT Replay & Signature Auditing,
 * Merkle Tree Cryptographic Chaining, and Automated Containment Protocols.
 */

import { CryptoEngine } from './jwtAuthService.ts';
import { UserRole } from '../../packages/shared-types/index.ts';
import { logger } from '../../packages/logger/index.ts';

export type SecurityThreatLevel = 'INFORMATIONAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SecurityEventType =
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILURE'
  | 'AUTH_IMPOSSIBLE_TRAVEL'
  | 'AUTH_JWT_REPLAY'
  | 'AUTH_TOKEN_TAMPER'
  | 'AUTH_BRUTE_FORCE'
  | 'RBAC_PRIVILEGE_VIOLATION'
  | 'CONTAINMENT_IP_BLOCKED'
  | 'CONTAINMENT_SESSION_REVOKED'
  | 'MERKLE_BATCH_COMMITTED';

export interface GeoLocationPing {
  ipAddress: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  timestamp: number;
}

export interface SecurityEventRecord {
  id: string;
  eventType: SecurityEventType;
  threatLevel: SecurityThreatLevel;
  principalId: string;
  principalEmail: string;
  principalRole: UserRole;
  tenantId: string;
  ipAddress: string;
  location?: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  details: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  merkleLeafHash: string;
}

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
}

export interface ImpossibleTravelCheckResult {
  isAnomaly: boolean;
  distanceKm: number;
  timeElapsedHours: number;
  calculatedSpeedKmh: number;
  maxFeasibleSpeedKmh: number;
  reason?: string;
}

export class SecurityAuditEngine {
  private static eventLog: SecurityEventRecord[] = [];
  private static userLastLocations: Map<string, GeoLocationPing> = new Map();
  private static blockedIpAddresses: Set<string> = new Set();
  private static merkleRootHistory: { rootHash: string; timestamp: string; leafCount: number }[] = [];
  private static MAX_COMMERCIAL_FLIGHT_SPEED_KMH = 880;

  static {
    SecurityAuditEngine.seedInitialSecurityLogs();
  }

  /**
   * Seed realistic enterprise security events
   */
  private static seedInitialSecurityLogs() {
    const now = Date.now();
    const makeTime = (minutesAgo: number) => new Date(now - minutesAgo * 60 * 1000).toISOString();

    const sampleEvents: Omit<SecurityEventRecord, 'id' | 'merkleLeafHash'>[] = [
      {
        eventType: 'AUTH_LOGIN_SUCCESS',
        threatLevel: 'INFORMATIONAL',
        principalId: 'usr-admin-01',
        principalEmail: 'elena.rostova@apexlogistics.io',
        principalRole: 'ADMIN',
        tenantId: 'tenant-apex',
        ipAddress: '145.220.12.8',
        location: { city: 'Rotterdam', country: 'Netherlands', lat: 51.9244, lng: 4.4777 },
        details: 'Admin authenticated via corporate SAML/MFA gateway',
        timestamp: makeTime(120),
      },
      {
        eventType: 'AUTH_LOGIN_SUCCESS',
        threatLevel: 'INFORMATIONAL',
        principalId: 'usr-disp-02',
        principalEmail: 'frank.mueller@apexlogistics.io',
        principalRole: 'DISPATCHER',
        tenantId: 'tenant-apex',
        ipAddress: '185.86.151.20',
        location: { city: 'Hamburg', country: 'Germany', lat: 53.5511, lng: 9.9937 },
        details: 'Dispatcher authenticated with valid TOTP credential',
        timestamp: makeTime(95),
      },
      {
        eventType: 'AUTH_LOGIN_FAILURE',
        threatLevel: 'LOW',
        principalId: 'anonymous',
        principalEmail: 'admin@apexlogistics.io',
        principalRole: 'ADMIN',
        tenantId: 'tenant-apex',
        ipAddress: '91.240.118.44',
        location: { city: 'Kyiv', country: 'Ukraine', lat: 50.4501, lng: 30.5234 },
        details: 'Failed password attempt: invalid cryptographic PBKDF2 hash',
        timestamp: makeTime(80),
      },
      {
        eventType: 'AUTH_BRUTE_FORCE',
        threatLevel: 'HIGH',
        principalId: 'anonymous',
        principalEmail: 'elena.rostova@apexlogistics.io',
        principalRole: 'ADMIN',
        tenantId: 'tenant-apex',
        ipAddress: '91.240.118.44',
        location: { city: 'Kyiv', country: 'Ukraine', lat: 50.4501, lng: 30.5234 },
        details: '5 failed login attempts in 90 seconds. Automated brute-force lockout triggered.',
        timestamp: makeTime(78),
      },
      {
        eventType: 'CONTAINMENT_IP_BLOCKED',
        threatLevel: 'MEDIUM',
        principalId: 'system-firewall',
        principalEmail: 'secops@apexlogistics.io',
        principalRole: 'ADMIN',
        tenantId: 'tenant-apex',
        ipAddress: '91.240.118.44',
        location: { city: 'Kyiv', country: 'Ukraine', lat: 50.4501, lng: 30.5234 },
        details: 'IP 91.240.118.44 automatically blacklisted for 3600 seconds',
        timestamp: makeTime(77),
      },
      {
        eventType: 'AUTH_IMPOSSIBLE_TRAVEL',
        threatLevel: 'CRITICAL',
        principalId: 'usr-drv-04',
        principalEmail: 'lars.vanderbeek@apexlogistics.io',
        principalRole: 'FLEET_DRIVER',
        tenantId: 'tenant-apex',
        ipAddress: '103.253.144.10',
        location: { city: 'Hong Kong', country: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
        details: 'Login from Hong Kong 42 minutes after GPS telematics logged in Antwerp. Calculated velocity: 13,240 km/h (Physically impossible).',
        timestamp: makeTime(45),
      },
      {
        eventType: 'CONTAINMENT_SESSION_REVOKED',
        threatLevel: 'HIGH',
        principalId: 'usr-drv-04',
        principalEmail: 'lars.vanderbeek@apexlogistics.io',
        principalRole: 'FLEET_DRIVER',
        tenantId: 'tenant-apex',
        ipAddress: '103.253.144.10',
        location: { city: 'Hong Kong', country: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
        details: 'All JWT tokens in family revoked. Incident ticket #SEC-9841 dispatched to security operations.',
        timestamp: makeTime(44),
      },
      {
        eventType: 'RBAC_PRIVILEGE_VIOLATION',
        threatLevel: 'MEDIUM',
        principalId: 'usr-wm-03',
        principalEmail: 'astrid.l@apexlogistics.io',
        principalRole: 'WAREHOUSE_MANAGER',
        tenantId: 'tenant-apex',
        ipAddress: '145.220.12.8',
        location: { city: 'Rotterdam', country: 'Netherlands', lat: 51.9244, lng: 4.4777 },
        details: 'Unauthorized attempt to sign customs clearance document. Required permission: compliance:sign.',
        timestamp: makeTime(25),
      },
    ];

    for (const ev of sampleEvents) {
      const id = `sec-${CryptoEngine.generateUuid()}`;
      const hashPayload = `${id}:${ev.eventType}:${ev.principalEmail}:${ev.timestamp}`;
      const leafHash = CryptoEngine.sha256Hex(hashPayload);

      this.eventLog.push({
        ...ev,
        id,
        merkleLeafHash: leafHash,
      });
    }

    this.rebuildMerkleTree();
  }

  /**
   * Great Circle Haversine Geodesic Distance
   */
  public static haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Evaluates Impossible Travel Velocity Anomaly
   */
  public static evaluateImpossibleTravel(
    userId: string,
    currentPing: GeoLocationPing
  ): ImpossibleTravelCheckResult {
    const previousPing = this.userLastLocations.get(userId);

    // Update location for next check
    this.userLastLocations.set(userId, currentPing);

    if (!previousPing) {
      return {
        isAnomaly: false,
        distanceKm: 0,
        timeElapsedHours: 0,
        calculatedSpeedKmh: 0,
        maxFeasibleSpeedKmh: this.MAX_COMMERCIAL_FLIGHT_SPEED_KMH,
      };
    }

    const distanceKm = this.haversineDistanceKm(
      previousPing.latitude,
      previousPing.longitude,
      currentPing.latitude,
      currentPing.longitude
    );

    const timeElapsedHours = Math.max(0.001, (currentPing.timestamp - previousPing.timestamp) / (1000 * 3600));
    const calculatedSpeedKmh = distanceKm / timeElapsedHours;

    if (calculatedSpeedKmh > this.MAX_COMMERCIAL_FLIGHT_SPEED_KMH && distanceKm > 300) {
      return {
        isAnomaly: true,
        distanceKm: Math.round(distanceKm),
        timeElapsedHours: Number(timeElapsedHours.toFixed(2)),
        calculatedSpeedKmh: Math.round(calculatedSpeedKmh),
        maxFeasibleSpeedKmh: this.MAX_COMMERCIAL_FLIGHT_SPEED_KMH,
        reason: `Traveled ${Math.round(distanceKm)} km in ${timeElapsedHours.toFixed(1)} hrs (${Math.round(calculatedSpeedKmh)} km/h), exceeding max commercial flight velocity.`,
      };
    }

    return {
      isAnomaly: false,
      distanceKm: Math.round(distanceKm),
      timeElapsedHours: Number(timeElapsedHours.toFixed(2)),
      calculatedSpeedKmh: Math.round(calculatedSpeedKmh),
      maxFeasibleSpeedKmh: this.MAX_COMMERCIAL_FLIGHT_SPEED_KMH,
    };
  }

  /**
   * Log Security Event with automatic Merkle chaining
   */
  public static recordSecurityEvent(event: Omit<SecurityEventRecord, 'id' | 'merkleLeafHash'>): SecurityEventRecord {
    const id = `sec-${CryptoEngine.generateUuid()}`;
    const hashPayload = `${id}:${event.eventType}:${event.principalEmail}:${event.timestamp}`;
    const leafHash = CryptoEngine.sha256Hex(hashPayload);

    const record: SecurityEventRecord = {
      ...event,
      id,
      merkleLeafHash: leafHash,
    };

    this.eventLog.unshift(record);
    if (this.eventLog.length > 500) {
      this.eventLog.pop();
    }

    // Auto-containment for critical threats
    if (record.threatLevel === 'CRITICAL' || record.eventType === 'AUTH_IMPOSSIBLE_TRAVEL') {
      this.blockedIpAddresses.add(record.ipAddress);
      logger.warn('CONTAINMENT_TRIGGERED', `Automatically blacklisted IP ${record.ipAddress} due to ${record.eventType}`);
    }

    this.rebuildMerkleTree();
    return record;
  }

  /**
   * Rebuilds SHA-256 binary Merkle Tree over event log
   */
  public static rebuildMerkleTree(): string {
    if (this.eventLog.length === 0) {
      return '0000000000000000000000000000000000000000000000000000000000000000';
    }

    let currentLevel: string[] = this.eventLog.map((e) => e.merkleLeafHash);

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        const combined = CryptoEngine.sha256Hex(left + right);
        nextLevel.push(combined);
      }
      currentLevel = nextLevel;
    }

    const rootHash = currentLevel[0];
    this.merkleRootHistory.push({
      rootHash,
      timestamp: new Date().toISOString(),
      leafCount: this.eventLog.length,
    });

    return rootHash;
  }

  public static getLatestMerkleRoot(): string {
    const latest = this.merkleRootHistory[this.merkleRootHistory.length - 1];
    return latest ? latest.rootHash : '0000000000000000000000000000000000000000000000000000000000000000';
  }

  public static getSecurityEvents(filterThreat?: SecurityThreatLevel): SecurityEventRecord[] {
    if (!filterThreat) return this.eventLog;
    return this.eventLog.filter((e) => e.threatLevel === filterThreat);
  }

  public static getBlockedIps(): string[] {
    return Array.from(this.blockedIpAddresses);
  }

  public static isIpBlocked(ip: string): boolean {
    return this.blockedIpAddresses.has(ip);
  }

  public static unblockIp(ip: string): boolean {
    return this.blockedIpAddresses.delete(ip);
  }

  public static getThreatMetrics() {
    const total = this.eventLog.length;
    const critical = this.eventLog.filter((e) => e.threatLevel === 'CRITICAL').length;
    const high = this.eventLog.filter((e) => e.threatLevel === 'HIGH').length;
    const medium = this.eventLog.filter((e) => e.threatLevel === 'MEDIUM').length;
    const low = this.eventLog.filter((e) => e.threatLevel === 'LOW').length;

    return {
      totalEvents: total,
      criticalEvents: critical,
      highEvents: high,
      mediumEvents: medium,
      lowEvents: low,
      blockedIpsCount: this.blockedIpAddresses.size,
      latestMerkleRoot: this.getLatestMerkleRoot(),
    };
  }
}
