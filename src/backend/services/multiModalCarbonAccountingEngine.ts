/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Multi-Modal Carbon Accounting & GLEC ISO 14083 Engine
 * Computes Well-to-Wheel (WTW), Well-to-Tank (WTT), and Tank-to-Wheel (TTW) GHG intensity
 * across ocean vessels, air freighters, electric/diesel rail, and alternative fuel fleets with EU ETS offset settlement.
 */

export type TransportFuelType =
  | 'DIESEL_B7'
  | 'HVO100_RENEWABLE_DIESEL'
  | 'BIO_LNG'
  | 'BATTERY_ELECTRIC'
  | 'HYDROGEN_FUEL_CELL'
  | 'HEAVY_FUEL_OIL_VLSFO'
  | 'E_METHANOL'
  | 'GREEN_AMMONIA'
  | 'JET_A1_KEROSENE'
  | 'SAF_50_BLEND';

export interface GlecEmissionFactor {
  fuelType: TransportFuelType;
  wttFactorGramsCo2ePerMj: number; // Well-to-Tank
  ttwFactorGramsCo2ePerMj: number; // Tank-to-Wheel
  wtwTotalGramsCo2ePerMj: number;  // Well-to-Wheel Total
  energyDensityMjPerUnit: number;  // MJ/liter or MJ/kg or MJ/kWh
  unitLabel: string;
}

export interface FreightLegCarbonCalculation {
  legId: string;
  mode: 'ROAD' | 'OCEAN' | 'RAIL' | 'AIR';
  origin: string;
  destination: string;
  distanceKm: number;
  cargoMassTonnes: number;
  tonneKilometers: number;
  fuelType: TransportFuelType;
  totalFuelUnitsConsumed: number;
  wttEmissionsKgCo2e: number;
  ttwEmissionsKgCo2e: number;
  wtwEmissionsKgCo2e: number;
  emissionIntensityGramsPerTonneKm: number;
  baselineDieselEmissionsKgCo2e: number;
  avoidedEmissionsKgCo2e: number;
  euEtsCarbonOffsetCostEur: number;
}

export class MultiModalCarbonAccountingEngine {
  // EU ETS Carbon Allowance price per metric tonne (1,000 kg) CO2e in EUR
  private static readonly EU_ETS_ALLOWANCE_EUR_PER_TONNE = 84.50;

