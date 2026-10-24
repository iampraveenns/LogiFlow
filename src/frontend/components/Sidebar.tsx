/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Collapsible Main Sidebar Navigation
 */

import React from 'react';
import {
  MapPin,
  Kanban,
  Package,
  Truck,
  Warehouse,
  Route,
  TrendingUp,
  Cpu,
  Briefcase,
  Thermometer,
  Wrench,
  Code2,
  FileCheck2,
  Terminal,
  Leaf,
  Grid,
  FileCheck,
  ShieldAlert,
  Boxes,
  Plane,
  Radio,
  Anchor,
  Train,
  Globe,
  Calculator,
  Flame,
  Ship,
  Beaker,
} from 'lucide-react';

export type NavTab =
  | 'MAP'
  | 'DISPATCH'
  | 'SHIPMENTS'
  | 'FLEET'
  | 'WAREHOUSE'
  | 'YARD'
  | 'WAVE_PICKING'
  | 'ROUTE'
  | 'AIR_CARGO'
  | 'DRONE_LAST_MILE'
  | 'MARITIME'
  | 'PORT_TERMINAL'
  | 'INTERMODAL'
  | 'FREIGHT_RATING'
  | 'CUSTOMS_TARIFF'
  | 'HAZMAT_REGISTRY'
  | 'PHARMA_STABILITY'
  | 'DIGITAL_TWIN'
  | 'FORECAST'
  | 'PROCUREMENT'
  | 'COLD_CHAIN'
  | 'MAINTENANCE'
  | 'ESG'
  | 'AUDIT_BILLING'
  | 'SANCTIONS'
  | 'EDI_CUSTOMS'
  | 'COMPLIANCE'
  | 'LOGS';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  shipmentCount: number;
  dtcCount: number;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  shipmentCount,
  dtcCount,
  lowStockCount,
}) => {
  const operationsItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: { text: string | number; color: string } }[] = [
    {
      id: 'MAP',
      label: 'Global Fleet Map',
      icon: <MapPin className="h-4 w-4" />,
    },
    {
      id: 'DISPATCH',
      label: 'Dispatch Board',
      icon: <Kanban className="h-4 w-4" />,
      badge: { text: 'LIVE', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-800' },
    },
    {
      id: 'SHIPMENTS',
      label: 'Shipments & Waybills',
      icon: <Package className="h-4 w-4" />,
      badge: shipmentCount > 0 ? { text: shipmentCount, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-800' } : undefined,
    },
    {
      id: 'FLEET',
      label: 'Fleet & OBD-II DTC',
      icon: <Truck className="h-4 w-4" />,
      badge: dtcCount > 0 ? { text: `${dtcCount} DTC`, color: 'bg-red-500/20 text-red-300 border-red-800 animate-pulse' } : undefined,
    },
    {
      id: 'WAREHOUSE',
      label: 'Warehouse & Inventory',
      icon: <Warehouse className="h-4 w-4" />,
      badge: lowStockCount > 0 ? { text: `${lowStockCount} LOW`, color: 'bg-amber-500/20 text-amber-300 border-amber-800' } : undefined,
    },
    {
      id: 'YARD',
      label: 'Yard & Dock YMS',
      icon: <Grid className="h-4 w-4" />,
      badge: { text: '12 DOCKS', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-800' },
    },
    {
      id: 'WAVE_PICKING',
      label: 'Cross-Dock & Wave Pick',
      icon: <Boxes className="h-4 w-4" />,
    },
    {
      id: 'ROUTE',
      label: 'Route Optimizer (A*)',
      icon: <Route className="h-4 w-4" />,
    },
    {
      id: 'AIR_CARGO',
      label: 'Air Cargo ULD & Trim',
      icon: <Plane className="h-4 w-4" />,
      badge: { text: '% MAC', color: 'bg-sky-500/20 text-sky-300 border-sky-800' },
    },
    {
      id: 'DRONE_LAST_MILE',
      label: 'Drone & AMR Delivery',
      icon: <Radio className="h-4 w-4" />,
      badge: { text: 'PART 107', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-800' },
    },
    {
      id: 'MARITIME',
      label: 'Maritime & AIS Fleet',
      icon: <Anchor className="h-4 w-4" />,
      badge: { text: 'AIS LIVE', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-800' },
    },
    {
      id: 'PORT_TERMINAL',
      label: 'Marine Port & Cranes',
      icon: <Ship className="h-4 w-4" />,
      badge: { text: 'QCASP', color: 'bg-blue-500/20 text-blue-300 border-blue-800' },
    },
    {
      id: 'INTERMODAL',
      label: 'Intermodal Rail & Yard',
      icon: <Train className="h-4 w-4" />,
      badge: { text: '286k GRL', color: 'bg-amber-500/20 text-amber-300 border-amber-800' },
    },
  ];

  const intelligenceItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: { text: string | number; color: string } }[] = [
    {
      id: 'FREIGHT_RATING',
      label: 'Multi-Modal Freight Rater',
      icon: <Calculator className="h-4 w-4" />,
      badge: { text: 'NMFC', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-800' },
    },
    {
      id: 'CUSTOMS_TARIFF',
      label: 'Customs HTS & Duty',
      icon: <Globe className="h-4 w-4" />,
      badge: { text: 'SEC 301', color: 'bg-red-500/20 text-red-300 border-red-800' },
    },
    {
      id: 'HAZMAT_REGISTRY',
      label: 'Hazmat & Dangerous Goods',
      icon: <Flame className="h-4 w-4" />,
      badge: { text: 'UN DGR', color: 'bg-red-500/20 text-red-300 border-red-800' },
    },
    {
      id: 'PHARMA_STABILITY',
      label: 'Pharma GDP Stability',
      icon: <Beaker className="h-4 w-4" />,
      badge: { text: 'MKT 83kJ', color: 'bg-teal-500/20 text-teal-300 border-teal-800' },
    },
    {
      id: 'DIGITAL_TWIN',
      label: 'Digital Twin & Risk',
      icon: <Cpu className="h-4 w-4" />,
      badge: { text: 'VaR 95%', color: 'bg-purple-500/20 text-purple-300 border-purple-800' },
    },
    {
      id: 'ESG',
      label: 'ESG Carbon Decarb',
      icon: <Leaf className="h-4 w-4" />,
      badge: { text: 'GLEC', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-800' },
    },
    {
      id: 'FORECAST',
      label: 'Predictive Demand & ML',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      id: 'PROCUREMENT',
      label: 'Procurement & Tenders',
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      id: 'COLD_CHAIN',
      label: 'IoT Cold Chain Hub',
      icon: <Thermometer className="h-4 w-4" />,
      badge: { text: 'MKT GDP', color: 'bg-blue-500/20 text-blue-300 border-blue-800' },
    },
    {
      id: 'AUDIT_BILLING',
      label: 'Freight 3-Way Audit',
      icon: <FileCheck className="h-4 w-4" />,
    },
    {
      id: 'SANCTIONS',
      label: 'Trade Sanctions Screener',
      icon: <ShieldAlert className="h-4 w-4" />,
      badge: { text: 'OFAC', color: 'bg-red-500/20 text-red-300 border-red-800' },
    },
    {
      id: 'MAINTENANCE',
      label: 'Fleet Prognostics',
      icon: <Wrench className="h-4 w-4" />,
    },
    {
      id: 'EDI_CUSTOMS',
      label: 'EDI X12 & Customs HTS',
      icon: <Code2 className="h-4 w-4" />,
    },
    {
      id: 'COMPLIANCE',
      label: 'Customs & BoL Vault',
      icon: <FileCheck2 className="h-4 w-4" />,
    },
    {
      id: 'LOGS',
      label: 'Telemetry & Audit Logs',
      icon: <Terminal className="h-4 w-4" />,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none overflow-y-auto">
      <div className="py-3">
        {/* Operations Core */}
        <div className="px-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Operations Core
        </div>
        <nav className="space-y-0.5 px-2 mb-3">
          {operationsItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/20 text-cyan-300 border border-cyan-700/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border shrink-0 ${item.badge.color}`}
                  >
                    {item.badge.text}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Intelligence & Analytics */}
        <div className="px-4 pb-2 pt-2 border-t border-slate-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Intelligence &amp; Governance
        </div>
        <nav className="space-y-0.5 px-2">
          {intelligenceItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/20 text-cyan-300 border border-cyan-700/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border shrink-0 ${item.badge.color}`}
                  >
                    {item.badge.text}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footnote */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[10px] text-slate-400 space-y-0.5">
        <div className="flex items-center justify-between">
          <span>Stochastic Engine</span>
          <span className="font-mono text-emerald-400">Monte Carlo 1k</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Standards Compliance</span>
          <span className="font-mono text-cyan-400">GLEC • ISO 14083 • OFAC</span>
        </div>
      </div>
    </aside>
  );
};
