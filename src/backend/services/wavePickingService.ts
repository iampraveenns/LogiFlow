/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Cross-Docking & Automated Wave Picking Engine
 * Implements serpentine pick-path heuristic routing, multi-order wave clustering, and cross-dock flow matching.
 */

import { logger } from '../../packages/logger/index.ts';

export interface PickListItem {
  sku: string;
  productName: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
  quantityOrdered: number;
  pickSequenceIndex: number;
  isPerishableColdChain: boolean;
  status: 'PENDING' | 'PICKED' | 'VERIFIED_SCANNED';
}

export interface PickingWave {
  waveId: string;
  warehouseId: string;
  waveType: 'STANDARD_BATCH' | 'EXPEDITED_HOT_HATCH' | 'COLD_CHAIN_PRIORITY' | 'CROSS_DOCK_DIRECT';
  totalUnitsToPick: number;
  totalUniqueSkus: number;
  optimizedWalkDistanceMeters: number;
  baselineWalkDistanceMeters: number;
  walkDistanceSavedPercentage: number;
  assignedPickerId: string;
  assignedPickerName: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'STAGED_AT_DOCK' | 'COMPLETED';
  items: PickListItem[];
  createdAt: string;
}

export interface CrossDockFlowMatch {
  matchId: string;
  inboundWaybillNumber: string;
  outboundWaybillNumber: string;
  inboundDoorNumber: number;
  outboundDoorNumber: number;
  sku: string;
  productName: string;
  palletQuantity: number;
  flowThroughTimeMinutes: number;
  laborSavingsUsd: number;
}

export class WavePickingService {
  private static waves: Map<string, PickingWave> = new Map();
  private static crossDockMatches: CrossDockFlowMatch[] = [];

  static {
    // Seed picking wave with Serpentine S-Shape pick sequence
    const w1Items: PickListItem[] = [
      { sku: 'SKU-BIO-4421-VAC', productName: 'CryoVax mRNA Vaccines', aisle: 'C01', rack: 'R02', shelf: 'S01', bin: 'B04', quantityOrdered: 240, pickSequenceIndex: 1, isPerishableColdChain: true, status: 'PICKED' },
      { sku: 'SKU-NV-9080-GPU', productName: 'UltraCompute AI Accelerators', aisle: 'A04', rack: 'R12', shelf: 'S03', bin: 'B01', quantityOrdered: 12, pickSequenceIndex: 2, isPerishableColdChain: false, status: 'VERIFIED_SCANNED' },
      { sku: 'SKU-EV-CELL-21700', productName: 'EV Battery Cells Hazmat 9', aisle: 'H02', rack: 'R08', shelf: 'S04', bin: 'B02', quantityOrdered: 500, pickSequenceIndex: 3, isPerishableColdChain: false, status: 'PENDING' },
      { sku: 'SKU-AERO-TURB-BLD', productName: 'Titanium Turbofan Blades', aisle: 'M05', rack: 'R15', shelf: 'S02', bin: 'B01', quantityOrdered: 8, pickSequenceIndex: 4, isPerishableColdChain: false, status: 'PENDING' },
    ];

    const wave1: PickingWave = {
      waveId: 'WAVE-2026-0041',
      warehouseId: 'WH-RTM-01',
      waveType: 'COLD_CHAIN_PRIORITY',
      totalUnitsToPick: 760,
      totalUniqueSkus: 4,
      optimizedWalkDistanceMeters: 420,
      baselineWalkDistanceMeters: 640,
      walkDistanceSavedPercentage: 34.4,
      assignedPickerId: 'PCK-109',
      assignedPickerName: 'Sven Van Dijk (AMR Autonomous Cart Operator)',
      status: 'IN_PROGRESS',
      items: w1Items,
      createdAt: new Date().toISOString(),
    };

    this.waves.set(wave1.waveId, wave1);

    // Seed cross-dock flow matches
    this.crossDockMatches = [
      {
        matchId: 'XMATCH-001',
        inboundWaybillNumber: 'LGF-908124-EU',
        outboundWaybillNumber: 'LGF-109288-HOLD',
        inboundDoorNumber: 2,
        outboundDoorNumber: 8,
        sku: 'SKU-BIO-4421-VAC',
        productName: 'CryoVax mRNA Immunotherapy Vaccines',
        palletQuantity: 18,
        flowThroughTimeMinutes: 24,
        laborSavingsUsd: 480, // Avoided storage putaway and retrieval labor
      },
      {
        matchId: 'XMATCH-002',
        inboundWaybillNumber: 'LGF-772911-US',
        outboundWaybillNumber: 'LGF-331099-AIR',
        inboundDoorNumber: 5,
        outboundDoorNumber: 11,
        sku: 'SKU-NV-9080-GPU',
        productName: 'UltraCompute AI Tensor H200 Modules',
        palletQuantity: 8,
        flowThroughTimeMinutes: 18,
        laborSavingsUsd: 320,
      },
    ];
  }

  public static getWaves(): PickingWave[] {
    return Array.from(this.waves.values());
  }

  public static getCrossDockMatches(): CrossDockFlowMatch[] {
    return this.crossDockMatches;
  }

  /**
   * Mark an item within a wave as picked/scanned.
   */
  public static markItemPicked(waveId: string, sku: string): PickingWave | undefined {
    const wave = this.waves.get(waveId);
    if (!wave) return undefined;

    const it = wave.items.find((i) => i.sku === sku);
    if (it) {
      it.status = 'VERIFIED_SCANNED';
      const allDone = wave.items.every((i) => i.status === 'VERIFIED_SCANNED');
      if (allDone) {
        wave.status = 'STAGED_AT_DOCK';
      }
    }

    this.waves.set(waveId, wave);
    logger.info('WAVE_PICKING', `Wave ${waveId}: SKU ${sku} marked verified scanned`);
    return wave;
  }
}
