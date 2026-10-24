/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - GLEC ISO 14083 Multi-Modal Carbon Accounting View
 * Computes Well-to-Wheel (WTW) GHG emissions across road, rail, maritime, and air legs with EU ETS pricing.
 */

import React, { useState } from 'react';
import {
  Leaf,
  Truck,
  Ship,
  Train,
  Plane,
  TrendingDown,
  DollarSign,
  BarChart3,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import {
  MultiModalCarbonAccountingEngine,
  FreightLegCarbonCalculation,
  TransportFuelType,
} from '../../backend/services/multiModalCarbonAccountingEngine.ts';

export function MultiModalCarbonView() {
  const [legs, setLegs] = useState<FreightLegCarbonCalculation[]>(
    MultiModalCarbonAccountingEngine.getSampleNetworkCalculation()
  );

  const totalWtwKg = legs.reduce((sum, l) => sum + l.wtwEmissionsKgCo2e, 0);
  const totalAvoidedKg = legs.reduce((sum, l) => sum + l.avoidedEmissionsKgCo2e, 0);
  const totalTonneKm = legs.reduce((sum, l) => sum + l.tonneKilometers, 0);
  const totalOffsetEur = legs.reduce((sum, l) => sum + l.euEtsCarbonOffsetCostEur, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Leaf className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              GLEC Framework v3.0 &amp; ISO 14083 Multi-Modal Carbon Accounting
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              WTW / WTT / TTW ACCREDITED
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Scope 1, 2, and 3 GHG accounting across intermodal freight corridors with live EU ETS allowance liabilities.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Well-to-Wheel (WTW) CO₂e</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {(totalWtwKg / 1000).toFixed(1)} <span className="text-xs text-slate-400">tonnes</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            WTT upstream + TTW operational
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Avoided Emissions vs Baseline</span>
            <TrendingDown className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {(totalAvoidedKg / 1000).toFixed(1)} <span className="text-xs text-slate-400">tonnes</span>
          </div>
          <div className="text-[10px] text-cyan-400/80 mt-1">
            Via HVO100, Rail &amp; E-Methanol
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Tonne-Kilometers</span>
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {(totalTonneKm / 1000000).toFixed(2)}M
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Across 4 intermodal legs
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>EU ETS Carbon Liability</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            €{totalOffsetEur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Based on €84.50/tonne allowance
          </div>
        </div>
      </div>

      {/* Corridor Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Intermodal Corridors GLEC Emissions Ledger
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Leg ID &amp; Mode</th>
                <th className="p-3">Routing Origin / Destination</th>
                <th className="p-3">Distance &amp; Cargo</th>
                <th className="p-3">Fuel / Energy Carrier</th>
                <th className="p-3">WTW Total (kg CO₂e)</th>
                <th className="p-3">Intensity (g/t·km)</th>
                <th className="p-3">EU ETS Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {legs.map((leg) => {
                return (
                  <tr key={leg.legId} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-slate-800 text-slate-300">
                          {leg.mode === 'ROAD' && <Truck className="w-3.5 h-3.5" />}
                          {leg.mode === 'RAIL' && <Train className="w-3.5 h-3.5" />}
                          {leg.mode === 'OCEAN' && <Ship className="w-3.5 h-3.5" />}
                          {leg.mode === 'AIR' && <Plane className="w-3.5 h-3.5" />}
                        </span>
                        <div>
                          <div className="font-mono font-bold text-white text-[11px]">{leg.legId}</div>
                          <div className="text-[9px] text-blue-400 uppercase font-mono">{leg.mode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{leg.origin}</div>
                      <div className="text-[10px] text-slate-500">→ {leg.destination}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-mono text-slate-300">{leg.distanceKm.toLocaleString()} km</div>
                      <div className="text-[10px] text-slate-500">{leg.cargoMassTonnes} tonnes payload</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-emerald-300 border border-slate-700">
                        {leg.fuelType}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-white">
                        {leg.wtwEmissionsKgCo2e.toLocaleString()} kg
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        -{leg.avoidedEmissionsKgCo2e.toLocaleString()} kg avoided
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap font-mono font-bold text-cyan-400">
                      {leg.emissionIntensityGramsPerTonneKm} g
                    </td>
                    <td className="p-3 whitespace-nowrap font-mono font-bold text-amber-400">
                      €{leg.euEtsCarbonOffsetCostEur.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
