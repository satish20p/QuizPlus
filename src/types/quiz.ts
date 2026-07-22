export type UserRole = 'admin' | 'coadmin' | 'trainer' | 'learner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending';
  avatar?: string;
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  questionText: string;
  options: QuestionOption[]; // 2 to 4 choices
  correctOptionId: string;
  explanation: string;
  timeLimitSeconds: number; // 10 to 240 seconds
  points: number; // Points calculation base
  marks?: number; // 1 to 5 marks set by trainer
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  authorId: string;
  authorName: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  timesHosted: number;
}

export type SessionState = 
  | 'lobby' 
  | 'question_active' 
  | 'question_closed' 
  | 'answer_revealed' 
  | 'leaderboard' 
  | 'ended';

export interface Participant {
  id: string;
  name: string;
  prn?: string;
  avatar?: string;
  score: number;
  correctAnswersCount: number;
  totalAnsweredCount: number;
  joinedAt: string;
  isGuest: boolean;
  email?: string;
  rank?: number;
}

export interface Submission {
  questionId: string;
  participantId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  timeTakenSeconds: number;
  pointsEarned: number;
  submittedAt: string;
}

export interface LiveSession {
  pin: string; // 6-digit unique pin code e.g. "482910"
  quizId: string;
  quizTitle: string;
  trainerId: string;
  trainerName: string;
  state: SessionState;
  currentQuestionIndex: number;
  questionStartTime: number | null; // Timestamp when current question started
  questionTimeRemaining: number; // Seconds remaining in countdown
  isTimerRunning: boolean;
  participants: Record<string, Participant>;
  submissions: Submission[];
  createdAt: string;
  endedAt?: string;
}

export interface SessionReport {
  id: string;
  sessionPin: string;
  quizId: string;
  quizTitle: string;
  trainerName: string;
  date: string;
  totalParticipants: number;
  averageScore: number;
  averageAccuracy: number;
  participantScores: {
    participantId: string;
    participantName: string;
    prn?: string;
    score: number;
    correctCount: number;
    totalCount: number;
    accuracyPercent: number;
    rank: number;
  }[];
  questionBreakdown: {
    questionIndex: number;
    questionText: string;
    correctOptionText: string;
    totalSubmissions: number;
    correctCount: number;
    accuracyPercent: number;
    averageTimeSeconds: number;
  }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  ipAddress?: string;
}
