import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Room, TeamAnalysis } from '../types/auction';
import { TEAMS_BY_ID } from '../data/teams';
import { compareTwoTeams, SCORING_WEIGHTS } from '../server/scoringEngine';
import { getShareableRoomLink } from '../utils/shareUrl';
import {
  Trophy,
  Sparkles,
  Share2,
  Swords,
  History,
  Info,
  Check,
  Crown,
  Medal,
  Award,
  ChevronDown,
  ArrowRight,
  Shield,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface AnalysisViewProps {
  room: Room;
  currentSessionId: string;
  onRestartLobby: () => void;
  onEditLineups?: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  room,
  currentSessionId,
  onRestartLobby,
  onEditLineups,
}) => {
  const [selectedTeamDetail, setSelectedTeamDetail] = useState<string | null>(null);
  const [matchupTeamA, setMatchupTeamA] = useState<string>('');
  const [matchupTeamB, setMatchupTeamB] = useState<string>('');
  const [showWeights, setShowWeights] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Trigger celebration confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
    });
  }, []);

  const analysesList = Object.values(room.analyses).sort((a, b) => b.teamScore - a.teamScore);
  const champion = analysesList[0];
  const runnerUp = analysesList[1];

  const championSquad = champion ? room.squads[champion.teamId] : null;
  const championTeamMeta = champion ? TEAMS_BY_ID[champion.teamId] : null;
  const championXI = champion ? room.playingXIs[champion.teamId] : null;

  const runnerUpSquad = runnerUp ? room.squads[runnerUp.teamId] : null;
  const runnerUpTeamMeta = runnerUp ? TEAMS_BY_ID[runnerUp.teamId] : null;
  const runnerUpXI = runnerUp ? room.playingXIs[runnerUp.teamId] : null;

  const getPlayerDisplayName = (playerId: string) => {
    if (!playerId) return 'None';
    const found = room.playerPool.find((p) => p.id === playerId);
    return found ? found.fullName : playerId;
  };

  // Set default matchup teams (Champion vs Runner-Up)
  useEffect(() => {
    if (analysesList.length >= 2 && !matchupTeamA) {
      setMatchupTeamA(analysesList[0].teamId);
      setMatchupTeamB(analysesList[1].teamId);
    }
  }, [analysesList, matchupTeamA]);

  const copyShare = async () => {
    const publicUrl = getShareableRoomLink(room.id);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Championship Results · ${room.name}`,
          text: `Check out the final tournament results and AI analysis for ${room.name}!`,
          url: publicUrl,
        });
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        return;
      }
    } catch (e) {
      // Fallback
    }

    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const matchupResult =
    matchupTeamA && matchupTeamB && room.analyses[matchupTeamA] && room.analyses[matchupTeamB]
      ? compareTwoTeams(
          room.analyses[matchupTeamA],
          room.analyses[matchupTeamB],
          TEAMS_BY_ID[matchupTeamA]?.shortName || matchupTeamA,
          TEAMS_BY_ID[matchupTeamB]?.shortName || matchupTeamB
        )
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Title */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tournament AI Valuation & Official Standings</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Championship Results
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
          Evaluated via our deterministic 10-point mathematical cricket model and reviewed by Gemini AI.
        </p>

        {/* Quick Top Navigation Controls */}
        <div className="flex items-center justify-center gap-3 mt-6">
          {onEditLineups && (
            <button
              onClick={onEditLineups}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rearrange Playing 11 & Recalculate</span>
            </button>
          )}
          <button
            onClick={copyShare}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedLink ? 'Copied' : 'Share Results'}</span>
          </button>
        </div>
      </div>

      {/* 🏆 DUAL PODIUM: CHAMPION (RANK 1) & RUNNER-UP (RANK 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* RANK 1: THE TOURNAMENT CHAMPION */}
        {champion && (
          <div className="relative rounded-3xl bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 border-2 border-amber-400/60 p-7 sm:p-8 shadow-2xl overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Trophy className="w-48 h-48 text-amber-400" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-widest text-slate-950 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 font-mono shadow-md flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  <span>WINNER · 1ST PLACE</span>
                </span>
                <span className="text-xs text-amber-400 font-bold font-mono">🏆 CHAMPIONS</span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <span
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-black text-white text-xl shadow-lg border border-white/20"
                  style={{ backgroundColor: championTeamMeta?.primaryColor || '#D97706' }}
                >
                  {championTeamMeta?.shortName || champion.teamId}
                </span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-mono leading-tight">
                    {championTeamMeta?.name || champion.teamId}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Owner: <span className="text-white font-bold">{championSquad?.ownerName}</span>
                  </p>
                </div>
              </div>

              {/* Overall Score Badge */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-400/40 flex items-center justify-between mb-5 shadow-inner">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Championship Score
                  </p>
                  <p className="text-3xl font-black font-mono text-amber-400">
                    {champion.teamScore} <span className="text-xs font-sans text-slate-400">/ 100</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                    {champion.bestFeature}
                  </span>
                </div>
              </div>

              {/* Key Metrics Breakdown */}
              <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs mb-5 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Batting</span>
                  <span className="font-bold text-white text-sm">{champion.battingScore}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Bowling</span>
                  <span className="font-bold text-white text-sm">{champion.bowlingScore}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Death</span>
                  <span className="font-bold text-amber-400 text-sm">{champion.deathOversScore}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Bench</span>
                  <span className="font-bold text-slate-300 text-sm">{champion.benchScore}</span>
                </div>
              </div>

              {/* AI Scouting Appraisal */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 italic leading-relaxed mb-4">
                "{champion.aiExplanation}"
              </div>
            </div>

            {/* Captain & Vice Captain Line */}
            {championXI && (
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Captained by: <strong className="text-white">{getPlayerDisplayName(championXI.captainId)} [C]</strong></span>
                <span>Vice-Captain: <strong className="text-white">{getPlayerDisplayName(championXI.viceCaptainId)} [VC]</strong></span>
              </div>
            )}
          </div>
        )}

        {/* RANK 2: THE TOURNAMENT RUNNER-UP */}
        {runnerUp ? (
          <div className="relative rounded-3xl bg-gradient-to-b from-slate-400/10 via-slate-900 to-slate-950 border-2 border-slate-500/60 p-7 sm:p-8 shadow-2xl overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Medal className="w-48 h-48 text-slate-300" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-widest text-slate-950 px-3 py-1 rounded-full bg-gradient-to-r from-slate-200 to-slate-400 font-mono shadow-md flex items-center gap-1.5">
                  <Medal className="w-3.5 h-3.5" />
                  <span>RUNNER-UP · 2ND PLACE</span>
                </span>
                <span className="text-xs text-slate-300 font-bold font-mono">🥈 RUNNER-UP</span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <span
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-black text-white text-xl shadow-lg border border-white/20"
                  style={{ backgroundColor: runnerUpTeamMeta?.primaryColor || '#475569' }}
                >
                  {runnerUpTeamMeta?.shortName || runnerUp.teamId}
                </span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-mono leading-tight">
                    {runnerUpTeamMeta?.name || runnerUp.teamId}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Owner: <span className="text-white font-bold">{runnerUpSquad?.ownerName}</span>
                  </p>
                </div>
              </div>

              {/* Overall Score Badge */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-600/40 flex items-center justify-between mb-5 shadow-inner">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Tournament Score
                  </p>
                  <p className="text-3xl font-black font-mono text-slate-200">
                    {runnerUp.teamScore} <span className="text-xs font-sans text-slate-400">/ 100</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                    {runnerUp.bestFeature}
                  </span>
                </div>
              </div>

              {/* Key Metrics Breakdown */}
              <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs mb-5 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Batting</span>
                  <span className="font-bold text-white text-sm">{runnerUp.battingScore}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Bowling</span>
                  <span className="font-bold text-white text-sm">{runnerUp.bowlingScore}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Death</span>
                  <span className="font-bold text-slate-300 text-sm">{runnerUp.deathOversScore}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Bench</span>
                  <span className="font-bold text-slate-300 text-sm">{runnerUp.benchScore}</span>
                </div>
              </div>

              {/* AI Scouting Appraisal */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 italic leading-relaxed mb-4">
                "{runnerUp.aiExplanation}"
              </div>
            </div>

            {/* Captain & Vice Captain Line */}
            {runnerUpXI && (
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Captained by: <strong className="text-white">{getPlayerDisplayName(runnerUpXI.captainId)} [C]</strong></span>
                <span>Vice-Captain: <strong className="text-white">{getPlayerDisplayName(runnerUpXI.viceCaptainId)} [VC]</strong></span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center flex items-center justify-center text-slate-500 text-sm">
            Only 1 team participated in this room.
          </div>
        )}
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 mb-12">
        <div className="flex items-center gap-3">
          <button
            onClick={copyShare}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center gap-2"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
            <span>{copiedLink ? 'Link Copied' : 'Share Final Results'}</span>
          </button>

          <button
            onClick={() => setShowWeights(!showWeights)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <Info className="w-4 h-4 text-blue-400" />
            <span>Scoring Weights Transparency</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {onEditLineups && (
            <button
              onClick={onEditLineups}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rearrange Playing 11</span>
            </button>
          )}

          <button
            onClick={onRestartLobby}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors"
          >
            Back to Arena Lobby
          </button>
        </div>
      </div>

      {/* Model Weights Transparency Box */}
      {showWeights && (
        <div className="mb-12 p-6 rounded-2xl bg-slate-900 border border-slate-800 animate-fadeIn">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Deterministic Model Weighted Architecture</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            All franchise scores are 100% reproducible and computed mathematically from authentic player attributes, phase metrics, and batting order synergy. The AI model only crafts natural language scouting prose.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Batting Strength:</span>
              <p className="font-bold text-amber-400 mt-0.5">25% (0.25)</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Bowling Strength:</span>
              <p className="font-bold text-amber-400 mt-0.5">25% (0.25)</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">All-Round Balance:</span>
              <p className="font-bold text-amber-400 mt-0.5">15% (0.15)</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Role Composition:</span>
              <p className="font-bold text-amber-400 mt-0.5">10% (0.10)</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Powerplay Phase:</span>
              <p className="font-bold text-white mt-0.5">5% (0.05)</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Middle Overs:</span>
              <p className="font-bold text-white mt-0.5">5% (0.05)</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Death Overs:</span>
              <p className="font-bold text-white mt-0.5">5% (0.05)</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Bench Strength:</span>
              <p className="font-bold text-white mt-0.5">5% (0.05)</p>
            </div>
          </div>
        </div>
      )}

      {/* Head-to-Head Showdown (Winner vs Runner-Up) */}
      <div className="mb-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-400" />
              <span>Championship Matchup Simulator</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Simulate tactical head-to-head battles between the tournament winner, runner-up, or any franchises.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={matchupTeamA}
              onChange={(e) => setMatchupTeamA(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
            >
              {analysesList.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {TEAMS_BY_ID[t.teamId]?.shortName || t.teamId}
                </option>
              ))}
            </select>

            <span className="text-xs font-bold text-amber-400 font-mono">VS</span>

            <select
              value={matchupTeamB}
              onChange={(e) => setMatchupTeamB(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
            >
              {analysesList.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {TEAMS_BY_ID[t.teamId]?.shortName || t.teamId}
                </option>
              ))}
            </select>
          </div>
        </div>

        {matchupResult && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Projected Tactical Advantage</p>
                <p className="text-lg font-extrabold text-amber-400 mt-0.5">
                  {matchupResult.favorite} (+{matchupResult.scoreDiff} pts)
                </p>
              </div>
              <p className="text-xs text-slate-300 italic max-w-md sm:text-right">
                "{matchupResult.verdict}"
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {matchupResult.matchups.map((m) => (
                <div key={m.category} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold mb-2">{m.category}</p>
                  <div className="flex items-center justify-center gap-3 font-mono font-bold text-sm mb-1">
                    <span className="text-white">{m.teamAScore}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-white">{m.teamBScore}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">
                    Edge: {m.edge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Leaderboard Table */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Complete Franchise Standings</span>
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 font-semibold text-slate-400">
                <th className="py-4 px-4 w-16 text-center">Rank</th>
                <th className="py-4 px-4">Franchise</th>
                <th className="py-4 px-4">Owner</th>
                <th className="py-4 px-4 font-mono text-center">Overall</th>
                <th className="py-4 px-4 font-mono text-center">Batting</th>
                <th className="py-4 px-4 font-mono text-center">Bowling</th>
                <th className="py-4 px-4 font-mono text-center">Balance</th>
                <th className="py-4 px-4 font-mono text-center">Powerplay</th>
                <th className="py-4 px-4 font-mono text-center">Death</th>
                <th className="py-4 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {analysesList.map((item, idx) => {
                const team = TEAMS_BY_ID[item.teamId];
                const squad = room.squads[item.teamId];
                const isWin = idx === 0;
                const isRun = idx === 1;

                return (
                  <tr
                    key={item.teamId}
                    className={`transition-colors ${
                      isWin ? 'bg-amber-500/5 hover:bg-amber-500/10' : isRun ? 'bg-slate-400/5 hover:bg-slate-400/10' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-4 px-4 text-center font-mono font-bold text-slate-400">
                      {isWin ? '🥇 Winner' : isRun ? '🥈 Runner-Up' : `#${idx + 1}`}
                    </td>
                    <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: team?.primaryColor || '#888' }}
                      />
                      <span>{team?.shortName || item.teamId}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{squad?.ownerName || 'Owner'}</td>
                    <td className="py-4 px-4 font-mono font-black text-amber-400 text-center text-sm">
                      {item.teamScore}
                    </td>
                    <td className="py-4 px-4 font-mono text-white text-center">{item.battingScore}</td>
                    <td className="py-4 px-4 font-mono text-white text-center">{item.bowlingScore}</td>
                    <td className="py-4 px-4 font-mono text-slate-300 text-center">{item.balanceScore}</td>
                    <td className="py-4 px-4 font-mono text-slate-300 text-center">{item.powerplayScore}</td>
                    <td className="py-4 px-4 font-mono text-slate-300 text-center">{item.deathOversScore}</td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => setSelectedTeamDetail(item.teamId)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-semibold text-[11px] transition-colors"
                      >
                        Scouting Report
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Team Scouting Report Modal */}
      {selectedTeamDetail && room.analyses[selectedTeamDetail] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setSelectedTeamDetail(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>

            {(() => {
              const a = room.analyses[selectedTeamDetail];
              const t = TEAMS_BY_ID[selectedTeamDetail];
              const sq = room.squads[selectedTeamDetail];
              return (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-white text-sm"
                      style={{ backgroundColor: t?.primaryColor || '#888' }}
                    >
                      {t?.shortName || selectedTeamDetail}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{t?.name || selectedTeamDetail}</h3>
                      <p className="text-xs text-slate-400">
                        Owner: {sq?.ownerName} · Model Score: <span className="text-amber-400 font-mono font-bold">{a.teamScore}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 italic mb-6">
                    "{a.aiExplanation}"
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Key Strengths</h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {a.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400">✓</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Tactical Vulnerabilities</h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {a.weaknesses.map((w, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-rose-400">⚠</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 text-right">
                    <button
                      onClick={() => setSelectedTeamDetail(null)}
                      className="px-5 py-2 rounded-xl bg-slate-800 text-white font-semibold text-xs hover:bg-slate-700"
                    >
                      Close Report
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
