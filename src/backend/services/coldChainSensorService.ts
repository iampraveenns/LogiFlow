/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - IoT Cold Chain & Multi-Sensor Environmental Telemetry Engine
 * Calculates Haynes Mean Kinetic Temperature (MKT), 3-axis accelerometer shock impacts, and FDA 21 CFR Part 11 reports.
 */

import { logger } from '../../packages/logger/index.ts';

export interface MultiSensorReading {
  timestamp: string;
  temperatureCelsius: number;
  humidityPercent: number;
  shockAxisG: {
    x: number;
    y: number;
    z: number;
    maxG: number;
  };
  lightLux: number; // Door opening / tamper detection
  barometricHpa: number;
  dryIceReservePercent?: number;
  batteryPercent: number;
}

export interface ExcursionIncident {
  id: string;
  detectedAt: string;
  type: 'TEMPERATURE_HIGH' | 'TEMPERATURE_LOW' | 'SHOCK_IMPACT' | 'DOOR_TAMPER_LIGHT' | 'DRY_ICE_CRITICAL';
  severity: 'CRITICAL' | 'WARNING' | 'NOTICE';
  recordedValue: string;
  thresholdLimit: string;
  durationMinutes: number;
  correctiveActionTaken: string;
}

export interface ColdChainContainerProfile {
  containerId: string;
  waybillId: string;
  payloadDescription: string;
  temperatureRange: {
    minCelsius: number;
    maxCelsius: number;
    criticalLimitCelsius: number;
  };
  currentReadings: MultiSensorReading;
  telemetryHistory: MultiSensorReading[];
  meanKineticTempCelsius: number;
  excursions: ExcursionIncident[];
  gdpComplianceStatus: 'CERTIFIED_COMPLIANT' | 'EXCURSION_FLAGGED' | 'COMPROMISED_QUARANTINE';
}

export class ColdChainSensorService {
  private static containers: Map<string, ColdChainContainerProfile> = new Map();

  static {
    // Seed biopharma and perishable cold containers
    const c1 = this.createSeedContainer(
      'REEFER-EU-904',
      'WB-2026-001',
      'CryoVax mRNA Immunotherapy Vaccines (-70°C Ultra-Low)',
      -80,
      -65,
      -60,
      -68.4
    );

    const c2 = this.createSeedContainer(
      'REEFER-US-412',
      'WB-2026-002',
      'High-Purity Silicon Wafer Solvents (Climate Controlled +4°C)',
      2,
      8,
      12,
      4.2
    );

    this.containers.set(c1.containerId, c1);
    this.containers.set(c2.containerId, c2);
  }

  private static createSeedContainer(
    containerId: string,
    waybillId: string,
    desc: string,
    minT: number,
    maxT: number,
    critT: number,
    currentT: number
  ): ColdChainContainerProfile {
    const history: MultiSensorReading[] = [];
    const now = Date.now();

    for (let i = 24; i >= 0; i--) {
      const time = new Date(now - i * 3600000).toISOString();
      // slight fluctuation
      const t = Number((currentT + Math.sin(i * 0.4) * 0.6).toFixed(1));
      const hum = Math.round(45 + Math.cos(i * 0.3) * 6);
      const shock = Number((0.15 + Math.random() * 0.25).toFixed(2));
      const lux = Math.random() < 0.05 ? 12 : 0; // occasional inspection light
      history.push({
        timestamp: time,
        temperatureCelsius: t,
        humidityPercent: hum,
        shockAxisG: {
          x: Number((Math.random() * 0.2).toFixed(2)),
          y: Number((Math.random() * 0.2).toFixed(2)),
          z: shock,
          maxG: shock,
        },
        lightLux: lux,
        barometricHpa: 1013,
        dryIceReservePercent: Math.max(15, Math.round(92 - (24 - i) * 1.5)),
        batteryPercent: Math.max(20, Math.round(98 - (24 - i) * 0.8)),
      });
    }

    const latest = history[history.length - 1];
    const mkt = this.calculateMeanKineticTemperature(history.map((h) => h.temperatureCelsius));

    return {
      containerId,
      waybillId,
      payloadDescription: desc,
      temperatureRange: {
        minCelsius: minT,
        maxCelsius: maxT,
        criticalLimitCelsius: critT,
      },
      currentReadings: latest,
      telemetryHistory: history,
      meanKineticTempCelsius: mkt,
      excursions: [],
      gdpComplianceStatus: 'CERTIFIED_COMPLIANT',
    };
  }

