import {
  Classroom, Event, Alert, Evidence, Analytics,
  Recording, Session, SessionDetail, ClassroomAnalytics, DailySummary
} from '@/types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

/** Returns the full URL for a stored media path like /screenshots/file.jpg */
export function getMediaUrl(path: string): string {
  if (!path) return '';
  // path already starts with / — don't add another
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function fetchClassrooms(): Promise<Classroom[]> {
  try {
    const res = await fetch(`${API_BASE}/api/classrooms`);
    if (!res.ok) throw new Error('Failed to fetch classrooms');
    return await res.json();
  } catch (err) {
    console.error(err);
    return [
      { id: 'H305', name: 'Main Lecture Hall H305', building: 'Building H', status: 'online' },
      { id: 'H003', name: 'Auditorium H003', building: 'Building H', status: 'online' },
      { id: 'B202', name: 'Classroom B202', building: 'Building B', status: 'online' },
      { id: 'C104', name: 'Seminar Room C104', building: 'Building C', status: 'online' },
      { id: 'G202', name: 'Classroom G202', building: 'Building G', status: 'offline' },
      { id: 'J301', name: 'Lecture Room J301', building: 'Building J', status: 'online' },
      { id: 'L204', name: 'Computer Science Lab L204', building: 'Laboratory L', status: 'online' },
    ];
  }
}

export async function fetchEvents(classroomId?: string, date?: string, eventType?: string): Promise<Event[]> {
  const params = new URLSearchParams();
  if (classroomId) params.append('classroom_id', classroomId);
  if (date) params.append('date', date);
  if (eventType) params.append('event_type', eventType);

  const res = await fetch(`${API_BASE}/api/events?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return await res.json();
}

export async function fetchAlerts(classroomId?: string): Promise<Alert[]> {
  const params = new URLSearchParams();
  if (classroomId) params.append('classroom_id', classroomId);
  try {
    const res = await fetch(`${API_BASE}/api/alerts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function deleteAlert(alertId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/alerts/${alertId}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchEvidence(
  classroomId?: string,
  date?: string,
  sessionId?: string
): Promise<Evidence[]> {
  const params = new URLSearchParams();
  if (classroomId) params.append('classroom_id', classroomId);
  if (date) params.append('date', date);
  if (sessionId) params.append('session_id', sessionId);

  const res = await fetch(`${API_BASE}/api/evidence?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch evidence');
  return await res.json();
}

export async function deleteEvidence(evidenceId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/evidence/${evidenceId}`, { method: 'DELETE' });
  return res.ok;
}

export async function togglePermanentEvidence(evidenceId: string, isPermanent: boolean): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/evidence/${evidenceId}/permanent?is_permanent=${isPermanent}`, {
    method: 'POST',
  });
  return res.ok;
}

export async function fetchRecordings(classroomId?: string): Promise<Recording[]> {
  const params = new URLSearchParams();
  if (classroomId) params.append('classroom_id', classroomId);

  const res = await fetch(`${API_BASE}/api/recordings?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch recordings');
  return await res.json();
}

export async function deleteRecording(recordingId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/recordings/${recordingId}`, { method: 'DELETE' });
  return res.ok;
}

export async function togglePermanentRecording(recordingId: string, isPermanent: boolean): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/recordings/${recordingId}/permanent?is_permanent=${isPermanent}`, {
    method: 'POST',
  });
  return res.ok;
}

// ── Classroom Management ──────────────────────────────────────────────

export interface AddClassroomPayload {
  id: string;
  name: string;
  building: string;
  floor?: string;
  description?: string;
  camera_name?: string;
  camera_source?: string;
  feed_type?: string;
}

export async function addClassroom(payload: AddClassroomPayload): Promise<{ status: string; message: string; classroom?: Classroom }> {
  const res = await fetch(`${API_BASE}/api/classrooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to add classroom');
  return data;
}

export async function fetchAnalytics(classroomId?: string, date?: string): Promise<Analytics> {
  const params = new URLSearchParams();
  if (classroomId) params.append('classroom_id', classroomId);
  if (date) params.append('date', date);

  const res = await fetch(`${API_BASE}/api/analytics?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return await res.json();
}

export async function fetchClassroomAnalytics(
  classroomId: string,
  rangeDays: number = 7
): Promise<ClassroomAnalytics> {
  const params = new URLSearchParams({
    classroom_id: classroomId,
    range_days: String(rangeDays),
  });
  const res = await fetch(`${API_BASE}/api/analytics/classroom?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch classroom analytics');
  return await res.json();
}

export async function fetchDailySummary(classroomId: string = 'H305', date?: string): Promise<DailySummary> {
  const params = new URLSearchParams({ classroom_id: classroomId });
  if (date) params.append('date', date);

  const res = await fetch(`${API_BASE}/api/daily_summary?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch daily summary');
  return await res.json();
}

export async function fetchSessions(classroomId?: string, date?: string): Promise<Session[]> {
  const params = new URLSearchParams();
  if (classroomId) params.append('classroom_id', classroomId);
  if (date) params.append('date', date);

  try {
    const res = await fetch(`${API_BASE}/api/sessions?${params.toString()}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function startMonitoringSession(classroomId: string, recordingType: string = 'Single Camera') {
  const res = await fetch(
    `${API_BASE}/api/sessions/start?classroom_id=${classroomId}&recording_type=${encodeURIComponent(recordingType)}`,
    { method: 'POST' }
  );
  if (!res.ok) throw new Error('Failed to start session');
  return await res.json();
}

export async function stopMonitoringSession(classroomId: string) {
  const res = await fetch(`${API_BASE}/api/sessions/stop?classroom_id=${classroomId}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to stop session');
  return await res.json();
}

export async function generatePdfReport(classroomId: string, date?: string) {
  const res = await fetch(`${API_BASE}/api/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ classroom_id: classroomId, date }),
  });
  if (!res.ok) throw new Error('Failed to generate PDF report');
  return await res.json();
}

export function getVideoFeedUrl(classroomId: string): string {
  return `${API_BASE}/api/video_feed/${classroomId}`;
}

export function connectWebSocket(classroomId: string, onMessage: (msg: any) => void): WebSocket {
  const wsProtocol = API_BASE.startsWith('https') ? 'wss' : 'ws';
  const wsBase = API_BASE.replace(/^https?:\/\//, '');
  const wsUrl = `${wsProtocol}://${wsBase}/ws/live/${classroomId}`;

  let ws = new WebSocket(wsUrl);
  let isClosedIntentionally = false;
  let reconnectTimeout: any = null;

  const initSocket = (socket: WebSocket) => {
    socket.onopen = () => {
      // Clean connection
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    socket.onerror = () => {
      // Browser ErrorEvents do not stringify cleanly; log helpful diagnostic
      console.warn(`WebSocket connection warning for ${wsUrl}`);
    };

    socket.onclose = () => {
      if (!isClosedIntentionally) {
        reconnectTimeout = setTimeout(() => {
          if (!isClosedIntentionally) {
            ws = new WebSocket(wsUrl);
            initSocket(ws);
          }
        }, 3000);
      }
    };
  };

  initSocket(ws);

  // Return a proxy-like object or the socket with cleanup hook
  const originalClose = ws.close.bind(ws);
  ws.close = function (code?: number, reason?: string) {
    isClosedIntentionally = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    originalClose(code, reason);
  };

  return ws;
}
