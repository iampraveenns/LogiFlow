/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Global Hazmat & Dangerous Goods Regulatory Hub
 * Interactive inspector for UN Model Regulations, IATA DGR, IMO IMDG, and US DOT ERG 2024.
 */

import React, { useState, useMemo } from 'react';
import {
  HazmatDangerousGoodsRegistry,
  HazmatMaterialDefinition,
  HazmatClass,
} from '../../backend/services/hazmatDangerousGoodsRegistry.ts';
import {
  ShieldAlert,
  Search,
  Flame,
  AlertTriangle,
  Skull,
  Radiation,
  Biohazard,
  Plane,
  Truck,
  Ship,
  Info,
  CheckCircle,
  XCircle,
  Compass,
  Wind,
} from 'lucide-react';

export const HazmatDangerousGoodsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedUnNumber, setSelectedUnNumber] = useState<string>('UN3480');

  // Simulation test state
  const [simMode, setSimMode] = useState<
    'AIR_PASSENGER' | 'AIR_CARGO_ONLY' | 'ROAD_TUNNEL' | 'MARITIME_CONTAINER'
  >('AIR_PASSENGER');
  const [simQuantityKg, setSimQuantityKg] = useState<number>(5);

  const allMaterials = useMemo(() => {
    return Object.values(HazmatDangerousGoodsRegistry.MATERIALS);
  }, []);

  const filteredMaterials = useMemo(() => {
    return allMaterials.filter((m) => {
      const matchesClass =
        selectedClass === 'ALL' ||
        m.primaryClass === selectedClass ||
        m.primaryClass.startsWith(selectedClass);

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        m.unNumber.toLowerCase().includes(q) ||
        m.properShippingName.toLowerCase().includes(q);

      return matchesClass && matchesQuery;
    });
  }, [allMaterials, selectedClass, searchQuery]);

  const activeMaterial = useMemo<HazmatMaterialDefinition | undefined>(() => {
    return (
      HazmatDangerousGoodsRegistry.getMaterial(selectedUnNumber) ||
      filteredMaterials[0] ||
      allMaterials[0]
    );
  }, [selectedUnNumber, filteredMaterials, allMaterials]);

  const simResult = useMemo(() => {
    if (!activeMaterial) return null;
    return HazmatDangerousGoodsRegistry.evaluateTransportFeasibility(
      activeMaterial.unNumber,
      simMode,
      simQuantityKg
    );
  }, [activeMaterial, simMode, simQuantityKg]);

  const getClassBadgeStyle = (cls: HazmatClass) => {
    if (cls.startsWith('1')) return 'bg-orange-500/20 text-orange-400 border-orange-700/60';
    if (cls === '2.1') return 'bg-red-500/20 text-red-400 border-red-700/60';
    if (cls === '2.2') return 'bg-emerald-500/20 text-emerald-400 border-emerald-700/60';
    if (cls === '2.3') return 'bg-purple-500/20 text-purple-400 border-purple-700/60';
    if (cls === '3') return 'bg-red-500/20 text-red-400 border-red-700/60';
    if (cls.startsWith('4')) return 'bg-amber-500/20 text-amber-400 border-amber-700/60';
    if (cls.startsWith('5')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-700/60';
    if (cls.startsWith('6')) return 'bg-purple-500/20 text-purple-400 border-purple-700/60';
    if (cls === '7') return 'bg-yellow-500/20 text-yellow-400 border-yellow-700/60';
    if (cls === '8') return 'bg-zinc-500/20 text-zinc-300 border-zinc-700/60';
    return 'bg-cyan-500/20 text-cyan-400 border-cyan-700/60';
  };

  const getPlacardVisual = (mat: HazmatMaterialDefinition) => {
    let bgColor = 'bg-slate-900';
    let borderColor = 'border-slate-600';
    let icon = <Flame className="w-8 h-8 text-amber-400" />;

    if (mat.primaryClass.startsWith('1')) {
      bgColor = 'bg-orange-600';
      borderColor = 'border-orange-400';
      icon = <AlertTriangle className="w-8 h-8 text-white" />;
    } else if (mat.primaryClass === '3' || mat.primaryClass === '2.1') {
      bgColor = 'bg-red-600';
      borderColor = 'border-red-400';
      icon = <Flame className="w-8 h-8 text-white" />;
    } else if (mat.primaryClass === '2.2') {
      bgColor = 'bg-emerald-600';
      borderColor = 'border-emerald-400';
      icon = <Wind className="w-8 h-8 text-white" />;
    } else if (mat.primaryClass.startsWith('5')) {
      bgColor = 'bg-yellow-500';
      borderColor = 'border-yellow-300';
      icon = <Flame className="w-8 h-8 text-slate-950" />;
    } else if (mat.primaryClass.startsWith('6')) {
      bgColor = 'bg-slate-100 text-slate-950';
      borderColor = 'border-slate-400';
      icon = <Skull className="w-8 h-8 text-slate-950" />;
    } else if (mat.primaryClass === '7') {
      bgColor = 'bg-yellow-400 text-slate-950';
      borderColor = 'border-yellow-600';
      icon = <Radiation className="w-8 h-8 text-slate-950" />;
    } else if (mat.primaryClass === '9') {
      bgColor = 'bg-slate-950 border-2';
      borderColor = 'border-white';
      icon = <Biohazard className="w-8 h-8 text-cyan-400" />;
    }

    return (
      <div
        className={`w-36 h-36 rotate-45 transform mx-auto flex items-center justify-center border-4 shadow-2xl relative ${bgColor} ${borderColor}`}
      >
        <div className="-rotate-45 text-center flex flex-col items-center">
          {icon}
          <div className="font-black text-sm tracking-widest mt-1">
            {mat.unNumber}
          </div>
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-90">
            CLASS {mat.primaryClass}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950/60 via-slate-900 to-amber-950/40 border border-red-800/40 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="h-6 w-6 text-red-400 animate-pulse" />
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Global Hazmat & Dangerous Goods Registry
              </h1>
              <span className="bg-red-500/20 text-red-300 text-xs px-2.5 py-0.5 rounded-full border border-red-500/30 font-medium">
                UN / IATA DGR 65th / IMO IMDG / US DOT ERG 2024
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Universal regulatory catalog for hazardous materials, explosive perimeters, emergency response isolation distances, and multi-modal segregation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2 rounded-xl text-right">
              <div className="text-xs text-slate-400 uppercase font-semibold">Active Catalog</div>
              <div className="text-lg font-bold text-white font-mono">
                {allMaterials.length} Regulated UN Codes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Class Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by UN Number (e.g. UN3480, UN1203, UN0004) or Substance Name (Lithium, Ammonia, Gasoline)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
            {[
              { id: 'ALL', label: 'All Classes' },
              { id: '1', label: 'Class 1 Explosives' },
              { id: '2', label: 'Class 2 Gases' },
              { id: '3', label: 'Class 3 Flammables' },
              { id: '4', label: 'Class 4 Solids' },
              { id: '5', label: 'Class 5 Oxidizers' },
              { id: '6', label: 'Class 6 Toxics' },
              { id: '7', label: 'Class 7 Radioactive' },
              { id: '8', label: 'Class 8 Corrosives' },
              { id: '9', label: 'Class 9 Misc' },
            ].map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedClass === cls.id
                    ? 'bg-red-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {cls.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Materials List & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Material Directory List (5 cols) */}
        <div className="lg:col-span-5 space-y-2 max-h-[720px] overflow-y-auto pr-1">
          <div className="text-xs uppercase font-semibold text-slate-400 px-1 mb-2">
            Showing {filteredMaterials.length} dangerous goods matching criteria
          </div>
          {filteredMaterials.map((mat) => {
            const isSelected = activeMaterial?.unNumber === mat.unNumber;
            return (
              <div
                key={mat.unNumber}
                onClick={() => setSelectedUnNumber(mat.unNumber)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-red-950/40 border-red-500 shadow-md ring-1 ring-red-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                        {mat.unNumber}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${getClassBadgeStyle(
                          mat.primaryClass
                        )}`}
                      >
                        CLASS {mat.primaryClass}
                      </span>
                      {mat.packingGroup !== 'NONE' && (
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          PG {mat.packingGroup}
                        </span>
                      )}
                      {mat.marinePollutant && (
                        <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-1.5 py-0.5 rounded">
                          MARINE POLLUTANT
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-slate-200 line-clamp-2">
                      {mat.properShippingName}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400">ERG Guide</div>
                    <div className="text-sm font-bold font-mono text-amber-400">
                      #{mat.ergGuideNumber}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Plane className="h-3 w-3 text-slate-500" />
                    <span>
                      Pax:{' '}
                      <strong className={mat.airPassengerMaxNetQtyKg === 0 ? 'text-red-400' : 'text-slate-300'}>
                        {mat.airPassengerMaxNetQtyKg === 0 ? 'FORBIDDEN' : `${mat.airPassengerMaxNetQtyKg}kg`}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Compass className="h-3 w-3 text-slate-500" />
                    <span>
                      Isolation: <strong className="text-amber-300">{mat.initialIsolationDistanceMeters}m</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="h-3 w-3 text-slate-500" />
                    <span>
                      Tunnel: <strong className="text-cyan-300">[{mat.tunnelRestrictionCode}]</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Deep Regulatory Inspector & Multi-modal Simulator (7 cols) */}
        {activeMaterial ? (
          <div className="lg:col-span-7 space-y-6">
            {/* Regulatory Dossier Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                {/* Visual Placard */}
                <div className="py-8 shrink-0">
                  {getPlacardVisual(activeMaterial)}
                </div>

                {/* Dossier Meta */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-black text-white bg-slate-950 px-3 py-1 rounded-lg border border-slate-700">
                      {activeMaterial.unNumber}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md border ${getClassBadgeStyle(
                        activeMaterial.primaryClass
                      )}`}
                    >
                      CLASS {activeMaterial.primaryClass}
                    </span>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-md">
                      Packing Group {activeMaterial.packingGroup}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white leading-snug">
                    {activeMaterial.properShippingName}
                  </h2>

                  {activeMaterial.subsidiaryRisks.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <span className="text-slate-400">Subsidiary Hazards:</span>
                      {activeMaterial.subsidiaryRisks.map((sub) => (
                        <span
                          key={sub}
                          className="bg-red-950/60 text-red-300 border border-red-800 px-2 py-0.5 rounded text-[11px] font-mono"
                        >
                          Class {sub}
                        </span>
                      ))}
                    </div>
                  )}

                  {activeMaterial.specialProvisions.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-slate-400">Special Provisions:</span>
                      {activeMaterial.specialProvisions.map((sp) => (
                        <span
                          key={sp}
                          className="bg-slate-800 text-cyan-300 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-700"
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ERG 2024 Emergency Response Isolation Grid */}
              <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-center">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                    Initial Isolation Perimeter
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                    {activeMaterial.initialIsolationDistanceMeters} m
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ≈ {Math.round(activeMaterial.initialIsolationDistanceMeters * 3.28084)} feet all directions
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-center">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                    Day Protective Action
                  </div>
                  <div className="text-2xl font-black text-orange-400 font-mono mt-1">
                    {activeMaterial.protectiveActionDistanceDayMeters} m
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ≈ {(activeMaterial.protectiveActionDistanceDayMeters / 1000).toFixed(1)} km downwind
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-center">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                    Night Protective Action
                  </div>
                  <div className="text-2xl font-black text-red-400 font-mono mt-1">
                    {activeMaterial.protectiveActionDistanceNightMeters} m
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ≈ {(activeMaterial.protectiveActionDistanceNightMeters / 1000).toFixed(1)} km downwind
                  </div>
                </div>
              </div>

              {/* Emergency Response Fire Agent & Tunnel Directives */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-1">
                    Fire Extinguishing Agent
                  </div>
                  <div
                    className={`text-xs font-bold px-2 py-1 rounded inline-block ${
                      activeMaterial.fireExtinguishingAgent === 'DO_NOT_USE_WATER'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {activeMaterial.fireExtinguishingAgent.replace(/_/g, ' ')}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    {activeMaterial.fireExtinguishingAgent === 'DO_NOT_USE_WATER'
                      ? 'DANGER: Highly violent reaction with water or water-based foam. Suppress with dry powder or sand.'
                      : 'Standard foam or spray suppression approved under ERG Guide #' +
                        activeMaterial.ergGuideNumber}
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-1">
                    ADR European Tunnel Category
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
                      Category [{activeMaterial.tunnelRestrictionCode}]
                    </span>
                    <span className="text-xs text-slate-300">
                      {activeMaterial.tunnelRestrictionCode === 'B'
                        ? 'Restricted in Category B, C, D, E tunnels'
                        : activeMaterial.tunnelRestrictionCode === 'E'
                        ? 'Restricted only in Category E tunnels'
                        : 'Restricted per ADR Chapter 8.6'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Multi-Modal Transport Feasibility Simulator */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">
                    Multi-Modal Feasibility & Segregation Simulator
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  IATA DGR Table 4.2 / 9.3.A
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Transport Mode
                  </label>
                  <select
                    value={simMode}
                    onChange={(e: any) => setSimMode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="AIR_PASSENGER">Commercial Passenger Aircraft (PAX)</option>
                    <option value="AIR_CARGO_ONLY">Cargo Aircraft Only (CAO Freighter)</option>
                    <option value="ROAD_TUNNEL">Road ADR Transport & Tunnels</option>
                    <option value="MARITIME_CONTAINER">Ocean Container (IMO IMDG)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Net Package Quantity (kg)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={simQuantityKg}
                    onChange={(e) => setSimQuantityKg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {simResult && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                    simResult.permitted
                      ? 'bg-emerald-950/30 border-emerald-700/60 text-emerald-200'
                      : 'bg-red-950/30 border-red-700/60 text-red-200'
                  }`}
                >
                  {simResult.permitted ? (
                    <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1">
                    <div className="font-bold text-sm">
                      {simResult.permitted
                        ? 'TRANSPORT AUTHORIZED UNDER DGR / DOT'
                        : 'TRANSPORT STRICTLY REJECTED / FORBIDDEN'}
                    </div>
                    <div className="text-xs opacity-90">{simResult.reason}</div>
                    <div className="text-[11px] opacity-75 font-mono pt-1">
                      Required Evacuation Buffer: {simResult.isolationRadiusMeters} meters | Response Guide #{simResult.ergGuideNumber}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 flex items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="text-center text-slate-500 space-y-2">
              <ShieldAlert className="h-10 w-10 mx-auto text-slate-600" />
              <p>Select a hazardous material or dangerous good from the catalog to view regulatory details.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
