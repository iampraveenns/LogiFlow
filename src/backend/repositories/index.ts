/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Data Access Layer (Repositories)
 * Implements in-memory data store with indexing, geospatial proximity queries, and atomic mutation hooks.
 */

import {
  WaybillDocument,
  Vehicle,
  InventoryItem,
  WarehouseFacility,
  GeofenceZone,
  UserSession,
  ShipmentStatus,
} from '../../packages/shared-types/index.ts';
import { GLOBAL_HUBS, DTC_REGISTRY } from '../constants/index.ts';
import { logger } from '../../packages/logger/index.ts';

// =========================================================================
// SEED DATA GENERATOR
// =========================================================================

const SEED_GEOFENCES: GeofenceZone[] = [
  {
    id: 'GEO-RTM-PORT',
    name: 'Rotterdam Europort Secure Marine Terminal',
    type: 'PORT',
    center: [51.9244, 4.4777],
    radiusKm: 15,
    speedLimitKmh: 40,
    alertOnEntry: true,
    alertOnExit: true,
  },
  {
    id: 'GEO-LAX-GATE',
    name: 'Port of Long Beach Pier 400 Intermodal',
    type: 'PORT',
    center: [33.7405, -118.272],
    radiusKm: 20,
    speedLimitKmh: 45,
    alertOnEntry: false,
    alertOnExit: true,
  },
  {
    id: 'GEO-ORD-WH',
    name: 'Chicago Central Inland Distribution Hub',
    type: 'WAREHOUSE',
    center: [41.9742, -87.9073],
    radiusKm: 8,
    speedLimitKmh: 60,
    alertOnEntry: true,
    alertOnExit: false,
  },
  {
    id: 'GEO-SIN-PSA',
    name: 'Singapore Jurong Island Restricted Zone',
    type: 'RESTRICTED',
    center: [1.2644, 103.822],
    radiusKm: 12,
    speedLimitKmh: 35,
    alertOnEntry: true,
    alertOnExit: true,
  },
];

const SEED_WAREHOUSES: WarehouseFacility[] = [
  {
    id: 'WH-RTM-01',
    tenantId: 'tenant-apex',
    name: 'Europort Mega Logistics Center',
    code: 'RTM-WH1',
    type: 'MEGA_HUB',
    location: {
      city: 'Rotterdam',
      country: 'Netherlands',
      coordinates: [51.9244, 4.4777],
    },
    totalAreaSqMeters: 145000,
    capacityUtilizationPercent: 78.4,
    activeDocks: 32,
    totalDocks: 40,
    inboundShipmentsToday: 54,
    outboundShipmentsToday: 68,
  },
  {
    id: 'WH-LAX-02',
    tenantId: 'tenant-apex',
    name: 'Pacific Rim Gateway Distribution',
    code: 'LAX-WH2',
    type: 'CROSS_DOCK',
    location: {
      city: 'Los Angeles',
      country: 'United States',
      coordinates: [33.7405, -118.272],
    },
    totalAreaSqMeters: 220000,
    capacityUtilizationPercent: 86.2,
    activeDocks: 55,
    totalDocks: 60,
    inboundShipmentsToday: 82,
    outboundShipmentsToday: 91,
  },
  {
    id: 'WH-SIN-03',
    tenantId: 'tenant-apex',
    name: 'Changi Air & Maritime Intermodal Center',
    code: 'SIN-WH3',
    type: 'COLD_STORAGE',
    location: {
      city: 'Singapore',
      country: 'Singapore',
      coordinates: [1.2644, 103.822],
    },
    totalAreaSqMeters: 98000,
    capacityUtilizationPercent: 64.8,
    activeDocks: 24,
    totalDocks: 30,
    inboundShipmentsToday: 41,
    outboundShipmentsToday: 39,
  },
  {
    id: 'WH-HAM-04',
    tenantId: 'tenant-apex',
    name: 'Altenwerder Central Hub',
    code: 'HAM-WH4',
    type: 'CUSTOMS_BONDED',
    location: {
      city: 'Hamburg',
      country: 'Germany',
      coordinates: [53.5042, 9.9324],
    },
    totalAreaSqMeters: 115000,
    capacityUtilizationPercent: 81.0,
    activeDocks: 28,
    totalDocks: 36,
    inboundShipmentsToday: 49,
    outboundShipmentsToday: 52,
  },
];

