import React from 'react';
import { Volume2, VolumeX, Share2, Shield, Users, Trophy, Database, Home, Copy, Check } from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import { getShareableRoomLink } from '../utils/shareUrl';
import { InviteFriendsModal } from './InviteFriendsModal';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  roomCode?: string | null;
  teamId?: string | null;
  playerName?: string;
  isHost?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  roomCode,
  teamId,
  playerName,
  isHost,
}) => {
  const [muted, setMuted] = React.useState(sounds.getMuted());
  const [copied, setCopied] = React.useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);

  const toggleAudio = () => {
    const next = sounds.toggleMute();
    setMuted(next);
  };

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openInviteModal = () => {
    if (roomCode) {
      setIsInviteModalOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-slate-950 font-black text-lg">🏏</span>
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
              Cricket Auction Arena
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors flex items-center gap-1.5 ${
              currentView === 'home' ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Lobby</span>
          </button>

          <button
            onClick={() => onNavigate('browse')}
            className={`transition-colors flex items-center gap-1.5 ${
              currentView === 'browse' ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Public Rooms</span>
          </button>

          <button
            onClick={() => onNavigate('players')}
            className={`transition-colors flex items-center gap-1.5 ${
              currentView === 'players' ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Player Database</span>
          </button>

          <button
            onClick={() => onNavigate('rules')}
            className={`transition-colors flex items-center gap-1.5 ${
              currentView === 'rules' ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Auction Rules</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Room Status */}
        <div className="flex items-center gap-3">
          {roomCode && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 font-medium">Room:</span>
              <span className="font-mono font-bold tracking-wider text-amber-400">{roomCode}</span>
              <button
                onClick={copyRoomCode}
                title="Copy Room Code"
                className="text-slate-400 hover:text-white transition-colors p-0.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={openInviteModal}
                title="Invite Friends / Share Room"
                className="text-slate-400 hover:text-amber-400 transition-colors p-0.5 ml-1"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {teamId && (
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-medium">{teamId}</span>
              {playerName && <span className="text-slate-500">({playerName})</span>}
            </div>
          )}

          <button
            onClick={toggleAudio}
            aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {roomCode && (
        <InviteFriendsModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          roomCode={roomCode}
          roomName={`Room ${roomCode}`}
        />
      )}
    </header>
  );
};
