/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Cross-Docking & Automated Wave Picking View
 */

import React, { useState } from 'react';
import {
  Boxes,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Barcode,
  Footprints,
  ShieldCheck,
  Send,
} from 'lucide-react';
import {
  WavePickingService,
  PickingWave,
  CrossDockFlowMatch,
} from '../../backend/services/wavePickingService.ts';

export const WavePickingView: React.FC = () => {
  const [waves, setWaves] = useState<PickingWave[]>(() =>
    WavePickingService.getWaves()
  );
  const [crossDocks] = useState<CrossDockFlowMatch[]>(() =>
    WavePickingService.getCrossDockMatches()
  );
  const [selectedWaveId, setSelectedWaveId] = useState<string>(waves[0]?.waveId || '');

  const selectedWave = waves.find((w) => w.waveId === selectedWaveId) || waves[0];

  const handleScanItem = (waveId: string, sku: string) => {
    WavePickingService.markItemPicked(waveId, sku);
    setWaves([...WavePickingService.getWaves()]);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Boxes className="h-6 w-6 text-cyan-400" />
            Cross-Dock Flow-Through &amp; Serpentine Wave Picking Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated wave clustering, Traveling Salesperson (TSP) serpentine pick routing, and direct dock-to-dock flow matching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5">
            <Footprints className="h-4 w-4 text-emerald-400" />
            -34.4% Picker Walking Distance
          </span>
        </div>
      </div>

      {/* Cross-Dock Flow-Through Matches Ribbon */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>Active Direct Cross-Dock Matches (Bypass Putaway &amp; Storage)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {crossDocks.map((xmatch) => (
            <div
              key={xmatch.matchId}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2.5 font-mono text-xs shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300">{xmatch.matchId}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                  Direct Flow-Through
                </span>
              </div>

              <div className="font-sans font-bold text-white text-sm">{xmatch.productName}</div>

              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 uppercase">Inbound Door</div>
                  <div className="font-bold text-cyan-400 text-sm mt-0.5">Door #{xmatch.inboundDoorNumber}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500" />
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 uppercase">Outbound Door</div>
                  <div className="font-bold text-emerald-400 text-sm mt-0.5">Door #{xmatch.outboundDoorNumber}</div>
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 pt-1 font-sans">
                <span>Transfer Volume: <strong>{xmatch.palletQuantity} Pallets</strong> (~{xmatch.flowThroughTimeMinutes}m turnaround)</span>
                <span className="text-emerald-400 font-bold font-mono">+${xmatch.laborSavingsUsd} Labor Saved</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave Picking Workbench */}
      {selectedWave && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  Active Pick Wave: {selectedWave.waveId} ({selectedWave.waveType})
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold font-mono">
                  {selectedWave.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Picker: {selectedWave.assignedPickerName} • Warehouse: {selectedWave.warehouseId}
              </p>
            </div>

            <div className="text-right font-mono text-xs">
              <div className="text-emerald-400 font-bold">
                {selectedWave.optimizedWalkDistanceMeters}m Walk Path
              </div>
              <div className="text-[10px] text-slate-400">
                Baseline: {selectedWave.baselineWalkDistanceMeters}m (-{selectedWave.walkDistanceSavedPercentage}%)
              </div>
            </div>
          </div>

          {/* S-Shape Serpentine Pick Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Sequence</th>
                  <th className="p-3">Bin Location</th>
                  <th className="p-3">SKU &amp; Product</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Barcode Scan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {selectedWave.items.map((item) => (
                  <tr key={item.sku} className="hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-cyan-400">#{item.pickSequenceIndex}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-bold">
                        {item.aisle}-{item.rack}-{item.shelf}-{item.bin}
                      </span>
                    </td>
                    <td className="p-3 font-sans">
                      <div className="font-bold text-slate-100">{item.productName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                    </td>
                    <td className="p-3 text-slate-200 font-bold">{item.quantityOrdered} units</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'VERIFIED_SCANNED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : item.status === 'PICKED'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {item.status === 'VERIFIED_SCANNED' ? (
                        <span className="text-emerald-400 flex items-center justify-end gap-1 font-sans text-xs font-bold">
                          <CheckCircle2 className="h-4 w-4" /> Scanned
                        </span>
                      ) : (
                        <button
                          onClick={() => handleScanItem(selectedWave.waveId, item.sku)}
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold font-sans transition-colors inline-flex items-center gap-1"
                        >
                          <Barcode className="h-3.5 w-3.5" />
                          <span>Verify Scan</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