const SEED_INVENTORY: InventoryItem[] = [
  {
    sku: 'SKU-NV-9080-GPU',
    warehouseId: 'WH-LAX-02',
    name: 'UltraCompute AI Tensor Accelerator H200',
    category: 'ELECTRONICS',
    quantityOnHand: 420,
    quantityAllocated: 180,
    quantityReserved: 40,
    reorderPoint: 250,
    safetyStock: 150,
    optimalOrderQty: 500,
    unitCostUsd: 14500,
    batchNumber: 'B-2026-Q3-8891',
    binLocation: { aisle: 'A04', rack: 'R12', shelf: 'S03', bin: 'B01' },
    lastCycleCountDate: '2026-10-18',
    predictedDemandNext30Days: 610,
    stockoutRiskPercent: 34.2,
  },
  {
    sku: 'SKU-BIO-4421-VAC',
    warehouseId: 'WH-RTM-01',
    name: 'CryoVax mRNA Immunotherapy Vaccines (-70°C)',
    category: 'PHARMACEUTICALS',
    quantityOnHand: 8500,
    quantityAllocated: 4000,
    quantityReserved: 1200,
    reorderPoint: 5000,
    safetyStock: 3000,
    optimalOrderQty: 10000,
    unitCostUsd: 85.5,
    batchNumber: 'LOT-CRYO-0992',
    expiryDate: '2027-04-15',
    binLocation: { aisle: 'C01', rack: 'R02', shelf: 'S01', bin: 'B04' },
    lastCycleCountDate: '2026-10-22',
    predictedDemandNext30Days: 9200,
    stockoutRiskPercent: 18.0,
  },
  {
    sku: 'SKU-EV-CELL-21700',
    warehouseId: 'WH-HAM-04',
    name: 'Lithium-Nickel-Manganese EV Battery Cells (Hazmat Class 9)',
    category: 'AUTOMOTIVE',
    quantityOnHand: 45000,
    quantityAllocated: 28000,
    quantityReserved: 5000,
    reorderPoint: 35000,
    safetyStock: 18000,
    optimalOrderQty: 50000,
    unitCostUsd: 12.8,
    batchNumber: 'CELL-LNM-7718',
    binLocation: { aisle: 'H02', rack: 'R08', shelf: 'S04', bin: 'B02' },
    lastCycleCountDate: '2026-10-15',
    predictedDemandNext30Days: 52000,
    stockoutRiskPercent: 42.5,
  },
  {
    sku: 'SKU-AGRI-AVO-PER',
    warehouseId: 'WH-SIN-03',
    name: 'Organic Hass Avocados Grade A+ (Controlled Atmosphere)',
    category: 'PERISHABLE',
    quantityOnHand: 12400,
    quantityAllocated: 6000,
    quantityReserved: 2000,
    reorderPoint: 8000,
    safetyStock: 4000,
    optimalOrderQty: 15000,
    unitCostUsd: 2.15,
    batchNumber: 'AGR-PAC-4410',
    expiryDate: '2026-11-10',
    binLocation: { aisle: 'P01', rack: 'R01', shelf: 'S02', bin: 'B03' },
    lastCycleCountDate: '2026-10-23',
    predictedDemandNext30Days: 16000,
    stockoutRiskPercent: 22.8,
  },
  {
    sku: 'SKU-AERO-TURB-BLD',
    warehouseId: 'WH-ORD-01',
    name: 'Titanium-Aluminide Turbofan Compressor Stator Blades',
    category: 'RAW_MATERIALS',
    quantityOnHand: 680,
    quantityAllocated: 310,
    quantityReserved: 80,
    reorderPoint: 400,
    safetyStock: 250,
    optimalOrderQty: 800,
    unitCostUsd: 1850,
    batchNumber: 'TIT-AERO-042',
    binLocation: { aisle: 'M05', rack: 'R15', shelf: 'S02', bin: 'B01' },
    lastCycleCountDate: '2026-10-20',
    predictedDemandNext30Days: 450,
    stockoutRiskPercent: 8.5,
  },
];

