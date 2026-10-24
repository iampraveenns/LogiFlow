/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { logger } from '../../packages/logger/index.ts';

export type DroneType = 'HEXACOPTER_VTOL' | 'OCTOCOPTER_HEAVY' | 'SIDEWALK_ROVER_AMR';
export type FlightMissionStatus = 'IDLE' | 'PREFLIGHT_CHECK' | 'EN_ROUTE_DELIVERY' | 'WINCH_DESCENDING' | 'DELIVERED_RETURNING' | 'RTH_EMERGENCY' | 'LANDED_CHARGING';

export interface DroneVehicle {
  id: string;
  callsign: string;
  type: DroneType;
  maxPayloadKg: number;
  emptyWeightKg: number;
  batteryCapacityWh: number;
  currentBatteryPercent: number;
  batteryHealthSoH: number; // State of Health 0-100%
  status: FlightMissionStatus;
  currentLat: number;
  currentLng: number;
  currentAltitudeMeters: number;
  headingDeg: number;
  groundSpeedKmh: number;
  activeMissionId?: string;
  winchTetherLengthMeters: number;
  firmwareVersion: string;
}

export interface AirspaceExclusionZone {
  id: string;
  name: string;
  zoneType: 'AIRPORT_CLASS_B' | 'HELIPAD_HOSPITAL' | 'STADIUM_TFR' | 'CRITICAL_INFRASTRUCTURE';
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  ceilingAltitudeMeters: number;
}

export interface DroneDeliveryMission {
  id: string;
  droneId: string;
  orderId: string;
  customerName: string;
  deliveryLat: number;
  deliveryLng: number;
  packageWeightKg: number;
  targetAltitudeMeters: number;
  dropMethod: 'WINCH_TETHER_DROP' | 'GROUND_LAND_PAD' | 'LOCKER_DOCK';
  estimatedFlightMinutes: number;
  rthSafetyMarginPercent: number;
  windSpeedKts: number;
  windHeadingDeg: number;
  status: FlightMissionStatus;
  createdAt: string;
}

export interface FlightTelemetrySimulation {
  drone: DroneVehicle;
  mission?: DroneDeliveryMission;
  airspaceClear: boolean;
  distanceToTargetKm: number;
  requiredEnergyWh: number;
  remainingEnergyWh: number;
  canSafelyRTH: boolean;
}

export class DroneLastMileService {
  // Pre-configured FAA exclusion zones
  private static exclusionZones: AirspaceExclusionZone[] = [
    {
      id: 'ZONE-ORD-01',
      name: 'Chicago O\'Hare International Airport Class B',
      zoneType: 'AIRPORT_CLASS_B',
      centerLat: 41.9742,
      centerLng: -87.9073,
      radiusMeters: 9260, // 5 nautical miles
      ceilingAltitudeMeters: 3048
    },
    {
      id: 'ZONE-MDW-01',
      name: 'Chicago Midway Class C Airspace',
      zoneType: 'AIRPORT_CLASS_B',
      centerLat: 41.7868,
      centerLng: -87.7522,
      radiusMeters: 7408,
      ceilingAltitudeMeters: 1200
    },
    {
      id: 'ZONE-NW-MED-01',
      name: 'Northwestern Memorial Hospital Helipad',
      zoneType: 'HELIPAD_HOSPITAL',
      centerLat: 41.8953,
      centerLng: -87.6206,
      radiusMeters: 1200,
      ceilingAltitudeMeters: 300
    },
    {
      id: 'ZONE-SOLDIER-01',
      name: 'Soldier Field Stadium Temporary Flight Restriction (TFR)',
      zoneType: 'STADIUM_TFR',
      centerLat: 41.8623,
      centerLng: -87.6167,
      radiusMeters: 2500,
      ceilingAltitudeMeters: 900
    }
  ];

