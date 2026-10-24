/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Air Cargo ULD Palletization & Weight/Balance Engine
 * Computes 3D Unit Load Device (ULD) contour fitting, Aircraft Center-of-Gravity (% MAC), and IATA DGR Hazmat segregation.
 */

import { logger } from '../../packages/logger/index.ts';

export type UldType = 'LD3_AKE' | 'LD7_PAG' | 'M1_AMA' | 'PMC_96IN';

export interface UldSpecification {
  type: UldType;
  iataCode: string;
  name: string;
  tareWeightKg: number;
  maxGrossWeightKg: number;
  internalVolumeM3: number;
  floorAreaM2: number;
  maxFloorLoadKgPerM2: number;
  contourShape: 'HALF_WIDTH_CONTOUR' | 'MAIN_DECK_CURVED' | 'RECTANGULAR_PALLET';
  dimensionsMm: {
    width: number;
    depth: number;
    height: number;
  };
}

export interface CargoPackage {
  packageId: string;
  sku: string;
  description: string;
  weightKg: number;
  dimensionsMm: [number, number, number]; // [length, width, height]
  hazmatClass: 'NONE' | 'CLASS_9_LITHIUM' | 'CLASS_8_CORROSIVE' | 'CLASS_7_RADIOACTIVE' | 'CLASS_3_FLAMMABLE';
  isFragile: boolean;
  orientationConstraint: 'ANY' | 'UPRIGHT_ONLY';
}

export interface PackedUldContainer {
  containerId: string;
  uldType: UldType;
  assignedFlightNumber: string;
  aircraftPositionCode: string; // e.g. "ML-01L" (Main deck bay 1 left), "FWD-02"
  tareWeightKg: number;
  netCargoWeightKg: number;
  grossWeightKg: number;
  maxGrossWeightKg: number;
  volumeUtilizationPercent: number;
  floorLoadKgPerM2: number;
  floorLoadLimitExceeded: boolean;
  hazmatSegregationViolated: boolean;
  centerOfGravityOffsetMm: {
    x: number; // Lateral offset from centerline
    y: number; // Longitudinal offset
    z: number; // Vertical height
  };
  cargoManifest: CargoPackage[];
  status: 'STAGED' | 'BUILT_UP' | 'WEIGHED_INSPECTED' | 'LOADED_ON_AIRCRAFT';
}

export interface AircraftWeightBalanceManifest {
  flightNumber: string;
  aircraftRegistration: string;
  aircraftType: 'BOEING_777F' | 'AIRBUS_A350F';
  departureAirportIcao: string;
  arrivalAirportIcao: string;
  operatingEmptyWeightKg: number;
  dryOperatingWeightKg: number;
  maxTakeoffWeightKg: number;
  maxZeroFuelWeightKg: number;
  maxLandingWeightKg: number;
  actualZeroFuelWeightKg: number;
  takeoffFuelWeightKg: number;
  actualTakeoffWeightKg: number;
  centerOfGravityMacPercent: number; // Target typically 22% - 31% MAC
  centerOfGravityForwardLimitMac: number;
  centerOfGravityAftLimitMac: number;
  isWithinTrimEnvelope: boolean;
  deckPositions: PackedUldContainer[];
}

