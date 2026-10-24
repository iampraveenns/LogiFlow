/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Global Logistics & Supply Chain Optimization Platform
 */

import React, { useState } from 'react';
import { Navbar } from './frontend/components/Navbar.tsx';
import { Sidebar, NavTab } from './frontend/components/Sidebar.tsx';
import { FleetMap } from './frontend/components/FleetMap.tsx';
import { DispatchBoardView } from './frontend/components/DispatchBoardView.tsx';
import { ShipmentsView } from './frontend/components/ShipmentsView.tsx';
import { FleetTelematicsView } from './frontend/components/FleetTelematicsView.tsx';
import { WarehouseInventoryView } from './frontend/components/WarehouseInventoryView.tsx';
import { RouteOptimizerView } from './frontend/components/RouteOptimizerView.tsx';
import { AnalyticsForecastView } from './frontend/components/AnalyticsForecastView.tsx';
import { DigitalTwinView } from './frontend/components/DigitalTwinView.tsx';
import { FreightProcurementView } from './frontend/components/FreightProcurementView.tsx';
import { ColdChainTelemetryView } from './frontend/components/ColdChainTelemetryView.tsx';
import { FleetMaintenanceView } from './frontend/components/FleetMaintenanceView.tsx';
import { EdiCustomsStudioView } from './frontend/components/EdiCustomsStudioView.tsx';
import { EsgDecarbonizationView } from './frontend/components/EsgDecarbonizationView.tsx';
import { YardManagementView } from './frontend/components/YardManagementView.tsx';
import { FreightAuditBillingView } from './frontend/components/FreightAuditBillingView.tsx';
import { TradeSanctionsView } from './frontend/components/TradeSanctionsView.tsx';
import { WavePickingView } from './frontend/components/WavePickingView.tsx';
import { AirCargoUldView } from './frontend/components/AirCargoUldView.tsx';
import { DroneLastMileView } from './frontend/components/DroneLastMileView.tsx';
import { MaritimeVesselView } from './frontend/components/MaritimeVesselView.tsx';
import { PortTerminalView } from './frontend/components/PortTerminalView.tsx';
import { IntermodalRailView } from './frontend/components/IntermodalRailView.tsx';
import { CustomsTariffView } from './frontend/components/CustomsTariffView.tsx';
import { FreightRatingView } from './frontend/components/FreightRatingView.tsx';
import { HazmatDangerousGoodsView } from './frontend/components/HazmatDangerousGoodsView.tsx';
import { PharmaStabilityView } from './frontend/components/PharmaStabilityView.tsx';
import { ComplianceVaultView } from './frontend/components/ComplianceVaultView.tsx';
import { SecurityAuditSiemView } from './frontend/components/SecurityAuditSiemView.tsx';
import { ColdChainRiskPredictorView } from './frontend/components/ColdChainRiskPredictorView.tsx';
import { MultiModalCarbonView } from './frontend/components/MultiModalCarbonView.tsx';
import { AuditLogsView } from './frontend/components/AuditLogsView.tsx';
import { AiCopilotDrawer } from './frontend/components/AiCopilotDrawer.tsx';
import { TestRunnerModal } from './frontend/components/TestRunnerModal.tsx';
import { AuthModal } from './frontend/components/AuthModal.tsx';
import { LiveChatDock } from './frontend/components/LiveChatDock.tsx';
import { useAuth } from './frontend/hooks/useAuth.ts';
import { useSimulation } from './frontend/hooks/useSimulation.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('MAP');
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [forecastTargetSku, setForecastTargetSku] = useState<string | undefined>(undefined);

  const {
    user,
    currentRole,
    selectedOrg,
    switchRole,
    switchOrganization,
    organizations,
    rawAccessToken,
    decodedClaims,
    secondsUntilTokenExpiry,
    signInWithCredentials,
    signUpNewAccount,
    refreshCurrentToken,
    signOut,
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

  const handleDispatchLoad = (waybillId: string, vehicleId: string) => {
    transitionShipment(waybillId, 'DISPATCHED', user.name, `Assigned to vehicle ${vehicleId}`);
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
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        jwtExpiresRemaining={secondsUntilTokenExpiry}
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

          {currentTab === 'DISPATCH' && (
            <DispatchBoardView
              waybills={waybills}
              vehicles={vehicles}
              onDispatchLoad={handleDispatchLoad}
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

          {currentTab === 'YARD' && <YardManagementView />}

          {currentTab === 'WAVE_PICKING' && <WavePickingView />}

          {currentTab === 'ROUTE' && <RouteOptimizerView />}
          
          {currentTab === 'AIR_CARGO' && <AirCargoUldView />}

          {currentTab === 'DRONE_LAST_MILE' && <DroneLastMileView />}

          {currentTab === 'MARITIME' && <MaritimeVesselView />}

          {currentTab === 'PORT_TERMINAL' && <PortTerminalView />}

          {currentTab === 'INTERMODAL' && <IntermodalRailView />}

          {currentTab === 'CUSTOMS_TARIFF' && <CustomsTariffView />}

          {currentTab === 'FREIGHT_RATING' && <FreightRatingView />}

          {currentTab === 'HAZMAT_REGISTRY' && <HazmatDangerousGoodsView />}

          {currentTab === 'PHARMA_STABILITY' && <PharmaStabilityView />}

          {currentTab === 'FORECAST' && (
            <AnalyticsForecastView inventory={inventory} initialSku={forecastTargetSku} />
          )}

          {currentTab === 'DIGITAL_TWIN' && <DigitalTwinView />}

          {currentTab === 'ESG' && <EsgDecarbonizationView />}

          {currentTab === 'PROCUREMENT' && <FreightProcurementView />}

          {currentTab === 'COLD_CHAIN' && <ColdChainTelemetryView />}

          {currentTab === 'AUDIT_BILLING' && <FreightAuditBillingView />}

          {currentTab === 'SANCTIONS' && <TradeSanctionsView />}

          {currentTab === 'MAINTENANCE' && <FleetMaintenanceView />}

          {currentTab === 'EDI_CUSTOMS' && <EdiCustomsStudioView />}

          {currentTab === 'COMPLIANCE' && <ComplianceVaultView waybills={waybills} />}

          {currentTab === 'SECURITY_SIEM' && <SecurityAuditSiemView />}

          {currentTab === 'COLD_CHAIN_RISK' && <ColdChainRiskPredictorView />}

          {currentTab === 'CARBON_ACCOUNTING' && <MultiModalCarbonView />}

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

      {/* Auth & JWT Claims Inspector Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={switchRole}
        rawAccessToken={rawAccessToken}
        decodedClaims={decodedClaims}
        secondsRemaining={secondsUntilTokenExpiry}
        organizations={organizations}
        onRefreshToken={refreshCurrentToken}
        onSignIn={signInWithCredentials}
        onSignUp={signUpNewAccount}
        onSignOut={signOut}
      />

      {/* Real-Time WebSocket Logistics Live Chat Dock */}
      <LiveChatDock
        currentUser={user}
        rawAccessToken={rawAccessToken}
        activeWaybillId={selectedVehicle?.activeWaybillId}
        activeVehicleId={selectedVehicle?.id}
      />
    </div>
  );
}
