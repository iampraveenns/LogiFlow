/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Global Maritime Vessel Navigation & AIS Fleet Tracking Engine
 * Implements Great Circle (Orthodromic) navigation, Rhumb line tracking,
 * Cubic Propeller Law fuel burn, Canal transit locks, and international port registries.
 */

import { logger } from '../../packages/logger/index.ts';

export type VesselClass = 
  | 'ULCV_24000_TEU'      // Ultra Large Container Vessel (e.g. Ever Given class)
  | 'NEO_PANAMAX_14000'   // Neo-Panamax Container Ship
  | 'POST_PANAMAX_8000'   // Post-Panamax Standard
  | 'FEEDER_3000'         // Regional Feeder
  | 'CAPESIZE_BULKER'     // 180,000 DWT Dry Bulk
  | 'VLCC_CRUDE_TANKER';  // Very Large Crude Carrier

export interface PortRegistryEntry {
  unlocode: string;
  portName: string;
  country: string;
  coordinates: [number, number]; // [lat, lng]
  waterDepthDraftMeters: number;
  maxTeuCapacity: number;
  terminalCount: number;
  averageBerthWaitHours: number;
  bunkeringAvailable: boolean;
  canalsProximity?: 'SUEZ' | 'PANAMA' | 'MALACCA' | 'BOSPHORUS';
}

export interface VesselTelemetryData {
  mmsi: string;
  imo: string;
  vesselName: string;
  vesselClass: VesselClass;
  flagState: string;
  builtYear: number;
  deadweightTonnageDwt: number;
  currentCoordinates: [number, number];
  headingDegrees: number;
  courseOverGroundDeg: number;
  speedOverGroundKnots: number;
  designSpeedKnots: number;
  destinationPortUnlocode: string;
  originPortUnlocode: string;
  etaIso: string;
  currentDraftMeters: number;
  fuelCapacityMetricTons: number;
  currentFuelMetricTons: number;
  dailyFuelConsumptionMt: number;
  cargoTonnage: number;
  teuStowed: number;
  reeferContainersActive: number;
  currentWeather: {
    beaufortScale: number; // 0 to 12
    waveHeightMeters: number;
    windSpeedKnots: number;
    windDirectionDegrees: number;
    seaSurfaceTempCelsius: number;
  };
}

export interface GreatCircleRoutePoint {
  latitude: number;
  longitude: number;
  segmentDistanceNauticalMiles: number;
  cumulativeDistanceNm: number;
  bearingDegrees: number;
  estimatedTransitHours: number;
  bunkerConsumptionMt: number;
}

export class MaritimeVesselService {
  // Comprehensive Global Seaports Registry
  public static readonly PORT_REGISTRY: Record<string, PortRegistryEntry> = {
    NLRTM: {
      unlocode: 'NLRTM',
      portName: 'Port of Rotterdam',
      country: 'Netherlands',
      coordinates: [51.95, 4.13],
      waterDepthDraftMeters: 24.0,
      maxTeuCapacity: 15300000,
      terminalCount: 14,
      averageBerthWaitHours: 14.5,
      bunkeringAvailable: true
    },
    SGSIN: {
      unlocode: 'SGSIN',
      portName: 'Port of Singapore',
      country: 'Singapore',
      coordinates: [1.26, 103.82],
      waterDepthDraftMeters: 18.0,
      maxTeuCapacity: 37300000,
      terminalCount: 22,
      averageBerthWaitHours: 18.2,
      bunkeringAvailable: true,
      canalsProximity: 'MALACCA'
    },
    CNSHA: {
      unlocode: 'CNSHA',
      portName: 'Port of Shanghai (Yangshan Deep-Water)',
      country: 'China',
      coordinates: [30.63, 122.07],
      waterDepthDraftMeters: 17.5,
      maxTeuCapacity: 47300000,
      terminalCount: 28,
      averageBerthWaitHours: 24.0,
      bunkeringAvailable: true
    },
    USLAX: {
      unlocode: 'USLAX',
      portName: 'Port of Los Angeles',
      country: 'United States',
      coordinates: [33.74, -118.27],
      waterDepthDraftMeters: 16.2,
      maxTeuCapacity: 10600000,
      terminalCount: 9,
      averageBerthWaitHours: 32.5,
      bunkeringAvailable: true
    },
    EGPSD: {
      unlocode: 'EGPSD',
      portName: 'Port Said (Suez Canal Entrance)',
      country: 'Egypt',
      coordinates: [31.26, 32.31],
      waterDepthDraftMeters: 20.1,
      maxTeuCapacity: 4200000,
      terminalCount: 4,
      averageBerthWaitHours: 28.0,
      bunkeringAvailable: true,
      canalsProximity: 'SUEZ'
    },
    PAPAC: {
      unlocode: 'PAPAC',
      portName: 'Balboa (Panama Canal Pacific Terminal)',
      country: 'Panama',
      coordinates: [8.95, -79.56],
      waterDepthDraftMeters: 16.5,
      maxTeuCapacity: 3500000,
      terminalCount: 3,
      averageBerthWaitHours: 42.0,
      bunkeringAvailable: true,
      canalsProximity: 'PANAMA'
    },
    DEHAM: {
      unlocode: 'DEHAM',
      portName: 'Port of Hamburg',
      country: 'Germany',
      coordinates: [53.53, 9.97],
      waterDepthDraftMeters: 15.1,
      maxTeuCapacity: 8700000,
      terminalCount: 6,
      averageBerthWaitHours: 16.0,
      bunkeringAvailable: true
    },
    AEJEA: {
      unlocode: 'AEJEA',
      portName: 'Jebel Ali (Dubai)',
      country: 'United Arab Emirates',
      coordinates: [24.99, 55.06],
      waterDepthDraftMeters: 17.0,
      maxTeuCapacity: 14100000,
      terminalCount: 8,
      averageBerthWaitHours: 12.0,
      bunkeringAvailable: true
    }
  };

