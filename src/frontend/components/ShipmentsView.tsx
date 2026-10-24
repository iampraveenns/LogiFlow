/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Shipments & Waybills Management
 * Features end-to-end state machine transitions, customs risk scoring, and verified Bill of Lading modal.
 */

import React, { useState } from 'react';
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  X,
  Printer,
  QrCode,
  Tag,
} from 'lucide-react';
import { WaybillDocument, ShipmentStatus } from '../../packages/shared-types/index.ts';
import { VALID_STATUS_TRANSITIONS } from '../../backend/models/index.ts';
import { ApiController } from '../../backend/controllers/apiController.ts';
import { GeneratedBillOfLading } from '../../backend/services/documentComplianceService.ts';

interface ShipmentsViewProps {
  waybills: WaybillDocument[];
  onTransitionStatus: (shipmentId: string, newStatus: ShipmentStatus, actorName: string, notes?: string) => void;
  currentUserRole: string;
}

export const ShipmentsView: React.FC<ShipmentsViewProps> = ({
  waybills,
  onTransitionStatus,
  currentUserRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedWaybill, setSelectedWaybill] = useState<WaybillDocument | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatusChoice, setNewStatusChoice] = useState<ShipmentStatus>('IN_TRANSIT');
  const [transitionNotes, setTransitionNotes] = useState('');
  const [activeBolDoc, setActiveBolDoc] = useState<GeneratedBillOfLading | null>(null);

  // Filtered waybills
  const filteredWaybills = waybills.filter((w) => {
    const matchesSearch =
      w.waybillNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.origin.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.destination.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.carrier.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenStatusModal = (wb: WaybillDocument) => {
    setSelectedWaybill(wb);
    const validNext = VALID_STATUS_TRANSITIONS[wb.status] || [];
    setNewStatusChoice(validNext[0] || wb.status);
    setTransitionNotes('');
    setShowStatusModal(true);
  };

  const handleConfirmTransition = () => {
    if (!selectedWaybill) return;
    onTransitionStatus(selectedWaybill.id, newStatusChoice, `Role: ${currentUserRole}`, transitionNotes);
    setShowStatusModal(false);
  };

  const handleGenerateBol = async (wb: WaybillDocument) => {
    const doc = await ApiController.generateWaybillDocument(wb.id);
    setActiveBolDoc(doc);
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case 'IN_TRANSIT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">IN TRANSIT</span>;
      case 'CUSTOMS_HOLD':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800 animate-pulse">CUSTOMS HOLD</span>;
      case 'CUSTOMS_CLEARED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">CUSTOMS CLEARED</span>;
      case 'DELIVERED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">DELIVERED</span>;
      case 'EXCEPTION':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-950 text-red-400 border border-red-800">EXCEPTION</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">{status}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-cyan-400" />
            Global Shipments &amp; Waybill Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end multi-modal lifecycle state machines, customs compliance scores, and cryptographic Bills of Lading.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search waybill #, port, carrier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-64"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {['ALL', 'IN_TRANSIT', 'CUSTOMS_HOLD', 'DELIVERED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Shipments Grid */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="p-3.5">Waybill &amp; Carrier</th>
              <th className="p-3.5">Routing (Origin → Dest)</th>
              <th className="p-3.5">Mode &amp; Hazmat</th>
              <th className="p-3.5">Payload &amp; Value</th>
              <th className="p-3.5">Customs Risk</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredWaybills.map((wb) => (
              <tr key={wb.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5">
                  <div className="font-mono font-bold text-cyan-300">{wb.waybillNumber}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{wb.carrier}</div>
                </td>
                <td className="p-3.5">
                  <div className="flex items-center gap-1.5 font-medium text-slate-200">
                    <span>{wb.origin.city}</span>
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                    <span>{wb.destination.city}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    ETA: {new Date(wb.eta).toLocaleDateString()} {new Date(wb.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="p-3.5">
                  <span className="font-semibold text-slate-300">{wb.mode}</span>
                  {wb.hazmatClass !== 'NONE' && (
                    <div className="text-[10px] font-mono text-amber-400 mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {wb.hazmatClass}
                    </div>
                  )}
                </td>
                <td className="p-3.5">
                  <div className="font-mono text-slate-200">
                    {(wb.totalWeightKg / 1000).toFixed(1)} MT • {wb.totalVolumeM3} m³
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono font-semibold">
                    ${wb.totalDeclaredValueUsd.toLocaleString()} USD
                  </div>
                </td>
                <td className="p-3.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          wb.customsStatus.riskScore > 70
                            ? 'bg-red-500'
                            : wb.customsStatus.riskScore > 35
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${wb.customsStatus.riskScore}%` }}
                      ></div>
                    </div>
                    <span
                      className={`font-mono font-bold text-[11px] ${
                        wb.customsStatus.riskScore > 70
                          ? 'text-red-400'
                          : wb.customsStatus.riskScore > 35
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {wb.customsStatus.riskScore}%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {wb.customsStatus.inspectionRequired ? 'Inspection Required' : 'Pre-Cleared'}
                  </div>
                </td>
                <td className="p-3.5">{getStatusBadge(wb.status)}</td>
                <td className="p-3.5 text-right space-x-2">
                  <button
                    onClick={() => handleGenerateBol(wb)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium text-xs transition-colors inline-flex items-center gap-1"
                    title="View Standardized Bill of Lading"
                  >
                    <FileText className="h-3.5 w-3.5 text-cyan-400" />
                    <span>BoL</span>
                  </button>
                  <button
                    onClick={() => handleOpenStatusModal(wb)}
                    className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded font-medium text-xs transition-colors"
                  >
                    State Transition
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* State Machine Transition Modal */}
      {showStatusModal && selectedWaybill && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Transition Waybill Status</h3>
                <p className="text-xs text-slate-400 font-mono">Waybill: {selectedWaybill.waybillNumber}</p>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Current State</label>
                <div className="text-xs font-mono bg-slate-950 p-2 rounded border border-slate-800 text-slate-300">
                  {selectedWaybill.status}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Allowed Target States</label>
                <select
                  value={newStatusChoice}
                  onChange={(e) => setNewStatusChoice(e.target.value as ShipmentStatus)}
                  className="w-full bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {(VALID_STATUS_TRANSITIONS[selectedWaybill.status] || []).map((target) => (
                    <option key={target} value={target}>
                      {target}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Operational Audit Notes</label>
                <textarea
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  placeholder="e.g. Cleared physical customs inspection; seal #4412 verified intact."
                  className="w-full bg-slate-800 border border-slate-700 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 h-20 resize-none"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Immutable Audit Ledger Logging</span>
                </div>
                <p>
                  This transition will be signed with a cryptographic SHA-256 digital signature and logged into the enterprise audit trail.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTransition}
                className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
              >
                Commit State Transition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill of Lading (BoL) Document Modal */}
      {activeBolDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Uniform Straight Bill of Lading (Original)</h3>
              </div>
              <button
                onClick={() => setActiveBolDoc(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Document Body */}
            <div className="bg-white text-slate-900 rounded-lg p-6 space-y-4 font-mono text-xs select-all shadow-md">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight">LOGIFLOW ENTERPRISE CARRIER</h2>
                  <p className="text-[10px] text-slate-600">Standard Multi-Modal Bill of Lading • ISO 28000</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold">{activeBolDoc.documentId}</div>
                  <div className="text-[10px] text-slate-600">Issued: {new Date(activeBolDoc.generatedAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Shipper & Consignee */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-3">
                <div>
                  <span className="font-bold text-[10px] text-slate-500 uppercase">Shipper / Origin:</span>
                  <div className="font-bold">{activeBolDoc.shipper.facility}</div>
                  <div>{activeBolDoc.shipper.address}</div>
                  <div>{activeBolDoc.shipper.city}, {activeBolDoc.shipper.country}</div>
                </div>
                <div>
                  <span className="font-bold text-[10px] text-slate-500 uppercase">Consignee / Destination:</span>
                  <div className="font-bold">{activeBolDoc.consignee.facility}</div>
                  <div>{activeBolDoc.consignee.address}</div>
                  <div>{activeBolDoc.consignee.city}, {activeBolDoc.consignee.country}</div>
                </div>
              </div>

              {/* Items */}
              <table className="w-full text-left text-[11px] border-b border-slate-300 pb-2">
                <thead className="border-b border-slate-300 text-slate-700">
                  <tr>
                    <th className="py-1">SKU</th>
                    <th className="py-1">Description</th>
                    <th className="py-1">HS Code</th>
                    <th className="py-1">Qty</th>
                    <th className="py-1 text-right">Declared Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeBolDoc.lineItems.map((it) => (
                    <tr key={it.sku}>
                      <td className="py-1.5 font-bold">{it.sku}</td>
                      <td className="py-1.5">{it.description}</td>
                      <td className="py-1.5">{it.hsCode}</td>
                      <td className="py-1.5">{it.quantity.toLocaleString()}</td>
                      <td className="py-1.5 text-right font-bold">${it.declaredValueUsd.toLocaleString()} USD</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Hazmat Declaration */}
              <div className="bg-slate-100 p-2.5 rounded border border-slate-300 text-[11px]">
                <span className="font-bold">Dangerous Goods Notice: </span>
                {activeBolDoc.hazmatDeclaration}
              </div>

              {/* Cryptographic Digital Signature & QR */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-300 text-[10px]">
                <div>
                  <div className="font-bold text-slate-700">Digital Signature ({activeBolDoc.digitalSignature.algorithm})</div>
                  <div className="font-mono text-slate-800 break-all">{activeBolDoc.digitalSignature.signatureHex}</div>
                  <div className="text-slate-500 mt-0.5">Certified By: {activeBolDoc.digitalSignature.signer}</div>
                </div>
                <div className="h-12 w-12 bg-slate-900 text-white flex items-center justify-center rounded">
                  <QrCode className="h-9 w-9" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Document</span>
              </button>
              <button
                onClick={() => setActiveBolDoc(null)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
