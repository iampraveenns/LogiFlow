/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Train,
  Layers,
  Zap,
  Weight,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { 
  IntermodalRailService, 
  UnitTrainManifest, 
  IntermodalContainerUnit 
} from '../../backend/services/intermodalRailService.ts';

export const IntermodalRailView: React.FC = () => {
  const [trains] = useState<UnitTrainManifest[]>(IntermodalRailService.getUnitTrains());
  const [selectedTrainSymbol, setSelectedTrainSymbol] = useState<string>(trains[0]?.trainSymbol || 'S-LATCHI-1-24');
  const [activeTab, setActiveTab] = useState<'UNIT_TRAINS' | 'DOUBLE_STACK_CHECK' | 'ENERGY_RECOVERY'>('UNIT_TRAINS');

  // Interactive Double Stack Verification form
  const [bottomSize, setBottomSize] = useState<20 | 40 | 45 | 53>(53);
  const [bottomWeightLbs, setBottomWeightLbs] = useState<number>(45000);
  const [topSize, setTopSize] = useState<20 | 40 | 45 | 53>(53);
  const [topWeightLbs, setTopWeightLbs] = useState<number>(38000);
  const [isTopHazmat, setIsTopHazmat] = useState<boolean>(false);

  // Dynamic Braking form
  const [trainWeightTons, setTrainWeightTons] = useState<number>(11200);
  const [gradePercent, setGradePercent] = useState<number>(2.2);
  const [distanceMiles, setDistanceMiles] = useState<number>(28);

  const selectedTrain = useMemo(() => {
    return trains.find(t => t.trainSymbol === selectedTrainSymbol) || trains[0];
  }, [trains, selectedTrainSymbol]);

  // Double stack validation check
  const doubleStackValidation = useMemo(() => {
    const bottom: IntermodalContainerUnit = {
      containerNumber: 'BNSU-TEST-01',
      sizeFt: bottomSize,
      tareWeightLbs: 9500,
      cargoWeightLbs: bottomWeightLbs - 9500,
      totalWeightLbs: bottomWeightLbs,
      isHazmat: false,
      destinationRampCode: 'CHI_CLEARING',
      isReefer: false
    };

    const top: IntermodalContainerUnit = {
      containerNumber: 'JBHU-TEST-02',
      sizeFt: topSize,
      tareWeightLbs: 9400,
      cargoWeightLbs: topWeightLbs - 9400,
      totalWeightLbs: topWeightLbs,
      isHazmat: isTopHazmat,
      unNumber: isTopHazmat ? 'UN1993' : undefined,
      destinationRampCode: 'CHI_CLEARING',
      isReefer: false
    };

    return IntermodalRailService.validateDoubleStackPair(bottom, top);
  }, [bottomSize, bottomWeightLbs, topSize, topWeightLbs, isTopHazmat]);

  // Dynamic braking calculation
  const dynamicBraking = useMemo(() => {
    return IntermodalRailService.calculateRegenerativeEnergyRecovery(
      trainWeightTons,
      gradePercent,
      distanceMiles,
      45
    );
  }, [trainWeightTons, gradePercent, distanceMiles]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Train className="h-6 w-6 text-sky-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">Class I Intermodal Rail &amp; Unit Train Scheduling</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            286k Gross Rail Load (GRL) double-stack clearance, Hump yard bowl track classification, and AC regenerative braking physics.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('UNIT_TRAINS')}
            className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === 'UNIT_TRAINS' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Unit Trains Mainline
          </button>
          <button
            onClick={() => setActiveTab('DOUBLE_STACK_CHECK')}
            className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === 'DOUBLE_STACK_CHECK' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            AAR Double-Stack Validator
          </button>
          <button
            onClick={() => setActiveTab('ENERGY_RECOVERY')}
            className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === 'ENERGY_RECOVERY' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Regenerative Braking
          </button>
        </div>
      </div>

      {activeTab === 'UNIT_TRAINS' && (
        <div className="space-y-6">
          {/* Active Trains Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trains.map(t => (
              <div
                key={t.trainSymbol}
                onClick={() => setSelectedTrainSymbol(t.trainSymbol)}
                className={`cursor-pointer rounded-xl p-5 border transition ${
                  selectedTrainSymbol === t.trainSymbol
                    ? 'bg-slate-900 border-sky-500 ring-1 ring-sky-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Train className="h-5 w-5 text-sky-400" />
                    <span className="font-bold text-white font-mono text-base">{t.trainSymbol}</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
                    {t.operatingRailroad}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 mb-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div>Tonnage: <span className="text-emerald-400 font-bold">{t.totalTrailingTonnageTons.toLocaleString()} Tons</span></div>
                  <div>Length: <span className="text-sky-300 font-bold">{t.totalTrainLengthFeet.toLocaleString()} Feet</span></div>
                  <div>Power: <span className="text-purple-400 font-bold">{t.totalHorsepowerHp.toLocaleString()} HP</span></div>
                  <div>Speed: <span className="text-amber-400 font-bold">{t.averageSpeedMph} MPH</span></div>
                </div>

                <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
                  <span>{t.originIntermodalRamp}</span>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                  <span className="font-bold text-white">{t.destinationIntermodalRamp}</span>
                </div>

                <div className="text-[11px] font-mono text-slate-500 mt-2">
                  Position: {t.currentMilepost}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Train Manifest & Well Cars */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-semibold text-white mb-2">
              Well-Car Consist &amp; Stacking Manifest ({selectedTrain.trainSymbol})
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Real-time axle load weighing from wayside wheel impact load detectors (WILD).
            </p>

            <div className="space-y-3">
              {selectedTrain.slots.map(slot => (
                <div key={slot.wellCarId} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Layers className="h-5 w-5 text-sky-400" />
                    <div>
                      <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                        {slot.wellCarId} ({slot.wellType.replace(/_/g, ' ')})
                        {slot.overweightViolation && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-red-900/60 text-red-300 border border-red-500">
                            GRL EXCEEDED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Top: {slot.topContainer?.containerNumber || 'EMPTY'} ({slot.topContainer?.sizeFt}ft • {slot.topContainer?.totalWeightLbs.toLocaleString()} lbs)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Bottom: {slot.bottomContainer?.containerNumber || 'EMPTY'} ({slot.bottomContainer?.sizeFt}ft • {slot.bottomContainer?.totalWeightLbs.toLocaleString()} lbs)
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <div className="text-slate-400">Wayside Axle Load</div>
                    <div className="text-base font-bold text-emerald-400">{slot.wellAxleWeightLbs.toLocaleString()} lbs</div>
                    <div className="text-[10px] text-slate-500">Max Limit: 286,000 lbs GRL</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'DOUBLE_STACK_CHECK' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Weight className="h-5 w-5 text-sky-400" />
              Double-Stack Configuration Workbench
            </h3>
            <p className="text-xs text-slate-400">
              Evaluates AAR Rule 29 size ordering, overturning roll moment stability (&le;115% top-to-bottom ratio), and track GRL.
            </p>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Bottom Well Container</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Length</label>
                  <select
                    value={bottomSize}
                    onChange={e => setBottomSize(parseInt(e.target.value) as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                  >
                    <option value={53}>53 Foot High-Cube</option>
                    <option value={45}>45 Foot Maritime</option>
                    <option value={40}>40 Foot ISO Standard</option>
                    <option value={20}>20 Foot Intermodal</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Gross Weight (lbs)</label>
                  <input
                    type="number"
                    value={bottomWeightLbs}
                    onChange={e => setBottomWeightLbs(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Top Stowed Container</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Length</label>
                  <select
                    value={topSize}
                    onChange={e => setTopSize(parseInt(e.target.value) as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                  >
                    <option value={53}>53 Foot High-Cube</option>
                    <option value={45}>45 Foot Maritime</option>
                    <option value={40}>40 Foot ISO Standard</option>
                    <option value={20}>20 Foot Intermodal</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Gross Weight (lbs)</label>
                  <input
                    type="number"
                    value={topWeightLbs}
                    onChange={e => setTopWeightLbs(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="topHazmatCheck"
                  checked={isTopHazmat}
                  onChange={e => setIsTopHazmat(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800"
                />
                <label htmlFor="topHazmatCheck" className="text-xs text-slate-300">
                  Container contains DOT Placarded Hazardous Materials (UN1993)
                </label>
              </div>
            </div>
          </div>

          {/* Validation Result Output */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">AAR Safety &amp; Clearance Verdict</h3>
              <span className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                doubleStackValidation.isValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {doubleStackValidation.isValid ? 'PERMITTED FOR MAINLINE' : 'REJECTED - SAFETY HAZARD'}
              </span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Well Car Gross Weight:</span>
                <span className={doubleStackValidation.totalWeightLbs > 286000 ? 'text-red-400 font-bold' : 'text-white'}>
                  {doubleStackValidation.totalWeightLbs.toLocaleString()} lbs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Top-to-Bottom Weight Ratio:</span>
                <span className={doubleStackValidation.weightDistributionRatio > 1.15 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {(doubleStackValidation.weightDistributionRatio * 100).toFixed(0)}% (Max 115%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Track GRL Safety Margin:</span>
                <span className="text-sky-300">
                  {Math.max(0, 286000 - doubleStackValidation.totalWeightLbs).toLocaleString()} lbs remaining
                </span>
              </div>
            </div>

            {doubleStackValidation.violations.length > 0 && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 space-y-2">
                <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" />
                  Mandatory FRA &amp; AAR Violations Detected:
                </div>
                <ul className="space-y-1 text-xs text-red-300 list-disc list-inside">
                  {doubleStackValidation.violations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            )}

            {doubleStackValidation.isValid && (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>Pairing cleared for 70 MPH intermodal corridor transit across Class 4/5 track.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ENERGY_RECOVERY' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              Mountain Descent Parameters
            </h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Train Trailing Tonnage (Tons)</label>
              <input
                type="number"
                value={trainWeightTons}
                onChange={e => setTrainWeightTons(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Downhill Track Grade (%)</label>
              <input
                type="number"
                step="0.1"
                value={gradePercent}
                onChange={e => setGradePercent(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
              />
              <div className="text-[10px] text-slate-500 mt-1">Cajon Pass: 2.2% • Tehachapi: 2.4%</div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Descent Distance (Miles)</label>
              <input
                type="number"
                value={distanceMiles}
                onChange={e => setDistanceMiles(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white">Dynamic Regenerative Inverter Energy Yield</h3>
            <p className="text-xs text-slate-400">
              AC traction motors invert kinetic and potential gravitational energy into electrical energy stored in locomotive battery tender cars.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Recovered Grid Power</div>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  {dynamicBraking.recoveredKwh.toLocaleString()} kWh
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">78% Inverter Efficiency</div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Diesel Fuel Offset</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {dynamicBraking.dieselGallonsOffset} Gallons
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Direct Fuel Savings</div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">CO2 Abatement</div>
                <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                  {dynamicBraking.co2SavedKg.toLocaleString()} kg
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">EPA Tier 4 Compliance</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
