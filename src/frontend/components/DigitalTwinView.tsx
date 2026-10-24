/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Supply Chain Digital Twin & Monte Carlo Risk Simulator
 */

import React, { useState } from 'react';
import {
  Cpu,
  Play,
  RotateCw,
  AlertTriangle,
  TrendingDown,
  ShieldAlert,
  Clock,
  DollarSign,
  Compass,
  CheckCircle2,
  BarChart3,
  Layers,
} from 'lucide-react';
import { DISRUPTION_SCENARIOS, DigitalTwinService, DigitalTwinSimulationOutput } from '../../backend/services/digitalTwinService.ts';

export const DigitalTwinView: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(DISRUPTION_SCENARIOS[0].id);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationOutput, setSimulationOutput] = useState<DigitalTwinSimulationOutput>(() =>
    DigitalTwinService.runSimulation(DISRUPTION_SCENARIOS[0].id, 1000)
  );

  const selectedScenario = DISRUPTION_SCENARIOS.find((s) => s.id === selectedScenarioId) || DISRUPTION_SCENARIOS[0];

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const output = DigitalTwinService.runSimulation(selectedScenarioId, 1000);
      setSimulationOutput(output);
      setIsSimulating(false);
    }, 450);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          <Cpu className="h-6 w-6 text-cyan-400" />
          Supply Chain Digital Twin &amp; Monte Carlo Risk Engine
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Simulate 1,000 stochastic iterations of geopolitical maritime disruptions, labor strikes, and climate draft restrictions.
        </p>
      </div>

      {/* Scenario Selector Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {DISRUPTION_SCENARIOS.map((scen) => {
          const isSelected = scen.id === selectedScenarioId;
          return (
            <button
              key={scen.id}
              onClick={() => {
                setSelectedScenarioId(scen.id);
                setSimulationOutput(DigitalTwinService.runSimulation(scen.id, 1000));
              }}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/60 border-cyan-500 shadow-lg shadow-cyan-950/40 text-white'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-cyan-300 font-bold uppercase">
                  {scen.category}
                </span>
                <div className="font-bold text-xs mt-1.5 text-slate-100 leading-snug">
                  {scen.name}
                </div>
              </div>
              <div className="text-[10px] font-mono mt-2 pt-2 border-t border-slate-800/80 flex justify-between">
                <span>Prob: {scen.probabilityPercent}%</span>
                <span className="text-amber-400">~{scen.expectedDurationDays}d delay</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Scenario Details & Execution Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 max-w-3xl">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
            Active Digital Twin Scenario: {selectedScenario.chokepoint}
          </div>
          <p className="text-xs text-slate-300">{selectedScenario.description}</p>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3 pt-1">
            <span>Daily Demurrage: ${selectedScenario.operationalParameters.demurrageDailyRateUsd}/cont</span>
            <span>•</span>
            <span>Bunker Surcharge: +${(selectedScenario.operationalParameters.extraBunkerCostPerVesselUsd / 1000).toFixed(0)}k/vessel</span>
          </div>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-2 shrink-0 transition-all shadow-md"
        >
          <RotateCw className={`h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>Execute 1,000 Monte Carlo Iterations</span>
        </button>
      </div>

      {/* Simulation KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-cyan-400" />
            Mean Financial Loss
          </div>
          <div className="text-2xl font-mono font-black text-white mt-1">
            ${(simulationOutput.financialImpact.meanUsd / 1000000).toFixed(2)}M USD
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Median: ${(simulationOutput.financialImpact.medianUsd / 1000000).toFixed(2)}M
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <ShieldAlert className="h-3 w-3 text-red-400" />
            Value-at-Risk (VaR 95%)
          </div>
          <div className="text-2xl font-mono font-black text-red-400 mt-1">
            ${(simulationOutput.financialImpact.valueAtRisk95Usd / 1000000).toFixed(2)}M USD
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            99% Worst-Case: ${(simulationOutput.financialImpact.valueAtRisk99Usd / 1000000).toFixed(2)}M
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-400" />
            Expected Lead Time Delay
          </div>
          <div className="text-2xl font-mono font-black text-amber-400 mt-1">
            +{simulationOutput.delays.meanDelayDays} Days
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            95th Percentile: +{simulationOutput.delays.p95DelayDays} Days
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-emerald-400" />
            Buffer Stockout Risk
          </div>
          <div className="text-2xl font-mono font-black text-cyan-300 mt-1">
            {simulationOutput.inventoryResilience.stockoutProbabilityPercent}%
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Depletion Day: Day {simulationOutput.inventoryResilience.bufferDepletionDayAvg}
          </div>
        </div>
      </div>

      {/* Probability Density Distribution Chart & Mitigation Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Distribution Histogram (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              Stochastic Loss Probability Distribution (1,000 Iterations)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Monte Carlo Histogram</span>
          </div>

          <div className="space-y-3 pt-2">
            {simulationOutput.distributionBuckets.map((bucket, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">{bucket.delayDaysBucket}</span>
                  <span className="text-cyan-400 font-bold">{bucket.frequencyPercent}% Frequency</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${bucket.frequencyPercent * 2.2}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Phased Mitigation Roadmap (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Digital Twin Mitigation Roadmap
            </h3>
            <span className="text-[11px] font-mono text-emerald-400">Prescriptive Action</span>
          </div>

          <div className="space-y-3">
            {simulationOutput.mitigationRoadmap.map((item, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-cyan-300">{item.phase}</span>
                  <span className="text-emerald-400">-{item.expectedRiskReductionPercent}% Risk</span>
                </div>
                <p className="text-xs text-slate-200">{item.action}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>Est. Budget: ${(item.costUsd / 1000).toFixed(0)}k</span>
                  <span>Execution: ~{item.leadTimeHours}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
