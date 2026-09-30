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
  const placeBid = useCallback((amountLakhs: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && roomId) {
      wsRef.current.send(JSON.stringify({ type: 'BID', roomId, sessionId, amountLakhs }));
    }
  }, [roomId, sessionId]);

  const selectTeam = useCallback((teamId: string, customName?: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && roomId) {
      wsRef.current.send(JSON.stringify({ type: 'SELECT_TEAM', roomId, sessionId, teamId, playerName: customName || playerName }));
    }
  }, [roomId, sessionId, playerName]);

  const startAuction = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && roomId) {
      wsRef.current.send(JSON.stringify({ type: 'START_AUCTION', roomId, sessionId }));
    }
  }, [roomId, sessionId]);

  const pauseAuction = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && roomId) {
      wsRef.current.send(JSON.stringify({ type: 'PAUSE_AUCTION', roomId, sessionId }));
    }
  }, [roomId, sessionId]);

  const resumeAuction = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && roomId) {
      wsRef.current.send(JSON.stringify({ type: 'RESUME_AUCTION', roomId, sessionId }));
    }
  }, [roomId, sessionId]);

  const skipPlayer = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && roomId) {
      wsRef.current.send(JSON.stringify({ type: 'SKIP_PLAYER', roomId, sessionId }));
    }
  }, [roomId, sessionId]);

  const endAuction = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && roomId) {
      wsRef.current.send(JSON.stringify({ type: 'END_AUCTION', roomId, sessionId }));
    }
  }, [roomId, sessionId]);

  const submitPlayingXI = useCallback((playingXI: {
    teamId: string;
    playerIds: string[];
    battingOrder: string[];
    captainId: string;
    viceCaptainId: string;
  }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && roomId) {
      wsRef.current.send(JSON.stringify({ type: 'SUBMIT_PLAYING_XI', roomId, sessionId, playingXI }));
    }
  }, [roomId, sessionId]);

  const triggerAnalysis = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && roomId) {
      wsRef.current.send(JSON.stringify({ type: 'TRIGGER_ANALYSIS', roomId, sessionId }));
    }
  }, [roomId, sessionId]);

  const returnToPlayingXI = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && roomId) {
      wsRef.current.send(JSON.stringify({ type: 'RETURN_TO_PLAYING_XI', roomId, sessionId }));
    }
  }, [roomId, sessionId]);

  return {
    room,
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