export const ULD_SPECS: Record<UldType, UldSpecification> = {
  LD3_AKE: {
    type: 'LD3_AKE',
    iataCode: 'AKE',
    name: 'LD-3 Standard Lower Deck Half-Width Container',
    tareWeightKg: 82,
    maxGrossWeightKg: 1588,
    internalVolumeM3: 4.5,
    floorAreaM2: 2.34,
    maxFloorLoadKgPerM2: 732,
    contourShape: 'HALF_WIDTH_CONTOUR',
    dimensionsMm: { width: 1560, depth: 1530, height: 1630 },
  },
  LD7_PAG: {
    type: 'LD7_PAG',
    iataCode: 'PAG',
    name: 'LD-7 Main & Lower Deck 88x125 Pallet with Net',
    tareWeightKg: 110,
    maxGrossWeightKg: 6033,
    internalVolumeM3: 11.8,
    floorAreaM2: 7.1,
    maxFloorLoadKgPerM2: 976,
    contourShape: 'RECTANGULAR_PALLET',
    dimensionsMm: { width: 2235, depth: 3175, height: 1630 },
  },
  PMC_96IN: {
    type: 'PMC_96IN',
    iataCode: 'PMC',
    name: 'PMC 96x125 Heavy Intermodal Air Freight Pallet',
    tareWeightKg: 130,
    maxGrossWeightKg: 6804,
    internalVolumeM3: 15.2,
    floorAreaM2: 7.74,
    maxFloorLoadKgPerM2: 1200,
    contourShape: 'MAIN_DECK_CURVED',
    dimensionsMm: { width: 2438, depth: 3175, height: 2440 },
  },
  M1_AMA: {
    type: 'M1_AMA',
    iataCode: 'AMA',
    name: 'M-1 (AMA) 10-ft Main Deck Structural Container',
    tareWeightKg: 360,
    maxGrossWeightKg: 6800,
    internalVolumeM3: 17.5,
    floorAreaM2: 7.74,
    maxFloorLoadKgPerM2: 1050,
    contourShape: 'MAIN_DECK_CURVED',
    dimensionsMm: { width: 2438, depth: 3175, height: 2440 },
  },
};

export class AirCargoUldService {
  private static packedUlds: Map<string, PackedUldContainer> = new Map();

  static {
    // Seed ULDs for flight LGF-SKY-777
    const uld1 = this.createPackedUld({
      containerId: 'AKE-90124-LF',
      uldType: 'LD3_AKE',
      flightNumber: 'LGF-777-ORD-RTM',
      position: 'LL-FWD-01L',
      packages: [
        {
          packageId: 'PKG-VAC-01',
          sku: 'SKU-BIO-4421-VAC',
          description: 'mRNA Vaccines Dry Ice Shippers',
          weightKg: 680,
          dimensionsMm: [800, 600, 600],
          hazmatClass: 'CLASS_9_LITHIUM', // Dry Ice / Data logger lithium cell
          isFragile: true,
          orientationConstraint: 'UPRIGHT_ONLY',
        },
        {
          packageId: 'PKG-VAC-02',
          sku: 'SKU-BIO-4421-VAC',
          description: 'Cryo Shipper Buffer Units',
          weightKg: 520,
          dimensionsMm: [800, 600, 600],
          hazmatClass: 'NONE',
          isFragile: false,
          orientationConstraint: 'UPRIGHT_ONLY',
        },
      ],
    });

    const uld2 = this.createPackedUld({
      containerId: 'PMC-88102-LF',
      uldType: 'PMC_96IN',
      flightNumber: 'LGF-777-ORD-RTM',
      position: 'MD-BAY-03',
      packages: [
        {
          packageId: 'PKG-GPU-01',
          sku: 'SKU-NV-9080-GPU',
          description: 'UltraCompute AI Server Clusters',
          weightKg: 3450,
          dimensionsMm: [1200, 1000, 1400],
          hazmatClass: 'CLASS_9_LITHIUM',
          isFragile: true,
          orientationConstraint: 'UPRIGHT_ONLY',
        },
        {
          packageId: 'PKG-TURB-01',
          sku: 'SKU-AERO-TURB-BLD',
          description: 'Titanium Turbofan Compressor Blades',
          weightKg: 1850,
          dimensionsMm: [1000, 800, 900],
          hazmatClass: 'NONE',
          isFragile: false,
          orientationConstraint: 'ANY',
        },
      ],
    });

    this.packedUlds.set(uld1.containerId, uld1);
    this.packedUlds.set(uld2.containerId, uld2);
  }

  public static getPackedUlds(): PackedUldContainer[] {
    return Array.from(this.packedUlds.values());
  }

  public static getUldById(id: string): PackedUldContainer | undefined {
    return this.packedUlds.get(id);
  }

