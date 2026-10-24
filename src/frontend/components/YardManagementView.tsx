/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Intermodal Rail & Yard Management System (YMS) View
 */

import React, { useState } from 'react';
import {
  Grid,
  Clock,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Send,
  Zap,
  ShieldCheck,
  ArrowRight,
  Layers,
  Scale,
  Camera,
} from 'lucide-react';
import {
  YardManagementService,
  YardDockDoor,
  YardTrailerSlot,
  HostlerMoveTask,
  GateOcrTransaction,
} from '../../backend/services/yardManagementService.ts';

export const YardManagementView: React.FC = () => {
  const [dockDoors, setDockDoors] = useState<YardDockDoor[]>(() =>
    YardManagementService.getDockDoors()
  );
  const [yardSlots] = useState<YardTrailerSlot[]>(() =>
    YardManagementService.getYardSlots()
  );
  const [hostlerTasks, setHostlerTasks] = useState<HostlerMoveTask[]>(() =>
    YardManagementService.getHostlerTasks()
  );
  const [ocrLogs] = useState<GateOcrTransaction[]>(() =>
    YardManagementService.getGateOcrTransactions()
  );

  // Spotting task state
  const [spotTrailer, setSpotTrailer] = useState('TRL-9901');
  const [targetDoor, setTargetDoor] = useState(4);
  const [spotNotification, setSpotNotification] = useState<string | null>(null);

  const handleToggleDoor = (doorNum: number) => {
    YardManagementService.toggleDockDoorStatus(doorNum);
    setDockDoors([...YardManagementService.getDockDoors()]);
  };

  const handleDispatchHostler = (e: React.FormEvent) => {
    e.preventDefault();
    const task = YardManagementService.createHostlerMoveTask({
      trailerNumber: spotTrailer,
      fromLocation: 'INBOUND_STAGING (Lane B)',
      toLocation: `Dock Door #${targetDoor}`,
      priority: 'SCHEDULED_DOCK',
    });
    setHostlerTasks([...YardManagementService.getHostlerTasks()]);
    setSpotNotification(`Hostler move task ${task.taskId} dispatched for ${spotTrailer} → Door #${targetDoor}`);
    setTimeout(() => setSpotNotification(null), 5000);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Grid className="h-6 w-6 text-cyan-400" />
            Intermodal Rail &amp; Yard Management System (YMS)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            2D dock door visualizer, hostler yard-dog spotter dispatch, detention penalty countdown clocks, and optical gate OCR.
          </p>
        </div>

        {spotNotification && (
          <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{spotNotification}</span>
          </div>
        )}
      </div>

      {/* Dock Doors Matrix (Doors 1 through 12) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-white">Cross-Dock Terminal Doors (Berths 1 - 12)</h3>
            <p className="text-xs text-slate-400">Click any door to toggle loading/unloading status</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Available
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-500"></span> Loading
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Detention Risk
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {dockDoors.map((door) => {
            const hasFee = door.detentionFeeRiskUsd > 0;
            const isNearDetention = door.freeTimeRemainingMinutes < 30 && door.status !== 'AVAILABLE';

            return (
              <div
                key={door.doorNumber}
                onClick={() => handleToggleDoor(door.doorNumber)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                  hasFee
                    ? 'bg-red-950/40 border-red-700 shadow-md shadow-red-950/30'
                    : isNearDetention
                    ? 'bg-amber-950/40 border-amber-600'
                    : door.status === 'AVAILABLE'
                    ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    : 'bg-cyan-950/30 border-cyan-700'
                }`}
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-sm text-white">Door #{door.doorNumber}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      door.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-cyan-500 animate-pulse'
                    }`}
                  ></span>
                </div>

                <div className="my-2 space-y-0.5">
                  <div className="text-[11px] font-mono text-slate-300">
                    {door.assignedTrailerId || 'Empty Berth'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">
                    {door.status.replace(/_/g, ' ')}
                  </div>
                </div>

                {door.status !== 'AVAILABLE' && (
                  <div className="border-t border-slate-800/80 pt-1.5 font-mono text-[10px] space-y-0.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Dwell:</span>
                      <span className="font-bold text-slate-200">{door.dwellDurationMinutes}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Free:</span>
                      <span className={door.freeTimeRemainingMinutes === 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                        {door.freeTimeRemainingMinutes}m
                      </span>
                    </div>
                    {hasFee && (
                      <div className="text-red-400 font-bold pt-0.5">
                        Fee: +${door.detentionFeeRiskUsd} USD
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hostler Dispatch Workbench & Yard Staging */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hostler Spotting Tasks (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Truck className="h-4 w-4 text-cyan-400" />
              Autonomous Yard Tug &amp; Hostler Spotting Queue
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {hostlerTasks.length} Active Tasks
            </span>
          </div>

          {/* Form to dispatch move */}
          <form onSubmit={handleDispatchHostler} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex-1 min-w-[140px]">
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Select Trailer</label>
              <select
                value={spotTrailer}
                onChange={(e) => setSpotTrailer(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 font-mono"
              >
                {yardSlots.map((s) => (
                  <option key={s.slotId} value={s.trailerNumber}>
                    {s.trailerNumber} ({s.zone})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-28">
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Target Door</label>
              <select
                value={targetDoor}
                onChange={(e) => setTargetDoor(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 font-mono"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <option key={num} value={num}>
                    Door #{num}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Dispatch Move</span>
            </button>
          </form>

          {/* Tasks List */}
          <div className="space-y-2 font-mono text-xs">
            {hostlerTasks.map((t) => (
              <div key={t.taskId} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-300">{t.trailerNumber}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {t.priority}
                    </span>
                  </div>
                  <div className="text-slate-400 font-sans text-[11px] mt-0.5">
                    {t.fromLocation} → <strong className="text-slate-200">{t.toLocation}</strong>
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                    Unit: {t.driverName}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                    t.status === 'COMPLETED'
                      ? 'bg-emerald-950 text-emerald-400'
                      : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                  }`}
                >
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Optical Gate OCR & TIR Inspection (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Camera className="h-4 w-4 text-emerald-400" />
              Optical Gate OCR &amp; TIR Inspection Log
            </h3>
            <span className="text-xs font-mono text-emerald-400">Gate 1 Live</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {ocrLogs.map((ocr) => (
              <div key={ocr.transactionId} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-sans">{ocr.gateLane}</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-bold text-[10px]">
                    <ShieldCheck className="h-3.5 w-3.5" /> Cleared Gate In
                  </span>
                </div>

                <div className="space-y-1 text-slate-300 text-[11px]">
                  <div>Trailer: <strong className="text-cyan-300">{ocr.trailerNumber}</strong></div>
                  <div>ISO: {ocr.containerIsoCode}</div>
                  <div>Bolt Seal: <strong className="text-emerald-400">{ocr.sealNumber} (Intact)</strong></div>
                  <div>Scale Weight: <strong>{ocr.measuredWeightLbs.toLocaleString()} lbs</strong></div>
                </div>

                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80 font-sans">
                  Driver License: {ocr.driverLicenseNumber} • Timestamp: {new Date(ocr.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