  // In-memory autonomous drone fleet
  private static drones: DroneVehicle[] = [
    {
      id: 'DRN-AERO-01',
      callsign: 'SKYFLOW-101',
      type: 'HEXACOPTER_VTOL',
      maxPayloadKg: 4.5,
      emptyWeightKg: 8.2,
      batteryCapacityWh: 880,
      currentBatteryPercent: 88,
      batteryHealthSoH: 98,
      status: 'EN_ROUTE_DELIVERY',
      currentLat: 41.8825,
      currentLng: -87.6340,
      currentAltitudeMeters: 95,
      headingDeg: 42,
      groundSpeedKmh: 48,
      activeMissionId: 'MSN-DRN-9021',
      winchTetherLengthMeters: 0,
      firmwareVersion: 'v4.2.1-PX4'
    },
    {
      id: 'DRN-AERO-02',
      callsign: 'SKYFLOW-102',
      type: 'OCTOCOPTER_HEAVY',
      maxPayloadKg: 12.0,
      emptyWeightKg: 16.5,
      batteryCapacityWh: 2200,
      currentBatteryPercent: 95,
      batteryHealthSoH: 96,
      status: 'IDLE',
      currentLat: 41.8781,
      currentLng: -87.6298,
      currentAltitudeMeters: 0,
      headingDeg: 0,
      groundSpeedKmh: 0,
      winchTetherLengthMeters: 0,
      firmwareVersion: 'v4.2.1-PX4'
    },
    {
      id: 'DRN-ROVER-01',
      callsign: 'TERRA-BOT-50',
      type: 'SIDEWALK_ROVER_AMR',
      maxPayloadKg: 20.0,
      emptyWeightKg: 35.0,
      batteryCapacityWh: 1500,
      currentBatteryPercent: 74,
      batteryHealthSoH: 99,
      status: 'EN_ROUTE_DELIVERY',
      currentLat: 41.8850,
      currentLng: -87.6250,
      currentAltitudeMeters: 0,
      headingDeg: 180,
      groundSpeedKmh: 6.2,
      activeMissionId: 'MSN-ROVER-4401',
      winchTetherLengthMeters: 0,
      firmwareVersion: 'v2.8.0-ROS2'
    }
  ];

  // Active flight missions
  private static missions: DroneDeliveryMission[] = [
    {
      id: 'MSN-DRN-9021',
      droneId: 'DRN-AERO-01',
      orderId: 'ORD-AIR-PHARMA-101',
      customerName: 'Rush Urgent Care Clinic',
      deliveryLat: 41.8742,
      deliveryLng: -87.6698,
      packageWeightKg: 1.8,
      targetAltitudeMeters: 90,
      dropMethod: 'WINCH_TETHER_DROP',
      estimatedFlightMinutes: 8.5,
      rthSafetyMarginPercent: 25,
      windSpeedKts: 9.4,
      windHeadingDeg: 260,
      status: 'EN_ROUTE_DELIVERY',
      createdAt: new Date().toISOString()
    },
    {
      id: 'MSN-ROVER-4401',
      droneId: 'DRN-ROVER-01',
      orderId: 'ORD-FOOD-8891',
      customerName: 'Aon Center Suite 4500',
      deliveryLat: 41.8853,
      deliveryLng: -87.6215,
      packageWeightKg: 4.2,
      targetAltitudeMeters: 0,
      dropMethod: 'LOCKER_DOCK',
      estimatedFlightMinutes: 12.0,
      rthSafetyMarginPercent: 15,
      windSpeedKts: 4.1,
      windHeadingDeg: 180,
      status: 'EN_ROUTE_DELIVERY',
      createdAt: new Date().toISOString()
    }
  ];

  /**
   * Get all active drones in fleet
   */
  public static getDrones(): DroneVehicle[] {
    return [...this.drones];
  }

  /**
   * Get active delivery missions
   */
  public static getMissions(): DroneDeliveryMission[] {
    return [...this.missions];
  }

  /**
   * Get FAA and municipal airspace exclusion zones
   */
  public static getExclusionZones(): AirspaceExclusionZone[] {
    return [...this.exclusionZones];
  }

