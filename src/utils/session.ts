export function getPlayerSession(): { sessionId: string; name: string } {
  if (typeof window === 'undefined') {
    return { sessionId: 'server-temp', name: 'Player' };
  }

  let sessionId = localStorage.getItem('caa_player_session');
  if (!sessionId) {
    sessionId = 'usr-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
    localStorage.setItem('caa_player_session', sessionId);
  }

  const name = localStorage.getItem('caa_player_name') || '';
  return { sessionId, name };
}

export function savePlayerName(name: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('caa_player_name', name);
  }
}

export function saveLastRoom(roomCode: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('caa_last_room', roomCode);
  }
}

export function getLastRoom(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('caa_last_room');
}
