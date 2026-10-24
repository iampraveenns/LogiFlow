/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Navigation,
  BatteryCharging,
  BatteryMedium,
  ShieldAlert,
  Wind,
  Compass,
  AlertTriangle,
  Play,
  RotateCcw,
  Radio,
  CheckCircle2,
  Box,
  MapPin,
  Cpu,
  Layers
} from 'lucide-react';
import { 
  DroneLastMileService, 
  DroneVehicle, 
  DroneDeliveryMission, 
  AirspaceExclusionZone 
} from '../../backend/services/droneLastMileService.ts';

export const DroneLastMileView: React.FC = () => {
  const [drones, setDrones] = useState<DroneVehicle[]>(DroneLastMileService.getDrones());
  const [missions, setMissions] = useState<DroneDeliveryMission[]>(DroneLastMileService.getMissions());
  const [exclusionZones] = useState<AirspaceExclusionZone[]>(DroneLastMileService.getExclusionZones());
  
  const [selectedDroneId, setSelectedDroneId] = useState<string>(drones[0]?.id || 'DRN-AERO-01');
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New dispatch form state
  const [dispatchForm, setDispatchForm] = useState({
    droneId: 'DRN-AERO-02',
    orderId: 'ORD-AIR-PHARMA-204',
    customerName: 'Loyola Ambulatory Center',
    targetLat: 41.8812,
    targetLng: -87.6450,
    packageWeightKg: 2.4,
    dropMethod: 'WINCH_TETHER_DROP' as const
  });

  const activeDrone = useMemo(() => {
    return drones.find(d => d.id === selectedDroneId) || drones[0];
  }, [drones, selectedDroneId]);

  const activeMission = useMemo(() => {
    return missions.find(m => m.droneId === activeDrone.id);
  }, [missions, activeDrone]);

  // Compute RTH energy budget for active drone
  const rthBudget = useMemo(() => {
    const distMeters = 3500; // 3.5 km default test distance
    return DroneLastMileService.calculateRthEnergyBudget(
      activeDrone,
      distMeters,
      activeMission ? activeMission.packageWeightKg : 2.0,
      activeMission ? activeMission.windSpeedKts : 8.0,
      true
    );
  }, [activeDrone, activeMission]);

  // Handle Winch Tether Trigger
  const handleWinchTrigger = () => {
    const res = DroneLastMileService.triggerWinchDrop(activeDrone.id);
    if (res.success) {
      setDrones(DroneLastMileService.getDrones());
      setActionNotice(`Winch cable lowered to ${res.cableLengthMeters}m. Optical LiDAR confirmed clear ground dropzone.`);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  // Handle Emergency RTH
  const handleEmergencyRTH = () => {
    const res = DroneLastMileService.triggerEmergencyRTH(activeDrone.id);
    if (res.success) {
      setDrones(DroneLastMileService.getDrones());
      setActionNotice(`EMERGENCY RETURN-TO-HOME activated for ${activeDrone.callsign}.`);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  // Handle New Dispatch
  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const res = DroneLastMileService.dispatchDelivery(
      dispatchForm.droneId,
      dispatchForm.orderId,
      dispatchForm.customerName,
      dispatchForm.targetLat,
      dispatchForm.targetLng,
      dispatchForm.packageWeightKg,
      dispatchForm.dropMethod
    );

    if (res.success) {
      setDrones(DroneLastMileService.getDrones());
      setMissions(DroneLastMileService.getMissions());
      setSelectedDroneId(dispatchForm.droneId);
      setShowDispatchModal(false);
      setActionNotice(res.message);
      setTimeout(() => setActionNotice(null), 5000);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-6 w-6 text-sky-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">Autonomous Drone & Last-Mile Robotic Delivery</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            FAA Part 107 low-altitude airspace corridors (B/C exclusion geofences), Winch-tether delivery mechanics, and dynamic RTH energy budgets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDispatchModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold uppercase tracking-wider transition shadow"
          >
            <Play className="h-4 w-4" /> Dispatch Mission
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-500/40 text-xs text-sky-300 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
        </div>
      )}

      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {drones.map(drone => (
          <div
            key={drone.id}
            onClick={() => setSelectedDroneId(drone.id)}
            className={`cursor-pointer rounded-xl p-4 border transition ${
              selectedDroneId === drone.id
                ? 'bg-slate-900 border-sky-500 ring-1 ring-sky-500'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Navigation className={`h-4 w-4 ${selectedDroneId === drone.id ? 'text-sky-400' : 'text-slate-400'}`} />
                <span className="font-bold text-white font-mono text-sm">{drone.callsign}</span>
              </div>
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                drone.status === 'EN_ROUTE_DELIVERY' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' :
                drone.status === 'WINCH_DESCENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                drone.status === 'RTH_EMERGENCY' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                'bg-slate-800 text-slate-400'
              }`}>
                {drone.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 mb-3">
              <div>Type: <span className="text-slate-400">{drone.type.replace(/_/g, ' ')}</span></div>
              <div>Battery: <span className={drone.currentBatteryPercent > 30 ? 'text-emerald-400' : 'text-red-400'}>{drone.currentBatteryPercent}%</span></div>
              <div>Alt: <span className="text-sky-400">{drone.currentAltitudeMeters}m</span></div>
              <div>Speed: <span className="text-purple-400">{drone.groundSpeedKmh} km/h</span></div>
            </div>

            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${drone.currentBatteryPercent > 40 ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${drone.currentBatteryPercent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Main Mission Control Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Radar and Airspace Display */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Compass className="h-5 w-5 text-sky-400" />
                <div>
                  <h3 className="text-base font-semibold text-white">Urban Low-Altitude Airspace Radar (0 - 150m AGL)</h3>
                  <p className="text-xs text-slate-400">Chicago Metropolitan Area • Real-Time ADS-B & Geofence Corridor Radar</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400">Grid: 10km Radius</span>
            </div>

            {/* Radar Canvas / SVG Display */}
            <div className="relative h-80 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 500 320">
                {/* Concentric distance rings */}
                <circle cx="250" cy="160" r="40" stroke="#1e293b" strokeWidth="1" fill="none" />
                <circle cx="250" cy="160" r="80" stroke="#1e293b" strokeWidth="1" fill="none" />
                <circle cx="250" cy="160" r="120" stroke="#1e293b" strokeWidth="1" fill="none" />
                <circle cx="250" cy="160" r="150" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" fill="none" />
                
                {/* Crosshairs */}
                <line x1="250" y1="10" x2="250" y2="310" stroke="#1e293b" strokeWidth="1" />
                <line x1="20" y1="160" x2="480" y2="160" stroke="#1e293b" strokeWidth="1" />

                {/* FAA Exclusion Zones (Red & Amber translucent circles) */}
                {/* O'Hare (top left) */}
                <circle cx="80" cy="50" r="45" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
                <text x="40" y="45" fill="#ef4444" fontSize="10" fontFamily="monospace">O'HARE CLASS B</text>

                {/* Midway (bottom left) */}
                <circle cx="90" cy="250" r="38" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
                <text x="50" y="250" fill="#ef4444" fontSize="10" fontFamily="monospace">MIDWAY CLASS C</text>

                {/* Soldier Field TFR (bottom right) */}
                <circle cx="360" cy="230" r="30" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
                <text x="325" y="235" fill="#f59e0b" fontSize="9" fontFamily="monospace">SOLDIER TFR</text>

                {/* Northwestern Helipad */}
                <circle cx="340" cy="90" r="24" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
                <text x="315" y="95" fill="#f59e0b" fontSize="8" fontFamily="monospace">HOSPITAL HELIPAD</text>

                {/* Safe Flight Corridor (Sky Blue dotted vector) */}
                <path d="M 250 160 Q 280 140, 310 170" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" />

                {/* Hub Base (Center) */}
                <rect x="244" y="154" width="12" height="12" fill="#0284c7" rx="2" />
                <text x="235" y="180" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">HUB BASE</text>

                {/* Active Drone Marker */}
                <circle cx="310" cy="170" r="6" fill="#10b981" />
                <circle cx="310" cy="170" r="14" fill="#10b981" fillOpacity="0.3" className="animate-ping" />
                <text x="325" y="174" fill="#10b981" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  {activeDrone.callsign} ({activeDrone.currentAltitudeMeters}m)
                </text>
              </svg>

              {/* Status HUD overlay */}
              <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-[11px] font-mono space-y-1">
                <div className="text-slate-400">Telemetry Fix: <span className="text-emerald-400">RTK GPS 3D FIX (0.02m)</span></div>
                <div className="text-slate-400">Airspace Safety: <span className="text-emerald-400 font-bold">FAA PART 107 CLEAR</span></div>
                <div className="text-slate-400">Wind Vector: <span className="text-sky-300">8.4 kts @ 270° WNW</span></div>
              </div>
            </div>

            {/* Flight Operations Controls */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <button
                onClick={handleWinchTrigger}
                disabled={activeDrone.status === 'WINCH_DESCENDING'}
                className="p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-lg text-left transition"
              >
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Layers className="h-4 w-4" /> Deploy Winch
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Lower 15m tether to ground</div>
              </button>

              <button
                onClick={handleEmergencyRTH}
                className="p-3 bg-slate-950 border border-slate-800 hover:border-red-500/50 rounded-lg text-left transition"
              >
                <div className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                  <RotateCcw className="h-4 w-4" /> Emergency RTH
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Abort mission and return</div>
              </button>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-left">
                <div className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                  <Cpu className="h-4 w-4" /> Autopilot Failsafe
                </div>
                <div className="text-[11px] text-slate-400 mt-1">PX4 v4.2.1 Triple Redundant</div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-left">
                <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> Geofence Margin
                </div>
                <div className="text-[11px] text-slate-400 mt-1">&gt; 3,200m to O&apos;Hare corridor</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mission Telemetry & Battery Energy Model */}
        <div className="space-y-6">
          {/* Active Mission Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Box className="h-4 w-4 text-sky-400" />
              Active Dispatch Mission
            </h3>

            {activeMission ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mission ID:</span>
                    <span className="text-white font-bold">{activeMission.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Consignment:</span>
                    <span className="text-sky-300">{activeMission.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recipient:</span>
                    <span className="text-slate-200">{activeMission.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payload Weight:</span>
                    <span className="text-purple-300 font-bold">{activeMission.packageWeightKg} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Drop Method:</span>
                    <span className="text-amber-300">{activeMission.dropMethod.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Winch Cable:</span>
                    <span className="text-emerald-400 font-bold">{activeDrone.winchTetherLengthMeters.toFixed(1)} meters</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-lg">
                Drone is standing by on launchpad. Ready for mission assignment.
              </div>
            )}
          </div>

          {/* RTH Energy Physics Model */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <BatteryCharging className="h-4 w-4 text-emerald-400" />
              Battery Physics &amp; RTH Power Reserve
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Total Battery Capacity</span>
                <span className="text-white">{activeDrone.batteryCapacityWh} Wh</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Available Energy</span>
                <span className="text-emerald-400 font-bold">{rthBudget.availableWh} Wh</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Required for RTH</span>
                <span className="text-sky-400 font-bold">{rthBudget.totalRequiredWh} Wh</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Safety Reserve Buffer</span>
                <span className={rthBudget.reserveMarginWh > 0 ? 'text-emerald-400' : 'text-red-400'}>
                  +{rthBudget.reserveMarginWh} Wh
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs">
                  {rthBudget.sufficientToRth ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Safe Return-To-Home Guaranteed</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-red-400 font-medium">Critically Low Battery for Mission</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Play className="h-4 w-4 text-sky-400" />
              Dispatch Autonomous Drone Mission
            </h3>
            <p className="text-xs text-slate-400">
              Submit flight plan with automatic Part 107 airspace corridor validation and battery budget verification.
            </p>

            <form onSubmit={handleDispatch} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Drone Vehicle</label>
                <select
                  value={dispatchForm.droneId}
                  onChange={e => setDispatchForm(prev => ({ ...prev, droneId: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                >
                  {drones.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.callsign} ({d.type}) — Batt: {d.currentBatteryPercent}%
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Order / Consignment ID</label>
                <input
                  type="text"
                  value={dispatchForm.orderId}
                  onChange={e => setDispatchForm(prev => ({ ...prev, orderId: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Recipient Organization / Customer</label>
                <input
                  type="text"
                  value={dispatchForm.customerName}
                  onChange={e => setDispatchForm(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Payload Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={dispatchForm.packageWeightKg}
                    onChange={e => setDispatchForm(prev => ({ ...prev, packageWeightKg: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Drop Method</label>
                  <select
                    value={dispatchForm.dropMethod}
                    onChange={e => setDispatchForm(prev => ({ ...prev, dropMethod: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                  >
                    <option value="WINCH_TETHER_DROP">Winch Tether Drop</option>
                    <option value="GROUND_LAND_PAD">Ground Landing Pad</option>
                    <option value="LOCKER_DOCK">Smart Locker Dock</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 rounded text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                >
                  Authorize Flight Takeoff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
