/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Multi-Carrier Procurement & Freight Tender Matrix View
 */

import React, { useState } from 'react';
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Ship,
  Plane,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Leaf,
  Layers,
  Award,
} from 'lucide-react';
import {
  FreightProcurementService,
  FreightTenderRequest,
  MarketIndexBenchmark,
  CarrierBid,
} from '../../backend/services/freightProcurementService.ts';

export const FreightProcurementView: React.FC = () => {
  const [benchmarks] = useState<MarketIndexBenchmark[]>(() =>
    FreightProcurementService.getMarketBenchmarks()
  );
  const [tenders, setTenders] = useState<FreightTenderRequest[]>(() =>
    FreightProcurementService.getTenders()
  );
  const [selectedTenderId, setSelectedTenderId] = useState<string>(tenders[0]?.tenderId || '');
  const [awardNotification, setAwardNotification] = useState<string | null>(null);

  const selectedTender = tenders.find((t) => t.tenderId === selectedTenderId) || tenders[0];

  const handleAwardBid = (tenderId: string, carrierId: string, carrierName: string) => {
    const updated = FreightProcurementService.awardTender(tenderId, carrierId);
    if (updated) {
      setTenders([...FreightProcurementService.getTenders()]);
      setAwardNotification(`Tender ${tenderId} officially awarded to ${carrierName}! Contracts & EDI 204 transmitted.`);
      setTimeout(() => setAwardNotification(null), 5000);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-cyan-400" />
            Multi-Carrier Freight Procurement &amp; Dynamic Tender Matrix
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global market rate benchmarking (SCFI, Drewry WCI, DAT) and automated multi-criteria tender allocation.
          </p>
        </div>

        {awardNotification && (
          <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{awardNotification}</span>
          </div>
        )}
      </div>

      {/* Market Rate Benchmark Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {benchmarks.map((bm, idx) => (
          <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1.5 shadow-lg">
            <div className="text-[10px] uppercase font-bold text-slate-400 truncate">{bm.indexName}</div>
            <div className="text-2xl font-mono font-black text-white">
              ${bm.currentRateUsd.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400 truncate">{bm.lane.split('to')[0]}</span>
              <span
                className={`font-bold flex items-center gap-0.5 ${
                  bm.weekOverWeekChangePercent >= 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {bm.weekOverWeekChangePercent >= 0 ? '+' : ''}
                {bm.weekOverWeekChangePercent}% WoW
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Procurement Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Tenders (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Open Tender Requests</span>
            <span className="font-mono text-cyan-400">{tenders.length} Active</span>
          </div>

          <div className="space-y-2.5">
            {tenders.map((t) => {
              const isSelected = t.tenderId === selectedTenderId;
              return (
                <div
                  key={t.tenderId}
                  onClick={() => setSelectedTenderId(t.tenderId)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/50 border-cyan-500 shadow-lg text-white'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span className="text-cyan-300">{t.tenderId}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        t.status === 'AWARDED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="font-semibold text-slate-200 mt-1">{t.originPort} → {t.destinationPort}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{t.commodityType}</div>

                  <div className="flex justify-between text-[11px] font-mono mt-2 pt-2 border-t border-slate-800/80">
                    <span>Vol: {t.containerVolumeTeu} TEU</span>
                    <span className="text-emerald-400">Budget: ${(t.targetBudgetUsd / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Carrier Bids Evaluation Matrix (8 cols) */}
        {selectedTender && (
          <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">
                  Carrier Tender Bid Matrix: {selectedTender.tenderId}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Algorithm Score Weight: 40% Cost • 35% Transit Reliability • 15% Carbon • 10% Chassis
                </p>
              </div>

              {selectedTender.status === 'AWARDED' && (
                <span className="px-3 py-1 bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5 font-mono">
                  <Award className="h-4 w-4 text-emerald-400" />
                  Carrier Contract Awarded
                </span>
              )}
            </div>

            {/* Bids Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Carrier &amp; Tier</th>
                    <th className="p-3">Landed Cost</th>
                    <th className="p-3">Transit Time</th>
                    <th className="p-3">Reliability</th>
                    <th className="p-3">CO2 / TEU</th>
                    <th className="p-3">Score</th>
                    <th className="p-3 text-right">Award</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {selectedTender.bids.map((bid) => {
                    const isAwarded = selectedTender.awardedCarrierId === bid.carrierId;
                    return (
                      <tr
                        key={bid.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          bid.isRecommended ? 'bg-cyan-950/20' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className="font-sans font-bold text-slate-100 flex items-center gap-1.5">
                            <span>{bid.carrierName}</span>
                            {bid.isRecommended && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold uppercase">
                                Recommended
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {bid.carrierTier} • {bid.freeTimeDaysDemurrage}d Free Demurrage
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-white text-sm">
                            ${bid.totalLandedCostUsd.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Base: ${bid.baseFreightRateUsd.toLocaleString()}
                          </div>
                        </td>

                        <td className="p-3 text-slate-200">
                          <strong>{bid.transitTimeDays}</strong> Days
                        </td>

                        <td className="p-3">
                          <span
                            className={`font-bold ${
                              bid.onTimePerformancePercent >= 95
                                ? 'text-emerald-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {bid.onTimePerformancePercent}%
                          </span>
                        </td>

                        <td className="p-3 text-slate-400">
                          {bid.co2EmissionsKgPerTeu} kg
                        </td>

                        <td className="p-3">
                          <span className="text-cyan-400 font-black text-sm">
                            {bid.compositeScore}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          {isAwarded ? (
                            <span className="px-3 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold font-sans">
                              Awarded
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAwardBid(selectedTender.tenderId, bid.carrierId, bid.carrierName)}
                              disabled={selectedTender.status === 'AWARDED'}
                              className="px-3 py-1 bg-slate-800 hover:bg-cyan-600 disabled:opacity-40 text-slate-200 hover:text-white rounded text-[11px] font-bold font-sans transition-colors"
                            >
                              Award Bid
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
