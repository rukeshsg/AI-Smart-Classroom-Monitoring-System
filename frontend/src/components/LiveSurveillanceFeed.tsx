'use client';

import React, { useState, useEffect } from 'react';
import { Classroom, Alert, Event, Evidence } from '@/types';
import { getVideoFeedUrl } from '@/lib/api';
import {
  Video,
  Users,
  AlertTriangle,
  Disc,
  Eye,
  Maximize2,
  Camera as CameraIcon,
  ShieldAlert,
  Smartphone,
  Moon,
  BookOpen,
  PenTool,
  ArrowRight,
  X,
  CheckCircle2,
  Bell,
  Clock,
  UserCheck,
} from 'lucide-react';

interface LiveSurveillanceFeedProps {
  classrooms: Classroom[];
  selectedClassroom: string;
  setSelectedClassroom: (id: string) => void;
  activeAlerts: Alert[];
  recentEvents: Event[];
  evidenceList: Evidence[];
  currentOccupancy: number;
  peakOccupancy: number;
  isRecording: boolean;
  onToggleRecording: () => void;
  onNavigateTab: (tab: any) => void;
  activeFightingState?: { is_active: boolean; classroom_id?: string; confidence?: number; time?: string };
}

export const LiveSurveillanceFeed: React.FC<LiveSurveillanceFeedProps> = ({
  classrooms,
  selectedClassroom,
  setSelectedClassroom,
  activeAlerts,
  recentEvents,
  evidenceList,
  currentOccupancy,
  peakOccupancy,
  isRecording,
  onToggleRecording,
  onNavigateTab,
  activeFightingState,
}) => {
  const [showOverlays, setShowOverlays] = useState(true);
  const [dismissedFightingAlert, setDismissedFightingAlert] = useState(false);
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [acknowledgedAt, setAcknowledgedAt] = useState<string | null>(null);
  const [acknowledgedBy] = useState('Operator');
  const [liveClock, setLiveClock] = useState<string>('');
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Live clock — client-side only (prevents hydration mismatch)
  useEffect(() => {
    const tick = () => setLiveClock(new Date().toLocaleTimeString('en-US'));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Reset acknowledgment when fighting state changes (new fight event)
  const fightKey = `${activeFightingState?.classroom_id}-${activeFightingState?.time}`;
  useEffect(() => {
    setAcknowledgedAt(null);
    setDismissedFightingAlert(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fightKey]);

  // Display Critical Fighting Banner ONLY when fighting is CURRENTLY ACTIVE for selected classroom
  const isFightingActive =
    activeFightingState?.is_active &&
    activeFightingState?.classroom_id === selectedClassroom &&
    !dismissedFightingAlert;

  const handleAcknowledge = () => {
    const now = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    setAcknowledgedAt(now);
    setShowAcknowledgeModal(false);
  };

  return (
    <div className="space-y-6">

      {/* ── Acknowledge Modal Overlay ── */}
      {showAcknowledgeModal && isFightingActive && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-[#0d1424] border-2 border-rose-600 rounded-2xl shadow-2xl shadow-rose-950/60 max-w-md w-full overflow-hidden">
            {/* Red top stripe */}
            <div className="bg-gradient-to-r from-rose-700 to-rose-500 px-6 py-4 flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <ShieldAlert className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="font-extrabold text-white text-base uppercase tracking-widest">CRITICAL ALERT</h2>
                <p className="text-rose-200 text-xs font-mono">Fighting Detected — Immediate Action Required</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Alert details */}
              <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Classroom</span>
                  <span className="font-bold text-white">{selectedClassroom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Detected At</span>
                  <span className="font-bold text-rose-300">{activeFightingState?.time || 'Now'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Confidence</span>
                  <span className="font-bold text-rose-300">{(((activeFightingState?.confidence || 0.85)) * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Priority</span>
                  <span className="font-bold text-rose-400 uppercase">🔴 HIGH</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                A fighting incident has been detected in <strong className="text-white">{selectedClassroom}</strong>.
                Please verify via the live feed and take immediate action.
                Acknowledging this alert confirms you have been notified and are responding.
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleAcknowledge}
                  className="flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-600/30"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Acknowledge</span>
                </button>
                <button
                  onClick={() => setShowAcknowledgeModal(false)}
                  className="flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>

              <button
                onClick={() => { setDismissedFightingAlert(true); setShowAcknowledgeModal(false); }}
                className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors pt-1 font-mono"
              >
                Snooze — hide this alert for now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Critical Fighting Banner ── */}
      {isFightingActive && (
        <div className={`border-2 border-rose-600 rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-rose-950/50 ${
          acknowledgedAt
            ? 'bg-rose-950/40 border-rose-700'
            : 'bg-rose-950/90 animate-pulse'
        }`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl shadow-lg ${
              acknowledgedAt ? 'bg-rose-900 text-rose-300' : 'bg-rose-600 text-white'
            }`}>
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide uppercase">
                {acknowledgedAt ? '✓ ACKNOWLEDGED: Fighting Detected' : '🚨 CRITICAL ALERT: FIGHTING DETECTED'}
              </h2>
              <div className="flex items-center space-x-3 text-xs font-mono mt-0.5">
                <span className="text-rose-200">
                  Classroom: <span className="font-bold text-white">{selectedClassroom}</span>
                </span>
                <span className="text-rose-400">|</span>
                <span className="text-rose-200">Time: {activeFightingState?.time || 'Now'}</span>
                <span className="text-rose-400">|</span>
                <span className="text-rose-200">Conf: {(((activeFightingState?.confidence || 0.85)) * 100).toFixed(0)}%</span>
                {acknowledgedAt && (
                  <><span className="text-rose-400">|</span>
                  <span className="text-emerald-300 font-semibold flex items-center space-x-1">
                    <UserCheck className="w-3 h-3" />
                    <span>Acknowledged {acknowledgedAt} by {acknowledgedBy}</span>
                  </span></>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {!acknowledgedAt ? (
              /* Not acknowledged yet — show Acknowledge + Snooze */
              <>
                <button
                  onClick={() => setShowAcknowledgeModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>ACKNOWLEDGE</span>
                </button>
                <button
                  onClick={() => setDismissedFightingAlert(true)}
                  className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-all"
                  title="Snooze — hide alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* Acknowledged — show clear confirmation + close option */
              <>
                <span className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ACKNOWLEDGED</span>
                </span>
                <button
                  onClick={() => setDismissedFightingAlert(true)}
                  className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-all"
                  title="Dismiss alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Control Bar & Classroom Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Classroom / Lab:
          </label>
          <select
            value={selectedClassroom}
            onChange={(e) => {
              setSelectedClassroom(e.target.value);
              setDismissedFightingAlert(false);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-100 text-sm font-bold rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {classrooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.id} - {room.name} ({room.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showOverlays
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>AI OVERLAYS</span>
          </button>

          <button
            onClick={onToggleRecording}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white'
            }`}
          >
            <Disc className="w-4 h-4" />
            <span>{isRecording ? 'RECORDING SESSION...' : 'START RECORDING'}</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3/4 Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Live Video Stream Frame */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 font-bold text-slate-200 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>LIVE SURVEILLANCE FEED</span>
              </div>
              <div className="flex items-center space-x-3 font-mono text-[11px] text-slate-400">
                <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-slate-300" suppressHydrationWarning>
                  {liveClock || '—'}
                </span>
                <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-emerald-400 font-bold">
                  FPS: 28
                </span>
              </div>
            </div>

            <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={getVideoFeedUrl(selectedClassroom)}
                alt={`Live Feed - ${selectedClassroom}`}
                className="w-full h-full object-contain"
              />

              <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-4 py-2.5 rounded-xl flex items-center space-x-4 text-xs font-mono text-white shadow-xl">
                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-blue-400" />
                  <span>Classroom: <strong>{selectedClassroom}</strong></span>
                </div>
                <span className="text-slate-700">|</span>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Occupancy: <strong>{currentOccupancy} / 40</strong></span>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                <button
                  onClick={() => {
                    const el = document.querySelector('img[alt*="Live Feed"]');
                    if (el) el.requestFullscreen();
                  }}
                  className="p-2 bg-slate-950/80 hover:bg-slate-900 text-white rounded-lg border border-slate-800 backdrop-blur-md"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => alert(`Captured snapshot for classroom ${selectedClassroom}`)}
                  className="p-2 bg-slate-950/80 hover:bg-slate-900 text-white rounded-lg border border-slate-800 backdrop-blur-md"
                >
                  <CameraIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom 3 Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Event Timeline */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">EVENT TIMELINE</h3>
                  <button onClick={() => onNavigateTab('timeline')} className="text-xs text-blue-400 hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {recentEvents.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono py-4 text-center">No recent events recorded.</p>
                  ) : (
                    recentEvents.slice(0, 5).map((evt) => {
                      const isFight = evt.event_type.toLowerCase() === 'fighting';
                      const isPhone = evt.event_type.toLowerCase() === 'using phone';
                      return (
                        <div key={evt.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 font-mono">
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full ${isFight ? 'bg-rose-500' : isPhone ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                            <span className="text-slate-400">{evt.time}</span>
                          </div>
                          <span className={`font-semibold ${isFight ? 'text-rose-400 font-bold' : isPhone ? 'text-amber-300' : 'text-slate-200'}`}>{evt.event_type}</span>
                          <span className="text-slate-500 font-bold">{evt.classroom_id}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <button onClick={() => onNavigateTab('timeline')} className="mt-4 text-xs font-bold text-blue-400 flex items-center space-x-1 hover:text-blue-300">
                <span>View Full Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 2: Evidence Gallery */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">EVIDENCE GALLERY</h3>
                  <button onClick={() => onNavigateTab('evidence')} className="text-xs text-blue-400 hover:underline">View All</button>
                </div>
                {evidenceList.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono py-4 text-center">No evidence captured yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {evidenceList.slice(0, 6).map((item) => (
                      <div key={item.id} onClick={() => onNavigateTab('evidence')} className="aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-800 cursor-pointer relative group">
                        <img src={`${apiBase}${item.image_path}`} alt={item.event_type} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 p-0.5 text-[9px] text-center font-mono text-slate-200 truncate">
                          {item.event_type}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => onNavigateTab('evidence')} className="mt-4 text-xs font-bold text-blue-400 flex items-center space-x-1 hover:text-blue-300">
                <span>View Full Gallery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Daily Summary */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">DAILY SUMMARY</h3>
                </div>
                <p className="text-xs text-slate-400 font-mono mb-3">Today {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Occupancy (Current):</span>
                    <span className="font-bold text-white">{currentOccupancy} / 40</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Phone Alerts:</span>
                    <span className="font-bold text-amber-400">{activeAlerts.filter(a => a.alert_type === 'PHONE_USAGE_ALERT').length}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Fighting Alerts:</span>
                    <span className="font-bold text-rose-400">{activeAlerts.filter(a => a.alert_type === 'FIGHTING_ALERT').length}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Total Events:</span>
                    <span className="font-bold text-blue-400">{recentEvents.length}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => onNavigateTab('daily-summary')} className="mt-4 text-xs font-bold text-blue-400 flex items-center space-x-1 hover:text-blue-300">
                <span>View Full Summary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 1/4 Panel */}
        <div className="space-y-6">
          {/* Active Alerts Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">ACTIVE ALERTS</h3>
              <button onClick={() => onNavigateTab('alerts')} className="text-xs text-blue-400 hover:underline">View All</button>
            </div>

            <div className="space-y-3">
              {activeAlerts.length === 0 ? (
                <p className="text-xs text-slate-500 font-mono py-2">No active alerts.</p>
              ) : (
                activeAlerts.slice(0, 4).map((alt) => {
                  const isFight = alt.alert_type === 'FIGHTING_ALERT';
                  return (
                    <div
                      key={alt.id}
                      className={`p-3 rounded-xl flex items-center space-x-3 border ${
                        isFight ? 'bg-rose-950/40 border-rose-600/50' : 'bg-amber-950/30 border-amber-500/40'
                      }`}
                    >
                      <div className={`p-2 rounded-lg text-white ${isFight ? 'bg-rose-600' : 'bg-amber-500 text-slate-950'}`}>
                        {isFight ? <ShieldAlert className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 text-xs">
                        <h4 className={`font-bold ${isFight ? 'text-rose-200' : 'text-amber-200'}`}>{alt.title}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">Classroom: {alt.classroom_id} | {alt.time}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Classroom Analytics Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">CLASSROOM ANALYTICS</h3>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-[10px] text-slate-500">Students</p>
                  <p className="font-bold text-white text-sm">{currentOccupancy}</p>
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-[10px] text-slate-500">Phone</p>
                  <p className="font-bold text-amber-400 text-sm">{recentEvents.filter(e => e.event_type.toLowerCase() === 'using phone').length}</p>
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <div>
                  <p className="text-[10px] text-slate-500">Fighting</p>
                  <p className="font-bold text-rose-400 text-sm">{recentEvents.filter(e => e.event_type.toLowerCase() === 'fighting').length}</p>
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-2">
                <Moon className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-[10px] text-slate-500">Sleeping</p>
                  <p className="font-bold text-purple-400 text-sm">{recentEvents.filter(e => e.event_type.toLowerCase() === 'sleeping').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Camera Status Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">CAMERA STATUS</h3>
              <button onClick={() => onNavigateTab('camera-status')} className="text-xs text-blue-400 hover:underline">View All</button>
            </div>
            <div className="space-y-2 text-xs font-mono">
              {classrooms.map((room) => {
                const isOnline = room.status === 'online';
                return (
                  <div key={room.id} className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <span className="font-bold text-slate-200">{room.id}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></span>
                      <span className={isOnline ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {isOnline ? '● Live' : '● Offline'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
