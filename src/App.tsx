/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Global Logistics & Supply Chain Optimization Platform
 */

import React, { useState } from 'react';
import { Navbar } from './frontend/components/Navbar.tsx';
import { Sidebar, NavTab } from './frontend/components/Sidebar.tsx';
import { FleetMap } from './frontend/components/FleetMap.tsx';
import { ShipmentsView } from './frontend/components/ShipmentsView.tsx';
import { FleetTelematicsView } from './frontend/components/FleetTelematicsView.tsx';
import { WarehouseInventoryView } from './frontend/components/WarehouseInventoryView.tsx';
import { RouteOptimizerView } from './frontend/components/RouteOptimizerView.tsx';
import { AnalyticsForecastView } from './frontend/components/AnalyticsForecastView.tsx';
import { ComplianceVaultView } from './frontend/components/ComplianceVaultView.tsx';
import { AuditLogsView } from './frontend/components/AuditLogsView.tsx';
import { AiCopilotDrawer } from './frontend/components/AiCopilotDrawer.tsx';
import { TestRunnerModal } from './frontend/components/TestRunnerModal.tsx';
import { useAuth } from './frontend/hooks/useAuth.ts';
import { useSimulation } from './frontend/hooks/useSimulation.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('MAP');
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);
  const [forecastTargetSku, setForecastTargetSku] = useState<string | undefined>(undefined);

  const {
    user,
    currentRole,
    selectedOrg,
    switchRole,
    switchOrganization,
    organizations,
  } = useAuth();

  const {
    vehicles,
    waybills,
    warehouses,
    inventory,
    geofences,
    simulationSpeed,
    setSimulationSpeed,
    selectedVehicle,
    setSelectedVehicleId,
    transitionShipment,
    triggerDisruption,
    clearDtc,
    updateStock,
    logs,
    activeAlerts,
  } = useSimulation();

  // Badge counters
  const activeDtcCount = vehicles.reduce((sum, v) => sum + v.telematics.dtcCodes.length, 0);
  const lowStockCount = inventory.filter((i) => i.quantityOnHand <= i.reorderPoint).length;

  const handleInspectForecast = (sku: string) => {
    setForecastTargetSku(sku);
    setCurrentTab('FORECAST');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={switchRole}
        selectedOrg={selectedOrg}
        organizations={organizations}
        onOrgChange={switchOrganization}
        simulationSpeed={simulationSpeed}
        onSpeedChange={setSimulationSpeed}
        onTriggerDisruption={triggerDisruption}
        onOpenTestRunner={() => setIsTestRunnerOpen(true)}
        onToggleAiCopilot={() => setIsAiCopilotOpen(!isAiCopilotOpen)}
        activeAlerts={activeAlerts}
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          shipmentCount={waybills.length}
          dtcCount={activeDtcCount}
          lowStockCount={lowStockCount}
        />

        {/* Center Viewport */}
        <main className="flex-1 overflow-y-auto relative bg-slate-950">
          {currentTab === 'MAP' && (
            <FleetMap
              vehicles={vehicles}
              geofences={geofences}
              selectedVehicle={selectedVehicle}
              onSelectVehicle={setSelectedVehicleId}
              onClearDtc={clearDtc}
              onTriggerDisruption={triggerDisruption}
            />
          )}

          {currentTab === 'SHIPMENTS' && (
            <ShipmentsView
              waybills={waybills}
              onTransitionStatus={transitionShipment}
              currentUserRole={currentRole}
            />
          )}

          {currentTab === 'FLEET' && (
            <FleetTelematicsView
              vehicles={vehicles}
              onClearDtc={clearDtc}
              onTriggerDisruption={triggerDisruption}
            />
          )}

          {currentTab === 'WAREHOUSE' && (
            <WarehouseInventoryView
              warehouses={warehouses}
              inventory={inventory}
              onUpdateStock={updateStock}
              onInspectForecast={handleInspectForecast}
            />
          )}

          {currentTab === 'ROUTE' && <RouteOptimizerView />}

          {currentTab === 'FORECAST' && (
            <AnalyticsForecastView inventory={inventory} initialSku={forecastTargetSku} />
          )}

          {currentTab === 'COMPLIANCE' && <ComplianceVaultView waybills={waybills} />}

          {currentTab === 'LOGS' && <AuditLogsView logs={logs} />}
        </main>
      </div>

      {/* AI Copilot Drawer */}
      <AiCopilotDrawer
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
        activeWaybill={selectedVehicle?.activeWaybillId}
        vehicleId={selectedVehicle?.id}
      />

      {/* QA Unit & Integration Test Suite Runner Modal */}
      <TestRunnerModal
        isOpen={isTestRunnerOpen}
        onClose={() => setIsTestRunnerOpen(false)}
      />
    </div>
  );
}