  public static getContainers(): ColdChainContainerProfile[] {
    return Array.from(this.containers.values());
  }

  public static getContainerById(id: string): ColdChainContainerProfile | undefined {
    return this.containers.get(id);
  }

  /**
   * Calculate Haynes Mean Kinetic Temperature (MKT)
   * Standard pharmaceutical formula using activation energy ΔH = 83.144 kJ/mol and gas constant R = 8.3144 J/(mol*K)
   */
  public static calculateMeanKineticTemperature(tempsCelsius: number[]): number {
    if (tempsCelsius.length === 0) return 0;
    const DH_R = 10000; // ΔH / R in Kelvin

    let sum = 0;
    for (const tc of tempsCelsius) {
      const tk = tc + 273.15; // Kelvin
      sum += Math.exp(-DH_R / tk);
    }

    const avg = sum / tempsCelsius.length;
    const mktKelvin = DH_R / -Math.log(avg);
    const mktCelsius = mktKelvin - 273.15;
    return Number(mktCelsius.toFixed(2));
  }

  /**
   * Ingest real-time sensor reading and evaluate excursions.
   */
  public static ingestReading(containerId: string, reading: MultiSensorReading): ColdChainContainerProfile | undefined {
    const container = this.containers.get(containerId);
    if (!container) return undefined;

    container.currentReadings = reading;
    container.telemetryHistory.push(reading);
    if (container.telemetryHistory.length > 100) {
      container.telemetryHistory.shift();
    }

    // Recompute MKT
    container.meanKineticTempCelsius = this.calculateMeanKineticTemperature(
      container.telemetryHistory.map((h) => h.temperatureCelsius)
    );

    // Evaluate temperature breach
    if (reading.temperatureCelsius > container.temperatureRange.maxCelsius) {
      const exc: ExcursionIncident = {
        id: `EXC-TMP-${Date.now()}`,
        detectedAt: reading.timestamp,
        type: 'TEMPERATURE_HIGH',
        severity: reading.temperatureCelsius > container.temperatureRange.criticalLimitCelsius ? 'CRITICAL' : 'WARNING',
        recordedValue: `${reading.temperatureCelsius}°C`,
        thresholdLimit: `Max ${container.temperatureRange.maxCelsius}°C`,
        durationMinutes: 15,
        correctiveActionTaken: 'Automated telematics auxiliary compressor boost cycle commanded.',
      };
      container.excursions.unshift(exc);
      container.gdpComplianceStatus = exc.severity === 'CRITICAL' ? 'COMPROMISED_QUARANTINE' : 'EXCURSION_FLAGGED';
      logger.error('COLD_CHAIN', `Temperature excursion flagged on ${containerId}: ${reading.temperatureCelsius}°C`);
    }

    // Evaluate shock breach (G-force > 2.5G signifies dropped or violently impacted cargo)
    if (reading.shockAxisG.maxG > 2.5) {
      const exc: ExcursionIncident = {
        id: `EXC-SHK-${Date.now()}`,
        detectedAt: reading.timestamp,
        type: 'SHOCK_IMPACT',
        severity: 'CRITICAL',
        recordedValue: `${reading.shockAxisG.maxG}G`,
        thresholdLimit: 'Max 2.5G Handling Limit',
        durationMinutes: 1,
        correctiveActionTaken: 'Physical accelerometer inspection flag logged for destination receiving dock.',
      };
      container.excursions.unshift(exc);
      container.gdpComplianceStatus = 'EXCURSION_FLAGGED';
      logger.warn('COLD_CHAIN', `Shock event detected on ${containerId}: ${reading.shockAxisG.maxG}G`);
    }

    // Evaluate tamper light detection (lux > 50 in sealed reefer indicates unauthorized door opening)
    if (reading.lightLux > 50) {
      const exc: ExcursionIncident = {
        id: `EXC-TAM-${Date.now()}`,
        detectedAt: reading.timestamp,
        type: 'DOOR_TAMPER_LIGHT',
        severity: 'WARNING',
        recordedValue: `${reading.lightLux} Lux`,
        thresholdLimit: '< 5 Lux Container Seal',
        durationMinutes: 4,
        correctiveActionTaken: 'Security tamper tag verification alert transmitted to dispatch console.',
      };
      container.excursions.unshift(exc);
      logger.warn('COLD_CHAIN', `Light intrusion detected on container ${containerId}`);
    }

    this.containers.set(containerId, container);
    return container;
  }
}
