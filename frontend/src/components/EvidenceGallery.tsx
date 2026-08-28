'use client';

import React, { useState, useEffect } from 'react';
import { Classroom, Evidence } from '@/types';
import { fetchEvidence, deleteEvidence, togglePermanentEvidence } from '@/lib/api';
import { Image as ImageIcon, Trash2, ShieldCheck, ShieldAlert, Eye, X, CheckSquare, Square } from 'lucide-react';

interface EvidenceGalleryProps {
  classrooms: Classroom[];
  selectedClassroom: string;
}

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({ classrooms, selectedClassroom }) => {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [filterRoom, setFilterRoom] = useState<string>(selectedClassroom);
  const [previewItem, setPreviewItem] = useState<Evidence | null>(null);

  // Multi-select for deletion
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const loadData = async () => {
    try {
      const data = await fetchEvidence(filterRoom);
      setEvidenceList(data);
    } catch (err) {
      console.error('Error fetching evidence:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterRoom]);

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleTogglePermanent = async (item: Evidence) => {
    const newStatus = !item.is_permanent;
    const ok = await togglePermanentEvidence(item.id, newStatus);
    if (ok) {
      setEvidenceList((prev) =>
        prev.map((ev) => (ev.id === item.id ? { ...ev, is_permanent: newStatus } : ev))
      );
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteEvidence(itemToDelete);
      setEvidenceList((prev) => prev.filter((ev) => ev.id !== itemToDelete));
      setItemToDelete(null);
    } else if (selectedIds.length > 0) {
      for (const id of selectedIds) {
        await deleteEvidence(id);
      }
      setEvidenceList((prev) => prev.filter((ev) => !selectedIds.includes(ev.id)));
      setSelectedIds([]);
    }
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Bulk Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Evidence Screenshot Gallery</h2>
          <p className="text-xs text-slate-400">
            Automatically captured high-priority surveillance screenshots with AI bounding overlays
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

      {/* Evidence Cards Grid */}
      {evidenceList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 shadow-xl">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-slate-300">No Evidence Screenshots Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Screenshots are automatically captured when a high-priority behavior event occurs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {evidenceList.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isPermanent = item.is_permanent;

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition-all ${
                  isSelected ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Image Container with Select Checkbox & Permanent Badge */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden group">
                  <img
                    src={`${apiBase}${item.image_path}`}
                    alt={item.event_type}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />

                  {/* Multi-select checkbox */}
                  <button
                    onClick={() => handleToggleSelect(item.id)}
                    className="absolute top-2 left-2 p-1.5 bg-slate-950/80 backdrop-blur-md rounded-lg text-white"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {/* Permanent Protection Badge */}
                  {isPermanent && (
                    <span className="absolute top-2 right-2 bg-emerald-600/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-md">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Protected</span>
                    </span>
                  )}

                  {/* Preview Hover Action */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="p-2 bg-blue-600 text-white rounded-xl shadow-lg flex items-center space-x-1 text-xs font-bold"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>

                {/* Card Metadata */}
                <div className="p-4 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{item.event_type}</span>
                    <span className="text-blue-400 font-bold">{item.classroom_id}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>{item.date}</span>
                    <span>{item.time}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Confidence: <strong className="text-emerald-400">{(item.confidence * 100).toFixed(0)}%</strong>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
                  <button
                    onClick={() => handleTogglePermanent(item)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] border transition-colors ${
                      isPermanent
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    title={isPermanent ? 'Item protected from 60-day auto deletion' : 'Mark to Keep Forever'}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isPermanent ? 'Keep Forever' : 'Save Permanent'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setItemToDelete(item.id);
                      setShowDeleteModal(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                    title="Delete evidence screenshot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Resolution Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-5 relative space-y-4 shadow-2xl">
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <span className="font-bold text-lg text-white">{previewItem.event_type}</span>
              <span className="bg-blue-600 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-md">
                {previewItem.classroom_id}
              </span>
            </div>

            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
              <img
                src={`${apiBase}${previewItem.image_path}`}
                alt={previewItem.event_type}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800 pt-3">
              <div>
                Date: <strong className="text-white">{previewItem.date}</strong> | Time:{' '}
                <strong className="text-white">{previewItem.time}</strong>
              </div>
              <div>
                Confidence: <strong className="text-emerald-400">{(previewItem.confidence * 100).toFixed(0)}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-600/20 text-rose-500 mx-auto flex items-center justify-center border border-rose-600/40">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Confirm Permanent Deletion</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete {itemToDelete ? 'this evidence item' : `${selectedIds.length} selected evidence items`}? This action cannot be undone.
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
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
