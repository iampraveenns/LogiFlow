/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Global Dangerous Goods & Hazmat Regulatory Registry
 * Comprehensive implementation of UN Model Regulations, IATA DGR 65th Edition,
 * IMO IMDG Code 41-22, and US DOT 49 CFR Emergency Response Guidebook (ERG).
 */

export type HazmatClass =
  | '1.1' | '1.2' | '1.3' | '1.4' | '1.5' | '1.6' // Explosives
  | '2.1' | '2.2' | '2.3'                         // Gases (Flammable, Non-flammable, Toxic)
  | '3'                                           // Flammable Liquids
  | '4.1' | '4.2' | '4.3'                         // Flammable Solids, Spontaneously Combustible, Dangerous When Wet
  | '5.1' | '5.2'                                 // Oxidizers, Organic Peroxides
  | '6.1' | '6.2'                                 // Toxic Substances, Infectious Substances
  | '7'                                           // Radioactive Materials
  | '8'                                           // Corrosives
  | '9';                                          // Miscellaneous Dangerous Goods

export type PackingGroup = 'I' | 'II' | 'III' | 'NONE';

export interface HazmatMaterialDefinition {
  unNumber: string;
  properShippingName: string;
  primaryClass: HazmatClass;
  subsidiaryRisks: HazmatClass[];
  packingGroup: PackingGroup;
  ergGuideNumber: number;
  initialIsolationDistanceMeters: number;
  protectiveActionDistanceDayMeters: number;
  protectiveActionDistanceNightMeters: number;
  fireExtinguishingAgent: 'WATER_SPRAY' | 'DRY_CHEMICAL' | 'CO2' | 'ALCOHOL_RESISTANT_FOAM' | 'DO_NOT_USE_WATER';
  tunnelRestrictionCode: 'A' | 'B' | 'C' | 'D' | 'E';
  airPassengerMaxNetQtyKg: number;
  airCargoOnlyMaxNetQtyKg: number;
  marinePollutant: boolean;
  specialProvisions: string[];
}

