/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Intermodal Rail & Block Train Scheduling Service
 * Implements Class I Railroad interline exchanges (BNSF, UP, CSX, NS),
 * 286k Gross Rail Load (GRL) double-stack well car loading, hump yard classification,
 * and dynamic regenerative braking energy recovery.
 */

import { logger } from '../../packages/logger/index.ts';

export type RailroadOperator = 'BNSF' | 'UNION_PACIFIC' | 'CSX' | 'NORFOLK_SOUTHERN' | 'CANADIAN_NATIONAL';
export type WellCarType = 'STAND_ALONE_53FT' | '3_PACK_ARTICULATED' | '5_PACK_WELL_CAR';
export type RailBlockStatus = 'CLASSIFYING_IN_YARD' | 'INSPECTION_AIR_BRAKE' | 'MAINLINE_TRANSIT' | 'INTERCHANGE_HANDOFF' | 'ARRIVED_RAMP';

export interface IntermodalContainerUnit {
  containerNumber: string;
  sizeFt: 20 | 40 | 45 | 53;
  tareWeightLbs: number;
  cargoWeightLbs: number;
  totalWeightLbs: number;
  isHazmat: boolean;
  unNumber?: string;
  destinationRampCode: string;
  isReefer: boolean;
}

export interface WellCarSlot {
  wellCarId: string;
  unitPositionIndex: number; // 1 to 5 for multi-pack
  wellType: WellCarType;
  maxGrossWeightLbs: number; // Standard 286,000 lbs GRL
  bottomContainer?: IntermodalContainerUnit;
  topContainer?: IntermodalContainerUnit;
  wellAxleWeightLbs: number;
  overweightViolation: boolean;
}

export interface UnitTrainManifest {
  trainSymbol: string; // e.g. "Q-NYCLAC" (CSX Priority Intermodal)
  operatingRailroad: RailroadOperator;
  leadLocomotiveId: string;
  trailingLocomotivesCount: number;
  totalHorsepowerHp: number;
  originIntermodalRamp: string;
  destinationIntermodalRamp: string;
  interchangeJunctionPoint?: string; // e.g. Chicago Clearing Yard
  totalTrainLengthFeet: number;
  totalTrailingTonnageTons: number;
  wellCarsCount: number;
  totalContainersLoaded: number;
  status: RailBlockStatus;
  currentMilepost: string;
  averageSpeedMph: number;
  regenerativeBrakeEnergyKwh: number;
  dieselGallonsConsumed: number;
  slots: WellCarSlot[];
}

export class IntermodalRailService {
  // Major North American Intermodal Terminals & Classification Hump Yards
  public static readonly RAMPS_DIRECTORY = {
    CHI_CLEARING: { code: 'CHI_CLEARING', name: 'Chicago Clearing Hump Yard', city: 'Chicago, IL', railroad: 'BRC' },
    LAX_HOBART: { code: 'LAX_HOBART', name: 'BNSF Hobart Intermodal Facility', city: 'Los Angeles, CA', railroad: 'BNSF' },
    DFW_ALLIANCE: { code: 'DFW_ALLIANCE', name: 'Alliance Intermodal Logistics Park', city: 'Fort Worth, TX', railroad: 'BNSF' },
    NWK_DINKY: { code: 'NWK_DINKY', name: 'CSX South Kearny Intermodal Ramp', city: 'Kearny / Newark, NJ', railroad: 'CSX' },
    ATL_INMAN: { code: 'ATL_INMAN', name: 'Norfolk Southern Inman Yard', city: 'Atlanta, GA', railroad: 'NORFOLK_SOUTHERN' }
  };

