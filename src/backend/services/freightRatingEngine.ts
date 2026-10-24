/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Multi-Modal Freight Rating & Contract Tariff Engine
 * Calculates NMFC freight class density ratings, dimensional weight factors,
 * DOE diesel fuel surcharges, and comprehensive accessorial charges.
 */

import { logger } from '../../packages/logger/index.ts';

export type TransportMode = 'LTL' | 'FTL' | 'AIR_FREIGHT' | 'OCEAN_FCL' | 'OCEAN_LCL' | 'RAIL_INTERMODAL';

export interface FreightRateRequest {
  originPostalCode: string;
  destinationPostalCode: string;
  originCountry: string;
  destinationCountry: string;
  transportMode: TransportMode;
  actualWeightLbs: number;
  dimensionsInches: [number, number, number]; // [L, W, H]
  isStackable: boolean;
  accessorials: {
    liftgatePickup?: boolean;
    liftgateDelivery?: boolean;
    residentialDelivery?: boolean;
    insideDelivery?: boolean;
    appointmentScheduled?: boolean;
    hazardousMaterials?: boolean;
    protectFromFreezingReefer?: boolean;
    whiteGloveUnpack?: boolean;
  };
  declaredCargoValueUsd?: number;
}

export interface AccessorialItem {
  code: string;
  name: string;
  rateUsd: number;
  calculationMethod: 'FLAT' | 'PERCENTAGE_OF_BASE' | 'PER_HUNDREDWEIGHT';
}

export interface FreightRateQuote {
  quoteId: string;
  transportMode: TransportMode;
  origin: string;
  destination: string;
  billedWeightLbs: number;
  actualWeightLbs: number;
  dimensionalWeightLbs: number;
  nmfcClass: number; // 50 to 500
  densityPcf: number; // lbs per cubic foot
  baseFreightRateUsd: number;
  fuelSurchargeUsd: number;
  fuelSurchargePercent: number;
  accessorialChargesUsd: number;
  accessorialsBreakdown: AccessorialItem[];
  totalFreightCostUsd: number;
  transitDaysEstimate: number;
  carrierContractName: string;
  validUntilIso: string;
}

export class FreightRatingEngine {
  // Current DOE National Average Diesel Fuel Price ($/gallon)
  public static readonly CURRENT_DOE_DIESEL_PRICE = 3.842;

  /**
   * Determine NMFC Freight Class based on Density (Pounds Per Cubic Foot - PCF)
   * Standard CCSB (Commodity Classification Standards Board) 18-sub-tier scale
   */
  public static calculateNmfcClassFromDensity(densityPcf: number): number {
    if (densityPcf < 1) return 500;
    if (densityPcf < 2) return 400;
    if (densityPcf < 3) return 300;
    if (densityPcf < 4) return 250;
    if (densityPcf < 5) return 200;
    if (densityPcf < 6) return 175;
    if (densityPcf < 7) return 150;
    if (densityPcf < 8) return 125;
    if (densityPcf < 9) return 110;
    if (densityPcf < 10.5) return 100;
    if (densityPcf < 12) return 92.5;
    if (densityPcf < 13.5) return 85;
    if (densityPcf < 15) return 77.5;
    if (densityPcf < 22.5) return 70;
    if (densityPcf < 30) return 65;
    if (densityPcf < 35) return 60;
    if (densityPcf < 50) return 55;
    return 50;
  }

  /**
   * Calculate Dimensional (Volumetric) Weight in Lbs
   * DIM Factor: 139 (International Air / IATA standard), 166 (Domestic Trucking / LTL standard)
   */
  public static calculateDimensionalWeight(
    lengthIn: number,
    widthIn: number,
    heightIn: number,
    mode: TransportMode
  ): { dimensionalWeightLbs: number; cubicFeet: number; densityPcf: (actualLbs: number) => number } {
    const cubicInches = lengthIn * widthIn * heightIn;
    const cubicFeet = cubicInches / 1728;

    const dimDivisor = mode === 'AIR_FREIGHT' ? 139 : 166;
    const dimensionalWeightLbs = Math.round((cubicInches / dimDivisor) * 10) / 10;

    return {
      dimensionalWeightLbs,
      cubicFeet: Math.round(cubicFeet * 100) / 100,
      densityPcf: (actualLbs: number) => (cubicFeet > 0 ? Math.round((actualLbs / cubicFeet) * 10) / 10 : 0)
    };
  }

  /**
   * DOE Fuel Surcharge Table:
   * Baseline $1.25/gal -> 0.5% per 5-cent increment above baseline
   */
  public static calculateFuelSurchargePercent(dieselPrice: number = this.CURRENT_DOE_DIESEL_PRICE): number {
    const baseline = 1.25;
    if (dieselPrice <= baseline) return 0;
    const increments = Math.floor((dieselPrice - baseline) / 0.05);
    const surchargePercent = increments * 0.5;
    return Math.round(surchargePercent * 10) / 10;
  }

