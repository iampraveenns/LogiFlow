/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Zero-Trust SIEM & Security Operations Center (SOC)
 * Visualizes live authentication events, impossible travel velocity alerts,
 * Merkle tree audit roots, and automated containment actions.
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Globe,
  Key,
  Database,
  Activity,
  Zap,
  CheckCircle,
  XCircle,
  Copy,
} from 'lucide-react';
import { SecurityAuditEngine, SecurityEventRecord, SecurityThreatLevel } from '../../backend/services/securityAuditEngine.ts';

export function SecurityAuditSiemView() {
  const [threatFilter, setThreatFilter] = useState<SecurityThreatLevel | 'ALL'>('ALL');
  const [events, setEvents] = useState<SecurityEventRecord[]>(SecurityAuditEngine.getSecurityEvents());
  const [metrics, setMetrics] = useState(SecurityAuditEngine.getThreatMetrics());
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filteredEvents = threatFilter === 'ALL'
    ? events
    : events.filter((e) => e.threatLevel === threatFilter);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleUnblock = (ip: string) => {
    SecurityAuditEngine.unblockIp(ip);
    setMetrics(SecurityAuditEngine.getThreatMetrics());
  };

  const handleSimulateAttack = () => {
    // Record simulated impossible travel anomaly
    const newEv = SecurityAuditEngine.recordSecurityEvent({
      eventType: 'AUTH_IMPOSSIBLE_TRAVEL',
      threatLevel: 'CRITICAL',
      principalId: 'usr-disp-02',
      principalEmail: 'frank.mueller@apexlogistics.io',
      principalRole: 'DISPATCHER',
      tenantId: 'tenant-apex',
      ipAddress: '198.51.100.77',
      location: { city: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
      details: 'Instantaneous login attempt from São Paulo after active session in Hamburg. Geodesic speed: 9,840 km/h.',
      timestamp: new Date().toISOString(),
    });

    setEvents(SecurityAuditEngine.getSecurityEvents());
    setMetrics(SecurityAuditEngine.getThreatMetrics());
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Zero-Trust SIEM &amp; Security Operations Center
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800">
              SOC LEVEL 1 ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time IP geo-velocity anomaly detection, JWT replay defense, and SHA-256 Merkle audit trail chaining.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateAttack}
            className="px-3.5 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-semibold flex items-center gap-2 transition"
          >
            <Zap className="w-3.5 h-3.5 text-red-400" />
            Simulate Velocity Breach
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Auth Events</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{metrics.totalEvents}</div>
          <div className="text-[10px] text-slate-500 mt-1">Logged to memory buffer</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Critical Anomaly Alerts</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">{metrics.criticalEvents}</div>
          <div className="text-[10px] text-red-400/80 mt-1">Automated containment tripped</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Blocked Subnets / IPs</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{metrics.blockedIpsCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Blacklist firewall enforced</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Active Merkle Tree Root</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xs font-mono text-emerald-400 truncate max-w-[180px]">
            {metrics.latestMerkleRoot.slice(0, 16)}...
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1">Immutable cryptographic chain</div>
        </div>
      </div>

      {/* Merkle Root Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-200">Current Cryptographic Audit Merkle Root</div>
            <div className="font-mono text-[11px] text-emerald-400 break-all">
              {metrics.latestMerkleRoot}
            </div>
          </div>
        </div>
        <button
          onClick={() => handleCopy(metrics.latestMerkleRoot)}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 shrink-0 transition"
        >
          <Copy className="w-3.5 h-3.5 text-blue-400" />
          {copiedHash === metrics.latestMerkleRoot ? 'Copied Root!' : 'Copy Root Hash'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setThreatFilter(lvl)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              threatFilter === lvl
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Events Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Live Telemetry Audit Feed ({filteredEvents.length} Records)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Threat Level</th>
                <th className="p-3">Event Classification</th>
                <th className="p-3">Principal Identity</th>
                <th className="p-3">IP &amp; Geolocation</th>
                <th className="p-3">Operational Details</th>
                <th className="p-3">Merkle Leaf Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredEvents.map((ev) => {
                const isCrit = ev.threatLevel === 'CRITICAL';
                const isHigh = ev.threatLevel === 'HIGH';
                return (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCrit
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : isHigh
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {ev.threatLevel}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] font-semibold text-white whitespace-nowrap">
                      {ev.eventType}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{ev.principalEmail}</div>
                      <div className="text-[10px] text-blue-400 uppercase font-mono">{ev.principalRole}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-mono text-[11px] text-slate-300">{ev.ipAddress}</div>
                      {ev.location && (
                        <div className="text-[10px] text-slate-500">
                          {ev.location.city}, {ev.location.country}
                        </div>
                      )}
                    </td>
                    <td className="p-3 max-w-md text-[11px] text-slate-300">
                      {ev.details}
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        {new Date(ev.timestamp).toLocaleTimeString()} • {new Date(ev.timestamp).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap font-mono text-[10px] text-slate-500">
                      <button
                        onClick={() => handleCopy(ev.merkleLeafHash)}
                        className="hover:text-emerald-400 flex items-center gap-1 transition"
                        title="Click to copy SHA-256 leaf hash"
                      >
                        {ev.merkleLeafHash.slice(0, 10)}...
                        <Copy className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
