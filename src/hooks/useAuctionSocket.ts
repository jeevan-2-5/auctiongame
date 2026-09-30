import { useEffect, useRef, useState, useCallback } from 'react';
import { AuctionEvent, Room } from '../types/auction';
import { sounds } from '../utils/soundEffects';

interface UseAuctionSocketProps {
  roomId: string | null;
  sessionId: string;
  playerName?: string;
}

export function useAuctionSocket({ roomId, sessionId, playerName }: UseAuctionSocketProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimerRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!roomId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setErrorMsg(null);
        // Subscribe to current room with playerName
        ws.send(JSON.stringify({ type: 'SUBSCRIBE', roomId, sessionId, playerName }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ROOM_STATE' || data.type === 'ROOM_UPDATE') {
            const updatedRoom: Room = data.room;
            setRoom(updatedRoom);

            // Handle audio cues
            const ev: AuctionEvent | undefined = data.event;
            if (ev) {
              if (ev.type === 'BID_PLACED') {
                sounds.playBid();
              } else if (ev.type === 'PLAYER_SOLD') {
                sounds.playHammer();
              } else if (ev.type === 'ANALYSIS_COMPLETED') {
                sounds.playVictory();
              }
            }

            // Timer audio warning
            if (
              updatedRoom.auction.isTimerRunning &&
              updatedRoom.auction.timerSeconds <= 3 &&
              updatedRoom.auction.timerSeconds > 0 &&
              updatedRoom.auction.timerSeconds !== lastTimerRef.current
            ) {
              sounds.playTick();
              lastTimerRef.current = updatedRoom.auction.timerSeconds;
            }
          } else if (data.type === 'ERROR') {
            setErrorMsg(data.error);
            setTimeout(() => setErrorMsg(null), 4000);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        // Auto-reconnect after 2 seconds
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 2000);
      };

      ws.onerror = (e) => {
        console.error('WebSocket error', e);
        setIsConnected(false);
      };
    } catch (e) {
      console.error('Socket init error', e);
    }
  }, [roomId, sessionId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Actions
  const placeBid = useCallback(async (amountLakhs: number) => {
    if (!roomId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'BID', roomId, sessionId, amountLakhs }));
    }
    try {
      await fetch(`/api/rooms/${roomId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerSessionId: sessionId, amountLakhs }),
      });
    } catch (e) {}
  }, [roomId, sessionId]);

  const selectTeam = useCallback(async (teamId: string, customName?: string) => {
    if (!roomId) return;
    const name = customName || playerName;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'SELECT_TEAM', roomId, sessionId, teamId, playerName: name }));
    }
    try {
      await fetch(`/api/rooms/${roomId}/select-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerSessionId: sessionId, teamId, playerName: name }),
      });
    } catch (e) {}
  }, [roomId, sessionId, playerName]);

  const startAuction = useCallback(async () => {
    if (!roomId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'START_AUCTION', roomId, sessionId }));
    }
    try {
      const res = await fetch(`/api/rooms/${roomId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostSessionId: sessionId }),
      });
      const data = await res.json();
      if (data?.room) {
        setRoom(data.room);
      } else if (!res.ok && data?.error) {
        setErrorMsg(data.error);
        alert(data.error);
      }
    } catch (e) {
      console.warn('Start auction failed via REST:', e);
    }
  }, [roomId, sessionId]);

  const pauseAuction = useCallback(async () => {
    if (!roomId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'PAUSE_AUCTION', roomId, sessionId }));
    }
  }, [roomId, sessionId]);

  const resumeAuction = useCallback(async () => {
    if (!roomId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'RESUME_AUCTION', roomId, sessionId }));
    }
  }, [roomId, sessionId]);

  const skipPlayer = useCallback(async () => {
    if (!roomId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'SKIP_PLAYER', roomId, sessionId }));
    }
  }, [roomId, sessionId]);

  const endAuction = useCallback(async () => {
    if (!roomId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'END_AUCTION', roomId, sessionId }));
    }
    try {
      const res = await fetch(`/api/rooms/${roomId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostSessionId: sessionId }),
      });
      const data = await res.json();
      if (data?.room) setRoom(data.room);
    } catch (e) {}
  }, [roomId, sessionId]);

  const submitPlayingXI = useCallback(async (playingXI: {
    teamId: string;
    playerIds: string[];
    battingOrder: string[];
    captainId: string;
    viceCaptainId: string;
  }) => {
    if (!roomId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'SUBMIT_PLAYING_XI', roomId, sessionId, playingXI }));
    }
    try {
      await fetch(`/api/rooms/${roomId}/playing-xi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerSessionId: sessionId, playingXI }),
      });
    } catch (e) {}
  }, [roomId, sessionId]);

  const triggerAnalysis = useCallback(async () => {
    if (!roomId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'TRIGGER_ANALYSIS', roomId, sessionId }));
    }
    try {
      const res = await fetch(`/api/rooms/${roomId}/analyze`, { method: 'POST' });
      const data = await res.json();
      if (data?.room) setRoom(data.room);
    } catch (e) {}
  }, [roomId, sessionId]);

  const returnToPlayingXI = useCallback(async () => {
    if (!roomId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'RETURN_TO_PLAYING_XI', roomId, sessionId }));
    }
    try {
      const res = await fetch(`/api/rooms/${roomId}/edit-xi`, { method: 'POST' });
      const data = await res.json();
      if (data?.room) setRoom(data.room);
    } catch (e) {}
  }, [roomId, sessionId]);

  // REST initial load & fallback polling if WS is down
  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      return;
    }

    let isMounted = true;
    const fetchRoom = () => {
      fetch(`/api/rooms/${roomId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data?.room) {
            setRoom((prev) => {
              // Only overwrite if no previous state or status changed / updated
              if (!prev || prev.updatedAt <= data.room.updatedAt) {
                return data.room;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    };

    fetchRoom();

    // If socket is disconnected, poll every 2s
    const pollInterval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        fetchRoom();
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [roomId]);

  const setRoomDirectly = useCallback((newRoom: Room) => {
    setRoom(newRoom);
  }, []);

  return {
    room,
    setRoomDirectly,
    isConnected,
    errorMsg,
    placeBid,
    selectTeam,
    startAuction,
    pauseAuction,
    resumeAuction,
    skipPlayer,
    endAuction,
    submitPlayingXI,
    triggerAnalysis,
    returnToPlayingXI,
  };
}
