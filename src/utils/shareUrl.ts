/**
 * Utility for generating shareable multiplayer room links.
 * Handles AI Studio dev container vs. published shared container vs. self-hosted domains (Render, Railway, etc.).
 */

let serverAppUrl: string = '';

export function setServerAppUrl(url: string) {
  if (url) {
    serverAppUrl = url.trim().replace(/\/$/, '');
  }
}

export function isAiStudioHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('.run.app') || window.location.hostname.includes('ais-');
}

export function isAiStudioDevHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('ais-dev-');
}

export function getPublicOrigin(): string {
  if (serverAppUrl) {
    return serverAppUrl.replace('ais-dev-', 'ais-pre-');
  }

  if (typeof window === 'undefined') {
    return '';
  }

  let origin = window.location.origin;

  // In AI Studio, 'ais-dev-' is private to the editor owner (gives 403 Forbidden to friends).
  // 'ais-pre-' is the public shared URL that anyone can access without authentication once "Share" is clicked.
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }

  return origin;
}

export function getCurrentOrigin(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

export function getShareableRoomLink(roomCode: string): string {
  const origin = getPublicOrigin();
  const cleanCode = roomCode ? roomCode.toUpperCase().trim() : '';
  if (!cleanCode) return origin;
  return `${origin}/?room=${cleanCode}`;
}

export function getDirectRoomLink(roomCode: string): string {
  const origin = getCurrentOrigin();
  const cleanCode = roomCode ? roomCode.toUpperCase().trim() : '';
  if (!cleanCode) return origin;
  return `${origin}/?room=${cleanCode}`;
}
