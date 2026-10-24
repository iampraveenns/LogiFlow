/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Scope 1/2/3 Carbon Accounting & Decarbonization View
 */

import React, { useState } from 'react';
import {
  Leaf,
  Layers,
  TrendingDown,
  Zap,
  Globe2,
  CheckCircle2,
  Calculator,
  ShieldCheck,
  FileCheck2,
  TreePine,
  Factory,
} from 'lucide-react';
import {
  EsgDecarbonizationService,
  EmissionsBreakdown,
  TradeLaneEmissionProfile,
  CarbonOffsetCredit,
  DecarbonizationTarget,
} from '../../backend/services/esgDecarbonizationService.ts';

export const EsgDecarbonizationView: React.FC = () => {
  const [emissions] = useState<EmissionsBreakdown>(() =>
    EsgDecarbonizationService.getEmissionsBreakdown()
  );
  const [tradeLanes] = useState<TradeLaneEmissionProfile[]>(() =>
    EsgDecarbonizationService.getTradeLaneProfiles()
  );
  const [offsets] = useState<CarbonOffsetCredit[]>(() =>
    EsgDecarbonizationService.getCarbonOffsets()
  );
  const [targets] = useState<DecarbonizationTarget>(() =>
    EsgDecarbonizationService.getDecarbonizationTargets()
  );

  // Alternative fuel simulator state
  const [fuelChoice, setFuelChoice] = useState<'HVO100_RENEWABLE_DIESEL' | 'BIO_LNG' | 'SAF_50_BLEND' | 'BATTERY_ELECTRIC'>('HVO100_RENEWABLE_DIESEL');
  const [dieselLiters, setDieselLiters] = useState(50000);

  const simulationResult = EsgDecarbonizationService.simulateFuelAbatement({
    conventionalDieselLiters: dieselLiters,
    fuelChoice,
  });

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Leaf className="h-6 w-6 text-emerald-400" />
            Scope 1/2/3 Carbon Accounting &amp; ESG Decarbonization Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            GLEC Framework &amp; ISO 14083 certified carbon accounting, science-based 1.5°C trajectory, and alternative fuel abatement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            GLEC &amp; CSRD Certified
          </span>
        </div>
      </div>

      {/* Scope 1, 2, 3 Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <Factory className="h-3 w-3 text-cyan-400" /> Scope 1 (Direct Fleet)
          </div>
          <div className="text-2xl font-mono font-black text-white mt-1">
            {emissions.scope1DirectTonsCo2e.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">t CO2e</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Owned road diesel &amp; jet combustion</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <Zap className="h-3 w-3 text-emerald-400" /> Scope 2 (Purchased Power)
          </div>
          <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
            {emissions.scope2IndirectTonsCo2e.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">t CO2e</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Warehouse grids &amp; EV charger load</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <Globe2 className="h-3 w-3 text-purple-400" /> Scope 3 (Supply Chain)
          </div>
          <div className="text-2xl font-mono font-black text-purple-300 mt-1">
            {emissions.scope3SupplyChainTonsCo2e.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">t CO2e</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Subcontracted ocean/air partners</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-emerald-400" /> Carbon Intensity
          </div>
          <div className="text-2xl font-mono font-black text-cyan-300 mt-1">
            {emissions.intensityGramsCo2ePerTonKm}{' '}
            <span className="text-xs font-normal text-slate-400">g/ton-km</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-0.5">-32.4% vs 2022 baseline</div>
        </div>
      </div>

      {/* Alternative Fuel Abatement Simulator & Science Based Targets Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Fuel Simulator (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Calculator className="h-4 w-4 text-emerald-400" />
              Alternative Fuels Abatement Simulator
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono">WTW Physics</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-slate-300 font-sans font-semibold block mb-1">
                Displaced Conventional Diesel (Liters):
              </label>
              <input
                type="number"
                value={dieselLiters}
                onChange={(e) => setDieselLiters(Math.max(1000, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
              />
            </div>

            <div>
              <label className="text-slate-300 font-sans font-semibold block mb-1">
                Select Abatement Technology:
              </label>
              <select
                value={fuelChoice}
                onChange={(e) => setFuelChoice(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                <option value="HVO100_RENEWABLE_DIESEL">HVO100 Hydrotreated Vegetable Oil (-88% CO2e)</option>
                <option value="BATTERY_ELECTRIC">Heavy Commercial Battery Electric (-91% CO2e)</option>
                <option value="BIO_LNG">Bio-LNG Cryogenic Methane Dual-Fuel (-82% CO2e)</option>
                <option value="SAF_50_BLEND">Neste MY SAF 50% Aviation Blend (-60% CO2e)</option>
              </select>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 mt-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Baseline Diesel CO2:</span>
                <span className="text-slate-200">{simulationResult.conventionalEmissionsKgCo2e.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Abated Net CO2:</span>
                <span className="font-bold text-emerald-400">{simulationResult.abatedEmissionsKgCo2e.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-sans font-bold">
                <span className="text-white">Net CO2 Avoided:</span>
                <span className="text-emerald-400 font-mono">
                  {simulationResult.co2eAvoidedKg.toLocaleString()} kg (-{simulationResult.reductionPercentage}%)
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Cost Delta:</span>
                <span className={simulationResult.fuelCostDeltaUsd <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                  {simulationResult.fuelCostDeltaUsd <= 0 ? '-' : '+'}${Math.abs(simulationResult.fuelCostDeltaUsd).toLocaleString()} USD
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2030 Science-Based Target Trajectory (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-emerald-400" />
                Science-Based Targets initiative (SBTi 1.5°C Trajectory)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Commitment: -55% Absolute Reduction by 2030 (Baseline 2022)
              </p>
            </div>
            <span className="text-emerald-400 font-mono font-bold text-sm">32.4% Achieved</span>
          </div>

          <div className="space-y-3 pt-2">
            {targets.projectedTrajectory.slice(0, 6).map((item) => {
              const reduction = Math.round(((24500 - (item.actualEmissionsTonnes || item.committedDecarbonizationTonnes)) / 24500) * 100);
              return (
                <div key={item.year} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 font-bold">Year {item.year}</span>
                    <span className="text-slate-400">
                      Target: {item.committedDecarbonizationTonnes.toLocaleString()}t •{' '}
                      {item.actualEmissionsTonnes ? (
                        <strong className="text-emerald-400">Actual: {item.actualEmissionsTonnes.toLocaleString()}t (-{reduction}%)</strong>
                      ) : (
                        <span className="text-cyan-400">Projected: -{reduction}%</span>
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full"
                      style={{ width: `${Math.max(10, 100 - reduction)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Verified Carbon Offsets Registry Ledger */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TreePine className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Verified Voluntary Carbon Offsets &amp; Sequestration Portfolio</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Verra VCS &amp; Gold Standard Registry</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {offsets.map((off) => (
            <div key={off.projectId} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-bold">{off.projectId}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-emerald-400 font-bold">
                  {off.registry}
                </span>
              </div>
              <div className="font-sans font-bold text-slate-200 text-sm">{off.projectName}</div>
              <div className="text-[11px] text-slate-400 font-sans">
                {off.location} • Vintage {off.vintageYear} • {off.methodology}
              </div>
              <div className="flex justify-between border-t border-slate-800/80 pt-2 text-[11px]">
                <span>Credits: {off.creditsPurchasedTonnes.toLocaleString()} t</span>
                <span className="text-emerald-400 font-bold">${off.costPerTonneUsd}/t</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
