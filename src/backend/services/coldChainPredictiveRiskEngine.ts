/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Cold Chain Predictive Risk & Kinetic Degradation Engine
 * Calculates multi-sensor Arrhenius degradation rates, Haynes Mean Kinetic Temperature (MKT),
 * Reefer container thermodynamic heat ingress (Q = U * A * deltaT), and predictive failure alerts.
 */

export interface ColdChainConsignment {
  id: string;
  waybillId: string;
  productName: string;
  category: 'mRNA_VACCINE' | 'MONOCLONAL_ANTIBODIES' | 'INSULIN' | 'BLOOD_PLASMA' | 'PERISHABLE_PRODUCE';
  targetTempCelsius: number;
  minTempCelsius: number;
  maxTempCelsius: number;
  activationEnergyKjPerMol: number; // Arrhenius Ea
  shelfLifeDaysAtTarget: number;
  currentShelfLifeLossPercent: number;
  reeferUnitId: string;
  reeferStatus: 'OPTIMAL' | 'COMPRESSOR_CYCLING' | 'THERMAL_DEFICIT' | 'ALARM_EXCURSION';
  telemetryReadings: {
    timestamp: string;
    temperatureCelsius: number;
    humidityPercent: number;
    compressorPowerKw: number;
    ambientTempCelsius: number;
    doorOpenState: boolean;
  }[];
}

export interface ColdChainRiskAssessment {
  consignmentId: string;
  calculatedMktCelsius: number;
  isMktCompliant: boolean;
  currentDegradationRateFactor: number; // k / k_target
  predictedShelfLifeLossPercent: number;
  timeRemainingUntilQualityFailHours: number;
  thermalIngressWatts: number;
  reeferFailureRiskScore: number; // 0 - 100
  recommendedAction: string;
  urgency: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
}

export class ColdChainPredictiveRiskEngine {
  private static readonly GAS_CONSTANT_R = 8.314462618; // J / (mol * K)

