import React from 'react';
import { SessionReport } from '../../types/quiz';
import { exportService } from '../../services/export';
import { 
  X, 
  FileSpreadsheet, 
  FileText, 
  Trophy, 
  CheckCircle2, 
  Users, 
  BarChart3, 
  Clock 
} from 'lucide-react';

interface ReportViewerModalProps {
  report: SessionReport;
  onClose: () => void;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-20 rounded-t-2xl">
          <div>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
              PIN: {report.sessionPin}
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">{report.quizTitle}</h2>
            <p className="text-xs text-slate-500 font-medium">Host: {report.trainerName} • Date: {new Date(report.date).toLocaleString()}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => exportService.exportToExcel(report)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Excel
            </button>

            <button
              onClick={() => exportService.exportToPDF(report)}
              className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Download PDF
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center shadow-sm">
              <p className="text-xs uppercase font-bold text-slate-500">Total Participants</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{report.totalParticipants}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center shadow-sm">
              <p className="text-xs uppercase font-bold text-slate-500">Average Score</p>
              <p className="text-3xl font-black text-amber-600 mt-1">{report.averageScore} pts</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center shadow-sm">
              <p className="text-xs uppercase font-bold text-slate-500">Average Accuracy</p>
              <p className="text-3xl font-black text-emerald-600 mt-1">{report.averageAccuracy}%</p>
            </div>
          </div>

          {/* Participant Leaderboard Table */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Participant Leaderboard & Grades
            </h3>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Learner Name</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Correct / Total</th>
                    <th className="px-4 py-3 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.participantScores.map((p) => (
                    <tr key={p.participantId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-amber-600">#{p.rank}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{p.participantName}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{p.score} pts</td>
                      <td className="px-4 py-3 text-slate-500">{p.correctCount} / {p.totalCount}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{p.accuracyPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Question Breakdown Analysis */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Question Item Analysis
            </h3>

            <div className="space-y-3">
              {report.questionBreakdown.map((q) => (
                <div key={q.questionIndex} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      Q{q.questionIndex}: {q.questionText}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                      {q.accuracyPercent}% Correct
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap justify-between gap-2 pt-1 border-t border-slate-200">
                    <span>Correct Choice: <strong className="text-slate-800">{q.correctOptionText}</strong></span>
                    <span>Submissions: <strong className="text-slate-800">{q.totalSubmissions}</strong> • Avg Response Time: <strong className="text-amber-700 font-mono">{q.averageTimeSeconds}s</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