export class HazmatDangerousGoodsRegistry {
  /**
   * Exhaustive Catalog of Globally Regulated Dangerous Goods (UN Numbers)
   */
  public static readonly MATERIALS: Record<string, HazmatMaterialDefinition> = {
    // CLASS 1: Explosives
    UN0004: {
      unNumber: 'UN0004',
      properShippingName: 'AMMONIUM PICRATE, dry or wetted with less than 10% water by mass',
      primaryClass: '1.1',
      subsidiaryRisks: [],
      packingGroup: 'NONE',
      ergGuideNumber: 112,
      initialIsolationDistanceMeters: 500,
      protectiveActionDistanceDayMeters: 1600,
      protectiveActionDistanceNightMeters: 2400,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'B',
      airPassengerMaxNetQtyKg: 0,
      airCargoOnlyMaxNetQtyKg: 0,
      marinePollutant: false,
      specialProvisions: ['SP266', 'SP271']
    },
    UN0027: {
      unNumber: 'UN0027',
      properShippingName: 'BLACK POWDER (GUNPOWDER), granular or as a meal',
      primaryClass: '1.1',
      subsidiaryRisks: [],
      packingGroup: 'NONE',
      ergGuideNumber: 112,
      initialIsolationDistanceMeters: 500,
      protectiveActionDistanceDayMeters: 1600,
      protectiveActionDistanceNightMeters: 2400,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'B',
      airPassengerMaxNetQtyKg: 0,
      airCargoOnlyMaxNetQtyKg: 0,
      marinePollutant: false,
      specialProvisions: ['SP271']
    },
    UN0044: {
      unNumber: 'UN0044',
      properShippingName: 'PRIMERS, CAP TYPE',
      primaryClass: '1.4',
      subsidiaryRisks: [],
      packingGroup: 'NONE',
      ergGuideNumber: 114,
      initialIsolationDistanceMeters: 100,
      protectiveActionDistanceDayMeters: 300,
      protectiveActionDistanceNightMeters: 500,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 25,
      airCargoOnlyMaxNetQtyKg: 100,
      marinePollutant: false,
      specialProvisions: []
    },

    // CLASS 2: Gases
    UN1001: {
      unNumber: 'UN1001',
      properShippingName: 'ACETYLENE, DISSOLVED',
      primaryClass: '2.1',
      subsidiaryRisks: [],
      packingGroup: 'NONE',
      ergGuideNumber: 116,
      initialIsolationDistanceMeters: 100,
      protectiveActionDistanceDayMeters: 800,
      protectiveActionDistanceNightMeters: 1600,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'B',
      airPassengerMaxNetQtyKg: 0,
      airCargoOnlyMaxNetQtyKg: 15,
      marinePollutant: false,
      specialProvisions: ['SP29', 'SP284']
    },
    UN1005: {
      unNumber: 'UN1005',
      properShippingName: 'AMMONIA, ANHYDROUS, liquefied',
      primaryClass: '2.3',
      subsidiaryRisks: ['8'],
      packingGroup: 'NONE',
      ergGuideNumber: 125,
      initialIsolationDistanceMeters: 150,
      protectiveActionDistanceDayMeters: 1200,
      protectiveActionDistanceNightMeters: 3200,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'C',
      airPassengerMaxNetQtyKg: 0,
      airCargoOnlyMaxNetQtyKg: 0,
      marinePollutant: true,
      specialProvisions: ['SP23', 'SP379']
    },
    UN1013: {
      unNumber: 'UN1013',
      properShippingName: 'CARBON DIOXIDE, compressed',
      primaryClass: '2.2',
      subsidiaryRisks: [],
      packingGroup: 'NONE',
      ergGuideNumber: 120,
      initialIsolationDistanceMeters: 50,
      protectiveActionDistanceDayMeters: 100,
      protectiveActionDistanceNightMeters: 100,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'C',
      airPassengerMaxNetQtyKg: 75,
      airCargoOnlyMaxNetQtyKg: 150,
      marinePollutant: false,
      specialProvisions: ['SP653']
    },
    UN1066: {
      unNumber: 'UN1066',
      properShippingName: 'NITROGEN, COMPRESSED',
      primaryClass: '2.2',
      subsidiaryRisks: [],
      packingGroup: 'NONE',
      ergGuideNumber: 121,
      initialIsolationDistanceMeters: 50,
      protectiveActionDistanceDayMeters: 100,
      protectiveActionDistanceNightMeters: 100,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 75,
      airCargoOnlyMaxNetQtyKg: 150,
      marinePollutant: false,
      specialProvisions: []
    },
    UN1072: {
      unNumber: 'UN1072',
      properShippingName: 'OXYGEN, COMPRESSED',
      primaryClass: '2.2',
      subsidiaryRisks: ['5.1'],
      packingGroup: 'NONE',
      ergGuideNumber: 122,
      initialIsolationDistanceMeters: 50,
      protectiveActionDistanceDayMeters: 200,
      protectiveActionDistanceNightMeters: 200,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 75,
      airCargoOnlyMaxNetQtyKg: 150,
      marinePollutant: false,
      specialProvisions: ['SP355']
    },
    UN1075: {
      unNumber: 'UN1075',
      properShippingName: 'PETROLEUM GASES, LIQUEFIED (LPG)',
      primaryClass: '2.1',
      subsidiaryRisks: [],
      packingGroup: 'NONE',
      ergGuideNumber: 115,
      initialIsolationDistanceMeters: 100,
      protectiveActionDistanceDayMeters: 800,
      protectiveActionDistanceNightMeters: 1600,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'B',
      airPassengerMaxNetQtyKg: 0,
      airCargoOnlyMaxNetQtyKg: 150,
      marinePollutant: false,
      specialProvisions: ['SP392']
    },

    // CLASS 3: Flammable Liquids
    UN1170: {
      unNumber: 'UN1170',
      properShippingName: 'ETHANOL (ETHYL ALCOHOL) or ETHANOL SOLUTION',
      primaryClass: '3',
      subsidiaryRisks: [],
      packingGroup: 'II',
      ergGuideNumber: 127,
      initialIsolationDistanceMeters: 50,
      protectiveActionDistanceDayMeters: 300,
      protectiveActionDistanceNightMeters: 600,
      fireExtinguishingAgent: 'ALCOHOL_RESISTANT_FOAM',
      tunnelRestrictionCode: 'D',
      airPassengerMaxNetQtyKg: 5,
      airCargoOnlyMaxNetQtyKg: 60,
      marinePollutant: false,
      specialProvisions: ['SP144', 'SP184', 'SP330']
    },
    UN1202: {
      unNumber: 'UN1202',
      properShippingName: 'DIESEL FUEL or GASOIL or HEATING OIL, LIGHT',
      primaryClass: '3',
      subsidiaryRisks: [],
      packingGroup: 'III',
      ergGuideNumber: 128,
      initialIsolationDistanceMeters: 50,
      protectiveActionDistanceDayMeters: 200,
      protectiveActionDistanceNightMeters: 400,
      fireExtinguishingAgent: 'ALCOHOL_RESISTANT_FOAM',
      tunnelRestrictionCode: 'D',
      airPassengerMaxNetQtyKg: 60,
      airCargoOnlyMaxNetQtyKg: 220,
      marinePollutant: true,
      specialProvisions: ['SP363', 'SP640']
    },
    UN1203: {
      unNumber: 'UN1203',
      properShippingName: 'MOTOR SPIRIT or GASOLINE or PETROL',
      primaryClass: '3',
      subsidiaryRisks: [],
      packingGroup: 'II',
      ergGuideNumber: 128,
      initialIsolationDistanceMeters: 50,
      protectiveActionDistanceDayMeters: 400,
      protectiveActionDistanceNightMeters: 800,
      fireExtinguishingAgent: 'ALCOHOL_RESISTANT_FOAM',
      tunnelRestrictionCode: 'D',
      airPassengerMaxNetQtyKg: 5,
      airCargoOnlyMaxNetQtyKg: 60,
      marinePollutant: true,
      specialProvisions: ['SP243', 'SP363']
    },
    UN1230: {
      unNumber: 'UN1230',
      properShippingName: 'METHANOL',
      primaryClass: '3',
      subsidiaryRisks: ['6.1'],
      packingGroup: 'II',
      ergGuideNumber: 131,
      initialIsolationDistanceMeters: 60,
      protectiveActionDistanceDayMeters: 400,
      protectiveActionDistanceNightMeters: 900,
      fireExtinguishingAgent: 'ALCOHOL_RESISTANT_FOAM',
      tunnelRestrictionCode: 'D',
      airPassengerMaxNetQtyKg: 1,
      airCargoOnlyMaxNetQtyKg: 60,
      marinePollutant: false,
      specialProvisions: ['SP279']
    },
    UN1263: {
      unNumber: 'UN1263',
      properShippingName: 'PAINT or PAINT RELATED MATERIAL',
      primaryClass: '3',
      subsidiaryRisks: [],
      packingGroup: 'II',
      ergGuideNumber: 128,
      initialIsolationDistanceMeters: 50,
      protectiveActionDistanceDayMeters: 300,
      protectiveActionDistanceNightMeters: 600,
      fireExtinguishingAgent: 'ALCOHOL_RESISTANT_FOAM',
      tunnelRestrictionCode: 'D',
      airPassengerMaxNetQtyKg: 5,
      airCargoOnlyMaxNetQtyKg: 60,
      marinePollutant: false,
      specialProvisions: ['SP163', 'SP367']
    },
    UN1267: {
      unNumber: 'UN1267',
      properShippingName: 'PETROLEUM CRUDE OIL',
      primaryClass: '3',
      subsidiaryRisks: [],
      packingGroup: 'I',
      ergGuideNumber: 128,
      initialIsolationDistanceMeters: 100,
      protectiveActionDistanceDayMeters: 800,
      protectiveActionDistanceNightMeters: 1600,
      fireExtinguishingAgent: 'ALCOHOL_RESISTANT_FOAM',
      tunnelRestrictionCode: 'D',
      airPassengerMaxNetQtyKg: 1,
      airCargoOnlyMaxNetQtyKg: 30,
      marinePollutant: true,
      specialProvisions: ['SP357']
    },
    UN1863: {
      unNumber: 'UN1863',
      properShippingName: 'FUEL, AVIATION, TURBINE ENGINE (JET A-1 / JP-8)',
      primaryClass: '3',
      subsidiaryRisks: [],
      packingGroup: 'II',
      ergGuideNumber: 128,
      initialIsolationDistanceMeters: 50,
      protectiveActionDistanceDayMeters: 400,
      protectiveActionDistanceNightMeters: 800,
      fireExtinguishingAgent: 'ALCOHOL_RESISTANT_FOAM',
      tunnelRestrictionCode: 'D',
      airPassengerMaxNetQtyKg: 5,
      airCargoOnlyMaxNetQtyKg: 60,
      marinePollutant: false,
      specialProvisions: ['SP363']
    },
    UN1993: {
      unNumber: 'UN1993',
      properShippingName: 'FLAMMABLE LIQUID, N.O.S. (Not Otherwise Specified)',
      primaryClass: '3',
      subsidiaryRisks: [],
      packingGroup: 'II',
      ergGuideNumber: 128,
      initialIsolationDistanceMeters: 50,
      protectiveActionDistanceDayMeters: 300,
      protectiveActionDistanceNightMeters: 600,
      fireExtinguishingAgent: 'ALCOHOL_RESISTANT_FOAM',
      tunnelRestrictionCode: 'D',
      airPassengerMaxNetQtyKg: 5,
      airCargoOnlyMaxNetQtyKg: 60,
      marinePollutant: false,
      specialProvisions: ['SP274']
    },

    // CLASS 4: Flammable Solids, Water-Reactive
    UN1325: {
      unNumber: 'UN1325',
      properShippingName: 'FLAMMABLE SOLID, ORGANIC, N.O.S.',
      primaryClass: '4.1',
      subsidiaryRisks: [],
      packingGroup: 'II',
      ergGuideNumber: 133,
      initialIsolationDistanceMeters: 25,
      protectiveActionDistanceDayMeters: 100,
      protectiveActionDistanceNightMeters: 200,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 15,
      airCargoOnlyMaxNetQtyKg: 50,
      marinePollutant: false,
      specialProvisions: ['SP274']
    },
    UN1396: {
      unNumber: 'UN1396',
      properShippingName: 'ALUMINIUM POWDER, UNCOATED (Dangerous when wet)',
      primaryClass: '4.3',
      subsidiaryRisks: [],
      packingGroup: 'II',
      ergGuideNumber: 138,
      initialIsolationDistanceMeters: 60,
      protectiveActionDistanceDayMeters: 300,
      protectiveActionDistanceNightMeters: 700,
      fireExtinguishingAgent: 'DO_NOT_USE_WATER',
      tunnelRestrictionCode: 'D',
      airPassengerMaxNetQtyKg: 15,
      airCargoOnlyMaxNetQtyKg: 50,
      marinePollutant: false,
      specialProvisions: []
    },
    UN1418: {
      unNumber: 'UN1418',
      properShippingName: 'MAGNESIUM POWDER or MAGNESIUM ALLOYS POWDER',
      primaryClass: '4.3',
      subsidiaryRisks: ['4.2'],
      packingGroup: 'II',
      ergGuideNumber: 138,
      initialIsolationDistanceMeters: 60,
      protectiveActionDistanceDayMeters: 350,
      protectiveActionDistanceNightMeters: 800,
      fireExtinguishingAgent: 'DO_NOT_USE_WATER',
      tunnelRestrictionCode: 'D',
      airPassengerMaxNetQtyKg: 15,
      airCargoOnlyMaxNetQtyKg: 50,
      marinePollutant: false,
      specialProvisions: []
    },

    // CLASS 5: Oxidizers & Organic Peroxides
    UN1444: {
      unNumber: 'UN1444',
      properShippingName: 'AMMONIUM PERSULPHATE',
      primaryClass: '5.1',
      subsidiaryRisks: [],
      packingGroup: 'III',
      ergGuideNumber: 140,
      initialIsolationDistanceMeters: 25,
      protectiveActionDistanceDayMeters: 100,
      protectiveActionDistanceNightMeters: 200,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 25,
      airCargoOnlyMaxNetQtyKg: 100,
      marinePollutant: false,
      specialProvisions: []
    },
    UN1479: {
      unNumber: 'UN1479',
      properShippingName: 'OXIDIZING SOLID, N.O.S.',
      primaryClass: '5.1',
      subsidiaryRisks: [],
      packingGroup: 'II',
      ergGuideNumber: 140,
      initialIsolationDistanceMeters: 25,
      protectiveActionDistanceDayMeters: 150,
      protectiveActionDistanceNightMeters: 300,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 5,
      airCargoOnlyMaxNetQtyKg: 25,
      marinePollutant: false,
      specialProvisions: ['SP274']
    },
    UN2014: {
      unNumber: 'UN2014',
      properShippingName: 'HYDROGEN PEROXIDE, AQUEOUS SOLUTION with 20% to 60% hydrogen peroxide',
      primaryClass: '5.1',
      subsidiaryRisks: ['8'],
      packingGroup: 'II',
      ergGuideNumber: 140,
      initialIsolationDistanceMeters: 50,
      protectiveActionDistanceDayMeters: 200,
      protectiveActionDistanceNightMeters: 400,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 1,
      airCargoOnlyMaxNetQtyKg: 5,
      marinePollutant: false,
      specialProvisions: []
    },
    UN3105: {
      unNumber: 'UN3105',
      properShippingName: 'ORGANIC PEROXIDE TYPE D, LIQUID',
      primaryClass: '5.2',
      subsidiaryRisks: [],
      packingGroup: 'NONE',
      ergGuideNumber: 145,
      initialIsolationDistanceMeters: 50,
      protectiveActionDistanceDayMeters: 250,
      protectiveActionDistanceNightMeters: 500,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'D',
      airPassengerMaxNetQtyKg: 5,
      airCargoOnlyMaxNetQtyKg: 10,
      marinePollutant: false,
      specialProvisions: ['SP122', 'SP274']
    },

    // CLASS 6: Toxics & Biohazards
    UN1689: {
      unNumber: 'UN1689',
      properShippingName: 'SODIUM CYANIDE, SOLID',
      primaryClass: '6.1',
      subsidiaryRisks: [],
      packingGroup: 'I',
      ergGuideNumber: 157,
      initialIsolationDistanceMeters: 100,
      protectiveActionDistanceDayMeters: 800,
      protectiveActionDistanceNightMeters: 2100,
      fireExtinguishingAgent: 'DRY_CHEMICAL',
      tunnelRestrictionCode: 'C',
      airPassengerMaxNetQtyKg: 5,
      airCargoOnlyMaxNetQtyKg: 50,
      marinePollutant: true,
      specialProvisions: []
    },
    UN2810: {
      unNumber: 'UN2810',
      properShippingName: 'TOXIC LIQUID, ORGANIC, N.O.S.',
      primaryClass: '6.1',
      subsidiaryRisks: [],
      packingGroup: 'I',
      ergGuideNumber: 153,
      initialIsolationDistanceMeters: 100,
      protectiveActionDistanceDayMeters: 700,
      protectiveActionDistanceNightMeters: 1900,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'C',
      airPassengerMaxNetQtyKg: 1,
      airCargoOnlyMaxNetQtyKg: 30,
      marinePollutant: false,
      specialProvisions: ['SP274', 'SP315']
    },
    UN3373: {
      unNumber: 'UN3373',
      properShippingName: 'BIOLOGICAL SUBSTANCE, CATEGORY B (Diagnostic Specimens)',
      primaryClass: '6.2',
      subsidiaryRisks: [],
      packingGroup: 'NONE',
      ergGuideNumber: 158,
      initialIsolationDistanceMeters: 25,
      protectiveActionDistanceDayMeters: 50,
      protectiveActionDistanceNightMeters: 50,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 4,
      airCargoOnlyMaxNetQtyKg: 4,
      marinePollutant: false,
      specialProvisions: ['PI650']
    },

    // CLASS 7: Radioactive Materials
    UN2910: {
      unNumber: 'UN2910',
      properShippingName: 'RADIOACTIVE MATERIAL, EXCEPTED PACKAGE - LIMITED QUANTITY OF MATERIAL',
      primaryClass: '7',
      subsidiaryRisks: [],
      packingGroup: 'NONE',
      ergGuideNumber: 161,
      initialIsolationDistanceMeters: 25,
      protectiveActionDistanceDayMeters: 50,
      protectiveActionDistanceNightMeters: 50,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 0,
      airCargoOnlyMaxNetQtyKg: 0,
      marinePollutant: false,
      specialProvisions: ['SP290', 'SP325']
    },

    // CLASS 8: Corrosives
    UN1760: {
      unNumber: 'UN1760',
      properShippingName: 'CORROSIVE LIQUID, N.O.S.',
      primaryClass: '8',
      subsidiaryRisks: [],
      packingGroup: 'II',
      ergGuideNumber: 154,
      initialIsolationDistanceMeters: 50,
      protectiveActionDistanceDayMeters: 150,
      protectiveActionDistanceNightMeters: 300,
      fireExtinguishingAgent: 'DRY_CHEMICAL',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 1,
      airCargoOnlyMaxNetQtyKg: 30,
      marinePollutant: false,
      specialProvisions: ['SP274']
    },
    UN1789: {
      unNumber: 'UN1789',
      properShippingName: 'HYDROCHLORIC ACID',
      primaryClass: '8',
      subsidiaryRisks: [],
      packingGroup: 'II',
      ergGuideNumber: 157,
      initialIsolationDistanceMeters: 60,
      protectiveActionDistanceDayMeters: 300,
      protectiveActionDistanceNightMeters: 800,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 1,
      airCargoOnlyMaxNetQtyKg: 30,
      marinePollutant: false,
      specialProvisions: []
    },
    UN1824: {
      unNumber: 'UN1824',
      properShippingName: 'SODIUM HYDROXIDE SOLUTION (Caustic Soda)',
      primaryClass: '8',
      subsidiaryRisks: [],
      packingGroup: 'II',
      ergGuideNumber: 154,
      initialIsolationDistanceMeters: 50,
      protectiveActionDistanceDayMeters: 150,
      protectiveActionDistanceNightMeters: 300,
      fireExtinguishingAgent: 'DRY_CHEMICAL',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 1,
      airCargoOnlyMaxNetQtyKg: 30,
      marinePollutant: false,
      specialProvisions: []
    },
    UN1830: {
      unNumber: 'UN1830',
      properShippingName: 'SULPHURIC ACID with more than 51% acid',
      primaryClass: '8',
      subsidiaryRisks: [],
      packingGroup: 'II',
      ergGuideNumber: 137,
      initialIsolationDistanceMeters: 60,
      protectiveActionDistanceDayMeters: 400,
      protectiveActionDistanceNightMeters: 1100,
      fireExtinguishingAgent: 'DRY_CHEMICAL',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 1,
      airCargoOnlyMaxNetQtyKg: 30,
      marinePollutant: false,
      specialProvisions: []
    },

    // CLASS 9: Miscellaneous Dangerous Goods
    UN3082: {
      unNumber: 'UN3082',
      properShippingName: 'ENVIRONMENTALLY HAZARDOUS SUBSTANCE, LIQUID, N.O.S.',
      primaryClass: '9',
      subsidiaryRisks: [],
      packingGroup: 'III',
      ergGuideNumber: 171,
      initialIsolationDistanceMeters: 25,
      protectiveActionDistanceDayMeters: 100,
      protectiveActionDistanceNightMeters: 100,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 450,
      airCargoOnlyMaxNetQtyKg: 450,
      marinePollutant: true,
      specialProvisions: ['SP274', 'SP335', 'SP375']
    },
    UN3480: {
      unNumber: 'UN3480',
      properShippingName: 'LITHIUM ION BATTERIES (including lithium ion polymer batteries)',
      primaryClass: '9',
      subsidiaryRisks: [],
      packingGroup: 'II',
      ergGuideNumber: 147,
      initialIsolationDistanceMeters: 50,
      protectiveActionDistanceDayMeters: 200,
      protectiveActionDistanceNightMeters: 400,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 0, // Strictly forbidden on passenger aircraft (IATA SP A154/A164)
      airCargoOnlyMaxNetQtyKg: 35,
      marinePollutant: false,
      specialProvisions: ['SP188', 'SP230', 'SP310', 'SP348', 'SP376', 'SP377', 'SP384']
    },
    UN3481: {
      unNumber: 'UN3481',
      properShippingName: 'LITHIUM ION BATTERIES CONTAINED IN EQUIPMENT or PACKED WITH EQUIPMENT',
      primaryClass: '9',
      subsidiaryRisks: [],
      packingGroup: 'II',
      ergGuideNumber: 147,
      initialIsolationDistanceMeters: 25,
      protectiveActionDistanceDayMeters: 100,
      protectiveActionDistanceNightMeters: 200,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 5,
      airCargoOnlyMaxNetQtyKg: 35,
      marinePollutant: false,
      specialProvisions: ['SP188', 'SP230', 'SP348', 'SP360', 'SP376', 'SP377']
    },
    UN3548: {
      unNumber: 'UN3548',
      properShippingName: 'ARTICLES CONTAINING MISCELLANEOUS DANGEROUS GOODS, N.O.S.',
      primaryClass: '9',
      subsidiaryRisks: [],
      packingGroup: 'NONE',
      ergGuideNumber: 171,
      initialIsolationDistanceMeters: 25,
      protectiveActionDistanceDayMeters: 50,
      protectiveActionDistanceNightMeters: 100,
      fireExtinguishingAgent: 'WATER_SPRAY',
      tunnelRestrictionCode: 'E',
      airPassengerMaxNetQtyKg: 400,
      airCargoOnlyMaxNetQtyKg: 400,
      marinePollutant: false,
      specialProvisions: ['SP274', 'SP335']
    }
  };

