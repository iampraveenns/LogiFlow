/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Supply Chain Digital Twin & Monte Carlo Risk Engine
 * Simulates global maritime chokepoints, labor strikes, geopolitical diversions, and financial Value-at-Risk (VaR).
 */

import { logger } from '../../packages/logger/index.ts';

export interface DisruptionScenario {
  id: string;
  name: string;
  category: 'GEOPOLITICAL' | 'LABOR_DISPUTE' | 'EXTREME_WEATHER' | 'INFRASTRUCTURE' | 'SUPPLY_DEFICIT';
  chokepoint: string;
  coordinates: [number, number];
  probabilityPercent: number;
  expectedDurationDays: number;
  dailyDelayHoursAvg: number;
  affectedTradeLanes: string[];
  vesselRerouteDetourDistanceKm: number;
  fuelPriceMultiplier: number;
  description: string;
  operationalParameters: {
    demurrageDailyRateUsd: number;
    containerDwellTimeIncreaseDays: number;
    alternativeCorridorName: string;
    alternativeCorridorExtraDays: number;
    extraBunkerCostPerVesselUsd: number;
  };
}

export interface MonteCarloIterationResult {
  iteration: number;
  simulatedDurationDays: number;
  totalFinancialImpactUsd: number;
  vesselsDelayedCount: number;
  containersDelayedCount: number;
  safetyStockDepletionDay: number;
}

export interface DigitalTwinSimulationOutput {
  scenarioId: string;
  scenarioName: string;
  iterationsCount: number;
  financialImpact: {
    meanUsd: number;
    medianUsd: number;
    valueAtRisk95Usd: number; // 95th percentile risk
    valueAtRisk99Usd: number; // 99th percentile risk
    minimumUsd: number;
    maximumUsd: number;
  };
  delays: {
    meanDelayDays: number;
    p95DelayDays: number;
    maxDelayDays: number;
    affectedShipmentsCount: number;
  };
  inventoryResilience: {
    bufferDepletionDayAvg: number;
    stockoutProbabilityPercent: number;
    recommendedBufferIncreaseUnits: number;
    emergencyReorderLeadTimeDays: number;
  };
  distributionBuckets: {
    delayDaysBucket: string;
    frequencyPercent: number;
    lossMilUsd: number;
  }[];
  mitigationRoadmap: {
    phase: string;
    action: string;
    costUsd: number;
    leadTimeHours: number;
    expectedRiskReductionPercent: number;
  }[];
  generatedAt: string;
}

