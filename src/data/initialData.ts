import { User, Quiz, SessionReport, AuditLog } from '../types/quiz';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin-1',
    name: 'Sarah Connor',
    email: 'admin@quizpulse.io',
    role: 'admin',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'user-coadmin-1',
    name: 'Marcus Brody',
    email: 'coadmin@quizpulse.io',
    role: 'coadmin',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    createdAt: '2026-01-15T11:20:00Z',
  },
  {
    id: 'user-trainer-1',
    name: 'Dr. Alex Mercer',
    email: 'alex.mercer@techacademy.edu',
    role: 'trainer',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    createdAt: '2026-02-01T10:30:00Z',
  },
  {
    id: 'user-trainer-2',
    name: 'Elena Rostova',
    email: 'elena.rostova@corptrainers.com',
    role: 'trainer',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    createdAt: '2026-02-15T14:20:00Z',
  },
  {
    id: 'user-learner-1',
    name: 'Marcus Vance',
    email: 'marcus.v@student.edu',
    role: 'learner',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    createdAt: '2026-03-01T11:00:00Z',
  },
  {
    id: 'user-learner-2',
    name: 'Sofia Chen',
    email: 'sofia.chen@dev.io',
    role: 'learner',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    createdAt: '2026-03-02T12:15:00Z',
  },
  {
    id: 'user-learner-3',
    name: 'David Kalu',
    email: 'david.kalu@corp.org',
    role: 'learner',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
    createdAt: '2026-03-05T16:45:00Z',
  },
];

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'Modern Full-Stack Web Architecture 2026',
    description: 'Test your knowledge on React 19, TypeScript, Express WebSockets, and Cloud Infrastructure.',
    category: 'Engineering & Tech',
    authorId: 'user-trainer-1',
    authorName: 'Dr. Alex Mercer',
    isPublished: true,
    timesHosted: 14,
    createdAt: '2026-04-10T10:00:00Z',
    updatedAt: '2026-07-01T12:00:00Z',
    questions: [
      {
        id: 'q1-1',
        questionText: 'What key optimization does React 19 introduce to automatically memoize component subtrees?',
        options: [
          { id: 'opt-a', text: 'React Compiler (Forget)' },
          { id: 'opt-b', text: 'Manual useMemo hooks only' },
          { id: 'opt-c', text: 'Virtual DOM Shadowing' },
          { id: 'opt-d', text: 'Automatic Web Worker Isolation' },
        ],
        correctOptionId: 'opt-a',
        explanation: 'The React Compiler automatically memoizes values and component trees, eliminating the need for manual useMemo or useCallback in most codebases.',
        timeLimitSeconds: 25,
        marks: 1,
        points: 1000,
      },
      {
        id: 'q1-2',
        questionText: 'Which HTTP header is sent by a browser client during the initial WebSocket upgrade request?',
        options: [
          { id: 'opt-a', text: 'Connection: keep-alive' },
          { id: 'opt-b', text: 'Upgrade: websocket' },
          { id: 'opt-c', text: 'Transfer-Encoding: chunked' },
          { id: 'opt-d', text: 'Accept-Encoding: gzip' },
        ],
        correctOptionId: 'opt-b',
        explanation: 'The client sends HTTP headers "Upgrade: websocket" and "Connection: Upgrade" to initiate a WebSocket protocol handshake.',
        timeLimitSeconds: 20,
        marks: 1,
        points: 1000,
      },
      {
        id: 'q1-3',
        questionText: 'In a real-time multiplayer application, why is a Server-Authoritative state model essential?',
        options: [
          { id: 'opt-a', text: 'It reduces server CPU usage to zero' },
          { id: 'opt-b', text: 'It prevents client-side tampering, cheats, and race condition conflicts' },
          { id: 'opt-c', text: 'It guarantees offline storage persistence' },
          { id: 'opt-d', text: 'It forces clients to run single-threaded' },
        ],
        correctOptionId: 'opt-b',
        explanation: 'Server-authoritative state ensures that only validated server calculations mutate game or session state, guarding against client cheat scripts.',
        timeLimitSeconds: 30,
        marks: 1,
        points: 1200,
      },
      {
        id: 'q1-4',
        questionText: 'Deep-dive Scenario: Analyze how OAuth 2.1 PKCE (Proof Key for Code Exchange) protects public client web apps from authorization code interception attacks.',
        options: [
          { id: 'opt-a', text: 'By encrypting client cookies using standard AES-256' },
          { id: 'opt-b', text: 'By using a high-entropy secret code_verifier and code_challenge hash during exchange' },
          { id: 'opt-c', text: 'By replacing HTTPS with custom TCP tunnels' },
          { id: 'opt-d', text: 'By bypassing authorization servers altogether' },
        ],
        correctOptionId: 'opt-b',
        explanation: 'PKCE generates a cryptographically random code_verifier on the client, sending its SHA-256 hash (code_challenge) during authorization. When exchanging the code for tokens, the server verifies the original code_verifier match.',
        timeLimitSeconds: 90, // Longer scenario timer!
        marks: 1,
        points: 1500,
      }
    ]
  },
  {
    id: 'quiz-2',
    title: 'Corporate Security & Compliance Masterclass',
    description: 'Essential interactive assessment on SOC2 compliance, passwordless auth, and phish-resistant MFA.',
    category: 'Corporate Security',
    authorId: 'user-trainer-2',
    authorName: 'Elena Rostova',
    isPublished: true,
    timesHosted: 8,
    createdAt: '2026-05-01T09:30:00Z',
    updatedAt: '2026-06-18T15:10:00Z',
    questions: [
      {
        id: 'q2-1',
        questionText: 'Which authentication method provides hardware-bound protection against phishing attacks?',
        options: [
          { id: 'opt-a', text: 'SMS 6-digit OTP' },
          { id: 'opt-b', text: 'FIDO2 / WebAuthn Hardware Security Keys' },
          { id: 'opt-c', text: 'Email link verification' },
          { id: 'opt-d', text: 'Static 16-character complex passwords' },
        ],
        correctOptionId: 'opt-b',
        explanation: 'FIDO2/WebAuthn uses cryptographic public key authentication tied strictly to domain origin, preventing phishing domain redirects.',
        timeLimitSeconds: 20,
        marks: 1,
        points: 1000,
      },
      {
        id: 'q2-2',
        questionText: 'In SOC2 Type II audits, what is the key difference compared to SOC2 Type I?',
        options: [
          { id: 'opt-a', text: 'Type II tests operational effectiveness over a specified time window (e.g. 6-12 months)' },
          { id: 'opt-b', text: 'Type II is only for hardware manufacturers' },
          { id: 'opt-c', text: 'Type I requires penetration testing while Type II does not' },
          { id: 'opt-d', text: 'Type II is valid for 10 years without renewal' },
        ],
        correctOptionId: 'opt-a',
        explanation: 'SOC2 Type I evaluates security control design at a single point in time, whereas Type II tests continuous operational effectiveness over a audit period.',
        timeLimitSeconds: 45,
        marks: 1,
        points: 1000,
      }
    ]
  },
  {
    id: 'quiz-3',
    title: 'AI & Large Language Models Essentials 2026',
    description: 'Interactive speed round covering multimodal AI, context windows, and agentic workflows.',
    category: 'Artificial Intelligence',
    authorId: 'user-trainer-1',
    authorName: 'Dr. Alex Mercer',
    isPublished: true,
    timesHosted: 22,
    createdAt: '2026-05-15T11:00:00Z',
    updatedAt: '2026-07-10T08:00:00Z',
    questions: [
      {
        id: 'q3-1',
        questionText: 'What is Function Calling in modern LLM API architectures?',
        options: [
          { id: 'opt-a', text: 'The model executing arbitrary binary code on the server directly' },
          { id: 'opt-b', text: 'The model outputting structured JSON arguments matching developer-declared tool signatures' },
          { id: 'opt-c', text: 'Calling customer service numbers via AI voice' },
          { id: 'opt-d', text: 'Pre-compiling neural net weights into JavaScript' },
        ],
        correctOptionId: 'opt-b',
        explanation: 'Function calling allows LLMs to output clean, structured tool arguments in response to user requests, which the client application then executes.',
        timeLimitSeconds: 15,
        marks: 1,
        points: 1000,
      },
      {
        id: 'q3-2',
        questionText: 'How does Grounding with Google Search enhance LLM responses?',
        options: [
          { id: 'opt-a', text: 'By grounding the server physically in data centers' },
          { id: 'opt-b', text: 'By injecting real-time search query results and web citations into model context' },
          { id: 'opt-c', text: 'By disabling external network requests' },
          { id: 'opt-d', text: 'By translating text to binary' },
        ],
        correctOptionId: 'opt-b',
        explanation: 'Search Grounding retrieves live web pages and verified facts, reducing hallucinations and providing citations for real-time information.',
        timeLimitSeconds: 15,
        marks: 1,
        points: 1000,
      }
    ]
  }
];