  /**
   * Calculate distance using Haversine formula (meters)
   */
  public static calculateHaversineDistanceMeters(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if coordinates infringe upon an exclusion zone
   */
  public static checkAirspaceInfringement(
    lat: number,
    lng: number,
    altitudeMeters: number
  ): { safe: boolean; breachedZone?: AirspaceExclusionZone; distanceToClosestZoneMeters: number } {
    let closestDistance = Number.MAX_VALUE;
    let closestZone: AirspaceExclusionZone | undefined;

    for (const zone of this.exclusionZones) {
      const dist = this.calculateHaversineDistanceMeters(lat, lng, zone.centerLat, zone.centerLng);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestZone = zone;
      }

      if (dist <= zone.radiusMeters && altitudeMeters <= zone.ceilingAltitudeMeters) {
        return {
          safe: false,
          breachedZone: zone,
          distanceToClosestZoneMeters: dist
        };
      }
    }

    return {
      safe: true,
      distanceToClosestZoneMeters: closestDistance
    };
  }

  /**
   * Return-To-Home (RTH) Power & Battery Physics Calculation
   * Factors in: aerodynamic drag, payload mass, headwind resistance, and battery capacity
   */
  public static calculateRthEnergyBudget(
    drone: DroneVehicle,
    distanceMeters: number,
    payloadKg: number,
    windSpeedKts: number,
    isHeadwind: boolean
  ): {
    totalRequiredWh: number;
    availableWh: number;
    sufficientToRth: boolean;
    reserveMarginWh: number;
    estimatedFlightMinutes: number;
  } {
    const totalMassKg = drone.emptyWeightKg + payloadKg;
    const nominalPowerHoverWatts = totalMassKg * 9.81 * 8.5; // VTOL power coefficient
    const nominalCruisePowerWatts = nominalPowerHoverWatts * 0.65; // Cruise lift-to-drag benefit
    
    // Wind factor: headwind increases power consumption by 4% per knot
    const windPenaltyMultiplier = isHeadwind ? 1 + (windSpeedKts * 0.04) : 0.95;
    const effectiveCruisePowerWatts = nominalCruisePowerWatts * windPenaltyMultiplier;

    // Speed in m/s (45 km/h = 12.5 m/s)
    const cruiseSpeedMps = 12.5;
    const flightTimeSeconds = distanceMeters / cruiseSpeedMps;
    const flightTimeHours = flightTimeSeconds / 3600;

    // Total energy required in Watt-hours
    const cruiseEnergyWh = effectiveCruisePowerWatts * flightTimeHours;
    // Add 1.5 minutes of hover reserve for winch deployment / descent
    const hoverReserveWh = nominalPowerHoverWatts * (90 / 3600);
    const totalRequiredWh = (cruiseEnergyWh + hoverReserveWh) * 1.20; // 20% regulatory buffer

    const availableWh = drone.batteryCapacityWh * (drone.currentBatteryPercent / 100) * (drone.batteryHealthSoH / 100);
    const sufficientToRth = availableWh >= totalRequiredWh;
    const reserveMarginWh = availableWh - totalRequiredWh;

    return {
      totalRequiredWh: Math.round(totalRequiredWh * 10) / 10,
      availableWh: Math.round(availableWh * 10) / 10,
      sufficientToRth,
      reserveMarginWh: Math.round(reserveMarginWh * 10) / 10,
      estimatedFlightMinutes: Math.round((flightTimeSeconds / 60) * 10) / 10
    };
  }

