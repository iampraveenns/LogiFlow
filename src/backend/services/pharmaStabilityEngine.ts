/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Pharma GDP & Vaccine Stability Telemetry Engine
 * Implements Haynes Mean Kinetic Temperature (MKT) Arrhenius Equation,
 * WHO TRS 961 Annex 9, and USP <1079> Temperature Excursion Budgeting.
 */

import { logger } from '../../packages/logger/index.ts';

export type PharmaCategory =
  | 'ULTRA_COLD_MRNA'      // -90°C to -60°C (e.g. Comirnaty)
  | 'CRYOGENIC_CELL_GENE'  // -196°C to -150°C (Liquid Nitrogen Vapor)
  | 'COLD_CHAIN_BIOLOGIC'  // +2°C to +8°C (Insulin, Monoclonal Antibodies, Vaccines)
  | 'CONTROLLED_ROOM_TEMP' // +15°C to +25°C (Solid Oral Dosages, Active Pharmaceutical Ingredients)
  | 'FROZEN_PLASMA';       // -25°C to -15°C (Fresh Frozen Plasma, Coagulation Factors)

export interface TemperatureReading {
  timestampIso: string;
  temperatureCelsius: number;
  relativeHumidityPercent: number;
  ambientLightLux: number;
  shockG: number;
}

export interface StabilityBudgetSpec {
  category: PharmaCategory;
  nominalMinCelsius: number;
  nominalMaxCelsius: number;
  activationEnergyKjPerMol: number; // ΔH* standard Haynes parameter: 83.144 kJ/mol
  maxAllowableMktCelsius: number;
  maxContinuousExcursionMinutes: number;
  maxCumulativeExcursionDegreeHours: number;
  freezeSensitive: boolean; // Irreversible protein denaturation on freezing (< 0°C)
  heatSensitive: boolean;
  lightSensitive: boolean;  // Photolytic degradation > 500 Lux
}

export interface PharmaShipmentBatch {
  batchId: string;
  productName: string;
  manufacturer: string;
  category: PharmaCategory;
  declaredShelfLifeMonths: number;
  initialExpiryDateIso: string;
  sensorSerialNumber: string;
  containerRfid: string;
  readings: TemperatureReading[];
}

export interface StabilityEvaluationResult {
  batchId: string;
  productName: string;
  category: PharmaCategory;
  meanKineticTemperatureCelsius: number;
  arithmeticAverageCelsius: number;
  minRecordedCelsius: number;
  maxRecordedCelsius: number;
  totalDurationHours: number;
  excursionCount: number;
  cumulativeExcursionDegreeHours: number;
  stabilityBudgetConsumedPercent: number;
  adjustedShelfLifeMonths: number;
  freezeDenaturationDetected: boolean;
  photolyticExposureDetected: boolean;
  gdpComplianceStatus: 'GDP_CERTIFIED_RELEASE' | 'QUARANTINE_INVESTIGATION_REQUIRED' | 'REJECTED_DESTROY_PRODUCT';
  regulatorySummary: string;
}

export class PharmaStabilityEngine {
  // Universal Gas Constant R in kJ / (mol * K)
  private static readonly GAS_CONSTANT_R = 0.0083144; // 8.3144 J/(mol*K) = 0.0083144 kJ/(mol*K)
  private static readonly ABSOLUTE_ZERO_CELSIUS = 273.15;

  public static readonly STABILITY_SPECS: Record<PharmaCategory, StabilityBudgetSpec> = {
    ULTRA_COLD_MRNA: {
      category: 'ULTRA_COLD_MRNA',
      nominalMinCelsius: -90.0,
      nominalMaxCelsius: -60.0,
      activationEnergyKjPerMol: 83.144,
      maxAllowableMktCelsius: -55.0,
      maxContinuousExcursionMinutes: 180,
      maxCumulativeExcursionDegreeHours: 45.0,
      freezeSensitive: false,
      heatSensitive: true,
      lightSensitive: true
    },
    CRYOGENIC_CELL_GENE: {
      category: 'CRYOGENIC_CELL_GENE',
      nominalMinCelsius: -196.0,
      nominalMaxCelsius: -150.0,
      activationEnergyKjPerMol: 95.0,
      maxAllowableMktCelsius: -140.0,
      maxContinuousExcursionMinutes: 60,
      maxCumulativeExcursionDegreeHours: 20.0,
      freezeSensitive: false,
      heatSensitive: true,
      lightSensitive: false
    },
    COLD_CHAIN_BIOLOGIC: {
      category: 'COLD_CHAIN_BIOLOGIC',
      nominalMinCelsius: 2.0,
      nominalMaxCelsius: 8.0,
      activationEnergyKjPerMol: 83.144,
      maxAllowableMktCelsius: 8.5,
      maxContinuousExcursionMinutes: 240,
      maxCumulativeExcursionDegreeHours: 35.0,
      freezeSensitive: true, // Freezing destroys tertiary protein structure
      heatSensitive: true,
      lightSensitive: true
    },
    CONTROLLED_ROOM_TEMP: {
      category: 'CONTROLLED_ROOM_TEMP',
      nominalMinCelsius: 15.0,
      nominalMaxCelsius: 25.0,
      activationEnergyKjPerMol: 83.144,
      maxAllowableMktCelsius: 25.0,
      maxContinuousExcursionMinutes: 720,
      maxCumulativeExcursionDegreeHours: 120.0,
      freezeSensitive: false,
      heatSensitive: true,
      lightSensitive: true
    },
    FROZEN_PLASMA: {
      category: 'FROZEN_PLASMA',
      nominalMinCelsius: -30.0,
      nominalMaxCelsius: -15.0,
      activationEnergyKjPerMol: 83.144,
      maxAllowableMktCelsius: -15.0,
      maxContinuousExcursionMinutes: 120,
      maxCumulativeExcursionDegreeHours: 25.0,
      freezeSensitive: false,
      heatSensitive: true,
      lightSensitive: false
    }
  };

