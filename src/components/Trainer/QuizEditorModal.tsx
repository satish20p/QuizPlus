import React, { useState } from 'react';
import { Quiz, Question, QuestionOption } from '../../types/quiz';
import { 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  Save, 
  X,
  SlidersHorizontal,
  FileText,
  Award,
  Code
} from 'lucide-react';

interface QuizEditorModalProps {
  quizToEdit: Quiz | null;
  onSave: (quiz: Quiz) => void;
  onClose: () => void;
  authorId: string;
  authorName: string;
}

export const QuizEditorModal: React.FC<QuizEditorModalProps> = ({
  quizToEdit,
  onSave,
  onClose,
  authorId,
  authorName
}) => {
  const [title, setTitle] = useState(quizToEdit?.title || '');
  const [description, setDescription] = useState(quizToEdit?.description || '');
  const [category, setCategory] = useState(quizToEdit?.category || 'Engineering & Tech');
  const [password, setPassword] = useState(quizToEdit?.password || Math.random().toString(36).substring(2, 8).toUpperCase());
  const [questions, setQuestions] = useState<Question[]>(
    quizToEdit?.questions.map((q) => ({
      ...q,
      marks: q.marks && q.marks >= 1 && q.marks <= 5 ? q.marks : 1,
      points: (q.marks && q.marks >= 1 && q.marks <= 5 ? q.marks : 1) * 200,
    })) || [
      {
        id: `q-${Date.now()}-1`,
        questionText: '',
        options: [
          { id: 'opt-a', text: '' },
          { id: 'opt-b', text: '' },
          { id: 'opt-c', text: '' },
          { id: 'opt-d', text: '' },
        ],
        correctOptionId: '', // Trainer must explicitly select the correct option
        explanation: '',
        timeLimitSeconds: 30, // Default 30s
        marks: 1, // Default 1 mark if not set
        points: 200,
      }
    ]
  );

  const handleAddQuestion = () => {
    const newQ: Question = {
      id: `q-${Date.now()}-${questions.length + 1}`,
      questionText: '',
      options: [
        { id: 'opt-a', text: '' },
        { id: 'opt-b', text: '' },
        { id: 'opt-c', text: '' },
        { id: 'opt-d', text: '' },
      ],
      correctOptionId: '', // Trainer selects correct option
      explanation: '',
      timeLimitSeconds: 30,
      marks: 1,
      points: 200,
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('Quiz must contain at least one question.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestion = (idx: number, updated: Question) => {
    const copy = [...questions];
    copy[idx] = updated;
    setQuestions(copy);
  };

  const handleOptionChange = (qIdx: number, optId: string, text: string) => {
    const q = questions[qIdx];
    const updatedOptions = q.options.map(opt => opt.id === optId ? { ...opt, text } : opt);
    handleUpdateQuestion(qIdx, { ...q, options: updatedOptions });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please provide a quiz title.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        alert(`Question #${i + 1} text is empty.`);
        return;
      }
      const emptyOpt = q.options.find(opt => !opt.text.trim());
      if (emptyOpt) {
        alert(`Question #${i + 1} has empty option fields.`);
        return;
      }
      if (!q.correctOptionId) {
        alert(`Question #${i + 1}: Please select which option (A, B, C, or D) is the right correct answer.`);
        return;
      }
    }

    // Ensure all questions have valid marks (defaults to 1 if not set)
    const processedQuestions = questions.map((q) => {
      const validMark = q.marks && q.marks >= 1 && q.marks <= 5 ? q.marks : 1;
      return {
        ...q,
        marks: validMark,
        points: validMark * 200,
      };
    });

    const newQuiz: Quiz = {
      id: quizToEdit?.id || `quiz-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      authorId,
      authorName,
      password: password.trim() || Math.random().toString(36).substring(2, 8).toUpperCase(),
      questions: processedQuestions,
      createdAt: quizToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: true,
      timesHosted: quizToEdit?.timesHosted || 0,
    };

    onSave(newQuiz);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-20 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {quizToEdit ? 'Edit MCQ Quiz' : 'Create New MCQ Quiz'}
              </h2>
              <p className="text-xs text-slate-500">Configure questions, answer choices, explanations & individual timers (10s - 240s in 10s steps)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto flex-1">
          
          {/* General Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quiz Title *</label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Modern Full-Stack Web Architecture 2026&#10;(Press Enter for new line)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                    e.stopPropagation();
                  }
                }}
                className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium whitespace-pre-wrap break-words max-h-32 overflow-y-auto"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
              >
                <option value="Engineering & Tech">Engineering & Tech</option>
                <option value="Corporate Security">Corporate Security</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Compliance & HR">Compliance & HR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quiz Password / Access Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. REACT2026"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 font-mono font-bold px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 uppercase"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Learners will enter this password to join the live session.</p>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Short Description</label>
              <textarea
                rows={2}
                placeholder="Brief summary of quiz scope for learners (Press Enter for new line)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                    e.stopPropagation();
                  }
                }}
                className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium whitespace-pre-wrap break-words max-h-32 overflow-y-auto"
              />
            </div>
          </div>

          {/* Question Authoring List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                Multiple Choice Questions ({questions.length})
              </h3>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>

            {questions.map((q, qIdx) => {
              const currentMarks = q.marks || (q.points ? Math.min(5, Math.max(1, Math.round(q.points / 200))) : 1);
              return (
              <div key={q.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm relative group">
                
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                      {qIdx + 1}
                    </span>
                    Question #{qIdx + 1}
                  </span>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Marks Selector (1 to 5 Marks) */}
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
                      <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-700 hidden sm:inline">Marks:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleUpdateQuestion(qIdx, { ...q, marks: m, points: m * 200 })}
                            className={`w-6 h-6 rounded-md text-xs font-bold transition cursor-pointer ${
                              currentMarks === m
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={`Assign ${m} mark${m > 1 ? 's' : ''} (${m * 200} pts)`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                      <span className="text-[11px] font-mono font-bold text-indigo-600 ml-1">
                        {currentMarks} {currentMarks === 1 ? 'Mark' : 'Marks'}
                      </span>
                    </div>

                    {/* Countdown Timer Control (10s to 240s) */}
                    <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-700 hidden sm:inline">Timer:</span>
                      <select
                        value={q.timeLimitSeconds}
                        onChange={(e) => handleUpdateQuestion(qIdx, { ...q, timeLimitSeconds: Number(e.target.value) })}
                        className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                      >
                        {Array.from({ length: 24 }, (_, i) => (i + 1) * 10).map((sec) => (
                          <option key={sec} value={sec}>
                            {sec}s
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text Prompt (Supports Code, Special Characters, Multiline & Auto-Resizes) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-indigo-600" />
                      Question Prompt *
                    </label>
                    <span className="text-[11px] text-slate-500 italic">
                      Enter key creates new line • Auto-expands & scrolls for long text
                    </span>
                  </div>
                  <textarea
                    required
                    rows={2}
                    placeholder="Enter question prompt... (Press Enter for new line. Math formulas, symbols < > & { } [ ] => $ % * or code snippets supported)"
                    value={q.questionText}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                        e.stopPropagation();
                      }
                    }}
                    onInput={(e: any) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 220)}px`;
                    }}
                    onChange={(e) => handleUpdateQuestion(qIdx, { ...q, questionText: e.target.value })}
                    className="w-full bg-white border border-slate-300 text-slate-900 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono whitespace-pre-wrap break-words max-h-56 overflow-y-auto resize-y min-h-[64px]"
                  />
                </div>

                {/* Options Grid (A, B, C, D) - Auto-expanding Textareas */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Answer Choices * (Click A, B, C, or D to mark correct answer)
                    </label>
                    {!q.correctOptionId ? (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        ⚠️ Select right option
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Correct option set
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, optIdx) => {
                      const labels = ['A', 'B', 'C', 'D'];
                      const isCorrect = q.correctOptionId === opt.id;
                      return (
                        <div
                          key={opt.id}
                          className={`flex items-start gap-2.5 p-2 rounded-xl border transition ${
                            isCorrect 
                              ? 'bg-emerald-50 border-emerald-300 text-slate-900 ring-2 ring-emerald-400' 
                              : 'bg-white border-slate-300 text-slate-800 hover:border-indigo-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestion(qIdx, { ...q, correctOptionId: opt.id })}
                            className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer transition mt-0.5 ${
                              isCorrect 
                                ? 'bg-emerald-600 text-white font-black shadow-md' 
                                : 'bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white'
                            }`}
                            title="Click to select this as the right correct answer"
                          >
                            {labels[optIdx]}
                          </button>

                          <textarea
                            required
                            rows={1}
                            placeholder={`Option ${labels[optIdx]} text (Press Enter for new line)...`}
                            value={opt.text}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                                e.stopPropagation();
                              }
                            }}
                            onInput={(e: any) => {
                              e.target.style.height = 'auto';
                              e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                            }}
                            onChange={(e) => handleOptionChange(qIdx, opt.id, e.target.value)}
                            className="w-full bg-transparent text-sm focus:outline-none text-slate-900 font-medium font-mono whitespace-pre-wrap break-words max-h-36 overflow-y-auto resize-y min-h-[38px] py-1"
                          />

                          <button
                            type="button"
                            onClick={() => handleUpdateQuestion(qIdx, { ...q, correctOptionId: opt.id })}
                            className={`text-xs px-2 py-1 rounded-md shrink-0 font-semibold cursor-pointer transition mt-0.5 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white flex items-center gap-1'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Correct
                              </>
                            ) : (
                              'Mark Correct'
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Answer Explanation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Explanation (Displayed to learners upon answer reveal)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Concise explanation why the correct choice is right (Press Enter for new line)..."
                    value={q.explanation}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                        e.stopPropagation();
                      }
                    }}
                    onInput={(e: any) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                    }}
                    onChange={(e) => handleUpdateQuestion(qIdx, { ...q, explanation: e.target.value })}
                    className="w-full bg-white border border-slate-300 text-slate-800 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono whitespace-pre-wrap break-words max-h-40 overflow-y-auto resize-y min-h-[48px]"
                  />
                </div>

              </div>
            );
          })}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Another Question
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Quiz
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
