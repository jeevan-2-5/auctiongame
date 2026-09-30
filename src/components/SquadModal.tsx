import React from 'react';
import { TEAMS_BY_ID } from '../data/teams';
import { Squad } from '../types/auction';
import { X, Users, Shield, Award, CheckCircle2 } from 'lucide-react';

interface SquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  squad: Squad | null;
}

export const SquadModal: React.FC<SquadModalProps> = ({ isOpen, onClose, squad }) => {
  if (!isOpen || !squad) return null;

  const team = TEAMS_BY_ID[squad.teamId] || {
    id: squad.teamId,
    name: squad.teamId,
    shortName: squad.teamId,
    primaryColor: '#888',
    city: 'Arena',
  };

  const batters = squad.players.filter((bp) => bp.player.role === 'BATTER');
  const keepers = squad.players.filter((bp) => bp.player.role === 'WICKETKEEPER');
  const allRounders = squad.players.filter((bp) => bp.player.role === 'ALL_ROUNDER');
  const bowlers = squad.players.filter((bp) => bp.player.role === 'BOWLER');
  const overseasCount = squad.players.filter((bp) => bp.player.isOverseas).length;

  const renderPlayerRow = (bp: (typeof squad.players)[0], idx: number) => (
    <div
      key={bp.player.id}
      className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-slate-500 w-4 text-center">{idx + 1}</span>
        <div>
          <p className="font-bold text-white flex items-center gap-1.5">
            <span>{bp.player.fullName}</span>
            {bp.player.isOverseas && (
              <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded">
                ✈️
              </span>
            )}
          </p>
          <p className="text-[10px] text-slate-400">
            {bp.player.country} · {bp.player.battingStyle.replace('_', ' ')}
          </p>
        </div>
      </div>

      <div className="text-right">
        <span className="font-mono font-bold text-amber-400 block">
          ₹{(bp.purchasePriceLakhs / 100).toFixed(2)} Cr
        </span>
        <span className="text-[10px] text-slate-500 font-mono">Rating {bp.player.rating}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] flex flex-col justify-between">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Squad Header */}
        <div className="flex items-center gap-4 mb-6">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-white text-base shadow"
            style={{ backgroundColor: team.primaryColor }}
          >
            {team.shortName.slice(0, 3)}
          </span>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{team.name} Squad</span>
              {squad.players.length >= 15 && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>SQUAD COMPLETE (15/15)</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Managed by <span className="text-white font-medium">{squad.ownerName}</span>
            </p>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-center mb-6">
          <div>
            <p className="text-[10px] text-slate-400 uppercase">Total Squad</p>
            <p className="text-sm font-bold text-white font-mono mt-0.5">
              {squad.players.length} / 15
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase">Purse Left</p>
            <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
              ₹{(squad.currentPurseLakhs / 100).toFixed(2)} Cr
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase">Purse Spent</p>
            <p className="text-sm font-bold text-slate-300 font-mono mt-0.5">
              ₹{(squad.spentPurseLakhs / 100).toFixed(2)} Cr
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase">Overseas</p>
            <p className="text-sm font-bold text-blue-400 font-mono mt-0.5">
              {overseasCount} / 8
            </p>
          </div>
        </div>

        {/* Players Grouped by Role */}
        <div className="space-y-5 overflow-y-auto pr-1 flex-1">
          {squad.players.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No players purchased yet in this auction.
            </div>
          ) : (
            <>
              {batters.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                    Batters ({batters.length})
                  </h4>
                  <div className="space-y-2">{batters.map(renderPlayerRow)}</div>
                </div>
              )}

              {keepers.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                    Wicketkeepers ({keepers.length})
                  </h4>
                  <div className="space-y-2">{keepers.map(renderPlayerRow)}</div>
                </div>
              )}

              {allRounders.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                    All-Rounders ({allRounders.length})
                  </h4>
                  <div className="space-y-2">{allRounders.map(renderPlayerRow)}</div>
                </div>
              )}

              {bowlers.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
                    Bowlers ({bowlers.length})
                  </h4>
                  <div className="space-y-2">{bowlers.map(renderPlayerRow)}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
