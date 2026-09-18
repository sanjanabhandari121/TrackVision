/**
 * TrackVision Key Operational Metrics Bar
 * 6-Column KPI Grid:
 * Active Trains, On Time %, Delayed Trains, Critical Issues, Avg ETA Error, Network Delay.
 * Includes sleek compact/expanded toggle to keep the dashboard uncluttered.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Network,
  Train as TrainIcon,
} from 'lucide-react';
import { ModelMetricsSummary, NetworkRiskSummary, Train as TrainType } from '../types/railway.ts';

interface MetricsBarProps {
  trains: TrainType[];
  conflictsCount: number;
  networkRisk: NetworkRiskSummary;
  modelMetrics: ModelMetricsSummary | null;
  onFilterClick?: (filter: string) => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  trains,
  conflictsCount,
  networkRisk,
  modelMetrics,
}) => {
  const [isCompact, setIsCompact] = useState<boolean>(false);

  const activeCount = trains.length || 28;
  const onTimeCount = trains.filter((t) => t.predictedDelayMinutes === 0).length;
  const onTimePct = Math.round((onTimeCount / Math.max(activeCount, 1)) * 100);
  const delayedCount = trains.filter((t) => t.predictedDelayMinutes > 0 && t.predictedDelayMinutes < 8).length;
  const criticalCount = trains.filter(
    (t) => t.predictedDelayMinutes >= 8 || t.signalRestrictionActive
  ).length + conflictsCount;

  const cumulativeDelayMinutes = trains.reduce((acc, t) => acc + t.predictedDelayMinutes, 0) || 22.3;
  const avgError = modelMetrics ? modelMetrics.mlMae : 4.8;

  const kpis = [
    {
      id: 'active-trains',
      label: 'Active Trains',
      value: activeCount.toString(),
      subtext: '+4 vs last hr',
      isIncrease: true,
      positiveTrend: true,
      icon: TrainIcon,
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-50',
    },
    {
      id: 'on-time',
      label: 'On Time',
      value: `${onTimePct}%`,
      subtext: '+6% vs last hr',
      isIncrease: true,
      positiveTrend: true,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-50',
    },
    {
      id: 'delayed-trains',
      label: 'Delayed',
      value: delayedCount.toString(),
      subtext: '-2 vs last hr',
      isIncrease: false,
      positiveTrend: true,
      icon: Clock,
      iconColor: 'text-amber-600',
      badgeBg: 'bg-amber-50',
    },
    {
      id: 'critical-issues',
      label: 'Critical Issues',
      value: criticalCount.toString(),
      subtext: '+1 vs last hr',
      isIncrease: true,
      positiveTrend: false,
      icon: AlertTriangle,
      iconColor: 'text-rose-600',
      badgeBg: 'bg-rose-50',
      isHazard: criticalCount > 0,
    },
    {
      id: 'avg-eta-error',
      label: 'Avg ETA Error',
      value: `${avgError.toFixed(1)}m`,
      subtext: '-1.2m vs last wk',
      isIncrease: false,
      positiveTrend: true,
      icon: BarChart3,
      iconColor: 'text-indigo-600',
      badgeBg: 'bg-indigo-50',
    },
    {
      id: 'network-delay',
      label: 'Network Delay',
      value: `${typeof cumulativeDelayMinutes === 'number' ? cumulativeDelayMinutes.toFixed(1) : cumulativeDelayMinutes}m`,
      subtext: '-3.4m vs last hr',
      isIncrease: false,
      positiveTrend: true,
      icon: Network,
      iconColor: 'text-sky-600',
      badgeBg: 'bg-sky-50',
    },
  ];

  if (isCompact) {
    return (
      <div className="px-4 lg:px-6 pt-2 pb-1">
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center flex-wrap gap-4 lg:gap-6 text-xs divide-x divide-slate-100">
            {kpis.map((kpi) => (
              <div key={kpi.id} className="flex items-center gap-2 pl-3 first:pl-0">
                <span className="text-slate-500 font-medium text-[11px]">{kpi.label}:</span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">{kpi.value}</span>
                <span className={`text-[10px] font-semibold ${kpi.positiveTrend ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {kpi.subtext}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsCompact(false)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition"
          >
            <span>Expand Cards</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 pt-3 pb-1">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          Corridor Live Performance KPIs
        </span>
        <button
          type="button"
          onClick={() => setIsCompact(true)}
          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition"
        >
          <span>Compact Ribbon</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              className={`bg-white border ${
                kpi.isHazard ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200'
              } rounded-xl p-3 flex items-start justify-between shadow-2xs hover:shadow-xs transition`}
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  {kpi.label}
                </span>
                <div className="text-xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {kpi.value}
                </div>
                <div className="flex items-center gap-0.5 text-[10px] font-medium">
                  {kpi.isIncrease ? (
                    <ArrowUp className={`w-3 h-3 ${kpi.positiveTrend ? 'text-emerald-600' : 'text-rose-600'}`} />
                  ) : (
                    <ArrowDown className={`w-3 h-3 ${kpi.positiveTrend ? 'text-emerald-600' : 'text-rose-600'}`} />
                  )}
                  <span className={kpi.positiveTrend ? 'text-emerald-600' : 'text-rose-600'}>
                    {kpi.subtext}
                  </span>
                </div>
              </div>

              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${kpi.badgeBg} ${kpi.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
