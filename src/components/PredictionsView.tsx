/**
 * TrackVision Predictions & Forecast Explainability View (Section 19 & 20)
 * Visualizes dynamic ETA curves, uncertainty confidence intervals,
 * and mathematical factor decomposition ("Why did ETA change?").
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  Layers,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { MultiStationEta, Station, Train } from '../types/railway.ts';

interface PredictionsViewProps {
  trains: Train[];
  selectedTrainId: string | null;
  stations: Station[];
  onSelectTrain: (trainId: string) => void;
  onOpenWhatIf?: () => void;
}

export const PredictionsView: React.FC<PredictionsViewProps> = ({
  trains,
  selectedTrainId,
  stations,
  onSelectTrain,
}) => {
  const train = trains.find((t) => t.id === selectedTrainId || t.number === selectedTrainId) || trains[0];
  const [selectedStationEtaIdx, setSelectedStationEtaIdx] = useState<number>(0);

  if (!train) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
        No active train selected for ETA telemetry analysis.
      </div>
    );
  }

  const multiEtas = train.multiStationEtas || [];
  const activeEta = multiEtas[selectedStationEtaIdx] || multiEtas[multiEtas.length - 1];

  // Calculate factor totals
  const totalImpact = train.delayCauses.reduce((acc, c) => acc + c.impactMinutes, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Train Selector */}
      <div className="bg-[#0D2138] border border-slate-800 rounded-xl p-4 shadow flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#8B1E2D] border border-red-500/50 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-[#F4EBDD]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mono font-bold text-sm text-[#F7F8FA] uppercase tracking-wider">
                DYNAMIC ETA & PREDICTION EXPLAINABILITY
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                MODEL V1.0 ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans">
              Non-linear trajectory recalibration with confidence intervals and causal attribution
            </p>
          </div>
        </div>

        {/* Train Quick Pill Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">SELECT TRAIN:</span>
          <select
            value={train.number}
            onChange={(e) => onSelectTrain(e.target.value)}
            className="bg-[#071525] border border-slate-700 rounded px-3 py-1 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
          >
            {trains.map((t) => (
              <option key={t.id} value={t.number}>
                {t.number} — {t.name.split(' ')[0]} ({t.predictedDelayMinutes > 0 ? `+${t.predictedDelayMinutes}m` : 'ON TIME'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Summary Cards for Selected Train */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0D2138] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>SCHEDULED ETA</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-200">
            {train.scheduledFinalEta}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Terminal: Prayagraj Jn (PRYJ)</span>
        </div>

        <div className="bg-[#0D2138] border border-slate-800 rounded-xl p-4 ring-1 ring-amber-500/50">
          <div className="flex items-center justify-between text-xs font-mono text-amber-400 mb-1">
            <span>TRACKVISION DYNAMIC ETA</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {train.predictedFinalEta}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono mt-0.5">
            <span className={train.predictedDelayMinutes > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {train.predictedDelayMinutes > 0 ? `+${train.predictedDelayMinutes} MIN DELAY` : 'ON TIME'}
            </span>
          </div>
        </div>

        <div className="bg-[#0D2138] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-400 mb-1">
            <span>UNCERTAINTY BAND</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {train.predictionRangeMin} – {train.predictionRangeMax}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">90% Confidence Interval</span>
        </div>

        <div className="bg-[#0D2138] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400 mb-1">
            <span>MODEL CONFIDENCE</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {train.confidence}%
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Calculated from historical corridor variance</span>
        </div>
      </div>

      {/* Section 19: ETA Route Timeline & Comparison Graph */}
      <div className="bg-[#0D2138] border border-slate-800 rounded-xl p-5 shadow">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-200">
              STATION-BY-STATION ETA TIMELINE & TRAJECTORY GRAPH
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-500" />
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-400" />
              <span>TrackVision Dynamic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-cyan-900/50 border border-cyan-500" />
              <span>Uncertainty Range</span>
            </div>
          </div>
        </div>

        {/* Visual Corridor Station Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
          {multiEtas.map((stop, idx) => {
            const isDelayed = stop.predictedDelayMinutes > 0;
            const isSelected = selectedStationEtaIdx === idx;

            return (
              <button
                key={stop.stationCode}
                onClick={() => setSelectedStationEtaIdx(idx)}
                className={`p-3 rounded-lg border text-left transition flex flex-col gap-1.5 relative ${
                  isSelected
                    ? 'bg-[#071525] border-amber-400 ring-1 ring-amber-400'
                    : 'bg-[#071525]/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {stop.stationCode}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">PF {stop.platform}</span>
                </div>

                <span className="text-xs font-bold text-slate-200 truncate">{stop.stationName}</span>

                <div className="mt-1 pt-1 border-t border-slate-800/80 space-y-0.5 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>SCH:</span>
                    <span>{stop.scheduledArrival}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-amber-400">ETA:</span>
                    <span className={isDelayed ? 'text-rose-400' : 'text-emerald-400'}>
                      {stop.predictedArrival}
                    </span>
                  </div>
                </div>

                {isDelayed && (
                  <span className="text-[9px] font-mono font-bold text-rose-400 block text-right">
                    +{stop.predictedDelayMinutes}m
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 20: WHY DID ETA CHANGE? (Factor Attribution Breakdown) */}
      <div className="bg-[#0D2138] border border-slate-800 rounded-xl p-5 shadow space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-200">
              WHY DID THE ETA CHANGE? (CAUSAL FACTOR ATTRIBUTION)
            </h3>
          </div>
          <span className="text-xs font-mono text-amber-300 font-bold">
            NET VARIANCE: {totalImpact > 0 ? `+${totalImpact} MIN` : `${totalImpact} MIN`}
          </span>
        </div>

        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          TrackVision dynamically isolates and decomposes primary and secondary delay drivers using continuous signal telemetry,
          section block occupancy, and historical engineering slack profiles.
        </p>

        {/* Visual Bar Breakdown */}
        <div className="space-y-3 pt-2">
          {train.delayCauses.length === 0 ? (
            <div className="p-4 rounded bg-[#071525] border border-slate-800 text-center text-slate-400 text-xs font-mono">
              Train is operating on-schedule. No adverse delay factors detected.
            </div>
          ) : (
            train.delayCauses.map((cause, idx) => {
              const isPositiveDelay = cause.impactMinutes > 0;
              const barWidth = Math.min(Math.abs(cause.impactMinutes) * 15, 100);

              return (
                <div key={idx} className="bg-[#071525] p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isPositiveDelay ? (
                        <TrendingUp className="w-4 h-4 text-rose-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-emerald-400" />
                      )}
                      <span className="text-xs font-mono font-bold text-slate-100">{cause.cause}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-400">
                        {cause.confidence}% factor confidence
                      </span>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          isPositiveDelay
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {isPositiveDelay ? `+${cause.impactMinutes} MIN` : `${cause.impactMinutes} MIN`}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Graphic */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPositiveDelay ? 'bg-rose-500' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    {cause.description}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Corridor Train Comparison Table */}
      <div className="bg-[#0D2138] border border-slate-800 rounded-xl p-5 shadow">
        <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>ALL CORRIDOR TRAINS PREDICTION MATRIX</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="py-2 px-3">TRAIN</th>
                <th className="py-2 px-3">SECTION</th>
                <th className="py-2 px-3">SPEED</th>
                <th className="py-2 px-3">SCHED ETA</th>
                <th className="py-2 px-3">PREDICTED ETA</th>
                <th className="py-2 px-3">DELAY</th>
                <th className="py-2 px-3">CONFIDENCE</th>
                <th className="py-2 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {trains.map((t) => {
                const isSelected = t.id === train.id;
                return (
                  <tr
                    key={t.id}
                    className={`transition hover:bg-slate-800/40 ${isSelected ? 'bg-amber-950/20' : ''}`}
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-100">
                      {t.number} <span className="text-slate-400 font-normal">({t.name.split(' ')[0]})</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {t.currentStationName} → {t.nextStationName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{t.speedKmh} km/h</td>
                    <td className="py-2.5 px-3 text-slate-400">{t.scheduledFinalEta}</td>
                    <td className="py-2.5 px-3 text-amber-300 font-bold">{t.predictedFinalEta}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.predictedDelayMinutes > 0
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {t.predictedDelayMinutes > 0 ? `+${t.predictedDelayMinutes}m` : 'ON TIME'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{t.confidence}%</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectTrain(t.number)}
                        className="px-2 py-1 bg-slate-800 hover:bg-amber-500 hover:text-black rounded text-[10px] font-bold transition text-slate-300"
                      >
                        ANALYZE
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
};