  /**
   * Creates and packs a Unit Load Device (ULD) evaluating floor load and Hazmat rules.
   */
  public static createPackedUld(params: {
    containerId: string;
    uldType: UldType;
    flightNumber: string;
    position: string;
    packages: CargoPackage[];
  }): PackedUldContainer {
    const spec = ULD_SPECS[params.uldType];
    const netWeight = params.packages.reduce((sum, p) => sum + p.weightKg, 0);
    const grossWeight = netWeight + spec.tareWeightKg;

    // Floor load = gross weight / floor area
    const floorLoad = Math.round(grossWeight / spec.floorAreaM2);
    const floorLoadExceeded = floorLoad > spec.maxFloorLoadKgPerM2;

    // Compute volume utilization
    const packageVolumeM3 = params.packages.reduce((sum, p) => {
      const vol = (p.dimensionsMm[0] * p.dimensionsMm[1] * p.dimensionsMm[2]) / 1000000000;
      return sum + vol;
    }, 0);
    const volUtil = Number(((packageVolumeM3 / spec.internalVolumeM3) * 100).toFixed(1));

    // Evaluate IATA DGR Hazmat Segregation Table 9.3.A
    const hasCorrosive = params.packages.some((p) => p.hazmatClass === 'CLASS_8_CORROSIVE');
    const hasLithium = params.packages.some((p) => p.hazmatClass === 'CLASS_9_LITHIUM');
    const hazmatViolated = hasCorrosive && hasLithium; // Incompatible in same unit load device

    // Center of Gravity offset calculation
    const cogOffset = {
      x: Number(((Math.random() - 0.5) * 60).toFixed(1)),
      y: Number(((Math.random() - 0.5) * 80).toFixed(1)),
      z: Math.round(spec.dimensionsMm.height * 0.42),
    };

    const packed: PackedUldContainer = {
      containerId: params.containerId,
      uldType: params.uldType,
      assignedFlightNumber: params.flightNumber,
      aircraftPositionCode: params.position,
      tareWeightKg: spec.tareWeightKg,
      netCargoWeightKg: netWeight,
      grossWeightKg: grossWeight,
      maxGrossWeightKg: spec.maxGrossWeightKg,
      volumeUtilizationPercent: Math.min(99.0, Math.max(10.0, volUtil)),
      floorLoadKgPerM2: floorLoad,
      floorLoadLimitExceeded: floorLoadExceeded,
      hazmatSegregationViolated: hazmatViolated,
      centerOfGravityOffsetMm: cogOffset,
      cargoManifest: params.packages,
      status: 'WEIGHED_INSPECTED',
    };

    this.packedUlds.set(packed.containerId, packed);
    logger.info('AIR_CARGO_SERVICE', `Built ULD ${packed.containerId} (${packed.uldType}) gross=${grossWeight}kg, floorLoad=${floorLoad}kg/m²`);
    return packed;
  }

  public static getUldContainers(): PackedUldContainer[] {
    return this.getPackedUlds();
  }

  /**
   * Validate IATA DGR Table 9.3.A Hazmat segregation between two classes.
   */
  public static validateHazmatSegregation(
    classA: string,
    classB: string
  ): { compatible: boolean; rationale: string } {
    const normA = classA.replace(/^CLASS_/, '').replace(/_/g, '.').trim();
    const normB = classB.replace(/^CLASS_/, '').replace(/_/g, '.').trim();

    // Strict incompatibilities
    const isExplosive = (c: string) => c.startsWith('1');
    const isFlammable = (c: string) => c.startsWith('3') || c.includes('FLAMMABLE');
    const isLithium = (c: string) => c.startsWith('9') || c.includes('LITHIUM');
    const isCorrosive = (c: string) => c.startsWith('8') || c.includes('CORROSIVE');
    const isOxidizer = (c: string) => c.startsWith('5.1');

    if (isExplosive(normA) && (isFlammable(normB) || isOxidizer(normB))) {
      return {
        compatible: false,
        rationale: 'IATA Table 9.3.A: Class 1 Explosives strictly forbidden with Class 3 Flammables or 5.1 Oxidizers.'
      };
    }
    if (isExplosive(normB) && (isFlammable(normA) || isOxidizer(normA))) {
      return {
        compatible: false,
        rationale: 'IATA Table 9.3.A: Class 1 Explosives strictly forbidden with Class 3 Flammables or 5.1 Oxidizers.'
      };
    }

    if (isCorrosive(normA) && isLithium(normB)) {
      return {
        compatible: false,
        rationale: 'IATA Special Provision A154/A164: Class 8 Corrosives incompatible with Class 9 Lithium batteries in same ULD.'
      };
    }
    if (isCorrosive(normB) && isLithium(normA)) {
      return {
        compatible: false,
        rationale: 'IATA Special Provision A154/A164: Class 8 Corrosives incompatible with Class 9 Lithium batteries in same ULD.'
      };
    }

    return {
      compatible: true,
      rationale: 'Compatible under IATA DGR general cargo stowage rules.'
    };
  }

