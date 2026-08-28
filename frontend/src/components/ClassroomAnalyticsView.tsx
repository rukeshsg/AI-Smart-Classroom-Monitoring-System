'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Classroom, Analytics, Event, Evidence, Recording,
  Session, SessionDetail, ClassroomAnalytics, DailySummary
} from '@/types';
import {
  fetchClassroomAnalytics, fetchDailySummary, fetchEvents,
  fetchEvidence, fetchSessions, fetchSessionDetail, fetchRecordings,
  deleteEvidence, togglePermanentEvidence, deleteRecording, togglePermanentRecording
} from '@/lib/api';
import {
  BarChart3, Users, Smartphone, ShieldAlert, Moon, BookOpen, PenTool,
  Hand, Utensils, Calendar, Layers, Clock, Film, AlertTriangle,
  Image, Download, Trash2, Shield, ChevronDown, Eye, X, Lock, Unlock,
  Play, CheckCircle2, TrendingUp, Activity, ZapOff, FileVideo
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const BEHAVIOR_COLORS: Record<string, string> = {
  Fighting: '#ef4444',
  Sleeping: '#8b5cf6',
  'Using Phone': '#f59e0b',
  Reading: '#3b82f6',
  Writing: '#10b981',
  'Hand Raising': '#06b6d4',
  Eating: '#f97316',
};
const BEHAVIOR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Fighting: ShieldAlert,
  Sleeping: Moon,
  'Using Phone': Smartphone,
  Reading: BookOpen,
  Writing: PenTool,
  'Hand Raising': Hand,
  Eating: Utensils,
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatTimestamp(ts: string): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return ts; }
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function severityBadge(eventType: string) {
  if (eventType === 'Fighting')
    return <span className="px-2 py-0.5 bg-rose-600/20 border border-rose-500/40 text-rose-400 text-[10px] font-bold rounded-full uppercase tracking-wider">CRITICAL</span>;
  if (eventType === 'Using Phone')
    return <span className="px-2 py-0.5 bg-amber-600/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-wider">ALERT</span>;
  if (eventType === 'Sleeping')
    return <span className="px-2 py-0.5 bg-purple-600/20 border border-purple-500/40 text-purple-400 text-[10px] font-bold rounded-full uppercase tracking-wider">WARN</span>;
  return <span className="px-2 py-0.5 bg-blue-600/20 border border-blue-500/40 text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider">INFO</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Lightbox Modal (shared across all modes)
// ─────────────────────────────────────────────────────────────────────────────
interface LightboxProps {
  item: Evidence;
  onClose: () => void;
  onDelete: (id: string) => void;
  onTogglePermanent: (id: string, val: boolean) => void;
}
function EvidenceLightbox({ item, onClose, onDelete, onTogglePermanent }: LightboxProps) {
  const imgUrl = item.image_path ? `${API_BASE}/${item.image_path}` : null;
  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="relative bg-[#0d1424] border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col md:flex-row overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Image panel */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center min-h-[260px] md:min-h-[400px]">
          {imgUrl ? (
            <img src={imgUrl} alt={item.event_type} className="object-contain max-h-[400px] w-full" />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 space-y-2 p-8">
              <Image className="w-12 h-12" />
              <span className="text-sm">No image available</span>
            </div>
          )}
        </div>
        {/* Info panel */}
        <div className="w-full md:w-72 flex flex-col p-6 space-y-4 border-t md:border-t-0 md:border-l border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                {severityBadge(item.event_type)}
              </div>
              <h3 className="font-bold text-lg text-white">{item.event_type}</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Classroom</span>
              <span className="text-slate-200 font-bold">{item.classroom_id}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Date</span>
              <span className="text-slate-200">{formatDateLabel(item.date)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Time</span>
              <span className="text-slate-200">{item.time}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Confidence</span>
              <span className="text-emerald-400 font-bold">{(item.confidence * 100).toFixed(0)}%</span>
            </div>
            {item.session_id && (
              <div className="flex justify-between text-slate-400">
                <span>Session</span>
                <span className="text-slate-300 truncate ml-2 max-w-[120px]">{item.session_id}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Protected</span>
              <span className={item.is_permanent ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                {item.is_permanent ? 'Keep Forever' : 'No'}
              </span>
            </div>
          </div>

          <div className="flex-1" />

          <div className="space-y-2 pt-3 border-t border-slate-800">
            <button
              onClick={() => onTogglePermanent(item.id, !item.is_permanent)}
              className={`w-full flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold transition-all ${
                item.is_permanent
                  ? 'bg-amber-600/20 border border-amber-500/40 text-amber-400 hover:bg-amber-600/30'
                  : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {item.is_permanent ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{item.is_permanent ? 'Remove Protection' : 'Keep Forever'}</span>
            </button>
            <button
              onClick={() => { onDelete(item.id); onClose(); }}
              className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold bg-rose-600/20 border border-rose-500/40 text-rose-400 hover:bg-rose-600/30 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Evidence</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG Horizontal Bar Chart for behavior distribution
// ─────────────────────────────────────────────────────────────────────────────
function BehaviorBarChart({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const maxVal = Math.max(...Object.values(counts), 1);
  return (
    <div className="space-y-3">
      {Object.entries(counts).map(([name, count]) => {
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
        const barW = (count / maxVal) * 100;
        const Icon = BEHAVIOR_ICONS[name] || Activity;
        const color = BEHAVIOR_COLORS[name] || '#3b82f6';
        return (
          <div key={name} className="flex items-center space-x-3 group">
            <div className="w-5 h-5 flex-shrink-0" style={{ color }}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 flex items-center space-x-2">
              <span className="text-xs text-slate-300 w-28 flex-shrink-0">{name}</span>
              <div className="flex-1 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${barW}%`, backgroundColor: color }}
                />
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400 w-20 text-right flex-shrink-0">
              {count} <span className="text-slate-600">({pct}%)</span>
            </span>
          </div>
        );
      })}
      {total === 0 && (
        <p className="text-xs text-slate-500 text-center py-4">No behavior events recorded.</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG Sparkline / Line chart for event trends
// ─────────────────────────────────────────────────────────────────────────────
function SparklineTrend({
  data,
  keyField,
  valueField,
  color = '#3b82f6',
  label,
}: {
  data: Record<string, any>[];
  keyField: string;
  valueField: string;
  color?: string;
  label?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const W = 600, H = 140, PAD_LEFT = 45, PAD_RIGHT = 20, PAD_TOP = 20, PAD_BOTTOM = 30;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  const vals = data.map(d => d[valueField] as number);
  const rawMax = Math.max(...vals, 1);
  const maxV = Math.ceil(rawMax * 1.15) || 5;

  const yTicks = [maxV, Math.round(maxV / 2), 0];

  const getX = (i: number) => PAD_LEFT + (i / Math.max(data.length - 1, 1)) * chartW;
  const getY = (v: number) => PAD_TOP + (1 - v / maxV) * chartH;

  const points = data.map((d, i) => `${getX(i)},${getY(d[valueField])}`);
  const polyline = points.join(' ');
  const area = `${PAD_LEFT},${H - PAD_BOTTOM} ${polyline} ${W - PAD_RIGHT},${H - PAD_BOTTOM}`;

  const gradientId = `grad-${color.replace(/[^a-zA-Z0-9]/g, '')}-${valueField}`;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span className="font-semibold text-slate-300">{label}</span>
          {hoveredIdx !== null && data[hoveredIdx] && (
            <span className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {data[hoveredIdx][keyField]}: <strong style={{ color }}>{data[hoveredIdx][valueField]}</strong>
            </span>
          )}
        </div>
      )}
      <div className="relative w-full overflow-hidden rounded-2xl bg-[#070c18] border border-slate-800/90 p-3 shadow-inner">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.45" />
              <stop offset="60%" stopColor={color} stopOpacity="0.15" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map((tick, idx) => {
            const y = getY(tick);
            return (
              <g key={idx}>
                <line
                  x1={PAD_LEFT}
                  y1={y}
                  x2={W - PAD_RIGHT}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={PAD_LEFT - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {tick.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Gradient Area Fill */}
          <polygon points={area} fill={`url(#${gradientId})`} />

          {/* Line Path */}
          <polyline
            points={polyline}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Circles & Hover Areas */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d[valueField]);
            const isHovered = hoveredIdx === i;
            return (
              <g key={i} className="cursor-pointer">
                {isHovered && (
                  <line
                    x1={cx}
                    y1={PAD_TOP}
                    x2={cx}
                    y2={H - PAD_BOTTOM}
                    stroke={color}
                    strokeDasharray="2 2"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? '6' : '4'}
                  fill={color}
                  stroke="#070c18"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
                {/* Transparent hit area for easy hover */}
                <rect
                  x={cx - 15}
                  y={PAD_TOP}
                  width="30"
                  height={chartH}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* X-axis date labels */}
        <div className="flex justify-between mt-1 pl-10 pr-4">
          {data.map((d, i) => (
            <span
              key={i}
              className={`text-[10px] font-mono transition-colors ${
                hoveredIdx === i ? 'text-white font-bold' : 'text-slate-500'
              }`}
            >
              {d[keyField]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact KPI card
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, color = 'text-white', icon: Icon, accent
}: {
  label: string; value: string | number; sub?: string;
  color?: string; icon: React.ComponentType<{ className?: string }>; accent?: string;
}) {
  return (
    <div className={`bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1.5 shadow-lg ${accent ? `ring-1 ${accent}` : ''}`}>
      <div className="flex items-center justify-between text-slate-400 text-xs">
        <span className="font-semibold">{label}</span>
        <Icon className="w-4 h-4 opacity-70" />
      </div>
      <p className={`text-2xl font-extrabold font-mono ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500 font-mono">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Evidence Gallery section
// ─────────────────────────────────────────────────────────────────────────────
function EvidenceGallerySection({
  items,
  onPreview,
  title = 'Evidence Captured',
  emptyMsg = 'No evidence captured.'
}: {
  items: Evidence[];
  onPreview: (item: Evidence) => void;
  title?: string;
  emptyMsg?: string;
}) {
  return (
    <div className="space-y-3">
      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center space-x-2">
        <Image className="w-4 h-4 text-slate-400" />
        <span>{title}</span>
        <span className="ml-auto text-slate-500 normal-case font-normal">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </h4>
      {items.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
          <Image className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">{emptyMsg}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map(ev => {
            const imgUrl = ev.image_path ? `${API_BASE}/${ev.image_path}` : null;
            const color = BEHAVIOR_COLORS[ev.event_type] || '#3b82f6';
            return (
              <button
                key={ev.id}
                onClick={() => onPreview(ev)}
                className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 hover:shadow-lg transition-all text-left"
              >
                <div className="aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                  {imgUrl ? (
                    <img src={imgUrl} alt={ev.event_type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Image className="w-6 h-6 text-slate-700" />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <Eye className="w-4 h-4 text-white mx-auto mb-1" />
                </div>
                <div className="p-2 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold truncate" style={{ color }}>{ev.event_type}</span>
                    {ev.is_permanent && <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">{ev.classroom_id} · {ev.time}</p>
                  <p className="text-[10px] text-emerald-400 font-mono">{(ev.confidence * 100).toFixed(0)}% conf</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Event Timeline section
// ─────────────────────────────────────────────────────────────────────────────
function EventTimelineSection({ events, emptyMsg = 'No events recorded.' }: { events: Event[]; emptyMsg?: string }) {
  if (events.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
        <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500">{emptyMsg}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {events.map(e => {
        const color = BEHAVIOR_COLORS[e.event_type] || '#3b82f6';
        const Icon = BEHAVIOR_ICONS[e.event_type] || Activity;
        return (
          <div key={e.id} className="flex items-start space-x-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}50`, color }}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="font-bold text-xs text-slate-100">{e.event_type}</span>
                {severityBadge(e.event_type)}
              </div>
              <div className="flex items-center space-x-3 mt-1 text-[11px] font-mono text-slate-500">
                <span className="text-slate-400">{e.time || formatTimestamp(e.timestamp)}</span>
                <span>·</span>
                <span>{e.classroom_id}</span>
                <span>·</span>
                <span className="text-emerald-400">{(e.confidence * 100).toFixed(0)}% conf</span>
                {e.duration_seconds && e.duration_seconds > 0 && (
                  <><span>·</span><span>{formatDuration(e.duration_seconds)}</span></>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recording player card
// ─────────────────────────────────────────────────────────────────────────────
function RecordingCard({
  rec,
  onDelete,
  onTogglePermanent
}: {
  rec: Recording;
  onDelete: (id: string) => void;
  onTogglePermanent: (id: string, val: boolean) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const filename = rec.file_path.split('/').pop() || rec.file_path;
  const videoUrl = `${API_BASE}/recordings/${filename}`;
  const downloadUrl = `${API_BASE}/api/recordings/download/${filename}`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="bg-slate-950 aspect-video flex items-center justify-center relative group">
        {playing ? (
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full h-full object-contain"
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                <FileVideo className="w-7 h-7 text-blue-400" />
              </div>
              <p className="text-xs text-slate-400 font-mono">{filename}</p>
            </div>
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
            >
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-xl">
                <Play className="w-6 h-6 text-white ml-1" />
              </div>
            </button>
          </>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <p className="text-slate-500">Type</p>
            <p className="text-slate-200 font-semibold">{rec.recording_type || 'Single Camera'}</p>
          </div>
          <div>
            <p className="text-slate-500">Duration</p>
            <p className="text-slate-200 font-semibold">{formatDuration(rec.duration_seconds || 0)}</p>
          </div>
          <div>
            <p className="text-slate-500">Classroom</p>
            <p className="text-slate-200 font-semibold">{rec.classroom_id}</p>
          </div>
          <div>
            <p className="text-slate-500">Protected</p>
            <p className={rec.is_permanent ? 'text-amber-400 font-bold' : 'text-slate-500'}>
              {rec.is_permanent ? 'Keep Forever' : 'No'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2 pt-1">
          <a href={downloadUrl} download className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-bold bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 transition-all">
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
          <button
            onClick={() => onTogglePermanent(rec.id, !rec.is_permanent)}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              rec.is_permanent
                ? 'bg-amber-600/20 border border-amber-500/40 text-amber-400 hover:bg-amber-600/30'
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {rec.is_permanent ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{rec.is_permanent ? 'Protected' : 'Protect'}</span>
          </button>
          <button
            onClick={() => onDelete(rec.id)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-600/20 border border-rose-500/40 text-rose-400 hover:bg-rose-600/30 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
interface AnalyticsViewProps {
  classrooms: Classroom[];
  selectedClassroom: string;
  setSelectedClassroom: (id: string) => void;
  mode?: 'analytics' | 'daily-summary' | 'session-summary';
}

export const ClassroomAnalyticsView: React.FC<AnalyticsViewProps> = ({
  classrooms,
  selectedClassroom,
  setSelectedClassroom,
  mode = 'analytics',
}) => {
  const today = new Date().toISOString().split('T')[0];

  // Shared state
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [lightboxItem, setLightboxItem] = useState<Evidence | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);

  // Analytics mode state
  const [analyticsData, setAnalyticsData] = useState<ClassroomAnalytics | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState<number>(7);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Daily summary mode state
  const [dailyEvents, setDailyEvents] = useState<Event[]>([]);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [dailyRecordings, setDailyRecordings] = useState<Recording[]>([]);
  const [dailyTab, setDailyTab] = useState<'all' | 'evidence' | 'recordings'>('all');
  const [dailyLoading, setDailyLoading] = useState(false);

  // Session summary mode state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  // ── Load Classroom Analytics ──────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'analytics') return;
    setAnalyticsLoading(true);
    fetchClassroomAnalytics(selectedClassroom, analyticsRange)
      .then(setAnalyticsData)
      .catch(console.error)
      .finally(() => setAnalyticsLoading(false));
  }, [mode, selectedClassroom, analyticsRange]);

  // ── Load Daily Summary ────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'daily-summary') return;
    setDailyLoading(true);
    Promise.all([
      fetchEvents(selectedClassroom, selectedDate),
      fetchDailySummary(selectedClassroom, selectedDate),
      fetchEvidence(selectedClassroom, selectedDate),
      fetchRecordings(selectedClassroom),
    ])
      .then(([evts, summary, evid, recs]) => {
        setDailyEvents(evts);
        setDailySummary(summary);
        setEvidenceList(evid);
        // Filter recordings created on selectedDate
        const filtRecs = recs.filter(r => r.created_at?.startsWith(selectedDate));
        setDailyRecordings(filtRecs);
      })
      .catch(console.error)
      .finally(() => setDailyLoading(false));
  }, [mode, selectedClassroom, selectedDate]);

  // ── Load Sessions list ────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'session-summary') return;
    fetchSessions(selectedClassroom).then(s => {
      setSessions(s);
      if (s.length > 0 && !selectedSessionId) {
        setSelectedSessionId(s[0].id);
      }
    }).catch(console.error);
  }, [mode, selectedClassroom]);

  // ── Load Session Detail ───────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'session-summary' || !selectedSessionId) return;
    setSessionLoading(true);
    fetchSessionDetail(selectedSessionId)
      .then(detail => {
        setSessionDetail(detail);
        if (detail) setEvidenceList(detail.evidence || []);
      })
      .catch(console.error)
      .finally(() => setSessionLoading(false));
  }, [mode, selectedSessionId]);

  // ── Lightbox helpers ──────────────────────────────────────────────────────
  const handleLightboxDelete = useCallback(async (id: string) => {
    await deleteEvidence(id);
    setEvidenceList(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleLightboxTogglePermanent = useCallback(async (id: string, val: boolean) => {
    await togglePermanentEvidence(id, val);
    setEvidenceList(prev => prev.map(e => e.id === id ? { ...e, is_permanent: val } : e));
    if (lightboxItem?.id === id) setLightboxItem(prev => prev ? { ...prev, is_permanent: val } : prev);
  }, [lightboxItem]);

  // ── Recording delete / protect helpers ───────────────────────────────────
  const handleDeleteRecording = useCallback(async (id: string) => {
    await deleteRecording(id);
    setDailyRecordings(prev => prev.filter(r => r.id !== id));
    if (sessionDetail) {
      setSessionDetail(prev => prev ? { ...prev, recordings: prev.recordings.filter(r => r.id !== id) } : prev);
    }
  }, [sessionDetail]);

  const handleTogglePermanentRecording = useCallback(async (id: string, val: boolean) => {
    await togglePermanentRecording(id, val);
    const patchRec = (recs: Recording[]) => recs.map(r => r.id === id ? { ...r, is_permanent: val } : r);
    setDailyRecordings(patchRec);
    if (sessionDetail) {
      setSessionDetail(prev => prev ? { ...prev, recordings: patchRec(prev.recordings) } : prev);
    }
  }, [sessionDetail]);

  // ─────────────────────────────────────────────────────────────────────────
  // Shared Top Bar
  // ─────────────────────────────────────────────────────────────────────────
  const modeConfig = {
    analytics: {
      title: 'Classroom Analytics',
      desc: 'Long-term behavioral trends, distribution patterns, and multi-day statistics',
      badge: 'bg-blue-600/20 border-blue-500/40 text-blue-300',
      badgeText: 'Long-Term Analytics',
    },
    'daily-summary': {
      title: 'Daily Summary',
      desc: 'One-day operational report — events, occupancy, alerts, and media for the selected date',
      badge: 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300',
      badgeText: 'Daily Operational Report',
    },
    'session-summary': {
      title: 'Session Summary',
      desc: 'Detailed report for a single monitoring session — timeline, occupancy, evidence, and recording',
      badge: 'bg-purple-600/20 border-purple-500/40 text-purple-300',
      badgeText: 'Session Report',
    },
  };
  const mc = modeConfig[mode];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">

      {/* ── Lightbox ── */}
      {lightboxItem && (
        <EvidenceLightbox
          item={lightboxItem}
          onClose={() => setLightboxItem(null)}
          onDelete={handleLightboxDelete}
          onTogglePermanent={handleLightboxTogglePermanent}
        />
      )}

      {/* ── Top Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-slate-100">{mc.title}</h2>
            <span className={`px-3 py-0.5 text-xs font-bold rounded-full border ${mc.badge}`}>{mc.badgeText}</span>
          </div>
          <p className="text-xs text-slate-400">{mc.desc}</p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-400">Classroom:</label>
            <select
              value={selectedClassroom}
              onChange={e => setSelectedClassroom(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
              ))}
            </select>
          </div>
          {mode === 'analytics' && (
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-400">Range:</label>
              <select
                value={analyticsRange}
                onChange={e => setAnalyticsRange(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 text-white font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={1}>Today</option>
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
              </select>
            </div>
          )}
          {(mode === 'daily-summary') && (
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-400">Date:</label>
              <input
                type="date"
                value={selectedDate}
                max={today}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
          {mode === 'session-summary' && sessions.length > 0 && (
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-400">Session:</label>
              <select
                value={selectedSessionId}
                onChange={e => setSelectedSessionId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white font-bold text-xs rounded-xl px-3 py-2 max-w-[240px] focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.start_time?.split('T')[0]} {s.status === 'ACTIVE' ? '● LIVE' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MODE 1: CLASSROOM ANALYTICS
      ════════════════════════════════════════════════════════════════════ */}
      {mode === 'analytics' && (
        <div className="space-y-6">
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Activity className="w-6 h-6 animate-spin mr-2" />
              <span>Loading analytics…</span>
            </div>
          ) : analyticsData ? (
            <>
              {/* KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiCard label="Peak Occupancy" value={analyticsData.peak_occupancy} sub="Max students present" icon={Users} color="text-blue-400" />
                <KpiCard label="Total Events" value={analyticsData.total_events} sub={`Over ${analyticsData.range_days} days`} icon={Activity} color="text-emerald-400" />
                <KpiCard label="Phone Events" value={analyticsData.behavior_counts['Using Phone']} sub="Detected usage alerts" icon={Smartphone} color="text-amber-400" />
                <KpiCard label="Fighting Events" value={analyticsData.behavior_counts['Fighting']} sub="Critical priority" icon={ShieldAlert} color="text-rose-400" accent="ring-rose-500/20" />
              </div>

              {/* Behavior Distribution + Alert Breakdown side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Behavior Distribution */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Behavior Distribution</h3>
                    <span className="text-xs text-slate-500 font-mono">{selectedClassroom} · {analyticsData.range_days}d</span>
                  </div>
                  <BehaviorBarChart counts={analyticsData.behavior_counts} />
                </div>

                {/* Alert Breakdown */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Alert Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Fighting Alerts', count: analyticsData.fighting_alerts, color: '#ef4444', Icon: ShieldAlert },
                      { label: 'Phone Usage Alerts', count: analyticsData.phone_alerts, color: '#f59e0b', Icon: Smartphone },
                      { label: 'Other Alerts', count: analyticsData.other_alerts, color: '#3b82f6', Icon: AlertTriangle },
                      { label: 'Total Sessions', count: analyticsData.total_sessions, color: '#8b5cf6', Icon: Layers },
                    ].map(({ label, count, color, Icon }) => (
                      <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" style={{ color }} />
                          <span className="text-xs text-slate-300">{label}</span>
                        </div>
                        <span className="font-mono font-bold text-sm" style={{ color }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Event Trend Chart */}
              {analyticsData.daily_totals.length > 1 && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Event Trend</h3>
                    <span className="text-xs text-slate-500 font-mono">Daily total events · {analyticsData.range_days} days</span>
                  </div>
                  <SparklineTrend
                    data={analyticsData.daily_totals}
                    keyField="short_date"
                    valueField="events"
                    color="#3b82f6"
                  />
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <SparklineTrend
                      data={analyticsData.daily_totals}
                      keyField="short_date"
                      valueField="fighting"
                      color="#ef4444"
                      label="Fighting detections per day"
                    />
                    <SparklineTrend
                      data={analyticsData.daily_totals}
                      keyField="short_date"
                      valueField="phone"
                      color="#f59e0b"
                      label="Phone usage detections per day"
                    />
                  </div>
                </div>
              )}

              {analyticsData.total_events === 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
                  <TrendingUp className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-slate-400 font-semibold">No monitoring data available for this range.</p>
                  <p className="text-xs text-slate-500">Start a monitoring session to populate analytics.</p>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODE 2: DAILY SUMMARY
      ════════════════════════════════════════════════════════════════════ */}
      {mode === 'daily-summary' && (
        <div className="space-y-6">
          {/* Daily Header Banner */}
          <div className="bg-gradient-to-r from-emerald-900/20 via-slate-900 to-slate-900 border border-emerald-800/40 p-5 rounded-2xl shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">{formatDateLabel(selectedDate)}</h3>
                  <span className="text-xs px-2 py-0.5 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 rounded-full font-mono">
                    Daily Report
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">Classroom {selectedClassroom} · {dailyEvents.length} events recorded</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950 rounded-xl px-3 py-2 border border-slate-800">
                  <p className="text-lg font-bold text-emerald-400 font-mono">{dailySummary?.peak_occupancy || 0}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Peak Occ.</p>
                </div>
                <div className="bg-slate-950 rounded-xl px-3 py-2 border border-slate-800">
                  <p className="text-lg font-bold text-amber-400 font-mono">{dailySummary?.phone_alerts || 0}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Phone Alerts</p>
                </div>
                <div className="bg-slate-950 rounded-xl px-3 py-2 border border-slate-800">
                  <p className="text-lg font-bold text-rose-400 font-mono">{dailySummary?.fighting_alerts || 0}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Fighting</p>
                </div>
              </div>
            </div>
          </div>

          {dailyLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Activity className="w-6 h-6 animate-spin mr-2" />
              <span>Loading daily data…</span>
            </div>
          ) : (
            <>
              {/* Daily KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiCard label="Total Events" value={dailyEvents.length} sub="Logged this day" icon={Activity} color="text-blue-400" />
                <KpiCard label="Peak Occupancy" value={dailySummary?.peak_occupancy || 0} sub="Max students present" icon={Users} color="text-emerald-400" />
                <KpiCard label="Critical Alerts" value={(dailySummary?.fighting_alerts || 0) + (dailySummary?.phone_alerts || 0)} sub="Fighting + phone usage" icon={AlertTriangle} color="text-rose-400" />
                <KpiCard label="Evidence Captured" value={evidenceList.length} sub="Screenshots saved" icon={Image} color="text-purple-400" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Behavior Breakdown */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Daily Behavior Breakdown</h3>
                  {(() => {
                    const counts: Record<string, number> = {
                      Fighting: 0, Sleeping: 0, 'Using Phone': 0,
                      Reading: 0, Writing: 0, 'Hand Raising': 0, Eating: 0
                    };
                    dailyEvents.forEach(e => { if (e.event_type in counts) counts[e.event_type]++; });
                    return <BehaviorBarChart counts={counts} />;
                  })()}
                </div>

                {/* Daily Alert Summary */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Alert Summary</h3>
                  <div className="space-y-3">
                    <div className="bg-rose-950/30 border border-rose-800/40 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center">
                          <ShieldAlert className="w-5 h-5 text-rose-400" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-rose-300">Fighting Alerts</p>
                          <p className="text-[11px] text-rose-400/60">Critical — requires attention</p>
                        </div>
                      </div>
                      <span className="text-2xl font-extrabold text-rose-400 font-mono">{dailySummary?.fighting_alerts || 0}</span>
                    </div>
                    <div className="bg-amber-950/30 border border-amber-800/40 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-amber-600/20 border border-amber-500/40 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-amber-300">Phone Usage</p>
                          <p className="text-[11px] text-amber-400/60">Policy violation events</p>
                        </div>
                      </div>
                      <span className="text-2xl font-extrabold text-amber-400 font-mono">{dailySummary?.phone_alerts || 0}</span>
                    </div>
                    <div className="bg-purple-950/30 border border-purple-800/40 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center">
                          <Moon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-purple-300">Sleeping</p>
                          <p className="text-[11px] text-purple-400/60">Disengagement detections</p>
                        </div>
                      </div>
                      <span className="text-2xl font-extrabold text-purple-400 font-mono">{dailySummary?.sleeping_events || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Activity Timeline */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider flex items-center justify-between">
                  <span>Daily Event Timeline</span>
                  <span className="text-slate-500 font-normal text-xs normal-case">{dailyEvents.length} events</span>
                </h3>
                <EventTimelineSection
                  events={[...dailyEvents].reverse()}
                  emptyMsg={`No events recorded on ${formatDateLabel(selectedDate)}.`}
                />
              </div>

              {/* Daily Media Tabs: Evidence + Recordings */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Evidence & Recordings</h3>
                  <div className="flex space-x-1">
                    {(['all', 'evidence', 'recordings'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setDailyTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                          dailyTab === tab
                            ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {(dailyTab === 'all' || dailyTab === 'evidence') && (
                  <EvidenceGallerySection
                    items={evidenceList}
                    onPreview={setLightboxItem}
                    title="Evidence Captured Today"
                    emptyMsg={`No evidence captured on ${formatDateLabel(selectedDate)}.`}
                  />
                )}
                {(dailyTab === 'all' || dailyTab === 'recordings') && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                      <Film className="w-4 h-4 text-slate-400" />
                      <span>Recordings Today</span>
                      <span className="ml-auto text-slate-500 normal-case font-normal">{dailyRecordings.length} item{dailyRecordings.length !== 1 ? 's' : ''}</span>
                    </h4>
                    {dailyRecordings.length === 0 ? (
                      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
                        <Film className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No recordings saved for {formatDateLabel(selectedDate)}.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dailyRecordings.map(r => (
                          <RecordingCard
                            key={r.id}
                            rec={r}
                            onDelete={handleDeleteRecording}
                            onTogglePermanent={handleTogglePermanentRecording}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODE 3: SESSION SUMMARY
      ════════════════════════════════════════════════════════════════════ */}
      {mode === 'session-summary' && (
        <div className="space-y-6">
          {sessions.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-16 text-center space-y-3">
              <Layers className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400 font-semibold text-lg">No monitoring sessions recorded</p>
              <p className="text-xs text-slate-500">Sessions are created when you start a recording. Go to Live Surveillance and press <strong>Start Recording</strong>.</p>
            </div>
          ) : sessionLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Activity className="w-6 h-6 animate-spin mr-2" />
              <span>Loading session data…</span>
            </div>
          ) : sessionDetail ? (
            <>
              {/* Session Header Banner */}
              <div className="bg-gradient-to-r from-purple-900/20 via-slate-900 to-slate-900 border border-purple-800/40 p-6 rounded-2xl shadow-xl">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 flex-wrap gap-2">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                        sessionDetail.status === 'ACTIVE'
                          ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-700 border-slate-600 text-slate-300'
                      }`}>
                        {sessionDetail.status === 'ACTIVE' ? '● ACTIVE' : '✓ Completed'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white font-mono">{sessionDetail.id}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1 text-xs font-mono mt-2">
                      <div><span className="text-slate-500">Classroom:</span> <span className="text-slate-200 font-bold">{sessionDetail.classroom_id}</span></div>
                      <div><span className="text-slate-500">Date:</span> <span className="text-slate-200">{formatDateLabel(sessionDetail.start_time?.split('T')[0])}</span></div>
                      <div><span className="text-slate-500">Status:</span> <span className={sessionDetail.status === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-slate-300'}>{sessionDetail.status}</span></div>
                      <div><span className="text-slate-500">Start:</span> <span className="text-slate-200">{formatTimestamp(sessionDetail.start_time)}</span></div>
                      {sessionDetail.end_time && (
                        <div><span className="text-slate-500">End:</span> <span className="text-slate-200">{formatTimestamp(sessionDetail.end_time)}</span></div>
                      )}
                      {sessionDetail.recordings.length > 0 && (
                        <div><span className="text-slate-500">Recording:</span> <span className="text-purple-400 font-bold">{sessionDetail.recordings.length} file(s)</span></div>
                      )}
                    </div>
                  </div>
                  {/* Duration stat */}
                  {sessionDetail.recording_duration && sessionDetail.recording_duration > 0 ? (
                    <div className="text-center bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 flex-shrink-0">
                      <p className="text-3xl font-extrabold text-purple-400 font-mono">{formatDuration(sessionDetail.recording_duration)}</p>
                      <p className="text-xs text-slate-500 mt-1">Session Duration</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Session KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiCard label="Peak Occupancy" value={sessionDetail.peak_occupancy} sub="Max students" icon={Users} color="text-blue-400" />
                <KpiCard label="Total Events" value={sessionDetail.total_events || sessionDetail.events.length} sub="Session detections" icon={Activity} color="text-emerald-400" />
                <KpiCard label="Critical Alerts" value={sessionDetail.critical_alerts} sub="High-priority" icon={ShieldAlert} color="text-rose-400" accent="ring-rose-500/20" />
                <KpiCard label="Evidence Captured" value={sessionDetail.evidence_count || sessionDetail.evidence.length} sub="Screenshots saved" icon={Image} color="text-purple-400" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(() => {
                  const phoneCnt = sessionDetail.events.filter(e => e.event_type === 'Using Phone').length;
                  const totalBehaviors = sessionDetail.events.length;
                  const recDur = sessionDetail.recordings.reduce((a, r) => a + (r.duration_seconds || 0), 0);
                  const avgOcc = sessionDetail.avg_occupancy || 0;
                  return (
                    <>
                      <KpiCard label="Phone Usage" value={phoneCnt} sub="Events in session" icon={Smartphone} color="text-amber-400" />
                      <KpiCard label="Avg Occupancy" value={avgOcc > 0 ? avgOcc.toFixed(1) : '—'} sub="Average students" icon={Users} color="text-cyan-400" />
                      <KpiCard label="Total Behaviors" value={totalBehaviors} sub="AI detections" icon={BarChart3} color="text-indigo-400" />
                      <KpiCard label="Rec. Duration" value={recDur > 0 ? formatDuration(recDur) : '—'} sub="Total footage" icon={Film} color="text-purple-400" />
                    </>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Behavior Activity */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Behavior Activity During Session</h3>
                  {(() => {
                    const counts: Record<string, number> = {
                      Fighting: 0, Sleeping: 0, 'Using Phone': 0,
                      Reading: 0, Writing: 0, 'Hand Raising': 0, Eating: 0
                    };
                    sessionDetail.events.forEach(e => { if (e.event_type in counts) counts[e.event_type]++; });
                    return <BehaviorBarChart counts={counts} />;
                  })()}
                </div>

                {/* Session Alert Summary */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Alert Summary</h3>
                  {(() => {
                    const fightCount = sessionDetail.events.filter(e => e.event_type === 'Fighting').length;
                    const phoneCount = sessionDetail.events.filter(e => e.event_type === 'Using Phone').length;
                    const otherCount = sessionDetail.events.filter(e =>
                      e.event_type !== 'Fighting' && e.event_type !== 'Using Phone'
                    ).length;
                    return (
                      <div className="space-y-3">
                        <div className={`p-4 rounded-xl border flex items-center justify-between ${
                          fightCount > 0
                            ? 'bg-rose-950/30 border-rose-800/40'
                            : 'bg-slate-950 border-slate-800'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center">
                              <ShieldAlert className="w-5 h-5 text-rose-400" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-rose-300">Critical Alerts — Fighting</p>
                              <p className="text-[11px] text-rose-400/60">Highest priority</p>
                            </div>
                          </div>
                          <span className="text-2xl font-extrabold text-rose-400 font-mono">{fightCount}</span>
                        </div>
                        <div className="p-4 rounded-xl border bg-amber-950/20 border-amber-800/30 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-amber-600/20 border border-amber-500/40 flex items-center justify-center">
                              <Smartphone className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-amber-300">Phone Usage Events</p>
                              <p className="text-[11px] text-amber-400/60">Policy violations</p>
                            </div>
                          </div>
                          <span className="text-2xl font-extrabold text-amber-400 font-mono">{phoneCount}</span>
                        </div>
                        <div className="p-4 rounded-xl border bg-slate-950 border-slate-800 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                              <Activity className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-blue-300">Other Detections</p>
                              <p className="text-[11px] text-blue-400/60">Reading, Writing, Sleeping, etc.</p>
                            </div>
                          </div>
                          <span className="text-2xl font-extrabold text-blue-400 font-mono">{otherCount}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Session Event Timeline */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider flex items-center justify-between">
                  <span>Session Event Timeline</span>
                  <span className="text-slate-500 font-normal text-xs normal-case">{sessionDetail.events.length} events</span>
                </h3>
                <EventTimelineSection
                  events={sessionDetail.events}
                  emptyMsg="No events were recorded during this session."
                />
              </div>

              {/* Session Evidence Gallery */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Session Evidence</h3>
                <EvidenceGallerySection
                  items={evidenceList}
                  onPreview={setLightboxItem}
                  title=""
                  emptyMsg="No evidence was captured during this session."
                />
              </div>

              {/* Session Recording */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Session Recording</h3>
                {sessionDetail.recordings.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
                    <FileVideo className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-slate-400 font-semibold">No recording available for this session.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sessionDetail.recordings.map(r => (
                      <RecordingCard
                        key={r.id}
                        rec={r}
                        onDelete={handleDeleteRecording}
                        onTogglePermanent={handleTogglePermanentRecording}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Session Media Summary */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Session Media Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Evidence Captured', value: sessionDetail.evidence.length, color: 'text-purple-400', Icon: Image },
                    { label: 'Recorded Footage', value: sessionDetail.recordings.length, color: 'text-blue-400', Icon: Film },
                    { label: 'Permanent Media', value: [...sessionDetail.evidence, ...sessionDetail.recordings].filter(m => (m as any).is_permanent).length, color: 'text-amber-400', Icon: Lock },
                    { label: 'Total Events', value: sessionDetail.events.length, color: 'text-emerald-400', Icon: Activity },
                  ].map(({ label, value, color, Icon }) => (
                    <div key={label} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                      <div>
                        <p className={`font-extrabold text-lg font-mono ${color}`}>{value}</p>
                        <p className="text-[10px] text-slate-500">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* sessionDetail not loaded yet but session selected */
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-2">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-slate-400">Select a session above to view its full report.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
