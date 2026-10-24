/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Multi-Warehouse & Bin Inventory Explorer
 */

import React, { useState } from 'react';
import {
  Warehouse,
  Boxes,
  Layers,
  AlertTriangle,
  Plus,
  Minus,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import { WarehouseFacility, InventoryItem } from '../../packages/shared-types/index.ts';

interface WarehouseInventoryViewProps {
  warehouses: WarehouseFacility[];
  inventory: InventoryItem[];
  onUpdateStock: (sku: string, delta: number) => void;
  onInspectForecast: (sku: string) => void;
}

export const WarehouseInventoryView: React.FC<WarehouseInventoryViewProps> = ({
  warehouses,
  inventory,
  onUpdateStock,
  onInspectForecast,
}) => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || '');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];

  const filteredInventory = inventory.filter((item) => {
    const matchesWarehouse = !selectedWarehouseId || item.warehouseId === selectedWarehouseId;
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesWarehouse && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-cyan-400" />
            Global Warehouse &amp; Bin Matrix Inventory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Multi-facility cross-docking, batch expiration monitoring, bin-level locators, and automated safety stock reorder triggers.
          </p>
        </div>

        {/* Warehouse Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-semibold">Active Hub:</label>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
          >
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.location.city}, {wh.location.country})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Warehouse Facility Stats Banner */}
      {selectedWarehouse && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Hub Designation</div>
            <div className="text-sm font-bold text-white mt-0.5">{selectedWarehouse.name}</div>
            <div className="text-xs text-cyan-400 font-mono mt-0.5">
              Code: {selectedWarehouse.code} • {selectedWarehouse.type}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Capacity Utilization</div>
            <div className="text-sm font-mono font-bold text-white mt-0.5">
              {selectedWarehouse.capacityUtilizationPercent}%
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  selectedWarehouse.capacityUtilizationPercent > 85 ? 'bg-amber-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${selectedWarehouse.capacityUtilizationPercent}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Loading Docks</div>
            <div className="text-sm font-mono font-bold text-slate-200 mt-0.5">
              {selectedWarehouse.activeDocks} / {selectedWarehouse.totalDocks} Active Docks
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {(selectedWarehouse.totalAreaSqMeters / 1000).toLocaleString()}k m² Floor Area
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Today Throughput</div>
            <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
              +{selectedWarehouse.inboundShipmentsToday} In / -{selectedWarehouse.outboundShipmentsToday} Out
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Cross-dock velocity optimal</div>
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'ELECTRONICS', 'PHARMACEUTICALS', 'AUTOMOTIVE', 'PERISHABLE', 'RAW_MATERIALS'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors whitespace-nowrap ${
              categoryFilter === cat
                ? 'bg-cyan-600 text-white font-bold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* SKU Inventory Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="p-3.5">SKU &amp; Product</th>
              <th className="p-3.5">Bin Coordinates</th>
              <th className="p-3.5">Quantity On Hand</th>
              <th className="p-3.5">Reorder Point / Safety</th>
              <th className="p-3.5">Stockout Risk</th>
              <th className="p-3.5">Batch &amp; Expiry</th>
              <th className="p-3.5 text-right">Adjust Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredInventory.map((item) => {
              const isBelowReorder = item.quantityOnHand <= item.reorderPoint;
              const isBelowSafety = item.quantityOnHand <= item.safetyStock;

              return (
                <tr key={item.sku} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5">
                    <div className="font-mono font-bold text-cyan-300">{item.sku}</div>
                    <div className="text-slate-200 font-medium mt-0.5">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      ${item.unitCostUsd.toLocaleString()} USD / unit
                    </div>
                  </td>
                  <td className="p-3.5 font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                      {item.binLocation.aisle}-{item.binLocation.rack}-{item.binLocation.shelf}-{item.binLocation.bin}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="text-base font-mono font-bold text-white">
                      {item.quantityOnHand.toLocaleString()}{' '}
                      <span className="text-[10px] font-normal text-slate-400">units</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Allocated: {item.quantityAllocated.toLocaleString()}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-mono text-slate-300">
                      ROP: <strong>{item.reorderPoint.toLocaleString()}</strong>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      Safety: {item.safetyStock.toLocaleString()}
                    </div>
                  </td>
                  <td className="p-3.5">
                    {isBelowSafety ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800 flex items-center gap-1 w-fit">
                        <AlertTriangle className="h-3 w-3" />
                        CRITICAL ({item.stockoutRiskPercent}%)
                      </span>
                    ) : isBelowReorder ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1 w-fit">
                        <TrendingDown className="h-3 w-3" />
                        REORDER ({item.stockoutRiskPercent}%)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="h-3 w-3" />
                        HEALTHY
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <div className="text-slate-300 font-mono text-[11px]">{item.batchNumber}</div>
                    {item.expiryDate && (
                      <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        Exp: {item.expiryDate}
                      </div>
                    )}
                  </td>
                  <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => onInspectForecast(item.sku)}
                      className="px-2.5 py-1 bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 rounded font-semibold text-xs inline-flex items-center gap-1 mr-2"
                      title="View 12-Month Demand Forecast"
                    >
                      <Sparkles className="h-3 w-3 text-amber-300" />
                      <span>Forecast</span>
                    </button>
                    <button
                      onClick={() => onUpdateStock(item.sku, -50)}
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                      title="Simulate Outbound Pull (-50)"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateStock(item.sku, 100)}
                      className="p-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded transition-colors"
                      title="Replenish Restock (+100)"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
