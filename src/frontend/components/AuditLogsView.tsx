/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Structured Telemetry & Audit Logs Console
 */

import React, { useState } from 'react';
import {
  Terminal,
  Filter,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { StructuredLog, LogLevel } from '../../packages/logger/index.ts';

interface AuditLogsViewProps {
  logs: StructuredLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((l) => {
    const matchesLevel = levelFilter === 'ALL' || l.level === levelFilter;
    const matchesSearch =
      l.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.correlationId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800">CRIT</span>;
      case 'ERROR':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-900/60 text-red-300 border border-red-700">ERR</span>;
      case 'WARN':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">WARN</span>;
      case 'DEBUG':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400">DEBUG</span>;
      case 'INFO':
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">INFO</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Terminal className="h-6 w-6 text-cyan-400" />
            Centralized Telemetry &amp; Structured Audit Stream
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Winston/Pino structured telemetry, distributed correlation IDs, and immutable compliance event logs.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by message, service, correlation ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-64"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {['ALL', 'INFO', 'WARN', 'ERROR', 'CRITICAL'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2 py-1 text-xs rounded font-mono font-bold transition-colors ${
                  levelFilter === lvl
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Feed Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl font-mono text-xs">
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">
            Live Telemetry Log Stream ({filteredLogs.length} events)
          </span>
          <span className="text-[10px] text-slate-500">Auto-buffered stream active</span>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-[68vh] overflow-y-auto">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-3 hover:bg-slate-800/40 transition-colors flex items-start gap-3">
              <div className="shrink-0 pt-0.5">{getLevelBadge(log.level)}</div>
              <div className="shrink-0 text-[11px] text-slate-500 whitespace-nowrap">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="shrink-0 px-1.5 py-0.5 rounded bg-slate-800/80 text-[10px] text-cyan-300 font-bold border border-slate-700/60">
                {log.service}
              </div>
              <div className="flex-1 break-words">
                <span className="text-slate-200">{log.message}</span>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="text-[10px] text-slate-500 mt-0.5 font-sans">
                    {JSON.stringify(log.metadata)}
                  </div>
                )}
              </div>
              <div className="shrink-0 text-[10px] text-slate-500 font-mono">
                {log.correlationId.slice(-8)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
