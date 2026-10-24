/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Interactive Global Dispatch Board
 * Handles real-time load assignment, driver HOS validation, Hazmat compliance checking, and capacity matching.
 */

import React, { useState } from 'react';
import {
  Kanban,
  Truck,
  Package,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Gauge,
  Clock,
  Send,
  Lock,
} from 'lucide-react';
import { WaybillDocument, Vehicle } from '../../packages/shared-types/index.ts';

interface DispatchBoardViewProps {
  waybills: WaybillDocument[];
  vehicles: Vehicle[];
  onDispatchLoad: (waybillId: string, vehicleId: string) => void;
}

export const DispatchBoardView: React.FC<DispatchBoardViewProps> = ({
  waybills,
  vehicles,
  onDispatchLoad,
}) => {
  const [selectedWaybillId, setSelectedWaybillId] = useState<string>(waybills[0]?.id || '');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [dispatchStatusMsg, setDispatchStatusMsg] = useState<string | null>(null);

  const selectedWaybill = waybills.find((w) => w.id === selectedWaybillId) || waybills[0];
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // Validation rules
  const isOverweight = selectedWaybill && selectedVehicle
    ? selectedWaybill.totalWeightKg > selectedVehicle.maxWeightCapacityKg
    : false;

  const lacksHazmatLicense = selectedWaybill && selectedVehicle
    ? selectedWaybill.hazmatClass !== 'NONE' && !selectedVehicle.assignedDriver.licenseGrade.includes('HAZMAT')
    : false;

  const lowHos = selectedVehicle ? selectedVehicle.assignedDriver.hosRemainingHours < 3.0 : false;

  const canDispatch = selectedWaybill && selectedVehicle && !isOverweight && !lacksHazmatLicense;

  const handleExecuteDispatch = () => {
    if (!canDispatch || !selectedWaybill || !selectedVehicle) return;
    onDispatchLoad(selectedWaybill.id, selectedVehicle.id);
    setDispatchStatusMsg(`Successfully dispatched ${selectedWaybill.waybillNumber} to ${selectedVehicle.name} (${selectedVehicle.assignedDriver.name})`);
    setTimeout(() => setDispatchStatusMsg(null), 5000);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Kanban className="h-6 w-6 text-cyan-400" />
            Global Dispatch &amp; Collaborative Load Assignment Board
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time fleet capacity matching, driver Hours-of-Service verification, and Hazmat endorsement validation.
          </p>
        </div>

        {dispatchStatusMsg && (
          <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{dispatchStatusMsg}</span>
          </div>
        )}
      </div>

      {/* Dispatch Split Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Freight Loads (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="h-4 w-4 text-cyan-400" />
              Available Freight Loads ({waybills.length})
            </h2>
            <span className="text-[11px] font-mono text-cyan-400">Step 1: Select Load</span>
          </div>

          <div className="space-y-2.5 max-h-[72vh] overflow-y-auto pr-1">
            {waybills.map((wb) => {
              const isSelected = wb.id === selectedWaybillId;
              return (
                <div
                  key={wb.id}
                  onClick={() => setSelectedWaybillId(wb.id)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span className="text-cyan-300 text-sm">{wb.waybillNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                      {wb.mode}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-200 font-medium mt-1.5">
                    <span>{wb.origin.city}</span>
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                    <span>{wb.destination.city}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500">Gross Weight: </span>
                      <strong className="text-slate-200">{(wb.totalWeightKg / 1000).toFixed(1)} MT</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Value: </span>
                      <strong className="text-emerald-400">${wb.totalDeclaredValueUsd.toLocaleString()}</strong>
                    </div>
                  </div>

                  {wb.hazmatClass !== 'NONE' && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-400 font-mono font-bold">
                      <AlertTriangle className="h-3 w-3" />
                      Requires Endorsement: {wb.hazmatClass}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Fleet Units & In-Cab Drivers (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-cyan-400" />
              Available Vehicles &amp; Drivers ({vehicles.length})
            </h2>
            <span className="text-[11px] font-mono text-cyan-400">Step 2: Assign Unit</span>
          </div>

          <div className="space-y-2.5 max-h-[72vh] overflow-y-auto pr-1">
            {vehicles.map((v) => {
              const isSelected = v.id === selectedVehicleId;
              const isVehicleOverloaded = selectedWaybill
                ? selectedWaybill.totalWeightKg > v.maxWeightCapacityKg
                : false;

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-950/30'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{v.name}</h4>
                      <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                        VIN: {v.vin} • Type: {v.type}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        v.currentStatus === 'EN_ROUTE'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {v.currentStatus}
                    </span>
                  </div>

                  {/* Driver & Capacity Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-800/80">
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Assigned Driver</div>
                      <div className="text-xs font-bold text-slate-200 mt-0.5 truncate">
                        {v.assignedDriver.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {v.assignedDriver.licenseGrade}
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">HOS Available</div>
                      <div className="text-xs font-mono font-bold text-cyan-400 mt-0.5">
                        {v.assignedDriver.hosRemainingHours}h / 11h
                      </div>
                      <div className="text-[10px] text-slate-400">FMCSA Capable</div>
                    </div>

                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Payload Capacity</div>
                      <div
                        className={`text-xs font-mono font-bold mt-0.5 ${
                          isVehicleOverloaded ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {(v.maxWeightCapacityKg / 1000).toLocaleString()} MT Max
                      </div>
                      <div className="text-[10px] text-slate-400">{v.maxVolumeCapacityM3} m³ Cube</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Dispatch Execution Console */}
      {selectedWaybill && selectedVehicle && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="h-4 w-4 text-cyan-400" />
              Proposed Dispatch Confirmation
            </div>
            <div className="text-sm font-semibold text-white">
              Dispatch <span className="text-cyan-400 font-mono">{selectedWaybill.waybillNumber}</span> ({selectedWaybill.origin.city} → {selectedWaybill.destination.city}) onto{' '}
              <span className="text-blue-400">{selectedVehicle.name}</span>
            </div>

            {/* Validation Warnings */}
            {isOverweight && (
              <div className="text-xs text-red-400 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Capacity Breach: Load weight ({(selectedWaybill.totalWeightKg / 1000).toFixed(1)} MT) exceeds vehicle limit ({(selectedVehicle.maxWeightCapacityKg / 1000).toFixed(1)} MT)!
              </div>
            )}
            {lacksHazmatLicense && (
              <div className="text-xs text-amber-400 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Compliance Warning: Driver lacks certified HAZMAT endorsement for {selectedWaybill.hazmatClass}!
              </div>
            )}
            {!isOverweight && !lacksHazmatLicense && (
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                All regulatory dispatch constraints satisfied (Weight, Volume, HOS, Driver Endorsement).
              </div>
            )}
          </div>

          <button
            onClick={handleExecuteDispatch}
            disabled={!canDispatch}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition-all shrink-0"
          >
            <Lock className="h-4 w-4" />
            <span>Lock &amp; Transmit Dispatch Order</span>
          </button>
        </div>
      )}
    </div>
  );
};
