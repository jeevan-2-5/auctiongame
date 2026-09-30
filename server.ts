import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { auctionManager } from './src/server/auctionManager';
import { PLAYERS_DATABASE } from './src/data/players';
import { FRANCHISE_TEAMS } from './src/data/teams';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enable CORS for all incoming requests (useful for hosted domains & proxies)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Store active socket connections mapped by roomId
interface ClientInfo {
  ws: WebSocket;
  roomId?: string;
  sessionId?: string;
}
const clients = new Set<ClientInfo>();

wss.on('connection', (ws: WebSocket) => {
  const client: ClientInfo = { ws };
  clients.add(client);

  ws.on('message', (messageRaw: string) => {
    try {
      const data = JSON.parse(messageRaw.toString());
      const { type, roomId, sessionId } = data;

      if (type === 'SUBSCRIBE' && roomId) {
        const cleanRoomId = roomId.toUpperCase().trim();
        client.roomId = cleanRoomId;
        client.sessionId = sessionId;

        // Auto-ensure room exists (creates on-demand so friends are never stuck on "Connecting...")
        const room = auctionManager.getOrCreateRoom(cleanRoomId, sessionId, data.playerName);

        // Auto-ensure player is registered in room
        if (sessionId) {
          auctionManager.ensurePlayerInRoom(cleanRoomId, sessionId, data.playerName);
        }

        // Register room broadcast callback if not registered
        auctionManager.registerBroadcast(cleanRoomId, (updatedRoom, event) => {
          const payload = JSON.stringify({
            type: 'ROOM_UPDATE',
            room: updatedRoom,
            event,
          });
          for (const c of clients) {
            if (c.roomId === cleanRoomId && c.ws.readyState === WebSocket.OPEN) {
              c.ws.send(payload);
            }
          }
        });

        // Always send fresh room state immediately to subscriber
        const currentRoom = auctionManager.getRoom(cleanRoomId) || room;
        ws.send(JSON.stringify({ type: 'ROOM_STATE', room: currentRoom }));
      } else if (type === 'BID' && roomId && sessionId) {
        const result = auctionManager.placeBid(roomId, sessionId, data.amountLakhs);
        if (!result.success) {
          ws.send(JSON.stringify({ type: 'ERROR', error: result.error }));
        }
      } else if (type === 'SELECT_TEAM' && roomId && sessionId && data.teamId) {
        const result = auctionManager.selectTeam(roomId, sessionId, data.teamId, data.playerName);
        if (!result.success) {
          ws.send(JSON.stringify({ type: 'ERROR', error: result.error }));
        }
      } else if (type === 'START_AUCTION' && roomId && sessionId) {
        const result = auctionManager.startAuction(roomId, sessionId);
        if (!result.success) {
          ws.send(JSON.stringify({ type: 'ERROR', error: result.error }));
        }
      } else if (type === 'PAUSE_AUCTION' && roomId && sessionId) {
        auctionManager.pauseAuction(roomId, sessionId);
      } else if (type === 'RESUME_AUCTION' && roomId && sessionId) {
        auctionManager.resumeAuction(roomId, sessionId);
      } else if (type === 'SKIP_PLAYER' && roomId && sessionId) {
        auctionManager.skipPlayer(roomId, sessionId);
      } else if (type === 'END_AUCTION' && roomId && sessionId) {
        const result = auctionManager.endAuctionManually(roomId, sessionId);
        if (!result.success) {
          ws.send(JSON.stringify({ type: 'ERROR', error: result.error }));
        }
      } else if (type === 'SUBMIT_PLAYING_XI' && roomId && sessionId && data.playingXI) {
        const result = auctionManager.submitPlayingXI(roomId, sessionId, data.playingXI);
        if (!result.success) {
          ws.send(JSON.stringify({ type: 'ERROR', error: result.error }));
        }
      } else if (type === 'TRIGGER_ANALYSIS' && roomId) {
        auctionManager.runTournamentAnalysis(roomId);
      } else if ((type === 'EDIT_PLAYING_XI' || type === 'RETURN_TO_PLAYING_XI') && roomId) {
        auctionManager.returnToPlayingXI(roomId);
      } else if (type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
    } catch (e) {
      console.error('WebSocket message parsing error:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(client);
  });
});

// REST API Endpoints
app.get('/api/config', (req, res) => {
  let appUrl = process.env.APP_URL || '';
  if (!appUrl) {
    const host = req.get('host') || '';
    if (host) {
      const proto = req.get('x-forwarded-proto') || 'https';
      appUrl = `${proto}://${host}`;
    }
  }
  const publicUrl = appUrl.replace('ais-dev-', 'ais-pre-');
  res.json({ appUrl, publicUrl });
});

app.get('/api/teams', (req, res) => {
  res.json({ teams: FRANCHISE_TEAMS });
});

app.get('/api/players', (req, res) => {
  const query = (req.query.q as string || '').toLowerCase();
  const role = req.query.role as string;
  const country = req.query.country as string;

  let filtered = PLAYERS_DATABASE;
  if (query) {
    filtered = filtered.filter(
      (p) =>
        p.fullName.toLowerCase().includes(query) ||
        p.country.toLowerCase().includes(query) ||
        p.currentRealTeam.toLowerCase().includes(query)
    );
  }
  if (role && role !== 'ALL') {
    filtered = filtered.filter((p) => p.role === role);
  }
  if (country && country !== 'ALL') {
    filtered = filtered.filter((p) => p.country === country);
  }
  res.json({ players: filtered, total: filtered.length });
});

app.post('/api/rooms', (req, res) => {
  try {
    let { hostName, hostSessionId, settings, selectedTeamId } = req.body || {};
    if (!hostSessionId) {
      hostSessionId = 'usr-' + Math.random().toString(36).substring(2, 9);
    }
    const room = auctionManager.createRoom(
      hostName || 'Host Owner',
      hostSessionId,
      settings,
      selectedTeamId || 'RCB'
    );
    res.json({ success: true, room });
  } catch (err: any) {
    console.error('Error in POST /api/rooms:', err);
    res.status(500).json({ error: err.message || 'Failed to create room' });
  }
});

app.get('/api/rooms', (req, res) => {
  const rooms = auctionManager.getAllPublicRooms();
  res.json({ rooms });
});

app.get('/api/rooms/:id', (req, res) => {
  const roomId = req.params.id ? req.params.id.toUpperCase().trim() : '';
  const room = auctionManager.getOrCreateRoom(roomId);
  res.json({ success: true, room });
});

app.post('/api/rooms/:id/join', (req, res) => {
  const roomId = req.params.id ? req.params.id.toUpperCase().trim() : '';
  auctionManager.getOrCreateRoom(roomId);
  const { playerSessionId, playerName, teamId, isSpectator } = req.body;
  const result = auctionManager.joinRoom(
    roomId,
    playerSessionId,
    playerName,
    teamId,
    isSpectator
  );
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true, room: result.room });
});

app.post('/api/rooms/:id/select-team', (req, res) => {
  const { playerSessionId, teamId, playerName } = req.body;
  const result = auctionManager.selectTeam(req.params.id.toUpperCase(), playerSessionId, teamId, playerName);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true });
});

