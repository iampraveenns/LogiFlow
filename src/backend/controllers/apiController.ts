/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - API Controllers
 * Implements business logic handlers for HTTP / REST endpoints across all enterprise logistics domains.
 */

import { repository } from '../repositories/index.ts';
import { canTransitionShipment } from '../models/index.ts';
import { RouteOptimizationService } from '../services/routeOptimizationService.ts';
import { TelematicsService } from '../services/telematicsService.ts';
import { InventoryForecastService } from '../services/inventoryForecastService.ts';
import { DocumentComplianceService } from '../services/documentComplianceService.ts';
import { AILogisticsService } from '../services/aiLogisticsService.ts';
import { logger } from '../../packages/logger/index.ts';
import { ShipmentStatus, VehicleType } from '../../packages/shared-types/index.ts';
import { AppError } from '../middlewares/index.ts';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.ts';

export class ApiController {
  // ==========================================
  // 1. SHIPMENTS & WAYBILLS
  // ==========================================
  public static async getShipments(tenantId?: string) {
    return repository.getWaybills(tenantId);
  }

  public static async getShipmentById(id: string) {
    const shipment = repository.getWaybillById(id);
    if (!shipment) {
      throw new AppError(`Waybill with ID '${id}' not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.SHIPMENT_NOT_FOUND);
    }
    return shipment;
  }

  public static async transitionShipmentStatus(params: {
    shipmentId: string;
    newStatus: ShipmentStatus;
    actorId: string;
    actorName: string;
    notes?: string;
  }) {
    const { shipmentId, newStatus, actorId, actorName, notes } = params;
    const shipment = repository.getWaybillById(shipmentId);
    if (!shipment) {
      throw new AppError(`Waybill '${shipmentId}' not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.SHIPMENT_NOT_FOUND);
    }

    if (!canTransitionShipment(shipment.status, newStatus)) {
      throw new AppError(
        `Illegal shipment transition from '${shipment.status}' to '${newStatus}'`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.SHIPMENT_TRANSITION_INVALID
      );
    }

    const prevStatus = shipment.status;
    shipment.status = newStatus;

    if (newStatus === 'DISPATCHED' && !shipment.dispatchTime) {
      shipment.dispatchTime = new Date().toISOString();
    }
    if (newStatus === 'DELIVERED') {
      shipment.deliveryTime = new Date().toISOString();
    }
    if (newStatus === 'CUSTOMS_CLEARED') {
      shipment.customsStatus.clearedDate = new Date().toISOString();
      shipment.customsStatus.inspectionRequired = false;
    }

    shipment.auditTrail.push({
      timestamp: new Date().toISOString(),
      actorId,
      actorName,
      action: `STATUS_CHANGE_${newStatus}`,
      previousState: prevStatus,
      newState: newStatus,
      notes: notes || `Shipment transitioned to ${newStatus}`,
      digitalSignature: DocumentComplianceService.generateDocumentHash(`${shipmentId}:${newStatus}:${actorId}`),
    });

    repository.saveWaybill(shipment);
    logger.info('SHIPMENT_CTRL', `Shipment ${shipmentId} changed status: ${prevStatus} -> ${newStatus}`);
    return shipment;
  }

  public static async generateWaybillDocument(shipmentId: string) {
    const shipment = repository.getWaybillById(shipmentId);
    if (!shipment) {
      throw new AppError(`Waybill '${shipmentId}' not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.SHIPMENT_NOT_FOUND);
    }
    return DocumentComplianceService.generateBillOfLading(shipment);
  }

  // ==========================================
  // 2. FLEET & TELEMATICS
  // ==========================================
  public static async getVehicles(tenantId?: string) {
    return repository.getVehicles(tenantId);
  }

  public static async getVehicleById(id: string) {
    const vehicle = repository.getVehicleById(id);
    if (!vehicle) {
      throw new AppError(`Vehicle '${id}' not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.FLEET_VEHICLE_UNAVAILABLE);
    }
    return vehicle;
  }

  public static async clearVehicleDtc(vehicleId: string, dtcCode: string) {
    const vehicle = repository.getVehicleById(vehicleId);
    if (!vehicle) {
      throw new AppError(`Vehicle '${vehicleId}' not found`, HTTP_STATUS.NOT_FOUND);
    }
    vehicle.telematics.dtcCodes = vehicle.telematics.dtcCodes.filter((d) => d.code !== dtcCode);
    logger.info('TELEMATICS', `Cleared DTC code ${dtcCode} for vehicle ${vehicleId}`);
    return vehicle;
  }

