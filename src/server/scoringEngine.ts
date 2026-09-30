import { Player, PlayingXI, Squad, TeamAnalysis } from '../types/auction';

export interface ScoreBreakdown {
  battingScore: number;
  bowlingScore: number;
  balanceScore: number;
  roleBalanceScore: number;
  powerplayScore: number;
  middleOversScore: number;
  deathOversScore: number;
  spinScore: number;
  paceScore: number;
  fieldingScore: number;
  benchScore: number;
  teamScore: number;
  strengths: string[];
  weaknesses: string[];
  bestFeature: string;
  tacticalAdvice: string;
}

export const SCORING_WEIGHTS = {
  batting: 0.25,
  bowling: 0.25,
  allRoundBalance: 0.15,
  roleBalance: 0.10,
  powerplay: 0.05,
  middleOvers: 0.05,
  deathOvers: 0.05,
  fielding: 0.05,
  benchStrength: 0.05,
};

export function calculateDeterministicTeamScore(
  squad: Squad,
  playingXI: PlayingXI,
  playerMap: Record<string, Player>
): TeamAnalysis {
  const xiPlayers: Player[] = playingXI.playerIds
    .map((id) => playerMap[id])
    .filter(Boolean);

  const benchPlayerIds = squad.players
    .map((bp) => bp.player.id)
    .filter((id) => !playingXI.playerIds.includes(id));
  const benchPlayers: Player[] = benchPlayerIds
    .map((id) => playerMap[id])
    .filter(Boolean);

  // 1. Batting Score (Order-weighted)
  // Openers (#1-#2): 30% weight
  // Top order (#3-#4): 30% weight
  // Middle order (#5-#7): 30% weight
  // Lower order (#8-#11): 10% weight
  let battingTotal = 0;
  let battingWeightSum = 0;

  playingXI.battingOrder.forEach((pId, idx) => {
    const p = playerMap[pId];
    if (!p) return;
    let posWeight = 1;
    if (idx < 2) posWeight = 2.5; // openers
    else if (idx < 4) posWeight = 2.5; // top order
    else if (idx < 7) posWeight = 2.0; // middle order
    else if (idx === 7) posWeight = 1.0; // #8 anchor
    else posWeight = 0.4; // tail

    let pBatRating = p.battingRating;
    // Captain & Vice Captain mental boost
    if (p.id === playingXI.captainId) pBatRating += 2;
    if (p.id === playingXI.viceCaptainId) pBatRating += 1;

    battingTotal += pBatRating * posWeight;
    battingWeightSum += posWeight;
  });

  const rawBatting = battingWeightSum > 0 ? battingTotal / battingWeightSum : 70;
  const battingScore = Math.min(99, Math.max(50, Math.round(rawBatting * 10) / 10));

  // 2. Bowling Score
  // Needs at least 5 main bowlers. Best 5 bowling ratings in XI.
  const bowlersSorted = [...xiPlayers].sort((a, b) => b.bowlingRating - a.bowlingRating);
  const frontline = bowlersSorted.slice(0, 5);
  const rawFrontlineAvg = frontline.reduce((sum, b) => sum + b.bowlingRating, 0) / Math.max(1, frontline.length);
  
  // 6th bowling option bonus
  const sixthBowler = bowlersSorted[5];
  const sixthBonus = (sixthBowler && sixthBowler.bowlingRating > 65) ? 2.5 : 0;
  const bowlingScore = Math.min(99, Math.max(50, Math.round((rawFrontlineAvg + sixthBonus) * 10) / 10));

  // 3. All-Round Balance Score
  // Depth of batting (#8 has battingRating > 65? #9 > 50?)
  // Number of genuine all-rounders
  const allRounders = xiPlayers.filter((p) => p.role === 'ALL_ROUNDER');
  const batAt8 = playerMap[playingXI.battingOrder[7]];
  const batAt8Rating = batAt8 ? batAt8.battingRating : 40;
  const bowlingOptionsCount = xiPlayers.filter((p) => p.bowlingRating >= 70).length;

  let balanceCalc = 70;
  balanceCalc += allRounders.length * 4; // bonus per all-rounder
  if (batAt8Rating >= 70) balanceCalc += 6;
  else if (batAt8Rating >= 55) balanceCalc += 3;
  if (bowlingOptionsCount >= 6) balanceCalc += 6;
  else if (bowlingOptionsCount === 5) balanceCalc += 3;
  else balanceCalc -= 8; // less than 5 bowlers is dangerous
  const balanceScore = Math.min(99, Math.max(50, Math.round(balanceCalc * 10) / 10));

  // 4. Role Balance Score
  // Keeper check, pace attack count, spin attack count, overseas limit check
  const recognizedKeepers = xiPlayers.filter((p) => p.isWicketkeeper);
  const pacers = xiPlayers.filter((p) => p.bowlingStyle.includes('FAST') || p.bowlingStyle.includes('MEDIUM'));
  const spinners = xiPlayers.filter((p) => p.bowlingStyle.includes('SPIN') || p.bowlingStyle.includes('ORTHODOX'));
  const overseasCount = xiPlayers.filter((p) => p.isOverseas).length;

  let roleCalc = 85;
  if (recognizedKeepers.length === 0) roleCalc -= 15; // huge penalty for no keeper
  if (pacers.length < 2) roleCalc -= 8;
  if (spinners.length < 1) roleCalc -= 8;
  if (overseasCount > 4) roleCalc -= 20; // illegal overseas rule violation
  const roleBalanceScore = Math.min(99, Math.max(50, Math.round(roleCalc * 10) / 10));

  // 5. Phase Scores: Powerplay
  const openers = playingXI.battingOrder.slice(0, 2).map((id) => playerMap[id]).filter(Boolean);
  const ppBatAvg = openers.length > 0 ? openers.reduce((acc, p) => acc + p.powerplayBatting, 0) / openers.length : 70;
  const ppBowl = bowlersSorted.slice(0, 3);
  const ppBowlAvg = ppBowl.length > 0 ? ppBowl.reduce((acc, p) => acc + p.powerplayBowling, 0) / ppBowl.length : 70;
  const powerplayScore = Math.min(99, Math.max(50, Math.round(((ppBatAvg * 0.5) + (ppBowlAvg * 0.5)) * 10) / 10));

  // 6. Phase Scores: Middle Overs
  const middleBatters = playingXI.battingOrder.slice(2, 6).map((id) => playerMap[id]).filter(Boolean);
  const moBatAvg = middleBatters.length > 0 ? middleBatters.reduce((acc, p) => acc + p.middleOversBatting, 0) / middleBatters.length : 70;
  const moBowlAvg = bowlersSorted.slice(0, 5).reduce((acc, p) => acc + p.middleOversBowling, 0) / 5;
  const middleOversScore = Math.min(99, Math.max(50, Math.round(((moBatAvg * 0.5) + (moBowlAvg * 0.5)) * 10) / 10));

  // 7. Phase Scores: Death Overs
  const finishers = playingXI.battingOrder.slice(4, 8).map((id) => playerMap[id]).filter(Boolean);
  const deathBatAvg = finishers.length > 0 ? finishers.reduce((acc, p) => acc + p.deathBatting, 0) / finishers.length : 70;
  const deathBowlSorted = [...xiPlayers].sort((a, b) => b.deathBowling - a.deathBowling);
  const deathBowlAvg = (deathBowlSorted[0]?.deathBowling || 70) * 0.6 + (deathBowlSorted[1]?.deathBowling || 70) * 0.4;
  const deathOversScore = Math.min(99, Math.max(50, Math.round(((deathBatAvg * 0.5) + (deathBowlAvg * 0.5)) * 10) / 10));

  // 8. Spin & Pace Scores
  const spinBowlers = xiPlayers.filter((p) => p.spinRating > 60);
  const spinScore = spinBowlers.length > 0
    ? Math.min(99, Math.round(spinBowlers.reduce((acc, p) => acc + p.spinRating, 0) / spinBowlers.length))
    : 65;

  const paceBowlers = xiPlayers.filter((p) => p.paceRating > 60);
  const paceScore = paceBowlers.length > 0
    ? Math.min(99, Math.round(paceBowlers.reduce((acc, p) => acc + p.paceRating, 0) / paceBowlers.length))
    : 65;

  // 9. Fielding Score
  const fldAvg = xiPlayers.reduce((acc, p) => acc + p.fieldingRating, 0) / 11;
  const keeperBonus = recognizedKeepers[0]?.wicketkeepingRating ? (recognizedKeepers[0].wicketkeepingRating - 80) * 0.2 : 0;
  const fieldingScore = Math.min(99, Math.max(50, Math.round((fldAvg + keeperBonus) * 10) / 10));

  // 10. Bench Strength Score (Max 4 substitutes)
  const benchScore = benchPlayers.length > 0
    ? Math.min(99, Math.max(50, Math.round((benchPlayers.reduce((acc, p) => acc + p.rating, 0) / benchPlayers.length) * 10) / 10))
    : 70;

  // Weighted Overall deterministic score
  const teamScore = Math.round((
    battingScore * SCORING_WEIGHTS.batting +
    bowlingScore * SCORING_WEIGHTS.bowling +
    balanceScore * SCORING_WEIGHTS.allRoundBalance +
    roleBalanceScore * SCORING_WEIGHTS.roleBalance +
    powerplayScore * SCORING_WEIGHTS.powerplay +
    middleOversScore * SCORING_WEIGHTS.middleOvers +
    deathOversScore * SCORING_WEIGHTS.deathOvers +
    fieldingScore * SCORING_WEIGHTS.fielding +
    benchScore * SCORING_WEIGHTS.benchStrength
  ) * 10) / 10;

  // Strengths & Weaknesses generator
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (battingScore >= 90) strengths.push('Formidable batting depth with elite run-scorers');
  else if (battingScore < 80) weaknesses.push('Top-order looks vulnerable against top-tier bowling attacks');

  if (bowlingScore >= 90) strengths.push('Lethal frontline bowling unit with genuine wicket-takers');
  else if (bowlingScore < 80) weaknesses.push('Thin bowling attack with insufficient specialist options');

  if (deathOversScore >= 90) strengths.push('World-class death-overs execution with clutch finishers & yorker specialists');
  else if (deathOversScore < 80) weaknesses.push('High leakage risk in death overs (overs 16-20)');

  if (powerplayScore >= 90) strengths.push('Explosive powerplay potential capable of dismantling new-ball attacks');
  if (allRounders.length >= 3) strengths.push(`Exceptional flexibility with ${allRounders.length} quality all-rounders`);
  else if (allRounders.length === 0) weaknesses.push('Lack of all-round options limits batting and bowling depth');

  if (recognizedKeepers.length === 0) weaknesses.push('CRITICAL: No recognized specialist wicketkeeper in Playing XI');
  if (bowlingOptionsCount < 5) weaknesses.push('CRITICAL: Fewer than 5 bowling options selected');
  if (overseasCount > 4) weaknesses.push(`CRITICAL: Exceeds 4 overseas players limit (${overseasCount} selected)`);

  if (strengths.length === 0) strengths.push('Balanced and versatile squad construction');
  if (weaknesses.length === 0) weaknesses.push('Few noticeable tactical weaknesses; well-rounded lineup');

  // Best feature summary
  const bestMetric = Math.max(battingScore, bowlingScore, powerplayScore, deathOversScore, balanceScore);
  let bestFeature = 'Versatile Tactical Core';
  if (bestMetric === deathOversScore) bestFeature = 'Clutch Death Overs Execution';
  else if (bestMetric === battingScore) bestFeature = 'Heavyweight Batting Lineup';
  else if (bestMetric === bowlingScore) bestFeature = 'Strike Bowling Arsenal';
  else if (bestMetric === powerplayScore) bestFeature = 'Powerplay Blitz Unit';

  // Tactical advice
  let tacticalAdvice = 'Utilize spinners to squeeze middle overs and back designated death bowlers to close.';
  if (battingScore > bowlingScore + 5) {
    tacticalAdvice = 'Leverage aggressive batting aggressively up front to post above-par totals and shield bowling reserves.';
  } else if (bowlingScore > battingScore + 5) {
    tacticalAdvice = 'Rely on disciplined bowling to restrict opposition under par and manage controlled chase targets.';
  }

  const defaultExplanation = `The deterministic cricket model evaluated ${squad.ownerName}'s team at ${teamScore}/100 based on ${battingScore} Batting, ${bowlingScore} Bowling, and ${balanceScore} Balance. Top strengths include: ${strengths[0]}.`;

  return {
    teamId: squad.teamId,
    teamScore,
    battingScore,
    bowlingScore,
    balanceScore,
    roleBalanceScore,
    powerplayScore,
    middleOversScore,
    deathOversScore,
    spinScore,
    paceScore,
    fieldingScore,
    benchScore,
    strengths,
    weaknesses,
    bestFeature,
    tacticalAdvice,
    aiExplanation: defaultExplanation,
    calculatedMetrics: {
      battingRating: battingScore,
      bowlingRating: bowlingScore,
      allRoundBalance: balanceScore,
      roleBalance: roleBalanceScore,
      powerplay: powerplayScore,
      middleOvers: middleOversScore,
      deathOvers: deathOversScore,
      spin: spinScore,
      pace: paceScore,
      fielding: fieldingScore,
      bench: benchScore,
    },
  };
}

