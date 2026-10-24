/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Electronic Data Interchange (EDI) & Customs Tariff Studio
 */

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Code2,
  DollarSign,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Layers,
  Globe2,
} from 'lucide-react';
import {
  EdiCustomsService,
  HTS_DATABASE,
  EdiDocument,
} from '../../backend/services/ediCustomsService.ts';

export const EdiCustomsStudioView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EDI_TRANSLATOR' | 'TARIFF_CALCULATOR'>('EDI_TRANSLATOR');
  const [ediMode, setEdiMode] = useState<'RAW' | 'STRUCTURED'>('RAW');
  const [activeEdiDoc, setActiveEdiDoc] = useState<EdiDocument>(() =>
    EdiCustomsService.generateEdi204({
      waybillNumber: 'LGF-908124-EU',
      carrierScac: 'APEXL',
      originCity: 'Rotterdam',
      destinationCity: 'Hamburg',
      weightLbs: 40675,
    })
  );

  // Tariff Calculator State
  const [searchHtsQuery, setSearchHtsQuery] = useState('');
  const [selectedHsCode, setSelectedHsCode] = useState('8471.50.01');
  const [declaredValueUsd, setDeclaredValueUsd] = useState(725000);
  const [applyFta, setApplyFta] = useState(true);
  const [copied, setCopied] = useState(false);

  const filteredHts = EdiCustomsService.searchHtsCodes(searchHtsQuery);

  const dutyResult = EdiCustomsService.calculateCustomsDuty({
    hsCode: selectedHsCode,
    declaredValueUsd,
    originCountry: 'Netherlands',
    destinationCountry: 'United States',
    applyFtaPreference: applyFta,
  });

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(activeEdiDoc.rawAnsiX12);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGenerateEdi214 = () => {
    const doc = EdiCustomsService.generateEdi214({
      waybillNumber: 'LGF-908124-EU',
      statusCode: 'X6',
      locationCity: 'Rotterdam',
      statusDescription: 'En Route to Destination Hub',
    });
    setActiveEdiDoc(doc);
  };

  const handleGenerateEdi204 = () => {
    const doc = EdiCustomsService.generateEdi204({
      waybillNumber: 'LGF-908124-EU',
      carrierScac: 'APEXL',
      originCity: 'Rotterdam',
      destinationCity: 'Hamburg',
      weightLbs: 40675,
    });
    setActiveEdiDoc(doc);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Code2 className="h-6 w-6 text-cyan-400" />
            Electronic Data Interchange (EDI) &amp; Customs Tariff Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            ANSI X12 (204, 214, 856) syntax parser, Harmonized Tariff Schedule (HTS) lookups, and trade agreement duty calculations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('EDI_TRANSLATOR')}
            className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-colors ${
              activeTab === 'EDI_TRANSLATOR'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            EDI X12 Translator
          </button>
          <button
            onClick={() => setActiveTab('TARIFF_CALCULATOR')}
            className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-colors ${
              activeTab === 'TARIFF_CALCULATOR'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Customs HTS Tariff Engine
          </button>
        </div>
      </div>

      {/* View 1: EDI X12 Translator */}
      {activeTab === 'EDI_TRANSLATOR' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateEdi204}
                className={`px-3 py-1.5 text-xs rounded-lg font-mono font-bold border transition-colors ${
                  activeEdiDoc.transactionSet === 'EDI_204_LOAD_TENDER'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                EDI 204 (Motor Carrier Load Tender)
              </button>
              <button
                onClick={handleGenerateEdi214}
                className={`px-3 py-1.5 text-xs rounded-lg font-mono font-bold border transition-colors ${
                  activeEdiDoc.transactionSet === 'EDI_214_SHIPMENT_STATUS'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                EDI 214 (Shipment Status Message)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
                <button
                  onClick={() => setEdiMode('RAW')}
                  className={`px-2.5 py-1 rounded font-mono ${
                    ediMode === 'RAW' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Raw ANSI X12
                </button>
                <button
                  onClick={() => setEdiMode('STRUCTURED')}
                  className={`px-2.5 py-1 rounded font-mono ${
                    ediMode === 'STRUCTURED' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Parsed Segments
                </button>
              </div>

              <button
                onClick={handleCopyRaw}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Raw EDI'}</span>
              </button>
            </div>
          </div>

          {/* Raw or Structured Display */}
          {ediMode === 'RAW' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl font-mono text-xs overflow-x-auto text-cyan-300 leading-relaxed select-all">
              <pre className="whitespace-pre-wrap">{activeEdiDoc.rawAnsiX12}</pre>
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {activeEdiDoc.structuredSegments.map((seg, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-2">
                    <span className="text-cyan-400">Segment: {seg.segmentTag}</span>
                    <span className="text-slate-400 font-sans">{seg.description}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {seg.elements.map((el) => (
                      <div key={el.position} className="bg-slate-950 p-2 rounded border border-slate-800/80">
                        <div className="text-[10px] text-slate-500 font-bold">{el.position} ({el.label})</div>
                        <div className="text-slate-200 font-bold mt-0.5">{el.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View 2: Customs HTS Tariff Engine */}
      {activeTab === 'TARIFF_CALCULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* HTS Search List (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase text-slate-400">Harmonized Tariff Schedule (HTS)</h3>
              <span className="text-[10px] text-cyan-400 font-mono">WCO Standard</span>
            </div>

            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search HS code, description..."
                value={searchHtsQuery}
                onChange={(e) => setSearchHtsQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="space-y-2 max-h-[64vh] overflow-y-auto pr-1">
              {filteredHts.map((item) => {
                const isSelected = item.hsCode === selectedHsCode;
                return (
                  <div
                    key={item.hsCode}
                    onClick={() => setSelectedHsCode(item.hsCode)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-600 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-mono font-bold text-cyan-300">{item.hsCode}</div>
                    <div className="text-slate-200 font-medium mt-0.5">{item.description}</div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5 pt-1.5 border-t border-slate-800/80">
                      <span>General Duty: {item.generalDutyRatePercent}%</span>
                      {item.section301TariffPercent && (
                        <span className="text-amber-400">Section 301: +{item.section301TariffPercent}%</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Duty Computation Matrix (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Calculator className="h-4 w-4 text-cyan-400" />
                Customs Duty &amp; Trade Agreement Tariff Calculator
              </h3>
              <p className="text-xs text-slate-400">Grounded statutory import duty calculations</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Declared Commercial Customs Value ($USD)</label>
                <input
                  type="number"
                  value={declaredValueUsd}
                  onChange={(e) => setDeclaredValueUsd(Math.max(100, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="applyFtaCheck"
                  checked={applyFta}
                  onChange={(e) => setApplyFta(e.target.checked)}
                  className="accent-cyan-500 rounded"
                />
                <label htmlFor="applyFtaCheck" className="text-xs text-slate-300 cursor-pointer">
                  Apply Free Trade Agreement (FTA) Preferential Exemption Certificate
                </label>
              </div>

              {/* Duty Breakdown Result Card */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Classified HS Code:</span>
                  <span className="font-bold text-cyan-300">{dutyResult.hsCode}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Statutory Base Duty:</span>
                  <span className="font-bold text-slate-200">${dutyResult.baseDutyUsd.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Section 301 Tariff Surcharge:</span>
                  <span className="font-bold text-amber-400">${dutyResult.section301Usd.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="font-bold text-white">Total Customs Duty Payable:</span>
                  <span className="font-black text-emerald-400">
                    ${dutyResult.totalDutyPayableUsd.toLocaleString()} USD ({dutyResult.effectiveDutyRatePercent}%)
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <strong className="text-slate-300">Statutory Trade Rule Note: </strong>
                {dutyResult.tradeAgreementNote}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
