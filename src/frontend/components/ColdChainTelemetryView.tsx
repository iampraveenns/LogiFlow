/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - IoT Cold Chain & Multi-Sensor Environmental Telemetry View
 */

import React, { useState } from 'react';
import {
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  Sun,
  Printer,
  Sparkles,
  Layers,
  FileCheck2,
} from 'lucide-react';
import {
  ColdChainSensorService,
  ColdChainContainerProfile,
} from '../../backend/services/coldChainSensorService.ts';

export const ColdChainTelemetryView: React.FC = () => {
  const [containers, setContainers] = useState<ColdChainContainerProfile[]>(() =>
    ColdChainSensorService.getContainers()
  );
  const [selectedContainerId, setSelectedContainerId] = useState<string>(containers[0]?.containerId || '');

  const selectedContainer =
    containers.find((c) => c.containerId === selectedContainerId) || containers[0];

  const handleSimulateExcursion = (type: 'TEMP_SPIKE' | 'SHOCK_DROP' | 'LIGHT_TAMPER') => {
    if (!selectedContainer) return;

    const latest = { ...selectedContainer.currentReadings };
    if (type === 'TEMP_SPIKE') {
      latest.temperatureCelsius = -58.2; // Breaches -65°C safe threshold
    } else if (type === 'SHOCK_DROP') {
      latest.shockAxisG.maxG = 3.4; // > 2.5G critical drop shock
      latest.shockAxisG.z = 3.4;
    } else if (type === 'LIGHT_TAMPER') {
      latest.lightLux = 145; // Container door open breach
    }

    ColdChainSensorService.ingestReading(selectedContainer.containerId, latest);
    setContainers([...ColdChainSensorService.getContainers()]);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Thermometer className="h-6 w-6 text-cyan-400" />
            IoT Cold Chain &amp; Multi-Sensor Telemetry Environmental Chamber
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Haynes Mean Kinetic Temperature (MKT), 3-axis G-shock impact sensors, and FDA 21 CFR Part 11 GDP audit validation.
          </p>
        </div>

        {/* Simulation Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSimulateExcursion('TEMP_SPIKE')}
            className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Simulate Temp Spike</span>
          </button>
          <button
            onClick={() => handleSimulateExcursion('SHOCK_DROP')}
            className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Simulate 3.4G Shock</span>
          </button>
          <button
            onClick={() => handleSimulateExcursion('LIGHT_TAMPER')}
            className="px-3 py-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Sun className="h-3.5 w-3.5" />
            <span>Simulate Door Breach</span>
          </button>
        </div>
      </div>

      {/* Container Selector Tabs */}
      <div className="flex items-center gap-3">
        {containers.map((c) => (
          <button
            key={c.containerId}
            onClick={() => setSelectedContainerId(c.containerId)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2.5 ${
              selectedContainerId === c.containerId
                ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-lg shadow-cyan-950/40'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="font-mono text-cyan-300">{c.containerId}</span>
            <span>•</span>
            <span className="truncate max-w-[200px]">{c.payloadDescription.split('(')[0]}</span>
            <span
              className={`h-2 w-2 rounded-full ${
                c.gdpComplianceStatus === 'CERTIFIED_COMPLIANT'
                  ? 'bg-emerald-500'
                  : 'bg-red-500 animate-ping'
              }`}
            ></span>
          </button>
        ))}
      </div>

      {/* Main Sensor HUD Cards */}
      {selectedContainer && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Core Temperature */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Thermometer className="h-3 w-3 text-cyan-400" /> Core Temperature
              </div>
              <div className="text-3xl font-mono font-black text-cyan-300 mt-1">
                {selectedContainer.currentReadings.temperatureCelsius}°C
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Target: {selectedContainer.temperatureRange.minCelsius}°C to{' '}
                {selectedContainer.temperatureRange.maxCelsius}°C
              </div>
            </div>

            {/* Mean Kinetic Temperature (Haynes) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Activity className="h-3 w-3 text-blue-400" /> Haynes MKT Index
              </div>
              <div className="text-3xl font-mono font-black text-blue-300 mt-1">
                {selectedContainer.meanKineticTempCelsius}°C
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Cumulative thermal kinetics (ΔH=83.14 kJ/mol)
              </div>
            </div>

            {/* 3-Axis Shock G-Force */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Activity className="h-3 w-3 text-amber-400" /> Max Impact Shock
              </div>
              <div
                className={`text-3xl font-mono font-black mt-1 ${
                  selectedContainer.currentReadings.shockAxisG.maxG > 2.5
                    ? 'text-red-400'
                    : 'text-emerald-400'
                }`}
              >
                {selectedContainer.currentReadings.shockAxisG.maxG}G
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Axis X:{selectedContainer.currentReadings.shockAxisG.x}G • Y:{selectedContainer.currentReadings.shockAxisG.y}G • Z:{selectedContainer.currentReadings.shockAxisG.z}G
              </div>
            </div>

            {/* Tamper Light Sensor & Cryo Mass */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Sun className="h-3 w-3 text-yellow-400" /> Container Seal / Lux
              </div>
              <div className="text-3xl font-mono font-black text-white mt-1">
                {selectedContainer.currentReadings.lightLux}{' '}
                <span className="text-xs font-normal text-slate-400">Lux</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                Dry Ice Mass: {selectedContainer.currentReadings.dryIceReservePercent}%
              </div>
            </div>
          </div>

          {/* Compliance Status & Incident Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Excursion Incidents (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Thermal &amp; Shock Excursion Incidents
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {selectedContainer.excursions.length} Incidents Flagged
                </span>
              </div>

              {selectedContainer.excursions.length === 0 ? (
                <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-6 text-center text-emerald-300 text-xs space-y-1">
                  <ShieldCheck className="h-6 w-6 text-emerald-400 mx-auto" />
                  <div className="font-bold text-sm">Thermal Profile Within Nominal Limits</div>
                  <p className="text-slate-400 text-[11px]">
                    No temperature, shock, or tamper excursion incidents recorded during transit.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedContainer.excursions.map((exc) => (
                    <div
                      key={exc.id}
                      className="bg-slate-950 border border-red-800/60 rounded-xl p-3.5 space-y-1.5 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-300 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                          {exc.type} ({exc.severity})
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(exc.detectedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-slate-200">
                        Recorded Value: <strong className="text-red-400">{exc.recordedValue}</strong> (Limit: {exc.thresholdLimit})
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Action Taken: {exc.correctiveActionTaken}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Regulatory GDP Audit Certification (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-emerald-400" />
                  EU GDP / FDA 21 CFR Certificate
                </h3>
                <button
                  onClick={() => window.print()}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Print Audit Certificate"
                >
                  <Printer className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Container ID:</span>
                  <span className="font-bold text-cyan-300">{selectedContainer.containerId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Associated Waybill:</span>
                  <span className="font-bold text-slate-200">{selectedContainer.waybillId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">GDP Status:</span>
                  <span
                    className={`font-bold ${
                      selectedContainer.gdpComplianceStatus === 'CERTIFIED_COMPLIANT'
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {selectedContainer.gdpComplianceStatus}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Data Logger SN:</span>
                  <span className="font-bold text-slate-300">SEN-CRYO-09881-A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Calibrated Accuracy:</span>
                  <span className="font-bold text-emerald-400">±0.05°C (NIST Traceable)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
