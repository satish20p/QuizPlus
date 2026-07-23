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
import { TrainerLogin } from './components/Auth/TrainerLogin';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Trainer authentication state
  const [isTrainerLoggedIn, setIsTrainerLoggedIn] = useState<boolean>(false);

  // Active view: 'admin' | 'trainer' | 'learner' | 'presenter' (Default is 'learner' for QR code / link visitors)
  const [activeView, setActiveView] = useState<'admin' | 'trainer' | 'learner' | 'presenter'>('learner');

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

    // Check URL query param or hash for ?password=XXXX / ?pin=XXXX / ?code=XXXX
    const searchParams = new URLSearchParams(window.location.search);
    const hashString = window.location.hash;
    const extractedPassword = 
      searchParams.get('password') || 
      searchParams.get('pin') || 
      searchParams.get('code') || 
      searchParams.get('join') || 
      (hashString.match(/password=([^&]+)/)?.[1] || hashString.match(/\b(\d{6})\b/)?.[1] || null);

    const nameParam = searchParams.get('name') || 'Guest Participant';
    const prnParam = searchParams.get('prn') || '';

    if (extractedPassword) {
      setActiveView('learner');
      handleJoinSessionByPin(extractedPassword, nameParam, prnParam);
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

    connectWebSocket(session.password, true, session);
  };

  const handleUpdateSession = (updatedSession: LiveSession) => {
    setActiveSession(updatedSession);
    storageService.updateSession(updatedSession);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'HOST_ACTION',
        pin: updatedSession.password,
        payload: updatedSession
      }));
    }
  };

  const handleJoinSessionByPin = (password: string, learnerName: string, prn?: string) => {
    let session = storageService.getSession(password);
    if (!session) {
      // Find default or recent session
      const activeSessions = storageService.getActiveSessions();
      session = activeSessions[password] || null;
    }

    if (session) {
      const participantId = currentUser?.id || `guest-${Date.now()}`;
      const existingP = session.participants?.[participantId];
      const updatedParticipants = {
        ...(session.participants || {}),
        [participantId]: {
          id: participantId,
          name: learnerName,
          prn: prn || '',
          score: existingP?.score || 0,
          correctAnswersCount: existingP?.correctAnswersCount || 0,
          totalAnsweredCount: existingP?.totalAnsweredCount || 0,
          joinedAt: existingP?.joinedAt || new Date().toISOString(),
          isGuest: true
        }
      };
      const activeRoom: LiveSession = { ...session, participants: updatedParticipants };
      storageService.updateSession(activeRoom);
      setActiveSession(activeRoom);
      const quiz = quizzes.find(q => q.id === activeRoom.quizId) || null;
      setActiveQuiz(quiz);

      connectWebSocket(password, false, {
        userId: participantId,
        userName: learnerName,
        prn: prn || ''
      });
    } else {
      alert(`Session password "${password}" not valid or session not active. Please check the quiz password.`);
    }
  };

  const handleSubmitAnswer = (submission: Submission) => {
    if (!activeSession) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'SUBMIT_ANSWER',
        pin: activeSession.password,
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

  const handleTrainerLogin = (authenticatedUser: User) => {
    setCurrentUser(authenticatedUser);
    setIsTrainerLoggedIn(true);
  };

  const handleTrainerLogout = () => {
    setIsTrainerLoggedIn(false);
    setActiveView('learner');
  };

  const fallbackUser: User = currentUser || users[0] || {
    id: 'guest-learner',
    name: 'Learner',
    email: 'learner@quizpulse.com',
    role: 'learner'
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={fallbackUser}
        onUserChange={(u) => setCurrentUser(u)}
        allUsers={users}
        activeView={activeView}
        onViewChange={(v) => setActiveView(v)}
        onJoinSession={(pwd) => handleJoinSessionByPin(pwd, fallbackUser.name)}
        activeSessionPassword={activeSession?.password}
        isTrainerLoggedIn={isTrainerLoggedIn}
        onTrainerLogout={handleTrainerLogout}
      />

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* ADMIN VIEW */}
        {activeView === 'admin' && (
          !isTrainerLoggedIn ? (
            <TrainerLogin
              allUsers={users}
              onLoginSuccess={handleTrainerLogin}
              onCancelToLearner={() => setActiveView('learner')}
            />
          ) : (
            <AdminDashboard
              currentUser={fallbackUser}
              users={users}
              onUsersUpdate={(updated) => setUsers(updated)}
              quizzes={quizzes}
              onQuizzesUpdate={(updated) => setQuizzes(updated)}
              reports={reports}
              auditLogs={auditLogs}
              onViewReport={(rep) => setSelectedReport(rep)}
            />
          )
        )}

        {/* TRAINER VIEW */}
        {activeView === 'trainer' && (
          !isTrainerLoggedIn ? (
            <TrainerLogin
              allUsers={users}
              onLoginSuccess={handleTrainerLogin}
              onCancelToLearner={() => setActiveView('learner')}
            />
          ) : (
            activeSession && activeQuiz && activeSession.trainerId === fallbackUser.id ? (
              <LiveHostView
                session={activeSession}
                quiz={activeQuiz}
                onUpdateSession={handleUpdateSession}
                onEndSession={handleEndSession}
              />
            ) : (
              <TrainerPortal
                currentUser={fallbackUser}
                quizzes={quizzes}
                onQuizzesUpdate={(updated) => setQuizzes(updated)}
                reports={reports}
                onLaunchSession={handleLaunchSession}
                onViewReport={(rep) => setSelectedReport(rep)}
              />
            )
          )
        )}

        {/* LEARNER VIEW */}
        {activeView === 'learner' && (
          <LearnerInterface
            currentUser={fallbackUser}
            session={activeSession}
            quiz={activeQuiz}
            onJoinByPin={handleJoinSessionByPin}
            onSubmitAnswer={handleSubmitAnswer}
            activePinInput={activeSession?.password}
          />
        )}

        {/* PRESENTER / LIVE STAGE VIEW */}
        {activeView === 'presenter' && (
          <LiveStageView
            session={activeSession}
            quiz={activeQuiz}
            onSelectSessionPassword={(password) => handleJoinSessionByPin(password, 'Presenter Display')}
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
