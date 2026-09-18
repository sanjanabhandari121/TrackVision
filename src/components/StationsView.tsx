/**
 * TrackVision Station Intelligence & Platform Occupancy View
 * Section 31: Platform occupancy timeline, junction congestion, and conflict warnings
 */

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Flame,
  Layers,
  LayoutGrid,
  MapPin,
  ShieldAlert,
  Train as TrainIcon,
  Zap,
} from 'lucide-react';
import { PlatformConflict, Station, Train } from '../types/railway.ts';
import { PlatformOccupancyHeatmap } from './PlatformOccupancyHeatmap.tsx';

interface StationsViewProps {
  stations: Station[];
  trains: Train[];
  conflicts: PlatformConflict[];
  selectedStationId: string | null;
  onSelectStation: (id: string) => void;
  onOpenWhatIf: () => void;
}

export const StationsView: React.FC<StationsViewProps> = ({
  stations,
  trains,
  conflicts,
  selectedStationId,
  onSelectStation,
  onOpenWhatIf,
}) => {
  const [activeStationId, setActiveStationId] = useState<string>(selectedStationId || 'CNB');
  const [stationDisplayTab, setStationDisplayTab] = useState<'COMBINED' | 'HEATMAP_ONLY' | 'SLOTS_ONLY'>('COMBINED');
  const [timelineWindow, setTimelineWindow] = useState<'NOW' | '+15M' | '+30M' | '+60M'>('NOW');

  useEffect(() => {
    if (selectedStationId) {
      setActiveStationId(selectedStationId);
    }
  }, [selectedStationId]);

  const currentStation = stations.find((s) => s.id === activeStationId || s.code === activeStationId) || stations[5]; // default CNB

  // Find trains at or arriving at this station
  const arrivingTrains = trains.filter(
    (t) => t.nextStationId === currentStation.id || t.currentStationId === currentStation.id
  );

  const stationConflicts = conflicts.filter((c) => c.stationId === currentStation.id);

  return (
    <div className="space-y-5 p-4 max-w-7xl mx-auto">
      {/* Station Selector Bar */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            SELECT CORRIDOR JUNCTION:
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5 text-xs font-mono">
          {stations.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setActiveStationId(st.id);
                onSelectStation(st.id);
              }}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                currentStation.id === st.id
                  ? 'bg-amber-500 text-black border-amber-400 shadow'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              <span>{st.name}</span>
              <span className="text-[10px] ml-1 opacity-70">({st.code})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Station Intelligence Panel */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow space-y-5">
        {/* Header & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold font-mono text-slate-100 uppercase">
                {currentStation.name} Junction ({currentStation.code})
              </h2>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  currentStation.status === 'CRITICAL'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                    : currentStation.status === 'CONGESTED'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {currentStation.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {currentStation.platforms} Platforms • Yard Congestion: {Math.round(currentStation.currentCongestion * 100)}% •
              Active Services: {arrivingTrains.length}
            </p>
          </div>

          {/* View mode switcher & timeline filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setStationDisplayTab('COMBINED')}
                className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition ${
                  stationDisplayTab === 'COMBINED'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>COMBINED VIEW</span>
              </button>

              <button
                onClick={() => setStationDisplayTab('HEATMAP_ONLY')}
                className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition ${
                  stationDisplayTab === 'HEATMAP_ONLY'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>24H HEATMAP</span>
              </button>

              <button
                onClick={() => setStationDisplayTab('SLOTS_ONLY')}
                className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition ${
                  stationDisplayTab === 'SLOTS_ONLY'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>LIVE SLOTS</span>
              </button>
            </div>

            {/* Timeline filter */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs font-mono">
              <span className="text-slate-400 text-[10px] px-2 flex items-center gap-1 font-bold">
                <Clock className="w-3 h-3 text-cyan-400" /> LIVE OFFSET:
              </span>
              {(['NOW', '+15M', '+30M', '+60M'] as const).map((win) => (
                <button
                  key={win}
                  onClick={() => setTimelineWindow(win)}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    timelineWindow === win ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {win}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 24-Hour Visual Platform Occupancy Heatmap (Historical + Projected) */}
        {(stationDisplayTab === 'COMBINED' || stationDisplayTab === 'HEATMAP_ONLY') && (
          <PlatformOccupancyHeatmap
            station={currentStation}
            trains={trains}
            conflicts={conflicts}
            onOpenWhatIf={onOpenWhatIf}
          />
        )}

        {/* Conflict Alert Banner if active */}
        {stationConflicts.length > 0 && (
          <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-700 text-red-200 flex flex-wrap items-center justify-between gap-3 shadow">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <span className="font-mono font-bold text-xs block">
                  PLATFORM 3 DWELL CONFLICT DETECTED
                </span>
                <span className="text-xs text-slate-300 font-sans">
                  Train 12951 delay pushes dwell into TV-DEMO-002 scheduled slot (18:42–18:48 vs 18:45).
                </span>
              </div>
            </div>

            <button
              onClick={onOpenWhatIf}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs rounded flex items-center gap-1.5 transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>SIMULATE PLATFORM 5 REASSIGNMENT</span>
            </button>
          </div>
        )}

        {/* Platform Occupancy Grid */}
        {(stationDisplayTab === 'COMBINED' || stationDisplayTab === 'SLOTS_ONLY') && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                LIVE PLATFORM OCCUPANCY SLOTS ({currentStation.name})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
            {Array.from({ length: currentStation.platforms }).map((_, idx) => {
              const pfNum = idx + 1;
              const isConflictPf = stationConflicts.some((c) => c.platformNumber === pfNum);
              const occ = currentStation.platformsOccupancy.find((p) => p.platformNumber === pfNum);

              let assignedTrain = occ?.trainNumber;
              let timeSpan = occ ? `${occ.occupiedFrom} - ${occ.occupiedUntil}` : 'Vacant';

              if (currentStation.id === 'CNB' && pfNum === 3 && isConflictPf) {
                assignedTrain = '12951 (Delayed) + TV-DEMO-002';
                timeSpan = '18:42 - 18:48 [OVERLAP]';
              }

              return (
                <div
                  key={pfNum}
                  className={`p-3 rounded-lg border flex flex-col justify-between h-28 transition ${
                    isConflictPf
                      ? 'bg-red-950/80 border-red-600 ring-2 ring-red-500/40 shadow-lg'
                      : assignedTrain
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">PLATFORM {pfNum}</span>
                    {isConflictPf ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-600 text-white animate-pulse">
                        CONFLICT
                      </span>
                    ) : assignedTrain ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                        OCCUPIED
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        CLEAR
                      </span>
                    )}
                  </div>

                  <div>
                    <span className={`font-mono text-xs font-bold block truncate ${isConflictPf ? 'text-amber-300' : 'text-slate-100'}`}>
                      {assignedTrain || 'Line Available'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{timeSpan}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

        {/* Incoming Trains Table */}
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 mb-2">
            INCOMING & PASSING SERVICES ({arrivingTrains.length})
          </h3>
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="p-2.5">TRAIN</th>
                  <th className="p-2.5">NAME</th>
                  <th className="p-2.5">SPEED</th>
                  <th className="p-2.5">CURRENT DELAY</th>
                  <th className="p-2.5">PREDICTED ARRIVAL</th>
                  <th className="p-2.5">ASSIGNED PF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 text-[11px]">
                {arrivingTrains.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-2.5 font-bold text-slate-100">{t.number}</td>
                    <td className="p-2.5 text-slate-300 font-sans">{t.name}</td>
                    <td className="p-2.5 text-slate-400">{t.speedKmh} km/h</td>
                    <td className="p-2.5">
                      {t.predictedDelayMinutes === 0 ? (
                        <span className="text-emerald-400 font-bold">ON TIME</span>
                      ) : (
                        <span className="text-amber-400 font-bold">+{t.predictedDelayMinutes} min</span>
                      )}
                    </td>
                    <td className="p-2.5 font-bold text-amber-300">{t.predictedFinalEta}</td>
                    <td className="p-2.5 text-slate-300">Platform {t.assignedPlatformNextStation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
