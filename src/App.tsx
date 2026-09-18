/**
 * TrackVision - AI Railway Dynamic ETA & Operational Decision Support Platform
 * Target Corridor: Delhi → Prayagraj (530 km) | SIH 2026 Problem 26028
 *
 * Information architecture: four primary destinations only —
 *   Command Center ("What is happening right now?")
 *   Operations     ("What trains/stations/sections are involved?" — segmented Trains/Stations/Network)
 *   AI Insights    ("Why is it happening and what is likely to happen?" — predictions + secondary analytics)
 *   Simulation     ("What happens if I take this action?")
 * Everything else (train/station/network detail, alerts, passenger view) is contextual —
 * a drawer, modal, or bell-triggered view — never a fifth top-level tab.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  ChevronDown,
  ChevronUp,
  Compass,
  HelpCircle,
  Layers,
  Lightbulb,
  MapPin,
  Maximize2,
  Navigation,
  Network,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Train as TrainIcon,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { AiInsightsPanel } from './components/AiInsightsPanel.tsx';
import { AlertsPanel } from './components/AlertsPanel.tsx';
import { OperationsConsole } from './components/OperationsConsole.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { CorridorMap } from './components/CorridorMap.tsx';
import { Header } from './components/Header.tsx';
import { MetricsBar } from './components/MetricsBar.tsx';
import { NetworkView } from './components/NetworkView.tsx';
import { PassengerView } from './components/PassengerView.tsx';
import { PredictionsView } from './components/PredictionsView.tsx';
import { ScenarioDrawer } from './components/ScenarioDrawer.tsx';
import { SihDemoOrchestrator } from './components/SihDemoOrchestrator.tsx';
import { StationsView } from './components/StationsView.tsx';
import { TrainDetailModal } from './components/TrainDetailModal.tsx';
import { TrainList } from './components/TrainList.tsx';
import { WhatIfSimulatorModal } from './components/WhatIfSimulatorModal.tsx';
import { useTrackVision } from './hooks/useTrackVision.ts';
import {
  AppTab,
  AuthUser,
  InterventionOutcome,
  InterventionRequest,
  OperationsSubTab,
  PlatformConflict,
  Train,
  UserRole,
} from './types/railway.ts';

export default function App() {
  const {
    trains,
    stations,
    sections,
    conflicts,
    propagationNodes,
    passengerConnections,
    alerts,
    simulationState,
    networkRisk,
    modelMetrics,
    isConnected,
    activeTab,
    activeRole,
    selectedTrainId,
    selectedStationId,
    activeEvents,
    setActiveTab,
    setActiveRole,
    setSelectedTrainId,
    setSelectedStationId,
    toggleSimulation,
    setSimulationSpeed,
    resetDemo,
    triggerScenarioPreset,
    injectDisruptionEvent,
    simulateIntervention,
    acknowledgeAlert,
  } = useTrackVision();

  // Authentication & Demo User State (Section 3)
  const [currentUser, setCurrentUser] = useState<AuthUser>({
    id: 'usr-01',
    email: 'control@trackvision.demo',
    name: 'Rajesh Sharma',
    role: 'CONTROL_ROOM',
    designation: 'Chief Section Controller',
    sectionZone: 'NCR / Prayagraj Division',
    badgeId: 'IR-NCR-4029',
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Automated SIH Judge Presentation Controller (Section 39)
  const [isSihDemoRunning, setIsSihDemoRunning] = useState(false);

  // Modals state
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);
  const [isSimulatingWhatIf, setIsSimulatingWhatIf] = useState(false);
  const [lastInterventionOutcome, setLastInterventionOutcome] = useState<InterventionOutcome | null>(null);

  // Operations tab: segmented sub-view (Trains / Stations / Network) — one consolidated
  // page instead of three separate top-level routes.
  const [operationsSubTab, setOperationsSubTab] = useState<OperationsSubTab>('trains');

  // Passenger View is a modal/drawer reachable from a utility button, not a top-level page.
  const [isPassengerOpen, setIsPassengerOpen] = useState(false);

  // AI Insights: technical model performance details are collapsed by default so the
  // page leads with "what will happen / why / what should the operator do".
  const [showAiTechnicalDetails, setShowAiTechnicalDetails] = useState(false);

  // Dashboard layout and panel density states
  const [showFleetPanel, setShowFleetPanel] = useState(true);
  const [showConsolePanel, setShowConsolePanel] = useState(true);
  const [dashboardMode, setDashboardMode] = useState<'balanced' | 'map-focus'>('balanced');
  const [conflictBannerDismissed, setConflictBannerDismissed] = useState(false);

  // Selected train object
  const selectedTrain: Train | null =
    trains.find((t: Train) => t.id === selectedTrainId || t.number === selectedTrainId) ||
    trains.find((t: Train) => t.number === '12951') ||
    trains[0] ||
    null;

  const handleSelectTrain = (id: string) => {
    setSelectedTrainId(id);
  };

  const handleInspectTrain = (id: string) => {
    setSelectedTrainId(id);
    setIsDetailOpen(true);
  };

  const handleSelectStation = (id: string) => {
    setSelectedStationId(id);
  };

  const handleSelectConflict = (_conflict: PlatformConflict) => {
    setIsWhatIfOpen(true);
  };

  const handleOpenOperations = (subTab: OperationsSubTab) => {
    setActiveTab('operations');
    setOperationsSubTab(subTab);
  };

  const handleUserLogin = (user: AuthUser) => {
    setCurrentUser(user);
    setActiveRole(user.role);
  };

  const handleRunIntervention = async (req: InterventionRequest) => {
    setIsSimulatingWhatIf(true);
    try {
      const outcome = await simulateIntervention(req);
      setLastInterventionOutcome(outcome);
      return outcome;
    } finally {
      setIsSimulatingWhatIf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Main Navigation & Identity Header (Section 4 & 5) */}
      <Header
        trains={trains}
        simulationState={simulationState}
        activeRole={activeRole}
        currentUser={currentUser}
        activeTab={activeTab}
        isConnected={isConnected}
        alertsCount={alerts.length}
        conflictsCount={conflicts.length}
        onTabChange={setActiveTab}
        onOpenOperations={handleOpenOperations}
        onOpenPassenger={() => setIsPassengerOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onToggleSimulation={toggleSimulation}
        onSpeedChange={setSimulationSpeed}
        onResetDemo={resetDemo}
        onOpenDemoController={() => setIsScenarioOpen(true)}
        onStartSihDemo={() => setIsSihDemoRunning(true)}
      />

      {/* Key Operational Metrics Overview Bar (Section 6) */}
      <MetricsBar
        trains={trains}
        conflictsCount={conflicts.length}
        networkRisk={networkRisk}
        modelMetrics={modelMetrics}
      />

      {/* Main Content Area based on Active Tab */}
      <main className="flex-1 overflow-x-hidden">
        {/* COMMAND CENTER — default home page: "What is happening right now?" */}
        {activeTab === 'command-center' && (
          <div className="p-3 lg:p-4 space-y-2.5">
            {/* Urgent SIH Conflict Callout Banner (Dismissible & Sleek) */}
            {conflicts.length > 0 && !conflictBannerDismissed && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 px-4 flex flex-wrap items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-xs shrink-0 animate-pulse">
                    !
                  </div>
                  <div className="truncate">
                    <span className="font-mono font-bold text-xs text-rose-900 mr-2">
                      CRITICAL CONFLICT: KANPUR CENTRAL (CNB) PLATFORM 3
                    </span>
                    <span className="text-xs text-slate-600 hidden md:inline font-sans">
                      Train 12951 delay pushes dwell into TV-DEMO-002 scheduled arrival (+12 min cascade delay).
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsWhatIfOpen(true)}
                    className="px-3 py-1 bg-[#8B1E2D] hover:bg-[#721824] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span>Launch What-If Resolution</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConflictBannerDismissed(true)}
                    className="text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded text-xs cursor-pointer"
                    title="Dismiss warning"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Dashboard Organization & Panel Density Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 px-0.5 text-xs select-none">
              {/* Left: View Mode Switcher */}
              <div className="flex items-center gap-2.5">
                <div className="bg-white border border-slate-200 p-0.5 rounded-lg flex items-center shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      setDashboardMode('balanced');
                      setShowFleetPanel(true);
                      setShowConsolePanel(true);
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                      dashboardMode === 'balanced' && showFleetPanel && showConsolePanel
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Balanced Cockpit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDashboardMode('map-focus');
                      setShowFleetPanel(false);
                      setShowConsolePanel(false);
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                      dashboardMode === 'map-focus'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Wide Map Focus</span>
                  </button>
                </div>

                <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono">
                  {trains.length} Active Trains • {conflicts.length} Platform Conflict
                </span>
              </div>

              {/* Right: Quick Panel Visibility Toggles */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDashboardMode('balanced');
                    setShowFleetPanel((prev) => !prev);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    showFleetPanel
                      ? 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                      : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                  }`}
                  title="Toggle Train Fleet List"
                >
                  <TrainIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{showFleetPanel ? 'Hide Fleet' : `Show Fleet (${trains.length})`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDashboardMode('balanced');
                    setShowConsolePanel((prev) => !prev);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    showConsolePanel
                      ? 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                      : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                  }`}
                  title="Toggle Operations & Alerts Console"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{showConsolePanel ? 'Hide Console' : 'Show AI & Alerts'}</span>
                </button>
              </div>
            </div>

            {/* Dynamic Dashboard Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
              {/* Left Column: Active Train Fleet List */}
              {showFleetPanel && (
                <div className="lg:col-span-3">
                  <TrainList
                    trains={trains}
                    selectedTrainId={selectedTrain?.id || null}
                    onSelectTrain={handleInspectTrain}
                  />
                </div>
              )}

              {/* Center Column: Interactive Corridor Map */}
              <div
                className={`space-y-2 ${
                  showFleetPanel && showConsolePanel
                    ? 'lg:col-span-6'
                    : showFleetPanel || showConsolePanel
                    ? 'lg:col-span-9'
                    : 'lg:col-span-12'
                }`}
              >
                <CorridorMap
                  trains={trains}
                  stations={stations}
                  sections={sections}
                  conflicts={conflicts}
                  selectedTrainId={selectedTrain?.id || null}
                  selectedStationId={selectedStationId}
                  onSelectTrain={handleSelectTrain}
                  onSelectStation={handleSelectStation}
                  onSelectConflict={handleSelectConflict}
                />

                {/* Sub-bar below map: Quick Scenario triggers & active event indicators */}
                <div className="bg-white border border-slate-200 rounded-xl p-2 px-3 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider font-mono">
                      Quick Stress Test:
                    </span>
                    <button
                      type="button"
                      onClick={() => triggerScenarioPreset('SCENARIO_2_SIGNAL')}
                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded text-[11px] font-semibold transition cursor-pointer"
                    >
                      Trigger Bharthana Signal Failure
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerScenarioPreset('SCENARIO_1_CLEAR')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPassengerOpen(true)}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" /> <span>Passenger View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsScenarioOpen(true)}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" /> <span>Open Scenario Injector</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Unified Operations & Intelligence Console */}
              {showConsolePanel && (
                <div className="lg:col-span-3">
                  <OperationsConsole
                    selectedTrain={selectedTrain}
                    conflicts={conflicts}
                    alerts={alerts}
                    onTriggerWhatIf={() => setIsWhatIfOpen(true)}
                    onViewDetails={() => setIsDetailOpen(true)}
                    onAcknowledgeAlert={acknowledgeAlert}
                    onQuickScenario={triggerScenarioPreset}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* OPERATIONS — consolidated: "What trains/stations/sections are involved?"
            Trains, Stations and Network live here as a segmented control, not separate routes. */}
        {activeTab === 'operations' && (
          <div className="p-4 max-w-7xl mx-auto space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-800">
                  OPERATIONS
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Trains, stations and corridor sections — select a segment below
                </p>
              </div>

              {/* Compact segmented control: Trains | Stations | Network */}
              <div className="bg-white border border-slate-200 p-0.5 rounded-lg flex items-center shadow-2xs">
                {(
                  [
                    { id: 'trains', label: 'Trains', icon: TrainIcon, count: trains.length as number | undefined },
                    { id: 'stations', label: 'Stations', icon: Layers, count: undefined as number | undefined },
                    { id: 'network', label: 'Network', icon: Network, count: undefined as number | undefined },
                  ] as const
                ).map((seg) => {
                  const SegIcon = seg.icon;
                  const isActiveSeg = operationsSubTab === seg.id;
                  return (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => setOperationsSubTab(seg.id)}
                      className={`px-3 py-1.5 rounded-md font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                        isActiveSeg
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <SegIcon className="w-3.5 h-3.5" />
                      <span>{seg.label}</span>
                      {seg.count !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                            isActiveSeg ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {seg.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trains segment — clicking a train opens a detail drawer, it does not navigate */}
            {operationsSubTab === 'trains' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {trains.map((train) => (
                  <div
                    key={train.id}
                    onClick={() => handleInspectTrain(train.id)}
                    className="p-3.5 rounded-xl bg-[#0D2138] border border-slate-800 hover:border-amber-400/80 cursor-pointer transition flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-100">{train.number}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#071525] text-slate-400 border border-slate-800">
                            {train.type}
                          </span>
                        </div>
                        <span className="text-xs text-slate-300 font-medium block mt-0.5">{train.name}</span>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          train.predictedDelayMinutes > 0
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {train.predictedDelayMinutes > 0 ? `+${train.predictedDelayMinutes} min` : 'ON TIME'}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Location:</span>
                        <span className="text-slate-200 font-semibold">{train.currentStationName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Speed:</span>
                        <span className="text-slate-200">{train.speedKmh} km/h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Terminal ETA:</span>
                        <span className="text-amber-400 font-bold">{train.predictedFinalEta}</span>
                      </div>
                    </div>

                    <button className="w-full py-1.5 bg-[#071525] hover:bg-slate-800 text-slate-300 text-xs font-mono font-semibold rounded-lg border border-slate-700 transition">
                      Inspect Multi-Station ETA →
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Stations segment */}
            {operationsSubTab === 'stations' && (
              <StationsView
                stations={stations}
                trains={trains}
                conflicts={conflicts}
                selectedStationId={selectedStationId}
                onSelectStation={handleSelectStation}
                onOpenWhatIf={() => setIsWhatIfOpen(true)}
              />
            )}

            {/* Network segment */}
            {operationsSubTab === 'network' && (
              <NetworkView
                sections={sections}
                propagationNodes={propagationNodes}
                trains={trains}
                onOpenWhatIf={() => setIsWhatIfOpen(true)}
              />
            )}
          </div>
        )}

        {/* ALERTS — reached via the header bell as a contextual view, not a primary nav item */}
        {activeTab === 'alerts' && (
          <div className="p-4 max-w-5xl mx-auto h-[680px]">
            <AlertsPanel
              alerts={alerts}
              onAcknowledgeAlert={acknowledgeAlert}
              onOpenWhatIf={() => setIsWhatIfOpen(true)}
            />
          </div>
        )}

        {/* AI INSIGHTS — consolidated: "Why is it happening and what is likely to happen?"
            Leads with WHAT WILL HAPPEN / WHY / WHAT SHOULD THE OPERATOR DO; technical
            model-performance detail (formerly the separate Analytics tab) is secondary
            and tucked behind an expandable section. */}
        {activeTab === 'ai-insights' && (
          <div className="p-4 max-w-7xl mx-auto space-y-4">
            {/* WHAT SHOULD THE OPERATOR DO — recommended action, front and center */}
            {conflicts.length > 0 && (
              <div className="bg-[#0D2138] border border-amber-500/60 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Lightbulb className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-amber-300">
                      RECOMMENDED ACTION
                    </h3>
                    <p className="text-xs text-slate-300 font-sans mt-0.5 max-w-xl">
                      A platform conflict is predicted at Kanpur Central. Run the What-If simulator to test
                      a platform reassignment before it cascades further down the corridor.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsWhatIfOpen(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition shrink-0"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>OPEN SIMULATION</span>
                </button>
              </div>
            )}

            {/* WHAT WILL HAPPEN / WHY — dynamic ETA prediction, confidence, and causal attribution */}
            <PredictionsView
              trains={trains}
              selectedTrainId={selectedTrain?.id || null}
              stations={stations}
              onSelectTrain={handleSelectTrain}
              onOpenWhatIf={() => setIsWhatIfOpen(true)}
            />

            {/* Technical model performance — secondary, expandable rather than shown by default */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setShowAiTechnicalDetails((prev) => !prev)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
                    Model Performance &amp; Technical Details
                  </span>
                </div>
                {showAiTechnicalDetails ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {showAiTechnicalDetails && (
                <div className="border-t border-slate-200 p-4 bg-slate-50">
                  <AnalyticsView modelMetrics={modelMetrics} sections={sections} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: SIMULATION (Direct What-If Intervention Studio) */}
        {activeTab === 'simulation' && (
          <div className="p-4 max-w-5xl mx-auto space-y-4">
            <div className="p-4 rounded-xl bg-[#0D2138] border border-slate-800 shadow-lg flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-100">
                  WHAT-IF INTERVENTION DISPATCH STUDIO
                </h2>
                <p className="text-xs text-slate-400 font-sans">
                  Section Controller Simulation Environment for Kanpur Central and North-Central Corridor
                </p>
              </div>

              <button
                onClick={() => setIsWhatIfOpen(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>OPEN INTERVENTION SIMULATOR</span>
              </button>
            </div>

            {/* If an outcome was generated, show it directly */}
            {lastInterventionOutcome ? (
              <div className="p-5 rounded-xl bg-[#0D2138] border border-emerald-800/80 shadow-lg space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="font-bold text-emerald-400 text-sm">
                    LATEST SIMULATED OUTCOME: {lastInterventionOutcome.description}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                    +{lastInterventionOutcome.delayAvoidedMinutes} MIN DELAY AVOIDED
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-[#071525] rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">INITIAL NETWORK DELAY</span>
                    <span className="text-lg font-bold text-rose-400">{lastInterventionOutcome.before.networkDelayMinutes}m</span>
                  </div>
                  <div className="p-3 bg-[#071525] rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">AFTER INTERVENTION</span>
                    <span className="text-lg font-bold text-emerald-400">{lastInterventionOutcome.after.networkDelayMinutes}m</span>
                  </div>
                  <div className="p-3 bg-[#071525] rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">CONFLICTS RESOLVED</span>
                    <span className="text-lg font-bold text-cyan-300">{lastInterventionOutcome.conflictsPreventedCount}</span>
                  </div>
                  <div className="p-3 bg-[#071525] rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">NET DELAY SAVED</span>
                    <span className="text-lg font-bold text-emerald-300">+{lastInterventionOutcome.delayAvoidedMinutes}m</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-[#0D2138] border border-slate-800 rounded-xl space-y-3 shadow-lg">
                <Zap className="w-10 h-10 text-amber-400 mx-auto" />
                <h3 className="text-sm font-bold font-mono text-slate-200">
                  NO INTERVENTION SIMULATED YET
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
                  Click the button above to test platform reassignments, train prioritizations, or emergency signal clearances.
                </p>
                <button
                  onClick={() => setIsWhatIfOpen(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs rounded-lg inline-flex items-center gap-1.5 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>START SIMULATION</span>
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Bottom Footer Strip matching Reference Image */}
      <footer className="bg-white border-t border-slate-200 px-4 lg:px-6 py-2.5 mt-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">TrackVision</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">A Safer, Smarter, More Reliable Rail Network</span>
        </div>

        <div className="hidden md:flex items-center gap-5 text-[11px] font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>7 Stations in Corridor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-slate-400" />
            <span>542 km Total Distance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrainIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>15+ Demo Trains</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Live Simulation • Real-time AI Predictions</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-medium text-slate-700">
          <span className="text-base leading-none">🇮🇳</span>
          <span>Built for a Smarter India</span>
        </div>
      </footer>

      {/* HERO MODAL: What-If Intervention Simulator */}
      <WhatIfSimulatorModal
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        trains={trains}
        conflicts={conflicts}
        onSimulate={handleRunIntervention}
        lastOutcome={lastInterventionOutcome}
        isSimulating={isSimulatingWhatIf}
      />

      {/* Train Detail & Multi-Station ETA Inspector Modal */}
      <TrainDetailModal
        isOpen={isDetailOpen}
        train={selectedTrain}
        conflicts={conflicts}
        connections={passengerConnections}
        onClose={() => setIsDetailOpen(false)}
        onOpenWhatIf={() => {
          setIsDetailOpen(false);
          setIsWhatIfOpen(true);
        }}
      />

      {/* Scenario Injection & SIH Judge Preset Drawer Modal */}
      <ScenarioDrawer
        isOpen={isScenarioOpen}
        onClose={() => setIsScenarioOpen(false)}
        onTriggerPreset={triggerScenarioPreset}
        onInjectCustomEvent={injectDisruptionEvent}
        onResetSimulation={resetDemo}
        trains={trains}
        activeEvents={activeEvents}
      />

      {/* PASSENGER VIEW — modal/drawer only, never a top-level page */}
      {isPassengerOpen && (
        <div
          onClick={() => setIsPassengerOpen(false)}
          className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F1F5F9] w-full sm:max-w-lg h-full shadow-2xl overflow-y-auto cursor-default animate-in slide-in-from-right duration-200"
          >
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-900">Passenger View</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPassengerOpen(false)}
                aria-label="Close Passenger View"
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="p-4">
              <PassengerView
                trains={trains}
                passengerConnections={passengerConnections}
                selectedTrainId={selectedTrain?.id || null}
                onSelectTrain={handleSelectTrain}
              />
            </div>
          </div>
        </div>
      )}

      {/* Authentication & Role Switcher Modal (Section 3) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleUserLogin}
      />

      {/* 14-Step Automated SIH Judge Presentation Controller (Section 39) */}
      {isSihDemoRunning && (
        <SihDemoOrchestrator
          isActive={isSihDemoRunning}
          onClose={() => setIsSihDemoRunning(false)}
          onTabChange={setActiveTab}
          onOpenOperations={handleOpenOperations}
          onOpenPassenger={() => setIsPassengerOpen(true)}
          onSelectTrain={handleSelectTrain}
          onReset={resetDemo}
          onStartSimulation={async () => {
            if (!simulationState.isRunning) toggleSimulation();
          }}
          onInjectSignalFailure={async () => {
            await triggerScenarioPreset('SCENARIO_2_SIGNAL');
          }}
          onOpenWhatIf={() => setIsWhatIfOpen(true)}
          onRunIntervention={async () => {
            await handleRunIntervention({
              type: 'CHANGE_PLATFORM',
              trainNumber: 'TV-DEMO-002',
              targetPlatform: 5,
              targetStationId: 'CNB',
            });
          }}
        />
      )}
    </div>
  );
}
