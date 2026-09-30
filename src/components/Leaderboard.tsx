import React from 'react';
import { TEAMS_BY_ID } from '../data/teams';
import { Squad } from '../types/auction';
import { Trophy, Users, Shield, ArrowRight, Flame } from 'lucide-react';

interface LeaderboardProps {
  squads: Record<string, Squad>;
  highestBidderTeamId: string | null;
  onViewSquad: (teamId: string) => void;
  userTeamId?: string | null;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  squads,
  highestBidderTeamId,
  onViewSquad,
  userTeamId,
}) => {
  const squadList = Object.values(squads);

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Franchise Standings</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">15 Slots Max</span>
        </div>

        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {squadList.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No franchises registered yet.</p>
          ) : (
            squadList.map((squad) => {
              const team = TEAMS_BY_ID[squad.teamId] || {
                id: squad.teamId,
                name: squad.teamId,
                shortName: squad.teamId,
                primaryColor: '#888',
              };
              const isHighestBidder = highestBidderTeamId === squad.teamId;
              const isMyTeam = userTeamId === squad.teamId;
              const count = squad.players.length;
              const isFull = count >= 15;
              const overseasCount = squad.players.filter((bp) => bp.player.isOverseas).length;

              return (
                <div
                  key={squad.teamId}
                  onClick={() => onViewSquad(squad.teamId)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isHighestBidder
                      ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                      : isMyTeam
                      ? 'border-blue-500/50 bg-blue-500/5 hover:border-blue-400'
                      : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: team.primaryColor }}
                      />
                      <span className="font-mono font-bold text-sm text-white">{team.shortName}</span>
                      {isMyTeam && (
                        <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                          YOU
                        </span>
                      )}
                      {isHighestBidder && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" />
                          BIDDING
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                      {squad.ownerName}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[11px] pt-1.5 border-t border-slate-900">
                    <div>
                      <span className="text-slate-500 block text-[9px]">PURSE</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ₹{(squad.currentPurseLakhs / 100).toFixed(1)} Cr
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[9px]">SQUAD</span>
                      <span className={`font-mono font-bold ${isFull ? 'text-rose-400' : 'text-slate-200'}`}>
                        {count}/15 {isFull && '✓'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500 block text-[9px]">OVERSEAS</span>
                      <span className="font-mono font-bold text-slate-400">{overseasCount}/8</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 text-center">
        <span className="text-[11px] text-slate-400">
          💡 Click any franchise card to view their purchased squad.
        </span>
      </div>
    </div>
  );
};
