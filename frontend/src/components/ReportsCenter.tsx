'use client';

import React, { useState } from 'react';
import { Classroom } from '@/types';
import { generatePdfReport } from '@/lib/api';
import { FileText, Download, CheckCircle, Loader2 } from 'lucide-react';

interface ReportsCenterProps {
  classrooms: Classroom[];
  selectedClassroom: string;
}

export const ReportsCenter: React.FC<ReportsCenterProps> = ({ classrooms, selectedClassroom }) => {
  const [reportRoom, setReportRoom] = useState(selectedClassroom);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedUrl(null);
    try {
      const res = await generatePdfReport(reportRoom, reportDate);
      if (res.report_url) {
        setGeneratedUrl(res.report_url);
      }
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-100">PDF Surveillance & Monitoring Reports</h2>
        <p className="text-xs text-slate-400">
          Generate official PDF reports containing classroom occupancy statistics, behavior event breakdown, critical alerts, and captured evidence screenshots.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
        <h3 className="text-base font-bold text-slate-200">Configure Report Parameters</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Select Classroom / Lab
            </label>
            <select
              value={reportRoom}
              onChange={(e) => setReportRoom(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm font-semibold rounded-lg p-3"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Surveillance Report Date
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm font-semibold rounded-lg p-2.5"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm px-6 py-3 rounded-lg shadow-lg flex items-center justify-center space-x-2 transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>GENERATING PDF REPORT...</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              <span>GENERATE OFFICIAL PDF REPORT</span>
            </>
          )}
        </button>

        {generatedUrl && (
          <div className="bg-emerald-950/60 border border-emerald-600/60 p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-sm font-bold text-emerald-200">PDF Report Generated Successfully</p>
                <p className="text-xs text-emerald-300/80">Classroom: {reportRoom} | Date: {reportDate}</p>
              </div>
            </div>
            <a
              href={`${apiBase}/api/reports/download/${generatedUrl.split('/').pop()}`}
              download
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD PDF</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
