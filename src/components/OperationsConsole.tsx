/**
 * OperationsConsole
 * Consolidated Right Panel that neatly groups AI Insights, Live Alerts, and What-If Triggers
 * into a single, clean, organized console with tabs:
 * - AI Insights
 * - Live Alerts (with red counter badge)
 * - Quick Scenario Stress Tests
 * - Always-visible bottom action: Open What-If Simulation
 * Prevents vertical congestion and keeps the dashboard neat and structured.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Flame,
  Layers,
  Network,
  Radio,
  RefreshCw,
  ShieldAlert,
  Sliders,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { Alert, PlatformConflict, Train } from '../types/railway.ts';

interface OperationsConsoleProps {
  selectedTrain: Train | null;
  conflicts: PlatformConflict[];
  alerts: Alert[];
  onTriggerWhatIf: () => void;
  onViewDetails?: () => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onViewAlert?: (alert: Alert) => void;
  onQuickScenario?: (preset: string) => void;
}

export const OperationsConsole: React.FC<OperationsConsoleProps> = ({
  selectedTrain,
  conflicts,
  alerts,
  onTriggerWhatIf,
  onViewDetails,
  onAcknowledgeAlert,
  onViewAlert,
  onQuickScenario,
}) => {
  const [activeConsoleTab, setActiveConsoleTab] = useState<'insights' | 'alerts' | 'scenarios'>('insights');

  const trainNumber = selectedTrain?.number || '12951';
  const delayMinutes = selectedTrain ? selectedTrain.predictedDelayMinutes : 8;
  const etaTime = selectedTrain ? selectedTrain.predictedFinalEta : '18:42';

  const criticalAlertsCount = alerts.filter((a) => a.severity === 'CRITICAL').length + conflicts.length;

  const displayAlerts: Alert[] = alerts.length > 0 ? alerts : [
    {
      id: 'alt-1',
      title: 'Platform conflict predicted',
      message: 'Kanpur Central - Platform 3 • 12951 vs 22550',
      severity: 'CRITICAL',
      type: 'PLATFORM_CONFLICT',
      timestamp: '11:58',
      status: 'NEW',
      trainNumber: '12951',
    },
    {
      id: 'alt-2',
      title: 'High congestion',
      message: 'Etawah → Kanpur • Expected delay: +5 to 12 min',
      severity: 'WARNING',
      type: 'HIGH_CONGESTION',
      timestamp: '11:52',
      status: 'NEW',
    },
    {
      id: 'alt-3',
      title: 'Signal restriction active',
      message: 'Etawah → Kanpur • Speed limit: 50 km/h',
      severity: 'CRITICAL',
      type: 'SIGNAL_RESTRICTION',
      timestamp: '11:48',
      status: 'NEW',
      trainNumber: '12951',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col h-[540px] lg:h-[650px] overflow-hidden">
      {/* 1. TOP TAB HEADER */}
      <div className="p-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg w-full text-xs">
          <button
            type="button"
            onClick={() => setActiveConsoleTab('insights')}
            className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeConsoleTab === 'insights'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Insights</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveConsoleTab('alerts')}
            className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer relative ${
              activeConsoleTab === 'alerts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Alerts</span>
            {criticalAlertsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                {criticalAlertsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveConsoleTab('scenarios')}
            className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeConsoleTab === 'scenarios'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span>Scenarios</span>
          </button>
        </div>
      </div>

      {/* 2. BODY CONTENT (SCROLLABLE & CLEAN) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {/* TAB A: AI INSIGHTS */}
        {activeConsoleTab === 'insights' && (
          <div className="space-y-3">
            {/* ETA Update Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <BrainCircuit className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    Train {trainNumber} ETA Update
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Live</span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900 font-mono">{trainNumber}</strong> is projected to reach Prayagraj at{' '}
                <strong className="text-slate-900 font-mono">{etaTime}</strong>{' '}
                <span className={delayMinutes > 0 ? 'text-rose-600 font-bold font-mono' : 'text-emerald-600 font-bold font-mono'}>
                  ({delayMinutes > 0 ? `+${delayMinutes} min delay` : 'on time'})
                </span>.
              </p>

              <button
                type="button"
                onClick={onViewDetails}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 pt-1"
              >
                <span>Inspect Train Schedule & Delay Breakdown</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Primary Cause Attribution */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Primary Delay Cause
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-800">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0">
                  ⚡
                </span>
                <span className="font-medium flex-1">
                  Signal restriction between Etawah → Kanpur
                </span>
                <span className="text-rose-600 font-mono font-bold text-[11px] shrink-0">
                  +5 min
                </span>
              </div>
            </div>

            {/* Network Impact & Connections */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Corridor Cascade Impact
              </span>

              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Network className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>2 trains affected • Platform 3 conflict</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                  High Risk
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-2 text-slate-700">
                  <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>3 passenger connections in jeopardy</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  Moderate
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB B: LIVE ALERTS */}
        {activeConsoleTab === 'alerts' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-slate-700">
                Corridor Alerts ({displayAlerts.length})
              </span>
              <span className="text-[10px] text-slate-400">Auto-updating</span>
            </div>

            {displayAlerts.map((alert) => {
              const isCritical = alert.severity === 'CRITICAL';
              return (
                <div
                  key={alert.id}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl flex items-start justify-between gap-2 text-xs transition"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="mt-1 shrink-0">
                      {isCritical ? (
                        <span className="w-2 h-2 rounded-full bg-rose-600 inline-block ring-2 ring-rose-200" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block ring-2 ring-amber-200" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {alert.title}
                      </div>
                      <div className="text-[11px] text-slate-600 leading-tight">
                        {alert.message}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {alert.timestamp || 'Live'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isCritical) {
                        onTriggerWhatIf();
                      } else {
                        onAcknowledgeAlert(alert.id);
                      }
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-md text-[11px] font-semibold shrink-0 cursor-pointer shadow-2xs"
                  >
                    Resolve
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB C: SCENARIO STRESS TESTS */}
        {activeConsoleTab === 'scenarios' && (
          <div className="space-y-2.5">
            <div className="p-3 bg-blue-50/60 border border-blue-200/70 rounded-xl text-xs space-y-1">
              <span className="font-bold text-blue-900 block">
                What-If Stress Injections
              </span>
              <p className="text-slate-600 text-[11px]">
                Inject real operational disturbances to verify delay cascades and AI platform resolutions.
              </p>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => onQuickScenario && onQuickScenario('SCENARIO_2_SIGNAL')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl text-xs transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 group-hover:text-rose-900">
                    Bharthana Signal Failure
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                    +15m Delay
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 group-hover:text-rose-700 mt-0.5">
                  Simulates a track circuit failure between Etawah and Kanpur.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onQuickScenario && onQuickScenario('SCENARIO_3_PLATFORM')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-xl text-xs transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 group-hover:text-amber-900">
                    Kanpur Platform Congestion
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    Conflict
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 group-hover:text-amber-700 mt-0.5">
                  Overstays express rake at Platform 3, threatening cascading hold-ups.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onQuickScenario && onQuickScenario('SCENARIO_1_CLEAR')}
                className="w-full p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold text-center transition cursor-pointer"
              >
                Clear All Injected Disruptions
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. DOCKED BOTTOM ACTION BUTTON */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <button
          type="button"
          onClick={onTriggerWhatIf}
          className="w-full py-2.5 px-3 bg-[#8B1E2D] hover:bg-[#721824] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Open What-If Simulation</span>
        </button>
      </div>
    </div>
  );
};
