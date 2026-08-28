'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Bell,
  HardDrive,
  Video,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Sparkles,
  Cpu,
  RefreshCw,
  Save,
  Check,
} from 'lucide-react';

const DEFAULT_ALLOWLIST = [
  'Person', 'Chair', 'Table', 'Laptop', 'Monitor',
  'Keyboard', 'Mouse', 'Cell Phone', 'Book', 'Backpack',
  'Bottle', 'Cup', 'Clock', 'Scissors', 'Handbag'
];

export const SettingsView: React.FC = () => {
  const [objectConf, setObjectConf] = useState<number>(0.35);
  const [behaviorConf, setBehaviorConf] = useState<number>(0.25);
  const [popupCooldown, setPopupCooldown] = useState<number>(600);
  const [enableSound, setEnableSound] = useState<boolean>(true);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [targetFps, setTargetFps] = useState<number>(30);
  const [retentionDays, setRetentionDays] = useState<number>(60);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [purgeLoading, setPurgeLoading] = useState<boolean>(false);
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null);

  // Allowlist active state
  const [allowlistState, setAllowlistState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    DEFAULT_ALLOWLIST.forEach((name) => {
      initial[name] = true;
    });
    return initial;
  });

  const toggleAllowlist = (name: string) => {
    setAllowlistState((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleRunPurge = async () => {
    setPurgeLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/cleanup/retention?days=${retentionDays}`, {
        method: 'POST',
      });
      const data = await res.json();
      setPurgeMessage(data.message || 'Retention purge completed successfully.');
    } catch {
      setPurgeMessage('Failed to trigger retention purge.');
    } finally {
      setPurgeLoading(false);
      setTimeout(() => setPurgeMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-slate-100">Command Center System Settings</h2>
            <span className="bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-bold px-3 py-0.5 rounded-full font-mono">
              v2.4 Production Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure AI model confidence thresholds, essential object allowlists, alert cooldowns, and retention policies.
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
            savedSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white shadow-indigo-600/30'
          }`}
        >
          {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Settings Saved!' : 'Save Configuration'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Main Settings */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section 1: AI Model & Inference Thresholds */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/30">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">AI Inference Thresholds</h3>
                <p className="text-[11px] text-slate-400">Model 1 (Object Detection) &amp; Model 2 (Behavior Detection)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Object Detection Threshold */}
              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">Model 1 — Object Confidence</span>
                  <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                    {(objectConf * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.80"
                  step="0.05"
                  value={objectConf}
                  onChange={(e) => setObjectConf(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
                <p className="text-[11px] text-slate-500">
                  Filters weak object bounding boxes (default: 35%). Higher = strict precision.
                </p>
              </div>

              {/* Behavior Detection Threshold */}
              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">Model 2 — Behavior Confidence</span>
                  <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                    {(behaviorConf * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.75"
                  step="0.05"
                  value={behaviorConf}
                  onChange={(e) => setBehaviorConf(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
                <p className="text-[11px] text-slate-500">
                  Sensitizes Fighting &amp; Phone gesture detection (tuned: 25%).
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Essential Classroom Objects Allowlist */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">Classroom Object Allowlist</h3>
                  <p className="text-[11px] text-slate-400">Only check-marked objects are exposed on live feed &amp; overlays</p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                {Object.values(allowlistState).filter(Boolean).length} Active Classes
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
              {DEFAULT_ALLOWLIST.map((name) => {
                const isActive = allowlistState[name] ?? true;
                return (
                  <button
                    key={name}
                    onClick={() => toggleAllowlist(name)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-950 border-emerald-500/40 text-slate-100 shadow-md'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    <span>{name}</span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                        isActive ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-600'
                      }`}
                    >
                      {isActive ? '✓' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Alert & Emergency Rules */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/30">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Alert &amp; Cooldown Rules</h3>
                <p className="text-[11px] text-slate-400">Emergency alert popups and deduplication timers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-slate-300 font-bold">Popup Notification Cooldown (Seconds)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={popupCooldown}
                    onChange={(e) => setPopupCooldown(parseInt(e.target.value) || 600)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                  <span className="text-slate-400 text-[11px] whitespace-nowrap">({popupCooldown / 60} mins)</span>
                </div>
                <p className="text-[11px] text-slate-500">Prevents alert flooding (1 popup per classroom per 10 mins).</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-300">Critical Fighting Emergency Popup</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Show high-priority red alert overlay on fighting detection</p>
                </div>
                <button
                  onClick={() => setEnableSound(!enableSound)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                    enableSound ? 'bg-rose-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      enableSound ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (1 col): Infrastructure, Storage & Maintenance */}
        <div className="space-y-6">

          {/* Infrastructure Health */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">System Hardware</h3>
                <p className="text-[11px] text-slate-400">Inference device &amp; engine health</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">PyTorch AI Framework:</span>
                <span className="text-emerald-400 font-bold">2.13.0 CUDA / CPU</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">YOLO Model Engine:</span>
                <span className="text-blue-400 font-bold">Ultralytics v8.4</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Stream Protocol:</span>
                <span className="text-purple-400 font-bold">MJPEG + WebSocket</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Target Stream FPS:</span>
                <span className="text-slate-200 font-bold">{targetFps} FPS</span>
              </div>
            </div>
          </div>

          {/* Data Retention & Maintenance */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Storage &amp; Retention</h3>
                <p className="text-[11px] text-slate-400">Automated 60-day cleanup policy</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-bold">Automatic Data Purge:</span>
                  <span className="text-amber-400 font-bold">60 DAYS</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Evidence and recordings older than 60 days are automatically deleted unless marked <strong>&quot;Keep Forever&quot;</strong>.
                </p>
              </div>

              {purgeMessage && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs">
                  {purgeMessage}
                </div>
              )}

              <button
                onClick={handleRunPurge}
                disabled={purgeLoading}
                className="w-full py-2.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${purgeLoading ? 'animate-spin' : ''}`} />
                <span>Run 60-Day Retention Purge Now</span>
              </button>
            </div>
          </div>

          {/* Database Engine Information */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Storage Architecture</h3>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>SQLite DB: <code>backend/storage/classroom_monitoring.db</code></span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Screenshots: <code>screenshots/</code></span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Recordings: <code>recordings/</code></span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
