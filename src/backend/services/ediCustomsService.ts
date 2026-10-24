/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Electronic Data Interchange (EDI) & Customs Tariff Engine
 * Parses and generates ANSI X12 (204, 214, 856) segments and computes Harmonized Tariff Schedule (HTS) customs duties.
 */

import { logger } from '../../packages/logger/index.ts';

export interface EdiDocument {
  id: string;
  transactionSet: 'EDI_204_LOAD_TENDER' | 'EDI_214_SHIPMENT_STATUS' | 'EDI_856_SHIP_NOTICE' | 'EDI_304_OCEAN_INSTRUCTIONS';
  controlNumber: string;
  senderId: string;
  receiverId: string;
  generatedAt: string;
  rawAnsiX12: string;
  structuredSegments: {
    segmentTag: string;
    description: string;
    elements: {
      position: string;
      label: string;
      value: string;
    }[];
  }[];
}

export interface HtsCustomsCode {
  hsCode: string;
  description: string;
  generalDutyRatePercent: number;
  specialDutyRatePercent: number; // e.g. USMCA, Free Trade Agreement
  specialFtaEligible: boolean;
  section301TariffPercent?: number; // Special punitive trade tariffs
  unitOfQuantity: string;
  exportControlClassificationNumberEccn?: string;
}

export const HTS_DATABASE: HtsCustomsCode[] = [
  {
    hsCode: '8471.50.01',
    description: 'Digital Processing Units & High-Performance AI Accelerator Servers',
    generalDutyRatePercent: 0.0, // WTO Information Technology Agreement (ITA) zero-duty
    specialDutyRatePercent: 0.0,
    specialFtaEligible: true,
    section301TariffPercent: 25.0, // China Section 301
    unitOfQuantity: 'No. (Units)',
    exportControlClassificationNumberEccn: '5A002.a',
  },
  {
    hsCode: '8507.60.00',
    description: 'Lithium-Ion Cylindrical Battery Cells (Hazmat Class 9 Dangerous Goods)',
    generalDutyRatePercent: 3.4,
    specialDutyRatePercent: 0.0,
    specialFtaEligible: true,
    section301TariffPercent: 7.5,
    unitOfQuantity: 'No. / kg',
    exportControlClassificationNumberEccn: 'EAR99',
  },
  {
    hsCode: '3002.20.00',
    description: 'Vaccines for Human Medicine (mRNA / Cryogenic Immunotherapy GDP Certified)',
    generalDutyRatePercent: 0.0, // Duty-free under Pharmaceutical Agreement
    specialDutyRatePercent: 0.0,
    specialFtaEligible: true,
    unitOfQuantity: 'kg / Vials',
    exportControlClassificationNumberEccn: '1C351',
  },
  {
    hsCode: '8411.91.00',
    description: 'Parts of Turbojets or Turboprops (Titanium-Aluminide Compressor Stator Blades)',
    generalDutyRatePercent: 0.0, // Agreement on Trade in Civil Aircraft
    specialDutyRatePercent: 0.0,
    specialFtaEligible: true,
    unitOfQuantity: 'kg',
    exportControlClassificationNumberEccn: '9A991.d',
  },
  {
    hsCode: '3909.50.00',
    description: 'Polyurethane Prepolymer Resins in Primary Forms (Hazmat Class 3 Flammable)',
    generalDutyRatePercent: 6.5,
    specialDutyRatePercent: 0.0,
    specialFtaEligible: true,
    section301TariffPercent: 25.0,
    unitOfQuantity: 'kg',
    exportControlClassificationNumberEccn: 'EAR99',
  },
  {
    hsCode: '0804.40.00',
    description: 'Fresh or Dried Avocados (Hass Organic Grade A+ Controlled Atmosphere)',
    generalDutyRatePercent: 11.2,
    specialDutyRatePercent: 0.0,
    specialFtaEligible: true,
    unitOfQuantity: 'kg',
    exportControlClassificationNumberEccn: 'EAR99',
  },
];

