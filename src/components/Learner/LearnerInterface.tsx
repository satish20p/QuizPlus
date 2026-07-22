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
  AlertCircle,
  QrCode,
  Camera,
  Link as LinkIcon,
  X,
  Scan,
  ArrowRight,
  Edit2
} from 'lucide-react';

interface LearnerInterfaceProps {
  currentUser: User;
  session: LiveSession | null;
  quiz: Quiz | null;
  onJoinByPin: (pin: string, name: string, prn?: string) => void;
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
  const searchParams = new URLSearchParams(window.location.search);
  const urlPrn = searchParams.get('prn') || '';
  const urlName = searchParams.get('name') || currentUser.name || '';

  const initialPin = activePinInput || searchParams.get('pin') || '';
  const [pin, setPin] = useState(initialPin);
  const [guestName, setGuestName] = useState(urlName);
  const [prn, setPrn] = useState(urlPrn);
  const [joinStep, setJoinStep] = useState<1 | 2>(initialPin.trim().length >= 4 ? 2 : 1);
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [deviceFrame, setDeviceFrame] = useState<boolean>(true); // Smartphone Frame toggle for realistic preview

  // QR Code Scanner & URL Paste Modals State
  const [showQrScannerModal, setShowQrScannerModal] = useState<boolean>(false);
  const [showUrlPasteModal, setShowUrlPasteModal] = useState<boolean>(false);
  const [pastedUrlInput, setPastedUrlInput] = useState<string>('');
  const [isCameraScanning, setIsCameraScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string>('');

  const handleParseUrlAndSetPin = (urlOrString: string) => {
    // Extract 6-digit number sequence or pin parameter
    const match = urlOrString.match(/pin=(\d{6})/i) || urlOrString.match(/\b(\d{6})\b/);
    if (match && match[1]) {
      setPin(match[1]);
      setJoinStep(2); // Automatically advance to Step 2: Name & PRN
      return match[1];
    }
    return null;
  };

  const handleSimulateQrScan = () => {
    setIsCameraScanning(true);
    setScanMessage('Aligning QR Code in viewfinder...');
    setTimeout(() => {
      // Auto detected PIN demo or active URL pin
      const activePin = activePinInput || '829104';
      setPin(activePin);
      setJoinStep(2); // Automatically advance to Step 2: Name & PRN
      setScanMessage(`Success! Scanned PIN: ${activePin}`);
      setTimeout(() => {
        setIsCameraScanning(false);
        setShowQrScannerModal(false);
        setScanMessage('');
      }, 1000);
    }, 2000);
  };

  const handleApplyPastedUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const extractedPin = handleParseUrlAndSetPin(pastedUrlInput);
    if (extractedPin) {
      setShowUrlPasteModal(false);
      setPastedUrlInput('');
    } else {
      alert('Could not find a valid 6-digit PIN in the provided URL/string. Please try again or type the 6-digit PIN manually.');
    }
  };

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
      onJoinByPin(pin.trim(), guestName.trim(), prn.trim());
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
          <div className="space-y-4 pt-2 text-center my-auto">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shadow-xs">
              <Smartphone className="w-6 h-6" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full mb-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                No Login Required for Learners
              </span>
              <h2 className="text-xl font-black text-slate-900">Join Live Quiz</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {joinStep === 1 
                  ? 'Step 1 of 2: Scan QR, paste URL, or enter PIN' 
                  : 'Step 2 of 2: Enter Name & PRN to enter lobby'}
              </p>
            </div>

