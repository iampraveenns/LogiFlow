/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  DollarSign,
  Percent,
  ShieldCheck,
  Globe,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  CustomsTariffEngine, 
  HtsCodeDefinition, 
  LandedCostCalculationRequest 
} from '../../backend/services/customsTariffEngine.ts';

export const CustomsTariffView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHtsCode, setSelectedHtsCode] = useState<string>('8542.31.00.01');
  const [activeTab, setActiveTab] = useState<'LANDED_COST' | 'HTS_DIRECTORY'>('LANDED_COST');

  // Landed cost calculator state
  const [commercialValue, setCommercialValue] = useState<number>(185000);
  const [freightCost, setFreightCost] = useState<number>(6800);
  const [insuranceCost, setInsuranceCost] = useState<number>(450);
  const [originCountry, setOriginCountry] = useState<string>('CN');
  const [isUsmcaCertified, setIsUsmcaCertified] = useState<boolean>(false);
  const [portOfEntry, setPortOfEntry] = useState<string>('USLAX');

  // Filtered HTS items
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return Object.values(CustomsTariffEngine.HTS_REGISTRY);
    }
    return CustomsTariffEngine.searchHtsCodes(searchQuery);
  }, [searchQuery]);

  // Selected HTS Definition
  const currentHts = useMemo(() => {
    return CustomsTariffEngine.HTS_REGISTRY[selectedHtsCode] || Object.values(CustomsTariffEngine.HTS_REGISTRY)[0];
  }, [selectedHtsCode]);

  // Compute Landed Cost Breakdown
  const landedCostReport = useMemo(() => {
    return CustomsTariffEngine.calculateLandedCost({
      htsCode: currentHts.htsCode,
      countryOfOriginIso2: originCountry,
      commercialValueUsd: commercialValue,
      freightCostUsd: freightCost,
      insuranceCostUsd: insuranceCost,
      isUsmcaOriginCertified: isUsmcaCertified,
      portOfEntryIcaoOrCode: portOfEntry
    });
  }, [currentHts, originCountry, commercialValue, freightCost, insuranceCost, isUsmcaCertified, portOfEntry]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-sky-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">Customs Tariff (HTS) &amp; Total Landed Cost Engine</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Section 301 punitive tariffs, AD/CVD cash deposits, CBP MPF/HMF statutory fees, and USMCA preferential rules of origin.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('LANDED_COST')}
            className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === 'LANDED_COST' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Landed Cost Calculator
          </button>
          <button
            onClick={() => setActiveTab('HTS_DIRECTORY')}
            className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === 'HTS_DIRECTORY' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            HTS Tariff Schedule
          </button>
        </div>
      </div>

      {activeTab === 'LANDED_COST' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Shipment Parameters Form */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-400" />
                Customs Entry Parameters
              </h3>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Target HTS Subheading</label>
                <select
                  value={selectedHtsCode}
                  onChange={e => setSelectedHtsCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
                >
                  {Object.values(CustomsTariffEngine.HTS_REGISTRY).map(h => (
                    <option key={h.htsCode} value={h.htsCode}>
                      {h.htsCode} — {h.description.substring(0, 45)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Country of Origin (ISO-2)</label>
                <select
                  value={originCountry}
                  onChange={e => setOriginCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
                >
                  <option value="CN">CN — China (Section 301 Subject)</option>
                  <option value="MX">MX — Mexico (USMCA Eligible)</option>
                  <option value="CA">CA — Canada (USMCA Eligible)</option>
                  <option value="DE">DE — Germany (EU MFN)</option>
                  <option value="VN">VN — Vietnam (ASEAN)</option>
                  <option value="KR">KR — South Korea (KORUS FTA)</option>
                  <option value="JP">JP — Japan (US-Japan Trade Agreement)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Commercial FOB Invoice Value ($ USD)</label>
                <input
                  type="number"
                  value={commercialValue}
                  onChange={e => setCommercialValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Ocean/Air Freight ($)</label>
                  <input
                    type="number"
                    value={freightCost}
                    onChange={e => setFreightCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Cargo Insurance ($)</label>
                  <input
                    type="number"
                    value={insuranceCost}
                    onChange={e => setInsuranceCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">U.S. Port of Entry</label>
                <select
                  value={portOfEntry}
                  onChange={e => setPortOfEntry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono"
                >
                  <option value="USLAX">USLAX — Port of Los Angeles (Ocean HMF Applies)</option>
                  <option value="USNYC">USNYC — Port of New York / New Jersey</option>
                  <option value="USORD">USORD — Chicago O'Hare Air Cargo Port</option>
                  <option value="USLRD">USLRD — Laredo Land Border Port of Entry</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="usmcaCheck"
                    checked={isUsmcaCertified}
                    onChange={e => setIsUsmcaCertified(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800"
                  />
                  <label htmlFor="usmcaCheck" className="text-xs text-slate-300">
                    Certified USMCA Certificate of Origin on File
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Landed Cost Duty Breakdown & Regulatory Notes */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-sky-400 font-bold">{landedCostReport.htsCode}</div>
                  <h3 className="text-base font-bold text-white mt-0.5">{landedCostReport.description}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Effective Duty Rate</div>
                  <div className="text-xl font-bold font-mono text-amber-400">
                    {landedCostReport.effectiveDutyRatePercent}%
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Customs FOB Value</div>
                  <div className="text-sm font-mono font-bold text-white mt-1">
                    ${landedCostReport.customsValueUsd.toLocaleString()}
                  </div>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Total Duties &amp; Taxes</div>
                  <div className="text-sm font-mono font-bold text-red-400 mt-1">
                    ${landedCostReport.totalDutiesTaxesUsd.toLocaleString()}
                  </div>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Freight &amp; Insurance</div>
                  <div className="text-sm font-mono font-bold text-sky-300 mt-1">
                    ${(freightCost + insuranceCost).toLocaleString()}
                  </div>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Final Landed Cost</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                    ${landedCostReport.totalLandedCostUsd.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Detailed Itemized Line Items Table */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">MFN General Ad Valorem Duty ({currentHts.mfnGeneralRatePercent}%)</span>
                  <span className="text-white">${landedCostReport.generalMfnDutyUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Section 301 China Punitive Tariff ({currentHts.section301RatePercent || 0}%)</span>
                  <span className={landedCostReport.section301DutyUsd > 0 ? 'text-red-400 font-bold' : 'text-slate-500'}>
                    ${landedCostReport.section301DutyUsd.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Antidumping / Countervailing Duty (AD/CVD)</span>
                  <span className={landedCostReport.adCvdDutyUsd > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                    ${landedCostReport.adCvdDutyUsd.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">CBP Merchandise Processing Fee (MPF 0.3464%)</span>
                  <span className="text-white">${landedCostReport.merchandiseProcessingFeeUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">CBP Harbor Maintenance Fee (HMF 0.125%)</span>
                  <span className="text-white">${landedCostReport.harborMaintenanceFeeUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 font-bold text-sm">
                  <span className="text-slate-200">Total Statutory Assessment:</span>
                  <span className="text-emerald-400">${landedCostReport.totalDutiesTaxesUsd.toLocaleString()}</span>
                </div>
              </div>

              {/* Compliance Notes & Statutory Exemptions */}
              {landedCostReport.complianceNotes.length > 0 && (
                <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-800/60 space-y-1.5 text-xs text-sky-200">
                  <div className="font-semibold text-sky-300 flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="h-4 w-4" />
                    Customs Brokerage Filing Annotations:
                  </div>
                  {landedCostReport.complianceNotes.map((n, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="text-sky-400">•</span> {n}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'HTS_DIRECTORY' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search HTS code, semiconductor, EV, vaccine..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white"
              />
            </div>
            <span className="text-xs font-mono text-slate-400">
              Showing {searchResults.length} Tariff Subheadings
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <th className="p-3">HTS Code</th>
                  <th className="p-3">Commodity Description</th>
                  <th className="p-3">MFN General</th>
                  <th className="p-3">Section 301</th>
                  <th className="p-3">USMCA Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {searchResults.map(item => (
                  <tr key={item.htsCode} className="hover:bg-slate-800/40">
                    <td className="p-3 text-sky-400 font-bold">{item.htsCode}</td>
                    <td className="p-3 text-slate-200 font-sans max-w-md">{item.description}</td>
                    <td className="p-3 text-emerald-400">{item.mfnGeneralRatePercent}%</td>
                    <td className="p-3">
                      {item.section301RatePercent ? (
                        <span className="text-red-400 font-bold">{item.section301RatePercent}%</span>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                    <td className="p-3">
                      {item.usmcaEligible ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Eligible
                        </span>
                      ) : (
                        <span className="text-slate-500">Non-Originating</span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setSelectedHtsCode(item.htsCode);
                          setActiveTab('LANDED_COST');
                        }}
                        className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-sans transition"
                      >
                        Calculate Duty
                      </button>
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