  // ==========================================
  // 3. WAREHOUSING & INVENTORY
  // ==========================================
  public static async getWarehouses() {
    return repository.getWarehouses();
  }

  public static async getInventory() {
    return repository.getInventory();
  }

  public static async getInventoryForecast(sku: string) {
    const items = repository.getInventory();
    const item = items.find((i) => i.sku === sku);
    if (!item) {
      throw new AppError(`Inventory SKU '${sku}' not found`, HTTP_STATUS.NOT_FOUND);
    }
    return InventoryForecastService.generate12MonthForecast(item);
  }

  public static async updateStock(sku: string, qtyDelta: number) {
    const item = repository.updateInventoryQuantity(sku, qtyDelta);
    if (!item) {
      throw new AppError(`Inventory SKU '${sku}' not found`, HTTP_STATUS.NOT_FOUND);
    }
    return item;
  }

  // ==========================================
  // 4. ROUTE OPTIMIZATION
  // ==========================================
  public static async calculateRoute(params: {
    origin: { name: string; coordinates: [number, number] };
    destination: { name: string; coordinates: [number, number] };
    intermediateStops?: { name: string; coordinates: [number, number] }[];
    vehicleType: VehicleType;
    cargoWeightKg: number;
    avoidTolls?: boolean;
  }) {
    return RouteOptimizationService.optimizeRoute(params);
  }

  // ==========================================
  // 5. AI COPILOT
  // ==========================================
  public static async consultAiCopilot(query: string, context?: {
    activeWaybill?: string;
    vehicleId?: string;
    sku?: string;
    alertDetails?: string;
  }) {
    return AILogisticsService.analyzeScenario(query, context);
  }

  // ==========================================
  // 6. GEOFENCES & LOGS
  // ==========================================
  public static async getGeofences() {
    return repository.getGeofences();
  }

  public static async getRecentLogs() {
    return logger.getRecentLogs(150);
  }

  // ==========================================
  // 7. SIMULATION TRIGGERS
  // ==========================================
  public static async triggerSimulationEvent(eventType: 'HARSH_BRAKING' | 'DTC_FAULT' | 'REEFER_SPIKE' | 'CUSTOMS_HOLD' | 'GEOFENCE_EXIT') {
    const vehicles = repository.getVehicles();
    const truck = vehicles.find((v) => v.type === 'CLASS_8_SEMI' || v.type === 'ELECTRIC_HAULER') || vehicles[0];

    switch (eventType) {
      case 'HARSH_BRAKING':
        truck.telematics.harshBrakingDetected = true;
        truck.currentLocation.speedKmh = 18;
        logger.warn('SIMULATION', `Triggered Harsh Braking event on vehicle ${truck.name}`);
        break;

      case 'DTC_FAULT':
        const dtc = TelematicsService.decodeDtcCode('P0300');
        if (!truck.telematics.dtcCodes.some((d) => d.code === 'P0300')) {
          truck.telematics.dtcCodes.push(dtc);
        }
        logger.error('SIMULATION', `Triggered Engine Misfire DTC P0300 on ${truck.name}`);
        break;

      case 'REEFER_SPIKE':
        truck.telematics.cargoTemperatureCelsius = -4.2; // Breached -65°C threshold
        logger.error('SIMULATION', `Triggered Reefer Temperature Spoilage Alert on ${truck.name}`);
        break;

      case 'CUSTOMS_HOLD':
        const wb = repository.getWaybills().find((w) => w.status === 'IN_TRANSIT');
        if (wb) {
          wb.status = 'CUSTOMS_HOLD';
          wb.customsStatus.riskScore = 92;
          wb.customsStatus.inspectionRequired = true;
          wb.auditTrail.push({
            timestamp: new Date().toISOString(),
            actorId: 'sim-agent',
            actorName: 'Simulated Customs Portal',
            action: 'AUTOMATED_RANDOM_CUSTOMS_HOLD',
            notes: 'High-risk security audit trigger activated at inland checkpoint.',
          });
          logger.warn('SIMULATION', `Waybill ${wb.waybillNumber} flagged for Customs Hold`);
        }
        break;

      case 'GEOFENCE_EXIT':
        truck.geofenceState.isBreached = true;
        truck.geofenceState.breachTime = new Date().toISOString();
        logger.warn('SIMULATION', `Vehicle ${truck.name} breached geofence boundary`);
        break;
    }

    return { success: true, eventType, timestamp: new Date().toISOString() };
  }
}
