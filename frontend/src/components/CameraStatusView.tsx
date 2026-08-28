'use client';

import React, { useState } from 'react';
import { Classroom } from '@/types';
import { MonitorCheck, Camera, CheckCircle2, XCircle, Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { AddClassroomModal } from '@/components/AddClassroomModal';

interface CameraStatusViewProps {
  classrooms: Classroom[];
  onClassroomAdded?: () => void;
}

export const CameraStatusView: React.FC<CameraStatusViewProps> = ({ classrooms, onClassroomAdded }) => {
  const [showAddModal, setShowAddModal] = useState(false);

  const onlineCount = classrooms.filter((c) => c.status === 'online').length;
  const offlineCount = classrooms.filter((c) => c.status !== 'online').length;

  const handleAddSuccess = () => {
    onClassroomAdded?.();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Camera Health &amp; Network Status</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time connection status for all configured classroom surveillance cameras
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Classroom / Lab</span>
        </button>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/15 rounded-xl text-blue-400">
            <MonitorCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Cameras</p>
            <p className="text-xl font-extrabold text-white">{classrooms.length}</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/15 rounded-xl text-emerald-400">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Online</p>
            <p className="text-xl font-extrabold text-emerald-400">{onlineCount}</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${offlineCount > 0 ? 'bg-rose-500/15 text-rose-400' : 'bg-slate-800 text-slate-500'}`}>
            <WifiOff className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Offline</p>
            <p className={`text-xl font-extrabold ${offlineCount > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
              {offlineCount}
            </p>
          </div>
        </div>
      </div>

      {/* Camera Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Configured Surveillance Cameras
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {classrooms.length} device{classrooms.length !== 1 ? 's' : ''} registered
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/50 text-slate-400 uppercase font-mono border-b border-slate-800 text-[11px]">
              <tr>
                <th className="px-5 py-3">Camera ID</th>
                <th className="px-5 py-3">Classroom ID</th>
                <th className="px-5 py-3">Name / Location</th>
                <th className="px-5 py-3">Building</th>
                <th className="px-5 py-3">Stream Protocol</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {classrooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    No classrooms configured. Click &quot;Add Classroom&quot; to get started.
                  </td>
                </tr>
              ) : (
                classrooms.map((room) => {
                  const isOnline = room.status === 'online';
                  return (
                    <tr key={room.id} className={`hover:bg-slate-800/40 transition-colors ${!isOnline ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-4 font-bold text-slate-200 flex items-center space-x-2">
                        <Camera className="w-3.5 h-3.5 text-slate-500" />
                        <span>CAM-{room.id}</span>
                      </td>
                      <td className="px-5 py-4 font-bold text-blue-400">{room.id}</td>
                      <td className="px-5 py-4 text-slate-300">{room.name}</td>
                      <td className="px-5 py-4 text-slate-400">{room.building}</td>
                      <td className="px-5 py-4 text-slate-400">RTSP / MJPEG</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-2">
                          {isOnline ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-emerald-400 font-bold uppercase">ONLINE</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-slate-600" />
                              <span className="text-slate-500 font-bold uppercase">OFFLINE</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Classroom Modal */}
      {showAddModal && (
        <AddClassroomModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
};