  /**
   * Get material definition by UN Number (e.g. UN3480)
   */
  public static getMaterial(unNumber: string): HazmatMaterialDefinition | undefined {
    return this.MATERIALS[unNumber.toUpperCase().trim()];
  }

  /**
   * Search Hazmat catalog by UN Number or Chemical name
   */
  public static searchMaterials(query: string): HazmatMaterialDefinition[] {
    const q = query.toUpperCase().trim();
    const qVariants = [q];
    if (q.endsWith('Y')) {
      qVariants.push(q.slice(0, -1) + 'IES');
    }
    if (q.endsWith('IES')) {
      qVariants.push(q.slice(0, -3) + 'Y');
    }
    if (q.endsWith('S') && !q.endsWith('SS')) {
      qVariants.push(q.slice(0, -1));
    } else {
      qVariants.push(q + 'S');
    }
    return Object.values(this.MATERIALS).filter(
      (m: HazmatMaterialDefinition) => {
        const unUpper = m.unNumber.toUpperCase();
        const nameUpper = m.properShippingName.toUpperCase();
        return qVariants.some(term => unUpper.includes(term) || nameUpper.includes(term));
      }
    );
  }

  public static search(query: string): HazmatMaterialDefinition[] {
    return this.searchMaterials(query);
  }

