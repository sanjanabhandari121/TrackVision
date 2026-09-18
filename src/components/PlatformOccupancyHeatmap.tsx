/**
 * TrackVision Platform Occupancy Heatmap Component
 * 24-Hour Visual Heatmap Matrix: Historical (00:00 - 18:00) & AI Projected (18:00 - 24:00)
 * Platform usage density, dwell congestion, bottleneck identification, and conflict warnings.
 */

import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Info,
  Layers,
  Sparkles,
  Train as TrainIcon,
  Zap,
} from 'lucide-react';
import { PlatformConflict, Station, Train } from '../types/railway.ts';

interface PlatformOccupancyHeatmapProps {
  station: Station;
  trains: Train[];
  conflicts: PlatformConflict[];
  onOpenWhatIf: () => void;
}

export interface HourlyPlatformData {
  platform: number;
  hour: number; // 0 to 23
  density: number; // 0 to 100
  trainsCount: number;
  trains: {
    number: string;
    name: string;
    type: string;
    scheduledArrival: string;
    scheduledDeparture: string;
    actualArrival?: string;
    actualDeparture?: string;
    delayMinutes: number;
    isConflict?: boolean;
  }[];
  isHistorical: boolean;
  isCurrent: boolean;
  isProjected: boolean;
  hasConflict: boolean;
  conflictDetails?: string;
}

const CURRENT_HOUR = 18; // 18:30 IST baseline in simulation

