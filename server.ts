import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// In-memory sessions state on backend
interface ClientWs extends WebSocket {
  roomPin?: string;
  userId?: string;
  userName?: string;
  isHost?: boolean;
}

const rooms: Record<string, {
  hostWs?: ClientWs;
  clients: Set<ClientWs>;
  sessionState: any;
}> = {};

// WebSocket message handler
wss.on('connection', (ws: ClientWs) => {
  ws.on('message', (messageRaw: string) => {
    try {
      const data = JSON.parse(messageRaw.toString());
      const { type, pin, payload } = data;

      if (!pin) return;

      if (!rooms[pin]) {
        rooms[pin] = {
          clients: new Set(),
          sessionState: null
        };
      }

      const room = rooms[pin];

      switch (type) {
        case 'HOST_JOIN':
          ws.roomPin = pin;
          ws.isHost = true;
          room.hostWs = ws;
          room.clients.add(ws);
          if (payload) {
            room.sessionState = payload;
          }
          broadcastToRoom(pin, {
            type: 'SESSION_UPDATE',
            sessionState: room.sessionState,
            activeCount: room.clients.size
          });
          break;

        case 'LEARNER_JOIN':
          ws.roomPin = pin;
          ws.isHost = false;
          ws.userId = payload?.userId || `guest-${Date.now()}`;
          ws.userName = payload?.userName || 'Anonymous Participant';
          room.clients.add(ws);

          if (room.sessionState && payload) {
            if (!room.sessionState.participants) {
              room.sessionState.participants = {};
            }
            room.sessionState.participants[ws.userId] = {
              id: ws.userId,
              name: ws.userName,
              score: 0,
              correctAnswersCount: 0,
              totalAnsweredCount: 0,
              joinedAt: new Date().toISOString(),
              isGuest: true
            };
          }

          broadcastToRoom(pin, {
            type: 'SESSION_UPDATE',
            sessionState: room.sessionState,
            activeCount: room.clients.size
          });
          break;

        case 'HOST_ACTION':
          if (payload) {
            room.sessionState = payload;
          }
          broadcastToRoom(pin, {
            type: 'SESSION_UPDATE',
            sessionState: room.sessionState,
            activeCount: room.clients.size
          });
          break;

        case 'SUBMIT_ANSWER':
          if (room.sessionState && payload) {
            const { submission } = payload;
            if (submission) {
              if (!room.sessionState.submissions) {
                room.sessionState.submissions = [];
              }
              // Add or update submission
              const existingIdx = room.sessionState.submissions.findIndex(
                (s: any) => s.questionId === submission.questionId && s.participantId === submission.participantId
              );
              if (existingIdx >= 0) {
                room.sessionState.submissions[existingIdx] = submission;
              } else {
                room.sessionState.submissions.push(submission);
              }

              // Update participant score
              if (room.sessionState.participants?.[submission.participantId]) {
                const p = room.sessionState.participants[submission.participantId];
                p.score = (p.score || 0) + (submission.pointsEarned || 0);
                p.totalAnsweredCount = (p.totalAnsweredCount || 0) + 1;
                if (submission.isCorrect) {
                  p.correctAnswersCount = (p.correctAnswersCount || 0) + 1;
                }
              }

              broadcastToRoom(pin, {
                type: 'SESSION_UPDATE',
                sessionState: room.sessionState,
                activeCount: room.clients.size
              });
            }
          }
          break;

        case 'PING':
          ws.send(JSON.stringify({ type: 'PONG' }));
          break;
      }
    } catch (err) {
      console.error('WS Error:', err);
    }
  });

  ws.on('close', () => {
    if (ws.roomPin && rooms[ws.roomPin]) {
      const room = rooms[ws.roomPin];
      room.clients.delete(ws);
      if (ws.isHost) {
        room.hostWs = undefined;
      }
      broadcastToRoom(ws.roomPin, {
        type: 'SESSION_UPDATE',
        sessionState: room.sessionState,
        activeCount: room.clients.size
      });
    }
  });
});

function broadcastToRoom(pin: string, data: any) {
  const room = rooms[pin];
  if (!room) return;
  const message = JSON.stringify(data);
  for (const client of room.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// REST API Endpoints
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend assets in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // In dev mode, Vite handles SPA fallback
      res.status(200).send('QuizPulse Backend Running');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`QuizPulse server running on port ${PORT}`);
});
