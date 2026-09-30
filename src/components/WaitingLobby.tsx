import React, { useState } from 'react';
import { Room, RoomPlayer } from '../types/auction';
import { FRANCHISE_TEAMS, TEAMS_BY_ID } from '../data/teams';
import { Copy, Check, Play, Share2, Shield, Users, Clock, AlertTriangle, Globe, Sparkles } from 'lucide-react';
import { getShareableRoomLink } from '../utils/shareUrl';
import { InviteFriendsModal } from './InviteFriendsModal';

interface WaitingLobbyProps {
  room: Room;
  currentSessionId: string;
  onStartAuction: () => void;
  onSelectTeam: (teamId: string) => void;
}

export const WaitingLobby: React.FC<WaitingLobbyProps> = ({
  room,
  currentSessionId,
  onStartAuction,
  onSelectTeam,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const isHost = room.hostId === currentSessionId;
  const currentPlayer = room.players[currentSessionId];
  const myTeamId = currentPlayer?.teamId;

  const publicShareLink = getShareableRoomLink(room.id);

  const copyCode = () => {
    navigator.clipboard.writeText(room.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = async () => {
    navigator.clipboard.writeText(publicShareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    setIsInviteModalOpen(true);
  };

  const squadsList = Object.values(room.squads);
  const teamsCount = squadsList.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Waiting for Franchise Owners
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{room.name}</h1>
            <p className="text-slate-400 text-sm mt-1">
              Share the room code or link with your friends to join the live auction draft.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Room Code Pill */}
            <div className="flex items-center gap-3 bg-slate-950 border border-slate-700/80 rounded-2xl px-5 py-3 shadow-inner">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Room Code</p>
                <p className="text-2xl font-mono font-extrabold text-amber-400 tracking-widest">{room.id}</p>
              </div>
              <button
                onClick={copyCode}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Copy Room Code"
              >
                {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={copyLink}
              className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-medium text-xs transition-colors flex items-center gap-2"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Room Link'}</span>
            </button>
          </div>
        </div>

        {/* Quick Room Rules */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Starting Purse:</span>
            <p className="font-mono font-bold text-white mt-0.5">₹{room.settings.startingPurseLakhs / 100} Cr</p>
          </div>
          <div>
            <span className="text-slate-400">Squad Limit:</span>
            <p className="font-mono font-bold text-amber-400 mt-0.5">15 Players Max</p>
          </div>
          <div>
            <span className="text-slate-400">Bid Timer:</span>
            <p className="font-mono font-bold text-white mt-0.5">{room.settings.timerDurationSeconds}s (resets {room.settings.bidResetDurationSeconds}s)</p>
          </div>
          <div>
            <span className="text-slate-400">Playing XI Overseas:</span>
            <p className="font-mono font-bold text-white mt-0.5">Max {room.settings.maxOverseasInPlayingXI} in XI</p>
          </div>
        </div>

        {/* Public Share Invite Banner (Prevents 403 error for friends) */}
        <div className="mt-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Public Friend Invite Link</span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  No 403 Access Error
                </span>
              </p>
              <p className="text-[11px] text-slate-400 font-mono break-all mt-0.5">
                {publicShareLink}
              </p>
            </div>
          </div>
          <button
            onClick={copyLink}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Teams Status List (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {!myTeamId && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏏</span>
                <div>
                  <h3 className="font-bold text-sm text-white">You're in the room! Claim a franchise to participate</h3>
                  <p className="text-xs text-amber-300/80">Click "Claim Team" on any available team below to join as its owner.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>Franchises ({teamsCount}/10 Joined)</span>
            </h2>
            <span className="text-xs text-slate-400">Each team drafts up to 15 players</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FRANCHISE_TEAMS.map((team) => {
              const squad = room.squads[team.id];
              const isTaken = !!squad;
              const isMyTeam = myTeamId === team.id;

              return (
                <div
                  key={team.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isTaken
                      ? isMyTeam
                        ? 'border-amber-400/80 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-900/80'
                      : 'border-slate-800/40 bg-slate-950/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: team.primaryColor }}
                      />
                      <span className="font-mono font-bold text-base text-white">{team.shortName}</span>
                    </div>

                    {isTaken ? (
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Available</span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-200">{team.name}</p>
                  <p className="text-xs text-slate-400 italic mt-0.5">"{team.tagline}"</p>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Owner</p>
                      <p className="text-xs font-semibold text-white truncate max-w-[140px]">
                        {squad ? squad.ownerName : 'None'}
                      </p>
                    </div>

                    {!isTaken && !myTeamId && (
                      <button
                        onClick={() => onSelectTeam(team.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
                      >
                        Claim Team
                      </button>
                    )}

                    {isMyTeam && (
                      <span className="text-xs font-bold text-amber-400 font-mono">YOUR FRANCHISE</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Host Controls & Instructions */}
        <div className="space-y-6">
          {/* Host Launch Box */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Auction Host Controls</span>
            </h3>

            {isHost ? (
              <div>
                <p className="text-xs text-slate-400 mb-6">
                  You are the authoritative auctioneer. Once all owners have claimed their franchises, start the bidding.
                </p>

                {teamsCount < 1 ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>At least 1 team must be selected before starting.</span>
                  </div>
                ) : null}

                <button
                  onClick={onStartAuction}
                  disabled={teamsCount < 1}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-extrabold text-base shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>Start Auction Now</span>
                </button>
              </div>
            ) : (
              <div className="py-4 text-center">
                <Clock className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3 opacity-80" />
                <p className="text-sm font-semibold text-white">Waiting for Host to Start</p>
                <p className="text-xs text-slate-400 mt-1">
                  The host will start the live auction when all owners are ready.
                </p>
              </div>
            )}
          </div>

          {/* Golden Rules Box */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400">⚖️</span>
              <span>Arena Regulations</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>15-Player Squad Limit:</strong> You cannot acquire more than 15 players under any circumstance.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Playing XI:</strong> Exactly 11 players must be selected after the auction concludes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Overseas Rule:</strong> Max 4 overseas players can be named in the Playing XI.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>AI Scoring:</strong> 100% deterministic formula based on real player attributes and order.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <InviteFriendsModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        roomCode={room.id}
        roomName={room.name}
      />
    </div>
  );
};
