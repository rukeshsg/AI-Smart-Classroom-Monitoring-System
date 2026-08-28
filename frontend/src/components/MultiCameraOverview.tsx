'use client';

import React from 'react';
import { Classroom, Alert } from '@/types';
import { getVideoFeedUrl } from '@/lib/api';
import { Video, Users, AlertTriangle, ExternalLink } from 'lucide-react';

interface MultiCameraOverviewProps {
  classrooms: Classroom[];
  activeAlerts: Alert[];
  onSelectClassroom: (id: string) => void;
}

export const MultiCameraOverview: React.FC<MultiCameraOverviewProps> = ({
  classrooms,
  activeAlerts,
  onSelectClassroom,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Multi-Camera Surveillance Overview</h2>
          <p className="text-xs text-slate-400">
            Real-time status and quick feed view for all configured classrooms and laboratories
          </p>
        </div>
        <span className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
          Total Cameras: {classrooms.length}
        </span>
      </div>

      {/* Grid of Classroom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classrooms.map((room) => {
          const roomAlerts = activeAlerts.filter((a) => a.classroom_id === room.id);
          const hasCritical = roomAlerts.some((a) => a.severity === 'HIGH');
          const isOnline = room.status === 'online';

          return (
            <div
              key={room.id}
              onClick={() => onSelectClassroom(room.id)}
              className={`group bg-slate-900 border rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] shadow-xl ${
                hasCritical
                  ? 'border-rose-600/70 shadow-rose-950/40'
                  : roomAlerts.length > 0
                  ? 'border-amber-500/50'
                  : 'border-slate-800 hover:border-blue-500/50'
              }`}
            >
              {/* Card Header */}
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                    <span>{room.id}</span>
                    <span className="text-xs font-normal text-slate-400">({room.name})</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">{room.building}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                    }`}
                  ></span>
                  <span className={`text-[11px] font-bold uppercase font-mono ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {room.status}
                  </span>
                </div>
              </div>

              {/* Video Thumbnail / Stream Preview */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {isOnline ? (
                  <img
                    src={getVideoFeedUrl(room.id)}
                    alt={`Preview ${room.id}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-center text-slate-600 py-8 text-xs font-mono">
                    <Video className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    CAMERA OFFLINE
                  </div>
                )}

                {/* Hover Quick Access Badge */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center space-x-1.5">
                    <span>OPEN FULL FEED</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Card Footer Metrics */}
              <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-1.5 text-slate-300">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Occupancy: 2-5</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <AlertTriangle className={`w-3.5 h-3.5 ${hasCritical ? 'text-rose-400 animate-bounce' : roomAlerts.length > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className={hasCritical ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    Alerts: {roomAlerts.length}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
