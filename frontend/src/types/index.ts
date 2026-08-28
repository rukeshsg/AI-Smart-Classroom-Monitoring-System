export interface Classroom {
  id: string;
  name: string;
  building: string;
  status: 'online' | 'offline' | 'error';
  created_at?: string;
}

export interface Camera {
  id: string;
  classroom_id: string;
  camera_name: string;
  source: string;
  status: 'online' | 'offline' | 'error';
}

export interface Detection {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface Behavior {
  class_id: number;
  class_name: 'Fighting' | 'Sleeping' | 'Using Phone' | 'Reading' | 'Writing' | 'Hand Raising' | 'Eating' | string;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface Event {
  id: string;
  classroom_id: string;
  event_type: string;
  date: string;
  time: string;
  timestamp: string;
  end_timestamp?: string;
  duration_seconds?: number;
  confidence: number;
  is_critical: boolean;
  details?: string;
  session_id?: string;
}

export interface Alert {
  id: string;
  event_id?: string;
  classroom_id: string;
  alert_type: 'FIGHTING_ALERT' | 'PHONE_USAGE_ALERT' | 'SLEEPING_ALERT' | string;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  date: string;
  time: string;
  timestamp: string;
  confidence: number;
  image_path?: string;
  resolved?: boolean;
  trigger_popup?: boolean;
}

export interface Evidence {
  id: string;
  event_id?: string;
  classroom_id: string;
  event_type: string;
  date: string;
  time: string;
  timestamp: string;
  confidence: number;
  image_path: string;
  is_permanent?: boolean;
  session_id?: string;
}

export interface Recording {
  id: string;
  session_id?: string;
  classroom_id: string;
  file_path: string;
  recording_type?: string;
  duration_seconds?: number;
  is_permanent?: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  classroom_id: string;
  start_time: string;
  end_time?: string;
  peak_occupancy: number;
  avg_occupancy?: number;
  total_events: number;
  critical_alerts: number;
  evidence_count: number;
  recording_duration?: number;
  status: 'ACTIVE' | 'STOPPED' | string;
}

export interface SessionDetail extends Session {
  events: Event[];
  evidence: Evidence[];
  recordings: Recording[];
}

export interface Analytics {
  classroom_id: string;
  date: string;
  current_occupancy: number;
  peak_occupancy: number;
  total_events: number;
  total_alerts: number;
  behavior_counts: Record<string, number>;
}

export interface ClassroomAnalytics {
  classroom_id: string;
  start_date: string;
  end_date: string;
  range_days: number;
  total_events: number;
  total_sessions: number;
  total_alerts: number;
  fighting_alerts: number;
  phone_alerts: number;
  other_alerts: number;
  peak_occupancy: number;
  current_occupancy: number;
  behavior_counts: Record<string, number>;
  daily_totals: Array<{
    date: string;
    short_date: string;
    events: number;
    fighting: number;
    phone: number;
  }>;
}

export interface DailySummary {
  classroom_id: string;
  date: string;
  occupancy: number;
  peak_occupancy: number;
  phone_alerts: number;
  fighting_alerts: number;
  sleeping_events: number;
  total_events: number;
}
