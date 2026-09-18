/**
 * TrackVision Header & Live Status Ticker
 * Clean, modern light command-centre design matching Reference Image:
 * - Official emblem & TRACKVISION AI Railway Intelligence branding
 * - Delhi -> Prayagraj Corridor header with Predict. Explain. Prevent. Decide.
 * - Live Demo indicator, ticking clock, notification badge, and admin profile
 * - Pill-style navigation tabs bar (Control Room, Stations, Trains, Network, Simulation, What-If, Analytics, Passenger)
 * - Live Train Feed ticker with red badge and train status pills
 */

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BrainCircuit,
  CheckCircle2,
  Compass,
  Gauge,
  HelpCircle,
  Layers,
  Network,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Sliders,
  Sparkles,
  Train as TrainIcon,
  User,
  Zap,
} from 'lucide-react';
import { AppTab, AuthUser, OperationsSubTab, SimulationState, Train, UserRole } from '../types/railway.ts';

interface HeaderProps {
  trains: Train[];
  simulationState: SimulationState;
  activeRole: UserRole;
  currentUser: AuthUser;
  activeTab: AppTab;
  isConnected: boolean;
  alertsCount: number;
  conflictsCount: number;
  onTabChange: (tab: AppTab) => void;
  onOpenOperations: (subTab: OperationsSubTab) => void;
  onOpenPassenger: () => void;
  onOpenAuth: () => void;
  onToggleSimulation: () => void;
  onSpeedChange: (speed: 1 | 2 | 5) => void;
  onResetDemo: () => void;
  onOpenDemoController: () => void;
  onStartSihDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  trains,
  simulationState,
  activeRole,
  currentUser,
  activeTab,
  isConnected,
  alertsCount,
  conflictsCount,
  onTabChange,
  onOpenOperations,
  onOpenPassenger,
  onOpenAuth,
  onToggleSimulation,
  onSpeedChange,
  onResetDemo,
  onOpenDemoController,
  onStartSihDemo,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('Mon, 13 Jan 2025  11:59:24');
  const [showTicker, setShowTicker] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayName = days[now.getDay()];
      const dayNum = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      const timeStr = now.toLocaleTimeString('en-IN', { hour12: false });
      setCurrentTime(`${dayName}, ${dayNum} ${monthName} ${year}  ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs select-none">
      {/* 1. TOP BRANDING & STATUS BAR */}
      <div className="px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white">
        {/* Left: Indian Railways Red Emblem & TRACKVISION */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#8B1E2D] border-2 border-red-800 shadow-sm flex items-center justify-center text-white shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-label="Railway Emblem">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 15.5C7 16.3 7.7 17 8.5 17H9v1.5C9 19.3 9.7 20 10.5 20s1.5-.7 1.5-1.5V17h4v1.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V17h.5c.8 0 1.5-.7 1.5-1.5V6c0-2.2-1.8-4-4-4H10C7.8 2 6 3.8 6 6v9.5zM8 6c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v4H8V6zm2.5 9c-.8 0-1.5-.7-1.5-1.5S9.7 12 10.5 12s1.5.7 1.5 1.5S11.3 15 10.5 15zm5 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-slate-900 font-mono">
                TRACK<span className="text-blue-600">VISION</span>
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
              AI RAILWAY INTELLIGENCE
            </p>
          </div>

          <div className="hidden md:block h-7 w-[1px] bg-slate-200 mx-2" />

          {/* Target Corridor Title */}
          <div className="hidden sm:block">
            <h1 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              <span>Delhi → Prayagraj Corridor</span>
              <span className="text-[10px] font-normal text-slate-400 font-mono">(542 km)</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Predict. Explain. Prevent. Decide.
            </p>
          </div>
        </div>

        {/* Right: Live Demo Pill, Ticking Clock, Notifications & Profile */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Quick SIH Demo Launcher Button */}
          <button
            onClick={onStartSihDemo}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition"
            title="Start Automated SIH Presentation Walkthrough"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>START DEMO</span>
          </button>

          {/* Quick Play/Pause Control */}
          <div className="hidden xl:flex items-center bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 gap-1 text-xs">
            <button
              onClick={onToggleSimulation}
              className="px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 text-slate-700 hover:bg-white transition"
              title={simulationState.isRunning ? 'Pause' : 'Play'}
            >
              {simulationState.isRunning ? (
                <Pause className="w-3 h-3 text-amber-600" />
              ) : (
                <Play className="w-3 h-3 text-emerald-600 fill-current" />
              )}
              <span>{simulationState.isRunning ? 'PAUSE' : 'PLAY'}</span>
            </button>
            <div className="h-3.5 w-[1px] bg-slate-300" />
            <div className="flex items-center gap-0.5">
              {([1, 2, 5] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => onSpeedChange(spd)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    simulationState.speed === spd
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
            <div className="h-3.5 w-[1px] bg-slate-300" />
            <button
              onClick={onResetDemo}
              title="Reset Corridor"
              className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* LIVE DEMO Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE DEMO</span>
          </div>

          {/* Date & Time */}
          <div className="hidden md:block text-xs font-mono text-slate-600 font-medium">
            {currentTime}
          </div>

          {/* Passenger View Utility Button (opens as a modal, not a top-level page) */}
          <button
            onClick={onOpenPassenger}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition text-xs font-semibold"
            title="Open Passenger View"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Passenger View</span>
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => onTabChange('alerts')}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Operational Alerts"
          >
            <Bell className="w-4 h-4" />
            {alertsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                {alertsCount}
              </span>
            )}
          </button>

          {/* User Profile / Admin Card */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition text-left"
            title="Switch User Role / View Identity"
          >
            <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              A
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="text-xs font-bold text-slate-900 block">
                {currentUser.name ? currentUser.name.split(' ')[0] : 'Admin'}
              </span>
              <span className="text-[10px] text-slate-500 block font-medium">
                Control Room
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION TABS BAR — exactly four primary destinations, never more */}
      <div className="px-4 lg:px-6 py-1.5 flex items-center gap-1.5 overflow-x-auto bg-white border-b border-slate-200 scrollbar-none text-xs">
        {[
          { id: 'command-center', label: 'Command Center', icon: Gauge },
          { id: 'operations', label: 'Operations', icon: Layers, count: trains.length },
          { id: 'ai-insights', label: 'AI Insights', icon: BrainCircuit, highlight: conflictsCount > 0 },
          { id: 'simulation', label: 'Simulation', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          // The active nav item gets a subtle blue underline/background; everything else stays plain.
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as AppTab)}
              className={`px-3.5 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 whitespace-nowrap transition border-b-2 ${
                isActive
                  ? 'text-blue-700 bg-blue-50/70 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
              <span>{tab.label}</span>

              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}

              {tab.highlight && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. LIVE TRAIN FEED TICKER (COLLAPSIBLE FOR SCREEN NEATNESS) */}
      {showTicker ? (
        <div className="px-4 lg:px-6 py-1.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-3 text-xs overflow-hidden">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-0.5 min-w-0">
            {/* Crimson Live Train Feed Pill */}
            <button
              type="button"
              onClick={() => onOpenOperations('trains')}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8B1E2D] hover:bg-[#721824] text-white font-bold text-[10px] shrink-0 shadow-2xs transition cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>Live Train Feed</span>
            </button>

            {/* Train Feed Chips */}
            <div className="flex items-center gap-3 text-xs font-mono whitespace-nowrap">
              {trains.slice(0, 8).map((t) => {
                const isDelayed = t.predictedDelayMinutes > 0;
                const isCritical = t.predictedDelayMinutes >= 8;

                return (
                  <div
                    key={t.id}
                    onClick={() => onTabChange('command-center')}
                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition"
                  >
                    <TrainIcon className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-slate-800">{t.number}</span>
                    <span className="text-slate-600 font-sans text-[11px]">{t.name.split(' ')[0]}</span>
                    {isDelayed ? (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isCritical
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        +{t.predictedDelayMinutes}m
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        ON TIME
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenOperations('trains')}
              className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTicker(false)}
              className="text-[11px] text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded hover:bg-slate-200/60 transition cursor-pointer"
              title="Hide live ticker to save space"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 lg:px-6 py-0.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-end text-[10px]">
          <button
            type="button"
            onClick={() => setShowTicker(true)}
            className="text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1 py-0.5 cursor-pointer"
          >
            <span>Show Live Train Ticker</span>
            <span>+</span>
          </button>
        </div>
      )}
    </header>
  );
};
