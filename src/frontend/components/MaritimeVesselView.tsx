/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Anchor,
  Compass,
  Navigation,
  Fuel,
  Wind,
  ShieldCheck,
  AlertTriangle,
  Ship,
  CheckCircle2,
  MapPin,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  MaritimeVesselService, 
  VesselTelemetryData, 
  PortRegistryEntry 
} from '../../backend/services/maritimeVesselService.ts';

export const MaritimeVesselView: React.FC = () => {
  const [vessels] = useState<VesselTelemetryData[]>(MaritimeVesselService.getVessels());
  const [selectedImo, setSelectedImo] = useState<string>(vessels[0]?.imo || '9839438');
  const [activeTab, setActiveTab] = useState<'AIS_FLEET' | 'GREAT_CIRCLE' | 'CANAL_TRANSIT'>('AIS_FLEET');

  // Great Circle simulator parameters
  const [routeOrigin, setRouteOrigin] = useState<string>('SGSIN');
  const [routeDest, setRouteDest] = useState<string>('NLRTM');
  const [selectedSpeedKnots, setSelectedSpeedKnots] = useState<number>(18.5);

  const selectedVessel = useMemo(() => {
    return vessels.find(v => v.imo === selectedImo) || vessels[0];
  }, [vessels, selectedImo]);

  // Compute bunker fuel consumption at selected speed
  const bunkerMetrics = useMemo(() => {
    const hours = 24 * 16; // 16-day voyage
    return MaritimeVesselService.calculateBunkerConsumption(
      selectedVessel,
      selectedSpeedKnots,
      hours,
      selectedVessel.currentWeather.beaufortScale
    );
  }, [selectedVessel, selectedSpeedKnots]);

  // Great Circle route points
  const routeWaypoints = useMemo(() => {
    return MaritimeVesselService.generateGreatCircleWaypoints(
      routeOrigin,
      routeDest,
      selectedVessel,
      6
    );
  }, [routeOrigin, routeDest, selectedVessel]);

  // Canal checks
  const suezCheck = useMemo(() => {
    return MaritimeVesselService.evaluateCanalTransit('SUEZ', selectedVessel);
  }, [selectedVessel]);

  const panamaCheck = useMemo(() => {
    return MaritimeVesselService.evaluateCanalTransit('PANAMA_NEO', selectedVessel);
  }, [selectedVessel]);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Anchor className="h-6 w-6 text-sky-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">Global Maritime Navigation &amp; AIS Fleet Hub</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Orthodromic Great Circle navigation, Cubic Propeller Law fuel burn, and Panama/Suez Canal lock transit clearances.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('AIS_FLEET')}
            className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === 'AIS_FLEET'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live AIS Fleet
          </button>
          <button
            onClick={() => setActiveTab('GREAT_CIRCLE')}
            className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === 'GREAT_CIRCLE'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Great Circle Routing
          </button>
          <button
            onClick={() => setActiveTab('CANAL_TRANSIT')}
            className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === 'CANAL_TRANSIT'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Canal Transit Cleared
          </button>
        </div>
      </div>

      {activeTab === 'AIS_FLEET' && (
        <div className="space-y-6">
          {/* Vessel Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vessels.map(v => (
              <div
                key={v.imo}
                onClick={() => setSelectedImo(v.imo)}
                className={`cursor-pointer rounded-xl p-4 border transition ${
                  selectedImo === v.imo
                    ? 'bg-slate-900 border-sky-500 ring-1 ring-sky-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Ship className="h-4 w-4 text-sky-400" />
                    <span className="font-bold text-white font-mono text-sm">{v.vesselName}</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    IMO {v.imo}
                  </span>
                </div>

                <div className="text-xs text-slate-400 mb-3">
                  {v.vesselClass.replace(/_/g, ' ')} • Flag: {v.flagState}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 mb-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div>Speed: <span className="text-emerald-400 font-bold">{v.speedOverGroundKnots} kts</span></div>
                  <div>Draft: <span className="text-purple-400 font-bold">{v.currentDraftMeters}m</span></div>
                  <div>TEU: <span className="text-sky-300 font-bold">{v.teuStowed.toLocaleString()}</span></div>
                  <div>Weather: <span className="text-amber-400">Force {v.currentWeather.beaufortScale}</span></div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span className="font-mono">{v.originPortUnlocode}</span>
                  <ArrowRight className="h-3 w-3 text-slate-500" />
                  <span className="font-mono font-bold text-white">{v.destinationPortUnlocode}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Vessel Telemetry Deep Dive */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedVessel.vesselName} — Real-Time Telemetry</h3>
                <p className="text-xs text-slate-400">Class: {selectedVessel.vesselClass} • DWT: {selectedVessel.deadweightTonnageDwt.toLocaleString()} Metric Tons</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                  AIS TRANSCEIVER ACTIVE (CLASS A)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="text-xs text-slate-400">Current Position</div>
                <div className="text-sm font-mono font-bold text-white mt-1">
                  {selectedVessel.currentCoordinates[0]}° N, {selectedVessel.currentCoordinates[1]}° E
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Course Over Ground (COG)</div>
                <div className="text-sm font-mono font-bold text-sky-400 mt-1">
                  {selectedVessel.courseOverGroundDeg}° True
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Fuel Onboard (VLSFO)</div>
                <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                  {selectedVessel.currentFuelMetricTons} / {selectedVessel.fuelCapacityMetricTons} MT
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Active Reefer Plugs</div>
                <div className="text-sm font-mono font-bold text-amber-400 mt-1">
                  {selectedVessel.reeferContainersActive} TEU (460V 3-Phase)
                </div>
              </div>
            </div>

            {/* Sea State & Meteorological Weather Sensor Overlay */}
            <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Wind className="h-4 w-4 text-sky-400" />
                Live Meteorological Sea State Sensors
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Beaufort Force</div>
                  <div className="text-base font-bold text-white mt-1">Scale {selectedVessel.currentWeather.beaufortScale}</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Significant Wave Height</div>
                  <div className="text-base font-bold text-sky-400 mt-1">{selectedVessel.currentWeather.waveHeightMeters} meters</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-slate-400">True Wind Speed</div>
                  <div className="text-base font-bold text-amber-400 mt-1">{selectedVessel.currentWeather.windSpeedKnots} knots</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Wind Direction</div>
                  <div className="text-base font-bold text-purple-400 mt-1">{selectedVessel.currentWeather.windDirectionDegrees}°</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Sea Surface Temp</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">{selectedVessel.currentWeather.seaSurfaceTempCelsius}°C</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'GREAT_CIRCLE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Voyage Parameters & Bunker Propeller Law */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Fuel className="h-4 w-4 text-emerald-400" />
                Cubic Propeller Law Fuel Burn
              </h3>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Origin Seaport</label>
                <select
                  value={routeOrigin}
                  onChange={e => setRouteOrigin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                >
                  {Object.values(MaritimeVesselService.PORT_REGISTRY).map(p => (
                    <option key={p.unlocode} value={p.unlocode}>
                      {p.portName} ({p.unlocode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Destination Seaport</label>
                <select
                  value={routeDest}
                  onChange={e => setRouteDest(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                >
                  {Object.values(MaritimeVesselService.PORT_REGISTRY).map(p => (
                    <option key={p.unlocode} value={p.unlocode}>
                      {p.portName} ({p.unlocode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Steaming Speed:</span>
                  <span className="font-mono text-sky-400 font-bold">{selectedSpeedKnots} Knots</span>
                </div>
                <input
                  type="range"
                  min="12.0"
                  max="22.5"
                  step="0.5"
                  value={selectedSpeedKnots}
                  onChange={e => setSelectedSpeedKnots(parseFloat(e.target.value))}
                  className="w-full accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>12 kts (Super Eco)</span>
                  <span>18.5 kts (Design)</span>
                  <span>22.5 kts (Full Flank)</span>
                </div>
              </div>

              {/* Bunker Cost Output */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bunker Consumption:</span>
                  <span className="text-white font-bold">{bunkerMetrics.totalFuelMt} MT VLSFO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fuel Expenditure:</span>
                  <span className="text-emerald-400 font-bold">${bunkerMetrics.fuelCostUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Voyage CO2 Footprint:</span>
                  <span className="text-purple-400 font-bold">{bunkerMetrics.co2EmissionsMt} MT CO2</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 text-sky-300">
                  <span>Slow Steaming Savings:</span>
                  <span>+{bunkerMetrics.slowSteamingSavingsMt} MT fuel</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Waypoints Track */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Compass className="h-4 w-4 text-sky-400" />
                Great Circle (Orthodromic) Arc Waypoints
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <th className="p-3">Waypoint #</th>
                      <th className="p-3">Latitude / Longitude</th>
                      <th className="p-3">True Bearing</th>
                      <th className="p-3">Cumul. Dist (NM)</th>
                      <th className="p-3">Est. Transit Time</th>
                      <th className="p-3">Fuel Burn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {routeWaypoints.map((pt, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-3 text-sky-400 font-bold">WP-{idx + 1}</td>
                        <td className="p-3 text-slate-200">{pt.latitude}° N, {pt.longitude}° E</td>
                        <td className="p-3 text-amber-400">{pt.bearingDegrees}°</td>
                        <td className="p-3 text-white">{pt.cumulativeDistanceNm} NM</td>
                        <td className="p-3 text-slate-400">{pt.estimatedTransitHours} hrs</td>
                        <td className="p-3 text-emerald-400">{pt.bunkerConsumptionMt} MT</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'CANAL_TRANSIT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Suez Canal Clearance Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Suez Canal Transit Authority</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                suezCheck.transitPermitted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {suezCheck.transitPermitted ? 'PERMITTED' : 'EXCEEDED'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {suezCheck.reason}
            </p>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Maximum Allowable Draft:</span>
                <span className="text-white">20.10 meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vessel Current Draft:</span>
                <span className="text-purple-400 font-bold">{selectedVessel.currentDraftMeters} meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SCNT Toll Fee Assessment:</span>
                <span className="text-emerald-400 font-bold">${suezCheck.tollEstimateUsd.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Convoy Anchorage Wait:</span>
                <span className="text-amber-400 font-bold">~{suezCheck.lockCongestionWaitDays} Days</span>
              </div>
            </div>
          </div>

          {/* Panama Canal Clearance Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Panama Canal (ACP) Neo-Panamax Locks</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                panamaCheck.transitPermitted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {panamaCheck.transitPermitted ? 'PERMITTED' : 'BEAM RESTRICTION'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {panamaCheck.reason}
            </p>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Lock Width / Max Beam:</span>
                <span className="text-white">51.25 meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gatun Lake Max Draft:</span>
                <span className="text-white">15.24 meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lockage Toll Assessment:</span>
                <span className="text-emerald-400 font-bold">
                  {panamaCheck.transitPermitted ? `$${panamaCheck.tollEstimateUsd.toLocaleString()}` : 'N/A (Reroute Required)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Slot Queue Wait:</span>
                <span className="text-amber-400 font-bold">~{panamaCheck.lockCongestionWaitDays} Days</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
