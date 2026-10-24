/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Shared Data Types & Zod Schemas
 */

import { z } from 'zod';

// ==========================================
// 1. RBAC & TENANCY TYPES
// ==========================================
export type UserRole = 'ADMIN' | 'DISPATCHER' | 'WAREHOUSE_MANAGER' | 'FLEET_DRIVER' | 'COMPLIANCE_AUDITOR';

export const UserRoleSchema = z.enum([
  'ADMIN',
  'DISPATCHER',
  'WAREHOUSE_MANAGER',
  'FLEET_DRIVER',
  'COMPLIANCE_AUDITOR',
]);

export interface UserSession {
  userId: string;
  tenantId: string;
  organizationName: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  permissions: string[];
  mfaEnabled: boolean;
  tokenExpiresAt: number;
}

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  code: z.string().min(2).max(6),
  tier: z.enum(['ENTERPRISE', 'GLOBAL_PARTNER', 'REGIONAL']),
  country: z.string(),
  defaultCurrency: z.string(),
  fleetCount: z.number().nonnegative(),
  activeShipments: z.number().nonnegative(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

// ==========================================
// 2. SHIPMENT & WAYBILL STATE MACHINE
// ==========================================
export type ShipmentStatus =
  | 'DRAFT'
  | 'BOOKED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'CUSTOMS_HOLD'
  | 'CUSTOMS_CLEARED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXCEPTION'
  | 'CANCELLED';

export const ShipmentStatusSchema = z.enum([
  'DRAFT',
  'BOOKED',
  'DISPATCHED',
  'IN_TRANSIT',
  'CUSTOMS_HOLD',
  'CUSTOMS_CLEARED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'EXCEPTION',
  'CANCELLED',
]);

export type TransportMode = 'OCEAN' | 'AIR' | 'ROAD' | 'RAIL' | 'MULTIMODAL';

export type HazmatClass = 'NONE' | 'CLASS_1_EXPLOSIVE' | 'CLASS_2_GASES' | 'CLASS_3_FLAMMABLE_LIQUIDS' | 'CLASS_7_RADIOACTIVE' | 'CLASS_9_MISC';

export interface AuditLogEntry {
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  previousState?: string;
  newState?: string;
  notes?: string;
  ipAddress?: string;
  digitalSignature?: string;
}

export interface WaybillItem {
  sku: string;
  description: string;
  quantity: number;
  unitWeightKg: number;
  totalWeightKg: number;
  volumeM3: number;
  hsCode: string; // Harmonized System Code for customs
  declaredValueUsd: number;
  isPerishable: boolean;
  temperatureRequirement?: {
    minCelsius: number;
    maxCelsius: number;
  };
}

export interface WaybillDocument {
  id: string;
  waybillNumber: string;
  tenantId: string;
  status: ShipmentStatus;
  mode: TransportMode;
  origin: {
    facilityCode: string;
    city: string;
    country: string;
    coordinates: [number, number]; // [lat, lng]
    address: string;
  };
  destination: {
    facilityCode: string;
    city: string;
    country: string;
    coordinates: [number, number];
    address: string;
  };
  assignedVehicleId?: string;
  assignedDriverId?: string;
  carrier: string;
  hazmatClass: HazmatClass;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalDeclaredValueUsd: number;
  eta: string;
  dispatchTime?: string;
  deliveryTime?: string;
  items: WaybillItem[];
  auditTrail: AuditLogEntry[];
  customsStatus: {
    riskScore: number; // 0-100
    inspectionRequired: boolean;
    clearedDate?: string;
    declarationHash: string;
    dutyEstimatedUsd: number;
  };
}

// ==========================================
// 3. FLEET TELEMATICS & OBD-II
// ==========================================
export type VehicleType = 'CLASS_8_SEMI' | 'PANAMAX_VESSEL' | 'BOEING_777F' | 'REGIONAL_EV_VAN' | 'ELECTRIC_HAULER';

export interface OBD2DiagnosticCode {
  code: string; // e.g. "P0300", "P0171"
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  system: 'ENGINE' | 'BRAKING' | 'EMISSIONS' | 'BATTERY' | 'REEFER_COOLING';
  description: string;
  timestamp: string;
}

export interface TelematicsPing {
  vehicleId: string;
  timestamp: string;
  coordinates: [number, number]; // [lat, lng]
  headingDegrees: number;
  speedKmh: number;
  rpm: number;
  fuelLevelPercent: number;
  batterySocPercent?: number; // for EVs
  odometerKm: number;
  engineTemperatureCelsius: number;
  cargoTemperatureCelsius?: number; // Cold chain sensor
  cargoHumidityPercent?: number;
  harshBrakingDetected: boolean;
  rapidAccelerationDetected: boolean;
  dtcCodes: OBD2DiagnosticCode[];
}

export interface Vehicle {
  id: string;
  tenantId: string;
  licensePlate: string;
  vin: string;
  name: string;
  type: VehicleType;
  maxWeightCapacityKg: number;
  maxVolumeCapacityM3: number;
  fuelType: 'DIESEL' | 'ELECTRIC' | 'HFO_BUNKER' | 'JET_A';
  currentStatus: 'IDLE' | 'EN_ROUTE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'DOCKED';
  assignedDriver: {
    id: string;
    name: string;
    licenseGrade: string;
    hosRemainingHours: number; // Hours of Service limit (11h max)
    safetyScore: number; // 0-100
  };
  currentLocation: {
    coordinates: [number, number];
    speedKmh: number;
    heading: number;
    lastPingTime: string;
  };
  activeWaybillId?: string;
  telematics: TelematicsPing;
  geofenceState: {
    currentZoneId?: string;
    isBreached: boolean;
    breachTime?: string;
  };
}

// ==========================================
// 4. GEOFENCING & ZONES
// ==========================================
export interface GeofenceZone {
  id: string;
  name: string;
  type: 'PORT' | 'WAREHOUSE' | 'CUSTOMS_BONDED' | 'RESTRICTED' | 'BORDER_CROSSING';
  center: [number, number];
  radiusKm: number;
  speedLimitKmh: number;
  polygon?: [number, number][]; // Optional polygon coordinates
  alertOnEntry: boolean;
  alertOnExit: boolean;
}

// ==========================================
// 5. WAREHOUSE & INVENTORY MODELS
// ==========================================
export interface BinLocation {
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
}

export interface InventoryItem {
  sku: string;
  warehouseId: string;
  name: string;
  category: 'ELECTRONICS' | 'PHARMACEUTICALS' | 'AUTOMOTIVE' | 'PERISHABLE' | 'RAW_MATERIALS';
  quantityOnHand: number;
  quantityAllocated: number;
  quantityReserved: number;
  reorderPoint: number;
  safetyStock: number;
  optimalOrderQty: number;
  unitCostUsd: number;
  batchNumber: string;
  expiryDate?: string;
  binLocation: BinLocation;
  lastCycleCountDate: string;
  predictedDemandNext30Days: number;
  stockoutRiskPercent: number;
}

export interface WarehouseFacility {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  type: 'MEGA_HUB' | 'CROSS_DOCK' | 'COLD_STORAGE' | 'CUSTOMS_BONDED';
  location: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
  totalAreaSqMeters: number;
  capacityUtilizationPercent: number;
  activeDocks: number;
  totalDocks: number;
  inboundShipmentsToday: number;
  outboundShipmentsToday: number;
}

// ==========================================
// 6. ROUTE OPTIMIZATION TYPES
// ==========================================
export interface RouteWaypoint {
  id: string;
  name: string;
  coordinates: [number, number];
  type: 'ORIGIN' | 'PICKUP' | 'REST_STOP' | 'BORDER_CHECK' | 'PORT' | 'DESTINATION';
  estimatedArrival: string;
  estimatedDeparture: string;
  distanceFromPreviousKm: number;
  tollCostUsd: number;
  isCompleted: boolean;
}

export interface RouteOptimizationResult {
  routeId: string;
  algorithm: 'A_STAR' | 'DIJKSTRA_HEURISTIC' | 'GENETIC_TSP';
  totalDistanceKm: number;
  estimatedDurationHours: number;
  estimatedFuelLiters: number;
  estimatedCo2EmissionsKg: number;
  tollCostsUsd: number;
  waypoints: RouteWaypoint[];
  weatherAlerts: {
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    region: string;
    description: string;
  }[];
  hosComplianceVerified: boolean;
  savingsVsBaseline: {
    distanceSavedKm: number;
    fuelCostSavedUsd: number;
    co2SavedKg: number;
  };
}