  private static batches: Map<string, PharmaShipmentBatch> = new Map();

  static {
    // Seed Sample Biopharma Batches
    const b1: PharmaShipmentBatch = {
      batchId: 'BATCH-MRNA-9021',
      productName: 'Comirnaty BNT162b2 mRNA Vaccine (Pediatric)',
      manufacturer: 'BioNTech / Pfizer Manufacturing Belgium',
      category: 'ULTRA_COLD_MRNA',
      declaredShelfLifeMonths: 18,
      initialExpiryDateIso: '2027-08-31',
      sensorSerialNumber: 'SEN-SENSITECH-8819',
      containerRfid: 'VIP-DRYICE-004',
      readings: this.generateReadings(-78.0, 1.2, 72, 0, 4)
    };

    const b2: PharmaShipmentBatch = {
      batchId: 'BATCH-MAB-4410',
      productName: 'Keytruda (Pembrolizumab) 100mg/4mL Injection',
      manufacturer: 'Merck Sharp & Dohme Corp',
      category: 'COLD_CHAIN_BIOLOGIC',
      declaredShelfLifeMonths: 24,
      initialExpiryDateIso: '2028-03-15',
      sensorSerialNumber: 'SEN-ELPRO-7721',
      containerRfid: 'CSAFE-RAP-991',
      readings: this.generateReadings(4.5, 0.8, 96, 0, 12)
    };

    const b3: PharmaShipmentBatch = {
      batchId: 'BATCH-CAR-T-108',
      productName: 'Kymriah (Tisagenlecleucel) Autologous T-Cells',
      manufacturer: 'Novartis Gene Therapies Morris Plains',
      category: 'CRYOGENIC_CELL_GENE',
      declaredShelfLifeMonths: 12,
      initialExpiryDateIso: '2027-02-28',
      sensorSerialNumber: 'SEN-CRYOMON-1102',
      containerRfid: 'MVE-DEWAR-CRY-01',
      readings: this.generateReadings(-182.0, 3.5, 48, 0, 0)
    };

    this.batches.set(b1.batchId, b1);
    this.batches.set(b2.batchId, b2);
    this.batches.set(b3.batchId, b3);

    logger.info('PHARMA_ENGINE', 'Pharma GDP & Vaccine Stability Telemetry Engine initialized');
  }

