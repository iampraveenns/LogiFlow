/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Real-Time Telematics & Geofencing Engine
 * Handles high-frequency GPS pings, polygon/radial geofence containment, OBD-II DTC decoding, and cold chain breach detection.
 */

import { TelematicsPing, GeofenceZone, OBD2DiagnosticCode } from '../../packages/shared-types/index.ts';
import { RouteOptimizationService } from './routeOptimizationService.ts';
import { DTC_REGISTRY } from '../constants/index.ts';
import { logger } from '../../packages/logger/index.ts';

export interface GeofenceEvaluationResult {
  zoneId: string;
  zoneName: string;
  isInside: boolean;
  eventTriggered?: 'ENTER' | 'EXIT' | 'SPEEDING';
  currentSpeedKmh: number;
  speedLimitKmh: number;
}

export class TelematicsService {
  /**
   * Determine whether a coordinate is inside a circular or polygon geofence
   */
  public static evaluateGeofence(
    coords: [number, number],
    speedKmh: number,
    zone: GeofenceZone,
    previousInside: boolean = false
  ): GeofenceEvaluationResult {
    let isInside = false;

    if (zone.polygon && zone.polygon.length >= 3) {
      // Ray-casting algorithm for arbitrary polygonal geofences
      isInside = this.pointInPolygon(coords, zone.polygon);
    } else {
      // Radial distance comparison
      const distKm = RouteOptimizationService.haversineDistanceKm(coords, zone.center);
      isInside = distKm <= zone.radiusKm;
    }

    let eventTriggered: 'ENTER' | 'EXIT' | 'SPEEDING' | undefined;

    if (isInside && !previousInside && zone.alertOnEntry) {
      eventTriggered = 'ENTER';
      logger.info('GEOFENCE', `Vehicle entered zone ${zone.name} (${zone.id})`);
    } else if (!isInside && previousInside && zone.alertOnExit) {
      eventTriggered = 'EXIT';
      logger.warn('GEOFENCE', `Vehicle departed zone ${zone.name} (${zone.id})`);
    } else if (isInside && speedKmh > zone.speedLimitKmh) {
      eventTriggered = 'SPEEDING';
      logger.warn('GEOFENCE', `Speeding violation in ${zone.name}: ${speedKmh} km/h (Limit: ${zone.speedLimitKmh})`);
    }

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      isInside,
      eventTriggered,
      currentSpeedKmh: speedKmh,
      speedLimitKmh: zone.speedLimitKmh,
    };
  }

  /**
   * Ray-casting algorithm to test whether a coordinate point [lat, lng] lies inside a polygon
   */
  public static pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Decode OBD-II / J1939 telematics diagnostic trouble code
   */
  public static decodeDtcCode(code: string): OBD2DiagnosticCode {
    const registered = DTC_REGISTRY[code];
    if (registered) {
      return {
        code,
        severity: registered.severity,
        system: registered.system as any,
        description: registered.description,
        timestamp: new Date().toISOString(),
      };
    }

    // Default unknown code fallback
    return {
      code,
      severity: 'WARNING',
      system: 'ENGINE',
      description: `Unregistered Telematics DTC fault ${code}. Diagnostic inspection required.`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Analyze telematics ping for harsh braking, rapid acceleration, and cold chain temperature anomalies
   */
  public static analyzePing(ping: TelematicsPing, tempThresholdCelsius?: { min: number; max: number }): {
    anomalies: string[];
    riskScore: number;
  } {
    const anomalies: string[] = [];
    let riskScore = 0;

    if (ping.harshBrakingDetected) {
      anomalies.push('Harsh Braking Event: Deceleration exceeded -12 km/h/sec.');
      riskScore += 25;
    }

    if (ping.rapidAccelerationDetected) {
      anomalies.push('Rapid Acceleration Event: Fuel surge and aggressive throttle detected.');
      riskScore += 15;
    }

    if (ping.engineTemperatureCelsius > 105) {
      anomalies.push(`Engine Coolant Temperature High: ${ping.engineTemperatureCelsius}°C (Threshold 105°C).`);
      riskScore += 40;
    }

    if (tempThresholdCelsius && ping.cargoTemperatureCelsius !== undefined) {
      if (ping.cargoTemperatureCelsius < tempThresholdCelsius.min) {
        anomalies.push(`Cold Chain Undercooling: ${ping.cargoTemperatureCelsius}°C is below minimum ${tempThresholdCelsius.min}°C.`);
        riskScore += 50;
      } else if (ping.cargoTemperatureCelsius > tempThresholdCelsius.max) {
        anomalies.push(`Cold Chain Temp Breach: ${ping.cargoTemperatureCelsius}°C exceeds maximum safe limit ${tempThresholdCelsius.max}°C.`);
        riskScore += 60;
      }
    }

    if (ping.dtcCodes.length > 0) {
      const hasCritical = ping.dtcCodes.some((d) => d.severity === 'CRITICAL');
      riskScore += hasCritical ? 45 : 20;
      anomalies.push(`Active OBD-II Fault Codes: ${ping.dtcCodes.map((d) => d.code).join(', ')}.`);
    }

    return {
      anomalies,
      riskScore: Math.min(100, riskScore),
    };
  }
}