export class EdiCustomsService {
  /**
   * Search HTS customs database by HS code or commodity description.
   */
  public static searchHtsCodes(query: string): HtsCustomsCode[] {
    const q = query.toLowerCase().trim();
    if (!q) return HTS_DATABASE;
    return HTS_DATABASE.filter(
      (h) => h.hsCode.includes(q) || h.description.toLowerCase().includes(q)
    );
  }

  /**
   * Calculate customs duty and tariff exposure.
   */
  public static calculateCustomsDuty(params: {
    hsCode: string;
    declaredValueUsd: number;
    originCountry: string;
    destinationCountry: string;
    applyFtaPreference?: boolean;
  }): {
    hsCode: string;
    baseDutyUsd: number;
    section301Usd: number;
    totalDutyPayableUsd: number;
    effectiveDutyRatePercent: number;
    tradeAgreementNote: string;
  } {
    const { hsCode, declaredValueUsd, applyFtaPreference } = params;
    const hts = HTS_DATABASE.find((h) => h.hsCode === hsCode) || HTS_DATABASE[0];

    const baseRate = applyFtaPreference && hts.specialFtaEligible ? hts.specialDutyRatePercent : hts.generalDutyRatePercent;
    const section301Rate = hts.section301TariffPercent || 0;

    const baseDutyUsd = Math.round(declaredValueUsd * (baseRate / 100));
    const section301Usd = Math.round(declaredValueUsd * (section301Rate / 100));
    const totalDutyPayableUsd = baseDutyUsd + section301Usd;
    const effectiveRate = Number(((totalDutyPayableUsd / declaredValueUsd) * 100).toFixed(2));

    const note = applyFtaPreference
      ? 'Preferential FTA Certificate applied (0.0% base rate).'
      : section301Rate > 0
      ? `Standard MFN rate ${baseRate}% + Section 301 tariff surcharge ${section301Rate}%.`
      : `Standard MFN statutory rate ${baseRate}%.`;

    return {
      hsCode: hts.hsCode,
      baseDutyUsd,
      section301Usd,
      totalDutyPayableUsd,
      effectiveDutyRatePercent: effectiveRate,
      tradeAgreementNote: note,
    };
  }

  /**
   * Generate official ANSI X12 EDI 204 Motor Carrier Load Tender document.
   */
  public static generateEdi204(params: {
    waybillNumber: string;
    carrierScac: string;
    originCity: string;
    destinationCity: string;
    weightLbs: number;
  }): EdiDocument {
    const { waybillNumber, carrierScac, originCity, destinationCity, weightLbs } = params;
    const ctrlNum = Date.now().toString().slice(-9);
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const timeStr = new Date().toISOString().slice(11, 19).replace(/:/g, '').slice(0, 4);

    const raw = [
      `ISA*00*          *00*          *ZZ*LOGIFLOWENT    *02*${carrierScac.padEnd(15, ' ')}*${dateStr}*${timeStr}*U*00401*${ctrlNum}*0*P*>~`,
      `GS*SM*LOGIFLOW*${carrierScac}*${dateStr}*${timeStr}*1*X*004010~`,
      `ST*204*0001~`,
      `B2**${carrierScac}*${waybillNumber}**L~`,
      `B2A*00*LT~`,
      `MS3*${carrierScac}*B*1~`,
      `N1*SH*APEX EUROPORT DOCKS~`,
      `N3*HAVENNUMMER 5840~`,
      `N4*${originCity}**3000**NL~`,
      `N1*CN*CONTINENTAL LOGISTICS HUB~`,
      `N3*AM BALLINKAI 1~`,
      `N4*${destinationCity}**21129**DE~`,
      `S5*1*LD*${weightLbs}*L*1450*E*48*G~`,
      `OID*${waybillNumber}*PO-99120*PC*8500*L*${weightLbs}~`,
      `SE*12*0001~`,
      `GE*1*1~`,
      `IEA*1*${ctrlNum}~`,
    ].join('\n');

    const structured = [
      {
        segmentTag: 'ISA',
        description: 'Interchange Control Header',
        elements: [
          { position: 'ISA06', label: 'Sender ID', value: 'LOGIFLOWENT' },
          { position: 'ISA08', label: 'Receiver SCAC', value: carrierScac },
          { position: 'ISA13', label: 'Control Number', value: ctrlNum },
        ],
      },
      {
        segmentTag: 'B2',
        description: 'Beginning Segment for Shipment Information Transaction',
        elements: [
          { position: 'B202', label: 'Standard Carrier Alpha Code', value: carrierScac },
          { position: 'B204', label: 'Shipment Identification Number', value: waybillNumber },
          { position: 'B206', label: 'Payment Method Code', value: 'L (Prepaid)' },
        ],
      },
      {
        segmentTag: 'S5',
        description: 'Stop-Off Details (Primary Origin / Loading)',
        elements: [
          { position: 'S501', label: 'Stop Sequence Number', value: '1' },
          { position: 'S502', label: 'Stop Reason Code', value: 'LD (Load)' },
          { position: 'S503', label: 'Weight (lbs)', value: String(weightLbs) },
        ],
      },
    ];

    logger.info('EDI_SERVICE', `Generated EDI 204 Motor Carrier Load Tender for ${waybillNumber}`);

    return {
      id: `EDI-204-${waybillNumber}`,
      transactionSet: 'EDI_204_LOAD_TENDER',
      controlNumber: ctrlNum,
      senderId: 'LOGIFLOWENT',
      receiverId: carrierScac,
      generatedAt: new Date().toISOString(),
      rawAnsiX12: raw,
      structuredSegments: structured,
    };
  }

