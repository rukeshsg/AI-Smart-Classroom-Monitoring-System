'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Classroom, Alert, Event, Evidence } from '@/types';
import {
  fetchClassrooms,
  fetchAlerts,
  fetchEvents,
  fetchEvidence,
  connectWebSocket,
  startMonitoringSession,
  stopMonitoringSession,
} from '@/lib/api';
import { Header } from '@/components/Header';
import { Sidebar, NavTab } from '@/components/Sidebar';
import { LiveSurveillanceFeed } from '@/components/LiveSurveillanceFeed';
import { MultiCameraOverview } from '@/components/MultiCameraOverview';
import { ActiveAlertsPanel } from '@/components/ActiveAlertsPanel';
import { ClassroomAnalyticsView } from '@/components/ClassroomAnalyticsView';
import { EventTimelineHistory } from '@/components/EventTimelineHistory';
import { EvidenceGallery } from '@/components/EvidenceGallery';
import { CameraStatusView } from '@/components/CameraStatusView';
import { ReportsCenter } from '@/components/ReportsCenter';
import { RecordingsView } from '@/components/RecordingsView';
import { SettingsView } from '@/components/SettingsView';
import { Smartphone, ShieldAlert, X } from 'lucide-react';

const POPUP_COOLDOWN_MS = 600000; // 10 minutes

