/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Scope 1/2/3 Carbon Accounting & Decarbonization Engine
 * Implements GLEC Framework & ISO 14083 emissions factors, alternative fuel abatement, and CSRD compliance.
 */

import { logger } from '../../packages/logger/index.ts';

export interface EmissionsBreakdown {
  scope1DirectTonsCo2e: number; // Owned fleet diesel / jet fuel combustion
  scope2IndirectTonsCo2e: number; // Purchased electricity for EV fleet & warehouse facilities
  scope3SupplyChainTonsCo2e: number; // Subcontracted ocean carriers, air cargo, packaging & drayage
  totalTonsCo2e: number;
  intensityGramsCo2ePerTonKm: number; // GLEC metric
  wellToWheelTonsCo2e: number;
  tankToWheelTonsCo2e: number;
}

export interface TradeLaneEmissionProfile {
  laneId: string;
  origin: string;
  destination: string;
  mode: 'OCEAN' | 'ROAD' | 'AIR' | 'RAIL';
  cargoVolumeTonnes: number;
  distanceKm: number;
  conventionalEmissionsTonsCo2e: number;
  abatedEmissionsTonsCo2e: number;
  abatementTechnology: string;
  reductionPercentage: number;
}

export interface CarbonOffsetCredit {
  projectId: string;
  projectName: string;
  registry: 'VERRA_VCS' | 'GOLD_STANDARD' | 'AMERICAN_CARBON_REGISTRY';
  methodology: 'AFFORESTATION' | 'DIRECT_AIR_CAPTURE' | 'OCEAN_ALKALINITY' | 'BIOCHAR';
  location: string;
  vintageYear: number;
  creditsPurchasedTonnes: number;
  costPerTonneUsd: number;
  serialNumber: string;
  verificationHash: string;
}

export interface DecarbonizationTarget {
  targetYear: number;
  baselineYear: number;
  targetReductionPercent: number;
  currentReductionPercent: number;
  projectedTrajectory: {
    year: number;
    businessAsUsualTonnes: number;
    committedDecarbonizationTonnes: number;
    actualEmissionsTonnes?: number;
  }[];
}

export class EsgDecarbonizationService {
  private static offsets: CarbonOffsetCredit[] = [
    {
      projectId: 'VCS-2891',
      projectName: 'Madre de Dios Amazonian Biodiversity Corridor REDD+',
      registry: 'VERRA_VCS',
      methodology: 'AFFORESTATION',
      location: 'Peru',
      vintageYear: 2025,
      creditsPurchasedTonnes: 4500,
      costPerTonneUsd: 14.5,
      serialNumber: 'VCS-2891-2025-0988-12004',
      verificationHash: 'SHA256:7f991b2c4e51804aa',
    },
    {
      projectId: 'GS-7104',
      projectName: 'Icelandic Climeworks Orca Direct Air Capture & Mineralization',
      registry: 'GOLD_STANDARD',
      methodology: 'DIRECT_AIR_CAPTURE',
      location: 'Hellisheidi, Iceland',
      vintageYear: 2026,
      creditsPurchasedTonnes: 1200,
      costPerTonneUsd: 685.0,
      serialNumber: 'GS-7104-DAC-2026-0041-0082',
      verificationHash: 'SHA256:09ba8112fd7491cc',
    },
    {
      projectId: 'ACR-552',
      projectName: 'Pacific Northwest Pyrolysis Biochar Carbon Sequestration',
      registry: 'AMERICAN_CARBON_REGISTRY',
      methodology: 'BIOCHAR',
      location: 'Oregon, USA',
      vintageYear: 2025,
      creditsPurchasedTonnes: 2800,
      costPerTonneUsd: 145.0,
      serialNumber: 'ACR-552-BIO-2025-9912-3341',
      verificationHash: 'SHA256:cc981fa441801bf',
    },
  ];

  private static tradeLanes: TradeLaneEmissionProfile[] = [
    {
      laneId: 'LANE-SHG-RTM',
      origin: 'Shanghai Yangshan Port',
      destination: 'Port of Rotterdam Europort',
      mode: 'OCEAN',
      cargoVolumeTonnes: 48500,
      distanceKm: 19800,
      conventionalEmissionsTonsCo2e: 1420.0,
      abatedEmissionsTonsCo2e: 454.4,
      abatementTechnology: 'Bio-LNG (Dual-Fuel) + Rotor Sails Auxiliary Wind Propulsion',
      reductionPercentage: 68.0,
    },
    {
      laneId: 'LANE-LAX-ORD',
      origin: 'Port of Los Angeles Pier 400',
      destination: 'Chicago Intermodal Logistics Hub',
      mode: 'ROAD',
      cargoVolumeTonnes: 12400,
      distanceKm: 3250,
      conventionalEmissionsTonsCo2e: 840.5,
      abatedEmissionsTonsCo2e: 126.1,
      abatementTechnology: 'Class 8 Electric Haulers & BNSF Electric Intermodal Rail Shuttle',
      reductionPercentage: 85.0,
    },
    {
      laneId: 'LANE-ORD-FRA',
      origin: 'Chicago O’Hare International Airport',
      destination: 'Frankfurt Air Cargo Terminal',
      mode: 'AIR',
      cargoVolumeTonnes: 1850,
      distanceKm: 6980,
      conventionalEmissionsTonsCo2e: 2150.0,
      abatedEmissionsTonsCo2e: 860.0,
      abatementTechnology: 'Neste MY Sustainable Aviation Fuel (SAF 50% Blend)',
      reductionPercentage: 60.0,
    },
    {
      laneId: 'LANE-RTM-HAM',
      origin: 'Europort Terminal Rotterdam',
      destination: 'Altenwerder Docks Hamburg',
      mode: 'ROAD',
      cargoVolumeTonnes: 8200,
      distanceKm: 480,
      conventionalEmissionsTonsCo2e: 98.4,
      abatedEmissionsTonsCo2e: 11.8,
      abatementTechnology: 'HVO100 Renewable Hydrotreated Vegetable Oil Diesel',
      reductionPercentage: 88.0,
    },
  ];

