/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Domain Data Models & Mongoose-Style Schema Definitions
 * Provides schema validation, compound indexes metadata, virtual calculations, and state machine hooks.
 */

import { z } from 'zod';
import {
  ShipmentStatus,
  TransportMode,
  HazmatClass,
  VehicleType,
  UserRole,
} from '../../packages/shared-types/index.ts';

// =========================================================================
// 1. USER & ORGANIZATION SCHEMA
// =========================================================================

export const UserSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  name: z.string().min(2),
  email: z.string().email(),
  passwordHash: z.string(),
  role: z.enum(['ADMIN', 'DISPATCHER', 'WAREHOUSE_MANAGER', 'FLEET_DRIVER', 'COMPLIANCE_AUDITOR']),
  avatarUrl: z.string().url().optional(),
  permissions: z.array(z.string()),
  apiKeyHash: z.string().optional(),
  mfaSecret: z.string().optional(),
  mfaEnabled: z.boolean().default(false),
  lastLoginIp: z.string().optional(),
  lastLoginAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserModel = z.infer<typeof UserSchema>;

export const OrganizationModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  tier: z.enum(['ENTERPRISE', 'GLOBAL_PARTNER', 'REGIONAL']),
  country: z.string(),
  currency: z.string().default('USD'),
  settings: z.object({
    telematicsUpdateIntervalSec: z.number().default(5),
    autoRerouteOnWeatherSevere: z.boolean().default(true),
    enforceStrictHosLimits: z.boolean().default(true),
    customsRiskAutoHoldThreshold: z.number().default(75),
  }),
});

export type OrganizationModel = z.infer<typeof OrganizationModelSchema>;

// =========================================================================
// 2. SHIPMENT & WAYBILL SCHEMA (WITH STATE MACHINE HOOKS)
// =========================================================================

export const VALID_STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  DRAFT: ['BOOKED', 'CANCELLED'],
  BOOKED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT', 'EXCEPTION', 'CANCELLED'],
  IN_TRANSIT: ['CUSTOMS_HOLD', 'CUSTOMS_CLEARED', 'OUT_FOR_DELIVERY', 'EXCEPTION'],
  CUSTOMS_HOLD: ['CUSTOMS_CLEARED', 'EXCEPTION'],
  CUSTOMS_CLEARED: ['OUT_FOR_DELIVERY', 'IN_TRANSIT', 'EXCEPTION'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'EXCEPTION'],
  DELIVERED: [], // Terminal
  EXCEPTION: ['IN_TRANSIT', 'CUSTOMS_HOLD', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  CANCELLED: [], // Terminal
};

