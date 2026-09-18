/**
 * TrackVision Live Scenario Drawer & Interactive Simulation Injector
 * Section 25 & 26: 1-Click SIH Judge Demonstration Scenarios and Custom Disruption Injection
 */

import React, { useState } from 'react';
import {
  AlertOctagon,
  CloudFog,
  Flame,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Train,
  X,
  Zap,
} from 'lucide-react';
import { DisruptionEvent, Train as TrainType } from '../types/railway.ts';

interface ScenarioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerPreset: (scenarioKey: 'SCENARIO_1_CLEAR' | 'SCENARIO_2_SIGNAL' | 'SCENARIO_3_FOG' | 'SCENARIO_4_PEAK') => void;
  onInjectCustomEvent: (event: Partial<DisruptionEvent>) => void;
  onResetSimulation: () => void;
  trains: TrainType[];
  activeEvents: DisruptionEvent[];
}

export const ScenarioDrawer: React.FC<ScenarioDrawerProps> = ({
  isOpen,
  onClose,
  onTriggerPreset,
  onInjectCustomEvent,
  onResetSimulation,
  trains,
  activeEvents,
}) => {
  const [customType, setCustomType] = useState<'SIGNAL_FAILURE' | 'WEATHER_FOG' | 'FREIGHT_BLOCK' | 'CREW_DELAY'>('SIGNAL_FAILURE');
  const [selectedTrain, setSelectedTrain] = useState<string>('12951');
  const [durationMin, setDurationMin] = useState<number>(15);
  const [delayMin, setDelayMin] = useState<number>(8);

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInjectCustomEvent({
      type: customType,
      targetTrainNumber: selectedTrain,
      targetStationId: 'ETW',
      impactDelayMinutes: delayMin,
      durationMinutes: durationMin,
      description: `Manual operator injection: ${customType} affecting Train ${selectedTrain}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0b1120] border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono tracking-wider text-slate-100 uppercase">
                SCENARIO INJECTOR & DEMO CONTROLLER
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Simulate dynamic corridor disruptions for live algorithmic stress-testing
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs font-mono">
          {/* Section 1: 1-Click Interactive Judge Demo Presets */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold uppercase tracking-wider text-slate-200">
                1-CLICK DEMONSTRATION PRESETS (SIH 2026)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Preset 1: Normal Corridor */}
              <button
                type="button"
                onClick={() => {
                  onTriggerPreset('SCENARIO_1_CLEAR');
                  onClose();
                }}
                className="p-3 rounded-lg border border-emerald-800/60 bg-emerald-950/20 hover:bg-emerald-950/40 text-left flex flex-col justify-between transition group"
              >
                <div>
                  <div className="flex items-center justify-between text-emerald-300 font-bold mb-1">
                    <span>1. NOMINAL RUN</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900 border border-emerald-700">
                      CLEAR
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">
                    All block signals clear. Fleet on-time, zero platform conflicts, nominal speeds.
                  </p>
                </div>
              </button>

              {/* Preset 2: Hero Signal Restriction */}
              <button
                type="button"
                onClick={() => {
                  onTriggerPreset('SCENARIO_2_SIGNAL');
                  onClose();
                }}
                className="p-3 rounded-lg border border-rose-700/80 bg-rose-950/30 hover:bg-rose-950/50 text-left flex flex-col justify-between transition group ring-1 ring-rose-500/30"
              >
                <div>
                  <div className="flex items-center justify-between text-rose-300 font-bold mb-1">
                    <span>2. HERO SIGNAL FAILURE</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-900 border border-rose-700 font-bold">
                      SIH HERO
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">
                    Bharthana-Phaphund block restriction (35 km/h) → delays 12951 → Kanpur PF 3 conflict.
                  </p>
                </div>
              </button>

              {/* Preset 3: Fog Event */}
              <button
                type="button"
                onClick={() => {
                  onTriggerPreset('SCENARIO_3_FOG');
                  onClose();
                }}
                className="p-3 rounded-lg border border-cyan-800/60 bg-cyan-950/20 hover:bg-cyan-950/40 text-left flex flex-col justify-between transition group"
              >
                <div>
                  <div className="flex items-center justify-between text-cyan-300 font-bold mb-1">
                    <span>3. SEVERE FOG DISTURBANCE</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-900 border border-cyan-700">
                      WEATHER
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">
                    Visibility &lt;200m between Tundla & Etawah. Capped 60 km/h, wide uncertainty margins.
                  </p>
                </div>
              </button>

              {/* Preset 4: Peak Congestion */}
              <button
                type="button"
                onClick={() => {
                  onTriggerPreset('SCENARIO_4_PEAK');
                  onClose();
                }}
                className="p-3 rounded-lg border border-amber-800/60 bg-amber-950/20 hover:bg-amber-950/40 text-left flex flex-col justify-between transition group"
              >
                <div>
                  <div className="flex items-center justify-between text-amber-300 font-bold mb-1">
                    <span>4. PEAK CONGESTION</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-900 border border-amber-700">
                      TRAFFIC
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">
                    Section saturation &gt;85%. Freight rakes occupying loop lines, extended dwell times.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Custom Disruption Event Form */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="font-bold uppercase tracking-wider text-slate-200 mb-3">
              MANUAL CUSTOM DISRUPTION INJECTION
            </h3>

            <form onSubmit={handleCustomSubmit} className="space-y-3 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    DISRUPTION TYPE
                  </label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 p-2 rounded focus:outline-none focus:border-amber-400"
                  >
                    <option value="SIGNAL_FAILURE">Signal Aspect Failure</option>
                    <option value="WEATHER_FOG">Dense Fog / Low Visibility</option>
                    <option value="FREIGHT_BLOCK">Freight Stoppage on Mainline</option>
                    <option value="CREW_DELAY">Crew Change Dwell Overrun</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    TARGET TRAIN
                  </label>
                  <select
                    value={selectedTrain}
                    onChange={(e) => setSelectedTrain(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 p-2 rounded focus:outline-none focus:border-amber-400"
                  >
                    {trains.map((t) => (
                      <option key={t.id} value={t.number}>
                        {t.number} - {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    INJECTED DELAY (MINUTES)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={delayMin}
                    onChange={(e) => setDelayMin(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 p-2 rounded focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    DURATION (MINUTES)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={durationMin}
                    onChange={(e) => setDurationMin(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 p-2 rounded focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded flex items-center justify-center gap-1.5 transition"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>INJECT DISRUPTION INTO TICK LOOP</span>
              </button>
            </form>
          </div>

          {/* Section 3: Active Disruption Events List */}
          {activeEvents.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-300">ACTIVE INJECTED EVENTS ({activeEvents.length})</span>
                <button
                  onClick={onResetSimulation}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> CLEAR ALL EVENTS
                </button>
              </div>

              <div className="space-y-1.5">
                {activeEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded bg-slate-900 border border-rose-900/60 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-rose-400 block">{evt.type}</span>
                      <span className="text-[10px] text-slate-400">{evt.description}</span>
                    </div>
                    <span className="text-amber-400 font-bold">+{evt.impactDelayMinutes}m</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between text-xs font-mono">
          <button
            onClick={onResetSimulation}
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Corridor State
          </button>
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
