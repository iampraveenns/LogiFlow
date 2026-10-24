/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Marine Port Terminal & Automated Crane Optimization Engine
 * Implements Berth Allocation (BAP), Quay Crane Scheduling (QCASP),
 * Automated Stacking Crane (ASC) Yard Blocks, and Automated Guided Vehicle (AGV) routing.
 */

import { logger } from '../../packages/logger/index.ts';

export type CraneType = 'SUPER_POST_PANAMAX' | 'POST_PANAMAX' | 'PANAMAX' | 'MOBILE_HARBOR';
export type ContainerSize = '20FT' | '40FT' | '45FT' | 'HIGH_CUBE_40FT';
export type ContainerType = 'DRY_VAN' | 'REEFER' | 'OPEN_TOP' | 'FLAT_RACK' | 'TANK_ISO' | 'DANGEROUS_GOODS';

export interface BerthSlot {
  berthId: string;
  berthName: string;
  terminalCode: string;
  lengthMeters: number;
  dredgedDepthMeters: number;
  maxDraftAllowableMeters: number;
  bollardPullTons: number;
  equippedQuayCranes: string[];
  currentVesselImo?: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'TIDAL_HOLD';
}

export interface QuayCrane {
  craneId: string;
  craneName: string;
  berthId: string;
  craneType: CraneType;
  outreachMeters: number; // Max outreach across vessel container rows (e.g. 24 rows)
  liftingCapacityTons: number; // Twin-lift / Tandem 65T - 100T
  movesPerHourNominal: number; // 30 - 45 moves/hour
  currentRailPositionMeters: number;
  assignedVesselImo?: string;
  activeBayNumber?: number;
  totalMovesCompletedToday: number;
  operationalStatus: 'ACTIVE_LIFTING' | 'IDLE' | 'GANTRY_TRAVERSING' | 'MAINTENANCE';
}

export interface YardBlock {
  blockId: string; // e.g. "BLK-A1"
  blockType: 'REEFER' | 'DRY_STANDARD' | 'HAZMAT_ISOLATION' | 'EMPTY_DEPOT';
  totalBays: number;   // Along length (e.g. 24 bays)
  totalRows: number;   // Across width (e.g. 6 rows)
  maxTiers: number;    // Stacking height (1-over-5 = 6 tiers max)
  currentTeuOccupancy: number;
  maxTeuCapacity: number;
  reeferPlugsInstalled: number;
  reeferPlugsOccupied: number;
  ascCraneId: string;  // Assigned Automated Stacking Crane
  rehandlingRatioPercent: number; // Estimated reshuffle moves %
}

export interface TerminalContainer {
  containerId: string; // e.g. "MSKU9018241"
  isoType: string;     // e.g. "45R1" (40ft high cube reefer)
  size: ContainerSize;
  cargoType: ContainerType;
  grossWeightKg: number;
  vesselImo: string;
  bay: number;
  row: number;
  tier: number;
  yardBlockId: string;
  requiresReeferPower: boolean;
  reeferSetTempCelsius?: number;
  isHazmat: boolean;
  unNumber?: string;
  customsReleaseStatus: 'RELEASED' | 'HOLD_EXAM' | 'PENDING_DOCS';
  destinationType: 'VESSEL_LOAD' | 'RAIL_RAMP' | 'GATE_TRUCK_PICKUP';
}

export interface AutomatedGuidedVehicle {
  agvId: string;
  model: 'LITHIUM_AGV_70T' | 'HYBRID_HYDROGEN_AGV';
  batteryStateOfChargePercent: number;
  currentZone: 'QUAYSIDE' | 'BUFFER_ZONE' | 'YARD_BLOCK_TRANSFER' | 'CHARGING_STATION';
  coordinates: { x: number; y: number };
  assignedContainerId?: string;
  destinationNode: string;
  speedKnots: number;
  operatingMode: 'EN_ROUTE_LIFT' | 'CARRYING_PAYLOAD' | 'CHARGING' | 'STANDBY';
}

