/**
 * TrackVision SIH Demo Orchestrator (Section 39)
 * 1-Click Automated Presentation Sequence for SIH 2026 Problem 26028
 *
 * Steps:
 * 1. Reset scenario to nominal baseline
 * 2. Start simulation clock
 * 3. Focus corridor: Delhi -> Prayagraj
 * 4. Select train 12951 (Rajdhani)
 * 5. Train moves through Bharthana section
 * 6. Inject signal restriction on ETW-CNB block
 * 7. Live ETA changes (+8 min delay)
 * 8. AI explanation & attribution appears
 * 9. Delay propagation triggers downstream
 * 10. Platform 3 conflict at Kanpur Central detected
 * 11. Passenger connection risk at Prayagraj escalates
 * 12. Open What-If Intervention Simulator
 * 13. Simulate platform reassignment (PF 3 -> PF 5)
 * 14. Display BEFORE vs AFTER outcome (12 min saved!)
 */

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Train,
  X,
  Zap,
} from 'lucide-react';
import { AppTab, OperationsSubTab } from '../types/railway.ts';

interface SihDemoOrchestratorProps {
  isActive: boolean;
  onClose: () => void;
  onTabChange: (tab: AppTab) => void;
  onOpenOperations: (subTab: OperationsSubTab) => void;
  onOpenPassenger: () => void;
  onSelectTrain: (trainNumber: string) => void;
  onReset: () => Promise<void>;
  onStartSimulation: () => Promise<void>;
  onInjectSignalFailure: () => Promise<void>;
  onOpenWhatIf: () => void;
  onRunIntervention: () => Promise<void>;
}

interface StepDef {
  number: number;
  title: string;
  description: string;
  durationMs: number;
}

const DEMO_STEPS: StepDef[] = [
  {
    number: 1,
    title: 'Reset Scenario',
    description: 'Purging transient states and initializing clean 530km Delhi–Prayagraj baseline.',
    durationMs: 2500,
  },
  {
    number: 2,
    title: 'Start Corridor Simulation',
    description: 'Starting multi-train dispatch clock across all 7 corridor junction zones.',
    durationMs: 2500,
  },
  {
    number: 3,
    title: 'Focus Corridor View',
    description: 'Switching to Operations Control Room and centering the Delhi–Prayagraj track.',
    durationMs: 2500,
  },
  {
    number: 4,
    title: 'Select Train 12951 (Rajdhani)',
    description: 'Locking telemetry camera onto flagship Mumbai/Prayagraj Rajdhani Express.',
    durationMs: 2500,
  },
  {
    number: 5,
    title: 'Real-Time Train Movement',
    description: 'Monitoring live speed (118 km/h) and scheduled progress approaching Etawah.',
    durationMs: 2500,
  },
  {
    number: 6,
    title: 'Inject Signal Restriction',
    description: 'Injecting automatic block signal restriction on Bharthana–Phaphund section.',
    durationMs: 3000,
  },
  {
    number: 7,
    title: 'Dynamic ETA Recalibration',
    description: 'ML model dynamically predicts +8 to +15 min delay at Kanpur Central & Prayagraj.',
    durationMs: 3000,
  },
  {
    number: 8,
    title: 'AI Factor Attribution',
    description: 'AI explains: Signal restriction (+5m) + Section congestion (+3m) - Slack (-1m).',
    durationMs: 3000,
  },
  {
    number: 9,
    title: 'Downstream Propagation',
    description: 'Tracking secondary delays rippling into following trains (TV-DEMO-002, TV-DEMO-003).',
    durationMs: 3000,
  },
  {
    number: 10,
    title: 'Platform Conflict Detected',
    description: 'CRITICAL ALERT: Kanpur Central Platform 3 occupancy overlaps with TV-DEMO-002!',
    durationMs: 3500,
  },
  {
    number: 11,
    title: 'Passenger Connection Risk',
    description: 'Interchange transfer window at Prayagraj shrinks from 20m to 5m (HIGH RISK).',
    durationMs: 3000,
  },
  {
    number: 12,
    title: 'Launch What-If Simulator',
    description: 'Opening decision-support sandbox to test section controller intervention.',
    durationMs: 2500,
  },
  {
    number: 13,
    title: 'Simulate Platform Reassignment',
    description: 'Executing intervention: Reassign TV-DEMO-002 to vacant Platform 5 at Kanpur.',
    durationMs: 3500,
  },
  {
    number: 14,
    title: 'Simulated Before vs After',
    description: 'Evaluation complete: 12 minutes network delay avoided, 0 conflicts, 2 trains saved!',
    durationMs: 4000,
  },
];