  private static generateReadings(
    baseTemp: number,
    noise: number,
    count: number,
    spikeHour: number,
    spikeMagnitude: number
  ): TemperatureReading[] {
    const list: TemperatureReading[] = [];
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      const time = new Date(now - (count - i) * 3600000).toISOString();
      let temp = baseTemp + (Math.sin(i / 6) * noise);
      if (spikeHour > 0 && i >= spikeHour && i < spikeHour + 3) {
        temp += spikeMagnitude;
      }
      list.push({
        timestampIso: time,
        temperatureCelsius: Number(temp.toFixed(2)),
        relativeHumidityPercent: Number((45 + Math.random() * 8).toFixed(1)),
        ambientLightLux: i % 24 === 12 ? 80 : 0, // In darkness
        shockG: 0.12
      });
    }
    return list;
  }

  public static getBatches(): PharmaShipmentBatch[] {
    return Array.from(this.batches.values());
  }

  public static getBatchById(id: string): PharmaShipmentBatch | undefined {
    return this.batches.get(id);
  }

  /**
   * Haynes Arrhenius Mean Kinetic Temperature (MKT) Formula:
   * T_k = - (ΔH / R) / ln( (1/n) * Σ e^( -ΔH / (R * T_i) ) )
   * where T_i is temperature in Kelvin (Celsius + 273.15).
   */
  public static calculateMeanKineticTemperature(
    readings: number[],
    activationEnergyKjPerMol: number = 83.144
  ): {
    mktCelsius: number;
    arithmeticAverageCelsius: number;
    minCelsius: number;
    maxCelsius: number;
  } {
    if (readings.length === 0) {
      return { mktCelsius: 0, arithmeticAverageCelsius: 0, minCelsius: 0, maxCelsius: 0 };
    }

    const n = readings.length;
    let sumExp = 0;
    let sumArith = 0;
    let minT = Infinity;
    let maxT = -Infinity;

    for (const c of readings) {
      if (c < minT) minT = c;
      if (c > maxT) maxT = c;
      sumArith += c;

      const kelvin = c + this.ABSOLUTE_ZERO_CELSIUS;
      // Protect against division by zero if cryogenic
      const safeK = Math.max(1.0, kelvin);
      const exponent = -activationEnergyKjPerMol / (this.GAS_CONSTANT_R * safeK);
      sumExp += Math.exp(exponent);
    }

    const avgExp = sumExp / n;
    const mktKelvin = -activationEnergyKjPerMol / (this.GAS_CONSTANT_R * Math.log(avgExp));
    const mktCelsius = mktKelvin - this.ABSOLUTE_ZERO_CELSIUS;

    return {
      mktCelsius: Number(mktCelsius.toFixed(2)),
      arithmeticAverageCelsius: Number((sumArith / n).toFixed(2)),
      minCelsius: Number(minT.toFixed(2)),
      maxCelsius: Number(maxT.toFixed(2))
    };
  }

  /**
   * Evaluates Full GDP Compliance and Stability Degradation
   */
  public static evaluateBatchStability(batch: PharmaShipmentBatch): StabilityEvaluationResult {
    const spec = this.STABILITY_SPECS[batch.category];
    const temps = batch.readings.map(r => r.temperatureCelsius);
    const mktResult = this.calculateMeanKineticTemperature(temps, spec.activationEnergyKjPerMol);

    let cumulativeDegreeHours = 0;
    let excursionCount = 0;
    let freezeDenaturation = false;
    let photolyticExposure = false;

    batch.readings.forEach(r => {
      // Check freeze for biologics
      if (spec.freezeSensitive && r.temperatureCelsius <= 0.0) {
        freezeDenaturation = true;
      }
      // Check high excursion
      if (r.temperatureCelsius > spec.nominalMaxCelsius) {
        excursionCount++;
        cumulativeDegreeHours += (r.temperatureCelsius - spec.nominalMaxCelsius) * 1.0;
      }
      // Check low excursion
      if (r.temperatureCelsius < spec.nominalMinCelsius) {
        excursionCount++;
        cumulativeDegreeHours += (spec.nominalMinCelsius - r.temperatureCelsius) * 1.0;
      }
      // Check light exposure
      if (spec.lightSensitive && r.ambientLightLux > 400) {
        photolyticExposure = true;
      }
    });

    const budgetPercent = Math.min(
      100,
      Number(((cumulativeDegreeHours / spec.maxCumulativeExcursionDegreeHours) * 100).toFixed(1))
    );

    let gdpStatus: 'GDP_CERTIFIED_RELEASE' | 'QUARANTINE_INVESTIGATION_REQUIRED' | 'REJECTED_DESTROY_PRODUCT' = 'GDP_CERTIFIED_RELEASE';
    let summary = 'Batch temperature within strict nominal GDP specifications. Released for clinical administration.';

    if (freezeDenaturation) {
      gdpStatus = 'REJECTED_DESTROY_PRODUCT';
      summary = 'CRITICAL GDP REJECTION: Freezing temperature detected (<= 0.0°C). Irreversible protein aggregation / quaternary denaturation occurred.';
    } else if (budgetPercent > 90 || mktResult.mktCelsius > spec.maxAllowableMktCelsius) {
      gdpStatus = 'QUARANTINE_INVESTIGATION_REQUIRED';
      summary = `EXCURSION QUARANTINE: Mean Kinetic Temperature (${mktResult.mktCelsius}°C) exceeded max threshold or consumed ${budgetPercent}% of WHO stability budget. Requires QA lab release assay.`;
    }

    const shelfLifeLoss = (budgetPercent / 100) * (batch.declaredShelfLifeMonths * 0.3);
    const adjustedLife = Math.max(1, Number((batch.declaredShelfLifeMonths - shelfLifeLoss).toFixed(1)));

    return {
      batchId: batch.batchId,
      productName: batch.productName,
      category: batch.category,
      meanKineticTemperatureCelsius: mktResult.mktCelsius,
      arithmeticAverageCelsius: mktResult.arithmeticAverageCelsius,
      minRecordedCelsius: mktResult.minCelsius,
      maxRecordedCelsius: mktResult.maxCelsius,
      totalDurationHours: batch.readings.length,
      excursionCount,
      cumulativeExcursionDegreeHours: Number(cumulativeDegreeHours.toFixed(1)),
      stabilityBudgetConsumedPercent: budgetPercent,
      adjustedShelfLifeMonths: adjustedLife,
      freezeDenaturationDetected: freezeDenaturation,
      photolyticExposureDetected: photolyticExposure,
      gdpComplianceStatus: gdpStatus,
      regulatorySummary: summary
    };
  }
}
