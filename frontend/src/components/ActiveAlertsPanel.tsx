'use client';

import React from 'react';
import { Alert } from '@/types';
import { NavTab } from '@/components/Sidebar';
import { deleteAlert } from '@/lib/api';
import { AlertTriangle, ShieldAlert, Smartphone, CheckCircle, X, Video, Clock } from 'lucide-react';

interface ActiveAlertsPanelProps {
  alerts: Alert[];
  onDismissAlert: (id: string) => void;
  onSelectClassroom: (id: string) => void;
  onNavigateTab?: (tab: NavTab) => void;
}

export const ActiveAlertsPanel: React.FC<ActiveAlertsPanelProps> = ({
  alerts,
  onDismissAlert,
  onSelectClassroom,
  onNavigateTab,
}) => {
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteAlert(id);
    onDismissAlert(id);
  };

  const handleViewLive = (classroomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectClassroom(classroomId);
    onNavigateTab?.('live');
  };

  const fightingAlerts = alerts.filter((a) => a.alert_type === 'FIGHTING_ALERT');
  const phoneAlerts = alerts.filter((a) => a.alert_type === 'PHONE_USAGE_ALERT');
  const otherAlerts = alerts.filter(
    (a) => a.alert_type !== 'FIGHTING_ALERT' && a.alert_type !== 'PHONE_USAGE_ALERT'
  );
  const orderedAlerts = [...fightingAlerts, ...phoneAlerts, ...otherAlerts];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Active Monitoring Alerts</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time security and behavioral alerts from AI Model 1 &amp; Model 2
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {fightingAlerts.length > 0 && (
            <span className="text-xs font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-lg font-bold animate-pulse">
              🔴 {fightingAlerts.length} CRITICAL
            </span>
          )}
          <span className="text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg font-bold">
            TOTAL: {alerts.length}
          </span>
        </div>
      </div>

      {/* Empty State */}
      {alerts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
          <CheckCircle className="w-14 h-14 text-emerald-500/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-200">All Classrooms Clear</h3>
          <p className="text-sm text-slate-500 mt-1">No active or unresolved alerts detected.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orderedAlerts.map((alert) => {
            const isFighting = alert.alert_type === 'FIGHTING_ALERT';
            const isPhone = alert.alert_type === 'PHONE_USAGE_ALERT';

            return (
              <div
                key={alert.id}
                onClick={() => onSelectClassroom(alert.classroom_id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.005] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isFighting
                    ? 'bg-rose-950/60 border-rose-600/70 shadow-rose-950/40 hover:border-rose-500'
                    : isPhone
                    ? 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400'
                    : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div
                    className={`p-3 rounded-xl text-white flex-shrink-0 ${
                      isFighting
                        ? 'bg-rose-600 animate-pulse'
                        : isPhone
                        ? 'bg-amber-600'
                        : 'bg-slate-700'
                    }`}
                  >
                    {isFighting ? (
                      <ShieldAlert className="w-6 h-6" />
                    ) : isPhone ? (
                      <Smartphone className="w-6 h-6" />
                    ) : (
                      <AlertTriangle className="w-6 h-6" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-slate-100">{alert.title}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                          isFighting
                            ? 'bg-rose-500 text-white'
                            : isPhone
                            ? 'bg-amber-500/30 text-amber-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {alert.severity} SEVERITY
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono text-slate-400">
                      <span>
                        Classroom: <strong className="text-white">{alert.classroom_id}</strong>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{alert.time}</span>
                      </span>
                      <span>
                        Confidence:{' '}
                        <strong className="text-emerald-400">
                          {(alert.confidence * 100).toFixed(0)}%
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 self-end md:self-center flex-shrink-0">
                  {alert.image_path && (
                    <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
                      Evidence
                    </span>
                  )}
                  <button
                    onClick={(e) => handleViewLive(alert.classroom_id, e)}
                    className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-md"
                    title="View Live Surveillance Feed"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>View Live</span>
                  </button>
                  <button
                    onClick={(e) => handleDelete(alert.id, e)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                    title="Dismiss and delete alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