export const SihDemoOrchestrator: React.FC<SihDemoOrchestratorProps> = ({
  isActive,
  onClose,
  onTabChange,
  onOpenOperations,
  onOpenPassenger,
  onSelectTrain,
  onReset,
  onStartSimulation,
  onInjectSignalFailure,
  onOpenWhatIf,
  onRunIntervention,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Execute actions as step index updates
  useEffect(() => {
    if (!isActive) return;

    const stepNum = currentStepIndex + 1;

    const runStep = async () => {
      if (stepNum === 1) {
        await onReset();
      } else if (stepNum === 2) {
        await onStartSimulation();
      } else if (stepNum === 3) {
        onTabChange('command-center');
      } else if (stepNum === 4) {
        onSelectTrain('12951');
      } else if (stepNum === 6) {
        await onInjectSignalFailure();
      } else if (stepNum === 8) {
        onTabChange('ai-insights');
      } else if (stepNum === 9) {
        onOpenOperations('network');
      } else if (stepNum === 10) {
        onTabChange('command-center');
      } else if (stepNum === 11) {
        onOpenPassenger();
      } else if (stepNum === 12) {
        onTabChange('simulation');
        onOpenWhatIf();
      } else if (stepNum === 13) {
        await onRunIntervention();
      }
    };

    runStep();
  }, [currentStepIndex, isActive]);

  // Auto-advance timer
  useEffect(() => {
    if (!isActive || isPaused) return;

    if (currentStepIndex < DEMO_STEPS.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, DEMO_STEPS[currentStepIndex].durationMs);

      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, isActive, isPaused]);

  if (!isActive) return null;

  const currentStep = DEMO_STEPS[currentStepIndex];
  const progressPct = ((currentStepIndex + 1) / DEMO_STEPS.length) * 100;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4 pointer-events-auto animate-fade-in">
      <div className="bg-[#0D2138] border-2 border-amber-400 rounded-xl shadow-2xl p-4 text-slate-100 flex flex-col gap-3">
        {/* Top bar with progress & close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="font-mono font-bold text-xs uppercase tracking-wider text-amber-300">
              SIH 2026 LIVE DEMO ORCHESTRATOR
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-semibold">
              STEP {currentStep.number} OF {DEMO_STEPS.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 transition"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
            </button>

            {currentStepIndex < DEMO_STEPS.length - 1 && (
              <button
                onClick={() => setCurrentStepIndex((p) => p + 1)}
                className="p-1 px-2 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold flex items-center gap-1 transition"
              >
                <span>NEXT</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Step details */}
        <div className="flex items-start justify-between gap-3 bg-[#071525] p-3 rounded-lg border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-sm text-slate-100">
                {currentStep.number}. {currentStep.title}
              </span>
              {currentStep.number === 14 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  DEMO COMPLETE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          <div className="shrink-0 pt-0.5">
            {currentStep.number === 14 ? (
              <button
                onClick={() => setCurrentStepIndex(0)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded flex items-center gap-1 shadow transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>REPLAY</span>
              </button>
            ) : (
              <span className="text-amber-400 font-mono text-xs font-bold animate-pulse">
                RUNNING...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
