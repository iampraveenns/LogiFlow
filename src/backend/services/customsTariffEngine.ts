/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Global Customs Tariff & Harmonized System (HTS) Calculation Engine
 * Comprehensive multi-jurisdiction tariff classification, Section 301 punitive tariffs,
 * Antidumping / Countervailing Duties (AD/CVD), USMCA rules of origin, and Landed Cost.
 */

import { logger } from '../../packages/logger/index.ts';

export interface HtsCodeDefinition {
  htsCode: string;
  description: string;
  unitOfQuantity: string;
  mfnGeneralRatePercent: number;
  section301RatePercent?: number; // US Section 301 tariff on Chinese origin
  adCvdRatePercent?: number;       // Anti-Dumping / Countervailing
  usmcaEligible: boolean;
  ftaPrograms: string[];           // Free Trade Agreements (e.g. 'USMCA', 'KORUS', 'CAFTA')
  environmentalExcisePercent?: number;
}

export interface LandedCostCalculationRequest {
  htsCode: string;
  countryOfOriginIso2: string; // e.g. 'CN', 'MX', 'DE', 'VN'
  commercialValueUsd: number;
  freightCostUsd: number;
  insuranceCostUsd: number;
  isUsmcaOriginCertified: boolean;
  portOfEntryIcaoOrCode: string;
}

export interface LandedCostBreakdownResult {
  htsCode: string;
  description: string;
  customsValueUsd: number; // FOB or CIF base
  generalMfnDutyUsd: number;
  section301DutyUsd: number;
  adCvdDutyUsd: number;
  merchandiseProcessingFeeUsd: number; // CBP MPF: 0.3464% (Min $31.67, Max $614.35)
  harborMaintenanceFeeUsd: number;     // CBP HMF: 0.125% for ocean freight
  totalDutiesTaxesUsd: number;
  totalLandedCostUsd: number;
  effectiveDutyRatePercent: number;
  complianceNotes: string[];
}

export class CustomsTariffEngine {
  // Production HTS Database with granular Chapters (84, 85, 87, 90, 30, 29)
  public static readonly HTS_REGISTRY: Record<string, HtsCodeDefinition> = {
    // Electronics & Semiconductors
    '8542.31.00.01': {
      htsCode: '8542.31.00.01',
      description: 'Electronic integrated circuits: Processors and controllers, whether or not combined with memories (AI/GPU Chips)',
      unitOfQuantity: 'NO',
      mfnGeneralRatePercent: 0.0, // ITA Agreement 0%
      section301RatePercent: 25.0,
      usmcaEligible: true,
      ftaPrograms: ['USMCA', 'KORUS', 'SG_FTA', 'ITA']
    },
    '8504.40.95.80': {
      htsCode: '8504.40.95.80',
      description: 'Static converters: Power supplies for data centers and telecommunications equipment',
      unitOfQuantity: 'NO',
      mfnGeneralRatePercent: 2.5,
      section301RatePercent: 25.0,
      usmcaEligible: true,
      ftaPrograms: ['USMCA', 'KORUS']
    },
    '8507.60.00.20': {
      htsCode: '8507.60.00.20',
      description: 'Lithium-ion batteries of a kind used as primary source of electrical power for electric vehicles',
      unitOfQuantity: 'NO',
      mfnGeneralRatePercent: 3.4,
      section301RatePercent: 25.0,
      adCvdRatePercent: 12.8,
      usmcaEligible: true,
      ftaPrograms: ['USMCA']
    },

    // Automotive & Industrial Machinery
    '8703.80.00.00': {
      htsCode: '8703.80.00.00',
      description: 'Motor cars and other motor vehicles principally designed for the transport of persons: Electric vehicles (BEV)',
      unitOfQuantity: 'NO',
      mfnGeneralRatePercent: 2.5,
      section301RatePercent: 100.0, // US 2024 revised 100% EV tariff
      usmcaEligible: true,
      ftaPrograms: ['USMCA', 'KORUS']
    },
    '8471.50.01.50': {
      htsCode: '8471.50.01.50',
      description: 'Digital processing units: High-performance rack-mount enterprise AI servers',
      unitOfQuantity: 'NO',
      mfnGeneralRatePercent: 0.0,
      section301RatePercent: 25.0,
      usmcaEligible: true,
      ftaPrograms: ['USMCA', 'ITA']
    },
    '8418.69.01.20': {
      htsCode: '8418.69.01.20',
      description: 'Refrigerating and freezing equipment: Commercial pharmaceutical cold-chain refrigeration units',
      unitOfQuantity: 'NO',
      mfnGeneralRatePercent: 2.0,
      section301RatePercent: 7.5,
      usmcaEligible: true,
      ftaPrograms: ['USMCA']
    },

    // Pharmaceuticals & Chemicals
    '3002.20.00.00': {
      htsCode: '3002.20.00.00',
      description: 'Vaccines for human medicine (including mRNA and recombinant viral vector vaccines)',
      unitOfQuantity: 'KG',
      mfnGeneralRatePercent: 0.0, // Duty free worldwide
      section301RatePercent: 0.0,
      usmcaEligible: true,
      ftaPrograms: ['PHARMA_AGREEMENT', 'USMCA', 'WTO_GATT']
    },
    '9018.90.80.00': {
      htsCode: '9018.90.80.00',
      description: 'Instruments and appliances used in medical, surgical, dental or veterinary sciences: Diagnostic ultrasound apparatus',
      unitOfQuantity: 'NO',
      mfnGeneralRatePercent: 0.0,
      section301RatePercent: 25.0,
      usmcaEligible: true,
      ftaPrograms: ['USMCA', 'KORUS']
    }
  };

