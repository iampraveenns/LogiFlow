/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Predictive Demand Forecasting & ML Analytics
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Brain,
  Layers,
  Sparkles,
  BarChart3,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { InventoryItem } from '../../packages/shared-types/index.ts';
import { InventoryForecastService, InventoryAnalysisResult } from '../../backend/services/inventoryForecastService.ts';

interface AnalyticsForecastViewProps {
  inventory: InventoryItem[];
  initialSku?: string;
}

export const AnalyticsForecastView: React.FC<AnalyticsForecastViewProps> = ({
  inventory,
  initialSku,
}) => {
  const [selectedSku, setSelectedSku] = useState<string>(initialSku || inventory[0]?.sku || '');
  const [forecastResult, setForecastResult] = useState<InventoryAnalysisResult | null>(null);

  const currentItem = inventory.find((i) => i.sku === selectedSku) || inventory[0];

  useEffect(() => {
    if (currentItem) {
      const res = InventoryForecastService.generate12MonthForecast(currentItem);
      setForecastResult(res);
    }
  }, [selectedSku, currentItem]);

  if (!forecastResult || !currentItem) {
    return <div className="p-6 text-slate-400">Loading forecast analytics...</div>;
  }

  // Find max value for SVG chart scaling
  const maxVal = Math.max(...forecastResult.forecast12Months.map((d) => d.upperConfidenceBound)) * 1.15;
  const chartHeight = 220;
  const chartWidth = 700;

  // Generate SVG path for baseline curve
  const points = forecastResult.forecast12Months.map((d, idx) => {
    const x = (idx / 11) * (chartWidth - 60) + 30;
    const y = chartHeight - (d.forecastBaseline / maxVal) * (chartHeight - 40) - 20;
    return `${x},${y}`;
  });
  const baselinePath = `M ${points.join(' L ')}`;

  // Generate SVG polygon for confidence interval ribbon
  const upperPoints = forecastResult.forecast12Months.map((d, idx) => {
    const x = (idx / 11) * (chartWidth - 60) + 30;
    const y = chartHeight - (d.upperConfidenceBound / maxVal) * (chartHeight - 40) - 20;
    return `${x},${y}`;
  });
  const lowerPoints = forecastResult.forecast12Months.slice().reverse().map((d, idx) => {
    const origIdx = 11 - idx;
    const x = (origIdx / 11) * (chartWidth - 60) + 30;
    const y = chartHeight - (d.lowerConfidenceBound / maxVal) * (chartHeight - 40) - 20;
    return `${x},${y}`;
  });
  const ribbonPath = `M ${upperPoints.join(' L ')} L ${lowerPoints.join(' L ')} Z`;

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-cyan-400" />
            12-Month Predictive Demand &amp; ML Safety Stock Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Triple exponential smoothing (Holt-Winters), lead-time variance modeling, and automated Economic Order Quantity (EOQ).
          </p>
        </div>

        {/* SKU Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-semibold">Select SKU:</label>
          <select
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
          >
            {inventory.map((inv) => (
              <option key={inv.sku} value={inv.sku}>
                {inv.sku} - {inv.name.slice(0, 36)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Recommended Safety Stock</div>
          <div className="text-2xl font-mono font-black text-cyan-400 mt-1">
            {forecastResult.recommendedSafetyStock.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Based on 95% service level</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Dynamic Reorder Point (ROP)</div>
          <div className="text-2xl font-mono font-black text-white mt-1">
            {forecastResult.recommendedReorderPoint.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">14-day lead time window</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Economic Order Quantity (EOQ)</div>
          <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
            {forecastResult.economicOrderQuantity.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Minimizes holding vs setup costs</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Stockout Probability</div>
          <div
            className={`text-2xl font-mono font-black mt-1 ${
              forecastResult.stockoutProbabilityPercent > 30 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {forecastResult.stockoutProbabilityPercent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Status: <strong>{forecastResult.stockHealthStatus}</strong>
          </div>
        </div>
      </div>

      {/* High-Fidelity SVG Forecast Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              12-Month Demand Projection Curve with Confidence Bounds
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Target SKU: {currentItem.sku} ({currentItem.category})
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="h-2 w-4 bg-cyan-400 rounded-sm"></span> Forecast Baseline
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="h-2 w-4 bg-blue-500/30 border border-blue-500 rounded-sm"></span> 95% Confidence
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto py-2">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-64 bg-slate-950 rounded-lg p-2">
            <defs>
              <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0.25, 0.5, 0.75, 1.0].map((frac) => {
              const y = chartHeight - frac * (chartHeight - 40) - 20;
              return (
                <g key={frac}>
                  <line x1="30" y1={y} x2={chartWidth - 30} y2={y} stroke="#1e293b" strokeDasharray="3,3" />
                  <text x="25" y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                    {Math.round(maxVal * frac)}
                  </text>
                </g>
              );
            })}

            {/* Confidence Interval Ribbon */}
            <path d={ribbonPath} fill="url(#ribbonGrad)" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="2,2" />

            {/* Baseline Curve */}
            <path d={baselinePath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

            {/* Data Points */}
            {forecastResult.forecast12Months.map((d, idx) => {
              const x = (idx / 11) * (chartWidth - 60) + 30;
              const y = chartHeight - (d.forecastBaseline / maxVal) * (chartHeight - 40) - 20;
              return (
                <g key={d.month}>
                  <circle cx={x} cy={y} r="4" fill="#06b6d4" stroke="#020617" strokeWidth="1.5" />
                  <text x={x} y={chartHeight - 5} fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    {d.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
