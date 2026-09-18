/**
 * TrackVision Authentication & Access Control Modal (Section 34)
 * Supports credential input, role switcher, and 1-click demo accounts.
 */

import React, { useState } from 'react';
import {
  Check,
  Compass,
  KeyRound,
  Lock,
  Mail,
  Shield,
  Train,
  User,
  X,
} from 'lucide-react';
import { AuthUser, UserRole } from '../types/railway.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onLogin: (user: AuthUser) => void;
}

export const DEMO_ACCOUNTS: AuthUser[] = [
  {
    id: 'usr-001',
    name: 'Rajesh Sharma',
    email: 'control@trackvision.demo',
    role: 'CONTROL_ROOM',
    designation: 'Senior Section Controller',
    sectionZone: 'NCR / Prayagraj Operations Command',
    badgeId: 'IR-NCR-8842',
  },
  {
    id: 'usr-002',
    name: 'Ananya Verma',
    email: 'passenger@trackvision.demo',
    role: 'PASSENGER',
    designation: 'Commuter / PNR Passenger',
    sectionZone: 'Northern & North-Central Corridor',
    badgeId: 'PAX-7739',
  },
  {
    id: 'usr-003',
    name: 'Col. K. S. Rathore',
    email: 'admin@trackvision.demo',
    role: 'ADMIN',
    designation: 'Chief Operations Manager',
    sectionZone: 'Railway Board Command HQ',
    badgeId: 'RB-HQ-010',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
}) => {
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState('••••••••');
  const [selectedDemoUser, setSelectedDemoUser] = useState<AuthUser>(currentUser);
  const [authSuccess, setAuthSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSelectDemo = (acc: AuthUser) => {
    setSelectedDemoUser(acc);
    setEmail(acc.email);
    setPassword('railway-secure-2026');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(selectedDemoUser);
    setAuthSuccess(true);
    setTimeout(() => {
      setAuthSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0D2138] border border-slate-700/80 rounded-xl max-w-md w-full shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Top Header with Indian Railway Maroon */}
        <div className="bg-[#8B1E2D] px-5 py-4 flex items-center justify-between border-b border-[#641522]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#641522] border border-red-400/40 flex items-center justify-center">
              <Train className="w-4 h-4 text-[#F4EBDD]" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-sm text-[#F7F8FA] uppercase tracking-wider">
                TRACKVISION AUTHENTICATION
              </h3>
              <p className="text-[11px] text-red-200 font-sans">
                Railway Intelligence Platform & Control System
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded bg-black/20 hover:bg-black/40 flex items-center justify-center text-red-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Session Pill */}
        <div className="px-5 pt-4 pb-2">
          <div className="p-3 bg-[#071525] border border-slate-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#8B1E2D] text-[#F4EBDD] font-bold font-mono flex items-center justify-center text-xs border border-red-600">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-100 block">{currentUser.name}</span>
                <span className="text-[11px] text-amber-300/90 font-mono">{currentUser.designation}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              ACTIVE
            </span>
          </div>
        </div>

        {/* Quick Demo Accounts Selection */}
        <div className="px-5 py-2">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-2 tracking-wider">
            1-CLICK DEMO ACCOUNTS (SIH JUDGES)
          </span>
          <div className="grid grid-cols-1 gap-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = selectedDemoUser.id === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#071525] border-amber-400 ring-1 ring-amber-400/50'
                      : 'bg-[#071525]/60 border-slate-800 hover:border-slate-700 hover:bg-[#071525]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {acc.role === 'CONTROL_ROOM' && <Shield className="w-4 h-4 text-rose-400" />}
                    {acc.role === 'PASSENGER' && <Compass className="w-4 h-4 text-cyan-400" />}
                    {acc.role === 'ADMIN' && <KeyRound className="w-4 h-4 text-amber-400" />}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200">{acc.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {acc.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block">{acc.email}</span>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3 pt-2">
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              Railway Email / ID
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#071525] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              Security Token / Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#071525] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2 bg-[#8B1E2D] hover:bg-[#641522] border border-red-600/70 text-[#F4EBDD] font-mono font-bold text-xs rounded-lg transition flex items-center justify-center gap-2 shadow"
            >
              {authSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>SESSION SWITCHED</span>
                </>
              ) : (
                <span>SWITCH TO {selectedDemoUser.role} SESSION</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