export interface PortTerminalMetrics {
  terminalCode: string;
  terminalName: string;
  country: string;
  berthCount: number;
  quayCraneCount: number;
  yardBlockCount: number;
  activeAgvCount: number;
  dailyTeuThroughput: number;
  grossCraneMovesPerHour: number;
  averageVesselTurnaroundHours: number;
  berthOccupancyRatePercent: number;
  dwellTimeAverageDays: number;
}

export class PortTerminalService {
  private static berths: Map<string, BerthSlot> = new Map();
  private static quayCranes: Map<string, QuayCrane> = new Map();
  private static yardBlocks: Map<string, YardBlock> = new Map();
  private static agvs: Map<string, AutomatedGuidedVehicle> = new Map();
  private static containers: Map<string, TerminalContainer> = new Map();

  static {
    // Seed Maasvlakte II / Rotterdam World Gateway configuration
    const b1: BerthSlot = {
      berthId: 'BRTH-RWG-01',
      berthName: 'Deepwater Quay 1',
      terminalCode: 'RTM-MVII',
      lengthMeters: 550,
      dredgedDepthMeters: 20.5,
      maxDraftAllowableMeters: 18.5,
      bollardPullTons: 250,
      equippedQuayCranes: ['QC-01', 'QC-02', 'QC-03', 'QC-04'],
      currentVesselImo: 'IMO9839438', // Ever Ace (24,000 TEU)
      status: 'OCCUPIED'
    };

    const b2: BerthSlot = {
      berthId: 'BRTH-RWG-02',
      berthName: 'Deepwater Quay 2',
      terminalCode: 'RTM-MVII',
      lengthMeters: 500,
      dredgedDepthMeters: 19.5,
      maxDraftAllowableMeters: 17.5,
      bollardPullTons: 200,
      equippedQuayCranes: ['QC-05', 'QC-06', 'QC-07'],
      currentVesselImo: 'IMO9776171', // CMA CGM Antoine de Saint Exupery
      status: 'OCCUPIED'
    };

    const b3: BerthSlot = {
      berthId: 'BRTH-RWG-03',
      berthName: 'Feeder & Barge Basin',
      terminalCode: 'RTM-MVII',
      lengthMeters: 380,
      dredgedDepthMeters: 12.0,
      maxDraftAllowableMeters: 10.5,
      bollardPullTons: 120,
      equippedQuayCranes: ['QC-08', 'QC-09'],
      status: 'AVAILABLE'
    };

    this.berths.set(b1.berthId, b1);
    this.berths.set(b2.berthId, b2);
    this.berths.set(b3.berthId, b3);

    // Seed Quay Cranes
    const qcs: QuayCrane[] = [
      {
        craneId: 'QC-01',
        craneName: 'Super Post-Panamax Crane 1',
        berthId: 'BRTH-RWG-01',
        craneType: 'SUPER_POST_PANAMAX',
        outreachMeters: 72,
        liftingCapacityTons: 85,
        movesPerHourNominal: 38,
        currentRailPositionMeters: 110,
        assignedVesselImo: 'IMO9839438',
        activeBayNumber: 14,
        totalMovesCompletedToday: 342,
        operationalStatus: 'ACTIVE_LIFTING'
      },
      {
        craneId: 'QC-02',
        craneName: 'Super Post-Panamax Crane 2',
        berthId: 'BRTH-RWG-01',
        craneType: 'SUPER_POST_PANAMAX',
        outreachMeters: 72,
        liftingCapacityTons: 85,
        movesPerHourNominal: 36,
        currentRailPositionMeters: 220,
        assignedVesselImo: 'IMO9839438',
        activeBayNumber: 26,
        totalMovesCompletedToday: 310,
        operationalStatus: 'ACTIVE_LIFTING'
      },
      {
        craneId: 'QC-03',
        craneName: 'Super Post-Panamax Crane 3',
        berthId: 'BRTH-RWG-01',
        craneType: 'SUPER_POST_PANAMAX',
        outreachMeters: 72,
        liftingCapacityTons: 85,
        movesPerHourNominal: 37,
        currentRailPositionMeters: 340,
        assignedVesselImo: 'IMO9839438',
        activeBayNumber: 42,
        totalMovesCompletedToday: 295,
        operationalStatus: 'ACTIVE_LIFTING'
      },
      {
        craneId: 'QC-04',
        craneName: 'Super Post-Panamax Crane 4',
        berthId: 'BRTH-RWG-01',
        craneType: 'SUPER_POST_PANAMAX',
        outreachMeters: 72,
        liftingCapacityTons: 85,
        movesPerHourNominal: 35,
        currentRailPositionMeters: 460,
        assignedVesselImo: 'IMO9839438',
        activeBayNumber: 58,
        totalMovesCompletedToday: 280,
        operationalStatus: 'ACTIVE_LIFTING'
      },
      {
        craneId: 'QC-05',
        craneName: 'Super Post-Panamax Crane 5',
        berthId: 'BRTH-RWG-02',
        craneType: 'SUPER_POST_PANAMAX',
        outreachMeters: 68,
        liftingCapacityTons: 80,
        movesPerHourNominal: 34,
        currentRailPositionMeters: 130,
        assignedVesselImo: 'IMO9776171',
        activeBayNumber: 18,
        totalMovesCompletedToday: 264,
        operationalStatus: 'ACTIVE_LIFTING'
      },
      {
        craneId: 'QC-06',
        craneName: 'Super Post-Panamax Crane 6',
        berthId: 'BRTH-RWG-02',
        craneType: 'SUPER_POST_PANAMAX',
        outreachMeters: 68,
        liftingCapacityTons: 80,
        movesPerHourNominal: 35,
        currentRailPositionMeters: 290,
        assignedVesselImo: 'IMO9776171',
        activeBayNumber: 38,
        totalMovesCompletedToday: 278,
        operationalStatus: 'ACTIVE_LIFTING'
      },
      {
        craneId: 'QC-07',
        craneName: 'Super Post-Panamax Crane 7',
        berthId: 'BRTH-RWG-02',
        craneType: 'SUPER_POST_PANAMAX',
        outreachMeters: 68,
        liftingCapacityTons: 80,
        movesPerHourNominal: 33,
        currentRailPositionMeters: 410,
        assignedVesselImo: 'IMO9776171',
        activeBayNumber: 54,
        totalMovesCompletedToday: 245,
        operationalStatus: 'ACTIVE_LIFTING'
      },
      {
        craneId: 'QC-08',
        craneName: 'Post-Panamax Feeder Crane 8',
        berthId: 'BRTH-RWG-03',
        craneType: 'POST_PANAMAX',
        outreachMeters: 48,
        liftingCapacityTons: 65,
        movesPerHourNominal: 28,
        currentRailPositionMeters: 80,
        totalMovesCompletedToday: 110,
        operationalStatus: 'IDLE'
      },
      {
        craneId: 'QC-09',
        craneName: 'Post-Panamax Feeder Crane 9',
        berthId: 'BRTH-RWG-03',
        craneType: 'POST_PANAMAX',
        outreachMeters: 48,
        liftingCapacityTons: 65,
        movesPerHourNominal: 28,
        currentRailPositionMeters: 220,
        totalMovesCompletedToday: 95,
        operationalStatus: 'IDLE'
      }
    ];

    qcs.forEach(qc => this.quayCranes.set(qc.craneId, qc));

    // Seed Yard Blocks (Automated Stacking Cranes ASC)
    const blocks: YardBlock[] = [
      {
        blockId: 'BLK-A1',
        blockType: 'DRY_STANDARD',
        totalBays: 24,
        totalRows: 6,
        maxTiers: 5,
        currentTeuOccupancy: 590,
        maxTeuCapacity: 720,
        reeferPlugsInstalled: 0,
        reeferPlugsOccupied: 0,
        ascCraneId: 'ASC-01',
        rehandlingRatioPercent: 8.4
      },
      {
        blockId: 'BLK-A2',
        blockType: 'DRY_STANDARD',
        totalBays: 24,
        totalRows: 6,
        maxTiers: 5,
        currentTeuOccupancy: 620,
        maxTeuCapacity: 720,
        reeferPlugsInstalled: 0,
        reeferPlugsOccupied: 0,
        ascCraneId: 'ASC-02',
        rehandlingRatioPercent: 9.1
      },
      {
        blockId: 'BLK-R1',
        blockType: 'REEFER',
        totalBays: 20,
        totalRows: 6,
        maxTiers: 4,
        currentTeuOccupancy: 380,
        maxTeuCapacity: 480,
        reeferPlugsInstalled: 400,
        reeferPlugsOccupied: 342,
        ascCraneId: 'ASC-03',
        rehandlingRatioPercent: 6.2
      },
      {
        blockId: 'BLK-H1',
        blockType: 'HAZMAT_ISOLATION',
        totalBays: 16,
        totalRows: 4,
        maxTiers: 3,
        currentTeuOccupancy: 110,
        maxTeuCapacity: 192,
        reeferPlugsInstalled: 40,
        reeferPlugsOccupied: 18,
        ascCraneId: 'ASC-04',
        rehandlingRatioPercent: 4.1
      },
      {
        blockId: 'BLK-E1',
        blockType: 'EMPTY_DEPOT',
        totalBays: 28,
        totalRows: 8,
        maxTiers: 6,
        currentTeuOccupancy: 1040,
        maxTeuCapacity: 1344,
        reeferPlugsInstalled: 0,
        reeferPlugsOccupied: 0,
        ascCraneId: 'ASC-05',
        rehandlingRatioPercent: 12.8
      }
    ];

    blocks.forEach(b => this.yardBlocks.set(b.blockId, b));

    // Seed Automated Guided Vehicles (AGV)
    const agvFleet: AutomatedGuidedVehicle[] = [
      {
        agvId: 'AGV-101',
        model: 'LITHIUM_AGV_70T',
        batteryStateOfChargePercent: 88,
        currentZone: 'QUAYSIDE',
        coordinates: { x: 120, y: 45 },
        assignedContainerId: 'MSKU9018241',
        destinationNode: 'BLK-R1',
        speedKnots: 11.2,
        operatingMode: 'CARRYING_PAYLOAD'
      },
      {
        agvId: 'AGV-102',
        model: 'LITHIUM_AGV_70T',
        batteryStateOfChargePercent: 74,
        currentZone: 'BUFFER_ZONE',
        coordinates: { x: 230, y: 70 },
        destinationNode: 'QC-02',
        speedKnots: 12.0,
        operatingMode: 'EN_ROUTE_LIFT'
      },
      {
        agvId: 'AGV-103',
        model: 'HYBRID_HYDROGEN_AGV',
        batteryStateOfChargePercent: 92,
        currentZone: 'YARD_BLOCK_TRANSFER',
        coordinates: { x: 310, y: 120 },
        assignedContainerId: 'CMAU8102938',
        destinationNode: 'BLK-A1',
        speedKnots: 10.8,
        operatingMode: 'CARRYING_PAYLOAD'
      },
      {
        agvId: 'AGV-104',
        model: 'LITHIUM_AGV_70T',
        batteryStateOfChargePercent: 21,
        currentZone: 'CHARGING_STATION',
        coordinates: { x: 50, y: 220 },
        destinationNode: 'FAST_CHARGE_BAY_3',
        speedKnots: 0,
        operatingMode: 'CHARGING'
      },
      {
        agvId: 'AGV-105',
        model: 'LITHIUM_AGV_70T',
        batteryStateOfChargePercent: 95,
        currentZone: 'QUAYSIDE',
        coordinates: { x: 440, y: 48 },
        destinationNode: 'QC-04',
        speedKnots: 11.5,
        operatingMode: 'EN_ROUTE_LIFT'
      }
    ];

    agvFleet.forEach(a => this.agvs.set(a.agvId, a));

    // Seed Sample High-Value Containers
    const sampleContainers: TerminalContainer[] = [
      {
        containerId: 'MSKU9018241',
        isoType: '45R1',
        size: 'HIGH_CUBE_40FT',
        cargoType: 'REEFER',
        grossWeightKg: 28450,
        vesselImo: 'IMO9839438',
        bay: 14,
        row: 4,
        tier: 2,
        yardBlockId: 'BLK-R1',
        requiresReeferPower: true,
        reeferSetTempCelsius: -20.0,
        isHazmat: false,
        customsReleaseStatus: 'RELEASED',
        destinationType: 'RAIL_RAMP'
      },
      {
        containerId: 'CMAU8102938',
        isoType: '42G1',
        size: '40FT',
        cargoType: 'DRY_VAN',
        grossWeightKg: 26800,
        vesselImo: 'IMO9776171',
        bay: 18,
        row: 2,
        tier: 3,
        yardBlockId: 'BLK-A1',
        requiresReeferPower: false,
        isHazmat: false,
        customsReleaseStatus: 'RELEASED',
        destinationType: 'GATE_TRUCK_PICKUP'
      },
      {
        containerId: 'HLXU7749102',
        isoType: '22T1',
        size: '20FT',
        cargoType: 'DANGEROUS_GOODS',
        grossWeightKg: 21200,
        vesselImo: 'IMO9839438',
        bay: 26,
        row: 6,
        tier: 1,
        yardBlockId: 'BLK-H1',
        requiresReeferPower: false,
        isHazmat: true,
        unNumber: 'UN1993',
        customsReleaseStatus: 'HOLD_EXAM',
        destinationType: 'VESSEL_LOAD'
      }
    ];

    sampleContainers.forEach(c => this.containers.set(c.containerId, c));

    logger.info('PORT_TERMINAL', 'Marine Port Terminal & Crane Optimization Engine initialized');
  }