const SEED_VEHICLES: Vehicle[] = [
  {
    id: 'VEH-TRK-101',
    tenantId: 'tenant-apex',
    licensePlate: 'NL-88-ZFD',
    vin: '1HD1V2B57PN991204',
    name: 'Apex Freight Hauler #101 (Volvo FH Electric)',
    type: 'ELECTRIC_HAULER',
    maxWeightCapacityKg: 44000,
    maxVolumeCapacityM3: 92,
    fuelType: 'ELECTRIC',
    currentStatus: 'EN_ROUTE',
    assignedDriver: {
      id: 'DRV-771',
      name: 'Lars van der Beek',
      licenseGrade: 'CE_HAZMAT',
      hosRemainingHours: 6.5,
      safetyScore: 94,
    },
    currentLocation: {
      coordinates: [52.3676, 4.9041], // Amsterdam ring route
      speedKmh: 82.4,
      heading: 145,
      lastPingTime: new Date().toISOString(),
    },
    activeWaybillId: 'WB-2026-001',
    telematics: {
      vehicleId: 'VEH-TRK-101',
      timestamp: new Date().toISOString(),
      coordinates: [52.3676, 4.9041],
      headingDegrees: 145,
      speedKmh: 82.4,
      rpm: 1420,
      fuelLevelPercent: 68,
      batterySocPercent: 74,
      odometerKm: 142850,
      engineTemperatureCelsius: 72,
      cargoTemperatureCelsius: -19.4, // Reefer vaccine batch
      cargoHumidityPercent: 44,
      harshBrakingDetected: false,
      rapidAccelerationDetected: false,
      dtcCodes: [],
    },
    geofenceState: {
      currentZoneId: 'GEO-RTM-PORT',
      isBreached: false,
    },
  },
  {
    id: 'VEH-TRK-102',
    tenantId: 'tenant-apex',
    licensePlate: 'CA-918-XKJ',
    vin: '3AKJHHDR5LS982143',
    name: 'Apex Western Intermodal #102 (Freightliner Cascadia)',
    type: 'CLASS_8_SEMI',
    maxWeightCapacityKg: 36000,
    maxVolumeCapacityM3: 110,
    fuelType: 'DIESEL',
    currentStatus: 'EN_ROUTE',
    assignedDriver: {
      id: 'DRV-842',
      name: 'Marcus Ramirez',
      licenseGrade: 'CDL_CLASS_A',
      hosRemainingHours: 4.2,
      safetyScore: 88,
    },
    currentLocation: {
      coordinates: [34.0522, -118.2437], // Downtown LA / I-10 East
      speedKmh: 64.0,
      heading: 85,
      lastPingTime: new Date().toISOString(),
    },
    activeWaybillId: 'WB-2026-002',
    telematics: {
      vehicleId: 'VEH-TRK-102',
      timestamp: new Date().toISOString(),
      coordinates: [34.0522, -118.2437],
      headingDegrees: 85,
      speedKmh: 64.0,
      rpm: 1580,
      fuelLevelPercent: 42,
      odometerKm: 289410,
      engineTemperatureCelsius: 91,
      cargoTemperatureCelsius: 21.0,
      harshBrakingDetected: true, // harsh braking warning!
      rapidAccelerationDetected: false,
      dtcCodes: [
        {
          code: 'P0171',
          severity: 'WARNING',
          system: 'ENGINE',
          description: DTC_REGISTRY['P0171'].description,
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        },
      ],
    },
    geofenceState: {
      currentZoneId: 'GEO-LAX-GATE',
      isBreached: false,
    },
  },
  {
    id: 'VEH-VESSEL-501',
    tenantId: 'tenant-apex',
    licensePlate: 'IMO-9812401',
    vin: 'IMO98124010000000',
    name: 'Ever Glory Panamax Container Vessel (20,000 TEU)',
    type: 'PANAMAX_VESSEL',
    maxWeightCapacityKg: 198000000,
    maxVolumeCapacityM3: 650000,
    fuelType: 'HFO_BUNKER',
    currentStatus: 'EN_ROUTE',
    assignedDriver: {
      id: 'CAPT-004',
      name: 'Capt. Henrik Lindqvist',
      licenseGrade: 'MASTER_MARINER_UNLIMITED',
      hosRemainingHours: 11.0,
      safetyScore: 99,
    },
    currentLocation: {
      coordinates: [22.45, 120.25], // South China Sea near Taiwan Strait
      speedKmh: 38.5,
      heading: 52,
      lastPingTime: new Date().toISOString(),
    },
    activeWaybillId: 'WB-2026-003',
    telematics: {
      vehicleId: 'VEH-VESSEL-501',
      timestamp: new Date().toISOString(),
      coordinates: [22.45, 120.25],
      headingDegrees: 52,
      speedKmh: 38.5,
      rpm: 88,
      fuelLevelPercent: 81,
      odometerKm: 640000,
      engineTemperatureCelsius: 82,
      cargoTemperatureCelsius: -2.0,
      harshBrakingDetected: false,
      rapidAccelerationDetected: false,
      dtcCodes: [],
    },
    geofenceState: {
      isBreached: false,
    },
  },
  {
    id: 'VEH-AIR-777',
    tenantId: 'tenant-apex',
    licensePlate: 'N-777LF',
    vin: 'B777F982000000000',
    name: 'Apex SkyExpress Boeing 777-200LRF Cargo',
    type: 'BOEING_777F',
    maxWeightCapacityKg: 102000,
    maxVolumeCapacityM3: 650,
    fuelType: 'JET_A',
    currentStatus: 'EN_ROUTE',
    assignedDriver: {
      id: 'PLT-501',
      name: 'Capt. Sarah Jenkins (ATPL)',
      licenseGrade: 'FAA_ATPL_HEAVY',
      hosRemainingHours: 8.0,
      safetyScore: 98,
    },
    currentLocation: {
      coordinates: [45.10, -50.20], // Mid-Atlantic Flight Corridor (JFK -> RTM)
      speedKmh: 890.0,
      heading: 75,
      lastPingTime: new Date().toISOString(),
    },
    activeWaybillId: 'WB-2026-004',
    telematics: {
      vehicleId: 'VEH-AIR-777',
      timestamp: new Date().toISOString(),
      coordinates: [45.10, -50.20],
      headingDegrees: 75,
      speedKmh: 890.0,
      rpm: 9400,
      fuelLevelPercent: 55,
      odometerKm: 1820000,
      engineTemperatureCelsius: 640,
      cargoTemperatureCelsius: 18.0,
      harshBrakingDetected: false,
      rapidAccelerationDetected: false,
      dtcCodes: [],
    },
    geofenceState: {
      isBreached: false,
    },
  },
];

