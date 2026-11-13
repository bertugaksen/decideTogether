import { useState, useEffect, useRef, useCallback } from 'react';
import { Room, Participant, ServerMessage, ClientMessage, SavedSession, Venue, DuelState } from '../types.js';

const STORAGE_KEY = 'decidetogether_session';

export function useRoomSocket() {
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  >('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [peerDisconnectSeconds, setPeerDisconnectSeconds] = useState<number | null>(null);

  // Phase 3 extensions:
  const [partnerProgress, setPartnerProgress] = useState<{ cardIndex: number; totalCards: number } | null>(null);
  const [matchedVenue, setMatchedVenue] = useState<Venue | null>(null);
  const [isDeckExhausted, setIsDeckExhausted] = useState<boolean>(false);

  // Phase 4 Duel extensions:
  const [duelState, setDuelState] = useState<DuelState | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<ClientMessage[]>([]);

  // Helper to send typed message (queues safely if socket is still connecting)
  const send = useCallback((message: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      messageQueueRef.current.push(message);
    }
  }, []);

  // Save session to localStorage
  const saveSession = useCallback((roomCode: string, user: Participant) => {
    const session: SavedSession = {
      roomCode,
      userId: user.id,
      nickname: user.nickname,
      role: user.role,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, []);

  // Clear session
  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRoom(null);
    setCurrentUser(null);
    setError(null);
    setPeerDisconnectSeconds(null);
    setPartnerProgress(null);
    setMatchedVenue(null);
    setIsDeckExhausted(false);
    setDuelState(null);
  }, []);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (
      socketRef.current?.readyState === WebSocket.OPEN ||
      socketRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    setConnectionStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Works seamlessly across Vite dev proxy (/ws -> localhost:3001), LAN mobile testing, and production
    const wsUrl = window.location.host
      ? `${protocol}//${window.location.host}/ws`
      : 'ws://localhost:3001/ws';

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      setError(null);

      // Drain queued messages first (e.g. auto-join from URL parameter)
      if (messageQueueRef.current.length > 0) {
        const queue = [...messageQueueRef.current];
        messageQueueRef.current = [];
        for (const queuedMsg of queue) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(queuedMsg));
          }
        }
      } else {
        // If no explicit action was queued, restore session from localStorage if present
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const session: SavedSession = JSON.parse(saved);
            ws.send(
              JSON.stringify({
                type: 'JOIN_ROOM',
                roomCode: session.roomCode,
                userId: session.userId,
              })
            );
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'ROOM_CREATED':
            setRoom(
              message.room || {
                code: message.roomCode,
                hostId: message.user.id,
                status: 'waiting',
                participants: { [message.user.id]: message.user },
                createdAt: Date.now(),
                lastActiveAt: Date.now(),
              }
            );
            setCurrentUser(message.user);
            saveSession(message.roomCode, message.user);
            break;

          case 'ROOM_JOINED':
            setRoom(message.room);
            setCurrentUser(message.user);
            if (message.room.matchedVenue) {
              setMatchedVenue(message.room.matchedVenue);
            }
            if (message.room.duelState) {
              setDuelState(message.room.duelState);
            }
            if (message.room.status === 'duel') {
              setIsDeckExhausted(true);
            }
            saveSession(message.room.code, message.user);
            break;

          case 'ROOM_STATE':
            setRoom(message.room);
            if (message.room.matchedVenue) {
              setMatchedVenue(message.room.matchedVenue);
            } else {
              setMatchedVenue(null);
            }
            if (message.room.duelState) {
              setDuelState(message.room.duelState);
            }
            if (message.room.status === 'duel') {
              setIsDeckExhausted(true);
            } else if (message.room.status === 'waiting' || message.room.status === 'ready') {
              setIsDeckExhausted(false);
              setPartnerProgress(null);
              setDuelState(null);
            }
            break;

          case 'SWIPING_STARTED':
            setRoom((prev) => (prev ? { ...prev, status: 'swiping' } : null));
            break;

          case 'PARTNER_PROGRESS':
            setPartnerProgress({
              cardIndex: message.cardIndex,
              totalCards: message.totalCards,
            });
            break;

          case 'MATCH':
            setMatchedVenue(message.venue);
            setRoom((prev) => (prev ? { ...prev, status: 'matched', matchedVenue: message.venue } : null));
            if (message.duelResult) {
              setDuelState((prev) =>
                prev
                  ? {
                      ...prev,
                      status: 'finished',
                      scores: message.duelResult!.scores,
                      winnerId: message.duelResult!.winnerId,
                      tieBroken: message.duelResult!.tieBroken,
                    }
                  : {
                      status: 'finished',
                      mode: 'online',
                      startTime: 0,
                      durationMs: 5000,
                      scores: message.duelResult!.scores,
                      winnerId: message.duelResult!.winnerId,
                      tieBroken: message.duelResult!.tieBroken,
                    }
              );
            }
            break;

          case 'DUEL_STARTING':
            setDuelState({
              status: 'countdown',
              startTime: message.startTime,
              durationMs: message.durationMs,
              mode: message.mode,
              scores: {},
              initiatorId: message.initiatorId,
            });
            break;

          case 'DUEL_PROGRESS':
            setDuelState((prev) => (prev ? { ...prev, scores: message.scores } : null));
            break;

          case 'DECK_EXHAUSTED':
            setIsDeckExhausted(true);
            setRoom((prev) => (prev ? { ...prev, status: 'duel' } : null));
            break;

          case 'LOCATION_UPDATED':
            setRoom((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                location: message.location,
                venues: message.venues,
              };
            });
            break;

          case 'PEER_JOINED':
            setRoom((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                peerId: message.participant.id,
                status: 'ready',
                participants: {
                  ...prev.participants,
                  [message.participant.id]: message.participant,
                },
              };
            });
            setPeerDisconnectSeconds(null);
            break;

          case 'PEER_DISCONNECTED':
            setRoom((prev) => {
              if (!prev) return null;
              const p = prev.participants[message.userId];
              if (!p) return prev;
              return {
                ...prev,
                participants: {
                  ...prev.participants,
                  [message.userId]: { ...p, connected: false },
                },
              };
            });
            // Start 30s countdown
            setPeerDisconnectSeconds(Math.floor(message.reconnectDeadlineMs / 1000));
            break;

          case 'PEER_RECONNECTED':
            setRoom((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                participants: {
                  ...prev.participants,
                  [message.participant.id]: message.participant,
                },
              };
            });
            setPeerDisconnectSeconds(null);
            break;

          case 'ROOM_READY':
            setRoom((prev) => (prev ? { ...prev, status: 'ready' } : null));
            break;

          case 'ERROR':
            setError(message.message);
            if (message.message.includes('Oda bulunamadı') || message.message.includes('Geçersiz')) {
              clearSession();
            }
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      // Auto-reconnect after 2 seconds
      reconnectTimerRef.current = setTimeout(() => {
        setConnectionStatus('reconnecting');
        connect();
      }, 2000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws.close();
    };
  }, [clearSession, saveSession]);

  // Peer disconnect countdown timer
  useEffect(() => {
    if (peerDisconnectSeconds === null || peerDisconnectSeconds <= 0) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setPeerDisconnectSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [peerDisconnectSeconds]);

  // Connect on mount & reconnect on window focus / visibility change (MOB-04)
  useEffect(() => {
    connect();

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
          connect();
        }
      }
    };

    window.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('focus', handleFocusOrVisible);

    return () => {
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('focus', handleFocusOrVisible);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connect]);

  // Public methods (memoized with useCallback to prevent effect re-trigger loops)
  const createRoom = useCallback(
    (
      nickname?: string,
      location?: { districtId?: string; coords?: { lat: number; lng: number } }
    ) => {
      setError(null);
      send({ type: 'CREATE_ROOM', nickname, location });
    },
    [send]
  );

  const joinRoom = useCallback(
    (roomCode: string, nickname?: string) => {
      setError(null);
      send({ type: 'JOIN_ROOM', roomCode, nickname });
    },
    [send]
  );

  const updateNickname = useCallback(
    (nickname: string) => {
      send({ type: 'UPDATE_NICKNAME', nickname });
      setCurrentUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev, nickname };
        if (room) {
          saveSession(room.code, updated);
        }
        return updated;
      });
    },
    [room, saveSession, send]
  );

  const setLocation = useCallback(
    (districtId?: string, coords?: { lat: number; lng: number }) => {
      send({
        type: 'SET_LOCATION',
        districtId,
        coords,
      });
    },
    [send]
  );

  const leaveRoom = useCallback(() => {
    send({ type: 'LEAVE_ROOM' });
    clearSession();
    if (typeof window !== 'undefined' && window.location.search.includes('room=')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [clearSession, send]);

  const startSwiping = useCallback(() => {
    send({ type: 'START_SWIPING' });
  }, [send]);

  const sendSwipe = useCallback(
    (venueId: string, vote: 'like' | 'pass', cardIndex: number, totalCards: number) => {
      send({
        type: 'SWIPE',
        venueId,
        vote,
        cardIndex,
        totalCards,
      });
    },
    [send]
  );

  const startDuel = useCallback(
    (mode: 'online' | 'split' = 'online') => {
      send({ type: 'START_DUEL', mode });
    },
    [send]
  );

  const sendDuelTap = useCallback(
    (taps: number) => {
      send({ type: 'DUEL_TAP', taps });
    },
    [send]
  );

  const resolveSplitDuel = useCallback(
    (winnerRole: 'p1' | 'p2', scores: { p1: number; p2: number }) => {
      send({ type: 'RESOLVE_SPLIT_DUEL', winnerRole, scores });
    },
    [send]
  );

  const peer: Participant | null = room && currentUser
    ? Object.values(room.participants).find((p) => p.id !== currentUser.id) || null
    : null;

  return {
    room,
    currentUser,
    peer,
    connectionStatus,
    error,
    peerDisconnectSeconds,
    partnerProgress,
    matchedVenue,
    isDeckExhausted,
    duelState,
    createRoom,
    joinRoom,
    updateNickname,
    leaveRoom,
    setLocation,
    startSwiping,
    sendSwipe,
    startDuel,
    sendDuelTap,
    resolveSplitDuel,
  };
}
