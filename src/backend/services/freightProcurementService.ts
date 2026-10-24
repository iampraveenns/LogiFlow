/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Multi-Carrier Procurement & Dynamic Tender Matrix Engine
 * Implements carrier bid evaluation, multi-criteria score allocation, and demurrage exposure modeling.
 */

import { logger } from '../../packages/logger/index.ts';

export interface CarrierBid {
  id: string;
  carrierId: string;
  carrierName: string;
  carrierTier: 'PRIMARY_ALLIANCE' | 'EXPEDITED_SPECIALIST' | 'REGIONAL_FEEDER';
  serviceLevel: 'STANDARD_OCEAN' | 'EXPEDITED_INTERMODAL' | 'PRIORITY_AIR' | 'DIRECT_DRAYAGE';
  baseFreightRateUsd: number;
  bunkerFuelSurchargeUsd: number;
  securityTerminalSurchargeUsd: number;
  totalLandedCostUsd: number;
  transitTimeDays: number;
  onTimePerformancePercent: number; // Historical on-time delivery score
  co2EmissionsKgPerTeu: number;
  chassisAvailabilityGuarantee: boolean;
  freeTimeDaysDemurrage: number; // e.g. 7 days free time
  compositeScore: number; // 0 - 100
  isRecommended: boolean;
}

export interface FreightTenderRequest {
  tenderId: string;
  originPort: string;
  destinationPort: string;
  transportMode: 'OCEAN' | 'AIR' | 'ROAD_FTL';
  containerVolumeTeu: number;
  commodityType: string;
  targetDeliveryDeadlineDays: number;
  targetBudgetUsd: number;
  status: 'OPEN_FOR_BIDDING' | 'EVALUATION_ACTIVE' | 'AWARDED' | 'EXPIRED';
  bids: CarrierBid[];
  awardedCarrierId?: string;
  awardedAt?: string;
}

export interface MarketIndexBenchmark {
  indexName: string;
  lane: string;
  currentRateUsd: number;
  weekOverWeekChangePercent: number;
  source: string;
}

export const MARKET_BENCHMARKS: MarketIndexBenchmark[] = [
  {
    indexName: 'SCFI (Shanghai Containerized Freight Index)',
    lane: 'Shanghai (PVG) to Rotterdam (RTM) 40ft High Cube',
    currentRateUsd: 4850,
    weekOverWeekChangePercent: 3.4,
    source: 'Shanghai Shipping Exchange',
  },
  {
    indexName: 'Drewry World Container Index (WCI)',
    lane: 'Shanghai (PVG) to Los Angeles (LAX) 40ft',
    currentRateUsd: 4220,
    weekOverWeekChangePercent: -1.2,
    source: 'Drewry Maritime Financial Research',
  },
  {
    indexName: 'DAT North American Freight Index',
    lane: 'Los Angeles (LAX) to Chicago (ORD) FTL Dry Van',
    currentRateUsd: 3450,
    weekOverWeekChangePercent: 0.8,
    source: 'DAT Freight & Analytics',
  },
  {
    indexName: 'TAC Global Air Cargo Benchmark',
    lane: 'Chicago (ORD) to Frankfurt (FRA) per kg',
    currentRateUsd: 4.85,
    weekOverWeekChangePercent: 2.1,
    source: 'The Air Cargo Index (TAC)',
  },
];

const SEED_TENDERS: FreightTenderRequest[] = [
  {
    tenderId: 'TND-2026-901',
    originPort: 'Shanghai Yangshan Port (PVG)',
    destinationPort: 'Port of Rotterdam Europort (RTM)',
    transportMode: 'OCEAN',
    containerVolumeTeu: 120,
    commodityType: 'AI Data Center Server Racks & Power Distribution',
    targetDeliveryDeadlineDays: 28,
    targetBudgetUsd: 320000,
    status: 'EVALUATION_ACTIVE',
    bids: [],
  },
  {
    tenderId: 'TND-2026-902',
    originPort: 'Port of Long Beach Pier 400 (LAX)',
    destinationPort: 'Chicago O’Hare Intermodal Rail Gateway (ORD)',
    transportMode: 'ROAD_FTL',
    containerVolumeTeu: 45,
    commodityType: 'Lithium Battery Cells (Hazmat Class 9)',
    targetDeliveryDeadlineDays: 4,
    targetBudgetUsd: 110000,
    status: 'OPEN_FOR_BIDDING',
    bids: [],
  },
  {
    tenderId: 'TND-2026-903',
    originPort: 'Singapore Changi Air Logistics (SIN)',
    destinationPort: 'Hamburg Altenwerder (HAM)',
    transportMode: 'AIR',
    containerVolumeTeu: 15,
    commodityType: 'Critical Biopharmaceutical mRNA Active Substance',
    targetDeliveryDeadlineDays: 2,
    targetBudgetUsd: 85000,
    status: 'OPEN_FOR_BIDDING',
    bids: [],
  },
];

export class FreightProcurementService {
  private static tenders: Map<string, FreightTenderRequest> = new Map();

  static {
    // Initialize seed tenders with carrier bids
    SEED_TENDERS.forEach((t) => {
      t.bids = this.generateCarrierBidsForTender(t);
      this.tenders.set(t.tenderId, t);
    });
  }