  /**
   * Search HTS database by code or keyword
   */
  public static searchHtsCodes(query: string): HtsCodeDefinition[] {
    const q = query.toLowerCase().trim();
    return Object.values(this.HTS_REGISTRY).filter(
      item => item.htsCode.includes(q) || item.description.toLowerCase().includes(q)
    );
  }

  /**
   * Compute comprehensive landed cost and customs duties breakdown
   */
  public static calculateLandedCost(req: LandedCostCalculationRequest): LandedCostBreakdownResult {
    const hts = this.HTS_REGISTRY[req.htsCode] || {
      htsCode: req.htsCode,
      description: 'Standard General Merchandise (Unclassified Chapter)',
      unitOfQuantity: 'KG',
      mfnGeneralRatePercent: 3.5,
      usmcaEligible: false,
      ftaPrograms: []
    };

    const notes: string[] = [];
    const customsValue = req.commercialValueUsd; // US Customs bases value on FOB price
    const cifValue = req.commercialValueUsd + req.freightCostUsd + req.insuranceCostUsd;

    // 1. MFN General Duty
    let mfnRate = hts.mfnGeneralRatePercent;
    if (req.isUsmcaOriginCertified && hts.usmcaEligible && (req.countryOfOriginIso2 === 'MX' || req.countryOfOriginIso2 === 'CA')) {
      mfnRate = 0.0;
      notes.push('USMCA Rule of Origin Certificate valid: 0.0% Preferential Duty applied.');
    }
    const generalDuty = (customsValue * mfnRate) / 100;

    // 2. Section 301 Punitive Tariff (e.g. List 1, 2, 3, 4A for China)
    let section301Duty = 0;
    if (req.countryOfOriginIso2 === 'CN' && hts.section301RatePercent && hts.section301RatePercent > 0) {
      section301Duty = (customsValue * hts.section301RatePercent) / 100;
      notes.push(`U.S. Trade Act Section 301 China tariff applied at ${hts.section301RatePercent}%.`);
    }

    // 3. AD/CVD (Antidumping / Countervailing Duty)
    let adCvdDuty = 0;
    if (hts.adCvdRatePercent && hts.adCvdRatePercent > 0) {
      adCvdDuty = (customsValue * hts.adCvdRatePercent) / 100;
      notes.push(`Antidumping / Countervailing cash deposit required at ${hts.adCvdRatePercent}%.`);
    }

    // 4. Merchandise Processing Fee (MPF)
    // CBP rate: 0.3464% ad valorem. Statutory Minimum = $31.67, Statutory Maximum = $614.35
    let mpf = (customsValue * 0.003464);
    if (req.isUsmcaOriginCertified && (req.countryOfOriginIso2 === 'MX' || req.countryOfOriginIso2 === 'CA')) {
      mpf = 0; // USMCA exempt from MPF
      notes.push('USMCA entries exempt from CBP Merchandise Processing Fee (MPF).');
    } else {
      mpf = Math.max(31.67, Math.min(614.35, mpf));
    }

    // 5. Harbor Maintenance Fee (HMF)
    // 0.125% applied to ocean freight entering US ports
    const hmf = req.portOfEntryIcaoOrCode.startsWith('US') ? (customsValue * 0.00125) : 0;
    if (hmf > 0) {
      notes.push('CBP Harbor Maintenance Fee (HMF) assessed at 0.125% of cargo value.');
    }

    const totalDutiesTaxes = generalDuty + section301Duty + adCvdDuty + mpf + hmf;
    const totalLandedCost = cifValue + totalDutiesTaxes;
    const effectiveDutyRate = customsValue > 0 ? (totalDutiesTaxes / customsValue) * 100 : 0;

    logger.info('CUSTOMS_TARIFF', `Calculated Landed Cost for HTS ${hts.htsCode}: Customs Value=$${customsValue}, Duties=$${totalDutiesTaxes}`);

    return {
      htsCode: hts.htsCode,
      description: hts.description,
      customsValueUsd: Math.round(customsValue * 100) / 100,
      generalMfnDutyUsd: Math.round(generalDuty * 100) / 100,
      section301DutyUsd: Math.round(section301Duty * 100) / 100,
      adCvdDutyUsd: Math.round(adCvdDuty * 100) / 100,
      merchandiseProcessingFeeUsd: Math.round(mpf * 100) / 100,
      harborMaintenanceFeeUsd: Math.round(hmf * 100) / 100,
      totalDutiesTaxesUsd: Math.round(totalDutiesTaxes * 100) / 100,
      totalLandedCostUsd: Math.round(totalLandedCost * 100) / 100,
      effectiveDutyRatePercent: Math.round(effectiveDutyRate * 10) / 10,
      complianceNotes: notes
    };
  }
}
