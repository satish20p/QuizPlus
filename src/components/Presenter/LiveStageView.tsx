import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { LiveSession, Quiz, Question } from '../../types/quiz';
import { Trophy, Users, Clock, QrCode, Radio, Award, BarChart3, CheckCircle2 } from 'lucide-react';

interface LiveStageViewProps {
  session: LiveSession | null;
  quiz: Quiz | null;
  onSelectSessionPin: (pin: string) => void;
  activeSessions: LiveSession[];
}

export const LiveStageView: React.FC<LiveStageViewProps> = ({
  session,
  quiz,
  onSelectSessionPin,
  activeSessions
}) => {
  if (!session || !quiz) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 text-center py-12">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shadow-sm">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Live Stage Projector View</h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto font-medium">
            Select an active live session below to display the big-screen projector view for auditorium / event halls.
          </p>

          {activeSessions.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 font-medium">No live sessions currently active. Launch a session from Trainer Portal first!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto pt-4">
              {activeSessions.map((s) => (
                <button
                  key={s.pin}
                  onClick={() => onSelectSessionPin(s.pin)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-4 rounded-2xl transition cursor-pointer text-left space-y-2 group shadow-sm"
                >
                  <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                    PIN: {s.pin}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition">{s.quizTitle}</h3>
                  <p className="text-xs text-slate-500">Host: {s.trainerName}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentQ: Question | undefined = quiz.questions[session.currentQuestionIndex];
  const joinUrl = `${window.location.origin}?pin=${session.pin}`;
  const totalConnected = Object.keys(session.participants || {}).length;

  const currentSubmissions = session.submissions.filter(s => s.questionId === currentQ?.id);
  const optionCounts: Record<string, number> = {};
  currentQ?.options.forEach(opt => { optionCounts[opt.id] = 0; });
  currentSubmissions.forEach(sub => {
    if (optionCounts[sub.selectedOptionId] !== undefined) {
      optionCounts[sub.selectedOptionId]++;
    }
  });

  const participantList = Object.values(session.participants || {}).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Big Screen Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            LIVE AUDIENCE PRESENTATION
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">{session.quizTitle}</h1>
        </div>

        {/* Big Join Box */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-6 shrink-0 shadow-sm">
          <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <QRCodeSVG value={joinUrl} size={80} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Join at {window.location.host}</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">PIN CODE:</p>
            <p className="text-3xl font-mono font-black text-indigo-700 tracking-wider">{session.pin}</p>
          </div>
        </div>
      </div>

      {/* LOBBY DISPLAY */}
      {session.state === 'lobby' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-8 shadow-xl">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="text-4xl font-black text-slate-900">Join the Live Quiz Now!</h2>
            <p className="text-slate-600 text-lg">
              Scan the QR code above or enter PIN <span className="font-mono text-indigo-700 font-bold">{session.pin}</span> on your phone.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-3xl mx-auto space-y-4">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center justify-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Connected Learners ({totalConnected})
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {participantList.map((p) => (
                <span key={p.id} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-800 shadow-sm flex items-center gap-2">
                  <span>{p.name}</span>
                  {p.prn && (
                    <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded">
                      PRN: {p.prn}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE QUESTION & RESPONSE DISTRIBUTION */}
      {currentQ && session.state !== 'lobby' && session.state !== 'ended' && (
        <div className="space-y-8">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-indigo-700 uppercase tracking-widest bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-200">
                  Question {session.currentQuestionIndex + 1} of {quiz.questions.length}
                </span>
                <span className="text-sm font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                  {currentQ.marks || (currentQ.points ? Math.min(5, Math.max(1, Math.round(currentQ.points / 200))) : 1)} {(currentQ.marks || 1) === 1 ? 'Mark' : 'Marks'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-2xl font-mono font-black text-amber-600">
                <Clock className="w-7 h-7" />
                <span>{session.questionTimeRemaining}s</span>
              </div>
            </div>

            <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 leading-relaxed bg-slate-50 border border-slate-200 p-5 rounded-2xl whitespace-pre-wrap break-words max-h-72 overflow-y-auto">
              {currentQ.questionText}
            </div>

            {/* Answer Options Chart */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {currentQ.options.map((opt, optIdx) => {
                const labels = ['A', 'B', 'C', 'D'];
                const count = optionCounts[opt.id] || 0;
                const pct = currentSubmissions.length > 0 
                  ? Math.round((count / currentSubmissions.length) * 100) 
                  : 0;
                const isCorrect = opt.id === currentQ.correctOptionId;
                const isRevealed = session.state === 'answer_revealed' || session.state === 'leaderboard';

                return (
                  <div
                    key={opt.id}
                    className={`p-5 rounded-2xl border transition ${
                      isRevealed && isCorrect 
                        ? 'bg-emerald-50 border-emerald-500 text-slate-900 ring-4 ring-emerald-500/30' 
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-base font-bold mb-2">
                      <span className="flex items-center gap-3">
                        <span className={`w-9 h-9 rounded-xl text-base font-black flex items-center justify-center ${
                          isRevealed && isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {labels[optIdx]}
                        </span>
                        <span className="font-mono whitespace-pre-wrap break-words max-h-32 overflow-y-auto block">{opt.text}</span>
                      </span>
                      <span className="text-sm text-indigo-700 font-mono font-bold">{count} votes</span>
                    </div>

                    <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden border border-slate-300">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isRevealed && isCorrect ? 'bg-emerald-600' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation banner */}
            {(session.state === 'answer_revealed' || session.state === 'leaderboard') && (
              <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-2xl space-y-1">
                <p className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Explanation:
                </p>
                <p className="text-sm text-emerald-900 leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            )}

          </div>

          {/* LEADERBOARD PODIUM DISPLAY */}
          {session.state === 'leaderboard' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
              <h2 className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
                <Trophy className="w-8 h-8 text-amber-500" />
                Live Podium Standings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {participantList.slice(0, 3).map((p, idx) => (
                  <div
                    key={p.id}
                    className={`p-6 rounded-2xl border text-center space-y-2 shadow-md ${
                      idx === 0 
                        ? 'bg-amber-50 border-amber-300 text-slate-900 scale-105 order-1 md:order-2 ring-2 ring-amber-400' 
                        : idx === 1 
                        ? 'bg-slate-50 border-slate-300 text-slate-800 order-2 md:order-1' 
                        : 'bg-amber-50/50 border-amber-200 text-slate-700 order-3'
                    }`}
                  >
                    <span className="text-3xl font-black">
                      {idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : '🥉 3rd'}
                    </span>
                    <h3 className="font-extrabold text-xl">{p.name}</h3>
                    {p.prn && (
                      <p className="text-xs font-mono font-bold text-indigo-700">PRN: {p.prn}</p>
                    )}
                    <p className="text-lg font-mono font-bold text-amber-600">{p.score} PTS</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* COMPLETED QUIZ FINAL TOP 5 LEADERBOARD */}
      {session && session.state === 'ended' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-8 max-w-4xl mx-auto text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-600 border border-amber-300 flex items-center justify-center shadow-lg animate-bounce">
              <Trophy className="w-9 h-9 text-amber-500" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Quiz Complete!</h2>
            <p className="text-sm font-semibold text-slate-500">Official Top 5 Leadership Board</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {participantList.slice(0, 5).map((p, idx) => {
              const medals = ['🥇 1st', '🥈 2nd', '🥉 3rd', '4th', '5th'];
              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border text-center space-y-2 shadow-sm transition transform hover:-translate-y-1 ${
                    idx === 0
                      ? 'bg-gradient-to-b from-amber-50 to-amber-100/60 border-amber-300 text-slate-900 ring-2 ring-amber-400'
                      : idx === 1
                      ? 'bg-slate-50 border-slate-300 text-slate-800'
                      : idx === 2
                      ? 'bg-amber-50/40 border-amber-200 text-slate-800'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-lg font-black font-mono block text-amber-600">
                    {medals[idx]}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">{p.name}</h3>
                    <p className="text-[11px] font-mono font-bold text-indigo-700 mt-0.5 truncate">
                      PRN: {p.prn || 'N/A'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60">
                    <p className="text-base font-mono font-black text-amber-600">{p.score} PTS</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{p.correctAnswersCount} Correct</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
