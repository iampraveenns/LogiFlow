/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Real-Time Simulation Engine Hook
 * Simulates high-frequency telematics pings, vehicle spatial kinematics, sensor jitter, and disruption events.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Vehicle, WaybillDocument, WarehouseFacility, InventoryItem, GeofenceZone, ShipmentStatus } from '../../packages/shared-types/index.ts';
import { repository } from '../../backend/repositories/index.ts';
import { TelematicsService } from '../../backend/services/telematicsService.ts';
import { ApiController } from '../../backend/controllers/apiController.ts';
import { logger, StructuredLog } from '../../packages/logger/index.ts';

export type SimulationSpeed = 0 | 1 | 5 | 10;

export function useSimulation() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => repository.getVehicles());
  const [waybills, setWaybills] = useState<WaybillDocument[]>(() => repository.getWaybills());
  const [warehouses, setWarehouses] = useState<WarehouseFacility[]>(() => repository.getWarehouses());
  const [inventory, setInventory] = useState<InventoryItem[]>(() => repository.getInventory());
  const [geofences] = useState<GeofenceZone[]>(() => repository.getGeofences());
  const [simulationSpeed, setSimulationSpeed] = useState<SimulationSpeed>(1);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('VEH-TRK-101');
  const [logs, setLogs] = useState<StructuredLog[]>(() => logger.getRecentLogs(50));
  const [activeAlerts, setActiveAlerts] = useState<string[]>([
    'VEH-TRK-102: OBD-II P0171 Fuel System Lean warning logged.',
    'Port of Long Beach: Pier 400 gate congestion index at 74%.',
  ]);

  const tickRef = useRef<number>(0);

  // Subscribe to logger
  useEffect(() => {
    const unsubscribe = logger.subscribe((log) => {
      setLogs((prev) => [log, ...prev.slice(0, 100)]);
    });
    return unsubscribe;
  }, []);

  // Spatial progression paths [lat, lng, heading]
  const vehiclePaths: Record<string, [number, number, number][]> = {
    'VEH-TRK-101': [
      [51.9244, 4.4777, 60], // Rotterdam
      [52.1326, 5.2913, 65], // Utrecht
      [52.213, 6.8909, 70], // Enschede
      [52.2799, 8.0472, 60], // Osnabrück
      [53.0793, 8.8017, 50], // Bremen
      [53.5042, 9.9324, 45], // Hamburg
    ],
    'VEH-TRK-102': [
      [33.7405, -118.272, 50], // LA Port
      [34.0522, -118.2437, 75], // LA downtown
      [35.1983, -111.6513, 80], // Flagstaff I-40
      [35.0844, -106.6504, 75], // Albuquerque
      [36.154, -95.9928, 65], // Tulsa
      [38.627, -90.1994, 55], // St Louis
      [41.9742, -87.9073, 40], // Chicago
    ],
    'VEH-VESSEL-501': [
      [30.6308, 122.0628, 90], // Shanghai
      [28.5, 130.0, 85],
      [32.0, 150.0, 80],
      [34.0, 180.0, 75],
      [35.0, -150.0, 75],
      [34.0, -130.0, 80],
      [33.7405, -118.272, 85], // LA Port
    ],
    'VEH-AIR-777': [
      [41.9742, -87.9073, 65], // Chicago
      [45.0, -75.0, 70], // Montreal airspace
      [52.0, -50.0, 75], // Oceanic waypoint
      [53.0, -20.0, 80],
      [52.5, 0.0, 85],
      [51.9244, 4.4777, 90], // Rotterdam
    ],
  };

  // Kinematic step update
  const advanceVehicles = useCallback(() => {
    tickRef.current += 1;
    const tick = tickRef.current;

    setVehicles((prev) =>
      prev.map((v) => {
        const path = vehiclePaths[v.id];
        if (!path || path.length < 2) return v;

        // Calculate cyclic progress along path
        const totalWaypoints = path.length;
        const progressFloat = (tick * 0.04) % (totalWaypoints - 1);
        const idx = Math.floor(progressFloat);
        const nextIdx = idx + 1;
        const fraction = progressFloat - idx;

        const p1 = path[idx];
        const p2 = path[nextIdx] || path[0];

        // Linear interpolation with slight GPS jitter
        const lat = p1[0] + (p2[0] - p1[0]) * fraction + (Math.sin(tick * 0.5) * 0.0005);
        const lng = p1[1] + (p2[1] - p1[1]) * fraction + (Math.cos(tick * 0.5) * 0.0005);
        const heading = p1[2] || 0;

        // Dynamic speed simulation
        const baseSpeed = v.type === 'BOEING_777F' ? 885 : v.type === 'PANAMAX_VESSEL' ? 38.2 : 78;
        const speedKmh = Number((baseSpeed + Math.sin(tick * 0.2) * 4).toFixed(1));

        // Battery / Fuel consumption
        const fuelLevel = Math.max(8, Number((v.telematics.fuelLevelPercent - 0.004 * (simulationSpeed || 1)).toFixed(2)));
        const batterySoc = v.telematics.batterySocPercent
          ? Math.max(12, Number((v.telematics.batterySocPercent - 0.006 * (simulationSpeed || 1)).toFixed(2)))
          : undefined;

        // Cold-chain cargo temperature
        let cargoTemp = v.telematics.cargoTemperatureCelsius;
        if (cargoTemp !== undefined) {
          // slight fluctuation
          cargoTemp = Number((cargoTemp + (Math.random() - 0.5) * 0.1).toFixed(2));
        }

        const updated: Vehicle = {
          ...v,
          currentLocation: {
            coordinates: [lat, lng],
            speedKmh,
            heading,
            lastPingTime: new Date().toISOString(),
          },
          telematics: {
            ...v.telematics,
            coordinates: [lat, lng],
            speedKmh,
            headingDegrees: heading,
            timestamp: new Date().toISOString(),
            fuelLevelPercent: fuelLevel,
            batterySocPercent: batterySoc,
            cargoTemperatureCelsius: cargoTemp,
            odometerKm: Math.round(v.telematics.odometerKm + (speedKmh / 3600) * 2),
          },
        };

        // Geofence evaluation
        geofences.forEach((zone) => {
          const evalResult = TelematicsService.evaluateGeofence([lat, lng], speedKmh, zone, v.geofenceState.currentZoneId === zone.id);
          if (evalResult.eventTriggered === 'ENTER') {
            updated.geofenceState.currentZoneId = zone.id;
            setActiveAlerts((a) => [`${v.name} entered geofence ${zone.name}`, ...a.slice(0, 5)]);
          } else if (evalResult.eventTriggered === 'EXIT') {
            updated.geofenceState.currentZoneId = undefined;
            setActiveAlerts((a) => [`${v.name} exited geofence ${zone.name}`, ...a.slice(0, 5)]);
          }
        });

        // Sync with repository
        repository.updateVehicleLocation(v.id, [lat, lng], speedKmh, heading, updated.telematics);

        return updated;
      })
    );
  }, [geofences, simulationSpeed]);

  // Main simulation timer
  useEffect(() => {
    if (simulationSpeed === 0) return;
    const intervalMs = Math.max(300, 2000 / simulationSpeed);
    const timer = setInterval(() => {
      advanceVehicles();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [simulationSpeed, advanceVehicles]);

  // Transition shipment status
  const transitionShipment = async (shipmentId: string, newStatus: ShipmentStatus, actorName: string, notes?: string) => {
    const updated = await ApiController.transitionShipmentStatus({
      shipmentId,
      newStatus,
      actorId: 'usr-sim-actor',
      actorName,
      notes,
    });
    setWaybills((prev) => prev.map((w) => (w.id === shipmentId ? { ...updated } : w)));
    setActiveAlerts((prev) => [`Shipment ${updated.waybillNumber} transitioned to ${newStatus}`, ...prev.slice(0, 5)]);
  };

  // Trigger disruption
  const triggerDisruption = async (type: 'HARSH_BRAKING' | 'DTC_FAULT' | 'REEFER_SPIKE' | 'CUSTOMS_HOLD' | 'GEOFENCE_EXIT') => {
    await ApiController.triggerSimulationEvent(type);
    setVehicles([...repository.getVehicles()]);
    setWaybills([...repository.getWaybills()]);
    setActiveAlerts((prev) => [`🚨 DISRUPTION INJECTED: ${type}`, ...prev.slice(0, 5)]);
  };

  // Clear DTC
  const clearDtc = async (vehicleId: string, code: string) => {
    await ApiController.clearVehicleDtc(vehicleId, code);
    setVehicles([...repository.getVehicles()]);
  };

  // Stock adjustment
  const updateStock = async (sku: string, delta: number) => {
    await ApiController.updateStock(sku, delta);
    setInventory([...repository.getInventory()]);
  };

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  return {
    vehicles,
    waybills,
    warehouses,
    inventory,
    geofences,
    simulationSpeed,
    setSimulationSpeed,
    selectedVehicle,
    setSelectedVehicleId,
    transitionShipment,
    triggerDisruption,
    clearDtc,
    updateStock,
    logs,
    activeAlerts,
  };
}
