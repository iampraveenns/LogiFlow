/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Collapsible Main Sidebar Navigation
 */

import React from 'react';
import {
  MapPin,
  Package,
  Truck,
  Warehouse,
  Route,
  TrendingUp,
  FileCheck2,
  Terminal,
} from 'lucide-react';

export type NavTab = 'MAP' | 'SHIPMENTS' | 'FLEET' | 'WAREHOUSE' | 'ROUTE' | 'FORECAST' | 'COMPLIANCE' | 'LOGS';

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
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: { text: string | number; color: string } }[] = [
    {
      id: 'MAP',
      label: 'Global Fleet Map',
      icon: <MapPin className="h-4 w-4" />,
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
      id: 'ROUTE',
      label: 'Route Optimizer (A*)',
      icon: <Route className="h-4 w-4" />,
    },
    {
      id: 'FORECAST',
      label: 'Demand Forecasting & ML',
      icon: <TrendingUp className="h-4 w-4" />,
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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div className="py-4">
        <div className="px-4 pb-3 mb-2 border-b border-slate-800/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Operations Core
        </div>
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/20 text-cyan-300 border border-cyan-700/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${item.badge.color}`}
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
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span>Global Latency</span>
          <span className="font-mono text-emerald-400">18 ms</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Encryption</span>
          <span className="font-mono text-cyan-400">SHA-256 RSA</span>
        </div>
      </div>
    </aside>
  );
};
