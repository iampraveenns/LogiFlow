/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Interactive Global Fleet & Telematics Map
 * Renders spatial projections, vehicle kinematics, weather overlays, and live telemetry HUD.
 */

import React, { useState } from 'react';
import {
  Truck,
  Ship,
  Plane,
  Gauge,
  Thermometer,
  ShieldAlert,
  Compass,
  AlertTriangle,
  X,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { Vehicle, GeofenceZone } from '../../packages/shared-types/index.ts';

interface FleetMapProps {
  vehicles: Vehicle[];
  geofences: GeofenceZone[];
  selectedVehicle: Vehicle;
  onSelectVehicle: (id: string) => void;
  onClearDtc: (vehicleId: string, code: string) => void;
  onTriggerDisruption: (type: 'HARSH_BRAKING' | 'DTC_FAULT' | 'REEFER_SPIKE' | 'CUSTOMS_HOLD' | 'GEOFENCE_EXIT') => void;
}

export const FleetMap: React.FC<FleetMapProps> = ({
  vehicles,
  geofences,
  selectedVehicle,
  onSelectVehicle,
  onClearDtc,
  onTriggerDisruption,
}) => {
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [showTelemetryDrawer, setShowTelemetryDrawer] = useState(true);

  // Convert lat/lng to SVG coordinates [0..1000 width, 0..500 height] using Equirectangular projection
  const projectCoords = (coords: [number, number]): { x: number; y: number } => {
    const [lat, lng] = coords;
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
  };

  const getVehicleIcon = (type: Vehicle['type']) => {
    switch (type) {
      case 'BOEING_777F':
        return <Plane className="h-4 w-4 text-sky-400" />;
      case 'PANAMAX_VESSEL':
        return <Ship className="h-4 w-4 text-cyan-400" />;
      case 'ELECTRIC_HAULER':
        return <Zap className="h-4 w-4 text-emerald-400" />;
      case 'CLASS_8_SEMI':
      default:
        return <Truck className="h-4 w-4 text-amber-400" />;
    }
  };

  const selectedProj = projectCoords(selectedVehicle.currentLocation.coordinates);

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-slate-950">
      {/* Top Map HUD Overlay Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-2 shadow-2xl">
        <span className="text-xs font-bold text-slate-300 px-2 flex items-center gap-1.5 border-r border-slate-800">
          <Layers className="h-3.5 w-3.5 text-cyan-400" />
          Map Layers
        </span>
        <button
          onClick={() => setShowWeatherOverlay(!showWeatherOverlay)}
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
            showWeatherOverlay
              ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Weather Radar
        </button>
        <button
          onClick={() => setShowGeofences(!showGeofences)}
          className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
            showGeofences
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Geofences ({geofences.length})
        </button>
      </div>

      {/* Map Stats Badge */}
      <div className="absolute top-4 right-4 z-20 hidden md:flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-2 shadow-2xl">
        <div className="text-right">
          <div className="text-[10px] uppercase font-bold text-slate-400">Active Units</div>
          <div className="text-sm font-mono font-bold text-emerald-400">{vehicles.length} En Route</div>
        </div>
        <div className="h-8 w-px bg-slate-800"></div>
        <div className="text-right">
          <div className="text-[10px] uppercase font-bold text-slate-400">Network Health</div>
          <div className="text-sm font-mono font-bold text-cyan-400">99.8% Nominal</div>
        </div>
      </div>

      {/* Main SVG Vector World Map */}
      <div className="w-full h-full relative overflow-auto flex items-center justify-center p-4">
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full max-h-[82vh] rounded-xl border border-slate-800/80 bg-slate-950 shadow-inner select-none"
        >
          {/* Subtle Grid Lat/Long Lines */}
          <defs>
            <pattern id="grid" width="100" height="50" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
            </pattern>
            <radialGradient id="radarPing" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          <rect width="1000" height="500" fill="#020617" />
          <rect width="1000" height="500" fill="url(#grid)" />

          {/* Continents Silhouettes (Simplified stylized landmass polygons) */}
          <g fill="#0f172a" stroke="#1e293b" strokeWidth="1">
            {/* North America */}
            <path d="M 120 70 L 260 70 L 320 120 L 290 190 L 230 240 L 220 290 L 190 280 L 140 210 L 80 140 Z" />
            {/* South America */}
            <path d="M 230 280 L 310 290 L 360 340 L 330 420 L 280 470 L 250 400 Z" />
            {/* Eurasia & Europe */}
            <path d="M 450 70 L 880 70 L 890 180 L 820 260 L 710 230 L 650 200 L 590 220 L 520 200 L 460 140 Z" />
            {/* Africa */}
            <path d="M 460 190 L 570 190 L 610 260 L 580 370 L 510 400 L 450 270 Z" />
            {/* Australia */}
            <path d="M 780 320 L 890 320 L 910 390 L 820 420 L 760 370 Z" />
          </g>

          {/* Strategic Corridors (Suez, Panama, Transatlantic, Pacific) */}
          <g stroke="#334155" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.6">
            {/* Transatlantic Flight Path */}
            <path d="M 240 140 Q 380 90 490 120" />
            {/* Transpacific Shipping Route */}
            <path d="M 820 190 Q 950 170 1000 175" />
            <path d="M 0 175 Q 80 180 200 185" />
            {/* Europe-Asia Marine Corridor */}
            <path d="M 490 130 Q 560 210 700 250" />
          </g>

          {/* Weather Alert Overlays */}
          {showWeatherOverlay && (
            <g>
              {/* North Pacific Storm */}
              <circle cx="890" cy="140" r="45" fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4,4" />
              <text x="890" y="145" fill="#60a5fa" fontSize="9" textAnchor="middle" fontFamily="monospace">
                Pacific Jetstream (+18kt)
              </text>
              {/* Central Plains Weather */}
              <circle cx="210" cy="165" r="30" fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
              <text x="210" y="170" fill="#fbbf24" fontSize="8" textAnchor="middle" fontFamily="monospace">
                I-80 Precipitation
              </text>
            </g>
          )}

          {/* Geofence Boundaries */}
          {showGeofences &&
            geofences.map((zone) => {
              const { x, y } = projectCoords(zone.center);
              const r = Math.max(12, zone.radiusKm * 0.4);
              return (
                <g key={zone.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={r}
                    fill={zone.type === 'RESTRICTED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.12)'}
                    stroke={zone.type === 'RESTRICTED' ? '#ef4444' : '#10b981'}
                    strokeWidth="1.2"
                    strokeDasharray="2,2"
                  />
                  <text x={x} y={y - r - 3} fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                    {zone.name}
                  </text>
                </g>
              );
            })}

          {/* Vehicle Markers */}
          {vehicles.map((v) => {
            const { x, y } = projectCoords(v.currentLocation.coordinates);
            const isSelected = v.id === selectedVehicle.id;
            const hasCriticalDtc = v.telematics.dtcCodes.some((d) => d.severity === 'CRITICAL');
            const hasWarningDtc = v.telematics.dtcCodes.length > 0;

            return (
              <g
                key={v.id}
                transform={`translate(${x}, ${y})`}
                onClick={() => {
                  onSelectVehicle(v.id);
                  setShowTelemetryDrawer(true);
                }}
                className="cursor-pointer transition-transform hover:scale-125"
              >
                {/* Ping Animation for Selected Vehicle */}
                {isSelected && (
                  <circle cx="0" cy="0" r="16" fill="url(#radarPing)" className="animate-ping" opacity="0.75" />
                )}

                {/* Marker Halo */}
                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? 10 : 8}
                  fill={
                    hasCriticalDtc
                      ? '#ef4444'
                      : hasWarningDtc
                      ? '#f59e0b'
                      : isSelected
                      ? '#06b6d4'
                      : '#1e293b'
                  }
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2 : 1}
                />

                {/* Heading Arrow indicator */}
                <line
                  x1="0"
                  y1="0"
                  x2={Math.sin((v.currentLocation.heading * Math.PI) / 180) * 14}
                  y2={-Math.cos((v.currentLocation.heading * Math.PI) / 180) * 14}
                  stroke={isSelected ? '#06b6d4' : '#94a3b8'}
                  strokeWidth="1.5"
                />

                {/* Label */}
                <text
                  x="12"
                  y="4"
                  fill={isSelected ? '#38bdf8' : '#cbd5e1'}
                  fontSize={isSelected ? '10' : '8'}
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  fontFamily="monospace"
                >
                  {v.name.split('(')[0]} ({Math.round(v.currentLocation.speedKmh)} km/h)
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Real-Time Telematics & Diagnostics Slide-over Drawer */}
      {showTelemetryDrawer && selectedVehicle && (
        <aside className="w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 text-slate-100 p-5 flex flex-col justify-between shrink-0 shadow-2xl z-30 overflow-y-auto">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                  {getVehicleIcon(selectedVehicle.type)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{selectedVehicle.name}</h3>
                  <p className="text-[11px] font-mono text-cyan-400">VIN: {selectedVehicle.vin}</p>
                </div>
              </div>
              <button
                onClick={() => setShowTelemetryDrawer(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <Gauge className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Velocity</span>
                </div>
                <div className="text-xl font-mono font-bold text-slate-100">
                  {selectedVehicle.currentLocation.speedKmh} <span className="text-xs font-normal text-slate-400">km/h</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Heading: {selectedVehicle.currentLocation.heading}°
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Energy / Fuel</span>
                </div>
                <div className="text-xl font-mono font-bold text-emerald-400">
                  {selectedVehicle.telematics.batterySocPercent !== undefined
                    ? `${selectedVehicle.telematics.batterySocPercent}% SoC`
                    : `${selectedVehicle.telematics.fuelLevelPercent}%`}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Odo: {selectedVehicle.telematics.odometerKm.toLocaleString()} km
                </div>
              </div>

              {/* Cold-Chain Reefer Sensor if applicable */}
              {selectedVehicle.telematics.cargoTemperatureCelsius !== undefined && (
                <div className="col-span-2 bg-blue-950/40 border border-blue-800/60 rounded-lg p-2.5">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="flex items-center gap-1.5 text-blue-300 font-bold">
                      <Thermometer className="h-3.5 w-3.5 text-cyan-400" />
                      Cold-Chain Reefer Monitoring
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300">
                      Active GDP Protocol
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-black text-cyan-300">
                      {selectedVehicle.telematics.cargoTemperatureCelsius}°C
                    </span>
                    <span className="text-xs text-slate-400">Target: -20.0°C to -80.0°C</span>
                  </div>
                </div>
              )}
            </div>

            {/* OBD-II Diagnostic Faults (DTCs) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                  OBD-II / CAN-Bus Telematics
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {selectedVehicle.telematics.dtcCodes.length} Faults
                </span>
              </div>

              {selectedVehicle.telematics.dtcCodes.length === 0 ? (
                <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-3 flex items-center gap-2 text-emerald-300 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>All powertrain &amp; safety controllers reporting nominal.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedVehicle.telematics.dtcCodes.map((dtc) => (
                    <div
                      key={dtc.code}
                      className="bg-red-950/40 border border-red-800/60 rounded-lg p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-red-300">
                          {dtc.code} [{dtc.system}]
                        </span>
                        <button
                          onClick={() => onClearDtc(selectedVehicle.id, dtc.code)}
                          className="text-[10px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded"
                        >
                          Clear DTC
                        </button>
                      </div>
                      <p className="text-xs text-slate-300">{dtc.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Driver & HOS Hours of Service */}
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3 space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Driver &amp; FMCSA Compliance</span>
                <span className="text-[10px] font-mono text-cyan-400">
                  Score: {selectedVehicle.assignedDriver.safetyScore}/100
                </span>
              </div>
              <div className="text-xs text-slate-200 font-medium">
                {selectedVehicle.assignedDriver.name} ({selectedVehicle.assignedDriver.licenseGrade})
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>HOS Drive Window Remaining:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {selectedVehicle.assignedDriver.hosRemainingHours}h / 11.0h
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full"
                    style={{
                      width: `${(selectedVehicle.assignedDriver.hosRemainingHours / 11.0) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={() => onTriggerDisruption('DTC_FAULT')}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 px-3 rounded-lg font-medium transition-colors"
            >
              Simulate Fault
            </button>
            <button
              onClick={() => onTriggerDisruption('HARSH_BRAKING')}
              className="flex-1 bg-amber-950/70 hover:bg-amber-900/70 border border-amber-800/80 text-amber-300 text-xs py-2 px-3 rounded-lg font-medium transition-colors"
            >
              Harsh Brake
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