  public static getBerths(): BerthSlot[] {
    return Array.from(this.berths.values());
  }

  public static getQuayCranes(): QuayCrane[] {
    return Array.from(this.quayCranes.values());
  }

  public static getYardBlocks(): YardBlock[] {
    return Array.from(this.yardBlocks.values());
  }

  public static getAgvs(): AutomatedGuidedVehicle[] {
    return Array.from(this.agvs.values());
  }

  public static getContainers(): TerminalContainer[] {
    return Array.from(this.containers.values());
  }

  /**
   * Evaluates Berth Allocation Feasibility (BAP) based on vessel physical geometry and tides.
   */
  public static evaluateBerthAllocation(
    berthId: string,
    vessel: {
      vesselName: string;
      lengthOverallMeters: number;
      beamMeters: number;
      actualDraftMeters: number;
      displacementTons: number;
    }
  ): {
    feasible: boolean;
    clearanceMarginMeters: number;
    underKeelClearanceMeters: number;
    issues: string[];
  } {
    const berth = this.berths.get(berthId);
    if (!berth) {
      return {
        feasible: false,
        clearanceMarginMeters: 0,
        underKeelClearanceMeters: 0,
        issues: [`Berth ${berthId} not found in terminal registry`]
      };
    }

    const issues: string[] = [];
    const lengthMargin = berth.lengthMeters - vessel.lengthOverallMeters;
    if (lengthMargin < 25) {
      issues.push(`Insufficient safety length margin: Berth ${berth.lengthMeters}m vs Vessel LOA ${vessel.lengthOverallMeters}m (minimum 25m mooring safety clearance required).`);
    }

    const underKeel = berth.dredgedDepthMeters - vessel.actualDraftMeters;
    if (underKeel < 1.5) {
      issues.push(`Critical Under-Keel Clearance (UKC): ${underKeel.toFixed(2)}m is below port authority 1.5m minimum safe dredging buffer.`);
    }

    if (vessel.actualDraftMeters > berth.maxDraftAllowableMeters) {
      issues.push(`Vessel draft (${vessel.actualDraftMeters}m) exceeds maximum allowable draught (${berth.maxDraftAllowableMeters}m) at ${berth.berthName}.`);
    }

    return {
      feasible: issues.length === 0,
      clearanceMarginMeters: Math.max(0, lengthMargin),
      underKeelClearanceMeters: Number(underKeel.toFixed(2)),
      issues
    };
  }

