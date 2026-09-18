/**
 * TrackVision Active Train Fleet List Component
 * Clean light command-centre card layout matching Reference Image:
 * - Active Trains title with count
 * - Filter pills: All (28) | On Time (18) | Delayed (8) | Critical (2)
 * - Clean search bar: "Search train number or name..."
 * - High-contrast cards with locomotive thumbnail, delay status pill, ETA, and confidence
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Train as TrainIcon,
} from 'lucide-react';
import { Train } from '../types/railway.ts';

interface TrainListProps {
  trains: Train[];
  selectedTrainId: string | null;
  onSelectTrain: (id: string) => void;
  onViewDetail?: (train: Train) => void;
}

// Indian Railways locomotive badge
const LocomotiveBadge: React.FC<{ type: string }> = ({ type }) => {
  const isPremium = type === 'RAJDHANI' || type === 'VANDE_BHARAT';
  return (
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
        isPremium
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}
    >
      <TrainIcon className="w-5 h-5" />
    </div>
  );
};

export const TrainList: React.FC<TrainListProps> = ({
  trains,
  selectedTrainId,
  onSelectTrain,
  onViewDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'ON TIME' | 'DELAYED' | 'CRITICAL'>('ALL');

  const onTimeCount = trains.filter((t) => t.predictedDelayMinutes === 0).length;
  const delayedCount = trains.filter((t) => t.predictedDelayMinutes > 0 && t.predictedDelayMinutes < 8).length;
  const criticalCount = trains.filter((t) => t.predictedDelayMinutes >= 8 || t.signalRestrictionActive).length;

  const filteredTrains = trains.filter((t) => {
    const matchesSearch =
      t.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.currentStationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nextStationName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'ON TIME') return t.predictedDelayMinutes === 0;
    if (filterMode === 'DELAYED') return t.predictedDelayMinutes > 0 && t.predictedDelayMinutes < 8;
    if (filterMode === 'CRITICAL') return t.predictedDelayMinutes >= 8 || t.signalRestrictionActive;
    return true;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-[540px] lg:h-[650px] shadow-xs overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="p-3.5 border-b border-slate-200 bg-white space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Active Trains ({trains.length})
          </h2>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
            DELHI → PRYJ
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: 'ALL', label: `All (${trains.length})` },
            { id: 'ON TIME', label: `On Time (${onTimeCount})` },
            { id: 'DELAYED', label: `Delayed (${delayedCount})` },
            { id: 'CRITICAL', label: `Critical (${criticalCount})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id as any)}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs whitespace-nowrap transition ${
                filterMode === f.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search train number or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Train List Items */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredTrains.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No trains found matching criteria.
          </div>
        ) : (
          filteredTrains.map((train) => {
            const isSelected = selectedTrainId === train.id || selectedTrainId === train.number;
            const isDelayed = train.predictedDelayMinutes > 0;
            const isCritical = train.predictedDelayMinutes >= 8 || train.signalRestrictionActive;

            return (
              <div
                key={train.id}
                onClick={() => onSelectTrain(train.id)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                {/* Left: Locomotive thumbnail + Train info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <LocomotiveBadge type={train.type} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs font-mono">
                        {train.number}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {train.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {train.origin.split(' ')[0]} → {train.destination.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Next: <span className="text-slate-600">{train.nextStationName}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Delay badge, ETA & Confidence */}
                <div className="text-right shrink-0 space-y-1">
                  <div>
                    {isCritical ? (
                      <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-mono">
                        +{train.predictedDelayMinutes} min
                      </span>
                    ) : isDelayed ? (
                      <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono">
                        +{train.predictedDelayMinutes} min
                      </span>
                    ) : (
                      <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                        ON TIME
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-mono font-semibold text-slate-700">
                    {train.predictedFinalEta}
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono">
                    Conf: <span className="font-semibold text-slate-700">{train.confidence}%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
