let memorySessionId = '';
let memoryPlayerName = '';

export function getPlayerSession(): { sessionId: string; name: string } {
  if (typeof window === 'undefined') {
    return { sessionId: 'server-temp', name: 'Player' };
  }

  try {
    let sessionId = localStorage.getItem('caa_player_session');
    if (!sessionId) {
      sessionId = 'usr-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
      localStorage.setItem('caa_player_session', sessionId);
    }
    const name = localStorage.getItem('caa_player_name') || '';
    return { sessionId, name };
  } catch (e) {
    if (!memorySessionId) {
      memorySessionId = 'usr-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
    }
    return { sessionId: memorySessionId, name: memoryPlayerName };
  }
}

export function savePlayerName(name: string) {
  memoryPlayerName = name;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('caa_player_name', name);
    }
  } catch (e) {}
}

export function saveLastRoom(roomCode: string) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('caa_last_room', roomCode);
    }
  } catch (e) {}
}

export function getLastRoom(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('caa_last_room');
  } catch (e) {
    return null;
  }
}