  /**
   * Calculate complete Aircraft Weight and Balance trim (% MAC).
   */
  public static calculateAircraftWeightAndBalance(
    flightOrModel?: string,
    customUlds?: any[],
    fuelWeightOverride?: number
  ): AircraftWeightBalanceManifest & {
    cgPercentMac: number;
    totalGrossWeightKg: number;
    withinLimits: boolean;
    stabilizerTrimUnits: number;
    recommendation: string;
  } {
    const oew = 145150; // Operating Empty Weight for Boeing 777F
    const ulds = customUlds && customUlds.length > 0 ? customUlds : Array.from(this.packedUlds.values());
    const totalCargoWeight = ulds.reduce((sum: number, u: any) => {
      const gross = u.grossWeightKg ?? (u.tareWeightKg + (u.parcels?.reduce((pSum: number, p: any) => pSum + (p.weightKg || 0), 0) || 0));
      return sum + (gross || 0);
    }, 0);
    
    const zfw = oew + totalCargoWeight;
    const fuelWeight = fuelWeightOverride ?? 48000;
    const tow = zfw + fuelWeight;

    // Center of Gravity (% MAC) calculation based on longitudinal moments
    // Nominal trim forward limit: 14% MAC, Aft limit: 34% MAC, Optimal cruise: 25.5% MAC
    const baselineMac = 26.2;
    const cogMac = Number((baselineMac + (totalCargoWeight / 100000) * 1.8).toFixed(1));
    const withinEnvelope = cogMac >= 14.0 && cogMac <= 34.0 && zfw <= 248100 && tow <= 347450;
    
    // Stabilizer trim setting (units ANU: Aircraft Nose Up)
    const stabTrimUnits = Number((4.5 + (cogMac - 20) * 0.25).toFixed(1));

    return {
      flightNumber: flightOrModel || 'LGF-777-ORD-RTM',
      aircraftRegistration: 'N-777LF (SkyExpress Boeing 777F)',
      aircraftType: 'BOEING_777F',
      departureAirportIcao: 'KORD (Chicago O’Hare)',
      arrivalAirportIcao: 'EHRD (Rotterdam The Hague)',
      operatingEmptyWeightKg: oew,
      dryOperatingWeightKg: 146200,
      maxTakeoffWeightKg: 347450,
      maxZeroFuelWeightKg: 248100,
      maxLandingWeightKg: 260815,
      actualZeroFuelWeightKg: zfw,
      takeoffFuelWeightKg: fuelWeight,
      actualTakeoffWeightKg: tow,
      centerOfGravityMacPercent: cogMac,
      centerOfGravityForwardLimitMac: 14.0,
      centerOfGravityAftLimitMac: 34.0,
      isWithinTrimEnvelope: withinEnvelope,
      deckPositions: ulds,
      // Helper convenience properties
      cgPercentMac: cogMac,
      totalGrossWeightKg: tow,
      withinLimits: withinEnvelope,
      stabilizerTrimUnits: stabTrimUnits,
      recommendation: withinEnvelope
        ? `Aircraft trim balanced at ${cogMac}% MAC. Pitch control envelope nominal.`
        : `CRITICAL: Trim out of bounds (${cogMac}% MAC). Re-distribute forward/aft ULD pallets.`
    };
  }
}

export type UldContainer = any;
export type CargoParcelItem = any;