  /**
   * Quay Crane Scheduling & Interference Rule Checker (QCASP)
   * Super Post-Panamax cranes require minimum 1-bay / 15-meter separation to prevent boom clash.
   */
  public static validateCraneSafetySeparation(
    craneAId: string,
    craneBId: string
  ): {
    collisionRisk: boolean;
    separationMeters: number;
    recommendation: string;
  } {
    const cA = this.quayCranes.get(craneAId);
    const cB = this.quayCranes.get(craneBId);

    if (!cA || !cB) {
      return { collisionRisk: false, separationMeters: 999, recommendation: 'Crane not found' };
    }

    if (cA.berthId !== cB.berthId) {
      return { collisionRisk: false, separationMeters: 999, recommendation: 'Cranes operating on separate berths' };
    }

    const distance = Math.abs(cA.currentRailPositionMeters - cB.currentRailPositionMeters);
    const minSafeGantrySeparationMeters = 35; // Gantry footprint + spreader swing envelope

    if (distance < minSafeGantrySeparationMeters) {
      return {
        collisionRisk: true,
        separationMeters: distance,
        recommendation: `CRITICAL GANTRY PROXIMITY: ${distance}m separation is under ${minSafeGantrySeparationMeters}m minimum safety buffer. Interlock engaged.`
      };
    }

    return {
      collisionRisk: false,
      separationMeters: distance,
      recommendation: `Nominal separation (${distance}m). Spreader envelopes cleared for tandem operations.`
    };
  }

