/**
 * Simple, direct utility for generating shareable room links.
 */

let serverAppUrl: string = '';

export function setServerAppUrl(url: string) {
  if (url) {
    serverAppUrl = url.trim().replace(/\/$/, '');
  }
}

export function getShareableRoomLink(roomCode: string): string {
  if (typeof window === 'undefined') return '';
  const cleanCode = roomCode ? roomCode.toUpperCase().trim() : '';
  
  let origin = window.location.origin;
  // If hosted in AI Studio dev, try ais-pre if desired, but default to window.location.origin
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }

  return cleanCode ? `${origin}/?room=${cleanCode}` : origin;
}

export function getDirectRoomLink(roomCode: string): string {
  if (typeof window === 'undefined') return '';
  const cleanCode = roomCode ? roomCode.toUpperCase().trim() : '';
  return cleanCode ? `${window.location.origin}/?room=${cleanCode}` : window.location.origin;
}

export function isAiStudioHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('.run.app') || window.location.hostname.includes('ais-');
}

export function isAiStudioDevHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('ais-dev-');
}