export const DISRUPTION_SCENARIOS: DisruptionScenario[] = [
  {
    id: 'SCEN-SUEZ-01',
    name: 'Suez Canal / Bab-el-Mandeb Geopolitical Maritime Diversion',
    category: 'GEOPOLITICAL',
    chokepoint: 'Suez Canal & Red Sea Corridor',
    coordinates: [29.9753, 32.5599],
    probabilityPercent: 68.0,
    expectedDurationDays: 45,
    dailyDelayHoursAvg: 288, // ~12 days
    affectedTradeLanes: ['Asia-Europe Ocean Corridor', 'Middle East-Med Petrochemical Lane', 'India-North America Intermodal'],
    vesselRerouteDetourDistanceKm: 6480, // Cape of Good Hope transit
    fuelPriceMultiplier: 1.28,
    description: 'Maritime attacks in Southern Red Sea forcing commercial container vessels to divert around Cape of Good Hope, adding 10-14 days transit time.',
    operationalParameters: {
      demurrageDailyRateUsd: 1850,
      containerDwellTimeIncreaseDays: 8.5,
      alternativeCorridorName: 'Cape of Good Hope Southern Circumnavigation',
      alternativeCorridorExtraDays: 12,
      extraBunkerCostPerVesselUsd: 485000,
    },
  },
  {
    id: 'SCEN-LAX-STRIKE-02',
    name: 'US West Coast Ports Longshoremen Labor Disruption',
    category: 'LABOR_DISPUTE',
    chokepoint: 'Port of Los Angeles & Long Beach Terminal Complex',
    coordinates: [33.7405, -118.272],
    probabilityPercent: 32.0,
    expectedDurationDays: 18,
    dailyDelayHoursAvg: 192,
    affectedTradeLanes: ['Transpacific Eastbound (China-USWC)', 'East Asia Auto & Electronics Gateway'],
    vesselRerouteDetourDistanceKm: 1850,
    fuelPriceMultiplier: 1.08,
    description: 'Slowdown and labor work-to-rule actions at terminal gates causing container dwell times to surge from 3.2 days to 14.8 days.',
    operationalParameters: {
      demurrageDailyRateUsd: 2400,
      containerDwellTimeIncreaseDays: 11.2,
      alternativeCorridorName: 'Panama Canal diversion to Port of Houston & Savannah',
      alternativeCorridorExtraDays: 7,
      extraBunkerCostPerVesselUsd: 195000,
    },
  },
  {
    id: 'SCEN-PANAMA-DROUGHT-03',
    name: 'Panama Canal Freshwater Reservoir Draft Restrictions',
    category: 'EXTREME_WEATHER',
    chokepoint: 'Gatun Lake / Panama Canal Locks',
    coordinates: [9.08, -79.68],
    probabilityPercent: 54.0,
    expectedDurationDays: 60,
    dailyDelayHoursAvg: 144,
    affectedTradeLanes: ['US Gulf-Asia Grain Corridor', 'Transpacific-USEC All-Water Container Lane'],
    vesselRerouteDetourDistanceKm: 4200,
    fuelPriceMultiplier: 1.15,
    description: 'El Niño drought reducing maximum draft from 50ft to 44ft, restricting Neopanamax vessel cargo capacity by 35% and daily transits from 36 to 22.',
    operationalParameters: {
      demurrageDailyRateUsd: 1650,
      containerDwellTimeIncreaseDays: 6.0,
      alternativeCorridorName: 'US Intermodal Rail Bridge (LAX to Chicago / New York)',
      alternativeCorridorExtraDays: 4,
      extraBunkerCostPerVesselUsd: 260000,
    },
  },
  {
    id: 'SCEN-MALACCA-04',
    name: 'Strait of Malacca Supertanker Collision & Maritime Salvage Halt',
    category: 'INFRASTRUCTURE',
    chokepoint: 'Phillips Channel / Singapore Strait',
    coordinates: [1.2644, 103.822],
    probabilityPercent: 18.0,
    expectedDurationDays: 10,
    dailyDelayHoursAvg: 96,
    affectedTradeLanes: ['Persian Gulf-East Asia Crude Oil', 'Europe-China Container Core'],
    vesselRerouteDetourDistanceKm: 2100,
    fuelPriceMultiplier: 1.12,
    description: 'Temporary channel obstruction in Singapore Strait requiring one-way convoy transits and slow steaming through Sunda Strait.',
    operationalParameters: {
      demurrageDailyRateUsd: 2100,
      containerDwellTimeIncreaseDays: 4.8,
      alternativeCorridorName: 'Sunda Strait & Lombok Strait Deepwater Bypass',
      alternativeCorridorExtraDays: 3.5,
      extraBunkerCostPerVesselUsd: 145000,
    },
  },
  {
    id: 'SCEN-CHIP-FREEZE-05',
    name: 'East Asia Semiconductor Tier-1 Fab Cleanroom Facility Contamination',
    category: 'SUPPLY_DEFICIT',
    chokepoint: 'Hsinchu Science Park Taiwan / Incheon Korea',
    coordinates: [24.77, 121.01],
    probabilityPercent: 22.0,
    expectedDurationDays: 35,
    dailyDelayHoursAvg: 360,
    affectedTradeLanes: ['Air Freight High-Tech Corridor', 'Automotive ECU Supply Chain'],
    vesselRerouteDetourDistanceKm: 0,
    fuelPriceMultiplier: 1.02,
    description: 'Sub-nanometer lithography chemical contaminant triggers 5-week fab line halt, reducing global automotive microcontroller buffer stock by 70%.',
    operationalParameters: {
      demurrageDailyRateUsd: 850,
      containerDwellTimeIncreaseDays: 24.0,
      alternativeCorridorName: 'Charter Boeing 777F Air Cargo from secondary European wafer fabs',
      alternativeCorridorExtraDays: 1.5,
      extraBunkerCostPerVesselUsd: 380000,
    },
  },
];

export class DigitalTwinService {
  /**
   * Run Monte Carlo Simulation across 1,000 iterations for a chosen disruption scenario.
   */
  public static runSimulation(scenarioId: string, iterations: number = 1000): DigitalTwinSimulationOutput {
    const scenario = DISRUPTION_SCENARIOS.find((s) => s.id === scenarioId) || DISRUPTION_SCENARIOS[0];
    const results: MonteCarloIterationResult[] = [];

    // Base parameters
    const baseDuration = scenario.expectedDurationDays;
    const baseDelayDays = scenario.dailyDelayHoursAvg / 24;
    const demurrage = scenario.operationalParameters.demurrageDailyRateUsd;
    const extraBunker = scenario.operationalParameters.extraBunkerCostPerVesselUsd;

    for (let i = 0; i < iterations; i++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.max(0.0001, Math.random());
      const u2 = Math.random();
      const randNorm = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      // Duration variance (StdDev = 25% of mean)
      const simDuration = Math.max(2, Math.round(baseDuration + randNorm * (baseDuration * 0.25)));
      
      // Secondary random factor for severity fluctuation
      const severityFactor = 0.8 + Math.random() * 0.45;
      const simDelayDays = Number((baseDelayDays * severityFactor).toFixed(1));

      // Active vessels affected in corridor (e.g. 14 to 32 vessels)
      const vesselsAffected = Math.round(18 + Math.random() * 14);
      const containersAffected = vesselsAffected * Math.round(4200 + Math.random() * 3000);

      // Financial loss calculation
      const bunkerLoss = vesselsAffected * extraBunker * (simDuration / baseDuration);
      const demurrageLoss = containersAffected * demurrage * (simDelayDays * 0.4);
      const inventoryHoldingLoss = containersAffected * 85 * simDelayDays; // $85/day holding cost per container
      const totalFinancialLoss = Math.round(bunkerLoss + demurrageLoss + inventoryHoldingLoss);

      // Safety stock depletion days (typical warehouse has 14-21 days buffer)
      const initialBufferDays = 18;
      const depletionDay = Math.max(1, Math.round(initialBufferDays / (1 + (simDelayDays / 10))));

      results.push({
        iteration: i + 1,
        simulatedDurationDays: simDuration,
        totalFinancialImpactUsd: totalFinancialLoss,
        vesselsDelayedCount: vesselsAffected,
        containersDelayedCount: containersAffected,
        safetyStockDepletionDay: depletionDay,
      });
    }

    // Sort by financial loss for percentile calculations
    results.sort((a, b) => a.totalFinancialImpactUsd - b.totalFinancialImpactUsd);

    const losses = results.map((r) => r.totalFinancialImpactUsd);
    const meanUsd = Math.round(losses.reduce((s, v) => s + v, 0) / iterations);
    const medianUsd = losses[Math.floor(iterations * 0.5)];
    const p95Usd = losses[Math.floor(iterations * 0.95)];
    const p99Usd = losses[Math.floor(iterations * 0.99)];
    const minUsd = losses[0];
    const maxUsd = losses[losses.length - 1];

    // Delays calculation
    const delayList = results.map((r) => r.simulatedDurationDays);
    const meanDelayDays = Math.round(delayList.reduce((s, v) => s + v, 0) / iterations);
    const p95DelayDays = delayList.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];