  public static getMarketBenchmarks(): MarketIndexBenchmark[] {
    return MARKET_BENCHMARKS;
  }

  public static getTenders(): FreightTenderRequest[] {
    return Array.from(this.tenders.values());
  }

  public static getTenderById(id: string): FreightTenderRequest | undefined {
    return this.tenders.get(id);
  }

  /**
   * Generates competitive simulated bids across 6 major global carriers.
   */
  public static generateCarrierBidsForTender(tender: FreightTenderRequest): CarrierBid[] {
    const carriers = [
      { id: 'CAR-MSK', name: 'Maersk Line A/S', tier: 'PRIMARY_ALLIANCE' as const, reliability: 94.5, co2: 380, freeDays: 8 },
      { id: 'CAR-MSC', name: 'Mediterranean Shipping Company (MSC)', tier: 'PRIMARY_ALLIANCE' as const, reliability: 91.2, co2: 410, freeDays: 7 },
      { id: 'CAR-APX', name: 'Apex Continental Express Logistics', tier: 'EXPEDITED_SPECIALIST' as const, reliability: 97.8, co2: 340, freeDays: 10 },
      { id: 'CAR-HPL', name: 'Hapag-Lloyd Global Container Line', tier: 'PRIMARY_ALLIANCE' as const, reliability: 92.4, co2: 395, freeDays: 7 },
      { id: 'CAR-DHL', name: 'DHL Global Forwarding Intermodal', tier: 'EXPEDITED_SPECIALIST' as const, reliability: 96.0, co2: 360, freeDays: 9 },
      { id: 'CAR-ONE', name: 'Ocean Network Express (ONE)', tier: 'REGIONAL_FEEDER' as const, reliability: 89.5, co2: 430, freeDays: 5 },
    ];

    const basePerTeu = tender.transportMode === 'AIR' ? 4200 : tender.transportMode === 'ROAD_FTL' ? 1800 : 2100;
    const baseDays = tender.targetDeliveryDeadlineDays;

    const rawBids = carriers.map((c, idx) => {
      // Cost variation (-12% to +18%)
      const costVariance = 0.88 + Math.random() * 0.3;
      const baseCost = Math.round(basePerTeu * tender.containerVolumeTeu * costVariance);
      const bunker = Math.round(baseCost * 0.14);
      const terminal = Math.round(baseCost * 0.05);
      const totalCost = baseCost + bunker + terminal;

      // Transit time variation (-2 to +3 days)
      const transitDays = Math.max(1, Math.round(baseDays + (idx % 2 === 0 ? -1 : 1) * Math.floor(Math.random() * 3)));

      return {
        id: `BID-${tender.tenderId}-${c.id}`,
        carrierId: c.id,
        carrierName: c.name,
        carrierTier: c.tier,
        serviceLevel: (tender.transportMode === 'AIR' ? 'PRIORITY_AIR' : tender.transportMode === 'ROAD_FTL' ? 'DIRECT_DRAYAGE' : 'STANDARD_OCEAN') as CarrierBid['serviceLevel'],
        baseFreightRateUsd: baseCost,
        bunkerFuelSurchargeUsd: bunker,
        securityTerminalSurchargeUsd: terminal,
        totalLandedCostUsd: totalCost,
        transitTimeDays: transitDays,
        onTimePerformancePercent: c.reliability,
        co2EmissionsKgPerTeu: c.co2,
        chassisAvailabilityGuarantee: idx < 4,
        freeTimeDaysDemurrage: c.freeDays,
        compositeScore: 0,
        isRecommended: false,
      };
    });

    // Score evaluation algorithm
    const minCost = Math.min(...rawBids.map((b) => b.totalLandedCostUsd));
    const minDays = Math.min(...rawBids.map((b) => b.transitTimeDays));
    const minCo2 = Math.min(...rawBids.map((b) => b.co2EmissionsKgPerTeu));

    const scoredBids = rawBids.map((b) => {
      // 40% Cost, 35% Reliability & Speed, 15% Carbon, 10% Equipment
      const costScore = (minCost / b.totalLandedCostUsd) * 40;
      const speedScore = (minDays / b.transitTimeDays) * 20;
      const reliabilityScore = (b.onTimePerformancePercent / 100) * 15;
      const carbonScore = (minCo2 / b.co2EmissionsKgPerTeu) * 15;
      const equipmentScore = b.chassisAvailabilityGuarantee ? 10 : 4;

      const composite = Number((costScore + speedScore + reliabilityScore + carbonScore + equipmentScore).toFixed(1));

      return {
        ...b,
        compositeScore: composite,
      };
    });

    // Sort by composite score descending
    scoredBids.sort((a, b) => b.compositeScore - a.compositeScore);
    if (scoredBids.length > 0) {
      scoredBids[0].isRecommended = true;
    }

    return scoredBids;
  }

  /**
   * Award tender to a winning carrier.
   */
  public static awardTender(tenderId: string, carrierId: string): FreightTenderRequest | undefined {
    const tender = this.tenders.get(tenderId);
    if (!tender) return undefined;

    tender.status = 'AWARDED';
    tender.awardedCarrierId = carrierId;
    tender.awardedAt = new Date().toISOString();

    logger.info('PROCUREMENT', `Tender ${tenderId} awarded to carrier ${carrierId}`);
    return tender;
  }
}
