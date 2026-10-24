/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Fleet Maintenance & Predictive Prognostics Engine
 * Computes component wear physics, predictive failure horizons, and automated work orders.
 */

import { logger } from '../../packages/logger/index.ts';

export interface ComponentWearProfile {
  componentName: string;
  category: 'BRAKES' | 'POWERTRAIN' | 'TIRES' | 'ELECTRICAL_EV' | 'FLUIDS_EMISSIONS';
  wearPercentage: number; // 0 - 100% (100% = fully worn)
  healthStatus: 'OPTIMAL' | 'FAIR' | 'ATTENTION_REQUIRED' | 'CRITICAL_REPLACE';
  remainingUsefulLifeKm: number;
  remainingUsefulLifeDays: number;
  lastInspectionDate: string;
  metricReadout: string; // e.g. "4.2 mm pad thickness", "74% oil life"
}

export interface PredictivePrognosisAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  component: string;
  failureRiskPercent: number; // 0 - 100%
  predictedFailureKmRange: [number, number];
  predictedFailureDays: number;
  rootCauseTelemetry: string;
  recommendedIntervention: string;
  estimatedDowntimeHours: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface MaintenanceWorkOrder {
  orderId: string;
  vehicleId: string;
  vehicleName: string;
  priority: 'URGENT_AOG' | 'SCHEDULED_PM' | 'STANDARD_DEFECT';
  status: 'PENDING_APPROVAL' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  facilityLocation: string;
  scheduledDate: string;
  serviceType: string;
  requiredParts: {
    partNumber: string;
    description: string;
    quantity: number;
    unitCostUsd: number;
  }[];
  estimatedLaborHours: number;
  totalEstimatedCostUsd: number;
  assignedTechnician: string;
}

export class FleetMaintenanceService {
  private static workOrders: Map<string, MaintenanceWorkOrder> = new Map();

  static {
    const wo1: MaintenanceWorkOrder = {
      orderId: 'WO-2026-8801',
      vehicleId: 'VEH-TRK-102',
      vehicleName: 'Apex Western Intermodal #102',
      priority: 'URGENT_AOG',
      status: 'IN_PROGRESS',
      facilityLocation: 'Chicago Central Depot Service Bay #3',
      scheduledDate: '2026-10-24T14:00:00Z',
      serviceType: 'Fuel Rail Pressure Sensor & Lean Bank 1 Diagnostic (DTC P0171)',
      requiredParts: [
        { partNumber: 'BOSCH-HP-0991', description: 'High-Pressure Fuel Rail Sensor Assembly', quantity: 1, unitCostUsd: 340 },
        { partNumber: 'FLTR-DF-442', description: 'Fleetguard Dual Diesel Fuel Filter Element', quantity: 2, unitCostUsd: 65 },
      ],
      estimatedLaborHours: 3.5,
      totalEstimatedCostUsd: 820,
      assignedTechnician: 'Master Tech Dave Kozlowski (ASE Master Certified)',
    };

    const wo2: MaintenanceWorkOrder = {
      orderId: 'WO-2026-8802',
      vehicleId: 'VEH-TRK-101',
      vehicleName: 'Apex Freight Hauler #101 (Volvo FH Electric)',
      priority: 'SCHEDULED_PM',
      status: 'SCHEDULED',
      facilityLocation: 'Rotterdam Europort Fleet Maintenance Hub',
      scheduledDate: '2026-10-26T08:00:00Z',
      serviceType: 'Preventive PM-B Inspection & High-Voltage Battery Coolant Flush',
      requiredParts: [
        { partNumber: 'VOLVO-EV-COOL-20L', description: 'Deionized Glycol EV Battery Coolant (20L)', quantity: 2, unitCostUsd: 180 },
        { partNumber: 'KNORR-BRK-PAD-SET', description: 'Knorr-Bremse Air Disc Brake Pad Kit Front/Rear', quantity: 1, unitCostUsd: 420 },
      ],
      estimatedLaborHours: 4.0,
      totalEstimatedCostUsd: 1180,
      assignedTechnician: 'Senior Tech Jeroen De Jong',
    };

    this.workOrders.set(wo1.orderId, wo1);
    this.workOrders.set(wo2.orderId, wo2);
  }

