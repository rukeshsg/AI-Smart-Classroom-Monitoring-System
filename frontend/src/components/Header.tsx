'use client';

import React, { useState } from 'react';
import { Shield, Bell, Search, Maximize2, User, X, Check, AlertTriangle } from 'lucide-react';
import { Classroom, Alert } from '@/types';

interface HeaderProps {
  classrooms: Classroom[];
  selectedClassroom: string;
  setSelectedClassroom: (id: string) => void;
  activeAlerts: Alert[];
  onDismissAlert?: (id: string) => void;
  showLiveContext?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  classrooms,
  selectedClassroom,
  setSelectedClassroom,
  activeAlerts,
  onDismissAlert,
  showLiveContext = true,
}) => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAlertDropdown, setShowAlertDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const currentRoom = classrooms.find((c) => c.id === selectedClassroom) || classrooms[0];
  const buildingLetter = selectedClassroom ? selectedClassroom.charAt(0) : 'H';
  const roomNumber = selectedClassroom ? selectedClassroom.substring(1) : '305';

  const filteredClassrooms = classrooms.filter(
    (c) => c.id.toLowerCase().includes(searchQuery.toLowerCase()) || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between text-white select-none shadow-md z-30 relative">
      {/* Left: Brand Identity */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-md text-white">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-wider text-slate-100 uppercase">
            Command Center
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">
            Smart Classroom Monitoring System
          </p>
        </div>
      </div>

      {/* Center: Contextual Classroom Bar (ONLY SHOWN ON LIVE & MULTI-CAMERA VIEWS) */}
      {showLiveContext && (
        <div className="hidden md:flex items-center space-x-3 bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-1.5 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-semibold">Classroom</span>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white font-bold rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id}
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center space-x-1.5 font-mono">
            <span className="text-slate-400">Floor</span>
            <span className="bg-slate-800 text-slate-200 font-bold px-2 py-0.5 rounded border border-slate-700">
              {buildingLetter}
            </span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center space-x-1.5 font-mono">
            <span className="text-slate-400">Room</span>
            <span className="bg-slate-800 text-slate-200 font-bold px-2 py-0.5 rounded border border-slate-700">
              {roomNumber}
            </span>
          </div>

          <span className="text-slate-700">|</span>

          {/* Live Status Badge */}
          <div className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Live</span>
          </div>
        </div>
      )}

      {/* Right: Functional Header Icons */}
      <div className="flex items-center space-x-4">
        {/* Search Icon & Action */}
        <button
          onClick={() => setShowSearchModal(true)}
          title="Search Classrooms & Devices"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Fullscreen Icon & Action */}
        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }}
          title="Toggle Fullscreen View"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Active Alerts Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertDropdown(!showAlertDropdown)}
            title="View Active Notifications"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {activeAlerts.length > 0 && (
              <span className="absolute top-1 right-1 bg-rose-500 text-white font-mono font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showAlertDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">Active Notifications</h3>
                <button onClick={() => setShowAlertDropdown(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                {activeAlerts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No active alert notifications.</div>
                ) : (
                  activeAlerts.map((alt) => (
                    <div key={alt.id} className="p-3 flex items-start justify-between hover:bg-slate-800/40 text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{alt.title}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {alt.classroom_id} | {alt.time}
                        </p>
                      </div>
                      {onDismissAlert && (
                        <button
                          onClick={() => onDismissAlert(alt.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="Dismiss notification"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <span className="text-slate-800">|</span>

        {/* Admin Profile Modal Trigger */}
        <button
          onClick={() => setShowProfileModal(true)}
          className="flex items-center space-x-3 text-left hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:block text-left text-xs">
            <p className="font-bold text-slate-200">Admin</p>
            <p className="text-[10px] text-slate-400">Administrator</p>
          </div>
        </button>
      </div>

      {/* Interactive Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">Search Command Center</h3>
              <button onClick={() => setShowSearchModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Search classroom ID (e.g., H305, L204)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredClassrooms.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedClassroom(c.id);
                    setShowSearchModal(false);
                  }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl cursor-pointer flex items-center justify-between text-xs border border-slate-800"
                >
                  <span className="font-bold text-blue-400">{c.id}</span>
                  <span className="text-slate-400">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-600 mx-auto flex items-center justify-center text-white text-xl font-bold">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">System Administrator</h3>
              <p className="text-xs text-slate-400">admin@smartclassroom.edu</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left text-xs font-mono space-y-1">
              <p className="text-slate-400">Role: <span className="text-emerald-400 font-bold">Super Admin</span></p>
              <p className="text-slate-400">Scope: <span className="text-blue-400 font-bold">Full Access</span></p>
            </div>
            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