export const PlatformOccupancyHeatmap: React.FC<PlatformOccupancyHeatmapProps> = ({
  station,
  trains,
  conflicts,
  onOpenWhatIf,
}) => {
  const [viewWindow, setViewWindow] = useState<'ALL' | 'HISTORICAL' | 'PROJECTED'>('ALL');
  const [metricMode, setMetricMode] = useState<'DENSITY' | 'COUNT'>('DENSITY');
  const [selectedCell, setSelectedCell] = useState<HourlyPlatformData | null>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Generate 24-hour occupancy data matrix
  const heatmapData = useMemo(() => {
    const stationConflicts = conflicts.filter((c) => c.stationId === station.id || c.stationId === station.code);
    const stationArrivingTrains = trains.filter(
      (t) => t.nextStationId === station.id || t.currentStationId === station.id || t.nextStationId === station.code
    );

    const matrix: HourlyPlatformData[][] = [];

    // Helper deterministic random generator seeded by station & platform & hour
    const seedPseudo = (pf: number, hr: number) => {
      const codeSum = station.code.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const val = Math.sin(codeSum * 13 + pf * 37 + hr * 101) * 10000;
      return val - Math.floor(val);
    };

    for (let pf = 1; pf <= station.platforms; pf++) {
      const row: HourlyPlatformData[] = [];

      for (let hr = 0; hr < 24; hr++) {
        const isHistorical = hr < CURRENT_HOUR;
        const isCurrent = hr === CURRENT_HOUR;
        const isProjected = hr > CURRENT_HOUR;

        // Base traffic curve based on Indian Railway typical corridor rhythm:
        // Morning rush (06-09), Midday lull (11-14), Evening peak (17-21), Late night freight (01-04)
        let baseRushFactor = 0.35;
        if (hr >= 6 && hr <= 9) baseRushFactor = 0.78; // Morning peak
        else if (hr >= 11 && hr <= 14) baseRushFactor = 0.45; // Afternoon
        else if (hr >= 16 && hr <= 21) baseRushFactor = 0.88; // Evening mega peak
        else if (hr >= 22 || hr <= 4) baseRushFactor = 0.28; // Night freight / quiet hours

        // Specific platform characteristics (PF 1 & 2 are main line passenger, PF 3 & 4 loop line, etc.)
        const pfWeight = pf <= 3 ? 1.15 : pf <= 6 ? 0.95 : 0.75;
        const rnd = seedPseudo(pf, hr);
        let rawDensity = Math.min(Math.round((baseRushFactor * pfWeight + rnd * 0.2) * 100), 98);

        // Trains list for this cell
        const cellTrains: HourlyPlatformData['trains'] = [];
        let hasConflict = false;
        let conflictDetails: string | undefined;

        // Check if there are active trains in simulation matching this platform and hour
        if (hr === CURRENT_HOUR || hr === CURRENT_HOUR + 1) {
          // Dynamic trains from simulation
          stationArrivingTrains.forEach((t) => {
            if (t.assignedPlatformNextStation === pf) {
              const arrivalH = parseInt(t.predictedFinalEta.split(':')[0] || '18', 10);
              if (arrivalH === hr || (hr === CURRENT_HOUR && arrivalH < CURRENT_HOUR)) {
                cellTrains.push({
                  number: t.number,
                  name: t.name,
                  type: t.type,
                  scheduledArrival: t.scheduledFinalEta,
                  scheduledDeparture: `${hr}:${Math.min(55, Math.floor(rnd * 40) + 15).toString().padStart(2, '0')}`,
                  actualArrival: t.predictedFinalEta,
                  delayMinutes: t.predictedDelayMinutes,
                });
              }
            }
          });
        }

        // Platform 3 specific conflict at Kanpur Central (CNB) at hour 18
        const conflictMatch = stationConflicts.find((c) => c.platformNumber === pf);
        if (conflictMatch && (hr === CURRENT_HOUR || (hr === 18 && (station.id === 'CNB' || station.code === 'CNB')))) {
          hasConflict = true;
          rawDensity = 100;
          conflictDetails = `Platform ${pf} Double-Dwell Clashing: Train 12951 delayed arrival overlaps scheduled TV-DEMO-002 Express dwell window.`;

          // Ensure both trains are in the roster
          if (!cellTrains.some((t) => t.number === '12951')) {
            cellTrains.push({
              number: '12951',
              name: 'NDLS-BCT Rajdhani Express',
              type: 'SUPERFAST',
              scheduledArrival: '18:30',
              scheduledDeparture: '18:38',
              actualArrival: '18:42',
              actualDeparture: '18:48',
              delayMinutes: 12,
              isConflict: true,
            });
          }
          if (!cellTrains.some((t) => t.number === 'TV-DEMO-002')) {
            cellTrains.push({
              number: 'TV-DEMO-002',
              name: 'Kanpur Vande Bharat Spl',
              type: 'EXPRESS',
              scheduledArrival: '18:45',
              scheduledDeparture: '19:00',
              delayMinutes: 0,
              isConflict: true,
            });
          }
        } else if (cellTrains.length === 0 && rawDensity > 20) {
          // Synthetic realistic timetabled trains for historical & future slots
          const sampleNumbers = ['12424', '12560', '12302', '12004', '22436', '12418', '14218'];
          const sampleNames = [
            'Dibrugarh Rajdhani',
            'Shiv Ganga Express',
            'Howrah Rajdhani',
            'Lucknow Shatabdi',
            'Vande Bharat Exp',
            'Prayagraj Express',
            'Unchahar Express',
          ];
          const tIdx = Math.floor(rnd * sampleNumbers.length);
          const minuteOffset = Math.floor(rnd * 40);

          cellTrains.push({
            number: sampleNumbers[tIdx],
            name: sampleNames[tIdx],
            type: 'EXPRESS',
            scheduledArrival: `${hr.toString().padStart(2, '0')}:${minuteOffset.toString().padStart(2, '0')}`,
            scheduledDeparture: `${hr.toString().padStart(2, '0')}:${(minuteOffset + 12).toString().padStart(2, '0')}`,
            delayMinutes: isHistorical ? (rnd > 0.6 ? Math.floor(rnd * 8) : 0) : rnd > 0.7 ? Math.floor(rnd * 14) : 0,
          });

          if (rawDensity > 75) {
            cellTrains.push({
              number: `TV-SCH-${hr}${pf}`,
              name: 'Freight Container / Parcel Fast',
              type: 'FREIGHT',
              scheduledArrival: `${hr.toString().padStart(2, '0')}:${(minuteOffset + 22).toString().padStart(2, '0')}`,
              scheduledDeparture: `${hr.toString().padStart(2, '0')}:${(minuteOffset + 48).toString().padStart(2, '0')}`,
              delayMinutes: 0,
            });
          }
        }

        row.push({
          platform: pf,
          hour: hr,
          density: rawDensity,
          trainsCount: cellTrains.length,
          trains: cellTrains,
          isHistorical,
          isCurrent,
          isProjected,
          hasConflict,
          conflictDetails,
        });
      }

      matrix.push(row);
    }

    return matrix;
  }, [station, trains, conflicts]);

  // Overall station hourly statistics
  const hourlyAggregates = useMemo(() => {
    const stats: { hour: number; avgDensity: number; totalTrains: number; hasConflict: boolean }[] = [];
    for (let hr = 0; hr < 24; hr++) {
      let sumDensity = 0;
      let totalTrains = 0;
      let hasConflict = false;

      heatmapData.forEach((row) => {
        const cell = row[hr];
        if (cell) {
          sumDensity += cell.density;
          totalTrains += cell.trainsCount;
          if (cell.hasConflict) hasConflict = true;
        }
      });

      stats.push({
        hour: hr,
        avgDensity: Math.round(sumDensity / Math.max(heatmapData.length, 1)),
        totalTrains,
        hasConflict,
      });
    }
    return stats;
  }, [heatmapData]);

  // Station summary metrics
  const summary = useMemo(() => {
    let totalDensitySum = 0;
    let totalCells = 0;
    let peakHour = 18;
    let peakDensity = 0;
    let totalConflictsCount = 0;

    hourlyAggregates.forEach((h) => {
      totalDensitySum += h.avgDensity;
      totalCells += 1;
      if (h.avgDensity > peakDensity) {
        peakDensity = h.avgDensity;
        peakHour = h.hour;
      }
      if (h.hasConflict) totalConflictsCount++;
    });

    const avg24h = Math.round(totalDensitySum / Math.max(totalCells, 1));
    return {
      avg24h,
      peakHour: `${peakHour.toString().padStart(2, '0')}:00 - ${(peakHour + 1).toString().padStart(2, '0')}:00`,
      peakDensity,
      totalConflictsCount,
    };
  }, [hourlyAggregates]);

  // Filter columns based on active viewWindow
  const displayedHours = useMemo(() => {
    const all = Array.from({ length: 24 }, (_, i) => i);
    if (viewWindow === 'HISTORICAL') return all.filter((h) => h <= CURRENT_HOUR);
    if (viewWindow === 'PROJECTED') return all.filter((h) => h >= CURRENT_HOUR);
    return all;
  }, [viewWindow]);

  // Color helper based on density & conflict
  const getCellColor = (cell: HourlyPlatformData) => {
    if (cell.hasConflict) {
      return 'bg-rose-600 text-white border-2 border-red-300 ring-2 ring-red-500 animate-pulse';
    }
    const d = cell.density;
    if (d <= 15) return 'bg-[#071525]/80 border-slate-800/80 text-slate-500 hover:border-slate-600';
    if (d <= 35) return 'bg-emerald-950/70 border-emerald-900 text-emerald-300 hover:border-emerald-700';
    if (d <= 65) return 'bg-amber-950/70 border-amber-900 text-amber-300 hover:border-amber-700';
    if (d <= 85) return 'bg-orange-950/80 border-orange-900 text-orange-200 hover:border-orange-600';
    return 'bg-red-950/90 border-red-800 text-rose-200 hover:border-rose-600';
  };

  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 lg:p-5 shadow-xl space-y-4 font-mono text-xs">
      {/* Heatmap Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                24-HOUR PLATFORM OCCUPANCY HEATMAP
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700 font-bold">
                {station.code} • {station.platforms} PLATFORMS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Visual platform usage density across Historical Logged Records (00:00–18:00) & AI Projected Forecast (18:00–24:00)
            </p>
          </div>
        </div>

        {/* Controls: Window Filter & Metric Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Window Filter */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[11px]">
            <span className="text-slate-400 text-[10px] px-2 font-bold uppercase hidden sm:inline">
              WINDOW:
            </span>
            {(
              [
                { id: 'ALL', label: '24-Hour Day' },
                { id: 'HISTORICAL', label: 'Historical (00-18h)' },
                { id: 'PROJECTED', label: 'AI Forecast (18-24h)' },
              ] as const
            ).map((w) => (
              <button
                key={w.id}
                onClick={() => setViewWindow(w.id)}
                className={`px-2.5 py-1 rounded font-bold transition ${
                  viewWindow === w.id
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* Metric Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => setMetricMode('DENSITY')}
              className={`px-2.5 py-1 rounded font-bold transition ${
                metricMode === 'DENSITY'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Show Platform Capacity Utilization %"
            >
              Density %
            </button>
            <button
              onClick={() => setMetricMode('COUNT')}
              className={`px-2.5 py-1 rounded font-bold transition ${
                metricMode === 'COUNT'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Show Number of Handled Trains / Hour"
            >
              Train Count
            </button>
          </div>
        </div>
      </div>

      {/* Corridor Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-2.5 rounded-lg bg-[#071525] border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">24h Avg Station Utilization</span>
            <span className="text-lg font-bold text-slate-100">{summary.avg24h}%</span>
          </div>
          <div className="w-7 h-7 rounded bg-blue-950/80 border border-blue-800 flex items-center justify-center text-blue-400">
            <BarChart2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#071525] border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Peak Congestion Slot</span>
            <span className="text-sm font-bold text-amber-400">{summary.peakHour}</span>
            <span className="text-[10px] text-slate-400 ml-1">({summary.peakDensity}%)</span>
          </div>
          <div className="w-7 h-7 rounded bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-400">
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#071525] border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Telemetry Transition</span>
            <span className="text-sm font-bold text-cyan-300">18:30 IST (NOW)</span>
            <span className="text-[10px] text-emerald-400 block">Sensors Live</span>
          </div>
          <div className="w-7 h-7 rounded bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#071525] border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Projected Conflicts</span>
            <span className={`text-lg font-bold ${summary.totalConflictsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {summary.totalConflictsCount} Detected
            </span>
            {summary.totalConflictsCount > 0 && (
              <span className="text-[10px] text-amber-300 block">PF 3 Dwell Clash</span>
            )}
          </div>
          <div className={`w-7 h-7 rounded border flex items-center justify-center ${summary.totalConflictsCount > 0 ? 'bg-rose-950/80 border-rose-700 text-rose-400' : 'bg-emerald-950/80 border-emerald-700 text-emerald-400'}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Heatmap Matrix Container with Horizontal Scroll */}
      <div className="border border-slate-800 rounded-xl bg-[#071525] p-3 overflow-x-auto select-none">
        {/* Top Timeline Labels & Current Time Beacon */}
        <div className="min-w-[840px]">
          {/* Historical vs Projected Indicator Ribbon */}
          <div className="flex gap-1 mb-2 text-[10px] font-bold text-center">
            <div className="w-20 shrink-0" />
            <div className="flex-1 flex gap-1">
              {viewWindow === 'ALL' && (
                <>
                  <div
                    style={{ flex: '18 1 0%' }}
                    className="bg-slate-900/90 text-slate-400 py-1 rounded border border-slate-800 flex items-center justify-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span>HISTORICAL RECORDS (00:00 - 18:00 IST)</span>
                  </div>
                  <div
                    style={{ flex: '6 1 0%' }}
                    className="bg-cyan-950/60 text-cyan-300 py-1 rounded border border-cyan-800/80 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                    <span>AI DYNAMIC FORECAST (18:00 - 24:00)</span>
                  </div>
                </>
              )}
              {viewWindow === 'HISTORICAL' && (
                <div className="flex-1 bg-slate-900/90 text-slate-300 py-1 rounded border border-slate-800">
                  HISTORICAL TELEMETRY LOGS (00:00 - 18:00 IST)
                </div>
              )}
              {viewWindow === 'PROJECTED' && (
                <div className="flex-1 bg-cyan-950/80 text-cyan-300 py-1 rounded border border-cyan-800">
                  AI PROJECTED PLATFORM USAGE FORECAST (18:00 - 24:00 IST)
                </div>
              )}
            </div>
            <div className="w-20 shrink-0" />
          </div>

          {/* Hourly Header Columns */}
          <div className="flex items-center gap-1 mb-1.5 text-[10px] text-slate-400 font-mono">
            <div className="w-20 shrink-0 font-bold uppercase text-slate-400 px-1">PLATFORM</div>
            <div className="flex-1 flex gap-1">
              {displayedHours.map((hr) => {
                const isCurrent = hr === CURRENT_HOUR;
                const isHovered = hoveredHour === hr;
                return (
                  <div
                    key={hr}
                    onMouseEnter={() => setHoveredHour(hr)}
                    onMouseLeave={() => setHoveredHour(null)}
                    className={`flex-1 text-center py-1 rounded font-bold transition flex flex-col items-center justify-center ${
                      isCurrent
                        ? 'bg-amber-500 text-black ring-2 ring-amber-400 font-black'
                        : isHovered
                        ? 'bg-slate-800 text-cyan-300'
                        : 'bg-slate-900/80 text-slate-400'
                    }`}
                  >
                    <span>{hr.toString().padStart(2, '0')}:00</span>
                    {isCurrent && <span className="text-[8px] font-black uppercase">NOW</span>}
                  </div>
                );
              })}
            </div>
            <div className="w-20 shrink-0 text-center font-bold uppercase text-slate-400">24H AVG</div>
          </div>

          {/* Matrix Rows: One for each Platform */}
          <div className="space-y-1">
            {heatmapData.map((row, pIdx) => {
              const pfNum = pIdx + 1;
              const pfConflict = conflicts.some((c) => (c.stationId === station.id || c.stationId === station.code) && c.platformNumber === pfNum);

              // Calculate row average density
              const rowAvg = Math.round(row.reduce((acc, c) => acc + c.density, 0) / 24);

              return (
                <div key={pfNum} className="flex items-center gap-1">
                  {/* Platform Label */}
                  <div className={`w-20 shrink-0 px-2 py-2 rounded flex items-center justify-between border ${
                    pfConflict
                      ? 'bg-red-950/80 border-red-600 text-red-200'
                      : 'bg-slate-900/90 border-slate-800 text-slate-300'
                  }`}>
                    <span className="font-bold">PF {pfNum}</span>
                    {pfConflict && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" title="Platform Conflict" />
                    )}
                  </div>

                  {/* Hourly Heatmap Cells */}
                  <div className="flex-1 flex gap-1">
                    {displayedHours.map((hr) => {
                      const cell = row[hr];
                      const isSelected = selectedCell?.platform === pfNum && selectedCell?.hour === hr;
                      const isHovered = hoveredHour === hr;

                      return (
                        <div
                          key={hr}
                          onClick={() => setSelectedCell(cell)}
                          onMouseEnter={() => setHoveredHour(hr)}
                          onMouseLeave={() => setHoveredHour(null)}
                          className={`flex-1 h-9 rounded border flex flex-col items-center justify-center cursor-pointer transition transform ${
                            getCellColor(cell)
                          } ${
                            isSelected
                              ? 'ring-2 ring-white scale-105 z-20 shadow-lg'
                              : isHovered
                              ? 'brightness-125'
                              : 'hover:scale-105 hover:z-10'
                          }`}
                          title={`Platform ${pfNum} at ${hr}:00 | Density: ${cell.density}% | Trains: ${cell.trainsCount}${
                            cell.hasConflict ? ' | ⚠️ CONFLICT' : ''
                          }`}
                        >
                          {cell.hasConflict ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce" />
                          ) : metricMode === 'DENSITY' ? (
                            <span className="text-[10px] font-bold tracking-tighter">
                              {cell.density}%
                            </span>
                          ) : (
                            <div className="flex items-center gap-0.5">
                              <TrainIcon className="w-2.5 h-2.5 opacity-80" />
                              <span className="text-[10px] font-bold">{cell.trainsCount}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 24h Avg Utilization Gauge for this platform */}
                  <div className="w-20 shrink-0 px-2 py-1.5 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[10px]">
                    <span className={`font-bold ${rowAvg > 75 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {rowAvg}%
                    </span>
                    <div className="w-8 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          rowAvg > 75 ? 'bg-amber-400' : rowAvg > 50 ? 'bg-cyan-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(rowAvg, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Station Aggregate Hourly Density Ribbon */}
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-1">
            <div className="w-20 shrink-0 px-2 text-[10px] font-bold text-cyan-400 uppercase">
              STN LOAD
            </div>
            <div className="flex-1 flex gap-1">
              {displayedHours.map((hr) => {
                const stat = hourlyAggregates[hr];
                const isCurrent = hr === CURRENT_HOUR;
                return (
                  <div
                    key={hr}
                    className={`flex-1 py-1 text-center rounded text-[9px] font-mono border font-bold ${
                      stat.hasConflict
                        ? 'bg-red-950 text-red-300 border-red-700'
                        : isCurrent
                        ? 'bg-amber-950 text-amber-300 border-amber-700'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {stat.avgDensity}%
                  </div>
                );
              })}
            </div>
            <div className="w-20 shrink-0 text-center text-[10px] font-bold text-amber-400">
              {summary.avg24h}% NET
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-300 uppercase text-[10px]">OCCUPANCY SCALE:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#071525] border border-slate-700" />
            <span>Idle (0-15%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-700" />
            <span>Low (16-35%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-950 border border-amber-700" />
            <span>Moderate (36-65%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-950 border border-orange-700" />
            <span>Heavy (66-85%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-950 border border-red-700" />
            <span>Congested (&gt;85%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-600 border border-white animate-pulse" />
            <span className="text-red-300 font-bold">Conflict Overlap ⚠️</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click any cell to inspect scheduled trains & dwell slots</span>
        </div>
      </div>

      {/* Selected Cell Drill-Down Flyout / Inspector */}
      {selectedCell ? (
        <div className="p-4 rounded-xl bg-[#071525] border border-amber-500/80 shadow-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase">
                INSPECTING {station.name} • PLATFORM {selectedCell.platform}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 font-mono">
                {selectedCell.hour.toString().padStart(2, '0')}:00 – {(selectedCell.hour + 1).toString().padStart(2, '0')}:00 IST
              </span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                  selectedCell.isHistorical
                    ? 'bg-slate-800 text-slate-300'
                    : selectedCell.isCurrent
                    ? 'bg-amber-500 text-black font-black'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                }`}
              >
                {selectedCell.isHistorical ? 'HISTORICAL LOG' : selectedCell.isCurrent ? 'ACTIVE NOW' : 'AI PROJECTED'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-bold">
                Density: <span className={selectedCell.density > 75 ? 'text-amber-400' : 'text-emerald-400'}>{selectedCell.density}%</span>
              </span>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-slate-400 hover:text-slate-100 text-xs px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800"
              >
                Close ✕
              </button>
            </div>
          </div>

          {/* Conflict Alert in this cell if present */}
          {selectedCell.hasConflict && (
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-600 text-red-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
                <div>
                  <span className="font-bold text-xs block text-white">
                    CRITICAL PLATFORM CLASH PREDICTED
                  </span>
                  <span className="text-[11px] text-red-200 font-sans">
                    {selectedCell.conflictDetails ||
                      'Two trains scheduled on this platform with overlapping dwell time due to upstream delay.'}
                  </span>
                </div>
              </div>

              <button
                onClick={onOpenWhatIf}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Platform Reassignment</span>
              </button>
            </div>
          )}

          {/* Trains Manifest Table for this slot */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              TRAIN SERVICES IN THIS 1-HOUR WINDOW ({selectedCell.trains.length})
            </span>

            {selectedCell.trains.length > 0 ? (
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2">TRAIN</th>
                      <th className="p-2">SERVICE NAME</th>
                      <th className="p-2">TYPE</th>
                      <th className="p-2">SCHED ARR/DEP</th>
                      <th className="p-2">ESTIMATED / ACTUAL</th>
                      <th className="p-2">DELAY STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {selectedCell.trains.map((t, idx) => (
                      <tr key={idx} className={t.isConflict ? 'bg-red-950/40' : ''}>
                        <td className="p-2 font-bold text-slate-100 flex items-center gap-1">
                          {t.isConflict && <AlertTriangle className="w-3 h-3 text-red-400" />}
                          <span>{t.number}</span>
                        </td>
                        <td className="p-2 text-slate-300 font-sans">{t.name}</td>
                        <td className="p-2 text-slate-400">{t.type}</td>
                        <td className="p-2 text-slate-300">
                          {t.scheduledArrival} – {t.scheduledDeparture}
                        </td>
                        <td className="p-2 text-amber-300 font-bold">
                          {t.actualArrival || t.scheduledArrival} – {t.actualDeparture || t.scheduledDeparture}
                        </td>
                        <td className="p-2">
                          {t.isConflict ? (
                            <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-bold text-[9px] animate-pulse">
                              OVERLAP CLASH
                            </span>
                          ) : t.delayMinutes > 0 ? (
                            <span className="text-amber-400 font-bold">+{t.delayMinutes}m delay</span>
                          ) : (
                            <span className="text-emerald-400 font-bold">ON TIME</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-3 rounded bg-slate-900/60 text-slate-400 text-center">
                No services scheduled. Platform available for turnaround or freight clearance.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
