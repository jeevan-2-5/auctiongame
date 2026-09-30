import React, { useState, useEffect } from 'react';
import { Player, PlayingXI, Room, Squad } from '../types/auction';
import { TEAMS_BY_ID } from '../data/teams';
import {
  Shield,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Users,
  Trophy,
  Crown,
  Star,
  Plus,
  Minus,
  Edit3,
} from 'lucide-react';

interface PlayingXIBuilderProps {
  room: Room;
  currentSessionId: string;
  onSubmitPlayingXI: (playingXI: {
    teamId: string;
    playerIds: string[];
    battingOrder: string[];
    captainId: string;
    viceCaptainId: string;
  }) => void;
  onTriggerAnalysis: () => void;
}

export const PlayingXIBuilder: React.FC<PlayingXIBuilderProps> = ({
  room,
  currentSessionId,
  onSubmitPlayingXI,
  onTriggerAnalysis,
}) => {
  const isHost = room.hostId === currentSessionId;
  const player = room.players[currentSessionId];
  const userTeamId = player?.teamId;

  const teamsList = Object.keys(room.squads);
  // Default to user's team or the first team in room
  const [activeTeamId, setActiveTeamId] = useState<string>(
    userTeamId && room.squads[userTeamId] ? userTeamId : teamsList[0] || ''
  );

  const activeSquad = room.squads[activeTeamId];
  const activeTeamMeta = TEAMS_BY_ID[activeTeamId] || {
    id: activeTeamId,
    name: activeTeamId,
    shortName: activeTeamId,
    primaryColor: '#F59E0B',
  };

  // In casual and friendly multiplayer, allow managers and host to customize any participating team
  const isOwnerOrHost = true;

  // Selected player IDs in batting order (1 to 11)
  const [selectedXI, setSelectedXI] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState<string>('');
  const [viceCaptainId, setViceCaptainId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const allSquadPlayers: Player[] = activeSquad ? activeSquad.players.map((bp) => bp.player) : [];
  const playerMap = allSquadPlayers.reduce<Record<string, Player>>((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  // Update local state when switching active team or room updates
  useEffect(() => {
    if (!activeTeamId || !activeSquad) return;
    const existing = room.playingXIs[activeTeamId];

    if (existing && existing.playerIds.length > 0) {
      setSelectedXI(existing.battingOrder);
      setCaptainId(existing.captainId);
      setViceCaptainId(existing.viceCaptainId);
      setIsSubmitted(true);
    } else {
      setIsSubmitted(false);
      autoPickBalancedLineup();
    }
  }, [activeTeamId, activeSquad?.players?.length]);

  const benchPlayers = allSquadPlayers.filter((p) => !selectedXI.includes(p.id));

  const autoPickBalancedLineup = () => {
    if (!activeSquad || activeSquad.players.length === 0) return;
    const pool = [...allSquadPlayers];

    // Pick top keeper
    const keepers = pool.filter((p) => p.isWicketkeeper).sort((a, b) => b.battingRating - a.battingRating);
    const keeper = keepers[0];

    // Pick top openers
    const openers = pool.filter((p) => p.role === 'BATTER').sort((a, b) => b.powerplayBatting - a.powerplayBatting);

    // Pick top bowlers
    const bowlers = pool.filter((p) => p.role === 'BOWLER').sort((a, b) => b.bowlingRating - a.bowlingRating);

    // Pick top all-rounders
    const allRounders = pool.filter((p) => p.role === 'ALL_ROUNDER').sort((a, b) => b.rating - a.rating);

    const pickedSet = new Set<string>();
    const order: string[] = [];

    // Add up to 2 openers
    openers.slice(0, 2).forEach((p) => {
      if (order.length < 11 && !pickedSet.has(p.id)) {
        order.push(p.id);
        pickedSet.add(p.id);
      }
    });

    // Add keeper
    if (keeper && !pickedSet.has(keeper.id) && order.length < 11) {
      order.push(keeper.id);
      pickedSet.add(keeper.id);
    }

    // Add top batters
    pool
      .filter((p) => p.role === 'BATTER' && !pickedSet.has(p.id))
      .sort((a, b) => b.battingRating - a.battingRating)
      .slice(0, 3)
      .forEach((p) => {
        if (order.length < 11 && !pickedSet.has(p.id)) {
          order.push(p.id);
          pickedSet.add(p.id);
        }
      });

    // Add all-rounders
    allRounders.forEach((p) => {
      if (order.length < 11 && !pickedSet.has(p.id)) {
        order.push(p.id);
        pickedSet.add(p.id);
      }
    });

    // Add bowlers
    bowlers.forEach((p) => {
      if (order.length < 11 && !pickedSet.has(p.id)) {
        order.push(p.id);
        pickedSet.add(p.id);
      }
    });

    // Fill to 11 if needed
    pool.sort((a, b) => b.rating - a.rating).forEach((p) => {
      if (order.length < 11 && !pickedSet.has(p.id)) {
        order.push(p.id);
        pickedSet.add(p.id);
      }
    });

    setSelectedXI(order);

    // Pick captain & vice captain
    if (order.length >= 2) {
      setCaptainId(order[0]);
      setViceCaptainId(order[1]);
    } else if (order.length === 1) {
      setCaptainId(order[0]);
    }
    setError('');
  };

  const togglePlayerInXI = (playerId: string) => {
    if (isSubmitted) return;
    if (selectedXI.includes(playerId)) {
      setSelectedXI(selectedXI.filter((id) => id !== playerId));
      if (captainId === playerId) setCaptainId('');
      if (viceCaptainId === playerId) setViceCaptainId('');
    } else {
      if (selectedXI.length >= 11) {
        setError('Playing XI cannot exceed 11 players. Remove a player first.');
        return;
      }
      setSelectedXI([...selectedXI, playerId]);
      setError('');
    }
  };

  const moveOrder = (index: number, direction: 'UP' | 'DOWN') => {
    if (isSubmitted) return;
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedXI.length) return;

    const copy = [...selectedXI];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setSelectedXI(copy);
  };

  // Live Validations
  const selectedPlayers = selectedXI.map((id) => playerMap[id]).filter(Boolean);
  const overseasCount = selectedPlayers.filter((p) => p.isOverseas).length;
  const hasKeeper = selectedPlayers.some((p) => p.isWicketkeeper);
  const bowlingOptions = selectedPlayers.filter((p) => p.bowlingRating >= 65).length;

  const targetCount = Math.min(11, allSquadPlayers.length);

  const handleSubmit = () => {
    if (!activeTeamId) return;
    if (selectedXI.length !== targetCount) {
      setError(`Playing XI must have exactly ${targetCount} players (currently ${selectedXI.length}).`);
      return;
    }
    if (targetCount >= 2 && (!captainId || !viceCaptainId)) {
      setError('Please designate both a Captain [C] and a Vice Captain [VC].');
      return;
    }
    if (captainId && viceCaptainId && captainId === viceCaptainId) {
      setError('Captain and Vice-Captain cannot be the same player.');
      return;
    }
    if (overseasCount > room.settings.maxOverseasInPlayingXI) {
      setError(`Maximum ${room.settings.maxOverseasInPlayingXI} overseas players allowed in Playing XI (${overseasCount} selected).`);
      return;
    }

    onSubmitPlayingXI({
      teamId: activeTeamId,
      playerIds: selectedXI,
      battingOrder: selectedXI,
      captainId: captainId || selectedXI[0] || '',
      viceCaptainId: viceCaptainId || selectedXI[1] || selectedXI[0] || '',
    });
    setIsSubmitted(true);
  };

  const handleTriggerAnalysisAndSave = () => {
    // Automatically submit current active team's lineup if valid so changes are never lost
    if (selectedXI.length === targetCount && activeTeamId) {
      onSubmitPlayingXI({
        teamId: activeTeamId,
        playerIds: selectedXI,
        battingOrder: selectedXI,
        captainId: captainId || selectedXI[0] || '',
        viceCaptainId: viceCaptainId || selectedXI[1] || selectedXI[0] || '',
      });
      setIsSubmitted(true);
    }
    setTimeout(() => {
      onTriggerAnalysis();
    }, 150);
  };

  const getPositionRoleLabel = (idx: number) => {
    if (idx === 0) return 'Opener (Strike)';
    if (idx === 1) return 'Opener (Non-Strike)';
    if (idx === 2) return 'Top Order #3';
    if (idx === 3) return 'Anchor #4';
    if (idx === 4) return 'Middle Order #5';
    if (idx === 5) return 'Power Finisher #6';
    if (idx === 6) return 'All-Rounder #7';
    if (idx === 7) return 'Lower Order #8';
    if (idx === 8) return 'Frontline Bowler #9';
    if (idx === 9) return 'Pace/Spin #10';
    if (idx === 10) return 'Tail #11';
    return `Batting #${idx + 1}`;
  };

  const submittedSquadsCount = Object.keys(room.playingXIs).length;
  const totalSquadsCount = Object.keys(room.squads).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Tactical Stage: Playing XI Selection & Batting Order
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Arrange Your Playing 11
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Pick 11 from your squad. Set batting order 1-11, assign Captain & Vice Captain, then trigger AI analysis.
          </p>
        </div>

        {/* Global Submission Status & Action */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Franchises Ready</p>
            <p className="text-2xl font-mono font-extrabold text-white">
              {submittedSquadsCount} / {totalSquadsCount}
            </p>
          </div>
          <button
            onClick={handleTriggerAnalysisAndSave}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Run AI Analysis & Declare Winner</span>
          </button>
        </div>
      </div>

      {/* Franchise Tabs Switcher */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
          Franchises:
        </span>
        {teamsList.map((tId) => {
          const tm = TEAMS_BY_ID[tId];
          const sq = room.squads[tId];
          const isReady = !!room.playingXIs[tId];
          const isSelected = activeTeamId === tId;

          return (
            <button
              key={tId}
              onClick={() => setActiveTeamId(tId)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold font-mono transition-all flex items-center gap-2 shrink-0 ${
                isSelected
                  ? 'border-amber-400 bg-amber-500/10 text-white shadow-md'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: tm?.primaryColor || '#888' }}
              />
              <span>{tm?.shortName || tId}</span>
              <span className="text-[10px] text-slate-400 font-sans">({sq?.ownerName || 'Owner'})</span>
              {isReady ? (
                <span className="text-emerald-400 font-sans text-[10px]">✓ Ready</span>
              ) : (
                <span className="text-amber-400 font-sans text-[10px]">✏️ Editing</span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Playing XI Batting Order (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: activeTeamMeta.primaryColor }}
              />
              <h2 className="text-xl font-bold text-white">
                {activeTeamMeta.name} · Batting Order
              </h2>
              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${selectedXI.length === targetCount ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-amber-400'}`}>
                {selectedXI.length} / {targetCount} Players
              </span>
            </div>

            {isOwnerOrHost && (
              <button
                onClick={autoPickBalancedLineup}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Suggest Lineup</span>
              </button>
            )}
          </div>

          {/* Validation Warnings */}
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className={`px-2.5 py-1 rounded-lg border font-medium ${overseasCount <= 4 ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              ✈️ Overseas: {overseasCount}/4
            </span>
            <span className={`px-2.5 py-1 rounded-lg border font-medium ${hasKeeper ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              🧤 Wicketkeeper: {hasKeeper ? 'Present' : 'None'}
            </span>
            <span className={`px-2.5 py-1 rounded-lg border font-medium ${bowlingOptions >= 5 ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              🎯 Bowling Options: {bowlingOptions}
            </span>
          </div>

          {/* 11 Batting Positions List */}
          <div className="space-y-2.5">
            {selectedXI.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-sm">
                No players in the XI yet. Pick players from the squad reserves on the right.
              </div>
            ) : (
              selectedXI.map((playerId, idx) => {
                const p = playerMap[playerId];
                if (!p) return null;
                const isC = captainId === playerId;
                const isVC = viceCaptainId === playerId;

                return (
                  <div
                    key={playerId}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">
                          {getPositionRoleLabel(idx).split(' ')[0]}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white">{p.fullName}</p>
                          {p.isOverseas && <span className="text-[10px] text-blue-400">✈️</span>}
                          {isC && (
                            <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-mono">
                              [C]
                            </span>
                          )}
                          {isVC && (
                            <span className="text-[10px] font-black bg-blue-500 text-white px-1.5 py-0.2 rounded font-mono">
                              [VC]
                            </span>
                          )}
                          <span className="text-[10px] text-amber-400/80 font-mono px-1.5 py-0.5 rounded bg-slate-800/80 hidden sm:inline">
                            {getPositionRoleLabel(idx)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {p.role} · Bat: {p.battingRating} · Bowl: {p.bowlingRating} · {p.country}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isOwnerOrHost && !isSubmitted && (
                        <>
                          <button
                            onClick={() => {
                              if (isC) setCaptainId('');
                              else {
                                setCaptainId(playerId);
                                if (isVC) setViceCaptainId('');
                              }
                            }}
                            className={`p-1.5 rounded-lg text-xs font-bold font-mono transition-colors ${
                              isC ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title="Set as Captain"
                          >
                            <Crown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (isVC) setViceCaptainId('');
                              else {
                                setViceCaptainId(playerId);
                                if (isC) setCaptainId('');
                              }
                            }}
                            className={`p-1.5 rounded-lg text-xs font-bold font-mono transition-colors ${
                              isVC ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title="Set as Vice Captain"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>

                          {/* Reorder Buttons */}
                          <button
                            onClick={() => moveOrder(idx, 'UP')}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                            title="Move Up in Batting Order"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => moveOrder(idx, 'DOWN')}
                            disabled={idx === selectedXI.length - 1}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                            title="Move Down in Batting Order"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Remove from XI */}
                          <button
                            onClick={() => togglePlayerInXI(playerId)}
                            className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20"
                            title="Move to Bench"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Submit / Edit Lineup Button */}
          {isOwnerOrHost && (
            <div>
              {!isSubmitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={selectedXI.length !== targetCount}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-base shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Lock Playing XI for {activeTeamMeta.shortName}</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{activeTeamMeta.shortName} Playing XI is locked and ready!</span>
                  </div>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Adjust Lineup</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Squad Reserves / Bench (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Squad Bench ({benchPlayers.length} Reserves)</h3>
            <span className="text-xs text-slate-400">Total Drafted: {allSquadPlayers.length}/15</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {benchPlayers.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                All players in {activeTeamMeta.shortName}'s squad are currently placed in the Playing XI.
              </p>
            ) : (
              benchPlayers.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>{p.fullName}</span>
                      {p.isOverseas && <span className="text-[10px] text-blue-400">✈️</span>}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {p.role} · Bat: {p.battingRating} · Bowl: {p.bowlingRating} · {p.country}
                    </p>
                  </div>

                  {isOwnerOrHost && !isSubmitted && (
                    <button
                      onClick={() => togglePlayerInXI(p.id)}
                      disabled={selectedXI.length >= 11}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Draft to XI</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
