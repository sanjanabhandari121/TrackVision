/**
 * TrackVision Train Detail Inspector Modal
 * Section 11: Multi-station ETA, uncertainty range, and delay causes
 */

import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Compass,
  Gauge,
  HelpCircle,
  Layers,
  MapPin,
  ShieldAlert,
  Train as TrainIcon,
  X,
  Zap,
} from 'lucide-react';
import { PassengerConnection, PlatformConflict, Train } from '../types/railway.ts';

interface TrainDetailModalProps {
  isOpen: boolean;
  train: Train | null;
  conflicts: PlatformConflict[];
  connections: PassengerConnection[];
  onClose: () => void;
  onOpenWhatIf: () => void;
}

export const TrainDetailModal: React.FC<TrainDetailModalProps> = ({
  isOpen,
  train,
  conflicts,
  connections,
  onClose,
  onOpenWhatIf,
}) => {
  if (!isOpen || !train) return null;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const trainConflicts = conflicts.filter(
    (c) => c.primaryTrainNumber === train.number || c.conflictingTrainNumber === train.number
  );
  const trainConnections = connections.filter((c) => c.incomingTrainNumber === train.number);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0b1120] border border-slate-700 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh] cursor-default"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-red-950 border border-red-800 flex items-center justify-center text-amber-300">
              <TrainIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-mono tracking-wider text-slate-100 uppercase">
                  TRAIN {train.number}: {train.name}
                </h2>
                {train.isSynthetic && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    SIMULATED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {train.origin} → {train.destination} • Type: {train.type}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs font-mono">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">CURRENT SPEED</span>
              <span className="text-base font-bold text-slate-200">{train.speedKmh} km/h</span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">CURRENT DELAY</span>
              <span className={`text-base font-bold ${train.currentDelayMinutes > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {train.currentDelayMinutes > 0 ? `+${train.currentDelayMinutes} min` : 'ON TIME'}
              </span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">FINAL ETA (PRYJ)</span>
              <span className={`text-base font-bold ${train.predictedDelayMinutes > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                {train.predictedFinalEta}
              </span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">UNCERTAINTY RANGE</span>
              <span className="text-base font-bold text-cyan-300">
                {train.predictionRangeMin}–{train.predictionRangeMax}
              </span>
            </div>
          </div>

          {/* Conflict Warning if active */}
          {trainConflicts.length > 0 && (
            <div className="p-3 rounded bg-red-950/60 border border-red-800 text-red-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>PLATFORM CONFLICT PREDICTED AT KANPUR CENTRAL (PF 3)</span>
                </div>
                <button
                  onClick={onOpenWhatIf}
                  className="px-2 py-1 bg-amber-500 text-black font-bold text-[10px] rounded hover:bg-amber-400 transition"
                >
                  RESOLVE IN WHAT-IF
                </button>
              </div>
              <p className="text-[11px] text-slate-300 font-sans">
                Occupancy overlaps with {trainConflicts[0].conflictingTrainNumber}. Expected delay impact: +7 minutes.
              </p>
            </div>
          )}

          {/* Multi-Station ETA Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold uppercase tracking-wider text-slate-200">
                  MULTI-STATION DYNAMIC ETA FORECAST
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">ML XGBoost Weighted Predictor</span>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">STATION</th>
                    <th className="p-2.5">SCHEDULED</th>
                    <th className="p-2.5">PREDICTED ETA</th>
                    <th className="p-2.5">FORECAST DELAY</th>
                    <th className="p-2.5">PLATFORM</th>
                    <th className="p-2.5">CONFIDENCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {train.multiStationEtas.map((stop) => (
                    <tr key={stop.stationId} className="hover:bg-slate-900/40 transition">
                      <td className="p-2.5 font-bold text-slate-200">
                        {stop.stationName} <span className="text-slate-500">({stop.stationCode})</span>
                      </td>
                      <td className="p-2.5 text-slate-400">{stop.scheduledArrival}</td>
                      <td className="p-2.5 font-bold text-amber-300">{stop.predictedArrival}</td>
                      <td className="p-2.5">
                        {stop.predictedDelayMinutes === 0 ? (
                          <span className="text-emerald-400 font-bold">ON TIME</span>
                        ) : (
                          <span className="text-amber-400 font-bold">+{stop.predictedDelayMinutes} min</span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-300">PF {stop.platform}</td>
                      <td className="p-2.5 text-cyan-400 font-semibold">{stop.confidence}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delay Contributors ("Why is it delayed?") */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold uppercase tracking-wider text-slate-200">
                DYNAMIC DELAY CAUSE CONTRIBUTORS
              </h3>
            </div>

            <div className="space-y-1.5">
              {train.delayCauses.length === 0 ? (
                <div className="p-3 rounded bg-slate-900 border border-slate-800 text-slate-500 italic">
                  No abnormal delay factors affecting this service.
                </div>
              ) : (
                train.delayCauses.map((c, i) => (
                  <div key={i} className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-200 block">{c.cause}</span>
                      <span className="text-[10px] text-slate-400 font-sans">{c.description}</span>
                    </div>
                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                      c.impactMinutes > 0 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {c.impactMinutes > 0 ? `+${c.impactMinutes} min` : `${c.impactMinutes} min`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Passenger Connection Scenario */}
          {trainConnections.length > 0 && (
            <div>
              <h3 className="font-bold uppercase tracking-wider text-slate-200 mb-2">
                DOWNSTREAM PASSENGER CONNECTION RISK
              </h3>
              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">
                    Connection at {trainConnections[0].junctionStationName} → {trainConnections[0].connectingTrainNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    trainConnections[0].riskLevel === 'HIGH'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {trainConnections[0].riskLevel} RISK ({trainConnections[0].missedConnectionProbability}%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  {trainConnections[0].reason}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/70 flex items-center justify-end gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
