/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Global Trade Compliance & Sanctions Screening View
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Printer,
  FileCheck2,
  Scale,
  Globe2,
} from 'lucide-react';
import {
  TradeSanctionsService,
  ScreeningMatchResult,
  TradeComplianceAuditCertificate,
} from '../../backend/services/tradeSanctionsService.ts';

export const TradeSanctionsView: React.FC = () => {
  const [screenQuery, setScreenQuery] = useState('Volga-Don Maritime');
  const [matches, setMatches] = useState<ScreeningMatchResult[]>(() =>
    TradeSanctionsService.screenParty('Volga-Don Maritime')
  );

  // Certificate Generator State
  const [testWaybill, setTestWaybill] = useState('LGF-908124-EU');
  const [testShipper, setTestShipper] = useState('Apex Europort Logistics BV');
  const [testConsignee, setTestConsignee] = useState('Altenwerder Central Hub');
  const [testVessel, setTestVessel] = useState('Ever Glory (IMO 9812401)');
  const [testEccn, setTestEccn] = useState('5A002.a');
  const [activeCertificate, setActiveCertificate] = useState<TradeComplianceAuditCertificate | null>(null);

  const handleExecuteScreening = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenQuery.trim()) return;
    const res = TradeSanctionsService.screenParty(screenQuery);
    setMatches(res);
  };

  const handleGenerateCertificate = () => {
    const cert = TradeSanctionsService.generateScreeningCertificate({
      waybillNumber: testWaybill,
      shipper: testShipper,
      consignee: testConsignee,
      carrierVessel: testVessel,
      eccn: testEccn,
    });
    setActiveCertificate(cert);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-cyan-400" />
            Global Trade Compliance, Sanctions Screening &amp; Export Controls
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Levenshtein fuzzy screening against OFAC SDN, EU Consolidated, UN Security Council, and BIS Entity Lists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-cyan-400" />
            4 Regulatory Watchlists Synchronized
          </span>
        </div>
      </div>

      {/* Screen Query Input Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <h3 className="font-bold text-sm text-white">Live Denied Parties &amp; Vessel Watchlist Screener</h3>
        <form onSubmit={handleExecuteScreening} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Enter consignee, company name, vessel IMO, or ultimate beneficial owner..."
              value={screenQuery}
              onChange={(e) => setScreenQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs transition-colors shadow-md"
          >
            Execute Fuzzy Scan
          </button>
        </form>
      </div>

      {/* Screening Match Results */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Screening Results for "{screenQuery}"</span>
          <span className="font-mono text-cyan-400">{matches.length} Matches Found</span>
        </div>

        {matches.length === 0 ? (
          <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-6 text-center text-emerald-300 text-xs space-y-1">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" />
            <div className="font-bold text-sm">Clear: No Sanctions Match Detected</div>
            <p className="text-slate-400 text-[11px]">
              Query scored below 60% Levenshtein similarity threshold across all OFAC, EU, UN, and BIS watchlists.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border space-y-2 font-mono text-xs ${
                  match.riskClassification === 'CRITICAL_MATCH'
                    ? 'bg-red-950/40 border-red-800'
                    : 'bg-amber-950/40 border-amber-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm font-sans">{match.matchedEntity.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-black/40 text-red-400 border border-red-800">
                    {match.matchScorePercent}% Similarity • {match.matchedEntity.sanctionList}
                  </span>
                </div>

                <div className="text-slate-300 font-sans text-[11px]">
                  Country: <strong>{match.matchedEntity.country}</strong> • Entity Type: {match.matchedEntity.entityType} • Aliases: {match.matchedEntity.aliases.join(', ')}
                </div>

                <div className="text-slate-400 font-sans text-[11px]">
                  Reason: {match.matchedEntity.reason}
                </div>

                <div className="p-2.5 rounded bg-black/40 text-red-300 text-[11px] font-sans font-semibold border border-red-900/60 mt-2">
                  Action Mandate: {match.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Automated Trade Compliance Audit Certificate Generator */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-emerald-400" />
              Automated Export Control &amp; Sanctions Clearance Certificate
            </h3>
            <p className="text-xs text-slate-400">Generate cryptographically verifiable customs clearance documentation</p>
          </div>
          <button
            onClick={handleGenerateCertificate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-md"
          >
            Generate Clearance Certificate
          </button>
        </div>

        {activeCertificate && (
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 font-mono text-xs animate-fadeIn">
            <div className="flex justify-between items-start border-b border-slate-800 pb-2">
              <div>
                <span className="font-bold text-white font-sans text-sm">{activeCertificate.certificateId}</span>
                <div className="text-[10px] text-slate-500">Waybill: {activeCertificate.waybillNumber}</div>
              </div>
              <span
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  activeCertificate.complianceDecision === 'APPROVED_CLEAR'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {activeCertificate.complianceDecision.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>Shipper: <strong>{activeCertificate.shipperName}</strong></div>
              <div>Consignee: <strong>{activeCertificate.consigneeName}</strong></div>
              <div>Vessel: {activeCertificate.carrierVesselName}</div>
              <div>ECCN: <strong className="text-cyan-300">{activeCertificate.exportControlClassificationEccn}</strong></div>
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-500">
              <span>Watchlists Screened: {activeCertificate.screenedListsCount} Official Lists</span>
              <span>Signature: {activeCertificate.digitalSignature}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
