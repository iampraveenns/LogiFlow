/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Fleet Telematics & OBD-II Diagnostics Dashboard
 */

import React from 'react';
import {
  Truck,
  Gauge,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Wrench,
  Activity,
  Flame,
  Radio,
} from 'lucide-react';
import { Vehicle } from '../../packages/shared-types/index.ts';

interface FleetTelematicsViewProps {
  vehicles: Vehicle[];
  onClearDtc: (vehicleId: string, code: string) => void;
  onTriggerDisruption: (type: 'HARSH_BRAKING' | 'DTC_FAULT' | 'REEFER_SPIKE' | 'CUSTOMS_HOLD' | 'GEOFENCE_EXIT') => void;
}

export const FleetTelematicsView: React.FC<FleetTelematicsViewProps> = ({
  vehicles,
  onClearDtc,
  onTriggerDisruption,
}) => {
  const totalDtcCount = vehicles.reduce((sum, v) => sum + v.telematics.dtcCodes.length, 0);
  const criticalDtcCount = vehicles.reduce(
    (sum, v) => sum + v.telematics.dtcCodes.filter((d) => d.severity === 'CRITICAL').length,
    0
  );

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Truck className="h-6 w-6 text-cyan-400" />
            Fleet Telematics &amp; OBD-II Diagnostic Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time J1939 CAN-bus telemetry, powertrain sensor streaming, driver behavior safety scoring, and DTC diagnostics.
          </p>
        </div>

        {/* Quick Diagnostic Simulation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTriggerDisruption('DTC_FAULT')}
            className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            <span>Inject P0300 Misfire</span>
          </button>
          <button
            onClick={() => onTriggerDisruption('REEFER_SPIKE')}
            className="px-3 py-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Thermometer className="h-3.5 w-3.5 text-cyan-400" />
            <span>Inject Reefer Breach</span>
          </button>
        </div>
      </div>

      {/* KPI Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Fleet Size</div>
            <div className="text-2xl font-mono font-black text-white mt-1">{vehicles.length} Units</div>
            <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
              <Radio className="h-3 w-3" /> 100% Pinging Live
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Fault DTCs</div>
            <div className="text-2xl font-mono font-black text-amber-400 mt-1">{totalDtcCount} Registered</div>
            <div className="text-[11px] text-red-400 mt-0.5">
              {criticalDtcCount} Critical Severity Codes
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Driver Safety Score</div>
            <div className="text-2xl font-mono font-black text-emerald-400 mt-1">92.2 / 100</div>
            <div className="text-[11px] text-slate-400 mt-0.5">FMCSA Compliant</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cold-Chain Compliance</div>
            <div className="text-2xl font-mono font-black text-cyan-400 mt-1">98.5%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">GDP Pharma Validated</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-cyan-400">
            <Thermometer className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vehicles.map((v) => {
          const hasCritical = v.telematics.dtcCodes.some((d) => d.severity === 'CRITICAL');
          const hasHarshBrake = v.telematics.harshBrakingDetected;

          return (
            <div
              key={v.id}
              className={`bg-slate-900/70 border rounded-xl p-5 space-y-4 shadow-xl transition-all ${
                hasCritical
                  ? 'border-red-600/80 shadow-red-950/20'
                  : v.telematics.dtcCodes.length > 0
                  ? 'border-amber-600/60'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">{v.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {v.type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Plate: {v.licensePlate} • VIN: {v.vin}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded text-xs font-mono font-bold ${
                      v.currentStatus === 'EN_ROUTE'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {v.currentStatus}
                  </span>
                </div>
              </div>

              {/* Sensor HUD Row */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Gauge className="h-3 w-3 text-cyan-400" />
                    Speed
                  </div>
                  <div className="text-base font-mono font-bold text-slate-200 mt-0.5">
                    {v.currentLocation.speedKmh} <span className="text-[10px] text-slate-400">km/h</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Zap className="h-3 w-3 text-emerald-400" />
                    Fuel / Battery
                  </div>
                  <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                    {v.telematics.batterySocPercent !== undefined
                      ? `${v.telematics.batterySocPercent}%`
                      : `${v.telematics.fuelLevelPercent}%`}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Thermometer className="h-3 w-3 text-blue-400" />
                    Cargo / Reefer
                  </div>
                  <div className="text-base font-mono font-bold text-cyan-300 mt-0.5">
                    {v.telematics.cargoTemperatureCelsius !== undefined
                      ? `${v.telematics.cargoTemperatureCelsius}°C`
                      : 'Ambient'}
                  </div>
                </div>
              </div>

              {/* Harsh Braking or Rapid Acceleration Alerts */}
              {(hasHarshBrake || v.telematics.rapidAccelerationDetected) && (
                <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-2.5 text-xs text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Harsh Braking Event: Deceleration spike detected on telemetry stream.</span>
                  </div>
                </div>
              )}

              {/* OBD-II Fault Codes */}
              {v.telematics.dtcCodes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Active Diagnostic Trouble Codes (DTC)
                  </div>
                  <div className="space-y-1.5">
                    {v.telematics.dtcCodes.map((dtc) => (
                      <div
                        key={dtc.code}
                        className={`p-2.5 rounded-lg border flex items-center justify-between ${
                          dtc.severity === 'CRITICAL'
                            ? 'bg-red-950/40 border-red-800 text-red-200'
                            : 'bg-amber-950/40 border-amber-800 text-amber-200'
                        }`}
                      >
                        <div>
                          <div className="font-mono font-bold text-xs flex items-center gap-2">
                            <span>{dtc.code}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40">
                              {dtc.system}
                            </span>
                          </div>
                          <div className="text-[11px] mt-0.5 opacity-90">{dtc.description}</div>
                        </div>
                        <button
                          onClick={() => onClearDtc(v.id, dtc.code)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold shrink-0 ml-3 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Driver & HOS */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Driver: <strong className="text-slate-200">{v.assignedDriver.name}</strong></span>
                <span className="font-mono">
                  HOS Remaining: <strong className="text-cyan-400">{v.assignedDriver.hosRemainingHours}h</strong> / 11h
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
