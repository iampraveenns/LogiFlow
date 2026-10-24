/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Cold Chain Predictive Risk & MKT Dashboard
 * Visualizes Arrhenius kinetic degradation curves, Haynes Mean Kinetic Temperature,
 * and reefer container thermodynamic heat ingress.
 */

import React, { useState } from 'react';
import {
  ThermometerSnowflake,
  AlertOctagon,
  Flame,
  Clock,
  Activity,
  CheckCircle,
  TrendingUp,
  Cpu,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  ColdChainPredictiveRiskEngine,
  ColdChainConsignment,
  ColdChainRiskAssessment,
} from '../../backend/services/coldChainPredictiveRiskEngine.ts';

export function ColdChainRiskPredictorView() {
  const consignments = ColdChainPredictiveRiskEngine.getConsignments();
  const [selectedId, setSelectedId] = useState<string>(consignments[0].id);

  const activeConsignment = ColdChainPredictiveRiskEngine.getConsignmentById(selectedId) || consignments[0];
  const assessment: ColdChainRiskAssessment = ColdChainPredictiveRiskEngine.evaluateConsignment(activeConsignment);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <ThermometerSnowflake className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              GDP Cold Chain Predictive Risk &amp; Kinetic Degradation Engine
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
              ARRHENIUS KINETICS ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time Haynes MKT integration, activation energy barrier kinetics ($E_a$), and reefer thermal insulation decay.
          </p>
        </div>

        {/* Consignment Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-semibold">Active Cargo:</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
          >
            {consignments.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.productName.split(' ')[0]} ({c.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* MKT */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Haynes MKT (24h)</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {assessment.calculatedMktCelsius > 0 ? `+${assessment.calculatedMktCelsius}` : assessment.calculatedMktCelsius}°C
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mt-1">
            <CheckCircle className="w-3 h-3" />
            <span>Target: {activeConsignment.minTempCelsius}°C to {activeConsignment.maxTempCelsius}°C</span>
          </div>
        </div>

        {/* Arrhenius Degradation Factor */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Arrhenius Rate Factor (k/k₀)</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {assessment.currentDegradationRateFactor}x
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Activation Energy: {activeConsignment.activationEnergyKjPerMol} kJ/mol
          </div>
        </div>

        {/* Thermal Ingress */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Thermal Ingress (Q)</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-orange-400">
            {assessment.thermalIngressWatts} W
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Reefer insulation U = 0.35 W/m²K
          </div>
        </div>

        {/* Failure Risk Score */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Failure Risk Score</span>
            <AlertOctagon className={`w-4 h-4 ${assessment.reeferFailureRiskScore > 50 ? 'text-red-400' : 'text-emerald-400'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${assessment.reeferFailureRiskScore > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
            {assessment.reeferFailureRiskScore}/100
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Urgency: {assessment.urgency}
          </div>
        </div>
      </div>

      {/* Advisory Action Callout */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-xs ${
          assessment.urgency === 'CRITICAL'
            ? 'bg-red-950/60 border-red-800 text-red-200'
            : assessment.urgency === 'ELEVATED'
            ? 'bg-amber-950/60 border-amber-800 text-amber-200'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-800 text-white shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold uppercase tracking-wider text-[11px]">Autonomous Control Recommendation</div>
            <p className="mt-0.5">{assessment.recommendedAction}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase text-slate-400 font-bold">Estimated Time to Excursion</div>
          <div className="font-mono text-sm font-bold">{assessment.timeRemainingUntilQualityFailHours} hrs</div>
        </div>
      </div>

      {/* Telematics Readings Stream Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Reefer Unit {activeConsignment.reeferUnitId} Telemetry Log
          </h2>
          <span className="text-[10px] font-mono text-cyan-400">
            Consignment: {activeConsignment.productName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Reading Timestamp</th>
                <th className="p-3">Core Temp (°C)</th>
                <th className="p-3">Ambient Temp (°C)</th>
                <th className="p-3">Compressor Power (kW)</th>
                <th className="p-3">Relative Humidity (%)</th>
                <th className="p-3">Door Seal State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {activeConsignment.telemetryReadings.map((r, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono text-[11px] text-slate-400">
                    {new Date(r.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3 font-mono font-bold text-cyan-400">
                    +{r.temperatureCelsius}°C
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    +{r.ambientTempCelsius}°C
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    {r.compressorPowerKw} kW
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    {r.humidityPercent}%
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.doorOpenState
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {r.doorOpenState ? 'DOOR OPEN (SEAL BROKEN)' : 'CLOSED & SEALED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