export default function CommandCenterPage() {
  // DEFAULT Landing Page MUST BE 'live' (Live Surveillance Feed)
  const [activeTab, setActiveTab] = useState<NavTab>('live');
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('H305');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [currentOccupancy, setCurrentOccupancy] = useState<number>(0);
  const [peakOccupancy, setPeakOccupancy] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);

  // Persistent Theme Mode (Dark/Light)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('classguard_theme') as 'dark' | 'light') : null;
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('classguard_theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }, []);

  // Active Fighting State
  const [activeFightingState, setActiveFightingState] = useState<{
    is_active: boolean;
    classroom_id?: string;
    confidence?: number;
    time?: string;
  }>({ is_active: false });

  // Toast Notification State
  const [toastAlert, setToastAlert] = useState<Alert | null>(null);

  // 10-Minute Cooldown Map (client-side guard)
  const lastPopupTimesRef = useRef<Record<string, number>>({});

  // Fetch classrooms & initial data
  useEffect(() => {
    async function initData() {
      try {
        const [cData, aData, eData, evData] = await Promise.all([
          fetchClassrooms(),
          fetchAlerts(),
          fetchEvents(),
          fetchEvidence(),
        ]);
        setClassrooms(cData);
        setAlerts(aData);
        setRecentEvents(eData);
        setEvidenceList(evData);
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    }
    initData();
  }, []);

  // Connect WebSocket for real-time live monitoring telemetry
  useEffect(() => {
    const ws = connectWebSocket(selectedClassroom, (data: any) => {
      if (data.event === 'occupancy_update' || data.type === 'occupancy_update') {
        if (data.classroom_id === selectedClassroom || data.data?.classroom_id === selectedClassroom) {
          const occ = data.occupancy ?? data.data?.occupancy;
          const peak = data.peak_occupancy ?? data.data?.peak_occupancy;
          if (occ !== undefined) setCurrentOccupancy(occ);
          if (peak !== undefined) setPeakOccupancy(peak);
        }
      } else if (data.event === 'new_detection' || data.type === 'new_detection') {
        const det = data.detection || data.data;
        if (det) {
          setRecentEvents((prev) => [det, ...prev.slice(0, 49)]);
        }
      } else if (data.event === 'new_alert' || data.type === 'new_alert') {
        const alt: Alert = data.alert || data.data;
        if (alt) {
          setAlerts((prev) => [alt, ...prev]);

          const key = `${alt.classroom_id}_${alt.alert_type}`;
          const now = Date.now();
          const lastTime = lastPopupTimesRef.current[key] || 0;

          if (now - lastTime >= POPUP_COOLDOWN_MS) {
            lastPopupTimesRef.current[key] = now;
            setToastAlert(alt);

            if (alt.alert_type === 'FIGHTING_ALERT') {
              setActiveFightingState({
                is_active: true,
                classroom_id: alt.classroom_id,
                time: alt.time,
              });
            }
          }
        }
      } else if (data.event === 'session_status' || data.type === 'session_status') {
        const recStatus = data.is_recording ?? data.data?.is_recording;
        if (recStatus !== undefined) {
          setIsRecording(recStatus);
        }
      }
    });

    return () => {
      ws.close();
    };
  }, [selectedClassroom]);

  const handleToggleRecording = async () => {
    try {
      if (isRecording) {
        await stopMonitoringSession(selectedClassroom);
        setIsRecording(false);
      } else {
        await startMonitoringSession(selectedClassroom);
        setIsRecording(true);
      }
    } catch (err) {
      console.error('Error toggling session recording:', err);
    }
  };

  const handleDismissAlert = async (id: string) => {
    try {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      await fetch(`http://localhost:8000/api/alerts/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  // Called when a classroom is added via AddClassroomModal
  const handleClassroomAdded = useCallback(async () => {
    try {
      const updated = await fetchClassrooms();
      setClassrooms(updated);
    } catch (err) {
      console.error('Error refreshing classrooms:', err);
    }
  }, []);

  return (
    <div className="h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans antialiased overflow-hidden transition-colors">
      {/* Header */}
      <Header
        classrooms={classrooms}
        selectedClassroom={selectedClassroom}
        setSelectedClassroom={setSelectedClassroom}
        activeAlerts={alerts}
        onDismissAlert={handleDismissAlert}
        showLiveContext={activeTab === 'live' || activeTab === 'multi-camera'}
        theme={theme}
        toggleTheme={toggleTheme}
        onNavigateLive={() => setActiveTab('live')}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeAlertsCount={alerts.length}
          isRecording={isRecording}
          onToggleRecording={handleToggleRecording}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto no-scrollbar bg-[#090a0f] transition-colors">

          {activeTab === 'live' && (
            <LiveSurveillanceFeed
              classrooms={classrooms}
              selectedClassroom={selectedClassroom}
              setSelectedClassroom={setSelectedClassroom}
              activeAlerts={alerts}
              recentEvents={recentEvents}
              evidenceList={evidenceList}
              currentOccupancy={currentOccupancy}
              peakOccupancy={peakOccupancy}
              isRecording={isRecording}
              onToggleRecording={handleToggleRecording}
              onNavigateTab={(t) => setActiveTab(t)}
              activeFightingState={activeFightingState}
            />
          )}

          {activeTab === 'multi-camera' && (
            <MultiCameraOverview
              classrooms={classrooms}
              activeAlerts={alerts}
              onSelectClassroom={(id) => {
                setSelectedClassroom(id);
                setActiveTab('live');
              }}
            />
          )}

          {activeTab === 'alerts' && (
            <ActiveAlertsPanel
              alerts={alerts}
              onDismissAlert={handleDismissAlert}
              onSelectClassroom={(id) => {
                setSelectedClassroom(id);
                setActiveTab('live');
              }}
              onNavigateTab={(t) => setActiveTab(t)}
            />
          )}

          {(activeTab === 'analytics' || activeTab === 'daily-summary' || activeTab === 'session-summary') && (
            <ClassroomAnalyticsView
              classrooms={classrooms}
              selectedClassroom={selectedClassroom}
              setSelectedClassroom={setSelectedClassroom}
              mode={activeTab as 'analytics' | 'daily-summary' | 'session-summary'}
            />
          )}

          {(activeTab === 'timeline' || activeTab === 'history') && (
            <EventTimelineHistory classrooms={classrooms} selectedClassroom={selectedClassroom} />
          )}

          {activeTab === 'evidence' && (
            <EvidenceGallery classrooms={classrooms} selectedClassroom={selectedClassroom} />
          )}

          {activeTab === 'recordings' && (
            <RecordingsView classrooms={classrooms} selectedClassroom={selectedClassroom} />
          )}

          {activeTab === 'camera-status' && (
            <CameraStatusView
              classrooms={classrooms}
              onClassroomAdded={handleClassroomAdded}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsCenter classrooms={classrooms} selectedClassroom={selectedClassroom} />
          )}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Toast Notification (10-min cooldown enforced) */}
      {toastAlert && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center justify-between space-x-4 max-w-sm border-2 backdrop-blur-md ${
            toastAlert.alert_type === 'FIGHTING_ALERT'
              ? 'bg-rose-950/90 border-rose-600 text-rose-100'
              : 'bg-slate-900/95 border-amber-500 text-amber-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-3 rounded-xl text-white ${
                toastAlert.alert_type === 'FIGHTING_ALERT' ? 'bg-rose-600' : 'bg-amber-500 text-slate-950'
              }`}
            >
              {toastAlert.alert_type === 'FIGHTING_ALERT' ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <Smartphone className="w-6 h-6" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-sm text-white uppercase">{toastAlert.title}</h4>
              <p className="text-xs opacity-90">Classroom: {toastAlert.classroom_id}</p>
              <p className="text-[11px] font-mono opacity-80">{toastAlert.time}</p>
            </div>
          </div>
          <button
            onClick={() => setToastAlert(null)}
            className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-white"
            title="Dismiss Toast Notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-3 text-center text-xs text-slate-500 font-mono">
        © 2025 Smart Classroom Monitoring System — Command Center
      </footer>
    </div>
  );
}