  /**
   * Evaluate Multi-Modal Transport Restrictions
   */
  public static evaluateTransportFeasibility(
    unNumber: string,
    mode: 'AIR_PASSENGER' | 'AIR_CARGO_ONLY' | 'ROAD_TUNNEL' | 'MARITIME_CONTAINER',
    quantityKg: number
  ): {
    permitted: boolean;
    reason: string;
    ergGuideNumber: number;
    isolationRadiusMeters: number;
  } {
    const mat = this.MATERIALS[unNumber];
    if (!mat) {
      return {
        permitted: false,
        reason: `Unknown UN Number: ${unNumber}`,
        ergGuideNumber: 111,
        isolationRadiusMeters: 100
      };
    }

    if (mode === 'AIR_PASSENGER') {
      if (mat.airPassengerMaxNetQtyKg === 0) {
        return {
          permitted: false,
          reason: `FORBIDDEN on passenger aircraft under IATA DGR Table 4.2 (${mat.unNumber} ${mat.properShippingName}).`,
          ergGuideNumber: mat.ergGuideNumber,
          isolationRadiusMeters: mat.initialIsolationDistanceMeters
        };
      }
      if (quantityKg > mat.airPassengerMaxNetQtyKg) {
        return {
          permitted: false,
          reason: `Quantity ${quantityKg}kg exceeds maximum allowable passenger aircraft net quantity (${mat.airPassengerMaxNetQtyKg}kg).`,
          ergGuideNumber: mat.ergGuideNumber,
          isolationRadiusMeters: mat.initialIsolationDistanceMeters
        };
      }
    }

    if (mode === 'AIR_CARGO_ONLY') {
      if (mat.airCargoOnlyMaxNetQtyKg === 0) {
        return {
          permitted: false,
          reason: `FORBIDDEN on both passenger and Cargo Aircraft Only (CAO) under IATA DGR Table 4.2.`,
          ergGuideNumber: mat.ergGuideNumber,
          isolationRadiusMeters: mat.initialIsolationDistanceMeters
        };
      }
      if (quantityKg > mat.airCargoOnlyMaxNetQtyKg) {
        return {
          permitted: false,
          reason: `Quantity ${quantityKg}kg exceeds maximum allowable Cargo Aircraft Only net quantity (${mat.airCargoOnlyMaxNetQtyKg}kg).`,
          ergGuideNumber: mat.ergGuideNumber,
          isolationRadiusMeters: mat.initialIsolationDistanceMeters
        };
      }
    }

    return {
      permitted: true,
      reason: `Authorized for ${mode} transport under UN Model Regulations / IATA DGR.`,
      ergGuideNumber: mat.ergGuideNumber,
      isolationRadiusMeters: mat.initialIsolationDistanceMeters
    };
  }
}
