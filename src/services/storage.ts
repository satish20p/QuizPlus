import { User, Quiz, LiveSession, SessionReport, AuditLog, Submission, Participant } from '../types/quiz';
import { INITIAL_USERS, INITIAL_QUIZZES, INITIAL_REPORTS, INITIAL_AUDIT_LOGS } from '../data/initialData';

const USERS_KEY = 'quizpulse_users';
const QUIZZES_KEY = 'quizpulse_quizzes';
const ACTIVE_SESSIONS_KEY = 'quizpulse_active_sessions';
const REPORTS_KEY = 'quizpulse_reports';
const AUDIT_LOGS_KEY = 'quizpulse_audit_logs';

export const storageService = {
  // --- USERS ---
  getUsers(): User[] {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  addUser(user: User): User[] {
    const users = this.getUsers();
    const updated = [user, ...users];
    this.saveUsers(updated);
    this.addAuditLog(user.id, user.name, user.role, 'USER_CREATED', `Created user ${user.name} (${user.email}).`);
    return updated;
  },

  updateUserStatus(userId: string, status: 'active' | 'suspended', performedBy: User): User[] {
    const users = this.getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, status } : u);
    this.saveUsers(updated);
    const targetUser = users.find(u => u.id === userId);
    this.addAuditLog(
      performedBy.id,
      performedBy.name,
      performedBy.role,
      `USER_${status.toUpperCase()}`,
      `User ${targetUser?.name || userId} account status changed to ${status}.`
    );
    return updated;
  },

  deleteUser(userId: string, performedBy: User): User[] {
    const users = this.getUsers();
    const targetUser = users.find(u => u.id === userId);
    const updated = users.filter(u => u.id !== userId);
    this.saveUsers(updated);
    this.addAuditLog(
      performedBy.id,
      performedBy.name,
      performedBy.role,
      'USER_DELETED',
      `Deleted user account ${targetUser?.name || userId}.`
    );
    return updated;
  },

  // --- QUIZZES ---
  getQuizzes(): Quiz[] {
    const data = localStorage.getItem(QUIZZES_KEY);
    if (!data) {
      localStorage.setItem(QUIZZES_KEY, JSON.stringify(INITIAL_QUIZZES));
      return INITIAL_QUIZZES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_QUIZZES;
    }
  },

  saveQuizzes(quizzes: Quiz[]): void {
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
  },

  saveQuiz(quiz: Quiz, author: User): Quiz[] {
    const quizzes = this.getQuizzes();
    const index = quizzes.findIndex(q => q.id === quiz.id);
    let updated: Quiz[];
    if (index >= 0) {
      updated = [...quizzes];
      updated[index] = { ...quiz, updatedAt: new Date().toISOString() };
      this.addAuditLog(author.id, author.name, author.role, 'QUIZ_UPDATED', `Updated quiz "${quiz.title}".`);
    } else {
      updated = [quiz, ...quizzes];
      this.addAuditLog(author.id, author.name, author.role, 'QUIZ_CREATED', `Created new quiz "${quiz.title}".`);
    }
    this.saveQuizzes(updated);
    return updated;
  },

  duplicateQuiz(quizId: string, author: User): Quiz[] {
    const quizzes = this.getQuizzes();
    const target = quizzes.find(q => q.id === quizId);
    if (!target) return quizzes;

    const copy: Quiz = {
      ...target,
      id: `quiz-${Date.now()}`,
      title: `${target.title} (Copy)`,
      authorId: author.id,
      authorName: author.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timesHosted: 0,
    };
    const updated = [copy, ...quizzes];
    this.saveQuizzes(updated);
    this.addAuditLog(author.id, author.name, author.role, 'QUIZ_DUPLICATED', `Duplicated quiz "${target.title}".`);
    return updated;
  },

  deleteQuiz(quizId: string, author: User): Quiz[] {
    const quizzes = this.getQuizzes();
    const target = quizzes.find(q => q.id === quizId);
    const updated = quizzes.filter(q => q.id !== quizId);
    this.saveQuizzes(updated);
    if (target) {
      this.addAuditLog(author.id, author.name, author.role, 'QUIZ_DELETED', `Deleted quiz "${target.title}".`);
    }
    return updated;
  },

  // --- LIVE SESSIONS ---
  getActiveSessions(): Record<string, LiveSession> {
    const data = localStorage.getItem(ACTIVE_SESSIONS_KEY);
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  },

  saveActiveSessions(sessions: Record<string, LiveSession>): void {
    localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(sessions));
  },

  createLiveSession(quiz: Quiz, trainer: User): LiveSession {
    const password = quiz.password || Math.random().toString(36).substring(2, 8).toUpperCase();
    const session: LiveSession = {
      password,
      quizId: quiz.id,
      quizTitle: quiz.title,
      trainerId: trainer.id,
      trainerName: trainer.name,
      state: 'lobby',
      currentQuestionIndex: 0,
      questionStartTime: null,
      questionTimeRemaining: quiz.questions[0]?.timeLimitSeconds || 30,
      isTimerRunning: false,
      participants: {},
      submissions: [],
      createdAt: new Date().toISOString(),
    };

    const active = this.getActiveSessions();
    active[password] = session;
    this.saveActiveSessions(active);

    // Update timesHosted on quiz
    const quizzes = this.getQuizzes();
    const updatedQuizzes = quizzes.map(q => q.id === quiz.id ? { ...q, timesHosted: (q.timesHosted || 0) + 1 } : q);
    this.saveQuizzes(updatedQuizzes);

    this.addAuditLog(trainer.id, trainer.name, trainer.role, 'SESSION_LAUNCHED', `Launched live session for "${quiz.title}" with password ${password}.`);

    return session;
  },

  getSession(password: string): LiveSession | null {
    if (!password) return null;
    const active = this.getActiveSessions();
    const cleanPwd = password.trim().toUpperCase();
    if (active[cleanPwd]) return active[cleanPwd];
    for (const [key, session] of Object.entries(active)) {
      if (key.toUpperCase() === cleanPwd || session.password?.toUpperCase() === cleanPwd) {
        return session;
      }
    }

    // Fallback: If quiz exists with this password, auto-launch session for learners
    const quizzes = this.getQuizzes();
    const matchingQuiz = quizzes.find(q => q.password && q.password.toUpperCase() === cleanPwd);
    if (matchingQuiz) {
      const users = this.getUsers();
      const trainer = users.find(u => u.id === matchingQuiz.authorId) || users.find(u => u.role === 'trainer') || { id: 'admin-1', name: 'System Trainer', role: 'trainer' as const };
      const newSession = this.createLiveSession(matchingQuiz, trainer as any);
      return newSession;
    }

    return null;
  },

  updateSession(session: LiveSession): void {
    const active = this.getActiveSessions();
    active[session.password] = session;
    this.saveActiveSessions(active);

    if (session.state === 'ended') {
      this.ensureSessionReportSaved(session);
    }
  },

  ensureSessionReportSaved(session: LiveSession): void {
    const reports = this.getReports();
    const existing = reports.find(r => r.sessionPassword === session.password);

    const participantsList = Object.values(session.participants || {});
    const sortedParticipants = [...participantsList].sort((a, b) => b.score - a.score);

    const quizzes = this.getQuizzes();
    const quiz = quizzes.find(q => q.id === session.quizId);
    const totalQuestions = quiz?.questions.length || 1;

    const participantScores = sortedParticipants.map((p, idx) => ({
      participantId: p.id,
      participantName: p.name,
      prn: p.prn || 'N/A',
      score: p.score,
      correctCount: p.correctAnswersCount,
      totalCount: totalQuestions,
      accuracyPercent: Math.round((p.correctAnswersCount / totalQuestions) * 100),
      rank: idx + 1
    }));

    const questionBreakdown = (quiz?.questions || []).map((q, qIdx) => {
      const qSubmissions = (session.submissions || []).filter(s => s.questionId === q.id);
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
      id: existing?.id || `rep-${Date.now()}`,
      sessionPassword: session.password,
      quizId: session.quizId,
      quizTitle: session.quizTitle,
      trainerName: session.trainerName,
      date: session.endedAt || new Date().toISOString(),
      totalParticipants: participantsList.length,
      averageScore: avgScore,
      averageAccuracy: avgAccuracy,
      participantScores,
      questionBreakdown
    };

    this.saveReport(report);
  },

  // --- REPORTS ---
  getReports(): SessionReport[] {
    const data = localStorage.getItem(REPORTS_KEY);
    if (!data) {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_REPORTS;
    }
  },

  saveReport(report: SessionReport): SessionReport[] {
    const reports = this.getReports();
    const updated = [report, ...reports.filter(r => r.id !== report.id)];
    localStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
    return updated;
  },

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    const data = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!data) {
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  },

  addAuditLog(userId: string, userName: string, userRole: User['role'], action: string, details: string): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole,
      action,
      details,
      ipAddress: '127.0.0.1'
    };
    const updated = [newLog, ...logs];
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated.slice(0, 100))); // keep latest 100 logs
  },

  // --- BUILT-IN DATABASE BACKUP & RESTORE ---
  exportDatabase(): void {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      users: this.getUsers(),
      quizzes: this.getQuizzes(),
      activeSessions: this.getActiveSessions(),
      reports: this.getReports(),
      auditLogs: this.getAuditLogs()
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quizpulse_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importDatabase(jsonData: any): boolean {
    try {
      if (!jsonData || typeof jsonData !== 'object') return false;
      if (Array.isArray(jsonData.users)) {
        localStorage.setItem(USERS_KEY, JSON.stringify(jsonData.users));
      }
      if (Array.isArray(jsonData.quizzes)) {
        localStorage.setItem(QUIZZES_KEY, JSON.stringify(jsonData.quizzes));
      }
      if (jsonData.activeSessions && typeof jsonData.activeSessions === 'object') {
        localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(jsonData.activeSessions));
      }
      if (Array.isArray(jsonData.reports)) {
        localStorage.setItem(REPORTS_KEY, JSON.stringify(jsonData.reports));
      }
      if (Array.isArray(jsonData.auditLogs)) {
        localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(jsonData.auditLogs));
      }
      return true;
    } catch {
      return false;
    }
  },

  resetDatabaseToDefault(): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(INITIAL_QUIZZES));
    localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify({}));
    localStorage.setItem(REPORTS_KEY, JSON.stringify(INITIAL_REPORTS));
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
  }
};
