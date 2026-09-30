import React from 'react';
import { Player } from '../types/auction';
import { Shield, Zap, Sparkles, Award } from 'lucide-react';

interface PlayerCardProps {
  player: Player | null;
  currentBidLakhs: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, currentBidLakhs }) => {
  if (!player) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center justify-center min-h-[460px]">
        <span className="text-4xl mb-3">🏏</span>
        <h3 className="text-lg font-bold text-white mb-1">Awaiting Next Player</h3>
        <p className="text-xs text-slate-400">The auctioneer will place the next star on the hammer shortly.</p>
      </div>
    );
  }

  // Country flags
  const getFlag = (code: string) => {
    switch (code) {
      case 'IN': return '🇮🇳';
      case 'AU': return '🇦🇺';
      case 'GB': return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
      case 'ZA': return '🇿🇦';
      case 'NZ': return '🇳🇿';
      case 'WI': return '🌴';
      case 'AF': return '🇦🇫';
      default: return '🏏';
    }
  };

  // Role tag color
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'BATTER': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'BOWLER': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'ALL_ROUNDER': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'WICKETKEEPER': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl flex flex-col justify-between relative overflow-hidden">
      {/* Set Badge */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-400 font-mono">
          {player.auctionSet}
        </span>
        <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${getRoleBadge(player.role)}`}>
          {player.role.replace('_', ' ')}
        </span>
      </div>

      {/* Large Player Visual Frame */}
      <div className="relative w-full aspect-[4/3] rounded-2xl bg-gradient-to-t from-slate-950 via-slate-900 to-slate-800 border border-slate-700/60 overflow-hidden mb-5 flex items-center justify-center shadow-inner">
        {/* Thematic Jersey Initials & Aura */}
        <div className="text-center p-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-500/20 via-blue-500/20 to-emerald-500/20 border-2 border-amber-400/40 flex items-center justify-center shadow-lg mb-2">
            <span className="text-3xl font-black text-amber-300 font-mono tracking-wider">
              {player.shortName.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <span className="text-2xl" title={player.country}>
            {getFlag(player.countryCode)}
          </span>
        </div>

        {/* Overall Rating Shield */}
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-amber-400/40 flex items-center gap-1.5 shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">OVR</span>
          <span className="text-base font-extrabold font-mono text-amber-400">{player.rating}</span>
        </div>

        {/* Overseas / Indian Tag */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[11px] font-medium text-slate-300 flex items-center gap-1">
          <span>{player.isOverseas ? '✈️ Overseas' : '🇮🇳 Domestic'}</span>
          <span>·</span>
          <span>{player.isCapped ? 'Capped' : 'Uncapped'}</span>
        </div>
      </div>

      {/* Player Identity */}
      <div className="mb-5">
        <h2 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
          {player.fullName}
        </h2>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
          <span>{player.country}</span>
          <span>·</span>
          <span>{player.battingStyle.replace('_', ' ')} Bat</span>
          {player.bowlingStyle !== 'NONE' && (
            <>
              <span>·</span>
              <span>{player.bowlingStyle.replace('_', ' ')} Bowl</span>
            </>
          )}
        </p>
      </div>

      {/* Real Cricket Attributes Breakdown */}
      <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-center mb-5">
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Batting</p>
          <p className="text-sm font-bold text-white font-mono mt-0.5">{player.battingRating}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Bowling</p>
          <p className="text-sm font-bold text-white font-mono mt-0.5">{player.bowlingRating}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Death Phase</p>
          <p className="text-sm font-bold text-amber-400 font-mono mt-0.5">
            {Math.max(player.deathBatting, player.deathBowling)}
          </p>
        </div>
      </div>

      {/* Base Price Strip */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Base Price</p>
          <p className="text-sm font-bold text-slate-200 font-mono">
            ₹{(player.basePriceLakhs / 100).toFixed(2)} Cr
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold text-right">Real Franchise</p>
          <p className="text-sm font-bold text-amber-400 font-mono text-right">
            {player.currentRealTeam}
          </p>
        </div>
      </div>
    </div>
  );
};