  private static unitTrains: UnitTrainManifest[] = [
    {
      trainSymbol: 'S-LATCHI-1-24',
      operatingRailroad: 'BNSF',
      leadLocomotiveId: 'BNSF-ET44C4-3829',
      trailingLocomotivesCount: 3,
      totalHorsepowerHp: 17600,
      originIntermodalRamp: 'LAX_HOBART',
      destinationIntermodalRamp: 'CHI_CLEARING',
      interchangeJunctionPoint: 'Galesburg Yard, IL',
      totalTrainLengthFeet: 8450,
      totalTrailingTonnageTons: 11200,
      wellCarsCount: 52,
      totalContainersLoaded: 204,
      status: 'MAINLINE_TRANSIT',
      currentMilepost: 'BNSF Transcon MP 482.1 (Kingman, AZ)',
      averageSpeedMph: 54.2,
      regenerativeBrakeEnergyKwh: 4820,
      dieselGallonsConsumed: 6410,
      slots: [
        {
          wellCarId: 'DTTX-620194',
          unitPositionIndex: 1,
          wellType: '3_PACK_ARTICULATED',
          maxGrossWeightLbs: 286000,
          bottomContainer: {
            containerNumber: 'BNSU-940122',
            sizeFt: 53,
            tareWeightLbs: 9800,
            cargoWeightLbs: 38500,
            totalWeightLbs: 48300,
            isHazmat: false,
            destinationRampCode: 'CHI_CLEARING',
            isReefer: false
          },
          topContainer: {
            containerNumber: 'JBHU-294011',
            sizeFt: 53,
            tareWeightLbs: 9600,
            cargoWeightLbs: 32000,
            totalWeightLbs: 41600,
            isHazmat: false,
            destinationRampCode: 'CHI_CLEARING',
            isReefer: false
          },
          wellAxleWeightLbs: 89900,
          overweightViolation: false
        },
        {
          wellCarId: 'TTX-884102',
          unitPositionIndex: 2,
          wellType: '3_PACK_ARTICULATED',
          maxGrossWeightLbs: 286000,
          bottomContainer: {
            containerNumber: 'MAEU-849102',
            sizeFt: 40,
            tareWeightLbs: 8200,
            cargoWeightLbs: 44000,
            totalWeightLbs: 52200,
            isHazmat: true,
            unNumber: 'UN1993',
            destinationRampCode: 'CHI_CLEARING',
            isReefer: false
          },
          topContainer: {
            containerNumber: 'MSCU-104928',
            sizeFt: 40,
            tareWeightLbs: 8100,
            cargoWeightLbs: 36000,
            totalWeightLbs: 44100,
            isHazmat: false,
            destinationRampCode: 'CHI_CLEARING',
            isReefer: false
          },
          wellAxleWeightLbs: 96300,
          overweightViolation: false
        }
      ]
    },
    {
      trainSymbol: 'I-CHINWK-2-24',
      operatingRailroad: 'CSX',
      leadLocomotiveId: 'CSXT-ES44AH-3190',
      trailingLocomotivesCount: 2,
      totalHorsepowerHp: 13200,
      originIntermodalRamp: 'CHI_CLEARING',
      destinationIntermodalRamp: 'NWK_DINKY',
      interchangeJunctionPoint: 'Berea Interlocking, OH',
      totalTrainLengthFeet: 6200,
      totalTrailingTonnageTons: 8400,
      wellCarsCount: 38,
      totalContainersLoaded: 148,
      status: 'MAINLINE_TRANSIT',
      currentMilepost: 'CSX Water Level Route MP 184 (Syracuse, NY)',
      averageSpeedMph: 48.0,
      regenerativeBrakeEnergyKwh: 3150,
      dieselGallonsConsumed: 4220,
      slots: []
    }
  ];

  /**
   * Return active intermodal block trains
   */
  public static getUnitTrains(): UnitTrainManifest[] {
    return [...this.unitTrains];
  }