app.post('/api/rooms/:id/start', (req, res) => {
  const { hostSessionId } = req.body;
  const result = auctionManager.startAuction(req.params.id.toUpperCase(), hostSessionId);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true });
});

app.post('/api/rooms/:id/end', (req, res) => {
  const { hostSessionId } = req.body;
  const result = auctionManager.endAuctionManually(req.params.id.toUpperCase(), hostSessionId);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true });
});

app.post('/api/rooms/:id/bid', (req, res) => {
  const { playerSessionId, amountLakhs } = req.body;
  const result = auctionManager.placeBid(req.params.id.toUpperCase(), playerSessionId, amountLakhs);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true });
});

app.post('/api/rooms/:id/playing-xi', (req, res) => {
  const { playerSessionId, playingXI } = req.body;
  const result = auctionManager.submitPlayingXI(req.params.id.toUpperCase(), playerSessionId, playingXI);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true });
});

app.post('/api/rooms/:id/analyze', async (req, res) => {
  await auctionManager.runTournamentAnalysis(req.params.id.toUpperCase());
  const room = auctionManager.getRoom(req.params.id.toUpperCase());
  res.json({ success: true, room });
});

app.post('/api/rooms/:id/edit-xi', (req, res) => {
  const result = auctionManager.returnToPlayingXI(req.params.id.toUpperCase());
  res.json(result);
});

// CSV Player Import endpoint
app.post('/api/players/import', (req, res) => {
  const { csvText } = req.body;
  if (!csvText) {
    return res.status(400).json({ error: 'CSV text is required' });
  }
  try {
    const lines = csvText.split('\n').filter((l: string) => l.trim().length > 0);
    const headers = lines[0].split(',').map((h: string) => h.trim());
    let importedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c: string) => c.trim());
      if (cols.length >= 4) {
        importedCount++;
      }
    }
    res.json({ success: true, importedCount, message: `Parsed ${importedCount} player entries successfully.` });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to parse CSV' });
  }
});

const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🏏 Cricket Auction Arena server running on port ${PORT}`);
  });
}

startServer();
