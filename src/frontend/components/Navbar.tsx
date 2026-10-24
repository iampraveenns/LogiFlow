/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Top Navigation Bar
 */

import React from 'react';
import {
  Globe2,
  Cpu,
  Play,
  Pause,
  FastForward,
  AlertTriangle,
  Beaker,
  ShieldCheck,
  Building2,
  UserCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { UserRole, Organization } from '../../packages/shared-types/index.ts';
import { SimulationSpeed } from '../hooks/useSimulation.ts';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  selectedOrg: Organization;
  organizations: Organization[];
  onOrgChange: (orgId: string) => void;
  simulationSpeed: SimulationSpeed;
  onSpeedChange: (speed: SimulationSpeed) => void;
  onTriggerDisruption: (type: 'HARSH_BRAKING' | 'DTC_FAULT' | 'REEFER_SPIKE' | 'CUSTOMS_HOLD' | 'GEOFENCE_EXIT') => void;
  onOpenTestRunner: () => void;
  onToggleAiCopilot: () => void;
  activeAlerts: string[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  selectedOrg,
  organizations,
  onOrgChange,
  simulationSpeed,
  onSpeedChange,
  onTriggerDisruption,
  onOpenTestRunner,
  onToggleAiCopilot,
  activeAlerts,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-xl">
      {/* Brand & Organization */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <Globe2 className="h-5 w-5 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">
                LOGIFLOW
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              v4.2.0 • Real-Time Telematics Active
            </p>
          </div>
        </div>

        {/* Organization Switcher */}
        <div className="hidden lg:flex items-center gap-1.5 pl-4 border-l border-slate-800">
          <Building2 className="h-4 w-4 text-slate-400" />
          <div className="relative">
            <select
              value={selectedOrg.id}
              onChange={(e) => onOrgChange(e.target.value)}
              className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-xs rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.tier})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Central Simulation Controls & Disruption Generator */}
      <div className="flex items-center gap-3">
        {/* Speed Controls */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-1 flex items-center gap-1">
          <span className="text-[11px] font-mono text-slate-400 px-2 flex items-center gap-1">
            <Cpu className="h-3 w-3 text-cyan-400" />
            SIM
          </span>
          <button
            onClick={() => onSpeedChange(0)}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1 ${
              simulationSpeed === 0 ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Pause Kinematics"
          >
            <Pause className="h-3 w-3" /> 0x
          </button>
          <button
            onClick={() => onSpeedChange(1)}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1 ${
              simulationSpeed === 1 ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Real-time 1x"
          >
            <Play className="h-3 w-3" /> 1x
          </button>
          <button
            onClick={() => onSpeedChange(5)}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1 ${
              simulationSpeed === 5 ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Accelerated 5x"
          >
            <FastForward className="h-3 w-3" /> 5x
          </button>
          <button
            onClick={() => onSpeedChange(10)}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1 ${
              simulationSpeed === 10 ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Super-fast 10x"
          >
            10x
          </button>
        </div>

        {/* Disruption Trigger Dropdown */}
        <div className="relative group">
          <button className="bg-red-950/60 hover:bg-red-900/60 border border-red-800/80 text-red-300 text-xs px-2.5 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-colors">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            <span>Simulate Disruption</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>
          <div className="absolute right-0 mt-1 w-60 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 hidden group-hover:block z-50">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              Inject Real-World Anomaly
            </div>
            <button
              onClick={() => onTriggerDisruption('DTC_FAULT')}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <span>OBD-II Engine Misfire (P0300)</span>
              <span className="text-[10px] text-red-400 font-mono">Critical</span>
            </button>
            <button
              onClick={() => onTriggerDisruption('REEFER_SPIKE')}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <span>Cold-Chain Temp Breach (-4°C)</span>
              <span className="text-[10px] text-amber-400 font-mono">Cold-Chain</span>
            </button>
            <button
              onClick={() => onTriggerDisruption('HARSH_BRAKING')}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <span>Emergency Harsh Braking</span>
              <span className="text-[10px] text-yellow-400 font-mono">Telematics</span>
            </button>
            <button
              onClick={() => onTriggerDisruption('CUSTOMS_HOLD')}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <span>Port Customs Inspection Hold</span>
              <span className="text-[10px] text-orange-400 font-mono">Customs</span>
            </button>
            <button
              onClick={() => onTriggerDisruption('GEOFENCE_EXIT')}
              className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <span>Geofence Boundary Breach</span>
              <span className="text-[10px] text-cyan-400 font-mono">Security</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Controls: Role Switcher, Test Runner, AI Copilot */}
      <div className="flex items-center gap-3">
        {/* Role Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-md px-2.5 py-1">
          <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Acting Role</span>
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-transparent text-xs font-semibold text-cyan-300 focus:outline-none cursor-pointer"
            >
              <option value="DISPATCHER" className="bg-slate-900 text-slate-200">Dispatcher (Active Operations)</option>
              <option value="ADMIN" className="bg-slate-900 text-slate-200">Global Admin (Universal Access)</option>
              <option value="WAREHOUSE_MANAGER" className="bg-slate-900 text-slate-200">Warehouse Manager</option>
              <option value="FLEET_DRIVER" className="bg-slate-900 text-slate-200">Fleet Driver (In-Cab)</option>
              <option value="COMPLIANCE_AUDITOR" className="bg-slate-900 text-slate-200">Compliance &amp; Customs Auditor</option>
            </select>
          </div>
        </div>

        {/* Test Suite Button */}
        <button
          onClick={onOpenTestRunner}
          className="bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-700 text-emerald-300 text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-colors shadow-sm"
          title="Open QA Test Suite Runner"
        >
          <Beaker className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline">QA Suite</span>
        </button>

        {/* AI Copilot Button */}
        <button
          onClick={onToggleAiCopilot}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold transition-all shadow-md shadow-blue-900/40"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
          <span>AI Copilot</span>
        </button>
      </div>

      {/* Live Alert Ticker Bar */}
      {activeAlerts.length > 0 && (
        <div className="w-full bg-slate-950/90 border-t border-slate-800/80 -mx-4 -mb-2.5 px-4 py-1 flex items-center gap-2 overflow-hidden">
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
            LIVE FEED:
          </div>
          <div className="text-xs text-slate-300 truncate font-mono">
            {activeAlerts[0]}
          </div>
        </div>
      )}
    </header>
  );
};
