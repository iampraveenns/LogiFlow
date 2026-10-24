/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Autonomous Intermodal Rail & Yard Management System (YMS)
 * Tracks dock door assignments, yard hostler spotting moves, optical gate OCR, and detention fee avoidance clocks.
 */

import { logger } from '../../packages/logger/index.ts';

export interface YardDockDoor {
  doorNumber: number;
  status: 'AVAILABLE' | 'OCCUPIED_LOADING' | 'OCCUPIED_UNLOADING' | 'MAINTENANCE_HOLD';
  assignedTrailerId?: string;
  assignedWaybillNumber?: string;
  dockAppointmentTime?: string;
  dwellDurationMinutes: number;
  freeTimeRemainingMinutes: number; // Free time before detention penalties accrue
  detentionFeeRiskUsd: number;
}

export interface YardTrailerSlot {
  slotId: string;
  zone: 'INBOUND_STAGING' | 'OUTBOUND_STAGING' | 'REEFER_PLUG_BANK' | 'CHASSIS_DEPOT' | 'RAIL_SIDINGS';
  trailerNumber: string;
  licensePlate: string;
  carrierScac: string;
  isReefer: boolean;
  reeferPlugConnected?: boolean;
  dwellHours: number;
  status: 'STAGED' | 'SPOTTED_AT_DOCK' | 'GATE_OUT_READY';
}

export interface HostlerMoveTask {
  taskId: string;
  hostlerVehicleId: string;
  driverName: string;
  trailerNumber: string;
  fromLocation: string;
  toLocation: string;
  priority: 'CRITICAL_DETENTION' | 'SCHEDULED_DOCK' | 'NORMAL_STAGING';
  status: 'PENDING' | 'DISPATCHED' | 'IN_TRANSIT' | 'COMPLETED';
  requestedAt: string;
  completedAt?: string;
}

export interface GateOcrTransaction {
  transactionId: string;
  gateLane: string;
  timestamp: string;
  trailerNumber: string;
  chassisVin: string;
  containerIsoCode: string;
  sealNumber: string;
  sealIntactVerified: boolean;
  measuredWeightLbs: number;
  tireTreadAnomalyDetected: boolean;
  driverLicenseNumber: string;
  gatePassGranted: boolean;
}

export class YardManagementService {
  private static dockDoors: Map<number, YardDockDoor> = new Map();
  private static yardSlots: Map<string, YardTrailerSlot> = new Map();
  private static hostlerTasks: Map<string, HostlerMoveTask> = new Map();
  private static ocrTransactions: GateOcrTransaction[] = [];

