/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Truck,
  Plane,
  Ship,
  Train,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  Fuel,
  Info,
  ShieldCheck
} from 'lucide-react';
import { 
  FreightRatingEngine, 
  FreightRateRequest, 
  TransportMode 
} from '../../backend/services/freightRatingEngine.ts';

export const FreightRatingView: React.FC = () => {
  const [transportMode, setTransportMode] = useState<TransportMode>('LTL');
  const [actualWeightLbs, setActualWeightLbs] = useState<number>(1450);
  const [lengthIn, setLengthIn] = useState<number>(48);
  const [widthIn, setWidthIn] = useState<number>(40);
  const [heightIn, setHeightIn] = useState<number>(56);
  const [originZip, setOriginZip] = useState<string>('60666'); // Chicago O'Hare
  const [destZip, setDestZip] = useState<string>('90210');   // Beverly Hills / LA

  // Accessorial checkboxes
  const [liftgateDelivery, setLiftgateDelivery] = useState<boolean>(true);
  const [residentialDelivery, setResidentialDelivery] = useState<boolean>(false);
  const [insideDelivery, setInsideDelivery] = useState<boolean>(false);
  const [hazardousMaterials, setHazardousMaterials] = useState<boolean>(false);
  const [protectFromFreezing, setProtectFromFreezing] = useState<boolean>(false);

  // Compute live quote
  const rateQuote = useMemo(() => {
    return FreightRatingEngine.calculateRateQuote({
      originPostalCode: originZip,
      destinationPostalCode: destZip,
      originCountry: 'US',
      destinationCountry: 'US',
      transportMode,
      actualWeightLbs,
      dimensionsInches: [lengthIn, widthIn, heightIn],
      isStackable: true,
      accessorials: {
        liftgateDelivery,
        residentialDelivery,
        insideDelivery,
        hazardousMaterials,
        protectFromFreezingReefer: protectFromFreezing
      }
    });
  }, [transportMode, actualWeightLbs, lengthIn, widthIn, heightIn, originZip, destZip, liftgateDelivery, residentialDelivery, insideDelivery, hazardousMaterials, protectFromFreezing]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-sky-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">Multi-Modal Freight Rating &amp; Contract Tariffs</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Dynamic NMFC 18-tier density rating, dimensional weight divisors (DIM 139/166), and DOE diesel fuel surcharge index.
          </p>
        </div>

        {/* Current DOE Diesel Index Badge */}
        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">
          <Fuel className="h-4 w-4 text-amber-400" />
          <span className="text-slate-400">DOE Diesel Index:</span>
          <span className="text-white font-bold">${FreightRatingEngine.CURRENT_DOE_DIESEL_PRICE.toFixed(3)}/gal</span>
          <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
            FSC: {rateQuote.fuelSurchargePercent}%
          </span>
        </div>
      </div>

      {/* Main Rating Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Rating Form */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Transport Mode &amp; Routing</h3>

            {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTransportMode('LTL')}
                className={`p-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  transportMode === 'LTL' ? 'bg-sky-600 border-sky-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <Truck className="h-4 w-4" />
                <span>LTL Freight</span>
              </button>
              <button
                type="button"
                onClick={() => setTransportMode('AIR_FREIGHT')}
                className={`p-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  transportMode === 'AIR_FREIGHT' ? 'bg-sky-600 border-sky-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <Plane className="h-4 w-4" />
                <span>Air Freight</span>
              </button>
              <button
                type="button"
                onClick={() => setTransportMode('RAIL_INTERMODAL')}
                className={`p-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  transportMode === 'RAIL_INTERMODAL' ? 'bg-sky-600 border-sky-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <Train className="h-4 w-4" />
                <span>Intermodal Rail</span>
              </button>
            </div>

            {/* Postal codes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Origin Zip Code</label>
                <input
                  type="text"
                  value={originZip}
                  onChange={e => setOriginZip(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Destination Zip</label>
                <input
                  type="text"
                  value={destZip}
                  onChange={e => setDestZip(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Weight and Dimensions */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Actual Scale Weight (lbs)</label>
                <input
                  type="number"
                  value={actualWeightLbs}
                  onChange={e => setActualWeightLbs(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Dimensions (L x W x H Inches)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={lengthIn}
                    onChange={e => setLengthIn(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-mono text-center"
                    placeholder="L"
                  />
                  <input
                    type="number"
                    value={widthIn}
                    onChange={e => setWidthIn(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-mono text-center"
                    placeholder="W"
                  />
                  <input
                    type="number"
                    value={heightIn}
                    onChange={e => setHeightIn(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-mono text-center"
                    placeholder="H"
                  />
                </div>
              </div>
            </div>

            {/* Accessorials */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 block">Accessorial Services</label>
              <div className="space-y-1.5 text-xs text-slate-300">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={liftgateDelivery}
                    onChange={e => setLiftgateDelivery(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800"
                  />
                  Liftgate Delivery ($75.00)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={residentialDelivery}
                    onChange={e => setResidentialDelivery(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800"
                  />
                  Residential Delivery ($95.00)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={insideDelivery}
                    onChange={e => setInsideDelivery(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800"
                  />
                  Inside Delivery &amp; Placement ($120.00)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hazardousMaterials}
                    onChange={e => setHazardousMaterials(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800"
                  />
                  DOT Placarded Hazmat ($175.00)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={protectFromFreezing}
                    onChange={e => setProtectFromFreezing(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800"
                  />
                  Protect From Freezing / Reefer ($110.00)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quote Breakdown & NMFC Density Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400">Quote ID: {rateQuote.quoteId}</span>
                <h3 className="text-xl font-bold text-white mt-0.5">${rateQuote.totalFreightCostUsd.toLocaleString()}</h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Transit: ~{rateQuote.transitDaysEstimate} Business Day(s) • Contract: {rateQuote.carrierContractName}
                </div>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-mono text-xs font-bold">
                  NMFC CLASS {rateQuote.nmfcClass}
                </span>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  Density: {rateQuote.densityPcf} lbs/cu.ft
                </div>
              </div>
            </div>

            {/* Density & Volumetric Weight Analysis */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Actual Weight</div>
                <div className="text-sm font-mono font-bold text-white mt-1">
                  {rateQuote.actualWeightLbs.toLocaleString()} lbs
                </div>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Dimensional Weight</div>
                <div className="text-sm font-mono font-bold text-purple-400 mt-1">
                  {rateQuote.dimensionalWeightLbs.toLocaleString()} lbs
                </div>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Billed Weight</div>
                <div className="text-sm font-mono font-bold text-sky-400 mt-1">
                  {rateQuote.billedWeightLbs.toLocaleString()} lbs
                </div>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Fuel Surcharge</div>
                <div className="text-sm font-mono font-bold text-amber-400 mt-1">
                  ${rateQuote.fuelSurchargeUsd.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Cost Breakdown Ledger */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Base Hundredweight (CWT) Linehaul</span>
                <span className="text-white">${rateQuote.baseFreightRateUsd.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">National Diesel Fuel Surcharge ({rateQuote.fuelSurchargePercent}%)</span>
                <span className="text-amber-400">${rateQuote.fuelSurchargeUsd.toLocaleString()}</span>
              </div>

              {rateQuote.accessorialsBreakdown.map(acc => (
                <div key={acc.code} className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">{acc.name} ({acc.code})</span>
                  <span className="text-sky-300">${acc.rateUsd.toFixed(2)}</span>
                </div>
              ))}

              <div className="flex justify-between pt-2 font-bold text-sm">
                <span className="text-slate-200">Guaranteed Freight Total:</span>
                <span className="text-emerald-400">${rateQuote.totalFreightCostUsd.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>
                Tariff lock guaranteed through {new Date(rateQuote.validUntilIso).toLocaleDateString()}. EDI 204 electronic load tendering ready.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
