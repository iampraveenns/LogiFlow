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
import { DigitalTwinService, DISRUPTION_SCENARIOS } from '../services/digitalTwinService.ts';
import { FreightProcurementService } from '../services/freightProcurementService.ts';
import { ColdChainSensorService } from '../services/coldChainSensorService.ts';
import { FleetMaintenanceService } from '../services/fleetMaintenanceService.ts';
import { EdiCustomsService } from '../services/ediCustomsService.ts';
import { EsgDecarbonizationService } from '../services/esgDecarbonizationService.ts';
import { YardManagementService } from '../services/yardManagementService.ts';
import { FreightAuditBillingService } from '../services/freightAuditBillingService.ts';
import { TradeSanctionsService } from '../services/tradeSanctionsService.ts';
import { WavePickingService } from '../services/wavePickingService.ts';
import { AirCargoUldService } from '../services/airCargoUldService.ts';
import { DroneLastMileService } from '../services/droneLastMileService.ts';
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

  // ==========================================
  // 8. SUPPLY CHAIN DIGITAL TWIN
  // ==========================================
  public static async getDisruptionScenarios() {
    return DISRUPTION_SCENARIOS;
  }

  public static async runDigitalTwinSimulation(scenarioId: string, iterations: number = 1000) {
    return DigitalTwinService.runSimulation(scenarioId, iterations);
  }

  // ==========================================
  // 9. FREIGHT PROCUREMENT & TENDERS
  // ==========================================
  public static async getFreightTenders() {
    return FreightProcurementService.getTenders();
  }

  public static async getMarketBenchmarks() {
    return FreightProcurementService.getMarketBenchmarks();
  }

  public static async awardFreightTender(tenderId: string, carrierId: string) {
    const updated = FreightProcurementService.awardTender(tenderId, carrierId);
    if (!updated) {
      throw new AppError(`Tender '${tenderId}' not found`, HTTP_STATUS.NOT_FOUND);
    }
    return updated;
  }

  // ==========================================
  // 10. IOT COLD CHAIN MULTI-SENSOR
  // ==========================================
  public static async getColdChainContainers() {
    return ColdChainSensorService.getContainers();
  }

  // ==========================================
  // 11. FLEET MAINTENANCE & PROGNOSTICS
  // ==========================================
  public static async getVehicleWearProfile(vehicleId: string) {
    return FleetMaintenanceService.getVehicleWearProfile(vehicleId);
  }

  public static async getPredictivePrognosisAlerts() {
    return FleetMaintenanceService.getPredictivePrognosisAlerts();
  }

  public static async getMaintenanceWorkOrders() {
    return FleetMaintenanceService.getWorkOrders();
  }

  // ==========================================
  // 12. EDI & CUSTOMS TARIFF STUDIO
  // ==========================================
  public static async searchHtsCodes(query: string) {
    return EdiCustomsService.searchHtsCodes(query);
  }

  public static async calculateCustomsDuty(params: {
    hsCode: string;
    declaredValueUsd: number;
    originCountry: string;
    destinationCountry: string;
    applyFtaPreference?: boolean;
  }) {
    return EdiCustomsService.calculateCustomsDuty(params);
  }

  public static async generateEdi204(params: {
    waybillNumber: string;
    carrierScac: string;
    originCity: string;
    destinationCity: string;
    weightLbs: number;
  }) {
    return EdiCustomsService.generateEdi204(params);
  }

  // ==========================================
  // 13. ESG & CARBON DECARBONIZATION
  // ==========================================
  public static async getEsgEmissionsBreakdown() {
    return EsgDecarbonizationService.getEmissionsBreakdown();
  }

  public static async getEsgTradeLanes() {
    return EsgDecarbonizationService.getTradeLaneProfiles();
  }

  public static async getCarbonOffsets() {
    return EsgDecarbonizationService.getCarbonOffsets();
  }

  public static async getDecarbonizationTargets() {
    return EsgDecarbonizationService.getDecarbonizationTargets();
  }

  public static async simulateFuelAbatement(params: {
    conventionalDieselLiters: number;
    fuelChoice: 'HVO100_RENEWABLE_DIESEL' | 'BIO_LNG' | 'SAF_50_BLEND' | 'BATTERY_ELECTRIC';
    electricityCarbonIntensityGramsKwh?: number;
  }) {
    return EsgDecarbonizationService.simulateFuelAbatement(params);
  }

  // ==========================================
  // 14. INTERMODAL RAIL & YARD MANAGEMENT (YMS)
  // ==========================================
  public static async getYardDockDoors() {
    return YardManagementService.getDockDoors();
  }

  public static async getYardSlots() {
    return YardManagementService.getYardSlots();
  }

  public static async getHostlerTasks() {
    return YardManagementService.getHostlerTasks();
  }

  public static async getGateOcrTransactions() {
    return YardManagementService.getGateOcrTransactions();
  }

  public static async createHostlerTask(params: {
    trailerNumber: string;
    fromLocation: string;
    toLocation: string;
    priority: 'CRITICAL_DETENTION' | 'SCHEDULED_DOCK' | 'NORMAL_STAGING';
  }) {
    return YardManagementService.createHostlerMoveTask(params);
  }

  public static async toggleDockDoor(doorNumber: number) {
    return YardManagementService.toggleDockDoorStatus(doorNumber);
  }

  // ==========================================
  // 15. FREIGHT BILLING AUDIT & DEMURRAGE
  // ==========================================
  public static async getAuditInvoices() {
    return FreightAuditBillingService.getAuditInvoices();
  }

  public static async getPortDemurrageClocks() {
    return FreightAuditBillingService.getDemurrageClocks();
  }

  public static async submitInvoiceDispute(invoiceId: string, citationNote: string) {
    const updated = FreightAuditBillingService.submitDisputeClaim(invoiceId, citationNote);
    if (!updated) throw new AppError(`Invoice '${invoiceId}' not found`, HTTP_STATUS.NOT_FOUND);
    return updated;
  }

  // ==========================================
  // 16. TRADE SANCTIONS & COMPLIANCE
  // ==========================================
  public static async screenSanctions(queryName: string) {
    return TradeSanctionsService.screenParty(queryName);
  }

  public static async generateSanctionsCertificate(params: {
    waybillNumber: string;
    shipper: string;
    consignee: string;
    carrierVessel: string;
    eccn: string;
  }) {
    return TradeSanctionsService.generateScreeningCertificate(params);
  }

  // ==========================================
  // 17. CROSS-DOCK & WAVE PICKING
  // ==========================================
  public static async getPickingWaves() {
    return WavePickingService.getWaves();
  }

  public static async getCrossDockMatches() {
    return WavePickingService.getCrossDockMatches();
  }

  public static async markWaveItemPicked(waveId: string, sku: string) {
    const updated = WavePickingService.markItemPicked(waveId, sku);
    if (!updated) throw new AppError(`Wave '${waveId}' not found`, HTTP_STATUS.NOT_FOUND);
    return updated;
  }

  // ==========================================
  // 18. AIR CARGO ULD & AIRCRAFT TRIM
  // ==========================================
  public static async getUldContainers() {
    return AirCargoUldService.getUldContainers();
  }

  public static async calculateAircraftTrim(aircraftModel: string, ulds: any[], fuelKg: number) {
    return AirCargoUldService.calculateAircraftWeightAndBalance(aircraftModel, ulds, fuelKg);
  }

  public static async validateHazmatSegregation(classA: string, classB: string) {
    return AirCargoUldService.validateHazmatSegregation(classA, classB);
  }

  // ==========================================
  // 19. DRONE & LAST-MILE ROBOTIC DELIVERY
  // ==========================================
  public static async getDroneFleet() {
    return DroneLastMileService.getDrones();
  }

  public static async getDroneMissions() {
    return DroneLastMileService.getMissions();
  }

  public static async getAirspaceExclusionZones() {
    return DroneLastMileService.getExclusionZones();
  }

  public static async dispatchDroneMission(params: {
    droneId: string;
    orderId: string;
    customerName: string;
    deliveryLat: number;
    deliveryLng: number;
    packageWeightKg: number;
    dropMethod: 'WINCH_TETHER_DROP' | 'GROUND_LAND_PAD' | 'LOCKER_DOCK';
  }) {
    const res = DroneLastMileService.dispatchDelivery(
      params.droneId,
      params.orderId,
      params.customerName,
      params.deliveryLat,
      params.deliveryLng,
      params.packageWeightKg,
      params.dropMethod
    );
    if (!res.success) {
      throw new AppError(res.message, HTTP_STATUS.BAD_REQUEST);
    }
    return res;
  }

  public static async triggerDroneWinch(droneId: string) {
    return DroneLastMileService.triggerWinchDrop(droneId);
  }

  public static async triggerDroneEmergencyRth(droneId: string) {
    return DroneLastMileService.triggerEmergencyRTH(droneId);
  }
}

