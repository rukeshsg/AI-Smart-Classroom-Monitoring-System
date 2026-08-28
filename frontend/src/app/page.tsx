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
        console.error('Error initializing Command Center data:', err);
      }
    }
    initData();
  }, []);

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = connectWebSocket(selectedClassroom, (msg) => {
      if (msg.type === 'new_alert') {
        const newAlt: Alert = msg.data;
        setAlerts((prev) => [newAlt, ...prev]);

        // Enforce 10-minute popup cooldown per classroom+type
        const cooldownKey = `${newAlt.classroom_id}_${newAlt.alert_type}`;
        const lastTime = lastPopupTimesRef.current[cooldownKey] || 0;
        const now = Date.now();
        if (newAlt.trigger_popup && now - lastTime >= POPUP_COOLDOWN_MS) {
          lastPopupTimesRef.current[cooldownKey] = now;
          setToastAlert(newAlt);
        }
      } else if (msg.type === 'new_detection') {
        setRecentEvents((prev) => [msg.data, ...prev.slice(0, 19)]);
      } else if (msg.type === 'new_evidence') {
        setEvidenceList((prev) => [msg.data, ...prev.slice(0, 19)]);
      } else if (msg.type === 'occupancy_update') {
        if (msg.classroom_id === selectedClassroom) {
          setCurrentOccupancy(msg.occupancy ?? 0);
          setPeakOccupancy(msg.peak_occupancy ?? 0);
          if (msg.active_fighting) {
            setActiveFightingState(msg.active_fighting);
          }
        }
      }
    });
    return () => { ws.close(); };
  }, [selectedClassroom]);

  const handleToggleRecording = useCallback(async () => {
    try {
      if (isRecording) {
        await stopMonitoringSession(selectedClassroom);
        setIsRecording(false);
      } else {
        const recType = activeTab === 'multi-camera' ? 'Multi-Camera Overview' : 'Single Camera';
        await startMonitoringSession(selectedClassroom, recType);
        setIsRecording(true);
      }
    } catch (err) {
      console.error('Error toggling session recording:', err);
    }
  }, [isRecording, selectedClassroom, activeTab]);

  // Client-side dismiss: removes from UI state only.
  // Backend persists the alert — for full delete, use ActiveAlertsPanel's delete button.
  const handleDismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

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
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased overflow-hidden">
      {/* Header */}
      <Header
        classrooms={classrooms}
        selectedClassroom={selectedClassroom}
        setSelectedClassroom={setSelectedClassroom}
        activeAlerts={alerts}
        onDismissAlert={handleDismissAlert}
        showLiveContext={activeTab === 'live' || activeTab === 'multi-camera'}
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
        />

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-950">

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
