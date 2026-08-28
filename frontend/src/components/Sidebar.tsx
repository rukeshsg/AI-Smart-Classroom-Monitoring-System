'use client';

import React, { useState, useEffect } from 'react';
import {
  Video,
  Grid,
  AlertTriangle,
  BarChart3,
  Calendar,
  Layers,
  Sliders,
  History,
  Image,
  Camera,
  FileText,
  Settings,
  CheckCircle2,
  Disc,
  Shield,
  Film,
} from 'lucide-react';

export type NavTab =
  | 'live'
  | 'multi-camera'
  | 'alerts'
  | 'analytics'
  | 'daily-summary'
  | 'session-summary'
  | 'timeline'
  | 'history'
  | 'evidence'
  | 'recordings'
  | 'camera-status'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  activeAlertsCount: number;
  isRecording: boolean;
  onToggleRecording: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeAlertsCount,
  isRecording,
  onToggleRecording,
}) => {
  // Live uptime clock — client-side only to avoid hydration mismatch
  const [uptimeLabel, setUptimeLabel] = useState<string>('');
  const startRef = React.useRef<number>(Date.now());

  useEffect(() => {
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      if (h > 0) setUptimeLabel(`${h}h ${m}m ${s}s`);
      else if (m > 0) setUptimeLabel(`${m}m ${s}s`);
      else setUptimeLabel(`${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'live' as NavTab, label: 'Live Surveillance', icon: Video },
    { id: 'multi-camera' as NavTab, label: 'Multi-Camera', icon: Grid },
    {
      id: 'alerts' as NavTab,
      label: 'Active Alerts',
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
    },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'daily-summary' as NavTab, label: 'Daily Summary', icon: Calendar },
    { id: 'session-summary' as NavTab, label: 'Session Summary', icon: Layers },
    { id: 'timeline' as NavTab, label: 'Event Timeline', icon: Sliders },
    { id: 'history' as NavTab, label: 'Detection History', icon: History },
    { id: 'evidence' as NavTab, label: 'Evidence Gallery', icon: Image },
    { id: 'recordings' as NavTab, label: 'Recordings', icon: Film },
    { id: 'camera-status' as NavTab, label: 'Camera Status', icon: Camera },
    { id: 'reports' as NavTab, label: 'Reports', icon: FileText },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#080d1a] border-r border-slate-800/80 flex flex-col justify-between select-none py-4 px-3 sticky top-0 h-screen flex-shrink-0 z-40 overflow-y-auto">
      {/* Top Section */}
      <div className="space-y-4">
        {/* Brand */}
        <div className="flex items-center space-x-3 px-2 py-1.5 border-b border-slate-800/60 pb-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 shadow-md flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wider text-slate-100 uppercase font-sans">
              COMMAND CENTER
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              Smart Classroom Monitoring
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono shadow-sm min-w-[20px] text-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-3 pt-3 border-t border-slate-800/80">
        {/* System Status */}
        <div className="bg-[#11182c] border border-slate-800/90 p-3 rounded-xl flex items-center space-x-3 shadow-md">
          <div className="p-1.5 bg-emerald-500/20 rounded-full text-emerald-400 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-left text-xs min-w-0">
            <p className="font-bold text-slate-200">System Status</p>
            <p className="text-[11px] text-emerald-400 font-semibold">All Systems Operational</p>
          </div>
        </div>

        {/* Recording Button */}
        <button
          onClick={onToggleRecording}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2.5 shadow-xl transition-all ${
            isRecording
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white shadow-indigo-600/30'
          }`}
        >
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${isRecording ? 'bg-white' : 'bg-white/20'}`}>
            <Disc className={`w-3.5 h-3.5 ${isRecording ? 'text-rose-600 fill-rose-600' : 'text-white'}`} />
          </div>
          <span className="tracking-wide">
            {isRecording ? '⏹ Stop Recording' : '⏺ Start Recording'}
          </span>
        </button>

        {/* Live Session Uptime */}
        <div className="text-center text-[11px] text-slate-500 font-mono pt-1">
          {uptimeLabel ? (
            <span>Session <strong className="text-slate-300">{uptimeLabel}</strong></span>
          ) : (
            <span className="opacity-0">—</span>
          )}
        </div>
      </div>
    </aside>
  );
};
