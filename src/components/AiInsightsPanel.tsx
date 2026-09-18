/**
 * TrackVision AI Operational Insights Panel
 * Clean light command-centre card matching Reference Image:
 * - AI Operational Insights title + "View All" link
 * - 12951 ETA Update with timestamp
 * - Primary cause attribution with hazard badge
 * - Network impact & Connection risk with High severity pill
 * - "View Details ->" button
 */

import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Info,
  Network,
  ShieldAlert,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { PlatformConflict, Train } from '../types/railway.ts';

interface AiInsightsPanelProps {
  selectedTrain: Train | null;
  conflicts: PlatformConflict[];
  onTriggerWhatIf: () => void;
  onViewDetails?: () => void;
}

export const AiInsightsPanel: React.FC<AiInsightsPanelProps> = ({
  selectedTrain,
  conflicts,
  onTriggerWhatIf,
  onViewDetails,
}) => {
  const trainNumber = selectedTrain?.number || '12951';
  const delayMinutes = selectedTrain ? selectedTrain.predictedDelayMinutes : 8;
  const etaTime = selectedTrain ? selectedTrain.predictedFinalEta : '18:42';
  const hasConflict = conflicts.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold text-slate-900 tracking-tight">
            AI Operational Insights
          </h2>
        </div>
        <button
          onClick={onViewDetails}
          className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
        >
          View All
        </button>
      </div>

      {/* Main Insight Card matching reference image */}
      <div className="space-y-2.5">
        {/* Title item */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 font-mono">
            {trainNumber} ETA Update
          </span>
          <span className="text-[10px] text-slate-400">2 min ago</span>
        </div>

        {/* Prediction Statement */}
        <p className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-slate-900 font-mono">{trainNumber}</strong> is predicted to reach Prayagraj at{' '}
          <strong className="text-slate-900 font-mono">{etaTime}</strong>{' '}
          <span className="text-rose-600 font-bold font-mono">
            ({delayMinutes > 0 ? `+${delayMinutes} min delay` : 'on time'})
          </span>.
        </p>

        {/* Primary Cause */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Primary Cause
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-800">
            <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold shrink-0">
              ⚡
            </span>
            <span className="font-medium">
              Signal restriction between Etawah → Kanpur
            </span>
            <span className="text-rose-600 font-mono font-bold text-[11px] shrink-0">
              +5 min
            </span>
          </div>
        </div>

        {/* Network Impact & Connection Risk */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Network Impact
          </span>

          <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg text-xs">
            <div className="flex items-center gap-2 text-slate-700 min-w-0">
              <Network className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">2 trains affected • 1 platform conflict at Kanpur</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 shrink-0">
              High
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg text-xs">
            <div className="flex items-center gap-2 text-slate-700 min-w-0">
              <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">Connection Risk • 3 passenger connections at risk</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={onViewDetails}
          className="w-full mt-2 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-blue-600 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