  /**
   * Validate double-stack container pairing:
   * Rule 1: Bottom container must be >= top container size (e.g. cannot put 53ft under 40ft unless specifically designed wells).
   * Rule 2: Top container weight cannot exceed bottom container weight by more than 15% (Dynamic Roll Over Stability).
   * Rule 3: Gross Rail Load must not exceed 286,000 lbs.
   */
  public static validateDoubleStackPair(
    bottom: IntermodalContainerUnit,
    top: IntermodalContainerUnit,
    wellCarTareLbs: number = 38000
  ): {
    isValid: boolean;
    violations: string[];
    totalWeightLbs: number;
    weightDistributionRatio: number;
  } {
    const violations: string[] = [];
    const totalWeightLbs = wellCarTareLbs + bottom.totalWeightLbs + top.totalWeightLbs;

    // Rule 1: Size compatibility
    if (bottom.sizeFt < top.sizeFt) {
      violations.push(`AAR Rule 29: Cannot stack larger ${top.sizeFt}ft container on top of smaller ${bottom.sizeFt}ft base unit.`);
    }

    // Rule 2: Top-heavy dynamic overturning moment
    if (top.totalWeightLbs > bottom.totalWeightLbs * 1.15) {
      violations.push(
        `Top container (${top.totalWeightLbs} lbs) exceeds bottom container (${bottom.totalWeightLbs} lbs) by >15%. Critical risk of harmonic roll derailment on curves.`
      );
    }

    // Rule 3: 286k Gross Rail Load limit
    if (totalWeightLbs > 286000) {
      violations.push(
        `Gross Rail Load (${totalWeightLbs} lbs) exceeds maximum allowable Track Class 4 limit of 286,000 lbs.`
      );
    }

    // Rule 4: Hazmat compatibility in double stack
    if (top.isHazmat && !bottom.isHazmat) {
      violations.push(`Hazmat placard unit (${top.unNumber}) must be stowed in bottom well position for emergency responder access.`);
    }

    const ratio = bottom.totalWeightLbs > 0 ? Number((top.totalWeightLbs / bottom.totalWeightLbs).toFixed(2)) : 1.0;

    return {
      isValid: violations.length === 0,
      violations,
      totalWeightLbs,
      weightDistributionRatio: ratio
    };
  }

  /**
   * Hump Yard Classification Sorting Algorithm:
   * Computes optimal classification bowl track assignment based on destination block and train departure schedule.
   */
  public static classifyWellCars(
    cars: { carId: string; destinationRamp: string; cargoWeightTons: number }[]
  ): { trackNumber: number; destinationRamp: string; assignedCars: string[]; totalTons: number }[] {
    const tracksMap = new Map<string, { trackNumber: number; destinationRamp: string; assignedCars: string[]; totalTons: number }>();
    
    let trackCounter = 1;
    for (const car of cars) {
      if (!tracksMap.has(car.destinationRamp)) {
        tracksMap.set(car.destinationRamp, {
          trackNumber: trackCounter++,
          destinationRamp: car.destinationRamp,
          assignedCars: [],
          totalTons: 0
        });
      }

      const track = tracksMap.get(car.destinationRamp)!;
      track.assignedCars.push(car.carId);
      track.totalTons += car.cargoWeightTons;
    }

    logger.info('INTERMODAL_RAIL', `Classified ${cars.length} intermodal cars across ${tracksMap.size} classification bowl tracks.`);
    return Array.from(tracksMap.values());
  }

  /**
   * Dynamic Braking Energy Recovery Simulator:
   * Calculates kWh recovered by AC traction motors acting as generators on downgrade grades (e.g. Tehachapi Loop or Cajon Pass).
   */
  public static calculateRegenerativeEnergyRecovery(
    trainWeightTons: number,
    gradePercent: number, // e.g. 2.2% downgrade
    distanceMiles: number,
    speedMph: number
  ): {
    recoveredKwh: number;
    dieselGallonsOffset: number;
    co2SavedKg: number;
  } {
    // Potential energy loss = mass * g * height
    // Height drop (feet) = distance (miles) * 5280 * (gradePercent / 100)
    const heightDropFt = distanceMiles * 5280 * (gradePercent / 100);
    const heightDropMeters = heightDropFt * 0.3048;
    const massKg = trainWeightTons * 907.185;

    // Potential Energy (Joules)
    const deltaJoules = massKg * 9.81 * heightDropMeters;
    // Locomotive inverter electrical efficiency approx 78%
    const recoveredKwh = (deltaJoules / 3600000) * 0.78;

    // 1 Gallon of diesel = ~37.95 kWh of chemical energy; locomotive thermal efficiency ~35% -> ~13.3 kWh useful mechanical/electrical
    const dieselGallonsOffset = recoveredKwh / 13.3;
    // 1 Gallon diesel = 10.18 kg CO2
    const co2SavedKg = dieselGallonsOffset * 10.18;

    return {
      recoveredKwh: Math.round(recoveredKwh),
      dieselGallonsOffset: Math.round(dieselGallonsOffset * 10) / 10,
      co2SavedKg: Math.round(co2SavedKg * 10) / 10
    };
  }
}