export const INITIAL_REPORTS: SessionReport[] = [
  {
    id: 'rep-101',
    sessionPin: '829104',
    quizId: 'quiz-1',
    quizTitle: 'Modern Full-Stack Web Architecture 2026',
    trainerName: 'Dr. Alex Mercer',
    date: '2026-07-20T14:30:00Z',
    totalParticipants: 18,
    averageScore: 3240,
    averageAccuracy: 82,
    participantScores: [
      {
        participantId: 'p-1',
        participantName: 'Sofia Chen',
        score: 4420,
        correctCount: 4,
        totalCount: 4,
        accuracyPercent: 100,
        rank: 1
      },
      {
        participantId: 'p-2',
        participantName: 'Marcus Vance',
        score: 3890,
        correctCount: 3,
        totalCount: 4,
        accuracyPercent: 75,
        rank: 2
      },
      {
        participantId: 'p-3',
        participantName: 'David Kalu',
        score: 3100,
        correctCount: 3,
        totalCount: 4,
        accuracyPercent: 75,
        rank: 3
      },
      {
        participantId: 'p-4',
        participantName: 'Taylor Swift (Guest)',
        score: 2450,
        correctCount: 2,
        totalCount: 4,
        accuracyPercent: 50,
        rank: 4
      }
    ],
    questionBreakdown: [
      {
        questionIndex: 1,
        questionText: 'What key optimization does React 19 introduce to automatically memoize component subtrees?',
        correctOptionText: 'React Compiler (Forget)',
        totalSubmissions: 18,
        correctCount: 16,
        accuracyPercent: 88,
        averageTimeSeconds: 8.4
      },
      {
        questionIndex: 2,
        questionText: 'Which HTTP header is sent by a browser client during the initial WebSocket upgrade request?',
        correctOptionText: 'Upgrade: websocket',
        totalSubmissions: 18,
        correctCount: 15,
        accuracyPercent: 83,
        averageTimeSeconds: 6.2
      },
      {
        questionIndex: 3,
        questionText: 'In a real-time multiplayer application, why is a Server-Authoritative state model essential?',
        correctOptionText: 'It prevents client-side tampering, cheats, and race condition conflicts',
        totalSubmissions: 18,
        correctCount: 14,
        accuracyPercent: 77,
        averageTimeSeconds: 12.1
      },
      {
        questionIndex: 4,
        questionText: 'Deep-dive Scenario: Analyze how OAuth 2.1 PKCE protects public client web apps...',
        correctOptionText: 'By using a high-entropy secret code_verifier and code_challenge hash',
        totalSubmissions: 18,
        correctCount: 12,
        accuracyPercent: 66,
        averageTimeSeconds: 34.5
      }
    ]
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-07-22T05:30:00Z',
    userId: 'user-admin-1',
    userName: 'Sarah Connor',
    userRole: 'admin',
    action: 'USER_ROLE_VERIFIED',
    details: 'System audit completed. All 6 registered accounts verified active.',
    ipAddress: '192.168.1.10'
  },
  {
    id: 'log-2',
    timestamp: '2026-07-21T18:10:00Z',
    userId: 'user-trainer-1',
    userName: 'Dr. Alex Mercer',
    userRole: 'trainer',
    action: 'LIVE_SESSION_CREATED',
    details: 'Launched live quiz session "Modern Full-Stack Web Architecture 2026" with PIN 829104.',
    ipAddress: '172.16.0.42'
  },
  {
    id: 'log-3',
    timestamp: '2026-07-20T16:00:00Z',
    userId: 'user-admin-1',
    userName: 'Sarah Connor',
    userRole: 'admin',
    action: 'ACCOUNT_ACTIVATED',
    details: 'Activated trainer account for Elena Rostova (elena.rostova@corptrainers.com).',
    ipAddress: '192.168.1.10'
  }
];