            {/* STEP 1: SCAN QR / PASTE URL / ENTER PIN */}
            {joinStep === 1 && (
              <div className="space-y-4">
                {/* QUICK ALTERNATIVE JOIN METHODS: QR & LINK */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQrScannerModal(true);
                      handleSimulateQrScan();
                    }}
                    className="p-3 rounded-2xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-950 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="font-extrabold">1. Scan QR Code</span>
                    <span className="text-[10px] text-indigo-700 font-normal">Auto-detects Quiz PIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlPasteModal(true)}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <div className="p-2 rounded-xl bg-slate-800 text-white shadow-xs">
                      <LinkIcon className="w-5 h-5" />
                    </div>
                    <span className="font-extrabold">Paste Web Link</span>
                    <span className="text-[10px] text-slate-500 font-normal">Extracts PIN from URL</span>
                  </button>
                </div>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold">
                    <span className="bg-white px-2 text-slate-400">or enter pin code manually</span>
                  </div>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (pin.trim().length >= 4) {
                      setJoinStep(2);
                    } else {
                      alert('Please enter a valid 6-digit PIN code.');
                    }
                  }} 
                  className="space-y-3 text-left"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">6-Digit Session PIN</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 829104"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono text-center tracking-widest font-black px-3 py-3 rounded-xl text-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 uppercase placeholder:text-slate-300 shadow-inner"
                      maxLength={6}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>NEXT: ENTER DETAILS</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: ENTER NAME & PRN */}
            {joinStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                {/* Verified PIN banner with change option */}
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-left">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-indigo-600">Quiz PIN Code:</span>
                    <p className="text-base font-black font-mono text-indigo-950 tracking-wider">{pin || '829104'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setJoinStep(1)}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-3 h-3" />
                    Change PIN
                  </button>
                </div>

                <form onSubmit={handleJoin} className="space-y-3 text-left">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Learner Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Marcus Vance"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PRN / Roll Number / Student ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2024018290"
                      value={prn}
                      onChange={(e) => setPrn(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    ENTER LOBBY & JOIN QUIZ
                  </button>
                </form>
              </div>
            )}

            <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 text-left space-y-1">
              <p className="font-bold flex items-center gap-1 text-amber-950">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Vercel Deployment Notice:
              </p>
              <p className="text-[10px] text-amber-800 leading-tight">
                If scanning the QR code asks for a Vercel login, disable <span className="font-bold">"Vercel Authentication"</span> under Vercel Settings → Deployment Protection. Learners need NO login to participate.
              </p>
            </div>
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
              <div className="flex flex-col items-center gap-1 mt-2 text-xs text-slate-600">
                <p>Learner: <span className="font-bold text-slate-900">{guestName}</span></p>
                {prn && (
                  <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold px-2.5 py-0.5 rounded-md text-[11px]">
                    PRN: {prn}
                  </span>
                )}
              </div>
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

        {/* SECTION 4: ENDED QUIZ SUMMARY & TOP 5 LEADERBOARD */}
        {session && session.state === 'ended' && (() => {
          const participantsArr = Object.values(session.participants || {});
          const sorted = [...participantsArr].sort((a, b) => b.score - a.score || b.correctAnswersCount - a.correctAnswersCount);
          const top5 = sorted.slice(0, 5);
          const userRank = sorted.findIndex(p => p.id === currentUser.id || p.name === guestName) + 1;

          return (
            <div className="space-y-4 pt-3 text-center my-auto">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center shadow-md">
                <Trophy className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900">Quiz Completed!</h2>
                <p className="text-xs text-slate-500 mt-0.5">Great job, <span className="font-bold text-slate-800">{guestName}</span>!</p>
              </div>

              {/* Your Score Banner */}
              <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-200 p-3 rounded-xl text-center flex items-center justify-between px-4 shadow-xs">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Your Score</p>
                  <p className="text-2xl font-black text-indigo-600">{currentScore} PTS</p>
                </div>
                {userRank > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Your Rank</p>
                    <p className="text-lg font-black text-amber-600">#{userRank} / {sorted.length}</p>
                  </div>
                )}
              </div>

              {/* TOP 5 LEADERBOARD TABLE */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs text-left space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    Top 5 Leadership Board
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">{sorted.length} Learners</span>
                </div>

                <div className="space-y-1.5">
                  {top5.map((p, idx) => {
                    const isCurrentUser = p.id === currentUser.id || p.name === guestName;
                    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

                    return (
                      <div
                        key={p.id || idx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                          isCurrentUser
                            ? 'bg-indigo-50/90 border-indigo-300 ring-1 ring-indigo-400 font-semibold'
                            : idx === 0
                            ? 'bg-amber-50/60 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                          <span className="text-base shrink-0">{medals[idx]}</span>
                          <div className="overflow-hidden">
                            <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {isCurrentUser && (
                                <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded font-mono uppercase">You</span>
                              )}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500">
                              PRN: <span className="font-bold text-indigo-700">{p.prn || 'N/A'}</span>
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-black text-amber-600 text-sm shrink-0">
                          {p.score} PTS
                        </span>
                      </div>
                    );
                  })}

                  {top5.length === 0 && (
                    <p className="text-xs text-slate-400 italic py-2 text-center">No participants recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

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

      {/* QR CODE CAMERA SCANNER MODAL */}
      {showQrScannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 text-center relative overflow-hidden border border-slate-200">
            <button
              onClick={() => {
                setShowQrScannerModal(false);
                setIsCameraScanning(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                Camera QR Viewfinder
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">Scan Quiz QR Code</h3>
              <p className="text-xs text-slate-500">Hold camera steady over presenter QR code</p>
            </div>

            {/* Simulated Live Camera Frame */}
            <div className="w-56 h-56 mx-auto bg-slate-900 rounded-2xl relative overflow-hidden border-2 border-indigo-500 flex items-center justify-center shadow-inner">
              <div className="absolute inset-4 border-2 border-dashed border-indigo-400/60 rounded-xl pointer-events-none"></div>
              
              {/* Corner Reticles */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-400"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-400"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-400"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-400"></div>

              {/* Laser Scan Line */}
              {isCameraScanning && (
                <div className="absolute w-full h-1 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse top-1/2 left-0"></div>
              )}

              <QrCode className="w-20 h-20 text-indigo-400/40" />

              {/* Status Badge */}
              <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-xs text-[11px] font-mono text-indigo-300 py-1 px-2 rounded-lg border border-indigo-500/30 font-bold">
                {scanMessage || 'Searching for QR Code...'}
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSimulateQrScan}
                disabled={isCameraScanning}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Scan className="w-4 h-4 animate-spin" />
                {isCameraScanning ? 'Scanning QR Code...' : 'Rescan QR Code'}
              </button>

              <p className="text-[11px] text-slate-500 font-medium">
                PIN code will automatically auto-fill into the join box upon scan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PASTE WEB LINK MODAL */}
      {showUrlPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center relative border border-slate-200">
            <button
              onClick={() => setShowUrlPasteModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <LinkIcon className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Paste Invitation Web Link</h3>
              <p className="text-xs text-slate-500 mt-1">Paste URL link shared by instructor/trainer</p>
            </div>

            <form onSubmit={handleApplyPastedUrl} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Web Link / Invitation URL</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://quizpulse.app/?pin=829104"
                  value={pastedUrlInput}
                  onChange={(e) => setPastedUrlInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                Extract PIN & Join
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