const SEED_WAYBILLS: WaybillDocument[] = [
  {
    id: 'WB-2026-001',
    waybillNumber: 'LGF-908124-EU',
    tenantId: 'tenant-apex',
    status: 'IN_TRANSIT',
    mode: 'ROAD',
    origin: {
      facilityCode: 'RTM-WH1',
      city: 'Rotterdam',
      country: 'Netherlands',
      coordinates: [51.9244, 4.4777],
      address: 'Europort Terminal 4, Havennummer 5840',
    },
    destination: {
      facilityCode: 'HAM-WH4',
      city: 'Hamburg',
      country: 'Germany',
      coordinates: [53.5042, 9.9324],
      address: 'Am Ballinkai 1, 21129 Hamburg',
    },
    assignedVehicleId: 'VEH-TRK-101',
    assignedDriverId: 'DRV-771',
    carrier: 'LogiFlow European Express',
    hazmatClass: 'NONE',
    totalWeightKg: 18450,
    totalVolumeM3: 48,
    totalDeclaredValueUsd: 726750,
    eta: '2026-10-24T18:30:00Z',
    dispatchTime: '2026-10-24T06:15:00Z',
    items: [
      {
        sku: 'SKU-BIO-4421-VAC',
        description: 'CryoVax mRNA Immunotherapy Vaccines (-70°C)',
        quantity: 8500,
        unitWeightKg: 0.8,
        totalWeightKg: 6800,
        volumeM3: 14.5,
        hsCode: '3002.20.00',
        declaredValueUsd: 726750,
        isPerishable: true,
        temperatureRequirement: { minCelsius: -80, maxCelsius: -65 },
      },
    ],
    auditTrail: [
      {
        timestamp: '2026-10-24T05:00:00Z',
        actorId: 'usr-admin-01',
        actorName: 'Dispatcher Frank Mueller',
        action: 'WAYBILL_CREATED',
        previousState: 'DRAFT',
        newState: 'BOOKED',
        notes: 'Cold chain compliance protocol validated.',
        digitalSignature: '9e8b7c4a1f...sha256',
      },
      {
        timestamp: '2026-10-24T06:15:00Z',
        actorId: 'usr-admin-01',
        actorName: 'Dispatcher Frank Mueller',
        action: 'DISPATCH_COMMENCED',
        previousState: 'BOOKED',
        newState: 'IN_TRANSIT',
        notes: 'Vehicle VEH-TRK-101 departed dock 12 with temperature sealed lock.',
      },
    ],
    customsStatus: {
      riskScore: 12,
      inspectionRequired: false,
      clearedDate: '2026-10-24T05:30:00Z',
      declarationHash: 'a71e88fbc92348dd010e9c87890bfa3321',
      dutyEstimatedUsd: 0, // Intracommunity EU VAT
    },
  },
  {
    id: 'WB-2026-002',
    waybillNumber: 'LGF-772911-US',
    tenantId: 'tenant-apex',
    status: 'IN_TRANSIT',
    mode: 'ROAD',
    origin: {
      facilityCode: 'LAX-WH2',
      city: 'Los Angeles',
      country: 'United States',
      coordinates: [33.7405, -118.272],
      address: '300 Pier 400 Way, San Pedro, CA',
    },
    destination: {
      facilityCode: 'ORD-WH1',
      city: 'Chicago',
      country: 'United States',
      coordinates: [41.9742, -87.9073],
      address: '10000 West O’Hare Ave, Chicago, IL',
    },
    assignedVehicleId: 'VEH-TRK-102',
    assignedDriverId: 'DRV-842',
    carrier: 'Apex Continental Freight',
    hazmatClass: 'CLASS_9_MISC',
    totalWeightKg: 28500,
    totalVolumeM3: 78,
    totalDeclaredValueUsd: 6090000,
    eta: '2026-10-26T14:00:00Z',
    dispatchTime: '2026-10-24T08:00:00Z',
    items: [
      {
        sku: 'SKU-NV-9080-GPU',
        description: 'UltraCompute AI Tensor Accelerator H200',
        quantity: 420,
        unitWeightKg: 12.5,
        totalWeightKg: 5250,
        volumeM3: 18.0,
        hsCode: '8471.50.01',
        declaredValueUsd: 6090000,
        isPerishable: false,
      },
    ],
    auditTrail: [
      {
        timestamp: '2026-10-24T07:30:00Z',
        actorId: 'usr-admin-01',
        actorName: 'Dispatcher Frank Mueller',
        action: 'SECURITY_ESCORT_ASSIGNED',
        notes: 'High-value tech freight escort protocol active.',
      },
    ],
    customsStatus: {
      riskScore: 28,
      inspectionRequired: false,
      declarationHash: '5e0f7194cc2834b9281aef830022',
      dutyEstimatedUsd: 14200,
    },
  },
  {
    id: 'WB-2026-003',
    waybillNumber: 'LGF-449102-OCN',
    tenantId: 'tenant-apex',
    status: 'IN_TRANSIT',
    mode: 'OCEAN',
    origin: {
      facilityCode: 'PVG-MEGA',
      city: 'Shanghai',
      country: 'China',
      coordinates: [30.6308, 122.0628],
      address: 'Yangshan Deep-Water Port Phase 4',
    },
    destination: {
      facilityCode: 'LAX-WH2',
      city: 'Los Angeles',
      country: 'United States',
      coordinates: [33.7405, -118.272],
      address: 'Pier 400 Container Terminal',
    },
    assignedVehicleId: 'VEH-VESSEL-501',
    carrier: 'Evergreen Marine Ocean Logistics',
    hazmatClass: 'CLASS_9_MISC',
    totalWeightKg: 18500000,
    totalVolumeM3: 62000,
    totalDeclaredValueUsd: 48500000,
    eta: '2026-11-04T08:00:00Z',
    dispatchTime: '2026-10-20T12:00:00Z',
    items: [
      {
        sku: 'SKU-EV-CELL-21700',
        description: 'Lithium-Nickel-Manganese EV Battery Cells',
        quantity: 45000,
        unitWeightKg: 0.12,
        totalWeightKg: 5400,
        volumeM3: 8.5,
        hsCode: '8507.60.00',
        declaredValueUsd: 576000,
        isPerishable: false,
      },
    ],
    auditTrail: [
      {
        timestamp: '2026-10-20T12:00:00Z',
        actorId: 'usr-system',
        actorName: 'Port Operations System',
        action: 'OCEAN_DEPARTURE',
        newState: 'IN_TRANSIT',
        notes: 'Vessel cleared Taiwan Strait waypoint #1.',
      },
    ],
    customsStatus: {
      riskScore: 78, // High risk, needs customs review
      inspectionRequired: true,
      declarationHash: 'c4ca4238a0b923820dcc509a6f75849b',
      dutyEstimatedUsd: 142500,
    },
  },
  {
    id: 'WB-2026-004',
    waybillNumber: 'LGF-331099-AIR',
    tenantId: 'tenant-apex',
    status: 'IN_TRANSIT',
    mode: 'AIR',
    origin: {
      facilityCode: 'ORD-WH1',
      city: 'Chicago',
      country: 'United States',
      coordinates: [41.9742, -87.9073],
      address: 'O’Hare International Air Cargo Ramp 2',
    },
    destination: {
      facilityCode: 'RTM-WH1',
      city: 'Rotterdam',
      country: 'Netherlands',
      coordinates: [51.9244, 4.4777],
      address: 'Rotterdam The Hague Airport Cargo Facility',
    },
    assignedVehicleId: 'VEH-AIR-777',
    carrier: 'LogiFlow SkyExpress Global',
    hazmatClass: 'NONE',
    totalWeightKg: 42000,
    totalVolumeM3: 210,
    totalDeclaredValueUsd: 8420000,
    eta: '2026-10-24T22:00:00Z',
    dispatchTime: '2026-10-24T14:00:00Z',
    items: [
      {
        sku: 'SKU-AERO-TURB-BLD',
        description: 'Titanium-Aluminide Turbofan Compressor Stator Blades',
        quantity: 680,
        unitWeightKg: 3.2,
        totalWeightKg: 2176,
        volumeM3: 5.4,
        hsCode: '8411.91.00',
        declaredValueUsd: 1258000,
        isPerishable: false,
      },
    ],
    auditTrail: [
      {
        timestamp: '2026-10-24T14:00:00Z',
        actorId: 'usr-admin-01',
        actorName: 'Dispatcher Frank Mueller',
        action: 'FLIGHT_AIRBORNE',
        notes: 'Transatlantic corridor assigned flight level FL360.',
      },
    ],
    customsStatus: {
      riskScore: 18,
      inspectionRequired: false,
      declarationHash: '8b1a9953c4611296a827abf8c47804d7',
      dutyEstimatedUsd: 38200,
    },
  },
  {
    id: 'WB-2026-005',
    waybillNumber: 'LGF-109288-HOLD',
    tenantId: 'tenant-apex',
    status: 'CUSTOMS_HOLD',
    mode: 'ROAD',
    origin: {
      facilityCode: 'HAM-WH4',
      city: 'Hamburg',
      country: 'Germany',
      coordinates: [53.5042, 9.9324],
      address: 'Altenwerder Docks, Hamburg',
    },
    destination: {
      facilityCode: 'RTM-WH1',
      city: 'Rotterdam',
      country: 'Netherlands',
      coordinates: [51.9244, 4.4777],
      address: 'Europort Terminal 2',
    },
    carrier: 'Apex Cross-Border Logistics',
    hazmatClass: 'CLASS_3_FLAMMABLE_LIQUIDS',
    totalWeightKg: 22000,
    totalVolumeM3: 45,
    totalDeclaredValueUsd: 395000,
    eta: '2026-10-25T11:00:00Z',
    items: [
      {
        sku: 'SKU-CHEM-8812',
        description: 'Industrial Polyurethane Prepolymer Reactant',
        quantity: 200,
        unitWeightKg: 110,
        totalWeightKg: 22000,
        volumeM3: 45,
        hsCode: '3909.50.00',
        declaredValueUsd: 395000,
        isPerishable: false,
      },
    ],
    auditTrail: [
      {
        timestamp: '2026-10-24T09:12:00Z',
        actorId: 'cust-officer-9',
        actorName: 'Customs Officer Schmidt',
        action: 'CUSTOMS_INSPECTION_FLAGGED',
        previousState: 'IN_TRANSIT',
        newState: 'CUSTOMS_HOLD',
        notes: 'Discrepancy in SDS hazmat flash point documentation. Physical inspection scheduled.',
      },
    ],
    customsStatus: {
      riskScore: 88,
      inspectionRequired: true,
      declarationHash: '4f9b2d0183bce491a',
      dutyEstimatedUsd: 28400,
    },
  },
];

