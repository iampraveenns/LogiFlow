/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Fleet Maintenance & Predictive Component Prognostics View
 */

import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Cpu,
  Layers,
  Activity,
  Plus,
} from 'lucide-react';
import {
  FleetMaintenanceService,
  ComponentWearProfile,
  PredictivePrognosisAlert,
  MaintenanceWorkOrder,
} from '../../backend/services/fleetMaintenanceService.ts';

export const FleetMaintenanceView: React.FC = () => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('VEH-TRK-102');
  const [wearProfiles, setWearProfiles] = useState<ComponentWearProfile[]>(() =>
    FleetMaintenanceService.getVehicleWearProfile('VEH-TRK-102')
  );
  const [prognosisAlerts] = useState<PredictivePrognosisAlert[]>(() =>
    FleetMaintenanceService.getPredictivePrognosisAlerts()
  );
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>(() =>
    FleetMaintenanceService.getWorkOrders()
  );

  const handleSelectVehicle = (vId: string) => {
    setSelectedVehicleId(vId);
    setWearProfiles(FleetMaintenanceService.getVehicleWearProfile(vId));
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          <Wrench className="h-6 w-6 text-cyan-400" />
          Fleet Maintenance &amp; Predictive Failure Prognostics Studio
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Component wear degradation physics, vibration harmonics analysis, and automated ASE-certified maintenance work orders.
        </p>
      </div>

      {/* Predictive Prognosis Urgent Alerts Ribbon */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-400" />
          <span>Active Predictive Prognosis Alerts (Pre-Breakdown Intervention)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {prognosisAlerts.map((prog) => (
            <div
              key={prog.id}
              className={`p-4 rounded-xl border space-y-2.5 font-mono text-xs ${
                prog.severity === 'CRITICAL'
                  ? 'bg-red-950/40 border-red-800/80'
                  : 'bg-amber-950/40 border-amber-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-sans truncate">{prog.vehicleName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-red-400 font-bold">
                  {prog.failureRiskPercent}% Failure Risk
                </span>
              </div>

              <div className="text-slate-200 font-sans font-semibold">{prog.component}</div>

              <div className="text-[11px] text-slate-400">
                Horizon: <strong className="text-amber-300">~{prog.predictedFailureDays} days</strong> ({prog.predictedFailureKmRange[0]} - {prog.predictedFailureKmRange[1]} km)
              </div>

              <p className="text-[11px] text-slate-300 font-sans pt-1 border-t border-slate-800/80">
                Root Cause: {prog.rootCauseTelemetry}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle Component Wear Health Radar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-semibold">Inspect Unit:</label>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => handleSelectVehicle('VEH-TRK-102')}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  selectedVehicleId === 'VEH-TRK-102'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Freightliner Cascadia #102 (Diesel)
              </button>
              <button
                onClick={() => handleSelectVehicle('VEH-TRK-101')}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  selectedVehicleId === 'VEH-TRK-101'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Volvo FH Electric #101 (EV)
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wearProfiles.map((comp, idx) => (
            <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white truncate">{comp.componentName}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    comp.healthStatus === 'OPTIMAL'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : comp.healthStatus === 'FAIR'
                      ? 'bg-blue-950 text-blue-400 border border-blue-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {comp.healthStatus}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Wear Degradation:</span>
                  <span className="font-bold text-slate-200">{comp.wearPercentage}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      comp.wearPercentage > 70
                        ? 'bg-red-500'
                        : comp.wearPercentage > 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${comp.wearPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 font-mono">{comp.metricReadout}</div>
              <div className="text-[10px] text-slate-500 font-mono border-t border-slate-800/80 pt-1.5 flex justify-between">
                <span>RUL: ~{comp.remainingUsefulLifeDays}d</span>
                <span>{comp.remainingUsefulLifeKm.toLocaleString()} km left</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Maintenance Work Orders */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-white">Maintenance Work Orders &amp; Parts Requisition</h3>
            <p className="text-xs text-slate-400">Scheduled shop bay work and ASE technician assignments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workOrders.map((wo) => (
            <div key={wo.orderId} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300">{wo.orderId}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-bold">
                  {wo.priority}
                </span>
              </div>

              <div className="font-sans font-semibold text-slate-200 text-sm">{wo.serviceType}</div>
              <div className="text-[11px] text-slate-400">{wo.facilityLocation}</div>

              {/* Parts list */}
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1 text-[11px]">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Requisitioned Parts:</div>
                {wo.requiredParts.map((p) => (
                  <div key={p.partNumber} className="flex justify-between text-slate-300">
                    <span>
                      {p.quantity}x {p.description} ({p.partNumber})
                    </span>
                    <span className="text-emerald-400 font-bold">${p.unitCostUsd * p.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-2 font-sans">
                <span className="text-slate-400">Tech: {wo.assignedTechnician}</span>
                <span className="font-mono font-bold text-white">Est. Total: ${wo.totalEstimatedCostUsd}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
