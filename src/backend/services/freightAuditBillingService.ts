/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Demurrage, Detention & Freight Invoice Audit Engine
 * Performs 3-way automated matching (BoL vs Tender vs Carrier Invoice) and generates dispute claims.
 */

import { logger } from '../../packages/logger/index.ts';

export interface FreightInvoiceAuditRecord {
  invoiceId: string;
  waybillNumber: string;
  carrierName: string;
  carrierScac: string;
  invoiceDate: string;
  contractTenderAmountUsd: number;
  carrierBilledAmountUsd: number;
  varianceAmountUsd: number;
  variancePercentage: number;
  auditStatus: 'MATCHED_APPROVED' | 'DISCREPANCY_FLAGGED' | 'DISPUTE_SUBMITTED' | 'CREDIT_ISSUED';
  lineItemAudits: {
    chargeType: 'LINEHAUL_BASE' | 'FUEL_SURCHARGE_FSC' | 'DETENTION_ACCESSORIAL' | 'REWEIGH_SURCHARGE' | 'HAZMAT_HANDLING';
    contractTenderUsd: number;
    carrierBilledUsd: number;
    varianceUsd: number;
    isOvercharge: boolean;
    auditReasonNote: string;
  }[];
  disputeClaim?: {
    claimId: string;
    submittedAt: string;
    claimAmountUsd: number;
    contractClauseCitation: string;
    carrierContactEmail: string;
  };
}

export interface PortDemurrageClock {
  containerNumber: string;
  vesselName: string;
  portTerminal: string;
  dischargedAt: string;
  freeTimeDaysGranted: number;
  daysOnTerminalDwell: number;
  daysRemainingBeforeDemurrage: number;
  dailyDemurrageRateUsd: number;
  accumulatedDemurrageFeeUsd: number;
  status: 'SAFE_WITHIN_FREE_TIME' | 'CRITICAL_FINAL_DAY' | 'DEMURRAGE_ACCRUING';
}

export class FreightAuditBillingService {
  private static auditRecords: Map<string, FreightInvoiceAuditRecord> = new Map();
  private static demurrageClocks: PortDemurrageClock[] = [];

