/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - A* Pathfinding & Multi-Stop Route Optimization Studio
 */

import React, { useState } from 'react';
import {
  Route,
  Navigation,
  Clock,
  Fuel,
  Leaf,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Play,
  Truck,
  Ship,
  Plane,
  Zap,
} from 'lucide-react';
import { GLOBAL_HUBS } from '../../backend/constants/index.ts';
import { VehicleType, RouteOptimizationResult } from '../../packages/shared-types/index.ts';
import { RouteOptimizationService } from '../../backend/services/routeOptimizationService.ts';

export const RouteOptimizerView: React.FC = () => {
  const [originHubId, setOriginHubId] = useState<string>('HUB-RTM');
  const [destinationHubId, setDestinationHubId] = useState<string>('HUB-HAM');
  const [intermediateHubId, setIntermediateHubId] = useState<string>('NONE');
  const [vehicleType, setVehicleType] = useState<VehicleType>('ELECTRIC_HAULER');
  const [cargoWeightKg, setCargoWeightKg] = useState<number>(24000);
  const [avoidTolls, setAvoidTolls] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<RouteOptimizationResult | null>(() => {
    const orig = GLOBAL_HUBS.find((h) => h.id === 'HUB-RTM')!;
    const dest = GLOBAL_HUBS.find((h) => h.id === 'HUB-HAM')!;
    return RouteOptimizationService.optimizeRoute({
      origin: { name: orig.name, coordinates: orig.coordinates },
      destination: { name: dest.name, coordinates: dest.coordinates },
      vehicleType: 'ELECTRIC_HAULER',
      cargoWeightKg: 24000,
      avoidTolls: false,
    });
  });

  const handleCalculateRoute = () => {
    const orig = GLOBAL_HUBS.find((h) => h.id === originHubId)!;
    const dest = GLOBAL_HUBS.find((h) => h.id === destinationHubId)!;

    const stops = [];
    if (intermediateHubId !== 'NONE' && intermediateHubId !== originHubId && intermediateHubId !== destinationHubId) {
      const stop = GLOBAL_HUBS.find((h) => h.id === intermediateHubId);
      if (stop) stops.push({ name: stop.name, coordinates: stop.coordinates });
    }

    const result = RouteOptimizationService.optimizeRoute({
      origin: { name: orig.name, coordinates: orig.coordinates },
      destination: { name: dest.name, coordinates: dest.coordinates },
      intermediateStops: stops,
      vehicleType,
      cargoWeightKg,
      avoidTolls,
    });

    setRouteResult(result);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          <Route className="h-6 w-6 text-cyan-400" />
          A* Spatial Pathfinding &amp; Multi-Stop Route Optimization Studio
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Heuristic graph traversal factoring in FMCSA driver hours-of-service, gross vehicle weight matrices, and carbon mitigation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameters Panel */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Navigation className="h-4 w-4 text-cyan-400" />
            Route Constraints &amp; Hubs
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Origin Terminal</label>
              <select
                value={originHubId}
                onChange={(e) => setOriginHubId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {GLOBAL_HUBS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.city}, {h.country})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Intermediate Waypoint (Optional)</label>
              <select
                value={intermediateHubId}
                onChange={(e) => setIntermediateHubId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="NONE">-- Direct Transit (No Intermediate Stop) --</option>
                {GLOBAL_HUBS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Destination Terminal</label>
              <select
                value={destinationHubId}
                onChange={(e) => setDestinationHubId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {GLOBAL_HUBS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.city}, {h.country})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Conveyance Profile</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className="w-full bg-slate-800 border border-slate-700 text-xs rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="ELECTRIC_HAULER">Volvo FH Electric Hauler (Low Carbon)</option>
                <option value="CLASS_8_SEMI">Freightliner Cascadia Diesel Class 8</option>
                <option value="BOEING_777F">Boeing 777-200LRF SkyExpress (Air Freight)</option>
                <option value="PANAMAX_VESSEL">Ever Glory Panamax Vessel (Ocean Intermodal)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Cargo Gross Payload:</span>
                <span className="font-mono text-cyan-400">{(cargoWeightKg / 1000).toFixed(1)} MT</span>
              </div>
              <input
                type="range"
                min="5000"
                max="80000"
                step="1000"
                value={cargoWeightKg}
                onChange={(e) => setCargoWeightKg(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="avoidTolls"
                checked={avoidTolls}
                onChange={(e) => setAvoidTolls(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
              <label htmlFor="avoidTolls" className="text-xs text-slate-300 cursor-pointer">
                Avoid Toll Corridors (Heuristic Penalty)
              </label>
            </div>
          </div>

          <button
            onClick={handleCalculateRoute}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition-all mt-4"
          >
            <Play className="h-4 w-4" />
            <span>Execute A* Pathfinding Engine</span>
          </button>
        </div>

        {/* Results Panel */}
        {routeResult && (
          <div className="lg:col-span-2 space-y-6">
            {/* KPI Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Navigation className="h-3 w-3 text-cyan-400" /> Distance
                </div>
                <div className="text-xl font-mono font-black text-white mt-1">
                  {routeResult.totalDistanceKm.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-400">km</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  -{routeResult.savingsVsBaseline.distanceSavedKm} km vs standard
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-400" /> Duration
                </div>
                <div className="text-xl font-mono font-black text-slate-100 mt-1">
                  {routeResult.estimatedDurationHours}{' '}
                  <span className="text-xs font-normal text-slate-400">hours</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">Includes dwell times</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Fuel className="h-3 w-3 text-amber-400" /> Fuel / Energy
                </div>
                <div className="text-xl font-mono font-black text-amber-400 mt-1">
                  {routeResult.estimatedFuelLiters.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-400">L / kWh</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  +${routeResult.savingsVsBaseline.fuelCostSavedUsd} saved
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Leaf className="h-3 w-3 text-emerald-400" /> CO2 Footprint
                </div>
                <div className="text-xl font-mono font-black text-emerald-400 mt-1">
                  {routeResult.estimatedCo2EmissionsKg.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-400">kg</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  -{routeResult.savingsVsBaseline.co2SavedKg} kg mitigated
                </div>
              </div>
            </div>

            {/* HOS Compliance Banner */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                routeResult.hosComplianceVerified
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {routeResult.hosComplianceVerified ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                )}
                <span>
                  {routeResult.hosComplianceVerified
                    ? 'FMCSA Hours-of-Service (HOS) Verified: Route conforms to 11-hour single shift drive limit.'
                    : 'Mandatory Sleeper Berth Break Required: Route exceeds 11-hour single driver duty limit.'}
                </span>
              </div>
              <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-black/40">
                Toll Costs: ${routeResult.tollCostsUsd}
              </span>
            </div>

            {/* Waypoint Sequencing Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-lg">
              <div className="p-3 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-300">
                Optimized Waypoint Sequence
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono">
                  <tr>
                    <th className="p-2.5">Stop</th>
                    <th className="p-2.5">Node Designation</th>
                    <th className="p-2.5">Leg Distance</th>
                    <th className="p-2.5">ETA Window</th>
                    <th className="p-2.5 text-right">Leg Toll</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {routeResult.waypoints.map((wp, idx) => (
                    <tr key={wp.id} className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-bold text-cyan-400">#{idx + 1}</td>
                      <td className="p-2.5 font-sans font-medium text-slate-200">
                        {wp.name}{' '}
                        <span className="text-[10px] text-slate-400 font-mono">[{wp.type}]</span>
                      </td>
                      <td className="p-2.5 text-slate-300">{wp.distanceFromPreviousKm} km</td>
                      <td className="p-2.5 text-slate-300">
                        {new Date(wp.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-2.5 text-right text-slate-400">${wp.tollCostUsd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
