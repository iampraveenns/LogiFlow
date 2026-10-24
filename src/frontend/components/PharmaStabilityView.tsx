/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Pharma GDP & Vaccine Stability Telemetry Hub
 * Interactive inspector for Haynes Mean Kinetic Temperature (MKT), Arrhenius activation kinetics,
 * WHO TRS 961 stability budgets, and FDA 21 CFR Part 11 release certification.
 */

import React, { useState, useMemo } from 'react';
import {
  PharmaStabilityEngine,
  PharmaShipmentBatch,
  PharmaCategory,
} from '../../backend/services/pharmaStabilityEngine.ts';
import {
  Thermometer,
  ShieldCheck,
  AlertOctagon,
  Clock,
  Sparkles,
  Info,
  Beaker,
  TrendingUp,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';

export const PharmaStabilityView: React.FC = () => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('BATCH-MRNA-9021');
  const [testTemp, setTestTemp] = useState<number>(6.5);
  const [testHours, setTestHours] = useState<number>(4);

  const batches = useMemo(() => PharmaStabilityEngine.getBatches(), []);

  const activeBatch = useMemo<PharmaShipmentBatch>(() => {
    return batches.find((b) => b.batchId === selectedBatchId) || batches[0];
  }, [batches, selectedBatchId]);

  const stabilityReport = useMemo(() => {
    if (!activeBatch) return null;
    return PharmaStabilityEngine.evaluateBatchStability(activeBatch);
  }, [activeBatch]);

  // Interactive Haynes MKT calculator comparison
  const simulatedMkt = useMemo(() => {
    if (!activeBatch) return null;
    const existingTemps = activeBatch.readings.map((r) => r.temperatureCelsius);
    const addedTemps = Array(testHours).fill(testTemp);
    const combined = [...existingTemps, ...addedTemps];
    return PharmaStabilityEngine.calculateMeanKineticTemperature(combined);
  }, [activeBatch, testTemp, testHours]);

  const getCategoryBadge = (cat: PharmaCategory) => {
    switch (cat) {
      case 'ULTRA_COLD_MRNA':
        return 'bg-purple-500/20 text-purple-300 border-purple-700/60';
      case 'CRYOGENIC_CELL_GENE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-700/60';
      case 'COLD_CHAIN_BIOLOGIC':
        return 'bg-blue-500/20 text-blue-300 border-blue-700/60';
      case 'CONTROLLED_ROOM_TEMP':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-700/60';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-700/60';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950/70 via-slate-900 to-blue-950/50 border border-teal-800/40 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Thermometer className="h-6 w-6 text-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Pharma GDP &amp; Vaccine Stability Telemetry Engine
              </h1>
              <span className="bg-teal-500/20 text-teal-300 text-xs px-2.5 py-0.5 rounded-full border border-teal-500/30 font-medium">
                WHO TRS 961 Annex 9 / USP &lt;1079&gt; / FDA 21 CFR Part 11
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Haynes Arrhenius Mean Kinetic Temperature (MKT) continuous integration, thermal stability budgets, and freeze denaturation detection.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2 rounded-xl text-right">
              <div className="text-xs text-slate-400 uppercase font-semibold">Standard ΔH*</div>
              <div className="text-lg font-bold text-teal-300 font-mono">
                83.144 kJ/mol
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {batches.map((batch) => {
          const isSelected = batch.batchId === activeBatch.batchId;
          const report = PharmaStabilityEngine.evaluateBatchStability(batch);
          return (
            <button
              key={batch.batchId}
              onClick={() => setSelectedBatchId(batch.batchId)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-teal-950/40 border-teal-500 shadow-lg ring-1 ring-teal-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold text-white">
                  {batch.batchId}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    report.gdpComplianceStatus === 'GDP_CERTIFIED_RELEASE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-700'
                      : 'bg-amber-500/20 text-amber-300 border-amber-700'
                  }`}
                >
                  {report.gdpComplianceStatus === 'GDP_CERTIFIED_RELEASE' ? 'GDP RELEASE' : 'HOLD / REVIEW'}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                {batch.productName}
              </div>
              <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                <span>{batch.manufacturer.split(' ')[0]}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getCategoryBadge(batch.category)}`}>
                  {batch.category.replace(/_/g, ' ')}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Stability Dossier & Continuous Telemetry */}
      {stabilityReport && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Arrhenius MKT Analytics & Compliance (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Beaker className="h-5 w-5 text-teal-400" />
                  <h3 className="text-base font-bold text-white">
                    Arrhenius Mean Kinetic Temperature (MKT) Verification
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {stabilityReport.totalDurationHours} hrs recorded
                </span>
              </div>

              {/* Arrhenius MKT vs Arithmetic Mean Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-center">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                    Haynes MKT Formula
                  </div>
                  <div className="text-2xl font-black text-teal-300 font-mono mt-1">
                    {stabilityReport.meanKineticTemperatureCelsius}°C
                  </div>
                  <div className="text-[10px] text-slate-400">Thermodynamic equivalent</div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-center">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                    Arithmetic Mean
                  </div>
                  <div className="text-2xl font-black text-blue-300 font-mono mt-1">
                    {stabilityReport.arithmeticAverageCelsius}°C
                  </div>
                  <div className="text-[10px] text-slate-400">Simple mathematical avg</div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-center">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                    Min / Max Spread
                  </div>
                  <div className="text-lg font-black text-amber-300 font-mono mt-1.5">
                    {stabilityReport.minRecordedCelsius}°C / {stabilityReport.maxRecordedCelsius}°C
                  </div>
                  <div className="text-[10px] text-slate-400">Dynamic excursion range</div>
                </div>
              </div>

              {/* WHO TRS 961 Stability Budget Depletion Gauge */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">
                    Cumulative Thermal Excursion Degree-Hours
                  </span>
                  <span className="font-mono font-bold text-teal-400">
                    {stabilityReport.cumulativeExcursionDegreeHours} °C·hr ({stabilityReport.stabilityBudgetConsumedPercent}% budget)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      stabilityReport.stabilityBudgetConsumedPercent > 80
                        ? 'bg-red-500'
                        : stabilityReport.stabilityBudgetConsumedPercent > 40
                        ? 'bg-amber-500'
                        : 'bg-teal-500'
                    }`}
                    style={{ width: `${stabilityReport.stabilityBudgetConsumedPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>0% (Pristine Cold Chain)</span>
                  <span>100% (Maximum Allowable Excursion Budget)</span>
                </div>
              </div>

              {/* Regulatory Determination Box */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  stabilityReport.gdpComplianceStatus === 'GDP_CERTIFIED_RELEASE'
                    ? 'bg-emerald-950/30 border-emerald-700/60 text-emerald-200'
                    : 'bg-amber-950/30 border-amber-700/60 text-amber-200'
                }`}
              >
                {stabilityReport.gdpComplianceStatus === 'GDP_CERTIFIED_RELEASE' ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertOctagon className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
                )}

                <div className="space-y-1">
                  <div className="font-bold text-xs uppercase tracking-wide">
                    {stabilityReport.gdpComplianceStatus.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs opacity-90 leading-relaxed">
                    {stabilityReport.regulatorySummary}
                  </div>
                  <div className="text-[11px] opacity-75 font-mono pt-1">
                    Adjusted Remaining Shelf Life: <strong>{stabilityReport.adjustedShelfLifeMonths} Months</strong> (Nominal: {activeBatch.declaredShelfLifeMonths} Mos)
                  </div>
                </div>
              </div>
            </div>

            {/* What-If Excursion Stress Simulator */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-teal-400" />
                  What-If Thermal Excursion Impact Simulator
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Simulated Temperature Breach: {testTemp}°C
                  </label>
                  <input
                    type="range"
                    min="-80"
                    max="35"
                    step="0.5"
                    value={testTemp}
                    onChange={(e) => setTestTemp(parseFloat(e.target.value))}
                    className="w-full accent-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Breach Duration: {testHours} Hours
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="24"
                    step="1"
                    value={testHours}
                    onChange={(e) => setTestHours(parseInt(e.target.value))}
                    className="w-full accent-teal-500"
                  />
                </div>
              </div>

              {simulatedMkt && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="text-xs text-slate-300">
                    <div>Projected Post-Excursion MKT:</div>
                    <div className="text-[11px] text-slate-400">
                      Adding {testHours}h at {testTemp}°C to historical dataset
                    </div>
                  </div>
                  <div className="text-xl font-bold font-mono text-teal-300">
                    {simulatedMkt.mktCelsius}°C
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sensor Telemetry Log & Metadata (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  IoT Multi-Sensor Reading Log
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {activeBatch.sensorSerialNumber}
                </span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {activeBatch.readings.slice(-15).reverse().map((r, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono text-slate-300 text-[11px]">
                        {new Date(r.timestampIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>RH: {r.relativeHumidityPercent}%</span>
                        <span>•</span>
                        <span>Light: {r.ambientLightLux} lux</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-teal-300">
                        {r.temperatureCelsius}°C
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Shock: {r.shockG}G
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
