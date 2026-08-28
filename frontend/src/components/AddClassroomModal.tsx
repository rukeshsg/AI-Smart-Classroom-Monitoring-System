'use client';

import React, { useState } from 'react';
import { addClassroom, AddClassroomPayload } from '@/lib/api';
import {
  Building2,
  Camera,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AddClassroomModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const FEED_TYPES = [
  { value: 'webcam', label: 'Webcam / USB Camera' },
  { value: 'rtsp', label: 'RTSP Stream' },
  { value: 'mjpeg', label: 'MJPEG HTTP Stream' },
  { value: 'file', label: 'Video File (Test)' },
];

const BUILDINGS = [
  'Building H', 'Building B', 'Building C', 'Building G',
  'Building J', 'Laboratory L', 'Other',
];

export const AddClassroomModal: React.FC<AddClassroomModalProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    // Classroom Identity
    id: '',
    name: '',
    building: 'Building H',
    floor: '',
    description: '',
    // Camera Config
    camera_name: '',
    camera_source: '0',
    feed_type: 'webcam',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateStep1 = (): string | null => {
    if (!form.id.trim()) return 'Classroom ID is required.';
    if (!/^[A-Za-z][A-Za-z0-9]{2,5}$/.test(form.id.trim()))
      return 'Classroom ID must be 3–6 alphanumeric characters starting with a letter (e.g. H305, L204).';
    if (!form.name.trim()) return 'Classroom name is required.';
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: AddClassroomPayload = {
        id: form.id.trim().toUpperCase(),
        name: form.name.trim(),
        building: form.building,
        floor: form.floor.trim() || undefined,
        description: form.description.trim() || undefined,
        camera_name: form.camera_name.trim() || `Camera ${form.id.trim().toUpperCase()}`,
        camera_source: form.camera_source.trim() || '0',
        feed_type: form.feed_type,
      };
      await addClassroom(payload);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to add classroom. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d1424] border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-sm uppercase tracking-widest">Add Classroom / Lab</h2>
              <p className="text-blue-200 text-xs">
                Step {step} of 2 — {step === 1 ? 'Classroom Identity' : 'Camera Configuration'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex border-b border-slate-800">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 py-2.5 text-center text-xs font-bold transition-colors ${
                step === s
                  ? 'bg-blue-600/20 text-blue-300 border-b-2 border-blue-500'
                  : step > s
                  ? 'text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              {step > s ? '✓ ' : `${s}. `}
              {s === 1 ? 'Classroom Identity' : 'Camera Setup'}
            </div>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {/* Success State */}
          {success ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-lg text-white">Classroom Added!</h3>
              <p className="text-sm text-slate-400">
                <strong className="text-white">{form.id.toUpperCase()}</strong> is now available across the Command Center.
              </p>
            </div>
          ) : step === 1 ? (
            /* ── Step 1: Classroom Identity ── */
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Classroom Information</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Classroom ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) => handleChange('id', e.target.value.toUpperCase())}
                    placeholder="e.g. H305, L204"
                    maxLength={6}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">3–6 chars, letter + numbers</p>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Floor</label>
                  <input
                    type="text"
                    value={form.floor}
                    onChange={(e) => handleChange('floor', e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Classroom Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Main Lecture Hall H305"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Building / Block</label>
                <select
                  value={form.building}
                  onChange={(e) => handleChange('building', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {BUILDINGS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Additional notes about this room..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          ) : (
            /* ── Step 2: Camera Setup ── */
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                <Camera className="w-4 h-4 text-blue-400" />
                <span>Camera / Feed Configuration</span>
              </div>

              {/* Summary of classroom */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 text-xs font-mono">
                <span className="text-blue-300 font-bold">{form.id.toUpperCase()}</span>
                <span className="text-slate-400 mx-2">—</span>
                <span className="text-slate-300">{form.name}</span>
                <span className="text-slate-500 ml-2">({form.building})</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Camera Name</label>
                <input
                  type="text"
                  value={form.camera_name}
                  onChange={(e) => handleChange('camera_name', e.target.value)}
                  placeholder={`Camera ${form.id.toUpperCase() || 'ROOM'}`}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Feed Type</label>
                <select
                  value={form.feed_type}
                  onChange={(e) => handleChange('feed_type', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {FEED_TYPES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Camera Source / Stream URL
                </label>
                <input
                  type="text"
                  value={form.camera_source}
                  onChange={(e) => handleChange('camera_source', e.target.value)}
                  placeholder={
                    form.feed_type === 'rtsp'
                      ? 'rtsp://192.168.1.x:554/stream'
                      : form.feed_type === 'mjpeg'
                      ? 'http://192.168.1.x:8080/video'
                      : '0'
                  }
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {form.feed_type === 'webcam' ? 'Index 0 = default webcam, 1 = second camera, etc.' : 'Enter the full stream URL for this camera.'}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-2 bg-rose-950/40 border border-rose-600/50 rounded-xl px-4 py-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          {!success && (
            <div className="flex items-center space-x-3 pt-2">
              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm border border-slate-700 transition-all"
                >
                  ← Back
                </button>
              )}
              {step === 1 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/25"
                >
                  Next: Camera Setup →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Adding...</span></>
                  ) : (
                    <><Plus className="w-4 h-4" /><span>Add Classroom</span></>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
