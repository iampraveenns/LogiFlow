/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Backend Constants & Domain Reference
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ERROR_CODES = {
  AUTH_TOKEN_EXPIRED: 'AUTH_001_TOKEN_EXPIRED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_002_INVALID_CREDENTIALS',
  RBAC_ACCESS_DENIED: 'RBAC_001_INSUFFICIENT_PERMISSIONS',
  ORGANIZATION_NOT_FOUND: 'TENANT_001_NOT_FOUND',
  SHIPMENT_TRANSITION_INVALID: 'SHIP_001_INVALID_STATE_TRANSITION',
  SHIPMENT_NOT_FOUND: 'SHIP_002_NOT_FOUND',
  FLEET_VEHICLE_UNAVAILABLE: 'FLEET_001_VEHICLE_BUSY',
  TELEMATICS_OUT_OF_RANGE: 'TELEM_001_COORDINATE_ANOMALY',
  GEOFENCE_BREACH_DETECTED: 'GEO_001_BOUNDARY_VIOLATION',
  INVENTORY_STOCKOUT_RISK: 'INV_001_INSUFFICIENT_SAFETY_STOCK',
  CUSTOMS_DOC_HASH_MISMATCH: 'CUST_001_CRYPTOGRAPHIC_INTEGRITY_FAIL',
  RATE_LIMIT_EXCEEDED: 'SEC_001_RATE_LIMIT_BREACH',
  VALIDATION_ERROR: 'VAL_001_VALIDATION_ERROR',
  UNAUTHORIZED: 'AUTH_003_UNAUTHORIZED',
} as const;

/** FMCSA Regulations for Commercial Motor Vehicle Drivers */
export const HOS_REGULATIONS = {
  MAX_DRIVE_HOURS_PER_DAY: 11.0,
  MAX_ON_DUTY_HOURS_PER_DAY: 14.0,
  MANDATORY_REST_PERIOD_HOURS: 10.0,
  MANDATORY_BREAK_INTERVAL_HOURS: 8.0,
  MINIMUM_BREAK_DURATION_MINUTES: 30,
};

/** Diagnostic Trouble Codes (OBD-II / J1939 Heavy Duty Telematics) */
export const DTC_REGISTRY: Record<string, { system: string; severity: 'CRITICAL' | 'WARNING' | 'INFO'; description: string; recommendedAction: string }> = {
  P0300: {
    system: 'ENGINE',
    severity: 'CRITICAL',
    description: 'Random / Multiple Cylinder Misfire Detected',
    recommendedAction: 'Inspect fuel injectors and ignition coil harness immediately. Reroute to nearest fleet depot.',
  },
  P0171: {
    system: 'FUEL_AIR_METERING',
    severity: 'WARNING',
    description: 'System Too Lean (Bank 1) - Low fuel rail pressure',
    recommendedAction: 'Check for vacuum leaks and fuel filter clogs during upcoming driver mandatory break.',
  },
  P0420: {
    system: 'EMISSIONS',
    severity: 'WARNING',
    description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    recommendedAction: 'Schedule exhaust aftertreatment inspection at next primary terminus.',
  },
  P0217: {
    system: 'COOLING_SYSTEM',
    severity: 'CRITICAL',
    description: 'Engine Coolant Overtemperature Condition (>108°C)',
    recommendedAction: 'Immediate safe pullover advised. Disengage turbo load and inspect radiator fan belt.',
  },
  C0035: {
    system: 'BRAKING_ABS',
    severity: 'CRITICAL',
    description: 'Left Front Wheel Speed Sensor Circuit Malfunction',
    recommendedAction: 'ABS system operating in fail-safe hydraulic mode. Restrict maximum vehicle speed to 65 km/h.',
  },
  U0100: {
    system: 'CAN_BUS',
    severity: 'WARNING',
    description: 'Lost Communication with Engine Control Module (ECM/PCM)',
    recommendedAction: 'Re-initialize telematics gateway ping. If persistence > 120s, activate satellite backup.',
  },
  R9010: {
    system: 'REEFER_COOLING',
    severity: 'CRITICAL',
    description: 'Cold-Chain Reefer Compressor Pressure Differential High',
    recommendedAction: 'Perishable cargo temperature breach imminent! Initiate emergency dry ice standby.',
  },
};

/** World Hubs & Strategic Trade Nodes */
export const GLOBAL_HUBS = [
  { id: 'HUB-RTM', name: 'Port of Rotterdam Europort', city: 'Rotterdam', country: 'Netherlands', coordinates: [51.9244, 4.4777] as [number, number], code: 'RTM', type: 'MEGA_HUB' },
  { id: 'HUB-LAX', name: 'Port of Los Angeles / Long Beach Gateway', city: 'Los Angeles', country: 'United States', coordinates: [33.7405, -118.272] as [number, number], code: 'LAX', type: 'MEGA_HUB' },
  { id: 'HUB-SIN', name: 'Singapore PSA Container Mega Terminal', city: 'Singapore', country: 'Singapore', coordinates: [1.2644, 103.822] as [number, number], code: 'SIN', type: 'MEGA_HUB' },
  { id: 'HUB-DXB', name: 'Dubai Jebel Ali Free Zone Port', city: 'Dubai', country: 'United Arab Emirates', coordinates: [24.9857, 55.0273] as [number, number], code: 'DXB', type: 'CUSTOMS_BONDED' },
  { id: 'HUB-HAM', name: 'Hamburg Port Container Terminal Altenwerder', city: 'Hamburg', country: 'Germany', coordinates: [53.5042, 9.9324] as [number, number], code: 'HAM', type: 'CROSS_DOCK' },
  { id: 'HUB-PVG', name: 'Shanghai Yangshan Deep-Water Port', city: 'Shanghai', country: 'China', coordinates: [30.6308, 122.0628] as [number, number], code: 'PVG', type: 'MEGA_HUB' },
  { id: 'HUB-ORD', name: 'Chicago O’Hare Intermodal Logistics Hub', city: 'Chicago', country: 'United States', coordinates: [41.9742, -87.9073] as [number, number], code: 'ORD', type: 'CROSS_DOCK' },
  { id: 'HUB-NRT', name: 'Tokyo Narita Air Cargo Logistics Center', city: 'Tokyo', country: 'Japan', coordinates: [35.772, 140.3929] as [number, number], code: 'NRT', type: 'COLD_STORAGE' },
];