  // GLEC Framework v3.0 & ISO 14083 Default Emission Intensity Factors (g CO2e / MJ)
  public static readonly EMISSION_FACTORS: Record<TransportFuelType, GlecEmissionFactor> = {
    DIESEL_B7: {
      fuelType: 'DIESEL_B7',
      wttFactorGramsCo2ePerMj: 18.2,
      ttwFactorGramsCo2ePerMj: 75.1,
      wtwTotalGramsCo2ePerMj: 93.3,
      energyDensityMjPerUnit: 35.8, // MJ/liter
      unitLabel: 'liters',
    },
    HVO100_RENEWABLE_DIESEL: {
      fuelType: 'HVO100_RENEWABLE_DIESEL',
      wttFactorGramsCo2ePerMj: 11.4,
      ttwFactorGramsCo2ePerMj: 2.1, // Biogenic net zero TTW
      wtwTotalGramsCo2ePerMj: 13.5,
      energyDensityMjPerUnit: 34.4,
      unitLabel: 'liters',
    },
    BIO_LNG: {
      fuelType: 'BIO_LNG',
      wttFactorGramsCo2ePerMj: 14.5,
      ttwFactorGramsCo2ePerMj: 5.2,
      wtwTotalGramsCo2ePerMj: 19.7,
      energyDensityMjPerUnit: 49.0, // MJ/kg
      unitLabel: 'kg',
    },
    BATTERY_ELECTRIC: {
      fuelType: 'BATTERY_ELECTRIC',
      wttFactorGramsCo2ePerMj: 24.0, // EU average grid mix
      ttwFactorGramsCo2ePerMj: 0.0,
      wtwTotalGramsCo2ePerMj: 24.0,
      energyDensityMjPerUnit: 3.6, // 1 kWh = 3.6 MJ
      unitLabel: 'kWh',
    },
    HYDROGEN_FUEL_CELL: {
      fuelType: 'HYDROGEN_FUEL_CELL',
      wttFactorGramsCo2ePerMj: 8.5, // Green electrolysis H2
      ttwFactorGramsCo2ePerMj: 0.0,
      wtwTotalGramsCo2ePerMj: 8.5,
      energyDensityMjPerUnit: 120.0, // MJ/kg
      unitLabel: 'kg',
    },
    HEAVY_FUEL_OIL_VLSFO: {
      fuelType: 'HEAVY_FUEL_OIL_VLSFO',
      wttFactorGramsCo2ePerMj: 13.5,
      ttwFactorGramsCo2ePerMj: 77.4,
      wtwTotalGramsCo2ePerMj: 90.9,
      energyDensityMjPerUnit: 41.2, // MJ/kg
      unitLabel: 'kg',
    },
    E_METHANOL: {
      fuelType: 'E_METHANOL',
      wttFactorGramsCo2ePerMj: 6.2,
      ttwFactorGramsCo2ePerMj: 1.8,
      wtwTotalGramsCo2ePerMj: 8.0,
      energyDensityMjPerUnit: 19.9, // MJ/liter
      unitLabel: 'liters',
    },
    GREEN_AMMONIA: {
      fuelType: 'GREEN_AMMONIA',
      wttFactorGramsCo2ePerMj: 5.1,
      ttwFactorGramsCo2ePerMj: 0.0, // Zero carbon tailpipe
      wtwTotalGramsCo2ePerMj: 5.1,
      energyDensityMjPerUnit: 18.6,
      unitLabel: 'kg',
    },
    JET_A1_KEROSENE: {
      fuelType: 'JET_A1_KEROSENE',
      wttFactorGramsCo2ePerMj: 17.5,
      ttwFactorGramsCo2ePerMj: 73.5,
      wtwTotalGramsCo2ePerMj: 91.0,
      energyDensityMjPerUnit: 34.7,
      unitLabel: 'liters',
    },
    SAF_50_BLEND: {
      fuelType: 'SAF_50_BLEND',
      wttFactorGramsCo2ePerMj: 15.0,
      ttwFactorGramsCo2ePerMj: 28.0, // 50% biogenic avoidance
      wtwTotalGramsCo2ePerMj: 43.0,
      energyDensityMjPerUnit: 34.6,
      unitLabel: 'liters',
    },
  };