  static {
    // Seed 12 primary dock doors
    for (let d = 1; d <= 12; d++) {
      const isOcc = d === 2 || d === 5 || d === 8;
      const dwell = isOcc ? 85 + d * 6 : 0;
      const freeRemain = Math.max(0, 120 - dwell);
      const fee = dwell > 120 ? Math.round(((dwell - 120) / 60) * 150) : 0;

      this.dockDoors.set(d, {
        doorNumber: d,
        status: isOcc ? (d % 2 === 0 ? 'OCCUPIED_UNLOADING' : 'OCCUPIED_LOADING') : 'AVAILABLE',
        assignedTrailerId: isOcc ? `TRL-99${d}` : undefined,
        assignedWaybillNumber: isOcc ? `WB-2026-00${d}` : undefined,
        dockAppointmentTime: isOcc ? new Date(Date.now() - dwell * 60000).toISOString() : undefined,
        dwellDurationMinutes: dwell,
        freeTimeRemainingMinutes: freeRemain,
        detentionFeeRiskUsd: fee,
      });
    }

    // Seed yard staging slots
    const slots: YardTrailerSlot[] = [
      { slotId: 'YARD-IN-01', zone: 'INBOUND_STAGING', trailerNumber: 'TRL-9901', licensePlate: 'NL-88-ZFD', carrierScac: 'APEXL', isReefer: true, dwellHours: 3.5, status: 'STAGED' },
      { slotId: 'YARD-REEF-02', zone: 'REEFER_PLUG_BANK', trailerNumber: 'REEFER-EU-904', licensePlate: 'DE-44-KLX', carrierScac: 'APEXL', isReefer: true, reeferPlugConnected: true, dwellHours: 1.2, status: 'STAGED' },
      { slotId: 'YARD-OUT-03', zone: 'OUTBOUND_STAGING', trailerNumber: 'TRL-8822', licensePlate: 'CA-918-XKJ', carrierScac: 'MSKL', isReefer: false, dwellHours: 0.8, status: 'GATE_OUT_READY' },
      { slotId: 'YARD-RAIL-04', zone: 'RAIL_SIDINGS', trailerNumber: 'WELL-CAR-771', licensePlate: 'BNSF-9902', carrierScac: 'BNSF', isReefer: false, dwellHours: 6.0, status: 'STAGED' },
      { slotId: 'YARD-CHAS-05', zone: 'CHASSIS_DEPOT', trailerNumber: 'CHS-53FT-41', licensePlate: 'IL-55-TRK', carrierScac: 'APEXL', isReefer: false, dwellHours: 12.0, status: 'STAGED' },
    ];
    slots.forEach((s) => this.yardSlots.set(s.slotId, s));

    // Seed active hostler tasks
    const task1: HostlerMoveTask = {
      taskId: 'TASK-YARD-801',
      hostlerVehicleId: 'YARD-MULE-01',
      driverName: 'Klaus Fischer (Hostler Unit #1)',
      trailerNumber: 'REEFER-EU-904',
      fromLocation: 'REEFER_PLUG_BANK (Bay 2)',
      toLocation: 'Dock Door #8 (Cold Cross-Dock Berth)',
      priority: 'CRITICAL_DETENTION',
      status: 'IN_TRANSIT',
      requestedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    };
    this.hostlerTasks.set(task1.taskId, task1);

    // Seed Gate OCR transactions
    this.ocrTransactions.push({
      transactionId: 'OCR-GATE-9091',
      gateLane: 'Inbound Lane 1 (High-Speed RFID & OCR)',
      timestamp: new Date().toISOString(),
      trailerNumber: 'TRL-9901',
      chassisVin: '1HD1V2B57PN991204',
      containerIsoCode: '45G1 (40ft High Cube Reefer)',
      sealNumber: 'SEAL-APEX-88912',
      sealIntactVerified: true,
      measuredWeightLbs: 64200,
      tireTreadAnomalyDetected: false,
      driverLicenseNumber: 'DL-NL-998124',
      gatePassGranted: true,
    });
  }

  public static getDockDoors(): YardDockDoor[] {
    return Array.from(this.dockDoors.values());
  }

  public static getYardSlots(): YardTrailerSlot[] {
    return Array.from(this.yardSlots.values());
  }

  public static getHostlerTasks(): HostlerMoveTask[] {
    return Array.from(this.hostlerTasks.values());
  }

  public static getGateOcrTransactions(): GateOcrTransaction[] {
    return this.ocrTransactions;
  }

  /**
   * Dispatch a hostler yard truck to move a trailer to a specific dock or staging area.
   */
  public static createHostlerMoveTask(params: {
    trailerNumber: string;
    fromLocation: string;
    toLocation: string;
    priority: HostlerMoveTask['priority'];
  }): HostlerMoveTask {
    const taskId = `TASK-YARD-${Date.now().toString().slice(-4)}`;
    const task: HostlerMoveTask = {
      taskId,
      hostlerVehicleId: 'YARD-MULE-02 (Autonomous Yard Tug)',
      driverName: 'AutoTug AI Teleoperation System',
      trailerNumber: params.trailerNumber,
      fromLocation: params.fromLocation,
      toLocation: params.toLocation,
      priority: params.priority,
      status: 'DISPATCHED',
      requestedAt: new Date().toISOString(),
    };

    this.hostlerTasks.set(taskId, task);
    logger.info('YMS_SERVICE', `Hostler move task ${taskId} dispatched for trailer ${params.trailerNumber}`);
    return task;
  }

  /**
   * Assign or free a dock door.
   */
  public static toggleDockDoorStatus(doorNumber: number): YardDockDoor | undefined {
    const door = this.dockDoors.get(doorNumber);
    if (!door) return undefined;

    if (door.status === 'AVAILABLE') {
      door.status = 'OCCUPIED_LOADING';
      door.assignedTrailerId = `TRL-${Math.floor(1000 + Math.random() * 9000)}`;
      door.dwellDurationMinutes = 15;
      door.freeTimeRemainingMinutes = 105;
      door.detentionFeeRiskUsd = 0;
    } else {
      door.status = 'AVAILABLE';
      door.assignedTrailerId = undefined;
      door.assignedWaybillNumber = undefined;
      door.dwellDurationMinutes = 0;
      door.freeTimeRemainingMinutes = 120;
      door.detentionFeeRiskUsd = 0;
    }

    this.dockDoors.set(doorNumber, door);
    return door;
  }
}
