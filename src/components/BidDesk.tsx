import React from 'react';
import { TEAMS_BY_ID } from '../data/teams';
import { Player, Squad } from '../types/auction';
import { Clock, AlertTriangle, ShieldCheck, Flame, ArrowUpRight } from 'lucide-react';

interface BidDeskProps {
  currentBidLakhs: number;
  highestBidderTeamId: string | null;
  timerSeconds: number;
  isTimerRunning: boolean;
  userSquad?: Squad;
  userTeamId?: string | null;
  isSpectator?: boolean;
  onBid: (amountLakhs: number) => void;
  onClaimTeam?: () => void;
  onEndAuction?: () => void;
  currentPlayer: Player | null;
}

export const BidDesk: React.FC<BidDeskProps> = ({
  currentBidLakhs,
  highestBidderTeamId,
  timerSeconds,
  isTimerRunning,
  userSquad,
  userTeamId,
  isSpectator,
  onBid,
  onClaimTeam,
  onEndAuction,
  currentPlayer,
}) => {
  const currentBidCr = (currentBidLakhs / 100).toFixed(2);
  const highestTeam = highestBidderTeamId ? TEAMS_BY_ID[highestBidderTeamId] : null;

  // Calculate standard next valid increment
  let defaultIncrement = 25; // in lakhs
  if (currentBidLakhs < 100) defaultIncrement = 5;
  else if (currentBidLakhs < 500) defaultIncrement = 10;
  else defaultIncrement = 25;

  const nextValidBid = highestBidderTeamId === null ? currentBidLakhs : currentBidLakhs + defaultIncrement;
  const nextValidCr = (nextValidBid / 100).toFixed(2);

  // Check 15-player maximum rule
  const squadCount = userSquad ? userSquad.players.length : 0;
  const isSquadFull = squadCount >= 15;

  // Check user purse
  const userPurseLakhs = userSquad ? userSquad.currentPurseLakhs : 0;
  const hasPurseForNext = userPurseLakhs >= nextValidBid;

  // Check if user is already the highest bidder
  const isAlreadyHighest = userTeamId && highestBidderTeamId === userTeamId;

  // Timer urgency style
  const isUrgent = timerSeconds <= 3 && timerSeconds > 0;

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
      {/* Top Banner: Status & Live Countdown Timer */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Auctioneer Hammer
          </span>
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Live Bidding Floor
          </span>
        </div>

        {/* Countdown Timer Display */}
        <div
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all ${
            isUrgent
              ? 'bg-rose-500/20 border-rose-500/60 text-rose-400 animate-bounce'
              : 'bg-slate-950 border-slate-800 text-white'
          }`}
        >
          <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-400 animate-spin' : 'text-slate-400'}`} />
          <span className="font-mono text-2xl font-black tracking-widest">
            00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
          </span>
        </div>
      </div>

      {/* Center High-Impact Bid Display */}
      <div className="py-6 text-center border-y border-slate-800/80 my-auto">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          Current Highest Offer
        </p>

        <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white mb-3">
          <span className="text-amber-400">₹</span> {currentBidCr} <span className="text-2xl font-sans text-slate-400 font-semibold">Cr</span>
        </div>

        {/* Highest Bidder Franchise Tag */}
        {highestTeam ? (
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner">
            <span
              className="w-3.5 h-3.5 rounded-full shadow"
              style={{ backgroundColor: highestTeam.primaryColor }}
            />
            <span className="font-mono font-bold text-sm text-white">{highestTeam.shortName}</span>
            <span className="text-slate-400 text-xs">({highestTeam.name})</span>
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/60 text-slate-500 text-xs font-medium">
            <span>No bids placed yet · Base Price on block</span>
          </div>
        )}
      </div>

      {/* User Team Purse & Squad Bar */}
      {userSquad && (
        <div className="my-5 p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400">Your Franchise:</span>
            <span className="font-mono font-bold text-white">
              {userTeamId} ({userSquad.ownerName})
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-900">
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Purse Left</p>
              <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                ₹{(userPurseLakhs / 100).toFixed(2)} Cr
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Total Spent</p>
              <p className="text-sm font-bold text-slate-300 font-mono mt-0.5">
                ₹{(userSquad.spentPurseLakhs / 100).toFixed(2)} Cr
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Squad Slots</p>
              <p className={`text-sm font-bold font-mono mt-0.5 ${isSquadFull ? 'text-rose-400' : 'text-amber-400'}`}>
                {squadCount} / 15
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STRICT SQUAD FULL BANNER (RULE ENFORCEMENT) */}
      {isSquadFull && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>SQUAD FULL (15/15 PLAYERS)</span>
          </div>
          <p className="text-xs text-rose-300/80">
            Under tournament rules, every franchise has a strict maximum of 15 players. Your squad is complete!
          </p>
          {onEndAuction && (
            <button
              onClick={onEndAuction}
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>⚡ Proceed to Playing 11 Selection</span>
            </button>
          )}
        </div>
      )}

      {/* Direct End Auction Button when squad has at least 11 players */}
      {!isSquadFull && squadCount >= 11 && onEndAuction && (
        <div className="mb-4 p-3 rounded-2xl bg-slate-950 border border-amber-500/30 flex items-center justify-between gap-3">
          <div className="text-left">
            <p className="text-xs font-bold text-amber-400">Ready for Playing 11?</p>
            <p className="text-[10px] text-slate-400">You have {squadCount} players drafted.</p>
          </div>
          <button
            onClick={onEndAuction}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/40 font-bold text-xs transition-all"
          >
            End Auction & Pick 11
          </button>
        </div>
      )}

      {/* Interactive Bidding Controls */}
      <div>
        {isSpectator ? (
          <div className="p-4 rounded-xl bg-slate-950 text-center text-xs text-slate-400">
            👀 You are currently watching in Spectator Mode.
          </div>
        ) : !userTeamId ? (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
            <p className="text-xs text-amber-400 font-semibold">
              ⚠️ You haven't claimed a franchise yet!
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Select an available team to start placing bids against other owners.
            </p>
            {onClaimTeam && (
              <button
                onClick={onClaimTeam}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
              >
                Claim Franchise & Start Bidding
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Primary One-Click Next Bid Button */}
            <button
              onClick={() => onBid(nextValidBid)}
              disabled={isSquadFull || !hasPurseForNext || Boolean(isAlreadyHighest) || !isTimerRunning}
              className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${
                isSquadFull
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  : isAlreadyHighest
                  ? 'bg-slate-800 text-amber-400 border border-amber-500/30 cursor-default'
                  : !hasPurseForNext
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/25 active:scale-[0.98]'
              }`}
            >
              <ArrowUpRight className="w-6 h-6 stroke-[3]" />
              {isSquadFull ? (
                <span>SQUAD FULL</span>
              ) : isAlreadyHighest ? (
                <span>YOU HOLD HIGHEST BID</span>
              ) : !hasPurseForNext ? (
                <span>INSUFFICIENT PURSE</span>
              ) : (
                <span>BID ₹{nextValidCr} Cr</span>
              )}
            </button>

            {/* Quick Increment Buttons (+10L, +25L, +50L, +1Cr) */}
            {!isSquadFull && !isAlreadyHighest && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '+₹10L', val: 10 },
                  { label: '+₹25L', val: 25 },
                  { label: '+₹50L', val: 50 },
                  { label: '+₹1.00Cr', val: 100 },
                ].map((inc) => {
                  const targetBid = currentBidLakhs + inc.val;
                  const canAfford = userPurseLakhs >= targetBid;
                  return (
                    <button
                      key={inc.val}
                      onClick={() => onBid(targetBid)}
                      disabled={!canAfford || !isTimerRunning}
                      className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-mono text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {inc.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
