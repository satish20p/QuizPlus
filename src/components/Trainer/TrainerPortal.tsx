import React, { useState } from 'react';
import { User, Quiz, SessionReport } from '../../types/quiz';
import { storageService } from '../../services/storage';
import { exportService } from '../../services/export';
import { generateQuizWithAI } from '../../services/aiGenerator';
import { QuizEditorModal } from './QuizEditorModal';
import { 
  Plus, 
  Sparkles, 
  Play, 
  Edit3, 
  Copy, 
  Trash2, 
  FileSpreadsheet, 
  FileText, 
  Clock, 
  Users, 
  BookOpen, 
  Search, 
  BarChart3,
  Loader2,
  QrCode,
  Share2
} from 'lucide-react';

interface TrainerPortalProps {
  currentUser: User;
  quizzes: Quiz[];
  onQuizzesUpdate: (quizzes: Quiz[]) => void;
  reports: SessionReport[];
  onLaunchSession: (quiz: Quiz) => void;
  onViewReport: (report: SessionReport) => void;
}

export const TrainerPortal: React.FC<TrainerPortalProps> = ({
  currentUser,
  quizzes,
  onQuizzesUpdate,
  reports,
  onLaunchSession,
  onViewReport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'quizzes' | 'reports'>('quizzes');
  
  // Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  // AI Quiz Generator Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  const myQuizzes = quizzes.filter(q => q.authorId === currentUser.id || currentUser.role === 'admin');

  const filteredQuizzes = myQuizzes.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => {
    setEditingQuiz(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setIsEditorOpen(true);
  };

  const handleSaveQuiz = (savedQuiz: Quiz) => {
    const updated = storageService.saveQuiz(savedQuiz, currentUser);
    onQuizzesUpdate(updated);
    setIsEditorOpen(false);
  };

  const handleDuplicate = (quizId: string) => {
    const updated = storageService.duplicateQuiz(quizId, currentUser);
    onQuizzesUpdate(updated);
  };

  const handleDelete = (quizId: string) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      const updated = storageService.deleteQuiz(quizId, currentUser);
      onQuizzesUpdate(updated);
    }
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    setIsGeneratingAi(true);
    setAiError('');

    try {
      const generatedQuiz = await generateQuizWithAI(
        aiTopic.trim(),
        aiQuestionCount,
        currentUser.id,
        currentUser.name
      );
      const updated = storageService.saveQuiz(generatedQuiz, currentUser);
      onQuizzesUpdate(updated);
      setIsAiModalOpen(false);
      setAiTopic('');
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Failed to generate quiz with AI.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Trainer Authoring & Live Session Portal
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quiz Authoring Suite</h1>
          <p className="mt-2 text-slate-300 text-sm max-w-2xl">
            Design interactive MCQ quizzes with custom timers (10s to 220s), launch live QR code sessions, and download post-quiz grade reports in Excel and PDF formats.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            AI Quiz Assistant
          </button>

          <button
            onClick={handleCreateNew}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Quiz
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'quizzes'
                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            My Quizzes ({myQuizzes.length})
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Session Reports ({reports.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-300 text-slate-900 pl-9 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 placeholder:text-slate-400 shadow-sm"
          />
        </div>
      </div>

      {/* TAB 1: QUIZZES GRID */}
      {activeTab === 'quizzes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition space-y-5 group">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                    {quiz.category}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-mono font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {quiz.questions.length} MCQs
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-indigo-600 transition line-clamp-1">
                  {quiz.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {quiz.description}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-3 text-xs gap-2">
                <div>
                  <p className="text-slate-500 font-medium">Questions:</p>
                  <p className="font-bold text-slate-800">{quiz.questions.length}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Password:</p>
                  <p className="font-bold font-mono text-indigo-600 truncate">{quiz.password || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Hosted:</p>
                  <p className="font-bold text-emerald-600">{quiz.timesHosted || 0}</p>
                </div>
              </div>

              {/* Card Actions */}
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <button
                  onClick={() => onLaunchSession(quiz)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Launch Live Session (QR & Password)
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(quiz)}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-300 flex items-center justify-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDuplicate(quiz.id)}
                    className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs transition cursor-pointer border border-slate-300"
                    title="Duplicate Quiz"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs transition cursor-pointer border border-red-200"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* TAB 2: REPORTS & EXPORT SUITE */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Session Password</th>
                    <th className="px-6 py-3.5">Quiz Title</th>
                    <th className="px-6 py-3.5">Date Hosted</th>
                    <th className="px-6 py-3.5">Participants</th>
                    <th className="px-6 py-3.5">Avg Accuracy</th>
                    <th className="px-6 py-3.5 text-right">Download Reports</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-700">
                        {rep.sessionPassword}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {rep.quizTitle}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                        {new Date(rep.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800">
                        {rep.totalParticipants} Learners
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-emerald-600">{rep.averageAccuracy}%</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewReport(rep)}
                            className="bg-white hover:bg-slate-50 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 transition cursor-pointer shadow-sm"
                          >
                            View
                          </button>
                          <button
                            onClick={() => exportService.exportToExcel(rep)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                            title="Export Excel Report"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Excel
                          </button>
                          <button
                            onClick={() => exportService.exportToPDF(rep)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                            title="Export PDF Grade Report"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ EDITOR MODAL */}
      {isEditorOpen && (
        <QuizEditorModal
          quizToEdit={editingQuiz}
          onSave={handleSaveQuiz}
          onClose={() => setIsEditorOpen(false)}
          authorId={currentUser.id}
          authorName={currentUser.name}
        />
      )}

      {/* AI QUIZ GENERATOR MODAL */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">AI Quiz Assistant</h3>
                <p className="text-xs text-slate-500">Instantly generate structured MCQ quizzes using Gemini 2.5</p>
              </div>
            </div>

            <form onSubmit={handleGenerateAI} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic or Subject Area</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Cloud Architecture, Cybersecurity Essentials, React 19"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Questions</label>
                <select
                  value={aiQuestionCount}
                  onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value={3}>3 Questions (Quick Poll)</option>
                  <option value={5}>5 Questions (Standard Quiz)</option>
                  <option value={8}>8 Questions (Deep Dive)</option>
                </select>
              </div>

              {aiError && (
                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                  {aiError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  disabled={isGeneratingAi}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingAi}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Quiz
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
