import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { LiveSession, Quiz, Question, SessionReport } from '../../types/quiz';
import { storageService } from '../../services/storage';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Eye, 
  Trophy, 
  ChevronRight, 
  Users, 
  Clock, 
  QrCode, 
  Share2, 
  Copy, 
  Check, 
  Radio, 
  Award, 
  BarChart3,
  XCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface LiveHostViewProps {
  session: LiveSession;
  quiz: Quiz;
  onUpdateSession: (session: LiveSession) => void;
  onEndSession: (report: SessionReport) => void;
}

export const LiveHostView: React.FC<LiveHostViewProps> = ({
  session,
  quiz,
  onUpdateSession,
  onEndSession
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const currentQ: Question | undefined = quiz.questions[session.currentQuestionIndex];

  // Timer countdown hook for host master state
  useEffect(() => {
    let timer: any = null;
    if (session.isTimerRunning && session.questionTimeRemaining > 0 && session.state === 'question_active') {
      timer = setInterval(() => {
        const nextTime = session.questionTimeRemaining - 1;
        if (nextTime <= 0) {
          // Timer expired: Automatically close question
          onUpdateSession({
            ...session,
            questionTimeRemaining: 0,
            isTimerRunning: false,
            state: 'question_closed'
          });
        } else {
          onUpdateSession({
            ...session,
            questionTimeRemaining: nextTime
          });
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [session, onUpdateSession]);

  const joinUrl = `${window.location.origin}?pin=${session.pin}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartQuiz = () => {
    onUpdateSession({
      ...session,
      state: 'question_active',
      currentQuestionIndex: 0,
      questionStartTime: Date.now(),
      questionTimeRemaining: quiz.questions[0]?.timeLimitSeconds || 30,
      isTimerRunning: true
    });
  };

  const handleToggleTimer = () => {
    onUpdateSession({
      ...session,
      isTimerRunning: !session.isTimerRunning
    });
  };

  const handleResetTimer = () => {
    onUpdateSession({
      ...session,
      questionTimeRemaining: currentQ?.timeLimitSeconds || 30,
      isTimerRunning: false
    });
  };

  const handleCloseQuestion = () => {
    onUpdateSession({
      ...session,
      state: 'question_closed',
      isTimerRunning: false
    });
  };

  const handleRevealAnswer = () => {
    onUpdateSession({
      ...session,
      state: 'answer_revealed'
    });
  };

  const handleShowLeaderboard = () => {
    onUpdateSession({
      ...session,
      state: 'leaderboard'
    });
  };

  const handleNextQuestion = () => {
    const nextIdx = session.currentQuestionIndex + 1;
    if (nextIdx < quiz.questions.length) {
      onUpdateSession({
        ...session,
        currentQuestionIndex: nextIdx,
        state: 'question_active',
        questionStartTime: Date.now(),
        questionTimeRemaining: quiz.questions[nextIdx].timeLimitSeconds,
        isTimerRunning: true
      });
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = () => {
    const participantsList = Object.values(session.participants || {});
    const sortedParticipants = [...participantsList].sort((a, b) => b.score - a.score);

    const participantScores = sortedParticipants.map((p, idx) => ({
      participantId: p.id,
      participantName: p.name,
      prn: p.prn,
      score: p.score,
      correctCount: p.correctAnswersCount,
      totalCount: quiz.questions.length,
      accuracyPercent: Math.round((p.correctAnswersCount / (quiz.questions.length || 1)) * 100),
      rank: idx + 1
    }));

    // Question analytics
    const questionBreakdown = quiz.questions.map((q, qIdx) => {
      const qSubmissions = session.submissions.filter(s => s.questionId === q.id);
      const correctSubs = qSubmissions.filter(s => s.isCorrect);
      const correctOptText = q.options.find(o => o.id === q.correctOptionId)?.text || '';
      const avgTime = qSubmissions.length > 0 
        ? Math.round((qSubmissions.reduce((acc, curr) => acc + curr.timeTakenSeconds, 0) / qSubmissions.length) * 10) / 10 
        : 0;

      return {
        questionIndex: qIdx + 1,
        questionText: q.questionText,
        correctOptionText: correctOptText,
        totalSubmissions: qSubmissions.length,
        correctCount: correctSubs.length,
        accuracyPercent: qSubmissions.length > 0 ? Math.round((correctSubs.length / qSubmissions.length) * 100) : 0,
        averageTimeSeconds: avgTime
      };
    });

    const totalScoreSum = participantScores.reduce((acc, p) => acc + p.score, 0);
    const avgScore = participantScores.length > 0 ? Math.round(totalScoreSum / participantScores.length) : 0;
    const avgAccuracy = participantScores.length > 0 
      ? Math.round(participantScores.reduce((acc, p) => acc + p.accuracyPercent, 0) / participantScores.length) 
      : 0;

    const report: SessionReport = {
      id: `rep-${Date.now()}`,
      sessionPin: session.pin,
      quizId: quiz.id,
      quizTitle: quiz.title,
      trainerName: session.trainerName,
      date: new Date().toISOString(),
      totalParticipants: participantsList.length,
      averageScore: avgScore,
      averageAccuracy: avgAccuracy,
      participantScores,
      questionBreakdown
    };

    storageService.saveReport(report);

    onUpdateSession({
      ...session,
      state: 'ended',
      isTimerRunning: false,
      endedAt: new Date().toISOString()
    });

    onEndSession(report);
  };

  // Submission analytics for current question
  const currentSubmissions = session.submissions.filter(s => s.questionId === currentQ?.id);
  const totalConnected = Object.keys(session.participants || {}).length;

  const optionCounts: Record<string, number> = {};
  currentQ?.options.forEach(opt => { optionCounts[opt.id] = 0; });
  currentSubmissions.forEach(sub => {
    if (optionCounts[sub.selectedOptionId] !== undefined) {
      optionCounts[sub.selectedOptionId]++;
    }
  });

  const participantList = Object.values(session.participants || {}).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Session Control Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Live Session Active
            </span>
            <span className="text-xs text-slate-400 font-medium">Host: {session.trainerName}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white">{session.quizTitle}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-indigo-300 font-bold flex items-center gap-2">
              <span className="text-slate-500">PIN:</span>
              <span className="text-lg tracking-widest text-white">{session.pin}</span>
            </div>

            <button
              onClick={handleCopyLink}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer font-semibold border border-slate-700"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              {copiedLink ? 'Copied Link!' : 'Copy Share Link'}
            </button>

            <button
              onClick={() => setShowQrModal(true)}
              className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              <QrCode className="w-4 h-4 text-indigo-400" />
              QR Code
            </button>
          </div>
        </div>

        {/* Connected Learners Counter */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Connected Learners</p>
            <p className="text-3xl font-black text-white">{totalConnected}</p>
          </div>
        </div>

      </div>

      {/* MASTER ACTION DRIVER TOOLBAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        
        <div className="flex items-center gap-2">
          {session.state === 'lobby' && (
            <button
              onClick={handleStartQuiz}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              START QUIZ
            </button>
          )}

          {session.state === 'question_active' && (
            <>
              <button
                onClick={handleToggleTimer}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                {session.isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {session.isTimerRunning ? 'Pause Timer' : 'Resume Timer'}
              </button>

              <button
                onClick={handleResetTimer}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-700"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handleCloseQuestion}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <XCircle className="w-4 h-4" />
                Stop Submissions
              </button>
            </>
          )}

          {session.state === 'question_closed' && (
            <button
              onClick={handleRevealAnswer}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <Eye className="w-5 h-5" />
              REVEAL CORRECT ANSWER
            </button>
          )}

          {session.state === 'answer_revealed' && (
            <button
              onClick={handleShowLeaderboard}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <Trophy className="w-5 h-5 text-amber-300" />
              SHOW LEADERBOARD
            </button>
          )}

          {session.state === 'leaderboard' && (
            <button
              onClick={handleNextQuestion}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
              {session.currentQuestionIndex + 1 < quiz.questions.length ? 'NEXT QUESTION' : 'FINISH QUIZ'}
            </button>
          )}
        </div>

        <button
          onClick={handleFinishQuiz}
          className="bg-slate-800 hover:bg-red-950 text-red-400 hover:text-red-300 px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
        >
          End Live Session
        </button>

      </div>

      {/* LOBBY VIEW (Waiting for Learners) */}
      {session.state === 'lobby' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-inner">
              <Radio className="w-10 h-10 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white">Waiting for Participants to Join...</h2>
            <p className="text-slate-400 text-sm">
              Direct participants to scan the QR code or enter PIN <span className="font-mono text-indigo-300 font-bold">{session.pin}</span> at <span className="font-mono text-white">{window.location.origin}</span>.
            </p>
          </div>

          {/* Participant Avatars Grid */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 max-w-2xl mx-auto space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Joined Participants ({totalConnected})
            </h3>

            {totalConnected === 0 ? (
              <p className="text-xs text-slate-500 py-4">No learners connected yet. Waiting for entrance...</p>
            ) : (
              <div className="flex flex-wrap justify-center gap-3 py-2">
                {participantList.map((p) => (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold text-white shadow-md animate-bounce">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUESTION ACTIVE / CLOSED / REVEALED DISPLAY */}
      {currentQ && session.state !== 'lobby' && session.state !== 'ended' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Question & Submissions Panel */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  Question {session.currentQuestionIndex + 1} of {quiz.questions.length}
                </span>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  {currentQ.marks || (currentQ.points ? Math.min(5, Math.max(1, Math.round(currentQ.points / 200))) : 1)} {(currentQ.marks || 1) === 1 ? 'Mark' : 'Marks'}
                </span>
              </div>

              {/* Countdown Timer Gauge */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-black border ${
                session.questionTimeRemaining > 10 
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' 
                  : 'bg-red-950/40 text-red-400 border-red-500/30 animate-pulse'
              }`}>
                <Clock className="w-5 h-5" />
                <span>{session.questionTimeRemaining}s</span>
              </div>
            </div>

            <div className="text-lg sm:text-xl font-mono font-extrabold text-white leading-relaxed bg-slate-950/70 border border-slate-800 p-4 rounded-xl whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
              {currentQ.questionText}
            </div>

            {/* Submissions Counter */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Submissions Status:</span>
              <span className="text-sm font-extrabold text-indigo-300">
                {currentSubmissions.length} of {totalConnected} Responses Locked
              </span>
            </div>

            {/* Answer Choices Distribution Bar Chart */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Live Response Distribution
              </h3>

              <div className="space-y-3">
                {currentQ.options.map((opt, optIdx) => {
                  const labels = ['A', 'B', 'C', 'D'];
                  const count = optionCounts[opt.id] || 0;
                  const pct = currentSubmissions.length > 0 
                    ? Math.round((count / currentSubmissions.length) * 100) 
                    : 0;
                  const isCorrectOpt = opt.id === currentQ.correctOptionId;
                  const isRevealed = session.state === 'answer_revealed' || session.state === 'leaderboard';

                  return (
                    <div 
                      key={opt.id} 
                      className={`p-3 rounded-xl border transition ${
                        isRevealed && isCorrectOpt 
                          ? 'bg-emerald-950/40 border-emerald-500/60 text-white ring-2 ring-emerald-500/30' 
                          : 'bg-slate-950 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <span className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                            isRevealed && isCorrectOpt ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {labels[optIdx]}
                          </span>
                          <span className="font-mono whitespace-pre-wrap break-words max-h-28 overflow-y-auto block">{opt.text}</span>
                        </span>
                        <span>{count} votes ({pct}%)</span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            isRevealed && isCorrectOpt ? 'bg-emerald-400' : 'bg-indigo-500'
                          }`} 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Correct Explanation Panel (Revealed State) */}
            {(session.state === 'answer_revealed' || session.state === 'leaderboard') && (
              <div className="bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-xl space-y-1">
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Correct Explanation:
                </p>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            )}

          </div>

          {/* Side Panel: Live Leaderboard Snapshot */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Live Participant Standings
            </h3>

            <div className="space-y-2">
              {participantList.slice(0, 8).map((p, idx) => (
                <div key={p.id} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center text-xs ${
                      idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-white">{p.name}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-300">{p.score} pts</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ENDED QUIZ SESSION: TOP 5 LEADERSHIP BOARD & RECORDS BANNER */}
      {session.state === 'ended' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Quiz Completed — Final Top 5 Leadership Board</h2>
                <p className="text-xs text-slate-400">All learner records & PRNs saved into database for report generation</p>
              </div>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Report Saved
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {participantList.slice(0, 5).map((p, idx) => (
                <div key={p.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center space-y-2 relative overflow-hidden">
                  <span className={`text-xl font-black ${
                    idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-white text-sm truncate">{p.name}</h4>
                    <p className="text-[11px] font-mono text-indigo-400 font-bold truncate">
                      PRN: {p.prn || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-900 py-1.5 px-2 rounded-lg border border-slate-800">
                    <p className="text-sm font-mono font-black text-amber-400">{p.score} PTS</p>
                    <p className="text-[10px] text-slate-500">{p.correctAnswersCount} / {quiz.questions.length} Correct</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-5">
            <h3 className="text-xl font-bold text-white">Scan to Join Quiz</h3>
            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
              <QRCodeSVG value={joinUrl} size={200} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Join PIN Code:</p>
              <p className="text-3xl font-mono font-extrabold text-amber-400">{session.pin}</p>
            </div>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