  static {
    const inv1: FreightInvoiceAuditRecord = {
      invoiceId: 'INV-CAR-2026-9901',
      waybillNumber: 'LGF-772911-US',
      carrierName: 'Apex Continental Freight',
      carrierScac: 'APEXL',
      invoiceDate: '2026-10-22',
      contractTenderAmountUsd: 4850,
      carrierBilledAmountUsd: 5620,
      varianceAmountUsd: 770,
      variancePercentage: 15.8,
      auditStatus: 'DISCREPANCY_FLAGGED',
      lineItemAudits: [
        { chargeType: 'LINEHAUL_BASE', contractTenderUsd: 4100, carrierBilledUsd: 4100, varianceUsd: 0, isOvercharge: false, auditReasonNote: 'Linehaul matches contract tender perfectly.' },
        { chargeType: 'FUEL_SURCHARGE_FSC', contractTenderUsd: 550, carrierBilledUsd: 680, varianceUsd: 130, isOvercharge: true, auditReasonNote: 'FSC billed at 16.5% vs contractual DOE weekly index cap of 13.4%.' },
        { chargeType: 'DETENTION_ACCESSORIAL', contractTenderUsd: 0, carrierBilledUsd: 450, varianceUsd: 450, isOvercharge: true, auditReasonNote: 'Unsubstantiated detention charge. Geofence telemetry shows tractor departed dock within 85 minutes.' },
        { chargeType: 'HAZMAT_HANDLING', contractTenderUsd: 200, carrierBilledUsd: 390, varianceUsd: 190, isOvercharge: true, auditReasonNote: 'Contractual Hazmat Class 9 fixed rate is $200. Billed at generic $390.' },
      ],
      disputeClaim: {
        claimId: 'DISP-CLAIM-4401',
        submittedAt: '2026-10-23T11:00:00Z',
        claimAmountUsd: 770,
        contractClauseCitation: 'Master Service Agreement Section 7.2 (Fuel Indexing) & Schedule C (Accessorial Free Time)',
        carrierContactEmail: 'freight-billing-disputes@apexcontinental.com',
      },
    };

    const inv2: FreightInvoiceAuditRecord = {
      invoiceId: 'INV-MSK-2026-3321',
      waybillNumber: 'LGF-449102-OCN',
      carrierName: 'Maersk Line A/S',
      carrierScac: 'MSKL',
      invoiceDate: '2026-10-21',
      contractTenderAmountUsd: 24500,
      carrierBilledAmountUsd: 24500,
      varianceAmountUsd: 0,
      variancePercentage: 0.0,
      auditStatus: 'MATCHED_APPROVED',
      lineItemAudits: [
        { chargeType: 'LINEHAUL_BASE', contractTenderUsd: 21500, carrierBilledUsd: 21500, varianceUsd: 0, isOvercharge: false, auditReasonNote: 'Ocean base rate fully verified.' },
        { chargeType: 'FUEL_SURCHARGE_FSC', contractTenderUsd: 3000, carrierBilledUsd: 3000, varianceUsd: 0, isOvercharge: false, auditReasonNote: 'Bunker adjustment factor matches IMO 2026 index.' },
      ],
    };

    this.auditRecords.set(inv1.invoiceId, inv1);
    this.auditRecords.set(inv2.invoiceId, inv2);

    // Port Demurrage clocks
    this.demurrageClocks = [
      {
        containerNumber: 'MSKU-881249-1',
        vesselName: 'Ever Glory Panamax Vessel',
        portTerminal: 'Port of Los Angeles Pier 400',
        dischargedAt: '2026-10-20T08:00:00Z',
        freeTimeDaysGranted: 5,
        daysOnTerminalDwell: 4.2,
        daysRemainingBeforeDemurrage: 0.8,
        dailyDemurrageRateUsd: 385,
        accumulatedDemurrageFeeUsd: 0,
        status: 'CRITICAL_FINAL_DAY',
      },
      {
        containerNumber: 'APXU-109923-4',
        vesselName: 'Rotterdam SkyExpress Shuttle',
        portTerminal: 'Port of Rotterdam Europort Marine Berth 4',
        dischargedAt: '2026-10-16T12:00:00Z',
        freeTimeDaysGranted: 7,
        daysOnTerminalDwell: 8.5,
        daysRemainingBeforeDemurrage: 0,
        dailyDemurrageRateUsd: 240,
        accumulatedDemurrageFeeUsd: 360, // 1.5 days accrued
        status: 'DEMURRAGE_ACCRUING',
      },
      {
        containerNumber: 'CMAU-441029-8',
        vesselName: 'CMA CGM Palais Intermodal',
        portTerminal: 'Singapore PSA Pasir Panjang Terminal',
        dischargedAt: '2026-10-23T14:00:00Z',
        freeTimeDaysGranted: 6,
        daysOnTerminalDwell: 1.0,
        daysRemainingBeforeDemurrage: 5.0,
        dailyDemurrageRateUsd: 190,
        accumulatedDemurrageFeeUsd: 0,
        status: 'SAFE_WITHIN_FREE_TIME',
      },
    ];
  }

  public static getAuditInvoices(): FreightInvoiceAuditRecord[] {
    return Array.from(this.auditRecords.values());
  }

  public static getDemurrageClocks(): PortDemurrageClock[] {
    return this.demurrageClocks;
  }

  /**
   * Submit dispute claim for an invoice discrepancy.
   */
  public static submitDisputeClaim(invoiceId: string, citationNote: string): FreightInvoiceAuditRecord | undefined {
    const inv = this.auditRecords.get(invoiceId);
    if (!inv) return undefined;

    inv.auditStatus = 'DISPUTE_SUBMITTED';
    inv.disputeClaim = {
      claimId: `DISP-CLAIM-${Date.now().toString().slice(-4)}`,
      submittedAt: new Date().toISOString(),
      claimAmountUsd: inv.varianceAmountUsd,
      contractClauseCitation: citationNote,
      carrierContactEmail: `disputes@${inv.carrierScac.toLowerCase()}.com`,
    };

    this.auditRecords.set(invoiceId, inv);
    logger.info('BILLING_AUDIT', `Submitted formal dispute for invoice ${invoiceId} ($${inv.varianceAmountUsd} overcharge)`);
    return inv;
  }
}
