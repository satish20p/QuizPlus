import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { LiveSession, Quiz, User, Submission } from '../../types/quiz';
import { 
  Smartphone, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  Sparkles, 
  Zap, 
  Send, 
  UserCheck, 
  Radio, 
  Award,
  ChevronRight,
  HelpCircle,
  ShieldAlert,
  AlertTriangle,
  Lock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface LearnerInterfaceProps {
  currentUser: User;
  session: LiveSession | null;
  quiz: Quiz | null;
  onJoinByPin: (pin: string, name: string) => void;
  onSubmitAnswer: (submission: Submission) => void;
  activePinInput?: string;
}

export const LearnerInterface: React.FC<LearnerInterfaceProps> = ({
  currentUser,
  session,
  quiz,
  onJoinByPin,
  onSubmitAnswer,
  activePinInput = ''
}) => {
  const [pin, setPin] = useState(activePinInput || '');
  const [guestName, setGuestName] = useState(currentUser.name || '');
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [deviceFrame, setDeviceFrame] = useState<boolean>(true); // Smartphone Frame toggle for realistic preview

  // Security & Anti-Cheat State
  const [violationCount, setViolationCount] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [warningReason, setWarningReason] = useState<string>('');
  const [isDisqualified, setIsDisqualified] = useState<boolean>(false);
  const lastViolationTimeRef = useRef<number>(0);

  const triggerViolation = (reason: string) => {
    const now = Date.now();
    // Debounce violation detection by 1.5s to prevent double triggers when switching tabs (blur + visibilitychange)
    if (now - lastViolationTimeRef.current < 1500) {
      return;
    }
    lastViolationTimeRef.current = now;

    if (isDisqualified || !session || !quiz || session.state === 'lobby' || session.state === 'ended') {
      return;
    }

    setViolationCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= 4) {
        setIsDisqualified(true);
        setShowWarningModal(false);
      } else {
        setWarningReason(reason);
        setShowWarningModal(true);
      }
      return newCount;
    });
  };

  // Anti-Cheat Event Listeners (Copy, Cut, Paste, Screenshot shortcuts, Tab switching & Window blur)
  useEffect(() => {
    const isQuizActive = session && quiz && session.state !== 'lobby' && session.state !== 'ended' && !isDisqualified;

    if (!isQuizActive) return;

    const handleClipboardEvent = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerViolation(`Attempted to ${e.type.toUpperCase()} content during active quiz.`);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen Key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        triggerViolation('Attempted to capture a screenshot (PrintScreen key).');
        return;
      }

      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      // Copy / Cut / Paste / Select All / Save / Print / DevTools shortcuts
      if (isCmdOrCtrl && ['c', 'v', 'x', 'a', 's', 'p', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        triggerViolation(`Prohibited keyboard shortcut (Ctrl/Cmd + ${e.key.toUpperCase()}).`);
        return;
      }

      // Windows Snipping Tool (Win+Shift+S) or Mac Screenshot (Cmd+Shift+3/4/5)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && ['s', '3', '4', '5'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        triggerViolation('Attempted screenshot shortcut (Snipping tool / screen capture).');
        return;
      }

      // DevTools (F12 or Ctrl+Shift+I)
      if (e.key === 'F12' || (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        triggerViolation('Attempted to inspect page / open Developer Tools.');
        return;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState !== 'visible') {
        triggerViolation('Switched tab, minimized window, or opened another application.');
      }
    };

    const handleWindowBlur = () => {
      triggerViolation('Window lost focus or switched application.');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerViolation('Right-click context menu is disabled during the quiz.');
    };

    window.addEventListener('copy', handleClipboardEvent);
    window.addEventListener('cut', handleClipboardEvent);
    window.addEventListener('paste', handleClipboardEvent);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('copy', handleClipboardEvent);
      window.removeEventListener('cut', handleClipboardEvent);
      window.removeEventListener('paste', handleClipboardEvent);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [session?.state, session?.currentQuestionIndex, isDisqualified]);

  useEffect(() => {
    if (activePinInput) {
      setPin(activePinInput);
    }
  }, [activePinInput]);

  // Reset submission state on question change
  useEffect(() => {
    setSelectedOptId(null);
    setHasSubmitted(false);
  }, [session?.currentQuestionIndex]);

  // Confetti trigger on answer reveal if correct
  useEffect(() => {
    if (session?.state === 'answer_revealed' && hasSubmitted && quiz && session) {
      const currentQ = quiz.questions[session.currentQuestionIndex];
      if (currentQ && selectedOptId === currentQ.correctOptionId) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  }, [session?.state]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() && guestName.trim()) {
      onJoinByPin(pin.trim(), guestName.trim());
    }
  };

  const handleOptionSelect = (optId: string) => {
    if (hasSubmitted || !session || !quiz || session.state !== 'question_active') return;

    setSelectedOptId(optId);
    setHasSubmitted(true);

    const currentQ = quiz.questions[session.currentQuestionIndex];
    const isCorrect = optId === currentQ.correctOptionId;

    // Time calculation & Speed bonus factor
    const totalTime = currentQ.timeLimitSeconds || 30;
    const timeRemaining = session.questionTimeRemaining;
    const timeTaken = Math.max(1, totalTime - timeRemaining);

    // Dynamic scoring formula: Base (1000) * (1 - (timeTaken / totalTime) * 0.5) if correct
    let points = 0;
    if (isCorrect) {
      const speedMultiplier = 1 - (timeTaken / totalTime) * 0.5;
      points = Math.round((currentQ.points || 1000) * Math.max(0.5, speedMultiplier));
    }

    const submission: Submission = {
      questionId: currentQ.id,
      participantId: currentUser.id || `guest-${guestName}`,
      selectedOptionId: optId,
      isCorrect,
      timeTakenSeconds: timeTaken,
      pointsEarned: points,
      submittedAt: new Date().toISOString()
    };

    onSubmitAnswer(submission);
  };

  // Participant's own score
  const participantData = session?.participants?.[currentUser.id || `guest-${guestName}`];
  const currentScore = participantData?.score || 0;

  // Render Android Phone Frame container or responsive layout
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-4">
      
      {/* Frame Toggle */}
      <div className="mb-4 flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
        <span className="text-slate-600 font-semibold px-2">Display Mode:</span>
        <button
          onClick={() => setDeviceFrame(true)}
          className={`px-3 py-1 rounded-lg transition font-semibold cursor-pointer ${
            deviceFrame ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Android Smartphone Frame
        </button>
        <button
          onClick={() => setDeviceFrame(false)}
          className={`px-3 py-1 rounded-lg transition font-semibold cursor-pointer ${
            !deviceFrame ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Full Screen
        </button>
      </div>

      {/* Main Container Wrapper */}
      <div className={`w-full transition-all duration-300 ${
        deviceFrame 
          ? 'max-w-sm bg-white border-[12px] border-slate-800 rounded-[44px] shadow-2xl p-5 overflow-hidden relative min-h-[640px] flex flex-col justify-between' 
          : 'max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-xl'
      }`}>
        
        {/* Android Notch / Speaker Simulation in Frame Mode */}
        {deviceFrame && (
          <div className="w-32 h-4 bg-slate-800 rounded-b-xl mx-auto absolute top-0 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center">
            <div className="w-8 h-1 rounded-full bg-slate-600"></div>
          </div>
        )}

        {/* SECTION 1: JOIN ROOM SCREEN */}
        {(!session || !quiz) && (
          <div className="space-y-6 pt-6 text-center my-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shadow-sm">
              <Smartphone className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Join Live Quiz</h2>
              <p className="text-xs text-slate-500 mt-1">Enter PIN code from presenter screen</p>
            </div>

            <form onSubmit={handleJoin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit Session PIN</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 829104"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono text-center tracking-widest font-bold px-3 py-3 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 uppercase placeholder:text-slate-400"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                ENTER LOBBY
              </button>
            </form>
          </div>
        )}

        {/* SECTION 2: WAITING IN LOBBY */}
        {session && quiz && session.state === 'lobby' && (
          <div className="space-y-6 pt-6 text-center my-auto">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center animate-pulse">
              <UserCheck className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                You are in!
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">{session.quizTitle}</h2>
              <p className="text-xs text-slate-500 mt-1">Learner: <span className="font-bold text-slate-800">{guestName}</span></p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-700 space-y-2">
              <p className="font-bold text-indigo-700">🎮 Ready for action?</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Look at the main stage projector or stay on this screen. Answer options will appear as soon as the trainer launches Question #1.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 3: ACTIVE QUESTION / SUBMISSION / REVEAL */}
        {session && quiz && session.state !== 'lobby' && session.state !== 'ended' && (() => {
          if (isDisqualified) {
            return (
              <div className="space-y-6 pt-6 text-center my-auto p-4 bg-red-50 border border-red-200 rounded-2xl select-none">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg animate-bounce">
                  <Lock className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-red-700 bg-red-100 border border-red-300 px-3 py-1 rounded-full">
                    SECURITY POLICY EJECTION
                  </span>
                  <h2 className="text-xl font-black text-red-900 mt-3">Session Terminated</h2>
                  <p className="text-xs font-semibold text-red-700 mt-1">Ejected due to repeated anti-cheat security violations</p>
                </div>

                <div className="bg-white border border-red-200 p-4 rounded-xl text-xs text-slate-700 space-y-2 text-left shadow-xs">
                  <div className="flex items-center gap-2 font-bold text-red-800 text-xs border-b border-red-100 pb-2">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    Prohibited Actions Exceeded (4/4 Violations)
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Your quiz session was automatically terminated and locked because 4 security warnings were logged (copy/paste attempt, screenshot shortcut, or tab/app switching).
                  </p>
                  <p className="text-[11px] font-bold text-red-700">
                    No further answers or submissions are permitted for this attempt.
                  </p>
                </div>
              </div>
            );
          }

          const currentQ = quiz.questions[session.currentQuestionIndex];
          if (!currentQ) return null;

          const timePct = Math.round((session.questionTimeRemaining / (currentQ.timeLimitSeconds || 30)) * 100);

          return (
            <div className="space-y-4 pt-3 my-auto select-none">
              
              {/* Anti-Cheat Security Status Badge */}
              <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-[11px]">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Anti-Cheat Active
                </span>
                <span className={`font-mono font-extrabold px-2 py-0.5 rounded-md ${
                  violationCount === 0 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : violationCount < 3 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  Warnings: {violationCount}/3
                </span>
              </div>

              {/* Header Info */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-indigo-700 font-mono font-bold">Q{session.currentQuestionIndex + 1}/{quiz.questions.length}</span>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px]">
                  {currentQ.marks || (currentQ.points ? Math.min(5, Math.max(1, Math.round(currentQ.points / 200))) : 1)} { (currentQ.marks || 1) === 1 ? 'Mark' : 'Marks' }
                </span>
                <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {currentScore} PTS
                </span>
              </div>

              {/* Synchronized Visual Timer Bar with Color Shift */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-500 font-medium">
                  <span>Timer</span>
                  <span className="font-bold text-slate-900">{session.questionTimeRemaining}s</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className={`h-full transition-all duration-300 rounded-full ${
                      timePct > 50 ? 'bg-emerald-500' : timePct > 20 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${timePct}%` }}
                  ></div>
                </div>
              </div>

              {/* Question Text (Supports Code, Formulas, Symbols & Multiline with Scrollbar) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                {currentQ.questionText}
              </div>

              {/* Option Choice Buttons (A, B, C, D) */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, optIdx) => {
                  const labels = ['A', 'B', 'C', 'D'];
                  const isSelected = selectedOptId === opt.id;
                  const isCorrect = opt.id === currentQ.correctOptionId;
                  const isRevealed = session.state === 'answer_revealed' || session.state === 'leaderboard';

                  let btnStyle = 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50';

                  if (isRevealed) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-50 border-emerald-500 text-slate-900 font-bold ring-2 ring-emerald-500/50';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'bg-red-50 border-red-300 text-red-700 line-through opacity-80';
                    } else {
                      btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-50';
                    }
                  } else if (isSelected) {
                    btnStyle = 'bg-indigo-600 border-indigo-600 text-white font-bold ring-2 ring-indigo-600/30';
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionSelect(opt.id)}
                      disabled={hasSubmitted || session.state !== 'question_active'}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <div className="flex items-start gap-3 w-full pr-2 overflow-hidden">
                        <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {labels[optIdx]}
                        </span>
                        <span className="font-semibold font-mono whitespace-pre-wrap break-words max-h-32 overflow-y-auto text-left w-full block">{opt.text}</span>
                      </div>

                      {isRevealed && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                      {isRevealed && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Status Banner */}
              {hasSubmitted && session.state === 'question_active' && (
                <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-center text-xs font-semibold text-indigo-700 flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500 animate-bounce" />
                  Answer Locked! Waiting for timer to expire...
                </div>
              )}

              {/* Immediate Answer Reveal & Explanation Screen */}
              {(session.state === 'answer_revealed' || session.state === 'leaderboard') && (
                <div className={`p-4 rounded-xl border space-y-2 text-xs ${
                  selectedOptId === currentQ.correctOptionId 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {selectedOptId === currentQ.correctOptionId ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Correct Choice! +Points Awarded
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          Incorrect Choice
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    <span className="font-semibold text-amber-700">Explanation:</span> {currentQ.explanation}
                  </p>
                </div>
              )}

            </div>
          );
        })()}

        {/* SECTION 4: ENDED QUIZ SUMMARY */}
        {session && session.state === 'ended' && (
          <div className="space-y-6 pt-6 text-center my-auto">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center shadow-md">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Quiz Completed!</h2>
              <p className="text-xs text-slate-500 mt-1">Great job, {guestName}!</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-center space-y-2">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Final Score</p>
              <p className="text-4xl font-black text-amber-600">{currentScore} PTS</p>
            </div>
          </div>
        )}

      </div>

      {/* SECURITY WARNING MODAL (WARNINGS 1, 2, 3) */}
      {showWarningModal && !isDisqualified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-600 border border-amber-300 flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-7 h-7 text-amber-600 animate-pulse" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
                SECURITY WARNING #{violationCount} / 3
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2.5">Prohibited Action Detected</h3>
              <p className="text-xs font-semibold text-amber-800 mt-1.5 bg-amber-50 p-2 rounded-lg border border-amber-200">
                {warningReason}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-700 text-left space-y-1.5">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                Quiz Anti-Cheat Rules:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 font-medium">
                <li>No Cut, Copy, or Paste allowed</li>
                <li>No Screenshots or Screen Capture shortcuts</li>
                <li>Do not switch tabs, minimize, or change focus</li>
              </ul>
              {violationCount === 3 ? (
                <p className="font-extrabold text-red-600 text-[11px] bg-red-50 p-2 rounded-md border border-red-200 mt-2">
                  🚨 FINAL WARNING! The 4th violation will automatically terminate your session and disqualify your quiz!
                </p>
              ) : (
                <p className="font-bold text-amber-800 text-[11px] mt-1">
                  Warning {violationCount} of 3 recorded. You have {4 - violationCount} chance(s) remaining.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowWarningModal(false)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3 rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              I Understand & Resume Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
