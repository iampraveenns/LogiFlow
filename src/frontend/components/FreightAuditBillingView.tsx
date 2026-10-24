/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Freight Invoice 3-Way Match Audit & Port Demurrage View
 */

import React, { useState } from 'react';
import {
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Clock,
  Send,
  ShieldAlert,
  FileText,
  Ship,
  Scale,
} from 'lucide-react';
import {
  FreightAuditBillingService,
  FreightInvoiceAuditRecord,
  PortDemurrageClock,
} from '../../backend/services/freightAuditBillingService.ts';

export const FreightAuditBillingView: React.FC = () => {
  const [invoices, setInvoices] = useState<FreightInvoiceAuditRecord[]>(() =>
    FreightAuditBillingService.getAuditInvoices()
  );
  const [demurrageClocks] = useState<PortDemurrageClock[]>(() =>
    FreightAuditBillingService.getDemurrageClocks()
  );
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(invoices[0]?.invoiceId || '');
  const [disputeNotification, setDisputeNotification] = useState<string | null>(null);

  const selectedInvoice = invoices.find((i) => i.invoiceId === selectedInvoiceId) || invoices[0];

  const handleSubmitDispute = (invId: string) => {
    const updated = FreightAuditBillingService.submitDisputeClaim(
      invId,
      'Master Service Agreement Section 7.2 (Fuel Surcharge DOE Cap) & Schedule C Accessorial Free Time'
    );
    if (updated) {
      setInvoices([...FreightAuditBillingService.getAuditInvoices()]);
      setDisputeNotification(`Formal dispute claim submitted for ${invId} ($${updated.varianceAmountUsd} overcharge withheld).`);
      setTimeout(() => setDisputeNotification(null), 5000);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-cyan-400" />
            Freight Invoice 3-Way Audit &amp; Port Demurrage Control
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated 3-way match (BoL vs Rate Tender vs Carrier Invoice), accessorial overcharge detection, and ocean port demurrage clocks.
          </p>
        </div>

        {disputeNotification && (
          <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{disputeNotification}</span>
          </div>
        )}
      </div>

      {/* Port Demurrage Risk Clocks Banner */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Ship className="h-4 w-4 text-cyan-400" />
          <span>Active Port Container Demurrage Clocks (Free-Time Monitoring)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demurrageClocks.map((clock) => (
            <div
              key={clock.containerNumber}
              className={`p-4 rounded-xl border space-y-2 font-mono text-xs ${
                clock.status === 'DEMURRAGE_ACCRUING'
                  ? 'bg-red-950/40 border-red-800 shadow-md shadow-red-950/30'
                  : clock.status === 'CRITICAL_FINAL_DAY'
                  ? 'bg-amber-950/40 border-amber-800'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-sans">{clock.containerNumber}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    clock.status === 'DEMURRAGE_ACCRUING'
                      ? 'bg-red-900/60 text-red-300 border border-red-700'
                      : clock.status === 'CRITICAL_FINAL_DAY'
                      ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {clock.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 font-sans">{clock.portTerminal}</div>

              <div className="flex justify-between text-[11px] pt-1">
                <span className="text-slate-400">Dwell: {clock.daysOnTerminalDwell}d / {clock.freeTimeDaysGranted}d Free</span>
                <span className={clock.daysRemainingBeforeDemurrage === 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {clock.daysRemainingBeforeDemurrage > 0 ? `${clock.daysRemainingBeforeDemurrage}d remaining` : 'Demurrage Active'}
                </span>
              </div>

              {clock.accumulatedDemurrageFeeUsd > 0 && (
                <div className="text-red-400 font-bold text-xs pt-1 border-t border-slate-800/80">
                  Accrued Penalty: +${clock.accumulatedDemurrageFeeUsd} USD (${clock.dailyDemurrageRateUsd}/day)
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invoice 3-Way Match Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Invoices List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Audited Carrier Invoices</span>
            <span className="font-mono text-cyan-400">{invoices.length} Bills</span>
          </div>

          <div className="space-y-2.5">
            {invoices.map((inv) => {
              const isSelected = inv.invoiceId === selectedInvoiceId;
              return (
                <div
                  key={inv.invoiceId}
                  onClick={() => setSelectedInvoiceId(inv.invoiceId)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-lg text-white'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span className="text-cyan-300">{inv.invoiceId}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        inv.auditStatus === 'MATCHED_APPROVED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {inv.auditStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="font-semibold text-slate-200 mt-1">{inv.carrierName}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">Waybill: {inv.waybillNumber}</div>

                  <div className="flex justify-between text-[11px] font-mono mt-2 pt-2 border-t border-slate-800/80">
                    <span>Billed: ${inv.carrierBilledAmountUsd}</span>
                    {inv.varianceAmountUsd > 0 ? (
                      <span className="text-red-400 font-bold">Overcharge: +${inv.varianceAmountUsd}</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">Matched ($0 Var)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Line Item 3-Way Reconciliation (8 cols) */}
        {selectedInvoice && (
          <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">
                  3-Way Match Reconciliation: {selectedInvoice.invoiceId}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Waybill: {selectedInvoice.waybillNumber} • Carrier: {selectedInvoice.carrierName}
                </p>
              </div>

              {selectedInvoice.varianceAmountUsd > 0 && selectedInvoice.auditStatus !== 'DISPUTE_SUBMITTED' && (
                <button
                  onClick={() => handleSubmitDispute(selectedInvoice.invoiceId)}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Dispute Claim</span>
                </button>
              )}
            </div>

            {/* Line Items Audit Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Charge Category</th>
                    <th className="p-3">Contract Rate</th>
                    <th className="p-3">Carrier Billed</th>
                    <th className="p-3">Variance</th>
                    <th className="p-3">Audit Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {selectedInvoice.lineItemAudits.map((item, idx) => (
                    <tr key={idx} className={item.isOvercharge ? 'bg-red-950/20' : 'hover:bg-slate-800/30'}>
                      <td className="p-3 font-sans font-bold text-slate-200">
                        {item.chargeType.replace(/_/g, ' ')}
                      </td>
                      <td className="p-3 text-slate-300">${item.contractTenderUsd}</td>
                      <td className="p-3 text-slate-200 font-bold">${item.carrierBilledUsd}</td>
                      <td className="p-3">
                        {item.isOvercharge ? (
                          <span className="text-red-400 font-bold">+${item.varianceUsd} Over</span>
                        ) : (
                          <span className="text-emerald-400">$0</span>
                        )}
                      </td>
                      <td className="p-3 font-sans text-[11px] text-slate-400 max-w-xs">
                        {item.auditReasonNote}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Active Dispute Information */}
            {selectedInvoice.disputeClaim && (
              <div className="bg-slate-950 p-4 rounded-xl border border-red-800/60 space-y-1.5 font-mono text-xs mt-3">
                <div className="flex items-center justify-between text-red-300 font-bold">
                  <span>Formal Carrier Dispute Submitted: {selectedInvoice.disputeClaim.claimId}</span>
                  <span className="text-slate-400">{new Date(selectedInvoice.disputeClaim.submittedAt).toLocaleDateString()}</span>
                </div>
                <div className="text-slate-300 font-sans">
                  Citation: {selectedInvoice.disputeClaim.contractClauseCitation}
                </div>
                <div className="text-[11px] text-slate-500">
                  Transmitted to: {selectedInvoice.disputeClaim.carrierContactEmail}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
