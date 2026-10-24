/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Marine Port Terminal & Automated Crane Optimization Hub
 * Real-time monitoring of Berth Allocation (BAP), Quay Crane Scheduling (QCASP),
 * Automated Stacking Crane (ASC) Yard Blocks, and Automated Guided Vehicle (AGV) routing.
 */

import React, { useState, useMemo } from 'react';
import {
  PortTerminalService,
  BerthSlot,
  QuayCrane,
  YardBlock,
  AutomatedGuidedVehicle,
} from '../../backend/services/portTerminalService.ts';
import {
  Anchor,
  Layers,
  BatteryCharging,
  Cpu,
  Gauge,
  Sliders,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoveRight,
} from 'lucide-react';

export const PortTerminalView: React.FC = () => {
  const [selectedBerthId, setSelectedBerthId] = useState<string>('BRTH-RWG-01');
  const [testLoa, setTestLoa] = useState<number>(400);
  const [testDraft, setTestDraft] = useState<number>(16.5);
  const [selectedBlockType, setSelectedBlockType] = useState<string>('ALL');

  const berths = useMemo(() => PortTerminalService.getBerths(), []);
  const quayCranes = useMemo(() => PortTerminalService.getQuayCranes(), []);
  const yardBlocks = useMemo(() => PortTerminalService.getYardBlocks(), []);
  const agvs = useMemo(() => PortTerminalService.getAgvs(), []);
  const metrics = useMemo(() => PortTerminalService.getTerminalMetrics(), []);

  const activeBerth = useMemo(() => {
    return berths.find((b) => b.berthId === selectedBerthId) || berths[0];
  }, [berths, selectedBerthId]);

  const berthValidation = useMemo(() => {
    if (!activeBerth) return null;
    return PortTerminalService.evaluateBerthAllocation(activeBerth.berthId, {
      vesselName: 'Test Container Ship',
      lengthOverallMeters: testLoa,
      beamMeters: 59,
      actualDraftMeters: testDraft,
      displacementTons: 220000,
    });
  }, [activeBerth, testLoa, testDraft]);

  const filteredBlocks = useMemo(() => {
    if (selectedBlockType === 'ALL') return yardBlocks;
    return yardBlocks.filter((b) => b.blockType === selectedBlockType);
  }, [yardBlocks, selectedBlockType]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-cyan-950/40 border border-blue-800/40 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Anchor className="h-6 w-6 text-cyan-400" />
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Marine Port Terminal &amp; Automated Crane Operations
              </h1>
              <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-medium">
                {metrics.terminalName} ({metrics.terminalCode})
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Berth Allocation Problem (BAP), Super Post-Panamax Quay Crane sequencing (QCASP), and Automated Guided Vehicle (AGV) telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2 rounded-xl text-right">
              <div className="text-xs text-slate-400 uppercase font-semibold">Gross Moves/Hr</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {metrics.grossCraneMovesPerHour} GMPH
              </div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2 rounded-xl text-right">
              <div className="text-xs text-slate-400 uppercase font-semibold">Daily TEU Volume</div>
              <div className="text-xl font-bold text-cyan-400 font-mono">
                {Math.round(metrics.dailyTeuThroughput).toLocaleString()} TEU
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
            <Anchor className="h-4 w-4 text-cyan-400" />
            <span>Berth Occupancy</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {metrics.berthOccupancyRatePercent}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            2 of {metrics.berthCount} deepwater quays berthed
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
            <Cpu className="h-4 w-4 text-blue-400" />
            <span>Active Quay Cranes</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {quayCranes.filter((q) => q.operationalStatus === 'ACTIVE_LIFTING').length} / {quayCranes.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Super Post-Panamax gantries</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
            <BatteryCharging className="h-4 w-4 text-emerald-400" />
            <span>AGV Fleet Active</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {metrics.activeAgvCount} / {agvs.length} Units
          </div>
          <div className="text-xs text-slate-400 mt-1">Lithium 70T Automated Guided Vehicles</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
            <Gauge className="h-4 w-4 text-purple-400" />
            <span>Avg Vessel Turnaround</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {metrics.averageVesselTurnaroundHours} Hours
          </div>
          <div className="text-xs text-slate-400 mt-1">Fast-berth automated handling</div>
        </div>
      </div>

      {/* Deepwater Berth Allocation & Quay Crane Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Berth Slots & Crane Layout (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Anchor className="h-5 w-5 text-cyan-400" />
                Deepwater Quayside Berths &amp; Super Post-Panamax Cranes
              </h3>
              <span className="text-xs text-slate-400 font-mono">BAP / QCASP</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {berths.map((b) => {
                const isSelected = b.berthId === activeBerth?.berthId;
                return (
                  <button
                    key={b.berthId}
                    onClick={() => setSelectedBerthId(b.berthId)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-white">
                        {b.berthId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          b.status === 'OCCUPIED'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-700'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200">{b.berthName}</div>
                    <div className="text-[11px] text-slate-400 mt-2 space-y-0.5">
                      <div>Length: <strong className="text-slate-200">{b.lengthMeters}m</strong></div>
                      <div>Dredged: <strong className="text-cyan-300">{b.dredgedDepthMeters}m</strong></div>
                      <div>Max Draft: <strong className="text-amber-300">{b.maxDraftAllowableMeters}m</strong></div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Cranes on selected berth */}
            <div className="pt-2">
              <div className="text-xs uppercase font-semibold text-slate-400 mb-2.5">
                Quay Cranes Deployed on {activeBerth?.berthName}
              </div>
              <div className="space-y-2.5">
                {quayCranes
                  .filter((q) => q.berthId === activeBerth?.berthId)
                  .map((qc) => (
                    <div
                      key={qc.craneId}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-950/60 border border-blue-800 flex items-center justify-center text-blue-400 font-mono font-bold text-xs">
                          {qc.craneId}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{qc.craneName}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>Outreach: {qc.outreachMeters}m</span>
                            <span>•</span>
                            <span>Lift: {qc.liftingCapacityTons}T</span>
                            <span>•</span>
                            <span>Rail Pos: {qc.currentRailPositionMeters}m</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Productivity</div>
                          <div className="text-xs font-bold font-mono text-emerald-400">
                            {qc.movesPerHourNominal} moves/hr
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Moves Today</div>
                          <div className="text-xs font-bold font-mono text-cyan-400">
                            {qc.totalMovesCompletedToday}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
                            qc.operationalStatus === 'ACTIVE_LIFTING'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-700'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {qc.operationalStatus}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Automated Guided Vehicles (AGV) Fleet Telemetry */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BatteryCharging className="h-5 w-5 text-emerald-400" />
                Automated Guided Vehicles (AGV) Quayside Transport
              </h3>
              <span className="text-xs text-slate-400 font-mono">Real-time SoC</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {agvs.map((agv) => (
                <div
                  key={agv.agvId}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-white">
                      {agv.agvId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        agv.operatingMode === 'CARRYING_PAYLOAD'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-700'
                          : agv.operatingMode === 'CHARGING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-700'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-700'
                      }`}
                    >
                      {agv.operatingMode.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Zone: <strong className="text-white">{agv.currentZone}</strong></span>
                    <span>Dest: <strong className="text-cyan-400">{agv.destinationNode}</strong></span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Battery SoC</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {agv.batteryStateOfChargePercent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          agv.batteryStateOfChargePercent < 25
                            ? 'bg-red-500'
                            : agv.batteryStateOfChargePercent < 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${agv.batteryStateOfChargePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Berth Allocation Simulator & Yard Block Stacking (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Berth Allocation Physical Simulator (BAP) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-cyan-400" />
                Berth Allocation Clearance Validator
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Vessel Length Overall (LOA): {testLoa} meters
                </label>
                <input
                  type="range"
                  min="200"
                  max="450"
                  step="5"
                  value={testLoa}
                  onChange={(e) => setTestLoa(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Vessel Actual Draught: {testDraft} meters
                </label>
                <input
                  type="range"
                  min="8.0"
                  max="19.0"
                  step="0.2"
                  value={testDraft}
                  onChange={(e) => setTestDraft(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              {berthValidation && (
                <div
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    berthValidation.feasible
                      ? 'bg-emerald-950/30 border-emerald-700/60 text-emerald-200'
                      : 'bg-red-950/30 border-red-700/60 text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {berthValidation.feasible ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span>
                      {berthValidation.feasible
                        ? 'BERTH ALLOCATION APPROVED'
                        : 'BERTH ALLOCATION RESTRICTED'}
                    </span>
                  </div>

                  <div className="text-[11px] grid grid-cols-2 gap-2 opacity-90 font-mono">
                    <div>Length Margin: {berthValidation.clearanceMarginMeters}m</div>
                    <div>Under-Keel UKC: {berthValidation.underKeelClearanceMeters}m</div>
                  </div>

                  {berthValidation.issues.length > 0 && (
                    <div className="text-[10px] space-y-1 pt-1 border-t border-red-800/40">
                      {berthValidation.issues.map((iss, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0 text-red-400 mt-0.5" />
                          <span>{iss}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Automated Stacking Crane (ASC) Yard Blocks */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-400" />
                Container Yard Blocks (ASC)
              </h3>
              <select
                value={selectedBlockType}
                onChange={(e) => setSelectedBlockType(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-300"
              >
                <option value="ALL">All Blocks</option>
                <option value="DRY_STANDARD">Dry Standard</option>
                <option value="REEFER">Reefer Blocks</option>
                <option value="HAZMAT_ISOLATION">Hazmat Isolation</option>
                <option value="EMPTY_DEPOT">Empty Depot</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredBlocks.map((blk) => {
                const occPercent = Math.round((blk.currentTeuOccupancy / blk.maxTeuCapacity) * 100);
                return (
                  <div
                    key={blk.blockId}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {blk.blockId}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {blk.blockType}
                        </span>
                      </div>
                      <span className="text-[10px] text-cyan-300 font-mono">
                        ASC: {blk.ascCraneId}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400">Occupancy</span>
                        <span className="font-mono font-bold text-white">
                          {blk.currentTeuOccupancy} / {blk.maxTeuCapacity} TEU ({occPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            occPercent > 85 ? 'bg-amber-500' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${occPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>Stack: {blk.maxTiers} Tiers high</span>
                      <span>Rehandle moves: <strong className="text-slate-300">{blk.rehandlingRatioPercent}%</strong></span>
                      {blk.reeferPlugsInstalled > 0 && (
                        <span>Reefer Plugs: <strong className="text-emerald-400">{blk.reeferPlugsOccupied}/{blk.reeferPlugsInstalled}</strong></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
