/**
 * TrackVision Passenger Application View (Mobile-First)
 * Section 22 & 30: Clean, accessible passenger interface with ETA range,
 * plain-language delay reason, and interchange connection risk calculation.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Gauge,
  HelpCircle,
  MapPin,
  Search,
  ShieldAlert,
  Train as TrainIcon,
} from 'lucide-react';
import { PassengerConnection, Train } from '../types/railway.ts';

interface PassengerViewProps {
  trains: Train[];
  passengerConnections: PassengerConnection[];
  selectedTrainId: string | null;
  onSelectTrain: (id: string) => void;
}

export const PassengerView: React.FC<PassengerViewProps> = ({
  trains,
  passengerConnections,
  selectedTrainId,
  onSelectTrain,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConnectingTrain, setSelectedConnectingTrain] = useState<string>('TV-DEMO-002');

  const currentTrain = trains.find((t) => t.id === selectedTrainId || t.number === selectedTrainId) || trains[0];

  const filteredTrains = trains.filter(
    (t) =>
      t.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find connection scenario for this train
  const connectionScenario = passengerConnections.find(
    (c) => c.incomingTrainNumber === currentTrain.number
  );

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      {/* Passenger Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-md">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 font-sans tracking-tight">
              TrackVision Passenger Portal
            </h2>
            <p className="text-xs text-cyan-300 font-sans">
              Real-time dynamic arrival forecasts & connection safety
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-900/80 text-cyan-200 border border-cyan-700">
          DELHI—PRAYAGRAJ
        </span>
      </div>

      {/* Train Search Selector */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search train number or destination..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 shadow-inner"
        />

        {searchTerm && (
          <div className="absolute top-12 left-0 right-0 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-800">
            {filteredTrains.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  onSelectTrain(t.id);
                  setSearchTerm('');
                }}
                className="p-3 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-slate-200">{t.number}</span>
                  <span className="text-slate-400 ml-2">{t.name}</span>
                </div>
                <span className="text-cyan-400 font-mono">{t.destination}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Primary Hero Passenger ETA Card */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold font-mono text-slate-100">{currentTrain.number}</span>
              <span className="text-sm text-slate-300 font-medium">{currentTrain.name}</span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Current: {currentTrain.currentStationName} → Next: {currentTrain.nextStationName}
            </p>
          </div>

          <div>
            {currentTrain.predictedDelayMinutes === 0 ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                ON TIME
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                +{currentTrain.predictedDelayMinutes} MIN DELAY
              </span>
            )}
          </div>
        </div>

        {/* Large ETA Callout */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 text-center space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            ESTIMATED TIME OF ARRIVAL (PRAYAGRAJ)
          </span>
          <div className="text-4xl font-extrabold font-mono text-amber-400 tracking-tight">
            {currentTrain.predictedFinalEta}
          </div>
          <div className="text-xs font-mono text-cyan-300 pt-1">
            Prediction Window: <strong>{currentTrain.predictionRangeMin} – {currentTrain.predictionRangeMax}</strong>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Confidence: <span className="text-emerald-400 font-semibold">{currentTrain.confidence}%</span>
          </div>
        </div>

        {/* Plain Language Delay Explanation */}
        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>WHY IS MY TRAIN DELAYED?</span>
          </div>
          <p className="text-slate-300 font-sans leading-relaxed">
            {currentTrain.predictedDelayMinutes === 0
              ? 'Your train is running strictly on schedule with clear signals along the track.'
              : currentTrain.delayCauses.length > 0
              ? currentTrain.delayCauses.map((c) => `${c.cause} (${c.impactMinutes > 0 ? `+${c.impactMinutes}m` : `${c.impactMinutes}m`}): ${c.description}`).join('. ')
              : 'Normal operational variance on section interlocking blocks.'}
          </p>
        </div>
      </div>

      {/* Passenger Interchange / Connection Risk Inspector */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            PLANNING A CONNECTING TRAIN?
          </h3>
        </div>

        <p className="text-xs text-slate-400 font-sans">
          Check whether your connection is at risk due to ETA uncertainty:
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block">MY TRAIN</span>
            <span className="font-bold text-slate-200">{currentTrain.number}</span>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block">CONNECTING TRAIN</span>
            <span className="font-bold text-amber-300">{selectedConnectingTrain}</span>
          </div>
        </div>

        {connectionScenario ? (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-2 ${
              connectionScenario.riskLevel === 'HIGH'
                ? 'bg-rose-950/50 border-rose-700 text-rose-200'
                : 'bg-emerald-950/40 border-emerald-700 text-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold uppercase text-xs flex items-center gap-1.5">
                {connectionScenario.riskLevel === 'HIGH' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                {connectionScenario.riskLevel} CONNECTION RISK
              </span>
              <span className="font-mono font-bold text-[11px]">
                {connectionScenario.missedConnectionProbability}% Miss Probability
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-black/30 p-2 rounded">
              <div>
                <span className="text-slate-400 block text-[10px]">TRANSFER WINDOW:</span>
                <span className="font-bold">{connectionScenario.transferWindowMinutes} minutes</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">JUNCTION STATION:</span>
                <span className="font-bold">{connectionScenario.junctionStationName}</span>
              </div>
            </div>

            <p className="text-[11px] font-sans leading-relaxed text-slate-300">
              {connectionScenario.reason}
            </p>
          </div>
        ) : (
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-400 font-sans">
            Transfer buffer of &gt;20 minutes available at next junction. Connection safe.
          </div>
        )}
      </div>
    </div>
  );
};
