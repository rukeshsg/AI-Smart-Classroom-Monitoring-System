'use client';

import React, { useState, useEffect } from 'react';
import { Classroom, Event } from '@/types';
import { fetchEvents } from '@/lib/api';
import { Clock, Filter, Calendar } from 'lucide-react';

interface EventTimelineHistoryProps {
  classrooms: Classroom[];
  selectedClassroom: string;
}

export const EventTimelineHistory: React.FC<EventTimelineHistoryProps> = ({ classrooms, selectedClassroom }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filterRoom, setFilterRoom] = useState<string>(selectedClassroom);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      try {
        const data = await fetchEvents(filterRoom, dateFilter, typeFilter);
        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [filterRoom, dateFilter, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Event Timeline & Detection History</h2>
          <p className="text-xs text-slate-400">Chronological history log of all classroom behavior detections</p>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Classroom Filter
            </label>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg p-2.5"
            >
              <option value="">All Classrooms</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Date Filter
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Behavior Category Filter
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg p-2.5"
            >
              <option value="">All Behaviors</option>
              <option value="Fighting">Fighting</option>
              <option value="Sleeping">Sleeping</option>
              <option value="Using Phone">Using Phone</option>
              <option value="Reading">Reading</option>
              <option value="Writing">Writing</option>
              <option value="Hand Raising">Hand Raising</option>
              <option value="Eating">Eating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800 text-[11px]">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Classroom</th>
                <th className="px-4 py-3">Event / Behavior</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 font-sans">
                    No timeline events match the selected filters.
                  </td>
                </tr>
              ) : (
                events.map((evt) => {
                  const isFighting = (evt.event_type || '').toLowerCase() === 'fighting';
                  return (
                    <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-200">{evt.time}</td>
                      <td className="px-4 py-3 text-slate-400">{evt.date}</td>
                      <td className="px-4 py-3 font-bold text-blue-400">{evt.classroom_id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-100">{evt.event_type}</td>
                      <td className="px-4 py-3 text-emerald-400">{(evt.confidence * 100).toFixed(0)}%</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isFighting
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isFighting ? 'HIGH' : 'ROUTINE'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