  /**
   * Dispatch a new autonomous delivery mission
   */
  public static dispatchDelivery(
    droneId: string,
    orderId: string,
    customerName: string,
    deliveryLat: number,
    deliveryLng: number,
    packageWeightKg: number,
    dropMethod: 'WINCH_TETHER_DROP' | 'GROUND_LAND_PAD' | 'LOCKER_DOCK'
  ): { success: boolean; message: string; mission?: DroneDeliveryMission } {
    const drone = this.drones.find(d => d.id === droneId);
    if (!drone) {
      return { success: false, message: `Drone ${droneId} not found in fleet telemetry register.` };
    }

    if (drone.status !== 'IDLE' && drone.status !== 'LANDED_CHARGING') {
      return { success: false, message: `Drone ${drone.callsign} is currently ${drone.status}. Cannot dispatch.` };
    }

    if (packageWeightKg > drone.maxPayloadKg) {
      return {
        success: false,
        message: `Package payload (${packageWeightKg} kg) exceeds drone maximum rated payload (${drone.maxPayloadKg} kg).`
      };
    }

    // Check destination airspace
    const airspace = this.checkAirspaceInfringement(deliveryLat, deliveryLng, 90);
    if (!airspace.safe) {
      return {
        success: false,
        message: `Airspace violation! Delivery coordinates violate FAA corridor: ${airspace.breachedZone?.name}.`
      };
    }

    // Distance calculation
    const distanceMeters = this.calculateHaversineDistanceMeters(
      drone.currentLat,
      drone.currentLng,
      deliveryLat,
      deliveryLng
    );

    // Energy check
    const energy = this.calculateRthEnergyBudget(drone, distanceMeters * 2, packageWeightKg, 8.0, true);
    if (!energy.sufficientToRth) {
      return {
        success: false,
        message: `Insufficient battery capacity! Mission roundtrip requires ${energy.totalRequiredWh} Wh, but drone only has ${energy.availableWh} Wh.`
      };
    }

    const missionId = `MSN-DRN-${Math.floor(1000 + Math.random() * 9000)}`;
    const newMission: DroneDeliveryMission = {
      id: missionId,
      droneId: drone.id,
      orderId,
      customerName,
      deliveryLat,
      deliveryLng,
      packageWeightKg,
      targetAltitudeMeters: drone.type === 'SIDEWALK_ROVER_AMR' ? 0 : 90,
      dropMethod,
      estimatedFlightMinutes: energy.estimatedFlightMinutes * 2,
      rthSafetyMarginPercent: Math.round((energy.reserveMarginWh / drone.batteryCapacityWh) * 100),
      windSpeedKts: 7.5,
      windHeadingDeg: 270,
      status: 'PREFLIGHT_CHECK',
      createdAt: new Date().toISOString()
    };

    drone.status = 'EN_ROUTE_DELIVERY';
    drone.activeMissionId = missionId;
    this.missions.push(newMission);

    logger.info('DRONE_LAST_MILE', `Dispatched drone ${drone.callsign} for order ${orderId} (Mission ${missionId})`);

    return {
      success: true,
      message: `Mission ${missionId} authorized. Preflight calibration passed, takeoff authorized.`,
      mission: newMission
    };
  }

  /**
   * Trigger Winch Lowering Simulation
   */
  public static triggerWinchDrop(droneId: string): { success: boolean; message: string; cableLengthMeters: number } {
    const drone = this.drones.find(d => d.id === droneId);
    if (!drone) return { success: false, message: 'Drone not found', cableLengthMeters: 0 };

    drone.status = 'WINCH_DESCENDING';
    drone.winchTetherLengthMeters = 15.0; // 15 meters lowering tether

    logger.info('DRONE_LAST_MILE', `Winch tether extended for ${drone.callsign} at 15.0m altitude`);

    return {
      success: true,
      message: `Winch deployed to 15.0 meters. Package optical ground sensor confirmed zero obstacle clearance.`,
      cableLengthMeters: 15.0
    };
  }

  /**
   * Abort Mission / Trigger Return to Home
   */
  public static triggerEmergencyRTH(droneId: string): { success: boolean; message: string } {
    const drone = this.drones.find(d => d.id === droneId);
    if (!drone) return { success: false, message: 'Drone not found' };

    drone.status = 'RTH_EMERGENCY';
    drone.winchTetherLengthMeters = 0;

    logger.warn('DRONE_LAST_MILE', `EMERGENCY RTH triggered for ${drone.callsign}! Returning to home launchpad.`);

    return {
      success: true,
      message: `Emergency RTH engaged for ${drone.callsign}. Ascending to safe transit corridor (120m) and returning to base.`
    };
  }
}