  /**
   * Generates component wear profiles for a specific fleet vehicle.
   */
  public static getVehicleWearProfile(vehicleId: string): ComponentWearProfile[] {
    const isElectric = vehicleId === 'VEH-TRK-101';
    const isVessel = vehicleId.includes('VESSEL');
    const isAir = vehicleId.includes('AIR');

    if (isElectric) {
      return [
        {
          componentName: 'Regenerative & Air Disc Brake Pads',
          category: 'BRAKES',
          wearPercentage: 34,
          healthStatus: 'OPTIMAL',
          remainingUsefulLifeKm: 84000,
          remainingUsefulLifeDays: 240,
          lastInspectionDate: '2026-09-15',
          metricReadout: '9.2 mm thickness remaining (85% pad life)',
        },
        {
          componentName: 'Lithium-Ion Traction Battery Pack (540 kWh)',
          category: 'ELECTRICAL_EV',
          wearPercentage: 8,
          healthStatus: 'OPTIMAL',
          remainingUsefulLifeKm: 420000,
          remainingUsefulLifeDays: 1200,
          lastInspectionDate: '2026-10-10',
          metricReadout: '96.4% State-of-Health (SoH), 1.2mV cell imbalance',
        },
        {
          componentName: 'Low-Rolling-Resistance Steer & Drive Tires',
          category: 'TIRES',
          wearPercentage: 42,
          healthStatus: 'FAIR',
          remainingUsefulLifeKm: 52000,
          remainingUsefulLifeDays: 140,
          lastInspectionDate: '2026-10-02',
          metricReadout: '11/32nds tread depth (Nominal: 18/32nds)',
        },
        {
          componentName: 'Electric Drive Inverter & Thermal Chiller Loop',
          category: 'POWERTRAIN',
          wearPercentage: 18,
          healthStatus: 'OPTIMAL',
          remainingUsefulLifeKm: 280000,
          remainingUsefulLifeDays: 780,
          lastInspectionDate: '2026-09-20',
          metricReadout: 'Coolant dielectric resistivity 12.8 MΩ·cm',
        },
      ];
    }

    // Default Heavy Duty Diesel Semi Profile
    return [
      {
        componentName: 'Front & Drive Axle S-Cam Brake Drums / Shoes',
        category: 'BRAKES',
        wearPercentage: 68,
        healthStatus: 'ATTENTION_REQUIRED',
        remainingUsefulLifeKm: 18500,
        remainingUsefulLifeDays: 45,
        lastInspectionDate: '2026-08-18',
        metricReadout: '4.8 mm lining remaining (Warning at < 4.0 mm)',
      },
      {
        componentName: 'Detroit DD15 Heavy Diesel Engine Oil & Filter',
        category: 'FLUIDS_EMISSIONS',
        wearPercentage: 74,
        healthStatus: 'ATTENTION_REQUIRED',
        remainingUsefulLifeKm: 8200,
        remainingUsefulLifeDays: 21,
        lastInspectionDate: '2026-07-25',
        metricReadout: '28,400 km on current oil (Service interval: 35,000 km)',
      },
      {
        componentName: 'Holset Variable Geometry Turbocharger (VGT)',
        category: 'POWERTRAIN',
        wearPercentage: 58,
        healthStatus: 'FAIR',
        remainingUsefulLifeKm: 65000,
        remainingUsefulLifeDays: 180,
        lastInspectionDate: '2026-06-30',
        metricReadout: 'Actuator stroke response 42ms (Nominal < 50ms)',
      },
      {
        componentName: 'Bridgestone Ecopia Dual Drive Tires',
        category: 'TIRES',
        wearPercentage: 52,
        healthStatus: 'FAIR',
        remainingUsefulLifeKm: 42000,
        remainingUsefulLifeDays: 110,
        lastInspectionDate: '2026-09-12',
        metricReadout: '9/32nds tread depth across duals',
      },
    ];
  }

  /**
   * Generates predictive failure alerts across the fleet.
   */
  public static getPredictivePrognosisAlerts(): PredictivePrognosisAlert[] {
    return [
      {
        id: 'PROG-001',
        vehicleId: 'VEH-TRK-102',
        vehicleName: 'Apex Western Intermodal #102',
        component: 'High-Pressure Common Rail Fuel Injector Bank 1',
        failureRiskPercent: 84,
        predictedFailureKmRange: [1200, 2800],
        predictedFailureDays: 4,
        rootCauseTelemetry: 'Active DTC P0171 + Fuel rail pressure variance exceeding ±180 bar during high torque climb.',
        recommendedIntervention: 'Bench-test and clean Bosch injector #2 nozzle orifice; replace inline fuel filters.',
        estimatedDowntimeHours: 4.5,
        severity: 'CRITICAL',
      },
      {
        id: 'PROG-002',
        vehicleId: 'VEH-VESSEL-501',
        vehicleName: 'Ever Glory Panamax Vessel',
        component: 'Auxiliary Generator Scavenge Air Intercooler',
        failureRiskPercent: 62,
        predictedFailureKmRange: [4500, 9000],
        predictedFailureDays: 12,
        rootCauseTelemetry: 'Differential pressure rise +0.28 bar across turbocharger charge air cooler matrix.',
        recommendedIntervention: 'Execute chemical wash of air cooler fins at upcoming Singapore bunkering berth.',
        estimatedDowntimeHours: 8.0,
        severity: 'HIGH',
      },
      {
        id: 'PROG-003',
        vehicleId: 'VEH-TRK-101',
        vehicleName: 'Apex Freight Hauler #101',
        component: 'Refrigerated Trailer Auxiliary Compressor Belt',
        failureRiskPercent: 48,
        predictedFailureKmRange: [6000, 12000],
        predictedFailureDays: 18,
        rootCauseTelemetry: 'Optical telematics vibration sensor detected 18Hz harmonic flutter on belt drive.',
        recommendedIntervention: 'Inspect belt tensioner spring preload and replace poly-V micro-rib belt.',
        estimatedDowntimeHours: 1.5,
        severity: 'MEDIUM',
      },
    ];
  }

  public static getWorkOrders(): MaintenanceWorkOrder[] {
    return Array.from(this.workOrders.values());
  }

  public static createWorkOrder(order: MaintenanceWorkOrder): MaintenanceWorkOrder {
    this.workOrders.set(order.orderId, order);
    logger.info('MAINTENANCE', `Created work order ${order.orderId} for ${order.vehicleName}`);
    return order;
  }
}
