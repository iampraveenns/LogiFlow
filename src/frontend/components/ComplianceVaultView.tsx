/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Customs & Compliance Document Vault
 */

import React, { useState } from 'react';
import {
  FileCheck2,
  ShieldCheck,
  Search,
  Lock,
  Printer,
  FileText,
  AlertTriangle,
  QrCode,
  Download,
} from 'lucide-react';
import { WaybillDocument } from '../../packages/shared-types/index.ts';
import { DocumentComplianceService, GeneratedBillOfLading } from '../../backend/services/documentComplianceService.ts';

interface ComplianceVaultViewProps {
  waybills: WaybillDocument[];
}

export const ComplianceVaultView: React.FC<ComplianceVaultViewProps> = ({ waybills }) => {
  const [selectedWaybill, setSelectedWaybill] = useState<WaybillDocument>(waybills[0]);
  const [activeBol, setActiveBol] = useState<GeneratedBillOfLading>(() =>
    DocumentComplianceService.generateBillOfLading(waybills[0])
  );

  const handleSelectWaybill = (wb: WaybillDocument) => {
    setSelectedWaybill(wb);
    setActiveBol(DocumentComplianceService.generateBillOfLading(wb));
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          <FileCheck2 className="h-6 w-6 text-cyan-400" />
          Customs Compliance &amp; Cryptographic Bill of Lading Vault
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Cryptographically signed documentation adhering to WCO SAFE Framework, C-TPAT Tier 3, and ISO 28000 supply chain standards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Selector List */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Verified Waybill Documents</span>
            <span className="font-mono text-cyan-400">{waybills.length} Records</span>
          </div>

          <div className="space-y-2">
            {waybills.map((wb) => {
              const isSelected = wb.id === selectedWaybill.id;
              return (
                <button
                  key={wb.id}
                  onClick={() => handleSelectWaybill(wb)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-700 text-white shadow-md'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span className="text-cyan-300">{wb.waybillNumber}</span>
                    <span className="text-[10px] text-slate-400">{wb.mode}</span>
                  </div>
                  <div className="text-slate-400 mt-1">
                    {wb.origin.city} → {wb.destination.city}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1.5 pt-1.5 border-t border-slate-800/60">
                    <span>Val: ${wb.totalDeclaredValueUsd.toLocaleString()}</span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="h-3 w-3" /> Signed
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Document Inspection & Verification Viewer */}
        <div className="lg:col-span-2 space-y-4">
          {/* Security Banner */}
          <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-300">Cryptographic Signature Validated</h4>
                <p className="text-[11px] font-mono text-slate-400">
                  Digest: {activeBol.digitalSignature.signatureHex}
                </p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-cyan-400" />
              <span>Print</span>
            </button>
          </div>

          {/* Rendered BoL Document */}
          <div className="bg-white text-slate-900 rounded-xl p-6 font-mono text-xs space-y-4 shadow-2xl border border-slate-300">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
              <div>
                <h2 className="text-base font-black uppercase tracking-tight">LOGIFLOW GLOBAL FREIGHT SYSTEMS</h2>
                <p className="text-[10px] text-slate-600">Standard International Bill of Lading • ISO 28000</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">{activeBol.documentId}</div>
                <div className="text-[10px] text-slate-600">Timestamp: {new Date(activeBol.generatedAt).toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-3">
              <div>
                <span className="font-bold text-[10px] text-slate-500 uppercase">Shipper / Port of Origin:</span>
                <div className="font-bold">{activeBol.shipper.facility}</div>
                <div>{activeBol.shipper.address}</div>
                <div>{activeBol.shipper.city}, {activeBol.shipper.country}</div>
              </div>
              <div>
                <span className="font-bold text-[10px] text-slate-500 uppercase">Consignee / Destination:</span>
                <div className="font-bold">{activeBol.consignee.facility}</div>
                <div>{activeBol.consignee.address}</div>
                <div>{activeBol.consignee.city}, {activeBol.consignee.country}</div>
              </div>
            </div>

            <table className="w-full text-left text-[11px] border-b border-slate-300 pb-2">
              <thead className="border-b border-slate-300 text-slate-700">
                <tr>
                  <th className="py-1">SKU</th>
                  <th className="py-1">Commodity</th>
                  <th className="py-1">Harmonized HS</th>
                  <th className="py-1">Units</th>
                  <th className="py-1 text-right">Declared Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeBol.lineItems.map((it) => (
                  <tr key={it.sku}>
                    <td className="py-1.5 font-bold">{it.sku}</td>
                    <td className="py-1.5">{it.description}</td>
                    <td className="py-1.5 font-mono">{it.hsCode}</td>
                    <td className="py-1.5">{it.quantity.toLocaleString()}</td>
                    <td className="py-1.5 text-right font-bold">${it.declaredValueUsd.toLocaleString()} USD</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bg-slate-100 p-2.5 rounded border border-slate-300 text-[11px]">
              <span className="font-bold">Dangerous Goods Notice: </span>
              {activeBol.hazmatDeclaration}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-300 text-[10px]">
              <div>
                <div className="font-bold text-slate-700">
                  Cryptographic Authority: {activeBol.digitalSignature.signer}
                </div>
                <div className="text-slate-500 font-mono mt-0.5">{activeBol.digitalSignature.signatureHex}</div>
              </div>
              <div className="h-12 w-12 bg-slate-900 text-white flex items-center justify-center rounded">
                <QrCode className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