    // Buffer depletion & stockout risk
    const depletions = results.map((r) => r.safetyStockDepletionDay);
    const bufferDepletionDayAvg = Number((depletions.reduce((s, v) => s + v, 0) / iterations).toFixed(1));
    const stockoutCount = results.filter((r) => r.safetyStockDepletionDay < meanDelayDays).length;
    const stockoutProb = Number(((stockoutCount / iterations) * 100).toFixed(1));

    // Distribution Histogram Buckets
    const bucketInterval = (maxUsd - minUsd) / 6;
    const distributionBuckets = [];
    for (let b = 0; b < 6; b++) {
      const bMin = minUsd + b * bucketInterval;
      const bMax = bMin + bucketInterval;
      const count = results.filter((r) => r.totalFinancialImpactUsd >= bMin && r.totalFinancialImpactUsd <= bMax).length;
      distributionBuckets.push({
        delayDaysBucket: `$${(bMin / 1000000).toFixed(1)}M - $${(bMax / 1000000).toFixed(1)}M`,
        frequencyPercent: Number(((count / iterations) * 100).toFixed(1)),
        lossMilUsd: Number(((bMin + bMax) / 2000000).toFixed(2)),
      });
    }

    // Recommended Mitigation Plan
    const mitigationRoadmap = [
      {
        phase: 'Immediate (Hour 0 - 24)',
        action: `Reroute priority Tier-1 cargo via ${scenario.operationalParameters.alternativeCorridorName}`,
        costUsd: Math.round(meanUsd * 0.08),
        leadTimeHours: 12,
        expectedRiskReductionPercent: 42,
      },
      {
        phase: 'Near-Term (Day 2 - 7)',
        action: 'Activate strategic safety stock replenishment from secondary regional inland hubs',
        costUsd: Math.round(meanUsd * 0.14),
        leadTimeHours: 72,
        expectedRiskReductionPercent: 30,
      },
      {
        phase: 'Recovery & Hedging (Week 2+)',
        action: 'Execute forward freight agreements (FFA) and lock multi-modal rail container slots',
        costUsd: Math.round(meanUsd * 0.05),
        leadTimeHours: 168,
        expectedRiskReductionPercent: 22,
      },
    ];

    logger.info('DIGITAL_TWIN', `Monte Carlo simulation completed for ${scenario.name}: Mean Loss=$${(meanUsd / 1000000).toFixed(2)}M, VaR95=$${(p95Usd / 1000000).toFixed(2)}M`);

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      iterationsCount: iterations,
      financialImpact: {
        meanUsd,
        medianUsd,
        valueAtRisk95Usd: p95Usd,
        valueAtRisk99Usd: p99Usd,
        minimumUsd: minUsd,
        maximumUsd: maxUsd,
      },
      delays: {
        meanDelayDays,
        p95DelayDays,
        maxDelayDays: Math.max(...delayList),
        affectedShipmentsCount: results[0].containersDelayedCount,
      },
      inventoryResilience: {
        bufferDepletionDayAvg,
        stockoutProbabilityPercent: Math.min(98.5, Math.max(5.0, stockoutProb)),
        recommendedBufferIncreaseUnits: Math.round(scenario.expectedDurationDays * 420),
        emergencyReorderLeadTimeDays: Math.round(scenario.operationalParameters.alternativeCorridorExtraDays + 5),
      },
      distributionBuckets,
      mitigationRoadmap,
      generatedAt: new Date().toISOString(),
    };
  }
}