  public static getEmissionsBreakdown(): EmissionsBreakdown {
    const scope1 = 3840.5; // Direct fleet diesel combustion
    const scope2 = 412.0;  // Purchased electricity for mega hub cross-docks & EV chargers
    const scope3 = 11840.0; // Subcontracted ocean shipping, packaging, drayage
    const total = scope1 + scope2 + scope3;

    return {
      scope1DirectTonsCo2e: scope1,
      scope2IndirectTonsCo2e: scope2,
      scope3SupplyChainTonsCo2e: scope3,
      totalTonsCo2e: total,
      intensityGramsCo2ePerTonKm: 48.6,
      wellToWheelTonsCo2e: Math.round(total * 1.18),
      tankToWheelTonsCo2e: Math.round(total),
    };
  }

  public static getTradeLaneProfiles(): TradeLaneEmissionProfile[] {
    return this.tradeLanes;
  }

  public static getCarbonOffsets(): CarbonOffsetCredit[] {
    return this.offsets;
  }

  public static getDecarbonizationTargets(): DecarbonizationTarget {
    return {
      targetYear: 2030,
      baselineYear: 2022,
      targetReductionPercent: 55.0, // Science-Based Targets initiative (SBTi) 1.5°C trajectory
      currentReductionPercent: 32.4,
      projectedTrajectory: [
        { year: 2022, businessAsUsualTonnes: 24500, committedDecarbonizationTonnes: 24500, actualEmissionsTonnes: 24500 },
        { year: 2023, businessAsUsualTonnes: 25800, committedDecarbonizationTonnes: 23200, actualEmissionsTonnes: 23150 },
        { year: 2024, businessAsUsualTonnes: 27100, committedDecarbonizationTonnes: 21400, actualEmissionsTonnes: 21200 },
        { year: 2025, businessAsUsualTonnes: 28500, committedDecarbonizationTonnes: 19100, actualEmissionsTonnes: 18850 },
        { year: 2026, businessAsUsualTonnes: 29900, committedDecarbonizationTonnes: 16800, actualEmissionsTonnes: 16092 },
        { year: 2027, businessAsUsualTonnes: 31400, committedDecarbonizationTonnes: 15100 },
        { year: 2028, businessAsUsualTonnes: 33000, committedDecarbonizationTonnes: 13500 },
        { year: 2029, businessAsUsualTonnes: 34800, committedDecarbonizationTonnes: 12200 },
        { year: 2030, businessAsUsualTonnes: 36600, committedDecarbonizationTonnes: 11025 },
      ],
    };
  }

  /**
   * Calculate alternative fuel emissions reduction and fuel cost delta.
   */
  public static simulateFuelAbatement(params: {
    conventionalDieselLiters: number;
    fuelChoice: 'HVO100_RENEWABLE_DIESEL' | 'BIO_LNG' | 'SAF_50_BLEND' | 'BATTERY_ELECTRIC';
    electricityCarbonIntensityGramsKwh?: number; // e.g. 50 (nuclear) to 400 (coal/gas mix)
  }): {
    conventionalEmissionsKgCo2e: number;
    abatedEmissionsKgCo2e: number;
    co2eAvoidedKg: number;
    reductionPercentage: number;
    fuelCostDeltaUsd: number;
  } {
    const { conventionalDieselLiters, fuelChoice, electricityCarbonIntensityGramsKwh = 280 } = params;
    // Standard diesel = 2.68 kg CO2e / liter
    const baseCo2 = conventionalDieselLiters * 2.68;

    let abatedCo2 = 0;
    let costDelta = 0;

    switch (fuelChoice) {
      case 'HVO100_RENEWABLE_DIESEL':
        // 88% reduction, +$0.25/liter premium
        abatedCo2 = baseCo2 * 0.12;
        costDelta = conventionalDieselLiters * 0.25;
        break;

      case 'BIO_LNG':
        // 82% reduction, +$0.18/liter equivalent
        abatedCo2 = baseCo2 * 0.18;
        costDelta = conventionalDieselLiters * 0.18;
        break;

      case 'SAF_50_BLEND':
        // 60% reduction, +$1.40/liter aviation premium
        abatedCo2 = baseCo2 * 0.4;
        costDelta = conventionalDieselLiters * 1.4;
        break;

      case 'BATTERY_ELECTRIC':
        // 1 liter diesel = ~3.2 kWh electric energy in Class 8 truck
        const kwh = conventionalDieselLiters * 3.2;
        abatedCo2 = (kwh * electricityCarbonIntensityGramsKwh) / 1000;
        // Electricity is cheaper per mile: -$0.35/equivalent liter
        costDelta = -conventionalDieselLiters * 0.35;
        break;
    }

    const avoided = Math.max(0, baseCo2 - abatedCo2);
    const reductionPercent = Number(((avoided / baseCo2) * 100).toFixed(1));

    logger.info('ESG_SERVICE', `Simulated abatement: ${fuelChoice} avoided ${Math.round(avoided)} kg CO2e (${reductionPercent}%)`);

    return {
      conventionalEmissionsKgCo2e: Math.round(baseCo2),
      abatedEmissionsKgCo2e: Math.round(abatedCo2),
      co2eAvoidedKg: Math.round(avoided),
      reductionPercentage: reductionPercent,
      fuelCostDeltaUsd: Math.round(costDelta),
    };
  }
}