// =========================================================================
// REPOSITORY CLASS
// =========================================================================

class LogisticsRepository {
  private waybills: Map<string, WaybillDocument> = new Map();
  private vehicles: Map<string, Vehicle> = new Map();
  private warehouses: Map<string, WarehouseFacility> = new Map();
  private inventory: Map<string, InventoryItem> = new Map();
  private geofences: Map<string, GeofenceZone> = new Map();

  constructor() {
    this.initSeedData();
  }

  private initSeedData(): void {
    SEED_WAYBILLS.forEach((w) => this.waybills.set(w.id, { ...w }));
    SEED_VEHICLES.forEach((v) => this.vehicles.set(v.id, { ...v }));
    SEED_WAREHOUSES.forEach((wh) => this.warehouses.set(wh.id, { ...wh }));
    SEED_INVENTORY.forEach((inv) => this.inventory.set(inv.sku, { ...inv }));
    SEED_GEOFENCES.forEach((g) => this.geofences.set(g.id, { ...g }));
    logger.info('DATABASE', `Seed data initialized: ${this.waybills.size} waybills, ${this.vehicles.size} vehicles, ${this.inventory.size} SKUs`);
  }

  // --- WAYBILLS ---
  public getWaybills(tenantId?: string): WaybillDocument[] {
    const list = Array.from(this.waybills.values());
    return tenantId ? list.filter((w) => w.tenantId === tenantId) : list;
  }