export function compareTwoTeams(
  teamA: TeamAnalysis,
  teamB: TeamAnalysis,
  nameA: string,
  nameB: string
) {
  const diff = Math.round((teamA.teamScore - teamB.teamScore) * 10) / 10;
  const favorite = diff > 0 ? nameA : diff < 0 ? nameB : 'Even Matchup';

  const matchups = [
    {
      category: 'Top Order & Batting',
      teamAScore: teamA.battingScore,
      teamBScore: teamB.battingScore,
      edge: teamA.battingScore > teamB.battingScore ? nameA : nameB,
    },
    {
      category: 'Wicket-taking & Bowling',
      teamAScore: teamA.bowlingScore,
      teamBScore: teamB.bowlingScore,
      edge: teamA.bowlingScore > teamB.bowlingScore ? nameA : nameB,
    },
    {
      category: 'Powerplay Phase',
      teamAScore: teamA.powerplayScore,
      teamBScore: teamB.powerplayScore,
      edge: teamA.powerplayScore > teamB.powerplayScore ? nameA : nameB,
    },
    {
      category: 'Death Overs Clutch',
      teamAScore: teamA.deathOversScore,
      teamBScore: teamB.deathOversScore,
      edge: teamA.deathOversScore > teamB.deathOversScore ? nameA : nameB,
    },
    {
      category: 'All-Round Balance',
      teamAScore: teamA.balanceScore,
      teamBScore: teamB.balanceScore,
      edge: teamA.balanceScore > teamB.balanceScore ? nameA : nameB,
    },
  ];

  return {
    favorite,
    scoreDiff: Math.abs(diff),
    matchups,
    verdict:
      diff > 2
        ? `${nameA} holds a decisive tactical advantage, particularly in ${teamA.bestFeature}.`
        : diff < -2
        ? `${nameB} holds a decisive tactical edge, propelled by their superior depth.`
        : `A razor-thin matchup that will hinge on execution in the death overs.`,
  };
}
