import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager } from './roomManager.js';
import { ClientMessage } from './types.js';
import { MOCK_DISTRICTS } from './services/mockVenues.js';
import { isValidCoordinate } from './services/venueService.js';
import { logger } from './logger.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const roomManager = new RoomManager();

// Production Health Check & Monitoring Telemetry (T-08-03: Zero Sensitive Disclosure)
const getHealthPayload = () => ({
  status: 'ok',
  uptime: process.uptime(),
  activeRooms: roomManager.getActiveRoomCount(),
  storage: 'sqlite',
  timestamp: new Date().toISOString(),
});

app.get('/health', (_req, res) => {
  res.json(getHealthPayload());
});

app.get('/api/health', (_req, res) => {
  res.json(getHealthPayload());
});

// REST Districts (VENUE-01 / VENUE-02)
app.get('/api/districts', (_req, res) => {
  res.json({ districts: MOCK_DISTRICTS });
});

// Resolve GPS Location or District (VENUE-01)
app.get('/api/locations/resolve', async (req, res) => {
  const latStr = req.query.lat as string | undefined;
  const lngStr = req.query.lng as string | undefined;
  const districtId = req.query.districtId as string | undefined;

  const lat = latStr ? parseFloat(latStr) : undefined;
  const lng = lngStr ? parseFloat(lngStr) : undefined;
  const coords = isValidCoordinate(lat, lng) && lat !== undefined && lng !== undefined ? { lat, lng } : undefined;

  try {
    const venueService = roomManager.getVenueService();
    const resolved = await venueService.resolveLocationAndVenues(districtId, coords);
    res.json({
      location: resolved.location,
      venueCount: resolved.venues.length,
    });
  } catch (err) {
    logger.error('Error resolving location', err, { endpoint: '/api/locations/resolve' });
    res.status(500).json({ error: 'Konum çözümlenemedi' });
  }
});

// Photo Proxy Endpoint (VENUE-02 - protects GOOGLE_PLACES_API_KEY from exposure, T-02-01)
const VALID_PHOTO_NAME_REGEX = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

app.get('/api/venues/photo', async (req, res) => {
  const photoName = req.query.name as string;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const fallbackUrl = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';

  if (!photoName || !VALID_PHOTO_NAME_REGEX.test(photoName) || !apiKey) {
    return res.redirect(fallbackUrl);
  }

  const googlePhotoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=600&maxWidthPx=800&key=${apiKey}`;

  try {
    const photoRes = await fetch(googlePhotoUrl);
    if (!photoRes.ok) {
      return res.redirect(fallbackUrl);
    }

    res.setHeader('Cache-Control', 'public, max-age=86400');
    const contentType = photoRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);

    const arrayBuffer = await photoRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    logger.error('Error proxying Google Places photo', err, { endpoint: '/api/venues/photo' });
    return res.redirect(fallbackUrl);
  }
});

// Check if a room exists
app.get('/api/rooms/:code', (req, res) => {
  const room = roomManager.getRoom(req.params.code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  return res.json({
    code: room.code,
    status: room.status,
    participantCount: Object.keys(room.participants).length,
  });
});

const server = createServer(app);

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  // Listen for client messages
  ws.on('message', async (data: string) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'CREATE_ROOM':
          await roomManager.createRoom(ws, message.nickname, message.location);
          break;

        case 'JOIN_ROOM':
          roomManager.joinRoom(ws, message.roomCode, message.userId, message.nickname);
          break;

        case 'SET_LOCATION':
          await roomManager.setLocation(ws, message.districtId, message.coords);
          break;

        case 'UPDATE_NICKNAME':
          roomManager.updateNickname(ws, message.nickname);
          break;

        case 'LEAVE_ROOM':
          roomManager.leaveRoom(ws);
          break;

        case 'START_SWIPING':
          roomManager.startSwiping(ws);
          break;

        case 'SWIPE':
          roomManager.recordSwipe(
            ws,
            message.venueId,
            message.vote,
            message.cardIndex,
            message.totalCards
          );
          break;

        case 'PING':
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PONG' }));
          }
          break;

        case 'START_DUEL':
          roomManager.startDuel(ws, message.mode);
          break;

        case 'DUEL_TAP':
          roomManager.recordDuelTap(ws, message.taps);
          break;

        case 'RESOLVE_SPLIT_DUEL': {
          const clientInfo = roomManager.getClientInfo(ws);
          if (clientInfo) {
            const room = roomManager.getRoom(clientInfo.roomCode);
            if (room) {
              const p1Score = Math.max(0, Math.min(300, Number(message.scores?.p1) || 0));
              const p2Score = Math.max(0, Math.min(300, Number(message.scores?.p2) || 0));
              if (room.duelState) {
                room.duelState.scores = {
                  [room.hostId]: p1Score,
                  [room.peerId || 'peer']: p2Score,
                };
              }
              // On exact tie, pass undefined so concludeDuel runs a fair coin toss with tieBroken: true
              const winnerId =
                p1Score === p2Score
                  ? undefined
                  : message.winnerRole === 'p1'
                  ? room.hostId
                  : room.peerId || room.hostId;
              roomManager.concludeDuel(room.code, winnerId);
            }
          }
          break;
        }

        default:
          logger.warn('Unhandled client message', { messageType: (message as any)?.type });
      }
    } catch (err) {
      logger.error('Error parsing client message', err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Geçersiz mesaj formatı' }));
      }
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    roomManager.handleDisconnect(ws);
  });

  ws.on('error', (err) => {
    logger.error('WebSocket connection error', err);
    roomManager.handleDisconnect(ws);
  });
});

server.listen(port, () => {
  logger.info(`Backend server running on http://localhost:${port}`);
  logger.info(`WebSockets active on ws://localhost:${port}/ws`);
});