  /**
   * Generate official ANSI X12 EDI 214 Shipment Status Message.
   */
  public static generateEdi214(params: {
    waybillNumber: string;
    statusCode: 'X6' | 'AF' | 'AG' | 'D1'; // X6 = En Route, AF = Departed, D1 = Delivered
    locationCity: string;
    statusDescription: string;
  }): EdiDocument {
    const { waybillNumber, statusCode, locationCity, statusDescription } = params;
    const ctrlNum = Date.now().toString().slice(-9);
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const timeStr = new Date().toISOString().slice(11, 19).replace(/:/g, '').slice(0, 4);

    const raw = [
      `ISA*00*          *00*          *02*APEXL          *ZZ*LOGIFLOWENT    *${dateStr}*${timeStr}*U*00401*${ctrlNum}*0*P*>~`,
      `GS*QM*APEXL*LOGIFLOWENT*${dateStr}*${timeStr}*1*X*004010~`,
      `ST*214*0001~`,
      `B10*${waybillNumber}*BOL-${waybillNumber}*APEXL~`,
      `MS1*${locationCity}**NL~`,
      `MS2*APEXL*101~`,
      `AT7*${statusCode}*NS***${dateStr}*${timeStr}*LT~`,
      `CD8*01*${statusDescription.slice(0, 30)}~`,
      `SE*8*0001~`,
      `GE*1*1~`,
      `IEA*1*${ctrlNum}~`,
    ].join('\n');

    return {
      id: `EDI-214-${waybillNumber}`,
      transactionSet: 'EDI_214_SHIPMENT_STATUS',
      controlNumber: ctrlNum,
      senderId: 'APEXL',
      receiverId: 'LOGIFLOWENT',
      generatedAt: new Date().toISOString(),
      rawAnsiX12: raw,
      structuredSegments: [
        {
          segmentTag: 'B10',
          description: 'Beginning Segment for Transportation Carrier Status',
          elements: [
            { position: 'B1001', label: 'Reference ID', value: waybillNumber },
            { position: 'B1003', label: 'Carrier SCAC', value: 'APEXL' },
          ],
        },
        {
          segmentTag: 'AT7',
          description: 'Shipment Status Details',
          elements: [
            { position: 'AT701', label: 'Status Code', value: `${statusCode} (${statusDescription})` },
            { position: 'AT705', label: 'Event Date', value: dateStr },
            { position: 'AT706', label: 'Event Time', value: timeStr },
          ],
        },
      ],
    };
  }
}
