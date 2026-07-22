import React, { useState, useEffect, useRef } from 'react';
import { User, Quiz, LiveSession, SessionReport, AuditLog, Submission } from './types/quiz';
import { storageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { TrainerPortal } from './components/Trainer/TrainerPortal';
import { LiveHostView } from './components/Trainer/LiveHostView';
import { LearnerInterface } from './components/Learner/LearnerInterface';
import { LiveStageView } from './components/Presenter/LiveStageView';
import { ReportViewerModal } from './components/Reports/ReportViewerModal';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Active view: 'admin' | 'trainer' | 'learner' | 'presenter'
  const [activeView, setActiveView] = useState<'admin' | 'trainer' | 'learner' | 'presenter'>('trainer');

  // Active live session state
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Selected report for modal viewer
  const [selectedReport, setSelectedReport] = useState<SessionReport | null>(null);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);

  // Load initial data from storage
  useEffect(() => {
    const loadedUsers = storageService.getUsers();
    setUsers(loadedUsers);
    setCurrentUser(loadedUsers[0] || null);

    const loadedQuizzes = storageService.getQuizzes();
    setQuizzes(loadedQuizzes);

    const loadedReports = storageService.getReports();
    setReports(loadedReports);

    const loadedLogs = storageService.getAuditLogs();
    setAuditLogs(loadedLogs);

    // Check URL query param for ?pin=XXXXXX
    const params = new URLSearchParams(window.location.search);
    const pinParam = params.get('pin');
    if (pinParam) {
      handleJoinSessionByPin(pinParam, loadedUsers[3]?.name || 'Guest Participant');
      setActiveView('learner');
    }
  }, []);

  // Connect WebSocket to backend server on port 3000
  const connectWebSocket = (pin: string, isHost: boolean, userPayload: any) => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({
          type: isHost ? 'HOST_JOIN' : 'LEARNER_JOIN',
          pin,
          payload: userPayload
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'SESSION_UPDATE' && data.sessionState) {
            setActiveSession(data.sessionState);
            storageService.updateSession(data.sessionState);
          }
        } catch (e) {
          console.error(e);
        }
      };

      socket.onerror = (err) => {
        console.warn('WS Error, falling back to local state:', err);
      };
    } catch (err) {
      console.warn('WS Init Error:', err);
    }
  };

  const handleLaunchSession = (quiz: Quiz) => {
    if (!currentUser) return;
    const session = storageService.createLiveSession(quiz, currentUser);
    setActiveSession(session);
    setActiveQuiz(quiz);

    connectWebSocket(session.pin, true, session);
  };

  const handleUpdateSession = (updatedSession: LiveSession) => {
    setActiveSession(updatedSession);
    storageService.updateSession(updatedSession);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'HOST_ACTION',
        pin: updatedSession.pin,
        payload: updatedSession
      }));
    }
  };

  const handleJoinSessionByPin = (pin: string, learnerName: string) => {
    let session = storageService.getSession(pin);
    if (!session) {
      // Find default or recent session
      const activeSessions = storageService.getActiveSessions();
      session = activeSessions[pin] || null;
    }

    if (session) {
      setActiveSession(session);
      const quiz = quizzes.find(q => q.id === session.quizId) || null;
      setActiveQuiz(quiz);

      connectWebSocket(pin, false, {
        userId: currentUser?.id || `guest-${Date.now()}`,
        userName: learnerName
      });
    } else {
      alert(`Session PIN ${pin} not found. Please verify the 6-digit PIN.`);
    }
  };

  const handleSubmitAnswer = (submission: Submission) => {
    if (!activeSession) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'SUBMIT_ANSWER',
        pin: activeSession.pin,
        payload: { submission }
      }));
    } else {
      // Fallback local update
      const updatedSubmissions = [...activeSession.submissions, submission];
      const updatedParticipants = { ...activeSession.participants };
      const p = updatedParticipants[submission.participantId];
      if (p) {
        p.score = (p.score || 0) + submission.pointsEarned;
        p.totalAnsweredCount = (p.totalAnsweredCount || 0) + 1;
        if (submission.isCorrect) p.correctAnswersCount = (p.correctAnswersCount || 0) + 1;
      }
      const updatedSession = {
        ...activeSession,
        submissions: updatedSubmissions,
        participants: updatedParticipants
      };
      setActiveSession(updatedSession);
      storageService.updateSession(updatedSession);
    }
  };

  const handleEndSession = (report: SessionReport) => {
    const updatedReports = [report, ...reports];
    setReports(updatedReports);
    setQuizzes(storageService.getQuizzes());
    setAuditLogs(storageService.getAuditLogs());
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onUserChange={(u) => setCurrentUser(u)}
        allUsers={users}
        activeView={activeView}
        onViewChange={(v) => setActiveView(v)}
        onJoinSession={(pin) => handleJoinSessionByPin(pin, currentUser.name)}
        activeSessionPin={activeSession?.pin}
      />

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* ADMIN VIEW */}
        {activeView === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            users={users}
            onUsersUpdate={(updated) => setUsers(updated)}
            quizzes={quizzes}
            onQuizzesUpdate={(updated) => setQuizzes(updated)}
            reports={reports}
            auditLogs={auditLogs}
            onViewReport={(rep) => setSelectedReport(rep)}
          />
        )}

        {/* TRAINER VIEW */}
        {activeView === 'trainer' && (
          activeSession && activeQuiz && activeSession.trainerId === currentUser.id ? (
            <LiveHostView
              session={activeSession}
              quiz={activeQuiz}
              onUpdateSession={handleUpdateSession}
              onEndSession={handleEndSession}
            />
          ) : (
            <TrainerPortal
              currentUser={currentUser}
              quizzes={quizzes}
              onQuizzesUpdate={(updated) => setQuizzes(updated)}
              reports={reports}
              onLaunchSession={handleLaunchSession}
              onViewReport={(rep) => setSelectedReport(rep)}
            />
          )
        )}

        {/* LEARNER VIEW */}
        {activeView === 'learner' && (
          <LearnerInterface
            currentUser={currentUser}
            session={activeSession}
            quiz={activeQuiz}
            onJoinByPin={handleJoinSessionByPin}
            onSubmitAnswer={handleSubmitAnswer}
            activePinInput={activeSession?.pin}
          />
        )}

        {/* PRESENTER / LIVE STAGE VIEW */}
        {activeView === 'presenter' && (
          <LiveStageView
            session={activeSession}
            quiz={activeQuiz}
            onSelectSessionPin={(pin) => handleJoinSessionByPin(pin, 'Presenter Display')}
            activeSessions={Object.values(storageService.getActiveSessions())}
          />
        )}

      </main>

      {/* REPORT VIEWER MODAL */}
      {selectedReport && (
        <ReportViewerModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

    </div>
  );
}