  private static consignments: ColdChainConsignment[] = [
    {
      id: 'CC-VAC-901',
      waybillId: 'WB-90042',
      productName: 'Comirnaty mRNA COVID-19 / RSV Bivalent Vaccine',
      category: 'mRNA_VACCINE',
      targetTempCelsius: 4.0,
      minTempCelsius: 2.0,
      maxTempCelsius: 8.0,
      activationEnergyKjPerMol: 83.14, // High temperature sensitivity
      shelfLifeDaysAtTarget: 30,
      currentShelfLifeLossPercent: 4.2,
      reeferUnitId: 'RF-809',
      reeferStatus: 'OPTIMAL',
      telemetryReadings: [
        { timestamp: '2025-02-24T10:00:00Z', temperatureCelsius: 3.8, humidityPercent: 55, compressorPowerKw: 2.4, ambientTempCelsius: 21.0, doorOpenState: false },
        { timestamp: '2025-02-24T11:00:00Z', temperatureCelsius: 4.1, humidityPercent: 54, compressorPowerKw: 2.5, ambientTempCelsius: 23.5, doorOpenState: false },
        { timestamp: '2025-02-24T12:00:00Z', temperatureCelsius: 4.4, humidityPercent: 57, compressorPowerKw: 2.8, ambientTempCelsius: 26.0, doorOpenState: false },
        { timestamp: '2025-02-24T13:00:00Z', temperatureCelsius: 4.9, humidityPercent: 59, compressorPowerKw: 3.1, ambientTempCelsius: 28.2, doorOpenState: false },
        { timestamp: '2025-02-24T14:00:00Z', temperatureCelsius: 4.6, humidityPercent: 56, compressorPowerKw: 2.9, ambientTempCelsius: 27.0, doorOpenState: false },
      ],
    },
    {
      id: 'CC-MAB-902',
      waybillId: 'WB-90088',
      productName: 'Keytruda (Pembrolizumab) Biologic Infusion',
      category: 'MONOCLONAL_ANTIBODIES',
      targetTempCelsius: 5.0,
      minTempCelsius: 2.0,
      maxTempCelsius: 8.0,
      activationEnergyKjPerMol: 95.0,
      shelfLifeDaysAtTarget: 60,
      currentShelfLifeLossPercent: 12.8,
      reeferUnitId: 'RF-612',
      reeferStatus: 'THERMAL_DEFICIT',
      telemetryReadings: [
        { timestamp: '2025-02-24T10:00:00Z', temperatureCelsius: 6.2, humidityPercent: 62, compressorPowerKw: 3.8, ambientTempCelsius: 32.0, doorOpenState: false },
        { timestamp: '2025-02-24T11:00:00Z', temperatureCelsius: 7.1, humidityPercent: 64, compressorPowerKw: 4.1, ambientTempCelsius: 34.5, doorOpenState: false },
        { timestamp: '2025-02-24T12:00:00Z', temperatureCelsius: 7.9, humidityPercent: 68, compressorPowerKw: 4.5, ambientTempCelsius: 36.0, doorOpenState: true },
        { timestamp: '2025-02-24T13:00:00Z', temperatureCelsius: 8.4, humidityPercent: 71, compressorPowerKw: 4.6, ambientTempCelsius: 35.8, doorOpenState: false },
        { timestamp: '2025-02-24T14:00:00Z', temperatureCelsius: 8.2, humidityPercent: 69, compressorPowerKw: 4.4, ambientTempCelsius: 34.0, doorOpenState: false },
      ],
    },
    {
      id: 'CC-INS-903',
      waybillId: 'WB-90104',
      productName: 'Humalog (Insulin Lispro) Ultra-Fast Acting',
      category: 'INSULIN',
      targetTempCelsius: 4.0,
      minTempCelsius: 2.0,
      maxTempCelsius: 8.0,
      activationEnergyKjPerMol: 75.2,
      shelfLifeDaysAtTarget: 45,
      currentShelfLifeLossPercent: 1.5,
      reeferUnitId: 'RF-404',
      reeferStatus: 'OPTIMAL',
      telemetryReadings: [
        { timestamp: '2025-02-24T10:00:00Z', temperatureCelsius: 3.5, humidityPercent: 50, compressorPowerKw: 2.1, ambientTempCelsius: 18.0, doorOpenState: false },
        { timestamp: '2025-02-24T11:00:00Z', temperatureCelsius: 3.7, humidityPercent: 51, compressorPowerKw: 2.2, ambientTempCelsius: 19.5, doorOpenState: false },
        { timestamp: '2025-02-24T12:00:00Z', temperatureCelsius: 3.9, humidityPercent: 52, compressorPowerKw: 2.3, ambientTempCelsius: 20.0, doorOpenState: false },
      ],
    },
  ];

  /**
   * Haynes Mean Kinetic Temperature (MKT) continuous formulation:
   * T_k = (Delta H / R) / -ln( (1/n) * sum( exp( -Delta H / (R * T_i) ) ) )
   */
  public static calculateHaynesMkt(temperaturesCelsius: number[], deltaH: number = 83144.62): number {
    if (temperaturesCelsius.length === 0) return 0;

    const n = temperaturesCelsius.length;
    let sumExp = 0;

    for (const tC of temperaturesCelsius) {
      const tK = tC + 273.15;
      sumExp += Math.exp(-deltaH / (this.GAS_CONSTANT_R * tK));
    }

    const meanExp = sumExp / n;
    const mktKelvin = (deltaH / this.GAS_CONSTANT_R) / -Math.log(meanExp);
    const mktCelsius = mktKelvin - 273.15;

    return Number(mktCelsius.toFixed(2));
  }