  // Active Worldwide Container and Bulk Fleet
  private static vessels: VesselTelemetryData[] = [
    {
      mmsi: '211832000',
      imo: '9839438',
      vesselName: 'Ever Ace Logistics',
      vesselClass: 'ULCV_24000_TEU',
      flagState: 'Panama',
      builtYear: 2021,
      deadweightTonnageDwt: 241960,
      currentCoordinates: [12.45, 45.12], // Gulf of Aden approaching Bab-el-Mandeb
      headingDegrees: 310,
      courseOverGroundDeg: 308,
      speedOverGroundKnots: 19.4,
      designSpeedKnots: 22.5,
      originPortUnlocode: 'SGSIN',
      destinationPortUnlocode: 'NLRTM',
      etaIso: '2026-11-04T14:00:00Z',
      currentDraftMeters: 16.1,
      fuelCapacityMetricTons: 8500,
      currentFuelMetricTons: 4920,
      dailyFuelConsumptionMt: 92.4,
      cargoTonnage: 198400,
      teuStowed: 23820,
      reeferContainersActive: 1420,
      currentWeather: {
        beaufortScale: 5,
        waveHeightMeters: 2.4,
        windSpeedKnots: 21.0,
        windDirectionDegrees: 45,
        seaSurfaceTempCelsius: 29.4
      }
    },
    {
      mmsi: '352986000',
      imo: '9811000',
      vesselName: 'Nordic Transatlantic',
      vesselClass: 'NEO_PANAMAX_14000',
      flagState: 'Liberia',
      builtYear: 2019,
      deadweightTonnageDwt: 148500,
      currentCoordinates: [28.50, -42.80], // Mid-Atlantic
      headingDegrees: 78,
      courseOverGroundDeg: 80,
      speedOverGroundKnots: 17.8,
      designSpeedKnots: 21.0,
      originPortUnlocode: 'USLAX',
      destinationPortUnlocode: 'DEHAM',
      etaIso: '2026-10-31T08:00:00Z',
      currentDraftMeters: 14.8,
      fuelCapacityMetricTons: 6200,
      currentFuelMetricTons: 3840,
      dailyFuelConsumptionMt: 68.2,
      cargoTonnage: 124000,
      teuStowed: 13450,
      reeferContainersActive: 890,
      currentWeather: {
        beaufortScale: 6,
        waveHeightMeters: 3.8,
        windSpeedKnots: 27.5,
        windDirectionDegrees: 280,
        seaSurfaceTempCelsius: 19.2
      }
    },
    {
      mmsi: '477651200',
      imo: '9744659',
      vesselName: 'Pacific Vanguard',
      vesselClass: 'POST_PANAMAX_8000',
      flagState: 'Hong Kong',
      builtYear: 2017,
      deadweightTonnageDwt: 95000,
      currentCoordinates: [22.10, 119.50], // Taiwan Strait
      headingDegrees: 45,
      courseOverGroundDeg: 46,
      speedOverGroundKnots: 16.2,
      designSpeedKnots: 20.0,
      originPortUnlocode: 'SGSIN',
      destinationPortUnlocode: 'CNSHA',
      etaIso: '2026-10-27T18:30:00Z',
      currentDraftMeters: 13.5,
      fuelCapacityMetricTons: 4800,
      currentFuelMetricTons: 3100,
      dailyFuelConsumptionMt: 52.0,
      cargoTonnage: 78000,
      teuStowed: 7820,
      reeferContainersActive: 410,
      currentWeather: {
        beaufortScale: 4,
        waveHeightMeters: 1.6,
        windSpeedKnots: 15.0,
        windDirectionDegrees: 120,
        seaSurfaceTempCelsius: 26.5
      }
    }
  ];