  /**
   * Calculates overall terminal performance KPIs
   */
  public static getTerminalMetrics(): PortTerminalMetrics {
    const totalOccupancy = Array.from(this.yardBlocks.values()).reduce((sum, b) => sum + b.currentTeuOccupancy, 0);
    const totalCapacity = Array.from(this.yardBlocks.values()).reduce((sum, b) => sum + b.maxTeuCapacity, 0);
    const totalMoves = Array.from(this.quayCranes.values()).reduce((sum, q) => sum + q.totalMovesCompletedToday, 0);

    const activeQcs = Array.from(this.quayCranes.values()).filter(q => q.operationalStatus === 'ACTIVE_LIFTING');
    const avgGmhp = activeQcs.length > 0
      ? Number((activeQcs.reduce((s, q) => s + q.movesPerHourNominal, 0) / activeQcs.length).toFixed(1))
      : 32.5;

    return {
      terminalCode: 'RTM-MVII',
      terminalName: 'Rotterdam Maasvlakte II World Gateway',
      country: 'NL',
      berthCount: this.berths.size,
      quayCraneCount: this.quayCranes.size,
      yardBlockCount: this.yardBlocks.size,
      activeAgvCount: Array.from(this.agvs.values()).filter(a => a.operatingMode !== 'CHARGING').length,
      dailyTeuThroughput: totalMoves * 1.62, // TEU factor per container lift
      grossCraneMovesPerHour: avgGmhp,
      averageVesselTurnaroundHours: 28.5,
      berthOccupancyRatePercent: Number(((2 / this.berths.size) * 100).toFixed(1)),
      dwellTimeAverageDays: 3.8
    };
  }
}
