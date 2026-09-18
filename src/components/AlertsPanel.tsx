/**
 * TrackVision Live Alerts Panel
 * Clean light command-centre card matching Reference Image:
 * - Live Alerts (5) header + "View All" link
 * - Alert items with severity pills (High, Medium), timestamps, and "View" action button
 */

import React from 'react';
import { Alert } from '../types/railway.ts';

interface AlertsPanelProps {
  alerts: Alert[];
  onAcknowledgeAlert: (alertId: string) => void;
  onOpenWhatIf?: () => void;
  onViewAlert?: (alert: Alert) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onAcknowledgeAlert,
  onOpenWhatIf,
  onViewAlert,
}) => {
  // Default alerts matching reference image if none
  const displayAlerts: Alert[] = alerts.length > 0 ? alerts : [
    {
      id: 'alt-1',
      title: 'Platform conflict predicted',
      message: 'Kanpur Central - Platform 3 • 12951 vs 22550',
      severity: 'CRITICAL',
      type: 'PLATFORM_CONFLICT',
      timestamp: '11:58',
      status: 'NEW',
      trainNumber: '12951',
    },
    {
      id: 'alt-2',
      title: 'High congestion',
      message: 'Etawah → Kanpur • Expected delay: +5 to 12 min',
      severity: 'WARNING',
      type: 'HIGH_CONGESTION',
      timestamp: '11:52',
      status: 'NEW',
    },
    {
      id: 'alt-3',
      title: 'Signal restriction active',
      message: 'Etawah → Kanpur • Speed limit: 50 km/h',
      severity: 'CRITICAL',
      type: 'SIGNAL_RESTRICTION',
      timestamp: '11:48',
      status: 'NEW',
      trainNumber: '12951',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h2 className="text-xs font-bold text-slate-900 tracking-tight">
          Live Alerts ({displayAlerts.length})
        </h2>
        <button
          onClick={onOpenWhatIf}
          className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
        >
          View All
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-2.5">
        {displayAlerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';

          return (
            <div
              key={alert.id}
              className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between gap-3 text-xs hover:bg-slate-100/80 transition"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="mt-0.5 shrink-0">
                  {isCritical ? (
                    <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 truncate">
                    {alert.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {alert.message}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {alert.timestamp || 'Just now'}
                  </div>
                </div>
              </div>

              {/* Severity badge & View action */}
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isCritical
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isCritical ? 'High' : 'Medium'}
                </span>

                <button
                  onClick={() => {
                    if (isCritical && onOpenWhatIf) {
                      onOpenWhatIf();
                    } else if (onViewAlert) {
                      onViewAlert(alert);
                    } else {
                      onAcknowledgeAlert(alert.id);
                    }
                  }}
                  className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded text-xs font-semibold shadow-2xs transition"
                >
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