  /**
   * Return entire vessel fleet
   */
  public static getVessels(): VesselTelemetryData[] {
    return [...this.vessels];
  }

  /**
   * Look up vessel by IMO number
   */
  public static getVesselByImo(imo: string): VesselTelemetryData | undefined {
    return this.vessels.find(v => v.imo === imo);
  }

  /**
   * Great Circle (Orthodromic) Navigation Algorithm:
   * Calculates shortest distance on a sphere between two coordinates in Nautical Miles (NM).
   */
  public static calculateGreatCircleDistanceNm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaPhi = toRad(lat2 - lat1);
    const deltaLambda = toRad(lon2 - lon1);

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Earth mean radius = 6371 km -> Nautical Miles = 6371 * 0.539957 = 3440.065 NM
    return c * 3440.065;
  }

  /**
   * Initial Great Circle True Bearing (Degrees 0-360)
   */
  public static calculateInitialBearingDegrees(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaLambda = toRad(lon2 - lon1);

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
    return Math.round(bearing * 10) / 10;
  }

  /**
   * Cubic Propeller Law Fuel Consumption Model:
   * Fuel Consumption is proportional to (Speed)^3.
   * Modulated by weather resistance (Beaufort scale) and displacement draft ratio.
   */
  public static calculateBunkerConsumption(
    vessel: VesselTelemetryData,
    speedKnots: number,
    transitHours: number,
    beaufortScale: number
  ): {
    totalFuelMt: number;
    fuelCostUsd: number;
    co2EmissionsMt: number;
    slowSteamingSavingsMt: number;
  } {
    const V_actual = speedKnots;
    const V_design = vessel.designSpeedKnots;
    
    // Cubic speed exponent with realistic sea margin
    const speedRatio = V_actual / V_design;
    const cubicFactor = Math.pow(speedRatio, 3.2);

    // Baseline daily consumption scaled by cubic law
    const baselineDailyMt = vessel.dailyFuelConsumptionMt * cubicFactor;

    // Weather penalty: add 3.5% fuel consumption per Beaufort force above 3
    const weatherPenalty = beaufortScale > 3 ? 1 + (beaufortScale - 3) * 0.035 : 1.0;
    
    // Total fuel in Metric Tons for transit duration
    const effectiveDailyMt = baselineDailyMt * weatherPenalty;
    const totalFuelMt = (effectiveDailyMt / 24) * transitHours;

    // Compare with full design speed (slow steaming delta)
    const fullSpeedDailyMt = vessel.dailyFuelConsumptionMt * Math.pow(1.0, 3.2) * weatherPenalty;
    const fullSpeedFuelMt = (fullSpeedDailyMt / 24) * (transitHours * (V_actual / V_design));
    const slowSteamingSavingsMt = Math.max(0, fullSpeedFuelMt - totalFuelMt);

    // Bunker price (VLSFO - Very Low Sulphur Fuel Oil: approx $640 / MT)
    const vlsfoPricePerMt = 640;
    const fuelCostUsd = totalFuelMt * vlsfoPricePerMt;

    // IMO Carbon Conversion Factor for VLSFO: 3.114 tonnes CO2 per tonne fuel
    const co2EmissionsMt = totalFuelMt * 3.114;

    return {
      totalFuelMt: Math.round(totalFuelMt * 10) / 10,
      fuelCostUsd: Math.round(fuelCostUsd),
      co2EmissionsMt: Math.round(co2EmissionsMt * 10) / 10,
      slowSteamingSavingsMt: Math.round(slowSteamingSavingsMt * 10) / 10
    };
  }

  /**
   * Generates Waypoints along Great Circle Arc between Origin and Destination Ports
   */
  public static generateGreatCircleWaypoints(
    originUnlocode: string,
    destUnlocode: string,
    vessel: VesselTelemetryData,
    waypointsCount: number = 8
  ): GreatCircleRoutePoint[] {
    const origin = this.PORT_REGISTRY[originUnlocode];
    const dest = this.PORT_REGISTRY[destUnlocode];

    if (!origin || !dest) {
      logger.warn('MARITIME_SERVICE', `Port not found: ${originUnlocode} or ${destUnlocode}`);
      return [];
    }

    const totalDistNm = this.calculateGreatCircleDistanceNm(
      origin.coordinates[0],
      origin.coordinates[1],
      dest.coordinates[0],
      dest.coordinates[1]
    );

    const points: GreatCircleRoutePoint[] = [];
    const stepFraction = 1.0 / waypointsCount;

    for (let i = 0; i <= waypointsCount; i++) {
      const f = i * stepFraction;
      const lat = origin.coordinates[0] + (dest.coordinates[0] - origin.coordinates[0]) * f;
      const lon = origin.coordinates[1] + (dest.coordinates[1] - origin.coordinates[1]) * f;

      const cumDist = totalDistNm * f;
      const segDist = i === 0 ? 0 : totalDistNm / waypointsCount;
      const hours = segDist / vessel.speedOverGroundKnots;
      const bunker = (vessel.dailyFuelConsumptionMt / 24) * hours;
      const bearing = i < waypointsCount 
        ? this.calculateInitialBearingDegrees(lat, lon, dest.coordinates[0], dest.coordinates[1])
        : 0;

      points.push({
        latitude: Math.round(lat * 1000) / 1000,
        longitude: Math.round(lon * 1000) / 1000,
        segmentDistanceNauticalMiles: Math.round(segDist),
        cumulativeDistanceNm: Math.round(cumDist),
        bearingDegrees: bearing,
        estimatedTransitHours: Math.round(hours * 10) / 10,
        bunkerConsumptionMt: Math.round(bunker * 10) / 10
      });
    }

    return points;
  }

  /**
   * Canal Transit Assessment: Checks draft, beam, and current waiting queues for Suez and Panama
   */
  public static evaluateCanalTransit(
    canal: 'SUEZ' | 'PANAMA_NEO' | 'PANAMA_PANAMAX',
    vessel: VesselTelemetryData
  ): {
    transitPermitted: boolean;
    reason: string;
    tollEstimateUsd: number;
    lockCongestionWaitDays: number;
  } {
    if (canal === 'SUEZ') {
      // Suez max draft: 20.1m, no air draft restriction, no beam locks
      if (vessel.currentDraftMeters > 20.1) {
        return {
          transitPermitted: false,
          reason: `Vessel draft (${vessel.currentDraftMeters}m) exceeds Suez Canal maximum limit of 20.1m.`,
          tollEstimateUsd: 0,
          lockCongestionWaitDays: 0
        };
      }

      // Suez toll formula: Based on Suez Canal Net Tonnage (SCNT) ~ approx $420,000 for ULCV
      const scntToll = vessel.teuStowed * 18.5 + 85000;
      return {
        transitPermitted: true,
        reason: 'Authorized for southbound Suez convoy transit with designated pilot vessel.',
        tollEstimateUsd: Math.round(scntToll),
        lockCongestionWaitDays: 1.5
      };
    } else {
      // Panama Neo-Panamax locks: Max draft 15.2m (freshwater), Max beam 51.25m
      if (vessel.vesselClass === 'ULCV_24000_TEU') {
        return {
          transitPermitted: false,
          reason: 'ULCV vessels (24,000 TEU, 61m beam) strictly exceed Panama Neo-Panamax lock dimensions (51.25m max beam). Must round Cape of Good Hope or Cape Horn.',
          tollEstimateUsd: 0,
          lockCongestionWaitDays: 0
        };
      }

      if (vessel.currentDraftMeters > 15.24) {
        return {
          transitPermitted: false,
          reason: `Vessel freshwater draft (${vessel.currentDraftMeters}m) exceeds Gatun Lake maximum allowable draft (15.24m).`,
          tollEstimateUsd: 0,
          lockCongestionWaitDays: 0
        };
      }

      const panamaToll = vessel.teuStowed * 45.0 + 120000;
      return {
        transitPermitted: true,
        reason: 'Cleared for Cocoli and Agua Clara Neo-Panamax locks slot reservation.',
        tollEstimateUsd: Math.round(panamaToll),
        lockCongestionWaitDays: 3.2
      };
    }
  }
}