  /**
   * Arrhenius reaction rate factor k / k_target
   */
  public static calculateArrheniusRateFactor(
    actualTempC: number,
    targetTempC: number,
    eaKjPerMol: number
  ): number {
    const tActualK = actualTempC + 273.15;
    const tTargetK = targetTempC + 273.15;
    const eaJoules = eaKjPerMol * 1000;

    // k / k_0 = exp( (-Ea / R) * (1/T_actual - 1/T_target) )
    const exponent = (-eaJoules / this.GAS_CONSTANT_R) * (1 / tActualK - 1 / tTargetK);
    return Number(Math.exp(exponent).toFixed(3));
  }

  /**
   * Thermal heat ingress into reefer box: Q = U * A * (T_ambient - T_internal)
   * Standard 40ft High-Cube Reefer: Area A ~ 140 m^2, Insulating U-value ~ 0.35 W/(m^2 * K)
   */
  public static calculateThermalIngressWatts(
    ambientTempC: number,
    internalTempC: number,
    uValue: number = 0.35,
    surfaceAreaM2: number = 140
  ): number {
    const deltaT = Math.max(0, ambientTempC - internalTempC);
    const watts = uValue * surfaceAreaM2 * deltaT;
    return Math.round(watts);
  }

  /**
   * Perform comprehensive predictive assessment on a cold chain consignment
   */
  public static evaluateConsignment(consignment: ColdChainConsignment): ColdChainRiskAssessment {
    const temps = consignment.telemetryReadings.map((r) => r.temperatureCelsius);
    const mkt = this.calculateHaynesMkt(temps, consignment.activationEnergyKjPerMol * 1000);
    const latestReading = consignment.telemetryReadings[consignment.telemetryReadings.length - 1];

    const isCompliant = mkt >= consignment.minTempCelsius && mkt <= consignment.maxTempCelsius;
    const rateFactor = this.calculateArrheniusRateFactor(
      latestReading ? latestReading.temperatureCelsius : mkt,
      consignment.targetTempCelsius,
      consignment.activationEnergyKjPerMol
    );

    const thermalIngress = latestReading
      ? this.calculateThermalIngressWatts(latestReading.ambientTempCelsius, latestReading.temperatureCelsius)
      : 800;

    // Reefer failure risk score calculation
    let riskScore = 15;
    if (rateFactor > 1.5) riskScore += 30;
    if (rateFactor > 2.5) riskScore += 35;
    if (latestReading && latestReading.doorOpenState) riskScore += 20;
    if (latestReading && latestReading.compressorPowerKw > 4.2) riskScore += 15;
    riskScore = Math.min(100, Math.max(0, riskScore));

    let urgency: 'NORMAL' | 'ELEVATED' | 'CRITICAL' = 'NORMAL';
    let recommendedAction = 'Nominal thermal stability maintained. Continue scheduled logging.';
    let hoursRemaining = 720;

    if (riskScore >= 75 || !isCompliant) {
      urgency = 'CRITICAL';
      recommendedAction = 'IMMEDIATE INTERVENTION: Trigger secondary cryogenic dry ice boost & divert to nearest GDP validated warehouse cold-cell.';
      hoursRemaining = 4.5;
    } else if (riskScore >= 45) {
      urgency = 'ELEVATED';
      recommendedAction = 'ADVISORY: Depress reefer temperature setpoint to +2.5°C to counteract elevated ambient thermal ingress.';
      hoursRemaining = 18.0;
    }

    return {
      consignmentId: consignment.id,
      calculatedMktCelsius: mkt,
      isMktCompliant: isCompliant,
      currentDegradationRateFactor: rateFactor,
      predictedShelfLifeLossPercent: Number((consignment.currentShelfLifeLossPercent + (rateFactor - 1) * 2.5).toFixed(1)),
      timeRemainingUntilQualityFailHours: hoursRemaining,
      thermalIngressWatts: thermalIngress,
      reeferFailureRiskScore: riskScore,
      recommendedAction,
      urgency,
    };
  }

  public static getConsignments(): ColdChainConsignment[] {
    return this.consignments;
  }

  public static getConsignmentById(id: string): ColdChainConsignment | undefined {
    return this.consignments.find((c) => c.id === id);
  }
}
