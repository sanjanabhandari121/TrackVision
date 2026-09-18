/**
 * TrackVision What-If Intervention Simulator
 * Section 23 & 24 Hero Differentiator:
 * Clones operational state, applies hypothetical intervention, and compares BEFORE vs AFTER.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  GitBranch,
  Play,
  RotateCcw,
  Scale,
  ShieldCheck,
  TrendingDown,
  X,
  Zap,
} from 'lucide-react';
import { InterventionOutcome, InterventionRequest, PlatformConflict, Train } from '../types/railway.ts';

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  trains: Train[];
  conflicts: PlatformConflict[];
  onSimulate: (req: InterventionRequest) => Promise<InterventionOutcome | null>;
  lastOutcome: InterventionOutcome | null;
  isSimulating: boolean;
}

export const WhatIfSimulatorModal: React.FC<WhatIfSimulatorModalProps> = ({
  isOpen,
  onClose,
  trains,
  conflicts,
  onSimulate,
  lastOutcome,
  isSimulating,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<'SCENARIO_A' | 'SCENARIO_B' | 'SCENARIO_C' | 'SCENARIO_D'>('SCENARIO_A');
  const [targetPlatform, setTargetPlatform] = useState<number>(5);
  const [localOutcome, setLocalOutcome] = useState<InterventionOutcome | null>(lastOutcome);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const handleRunSimulation = async () => {
    let req: InterventionRequest;

    if (selectedScenario === 'SCENARIO_A') {
      req = {
        type: 'CHANGE_PLATFORM',
        trainNumber: 'TV-DEMO-002',
        targetPlatform,
        targetStationId: 'CNB',
      };
    } else if (selectedScenario === 'SCENARIO_B') {
      req = {
        type: 'PRIORITIZE_TRAIN',
        trainNumber: '12951',
      };
    } else if (selectedScenario === 'SCENARIO_C') {
      req = {
        type: 'CLEAR_RESTRICTION',
        targetStationId: 'ETW',
      };
    } else {
      req = {
        type: 'HOLD_TRAIN',
        trainNumber: 'TV-DEMO-008',
        holdDurationMinutes: 6,
      };
    }

    const res = await onSimulate(req);
    if (res) {
      setLocalOutcome(res);
    }
  };

  const outcome = localOutcome || lastOutcome;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0b1120] border border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh] cursor-default"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono tracking-wider text-slate-100 uppercase">
                WHAT-IF INTERVENTION SIMULATOR
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Clone state → apply operational intervention → forecast downstream network outcome
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Disclaimer Banner */}
          <div className="p-2.5 rounded bg-amber-950/30 border border-amber-800/60 text-amber-300 text-xs font-mono flex items-start gap-2">
            <Scale className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>HYPOTHETICAL SIMULATION ENGINE:</strong> These are simulated decision-support models. TrackVision does
              not issue autonomous dispatch commands. Controller approval is required for all route changes.
            </span>
          </div>

          {/* Intervention Selection Tabs */}
          <div>
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block mb-2">
              SELECT OPERATIONAL INTERVENTION:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setSelectedScenario('SCENARIO_A')}
                className={`p-3 rounded border text-left flex flex-col justify-between transition ${
                  selectedScenario === 'SCENARIO_A'
                    ? 'bg-amber-950/50 border-amber-400 ring-1 ring-amber-400 text-slate-100'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-amber-300 mb-1 flex items-center justify-between">
                  <span>SCENARIO A</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-normal">
                    RECOMMENDED
                  </span>
                </div>
                <div className="font-semibold text-slate-200 text-[11px] mb-1">
                  Reassign Platform (CNB)
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Move TV-DEMO-002 from Platform 3 to Platform 5 to eliminate dwell overlap.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedScenario('SCENARIO_B')}
                className={`p-3 rounded border text-left flex flex-col justify-between transition ${
                  selectedScenario === 'SCENARIO_B'
                    ? 'bg-amber-950/50 border-amber-400 ring-1 ring-amber-400 text-slate-100'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-300 mb-1">SCENARIO B</div>
                <div className="font-semibold text-slate-200 text-[11px] mb-1">
                  Prioritize Rajdhani (12951)
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Grant green corridor priority by holding preceding freight at Phaphund.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedScenario('SCENARIO_C')}
                className={`p-3 rounded border text-left flex flex-col justify-between transition ${
                  selectedScenario === 'SCENARIO_C'
                    ? 'bg-amber-950/50 border-amber-400 ring-1 ring-amber-400 text-slate-100'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-300 mb-1">SCENARIO C</div>
                <div className="font-semibold text-slate-200 text-[11px] mb-1">
                  Emergency Signal Override
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Expedite manual S&T clearance on Bharthana block to resume 110 km/h.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedScenario('SCENARIO_D')}
                className={`p-3 rounded border text-left flex flex-col justify-between transition ${
                  selectedScenario === 'SCENARIO_D'
                    ? 'bg-amber-950/50 border-amber-400 ring-1 ring-amber-400 text-slate-100'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-300 mb-1">SCENARIO D</div>
                <div className="font-semibold text-slate-200 text-[11px] mb-1">
                  Hold Secondary Rake
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Hold local rake TV-DEMO-008 for 6 min to protect mainline throughput.
                </div>
              </button>
            </div>
          </div>

          {/* Configuration Parameters for Scenario A */}
          {selectedScenario === 'SCENARIO_A' && (
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Target Station:</span>
                <span className="font-bold text-slate-200">Kanpur Central (CNB)</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Train:</span>
                <span className="font-bold text-amber-300">TV-DEMO-002</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Reassign from PF 3 →</span>
                <select
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(parseInt(e.target.value, 10))}
                  className="bg-slate-950 border border-slate-700 text-amber-300 font-bold px-2 py-1 rounded focus:outline-none focus:border-amber-400"
                >
                  <option value={4}>Platform 4 (Occupied soon)</option>
                  <option value={5}>Platform 5 (Vacant & Ready)</option>
                  <option value={6}>Platform 6 (Yard loop line)</option>
                </select>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono font-bold text-sm rounded-lg flex items-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isSimulating ? 'SIMULATING INTERVENTION...' : 'RUN WHAT-IF SIMULATION'}</span>
            </button>
          </div>

          {/* Side-by-Side BEFORE vs AFTER Comparison */}
          {outcome && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    SIMULATION OUTCOME & NETWORK DELAY AVOIDED
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  +{outcome.delayAvoidedMinutes} MIN DELAY AVOIDED
                </span>
              </div>

              {/* Comparative Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BEFORE CARD */}
                <div className="bg-slate-900/90 border border-rose-900/60 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-900/40 pb-2">
                    <span className="text-xs font-mono font-bold text-rose-400">BEFORE (STATUS QUO)</span>
                    <span className="text-[10px] font-mono text-slate-500">Unmitigated Cascade</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">NETWORK DELAY</span>
                      <span className="text-lg font-bold text-rose-400">
                        {outcome.before.networkDelayMinutes} min
                      </span>
                    </div>

                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">ACTIVE CONFLICTS</span>
                      <span className="text-lg font-bold text-rose-400">
                        {outcome.before.conflictsCount}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">AFFECTED TRAINS</span>
                      <span className="text-lg font-bold text-slate-300">
                        {outcome.before.affectedTrainsCount}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">CONNECTION RISKS</span>
                      <span className="text-lg font-bold text-rose-400">
                        {outcome.before.connectionRisksCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AFTER CARD */}
                <div className="bg-slate-900/90 border border-emerald-900/60 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">AFTER (INTERVENTION APPLIED)</span>
                    <span className="text-[10px] font-mono text-emerald-300 font-semibold">
                      {outcome.description.split(':')[0]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">NETWORK DELAY</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-emerald-400">
                          {outcome.after.networkDelayMinutes} min
                        </span>
                        <span className="text-[10px] text-emerald-500">
                          (-{outcome.delayAvoidedMinutes}m)
                        </span>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">ACTIVE CONFLICTS</span>
                      <span className="text-lg font-bold text-emerald-400">
                        {outcome.after.conflictsCount} (RESOLVED)
                      </span>
                    </div>

                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">AFFECTED TRAINS</span>
                      <span className="text-lg font-bold text-emerald-400">
                        {outcome.after.affectedTrainsCount}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">CONNECTION RISKS</span>
                      <span className="text-lg font-bold text-emerald-400">
                        {outcome.after.connectionRisksCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tradeoffs Analysis */}
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs">
                <span className="font-mono font-bold text-slate-300 block mb-1.5 uppercase text-[11px]">
                  OPERATIONAL TRADEOFFS & CONTROLLER CONSIDERATIONS:
                </span>
                <ul className="space-y-1 text-slate-400 font-sans text-xs">
                  {outcome.tradeoffs.map((t, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500">TrackVision SIH Prototype • Decision-Support Simulation</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