  /**
   * Comprehensive Multi-Carrier Rating
   */
  public static calculateRateQuote(req: FreightRateRequest): FreightRateQuote {
    const { lengthIn, widthIn, heightIn } = {
      lengthIn: req.dimensionsInches[0],
      widthIn: req.dimensionsInches[1],
      heightIn: req.dimensionsInches[2]
    };

    const dimCalc = this.calculateDimensionalWeight(lengthIn, widthIn, heightIn, req.transportMode);
    const densityPcf = dimCalc.densityPcf(req.actualWeightLbs);
    const nmfcClass = this.calculateNmfcClassFromDensity(densityPcf);

    // Billed weight is Greater of Actual vs Dimensional
    const billedWeightLbs = Math.max(req.actualWeightLbs, dimCalc.dimensionalWeightLbs);
    const cwt = billedWeightLbs / 100; // Hundredweight (CWT)

    // Base Freight Rate based on distance, mode, and class
    let baseRatePerCwt = 32.50;
    if (req.transportMode === 'AIR_FREIGHT') baseRatePerCwt = 145.0;
    else if (req.transportMode === 'RAIL_INTERMODAL') baseRatePerCwt = 18.20;
    else if (req.transportMode === 'OCEAN_FCL') baseRatePerCwt = 12.0;

    // NMFC Class multiplier: higher classes (lower density) pay more per cwt
    const classMultiplier = 1 + ((nmfcClass - 50) / 100) * 0.45;
    const baseFreightRate = Math.round(cwt * baseRatePerCwt * classMultiplier * 100) / 100;

    // Fuel Surcharge
    const fscPercent = this.calculateFuelSurchargePercent();
    const fuelSurchargeUsd = Math.round((baseFreightRate * (fscPercent / 100)) * 100) / 100;

    // Accessorials evaluation
    const accessorialsList: AccessorialItem[] = [];
    if (req.accessorials.liftgatePickup) {
      accessorialsList.push({ code: 'LGP', name: 'Liftgate Pickup Service', rateUsd: 75.0, calculationMethod: 'FLAT' });
    }
    if (req.accessorials.liftgateDelivery) {
      accessorialsList.push({ code: 'LGD', name: 'Liftgate Delivery Service', rateUsd: 75.0, calculationMethod: 'FLAT' });
    }
    if (req.accessorials.residentialDelivery) {
      accessorialsList.push({ code: 'RES', name: 'Residential Delivery Surcharge', rateUsd: 95.0, calculationMethod: 'FLAT' });
    }
    if (req.accessorials.insideDelivery) {
      accessorialsList.push({ code: 'INS', name: 'Inside Delivery & Placement', rateUsd: 120.0, calculationMethod: 'FLAT' });
    }
    if (req.accessorials.hazardousMaterials) {
      accessorialsList.push({ code: 'HAZ', name: 'DOT Hazmat Placard Handling', rateUsd: 175.0, calculationMethod: 'FLAT' });
    }
    if (req.accessorials.protectFromFreezingReefer) {
      accessorialsList.push({ code: 'PFF', name: 'Protect from Freezing / Heated Trailer', rateUsd: 110.0, calculationMethod: 'FLAT' });
    }
    if (req.accessorials.whiteGloveUnpack) {
      accessorialsList.push({ code: 'WGL', name: 'White Glove Uncrating & Debris Removal', rateUsd: 250.0, calculationMethod: 'FLAT' });
    }

    const totalAccessorials = accessorialsList.reduce((sum, a) => sum + a.rateUsd, 0);
    const totalFreightCost = Math.round((baseFreightRate + fuelSurchargeUsd + totalAccessorials) * 100) / 100;

    const transitDays = req.transportMode === 'AIR_FREIGHT' ? 1 : req.transportMode === 'RAIL_INTERMODAL' ? 5 : 3;

    logger.info('FREIGHT_RATING', `Generated rate quote for ${billedWeightLbs} lbs, Class ${nmfcClass}: Total=$${totalFreightCost}`);

    return {
      quoteId: `QTE-RT-${Math.floor(100000 + Math.random() * 900000)}`,
      transportMode: req.transportMode,
      origin: `${req.originPostalCode}, ${req.originCountry}`,
      destination: `${req.destinationPostalCode}, ${req.destinationCountry}`,
      billedWeightLbs,
      actualWeightLbs: req.actualWeightLbs,
      dimensionalWeightLbs: dimCalc.dimensionalWeightLbs,
      nmfcClass,
      densityPcf,
      baseFreightRateUsd: baseFreightRate,
      fuelSurchargeUsd,
      fuelSurchargePercent: fscPercent,
      accessorialChargesUsd: totalAccessorials,
      accessorialsBreakdown: accessorialsList,
      totalFreightCostUsd: totalFreightCost,
      transitDaysEstimate: transitDays,
      carrierContractName: 'LogiFlow Master Carrier Agreement 2026',
      validUntilIso: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    };
  }
}
