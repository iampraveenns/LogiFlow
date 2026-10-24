/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plane, 
  Box, 
  Weight, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  RotateCcw, 
  Plus, 
  Info, 
  ArrowRight,
  Activity,
  Maximize2
} from 'lucide-react';
import { AirCargoUldService } from '../../backend/services/airCargoUldService.ts';

export interface CargoParcelItem {
  id: string;
  trackingNumber: string;
  weightKg: number;
  volumeM3: number;
  isHazmat: boolean;
  hazmatClass?: string;
  destinationAirport: string;
  priority: 'EXPRESS' | 'STANDARD' | 'ECONOMY';
}

export interface UldContainer {
  id: string;
  uldCode: string;
  type: string;
  tareWeightKg: number;
  maxGrossWeightKg: number;
  internalVolumeM3: number;
  deckPosition: string;
  fuselageStationInch: number;
  parcels: CargoParcelItem[];
}

export const AirCargoUldView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PALLET_BUILDER' | 'AIRCRAFT_TRIM' | 'HAZMAT_RULES'>('PALLET_BUILDER');
  const [selectedUldType, setSelectedUldType] = useState<string>('LD-3');
  const [selectedUldId, setSelectedUldId] = useState<string>('ULD-AKE-88419LH');

  // Pre-configured ULD fleet state
  const [ulds, setUlds] = useState<UldContainer[]>([
    {
      id: 'ULD-AKE-88419LH',
      uldCode: 'AKE',
      type: 'LD-3',
      tareWeightKg: 82,
      maxGrossWeightKg: 1588,
      internalVolumeM3: 4.3,
      deckPosition: 'LOWER_FORWARD',
      fuselageStationInch: 450,
      parcels: [
        { id: 'PKG-AIR-01', trackingNumber: 'AWB-020-948102', weightKg: 320, volumeM3: 0.85, isHazmat: false, destinationAirport: 'FRA', priority: 'EXPRESS' },
        { id: 'PKG-AIR-02', trackingNumber: 'AWB-020-948103', weightKg: 210, volumeM3: 0.62, isHazmat: false, destinationAirport: 'FRA', priority: 'STANDARD' },
        { id: 'PKG-AIR-03', trackingNumber: 'AWB-020-948104', weightKg: 145, volumeM3: 0.44, isHazmat: true, hazmatClass: '9', destinationAirport: 'FRA', priority: 'EXPRESS' }
      ]
    },
    {
      id: 'ULD-PMC-10294BA',
      uldCode: 'PMC',
      type: 'PMC_96',
      tareWeightKg: 120,
      maxGrossWeightKg: 6800,
      internalVolumeM3: 11.5,
      deckPosition: 'MAIN_DECK_MID',
      fuselageStationInch: 880,
      parcels: [
        { id: 'PKG-AIR-04', trackingNumber: 'AWB-125-883011', weightKg: 1450, volumeM3: 3.2, isHazmat: false, destinationAirport: 'LHR', priority: 'EXPRESS' },
        { id: 'PKG-AIR-05', trackingNumber: 'AWB-125-883012', weightKg: 1800, volumeM3: 4.1, isHazmat: false, destinationAirport: 'LHR', priority: 'STANDARD' }
      ]
    },
    {
      id: 'ULD-PAG-55102SQ',
      uldCode: 'PAG',
      type: 'LD-7',
      tareWeightKg: 105,
      maxGrossWeightKg: 6033,
      internalVolumeM3: 10.2,
      deckPosition: 'LOWER_AFT',
      fuselageStationInch: 1240,
      parcels: [
        { id: 'PKG-AIR-06', trackingNumber: 'AWB-618-449102', weightKg: 950, volumeM3: 2.1, isHazmat: true, hazmatClass: '3', destinationAirport: 'SIN', priority: 'EXPRESS' }
      ]
    }
  ]);

  // Candidate incoming parcels staging area
  const [stagedParcels, setStagedParcels] = useState<CargoParcelItem[]>([
    { id: 'PKG-STAGE-01', trackingNumber: 'AWB-999-100234', weightKg: 240, volumeM3: 0.55, isHazmat: false, destinationAirport: 'FRA', priority: 'EXPRESS' },
    { id: 'PKG-STAGE-02', trackingNumber: 'AWB-999-100235', weightKg: 180, volumeM3: 0.38, isHazmat: true, hazmatClass: '4.1', destinationAirport: 'FRA', priority: 'STANDARD' },
    { id: 'PKG-STAGE-03', trackingNumber: 'AWB-999-100236', weightKg: 310, volumeM3: 0.72, isHazmat: true, hazmatClass: '8', destinationAirport: 'FRA', priority: 'EXPRESS' },
    { id: 'PKG-STAGE-04', trackingNumber: 'AWB-999-100237', weightKg: 420, volumeM3: 0.95, isHazmat: false, destinationAirport: 'LHR', priority: 'STANDARD' }
  ]);

  // Selected ULD
  const currentUld = useMemo(() => {
    return ulds.find(u => u.id === selectedUldId) || ulds[0];
  }, [ulds, selectedUldId]);

  // Compute current ULD telemetry
  const uldMetrics = useMemo(() => {
    const payloadWeight = currentUld.parcels.reduce((sum: number, p: CargoParcelItem) => sum + p.weightKg, 0);
    const grossWeight = payloadWeight + currentUld.tareWeightKg;
    const usedVolume = currentUld.parcels.reduce((sum: number, p: CargoParcelItem) => sum + p.volumeM3, 0);
    const weightUtilPct = (grossWeight / currentUld.maxGrossWeightKg) * 100;
    const volUtilPct = (usedVolume / currentUld.internalVolumeM3) * 100;
    return { payloadWeight, grossWeight, usedVolume, weightUtilPct, volUtilPct };
  }, [currentUld]);

  // Aircraft Trim and Balance calculation
  const trimReport = useMemo(() => {
    return AirCargoUldService.calculateAircraftWeightAndBalance(
      'B777-200F',
      ulds,
      62000 // 62 metric tons of fuel
    );
  }, [ulds]);

  // Move parcel into ULD
  const handleLoadParcel = (parcel: CargoParcelItem) => {
    // Check hazmat conflict first
    if (parcel.isHazmat && parcel.hazmatClass) {
      for (const existing of currentUld.parcels) {
        if (existing.isHazmat && existing.hazmatClass) {
          const check = AirCargoUldService.validateHazmatSegregation(parcel.hazmatClass, existing.hazmatClass);
          if (!check.compatible) {
            alert(`IATA DGR Hazmat Conflict: Cannot load Class ${parcel.hazmatClass} alongside Class ${existing.hazmatClass}. Conflict: ${check.rationale}`);
            return;
          }
        }
      }
    }

    if (uldMetrics.grossWeight + parcel.weightKg > currentUld.maxGrossWeightKg) {
      alert(`Weight limit exceeded! ULD max capacity is ${currentUld.maxGrossWeightKg} kg.`);
      return;
    }

    setUlds(prev => prev.map(u => {
      if (u.id === currentUld.id) {
        return { ...u, parcels: [...u.parcels, parcel] };
      }
      return u;
    }));

    setStagedParcels(prev => prev.filter(p => p.id !== parcel.id));
  };

  // Unload parcel from ULD
  const handleUnloadParcel = (parcelId: string) => {
    const parcelToUnload = currentUld.parcels.find(p => p.id === parcelId);
    if (!parcelToUnload) return;

    setUlds(prev => prev.map(u => {
      if (u.id === currentUld.id) {
        return { ...u, parcels: u.parcels.filter(p => p.id !== parcelId) };
      }
      return u;
    }));

    setStagedParcels(prev => [...prev, parcelToUnload]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Plane className="h-6 w-6 text-sky-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">IATA Air Cargo ULD Palletization & Aircraft Trim</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Boeing 777-200F / Airbus A330-200F Weight & Balance engine, % MAC Center of Gravity envelope, and IATA DGR Hazmat Segregation Matrix.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('PALLET_BUILDER')}
            className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === 'PALLET_BUILDER'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ULD Pallet Builder
          </button>
          <button
            onClick={() => setActiveTab('AIRCRAFT_TRIM')}
            className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === 'AIRCRAFT_TRIM'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Aircraft CoG Trim (% MAC)
          </button>
          <button
            onClick={() => setActiveTab('HAZMAT_RULES')}
            className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === 'HAZMAT_RULES'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            IATA Hazmat Matrix
          </button>
        </div>
      </div>

      {activeTab === 'PALLET_BUILDER' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: ULD Selector & 3D Contour Profile */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                    <Box className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Active Unit Load Device (ULD)</h3>
                    <p className="text-xs text-slate-400">Select container in bay to inspect contour fit and load parcels</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {ulds.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUldId(u.id)}
                      className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition border ${
                        selectedUldId === u.id
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {u.id} ({u.type})
                    </button>
                  ))}
                </div>
              </div>

              {/* ULD Technical Specs Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950 rounded-lg border border-slate-800 mb-6">
                <div>
                  <div className="text-xs text-slate-400">Tare Weight</div>
                  <div className="text-sm font-semibold text-white font-mono mt-0.5">{currentUld.tareWeightKg} kg</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Max Gross Weight</div>
                  <div className="text-sm font-semibold text-sky-400 font-mono mt-0.5">{currentUld.maxGrossWeightKg} kg</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Station Arm (Inches)</div>
                  <div className="text-sm font-semibold text-amber-400 font-mono mt-0.5">{currentUld.fuselageStationInch}&quot; MAC</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Deck Bay Position</div>
                  <div className="text-sm font-semibold text-purple-400 font-mono mt-0.5">{currentUld.deckPosition}</div>
                </div>
              </div>

              {/* Graphical Contour Visualization */}
              <div className="relative border border-slate-800 bg-slate-950/80 rounded-xl p-6 overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span>ULD Aircraft Fuselage Contour Cross-Section ({currentUld.type})</span>
                  <span>Payload Volume: {uldMetrics.usedVolume.toFixed(2)} / {currentUld.internalVolumeM3} m³</span>
                </div>

                {/* SVG Silhouette */}
                <div className="relative h-64 w-full flex items-center justify-center">
                  <svg className="w-full h-full max-w-md drop-shadow-lg" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Outline container */}
                    <path
                      d="M 50 20 L 300 20 L 370 120 L 370 210 L 50 210 Z"
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                    
                    {/* Interior fill proportional to volume */}
                    <clipPath id="uldClip">
                      <path d="M 50 20 L 300 20 L 370 120 L 370 210 L 50 210 Z" />
                    </clipPath>
                    
                    <rect
                      x="50"
                      y={210 - (190 * Math.min(1, uldMetrics.volUtilPct / 100))}
                      width="320"
                      height="200"
                      fill="url(#cargoGrad)"
                      clipPath="url(#uldClip)"
                      opacity="0.65"
                    />

                    {/* Gradient */}
                    <defs>
                      <linearGradient id="cargoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                    </defs>

                    {/* Cargo parcels icons overlay inside */}
                    <text x="70" y="190" fill="#94a3b8" fontSize="12" fontFamily="monospace">
                      📦 {currentUld.parcels.length} Stowed Parcels ({uldMetrics.payloadWeight} kg)
                    </text>
                    <text x="70" y="70" fill="#38bdf8" fontSize="14" fontWeight="bold">
                      {currentUld.id}
                    </text>
                    <text x="70" y="90" fill="#64748b" fontSize="10">
                      Standard IATA Class {currentUld.uldCode} Contour
                    </text>
                  </svg>
                </div>

                {/* Utilization Meters */}
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800/80">
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-mono">
                      <span className="text-slate-400">Weight Capacity</span>
                      <span className={uldMetrics.weightUtilPct > 90 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                        {uldMetrics.weightUtilPct.toFixed(1)}% ({uldMetrics.grossWeight} kg)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          uldMetrics.weightUtilPct > 95 ? 'bg-red-500' : uldMetrics.weightUtilPct > 80 ? 'bg-amber-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${Math.min(100, uldMetrics.weightUtilPct)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 font-mono">
                      <span className="text-slate-400">Volumetric Fill</span>
                      <span className="text-slate-200">
                        {uldMetrics.volUtilPct.toFixed(1)}% ({uldMetrics.usedVolume.toFixed(2)} m³)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, uldMetrics.volUtilPct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Loaded Parcels */}
              <div className="mt-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Manifest Stowed in {currentUld.id}</h4>
                <div className="space-y-2">
                  {currentUld.parcels.length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-lg">
                      No parcels currently stowed. Select from staging queue to load.
                    </div>
                  ) : (
                    currentUld.parcels.map(parcel => (
                      <div key={parcel.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="flex items-center gap-3">
                          <Box className="h-4 w-4 text-sky-400" />
                          <div>
                            <div className="text-xs font-mono text-white font-medium flex items-center gap-2">
                              {parcel.trackingNumber}
                              {parcel.isHazmat && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-900/60 border border-red-500/40 text-red-300 font-sans">
                                  DGR Class {parcel.hazmatClass}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Dest: {parcel.destinationAirport} • Priority: {parcel.priority}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right font-mono text-xs">
                            <div className="text-white">{parcel.weightKg} kg</div>
                            <div className="text-slate-500">{parcel.volumeM3} m³</div>
                          </div>
                          <button
                            onClick={() => handleUnloadParcel(parcel.id)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                            title="Unload from ULD"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Staging Queue Ready to Palletize */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Staging Air Cargo Bay</h3>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {stagedParcels.length} Items Pending
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Air waybill consignments cleared through TSA customs x-ray screening, pending build-up.
              </p>

              <div className="space-y-3">
                {stagedParcels.map(pkg => (
                  <div key={pkg.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-xs font-mono font-medium text-white">{pkg.trackingNumber}</div>
                        <div className="text-[10px] text-slate-400">Dest: {pkg.destinationAirport}</div>
                      </div>
                      {pkg.isHazmat ? (
                        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="h-3 w-3" /> Cls {pkg.hazmatClass}
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          General
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900">
                      <div className="text-xs font-mono text-slate-300">
                        {pkg.weightKg} kg / {pkg.volumeM3} m³
                      </div>
                      <button
                        onClick={() => handleLoadParcel(pkg)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition"
                      >
                        <Plus className="h-3 w-3" /> Stow
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Hazmat Segregation Reminder */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-2">
                <ShieldAlert className="h-4 w-4" />
                IATA Dangerous Goods Regulation (DGR) Notice
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lithium batteries (Class 9 UN3480) and flammable liquids (Class 3) must be strictly stowed in fire-containment covers with minimum 1-meter floor clearance.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'AIRCRAFT_TRIM' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400">Aircraft Model</div>
              <div className="text-base font-bold text-white mt-1">Boeing 777-200F</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Dual GE90-110B1L Engines</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400">Total Takeoff Weight (TOW)</div>
              <div className="text-base font-bold text-sky-400 font-mono mt-1">
                {(trimReport.totalGrossWeightKg / 1000).toFixed(2)} MT
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">MTOW Limit: 347.8 Metric Tons</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400">Center of Gravity (% MAC)</div>
              <div className={`text-base font-bold font-mono mt-1 ${trimReport.withinLimits ? 'text-emerald-400' : 'text-red-400'}`}>
                {trimReport.cgPercentMac.toFixed(1)}% MAC
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Envelope: 14.0% — 34.0%</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400">Flight Trim Status</div>
              <div className="flex items-center gap-1.5 mt-1">
                {trimReport.withinLimits ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400 uppercase">Trim Balanced</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-bold text-red-400 uppercase">Out of Trim</span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Stab Trim: {trimReport.stabilizerTrimUnits} Units ANU</div>
            </div>
          </div>

          {/* Aircraft Fuselage Layout and CG Envelope Visualizer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-semibold text-white mb-2">Longitudinal Center-of-Gravity Aircraft Station Diagram</h3>
            <p className="text-xs text-slate-400 mb-6">
              Visualizes cargo deck positions from Station 400 (Forward Bay) to Station 1400 (Aft Bulkhead).
            </p>

            {/* Fuselage schematic */}
            <div className="relative h-48 bg-slate-950 rounded-xl border border-slate-800 p-6 flex flex-col justify-between">
              {/* Nose to Tail marker */}
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>◀ NOSE (Station 200)</span>
                <span>WING AERODYNAMIC CHORD (Station 750 - 1050)</span>
                <span>EMPENNAGE / TAIL (Station 1600) ▶</span>
              </div>

              {/* Bay positions */}
              <div className="grid grid-cols-6 gap-2 my-auto">
                {ulds.map(uld => (
                  <div 
                    key={uld.id} 
                    className="p-2.5 rounded bg-slate-900 border border-sky-500/30 flex flex-col items-center text-center"
                  >
                    <span className="text-[10px] font-mono text-sky-400 font-bold">{uld.uldCode}-{uld.type}</span>
                    <span className="text-xs text-white font-mono mt-1">{uld.parcels.reduce((s: number, p: CargoParcelItem) => s + p.weightKg, 0) + uld.tareWeightKg} kg</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Sta {uld.fuselageStationInch}&quot;</span>
                  </div>
                ))}
              </div>

              {/* CG Indicator Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>14% FWD Limit</span>
                  <span className="text-sky-400 font-bold">CG: {trimReport.cgPercentMac.toFixed(1)}% MAC</span>
                  <span>34% AFT Limit</span>
                </div>
                <div className="relative h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                  {/* Allowable safe window 14% to 34% (20% width) */}
                  <div className="absolute left-[14%] right-[66%] h-full bg-emerald-500/20 border-x border-emerald-500" />
                  {/* Needle */}
                  <div 
                    className="absolute top-0 bottom-0 w-2 bg-sky-400 shadow-md shadow-sky-500 rounded"
                    style={{ left: `${Math.min(98, Math.max(2, trimReport.cgPercentMac))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Flight Dispatch Recommendation */}
            <div className="mt-4 p-4 rounded-lg bg-sky-950/30 border border-sky-800/40 text-xs text-sky-200 flex items-start gap-3">
              <Info className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-sky-300">Dispatch Clearance Note: </span>
                {trimReport.recommendation} Fuel burn plan reflects 4.2% lower trim drag when CG is maintained within optimal cruise bracket (26-29% MAC).
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'HAZMAT_RULES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-base font-semibold text-white">IATA Dangerous Goods Regulation (DGR) Compatibility Matrix</h3>
              <p className="text-xs text-slate-400">Table 9.3.A segregation guidelines for air transport cargo holds</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-3">Class</th>
                  <th className="p-3">Hazard Description</th>
                  <th className="p-3">Segregation Requirement</th>
                  <th className="p-3">Forbidden Co-loads</th>
                  <th className="p-3">Passenger Aircraft Allowed?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 text-red-400 font-bold">Class 1</td>
                  <td className="p-3 text-slate-200">Explosives (1.1 - 1.6)</td>
                  <td className="p-3 text-slate-400">Strict isolation, 3m air barrier</td>
                  <td className="p-3 text-red-300">Class 2.1, 3, 4.1, 5.1</td>
                  <td className="p-3 text-red-400 font-bold">NO (CAO Only)</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 text-amber-400 font-bold">Class 3</td>
                  <td className="p-3 text-slate-200">Flammable Liquids</td>
                  <td className="p-3 text-slate-400">Separate compartments</td>
                  <td className="p-3 text-red-300">Class 1, Class 5.1 (Oxidizers)</td>
                  <td className="p-3 text-emerald-400">YES (Limited Qty)</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 text-orange-400 font-bold">Class 4.1</td>
                  <td className="p-3 text-slate-200">Flammable Solids</td>
                  <td className="p-3 text-slate-400">Vented ULD only</td>
                  <td className="p-3 text-red-300">Class 1, 5.1</td>
                  <td className="p-3 text-emerald-400">YES (Max 25kg)</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 text-cyan-400 font-bold">Class 8</td>
                  <td className="p-3 text-slate-200">Corrosive Substances</td>
                  <td className="p-3 text-slate-400">Secondary leak containment</td>
                  <td className="p-3 text-red-300">Class 4.3 (Water-reactive)</td>
                  <td className="p-3 text-emerald-400">YES</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 text-purple-400 font-bold">Class 9</td>
                  <td className="p-3 text-slate-200">Lithium Batteries (UN3480/UN3090)</td>
                  <td className="p-3 text-slate-400">Fire-containment covers, SoC &le; 30%</td>
                  <td className="p-3 text-red-300">Bulk flammables</td>
                  <td className="p-3 text-red-400 font-bold">NO (UN3480 CAO)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
