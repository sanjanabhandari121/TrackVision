/**
 * TrackVision Network View & Delay Propagation Cascade
 * Section 18, 19 & 32: Visual ripple graph, section intelligence, and dependency tracking
 */

import React from 'react';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  GitBranch,
  Layers,
  Network,
  Radio,
  Share2,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { DelayPropagationNode, Section, Train } from '../types/railway.ts';

interface NetworkViewProps {
  sections: Section[];
  propagationNodes: DelayPropagationNode[];
  trains: Train[];
  onOpenWhatIf: () => void;
}

export const NetworkView: React.FC<NetworkViewProps> = ({
  sections,
  propagationNodes,
  trains,
  onOpenWhatIf,
}) => {
  return (
    <div className="space-y-5 p-4 max-w-7xl mx-auto">
      {/* Section 1: Delay Propagation Ripple Graph */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-red-950 border border-red-800 flex items-center justify-center text-amber-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono tracking-wider text-slate-100 uppercase">
                DELAY PROPAGATION CASCADE (RIPPLE EFFECT)
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Predicts downstream operational dependencies instead of treating each train in isolation
              </p>
            </div>
          </div>

          <button
            onClick={onOpenWhatIf}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs rounded flex items-center gap-1.5 transition"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>RESOLVE CASCADE IN WHAT-IF</span>
          </button>
        </div>

        {/* Visual Cascade Tree */}
        <div className="space-y-3">
          {propagationNodes.map((node, index) => (
            <div key={index} className="flex flex-col items-center">
              {/* Ripple Node Card */}
              <div
                className={`w-full max-w-2xl p-4 rounded-lg border text-xs font-mono flex flex-col gap-2 ${
                  node.isSource
                    ? 'bg-rose-950/40 border-rose-700 ring-2 ring-rose-500/20 shadow-lg'
                    : 'bg-slate-900/80 border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        node.isSource ? 'bg-rose-600 text-white' : 'bg-amber-500 text-black'
                      }`}
                    >
                      {node.isSource ? 'CASCADE SOURCE' : `PROPAGATED (+${node.delayMinutes}m)`}
                    </span>
                    <span className="text-sm font-bold text-slate-100 font-mono">
                      Train {node.trainNumber}
                    </span>
                    <span className="text-slate-400 text-[11px] font-sans truncate">
                      ({node.trainName})
                    </span>
                  </div>

                  <span className="text-rose-400 font-bold text-sm">+{node.delayMinutes} min</span>
                </div>

                <div className="text-[11px] text-slate-300 font-sans">
                  <strong>Location / Constraint:</strong> {node.stationName}
                </div>

                <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 font-sans">
                  <strong>Mechanism:</strong> {node.cause}
                </div>
              </div>

              {/* Connecting Arrow down to next affected node */}
              {index < propagationNodes.length - 1 && (
                <div className="py-2 flex flex-col items-center text-slate-500">
                  <div className="w-0.5 h-4 bg-slate-700" />
                  <ArrowDown className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span className="text-[10px] font-mono text-amber-400 font-semibold mt-0.5">
                    PLATFORM OCCUPANCY EXTENSION
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Section Intelligence Matrix */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded bg-blue-950 border border-blue-800 flex items-center justify-center text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono tracking-wider text-slate-100 uppercase">
              CORRIDOR SECTION INTELLIGENCE (NDLS → PRYJ)
            </h2>
            <p className="text-[11px] text-slate-400 font-sans">
              Block section running times, empirical delay distributions, and XGBoost MAE metrics
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
          {sections.map((sec) => {
            const isRestricted = sec.signalRestriction;
            const isHighCongestion = sec.currentCongestion > 0.6;

            return (
              <div
                key={sec.id}
                className={`p-3.5 rounded-lg border flex flex-col justify-between gap-3 ${
                  isRestricted
                    ? 'bg-rose-950/30 border-rose-700 ring-1 ring-rose-600/50'
                    : isHighCongestion
                    ? 'bg-amber-950/20 border-amber-800/70'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-100 text-sm">
                      {sec.fromStationName} → {sec.toStationName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{sec.distanceKm} km</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-semibold mt-1">
                    {isRestricted ? (
                      <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                        SIGNAL RESTRICTION ACTIVE (35 km/h)
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        MAX {sec.maxSpeedKmh} KM/H • CLEAR
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/70 p-2.5 rounded border border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px]">AVG DELAY:</span>
                    <span className="font-bold text-amber-300">{sec.averageDelayMinutes} min</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">AVG RECOVERY:</span>
                    <span className="font-bold text-emerald-400">-{sec.averageRecoveryMinutes} min</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CONGESTION:</span>
                    <span className={`font-bold ${isHighCongestion ? 'text-rose-400' : 'text-slate-300'}`}>
                      {Math.round(sec.currentCongestion * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">MODEL MAE:</span>
                    <span className="font-bold text-cyan-300">{sec.modelMaeMinutes} min</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