export function canTransitionShipment(current: ShipmentStatus, next: ShipmentStatus): boolean {
  if (current === next) return true;
  const allowed = VALID_STATUS_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

export const WaybillItemSchema = z.object({
  sku: z.string(),
  description: z.string(),
  quantity: z.number().int().positive(),
  unitWeightKg: z.number().positive(),
  totalWeightKg: z.number().positive(),
  volumeM3: z.number().positive(),
  hsCode: z.string().regex(/^\d{4}\.\d{2}(\.\d{2})?$/, 'Must be valid HS code format e.g. 8471.30'),
  declaredValueUsd: z.number().nonnegative(),
  isPerishable: z.boolean().default(false),
  temperatureRequirement: z
    .object({
      minCelsius: z.number(),
      maxCelsius: z.number(),
    })
    .optional(),
});

export const WaybillModelSchema = z.object({
  id: z.string(),
  waybillNumber: z.string(),
  tenantId: z.string(),
  status: z.enum([
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
  ]),
  mode: z.enum(['OCEAN', 'AIR', 'ROAD', 'RAIL', 'MULTIMODAL']),
  origin: z.object({
    facilityCode: z.string(),
    city: z.string(),
    country: z.string(),
    coordinates: z.tuple([z.number(), z.number()]),
    address: z.string(),
  }),
  destination: z.object({
    facilityCode: z.string(),
    city: z.string(),
    country: z.string(),
    coordinates: z.tuple([z.number(), z.number()]),
    address: z.string(),
  }),
  assignedVehicleId: z.string().optional(),
  assignedDriverId: z.string().optional(),
  carrier: z.string(),
  hazmatClass: z.enum(['NONE', 'CLASS_1_EXPLOSIVE', 'CLASS_2_GASES', 'CLASS_3_FLAMMABLE_LIQUIDS', 'CLASS_7_RADIOACTIVE', 'CLASS_9_MISC']),
  totalWeightKg: z.number(),
  totalVolumeM3: z.number(),
  totalDeclaredValueUsd: z.number(),
  eta: z.string(),
  dispatchTime: z.string().optional(),
  deliveryTime: z.string().optional(),
  items: z.array(WaybillItemSchema),
  auditTrail: z.array(
    z.object({
      timestamp: z.string(),
      actorId: z.string(),
      actorName: z.string(),
      action: z.string(),
      previousState: z.string().optional(),
      newState: z.string().optional(),
      notes: z.string().optional(),
      ipAddress: z.string().optional(),
      digitalSignature: z.string().optional(),
    })
  ),
  customsStatus: z.object({
    riskScore: z.number().min(0).max(100),
    inspectionRequired: z.boolean(),
    clearedDate: z.string().optional(),
    declarationHash: z.string(),
    dutyEstimatedUsd: z.number(),
  }),
});

export type WaybillModel = z.infer<typeof WaybillModelSchema>;

// =========================================================================
// 3. FLEET TELEMATICS & VEHICLE SCHEMA
// =========================================================================

export const VehicleModelSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  licensePlate: z.string(),
  vin: z.string().length(17),
  name: z.string(),
  type: z.enum(['CLASS_8_SEMI', 'PANAMAX_VESSEL', 'BOEING_777F', 'REGIONAL_EV_VAN', 'ELECTRIC_HAULER']),
  maxWeightCapacityKg: z.number(),
  maxVolumeCapacityM3: z.number(),
  fuelType: z.enum(['DIESEL', 'ELECTRIC', 'HFO_BUNKER', 'JET_A']),
  currentStatus: z.enum(['IDLE', 'EN_ROUTE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'DOCKED']),
  assignedDriver: z.object({
    id: z.string(),
    name: z.string(),
    licenseGrade: z.string(),
    hosRemainingHours: z.number().min(0).max(11),
    safetyScore: z.number().min(0).max(100),
  }),
  currentLocation: z.object({
    coordinates: z.tuple([z.number(), z.number()]),
    speedKmh: z.number().min(0),
    heading: z.number().min(0).max(360),
    lastPingTime: z.string(),
  }),
  activeWaybillId: z.string().optional(),
  telematics: z.object({
    vehicleId: z.string(),
    timestamp: z.string(),
    coordinates: z.tuple([z.number(), z.number()]),
    headingDegrees: z.number(),
    speedKmh: z.number(),
    rpm: z.number(),
    fuelLevelPercent: z.number().min(0).max(100),
    batterySocPercent: z.number().min(0).max(100).optional(),
    odometerKm: z.number(),
    engineTemperatureCelsius: z.number(),
    cargoTemperatureCelsius: z.number().optional(),
    cargoHumidityPercent: z.number().optional(),
    harshBrakingDetected: z.boolean(),
    rapidAccelerationDetected: z.boolean(),
    dtcCodes: z.array(
      z.object({
        code: z.string(),
        severity: z.enum(['CRITICAL', 'WARNING', 'INFO']),
        system: z.enum(['ENGINE', 'BRAKING', 'EMISSIONS', 'BATTERY', 'REEFER_COOLING']),
        description: z.string(),
        timestamp: z.string(),
      })
    ),
  }),
  geofenceState: z.object({
    currentZoneId: z.string().optional(),
    isBreached: z.boolean().default(false),
    breachTime: z.string().optional(),
  }),
});

export type VehicleModel = z.infer<typeof VehicleModelSchema>;

// =========================================================================
// 4. WAREHOUSE & INVENTORY SCHEMA
// =========================================================================

export const InventoryItemSchema = z.object({
  sku: z.string(),
  warehouseId: z.string(),
  name: z.string(),
  category: z.enum(['ELECTRONICS', 'PHARMACEUTICALS', 'AUTOMOTIVE', 'PERISHABLE', 'RAW_MATERIALS']),
  quantityOnHand: z.number().nonnegative(),
  quantityAllocated: z.number().nonnegative(),
  quantityReserved: z.number().nonnegative(),
  reorderPoint: z.number().nonnegative(),
  safetyStock: z.number().nonnegative(),
  optimalOrderQty: z.number().positive(),
  unitCostUsd: z.number().positive(),
  batchNumber: z.string(),
  expiryDate: z.string().optional(),
  binLocation: z.object({
    aisle: z.string(),
    rack: z.string(),
    shelf: z.string(),
    bin: z.string(),
  }),
  lastCycleCountDate: z.string(),
  predictedDemandNext30Days: z.number().nonnegative(),
  stockoutRiskPercent: z.number().min(0).max(100),
});

export type InventoryModel = z.infer<typeof InventoryItemSchema>;
