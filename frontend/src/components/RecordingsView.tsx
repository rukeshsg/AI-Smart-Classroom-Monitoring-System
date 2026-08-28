'use client';

import React, { useState, useEffect } from 'react';
import { Classroom, Recording } from '@/types';
import { fetchRecordings, deleteRecording, togglePermanentRecording } from '@/lib/api';
import { Film, Download, Play, Trash2, ShieldCheck, X, CheckSquare, Square, Video } from 'lucide-react';

interface RecordingsViewProps {
  classrooms: Classroom[];
  selectedClassroom: string;
}

export const RecordingsView: React.FC<RecordingsViewProps> = ({ classrooms, selectedClassroom }) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filterRoom, setFilterRoom] = useState<string>(selectedClassroom);
  const [playingVideo, setPlayingVideo] = useState<Recording | null>(null);

  // Multi-select deletion
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const loadRecordings = async () => {
    try {
      const data = await fetchRecordings(filterRoom);
      setRecordings(data);
    } catch (err) {
      console.error('Error fetching recordings:', err);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, [filterRoom]);

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleTogglePermanent = async (rec: Recording) => {
    const newStatus = !rec.is_permanent;
    const ok = await togglePermanentRecording(rec.id, newStatus);
    if (ok) {
      setRecordings((prev) =>
        prev.map((r) => (r.id === rec.id ? { ...r, is_permanent: newStatus } : r))
      );
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteRecording(itemToDelete);
      setRecordings((prev) => prev.filter((r) => r.id !== itemToDelete));
      setItemToDelete(null);
    } else if (selectedIds.length > 0) {
      for (const id of selectedIds) {
        await deleteRecording(id);
      }
      setRecordings((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
    }
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Recorded Session Footage</h2>
          <p className="text-xs text-slate-400">
            Access, play back, download, and protect recorded surveillance session MP4 video files
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-100 text-sm font-semibold rounded-xl px-4 py-2"
          >
            <option value="">All Classrooms</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} - {c.name}
              </option>
            ))}
          </select>

          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                setItemToDelete(null);
                setShowDeleteModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-2 shadow-md"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Recordings Table / Grid */}
      {recordings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 shadow-xl">
          <Film className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-slate-300">No Session Recordings Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Click "Start Recording" on the Live Feed or Multi-Camera overview to record session footage.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="px-4 py-3 text-center">Select</th>
                  <th className="px-5 py-3">Classroom</th>
                  <th className="px-5 py-3">Recording Type</th>
                  <th className="px-5 py-3">File Name</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Recorded At</th>
                  <th className="px-5 py-3">Retention Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {recordings.map((rec) => {
                  const filename = rec.file_path.split('/').pop() || rec.file_path;
                  const isSelected = selectedIds.includes(rec.id);
                  const isPermanent = rec.is_permanent;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => handleToggleSelect(rec.id)} className="text-slate-400 hover:text-white">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-5 py-4 font-bold text-blue-400">{rec.classroom_id}</td>
                      <td className="px-5 py-4">
                        <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[11px] px-2.5 py-1 rounded-md font-semibold">
                          {rec.recording_type || 'Single Camera'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-200">{filename}</td>
                      <td className="px-5 py-4 text-emerald-400 font-bold">
                        {rec.duration_seconds ? `${rec.duration_seconds}s` : '15s'}
                      </td>
                      <td className="px-5 py-4 text-slate-400">{rec.created_at}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleTogglePermanent(rec)}
                          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                            isPermanent
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{isPermanent ? 'Keep Forever' : 'Save Permanent'}</span>
                        </button>
                      </td>
                      <td className="px-5 py-4 flex items-center space-x-2">
                        <button
                          onClick={() => setPlayingVideo(rec)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Watch</span>
                        </button>
                        <a
                          href={`${apiBase}/api/recordings/download/${filename}`}
                          download
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border border-slate-700"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => {
                            setItemToDelete(rec.id);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-5 relative space-y-4 shadow-2xl">
            <button
              onClick={() => setPlayingVideo(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg text-white">
              Recorded Footage — {playingVideo.classroom_id} ({playingVideo.recording_type || 'Single Camera'})
            </h3>

            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
              <video
                src={`${apiBase}${playingVideo.file_path}`}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Professional Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-600/20 text-rose-500 mx-auto flex items-center justify-center border border-rose-600/40">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Confirm Permanent Deletion</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete {itemToDelete ? 'this session recording' : `${selectedIds.length} selected recordings`}? The MP4 file will be deleted permanently.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-lg"
              >
                Delete Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