  /**
   * Calculate ISO 14083 / GLEC freight leg emissions
   */
  public static calculateLegEmissions(params: {
    legId: string;
    mode: 'ROAD' | 'OCEAN' | 'RAIL' | 'AIR';
    origin: string;
    destination: string;
    distanceKm: number;
    cargoMassTonnes: number;
    fuelType: TransportFuelType;
    fuelConsumedUnits?: number;
    emptyTripAdjustmentFactor?: number; // default 1.15
  }): FreightLegCarbonCalculation {
    const {
      legId,
      mode,
      origin,
      destination,
      distanceKm,
      cargoMassTonnes,
      fuelType,
      emptyTripAdjustmentFactor = 1.15,
    } = params;

    const tonneKilometers = distanceKm * cargoMassTonnes;
    const factor = this.EMISSION_FACTORS[fuelType];

    // Estimate consumption if not explicitly measured from telematics
    let fuelUnits = params.fuelConsumedUnits;
    if (!fuelUnits) {
      if (mode === 'ROAD') {
        // Heavy truck: ~30 liters per 100 km (0.3 L/km)
        fuelUnits = distanceKm * 0.3 * (cargoMassTonnes / 20);
      } else if (mode === 'OCEAN') {
        // Feeder vessel: ~0.015 kg HFO per tonne-km
        fuelUnits = tonneKilometers * 0.015;
      } else if (mode === 'RAIL') {
        // Rail electric: ~0.04 kWh per tonne-km
        fuelUnits = tonneKilometers * 0.04;
      } else {
        // Air freight: ~0.18 liters jet fuel per tonne-km
        fuelUnits = tonneKilometers * 0.18;
      }
    }

    const totalEnergyMj = fuelUnits * factor.energyDensityMjPerUnit * emptyTripAdjustmentFactor;

    const wttEmissionsKg = (totalEnergyMj * factor.wttFactorGramsCo2ePerMj) / 1000;
    const ttwEmissionsKg = (totalEnergyMj * factor.ttwFactorGramsCo2ePerMj) / 1000;
    const wtwTotalKg = wttEmissionsKg + ttwEmissionsKg;

    const intensityGramsPerTonneKm = tonneKilometers > 0 ? (wtwTotalKg * 1000) / tonneKilometers : 0;

    // Baseline calculation against fossil diesel/kerosene
    const baselineDieselFactor = this.EMISSION_FACTORS['DIESEL_B7'];
    const baselineWtwKg = (totalEnergyMj * baselineDieselFactor.wtwTotalGramsCo2ePerMj) / 1000;
    const avoidedKg = Math.max(0, baselineWtwKg - wtwTotalKg);

    // EU ETS carbon liability in EUR
    const offsetCostEur = (wtwTotalKg / 1000) * this.EU_ETS_ALLOWANCE_EUR_PER_TONNE;

    return {
      legId,
      mode,
      origin,
      destination,
      distanceKm,
      cargoMassTonnes,
      tonneKilometers,
      fuelType,
      totalFuelUnitsConsumed: Number(fuelUnits.toFixed(1)),
      wttEmissionsKgCo2e: Number(wttEmissionsKg.toFixed(2)),
      ttwEmissionsKgCo2e: Number(ttwEmissionsKg.toFixed(2)),
      wtwEmissionsKgCo2e: Number(wtwTotalKg.toFixed(2)),
      emissionIntensityGramsPerTonneKm: Number(intensityGramsPerTonneKm.toFixed(2)),
      baselineDieselEmissionsKgCo2e: Number(baselineWtwKg.toFixed(2)),
      avoidedEmissionsKgCo2e: Number(avoidedKg.toFixed(2)),
      euEtsCarbonOffsetCostEur: Number(offsetCostEur.toFixed(2)),
    };
  }

  /**
   * Sample multi-modal network carbon report
   */
  public static getSampleNetworkCalculation(): FreightLegCarbonCalculation[] {
    return [
      this.calculateLegEmissions({
        legId: 'LEG-RD-01',
        mode: 'ROAD',
        origin: 'Rotterdam ECT Terminal',
        destination: 'Duisburg Intermodal Hub',
        distanceKm: 215,
        cargoMassTonnes: 24,
        fuelType: 'HVO100_RENEWABLE_DIESEL',
      }),
      this.calculateLegEmissions({
        legId: 'LEG-RL-02',
        mode: 'RAIL',
        origin: 'Duisburg Rail Terminal',
        destination: 'Vienna Freudenau Hafen',
        distanceKm: 890,
        cargoMassTonnes: 380,
        fuelType: 'BATTERY_ELECTRIC',
      }),
      this.calculateLegEmissions({
        legId: 'LEG-OC-03',
        mode: 'OCEAN',
        origin: 'Shanghai Yangshan Port',
        destination: 'Rotterdam Maasvlakte',
        distanceKm: 19800,
        cargoMassTonnes: 14000,
        fuelType: 'E_METHANOL',
      }),
      this.calculateLegEmissions({
        legId: 'LEG-AIR-04',
        mode: 'AIR',
        origin: 'Frankfurt CargoCity (FRA)',
        destination: 'Chicago O\'Hare (ORD)',
        distanceKm: 6920,
        cargoMassTonnes: 45,
        fuelType: 'SAF_50_BLEND',
      }),
    ];
  }
}