  public getWaybillById(id: string): WaybillDocument | undefined {
    return this.waybills.get(id);
  }

  public saveWaybill(waybill: WaybillDocument): WaybillDocument {
    this.waybills.set(waybill.id, waybill);
    logger.info('WAYBILL_REPO', `Updated waybill ${waybill.id} status=${waybill.status}`);
    return waybill;
  }

  // --- VEHICLES & TELEMATICS ---
  public getVehicles(tenantId?: string): Vehicle[] {
    const list = Array.from(this.vehicles.values());
    return tenantId ? list.filter((v) => v.tenantId === tenantId) : list;
  }

  public getVehicleById(id: string): Vehicle | undefined {
    return this.vehicles.get(id);
  }

  public updateVehicleLocation(
    id: string,
    coords: [number, number],
    speedKmh: number,
    heading: number,
    additionalTelematics?: Partial<Vehicle['telematics']>
  ): Vehicle | undefined {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;

    vehicle.currentLocation = {
      coordinates: coords,
      speedKmh,
      heading,
      lastPingTime: new Date().toISOString(),
    };

    vehicle.telematics = {
      ...vehicle.telematics,
      coordinates: coords,
      speedKmh,
      headingDegrees: heading,
      timestamp: new Date().toISOString(),
      ...additionalTelematics,
    };

    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  // --- WAREHOUSES & INVENTORY ---
  public getWarehouses(): WarehouseFacility[] {
    return Array.from(this.warehouses.values());
  }

  public getInventory(): InventoryItem[] {
    return Array.from(this.inventory.values());
  }

  public updateInventoryQuantity(sku: string, qtyDelta: number): InventoryItem | undefined {
    const item = this.inventory.get(sku);
    if (!item) return undefined;
    item.quantityOnHand = Math.max(0, item.quantityOnHand + qtyDelta);
    this.inventory.set(sku, item);
    return item;
  }

  // --- GEOFENCES ---
  public getGeofences(): GeofenceZone[] {
    return Array.from(this.geofences.values());
  }

  // Reset or reseed
  public resetToSeed(): void {
    this.waybills.clear();
    this.vehicles.clear();
    this.warehouses.clear();
    this.inventory.clear();
    this.geofences.clear();
    this.initSeedData();
  }
}

export const repository = new LogisticsRepository();
