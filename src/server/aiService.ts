import { GoogleGenAI } from '@google/genai';
import { Player, PlayingXI, Squad, TeamAnalysis } from '../types/auction';

let aiInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export async function generateTeamAIExplanation(
  teamAnalysis: TeamAnalysis,
  squad: Squad,
  playingXI: PlayingXI,
  playerMap: Record<string, Player>,
  teamName: string
): Promise<string> {
  const ai = getGenAI();
  const xiPlayerNames = playingXI.battingOrder
    .map((id, idx) => {
      const p = playerMap[id];
      const roleTag = p ? p.role : 'PLAYER';
      let tag = `#${idx + 1} ${p ? p.fullName : 'Player'} (${roleTag})`;
      if (id === playingXI.captainId) tag += ' [C]';
      if (id === playingXI.viceCaptainId) tag += ' [VC]';
      return tag;
    })
    .join(', ');

  const captain = playerMap[playingXI.captainId]?.fullName || 'Designated Leader';
  const viceCaptain = playerMap[playingXI.viceCaptainId]?.fullName || 'Vice Captain';

  const prompt = `You are a world-class elite cricket analyst and franchise director.
Provide a concise, sharp 3-4 sentence professional tactical appraisal of this cricket franchise Playing XI drafted in the auction.

Team: ${teamName} (Owner: ${squad.ownerName})
Calculated Deterministic Model Score: ${teamAnalysis.teamScore} / 100
Batting Strength: ${teamAnalysis.battingScore}/100
Bowling Strength: ${teamAnalysis.bowlingScore}/100
All-round Balance: ${teamAnalysis.balanceScore}/100
Powerplay Rating: ${teamAnalysis.powerplayScore}/100
Death Overs Rating: ${teamAnalysis.deathOversScore}/100
Bench Depth: ${teamAnalysis.benchScore}/100

Captain: ${captain}
Vice Captain: ${viceCaptain}
Playing XI Batting Order:
${xiPlayerNames}

Identified Strengths: ${teamAnalysis.strengths.join('; ')}
Identified Weaknesses: ${teamAnalysis.weaknesses.join('; ')}

Requirements:
- Sound like an expert IPL/international commentator (e.g. Harsha Bhogle / Nasser Hussain style).
- Specifically reference the key match-winners in this lineup, their phase suitability (powerplay/death), and why the model arrived at this score.
- Keep the response between 60 to 90 words. Do not invent fake statistics, strictly reference their actual strengths.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const text = response.text?.trim();
      if (text && text.length > 20) {
        return text;
      }
    } catch (err) {
      console.warn('Gemini API call failed, using deterministic fallback explanation:', err);
    }
  }

  // Fallback if Gemini key is absent or API fails
  return `${teamName} built an impressive squad boasting an overall model rating of ${teamAnalysis.teamScore}/100. Captained by ${captain} with ${viceCaptain} as vice-captain, the lineup shines in ${teamAnalysis.bestFeature}. With a batting score of ${teamAnalysis.battingScore} and bowling strength at ${teamAnalysis.bowlingScore}, their primary advantage lies in ${teamAnalysis.strengths[0] || 'balanced squad depth'}. ${teamAnalysis.tacticalAdvice}`;
}

export async function generateTournamentChampionSpeech(
  winnerTeam: TeamAnalysis,
  winnerName: string,
  ownerName: string,
  runnerUpName: string
): Promise<string> {
  const ai = getGenAI();
  const prompt = `Write a short, thrilling 2-sentence coronation announcement for the winner of the Cricket Auction Arena championship.
Champion: ${winnerName} (Owner: ${ownerName}) with an elite overall score of ${winnerTeam.teamScore}/100.
Runner-up: ${runnerUpName}.
Highlight their tactical mastery in the auction room and their complete Playing XI balance.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      const text = response.text?.trim();
      if (text) return text;
    } catch (err) {
      console.warn('Gemini champion announcement fallback:', err);
    }
  }

  return `🏆 All hail ${winnerName}, crowned champions of the Cricket Auction Arena under the masterclass ownership of ${ownerName}! Amassing an outstanding score of ${winnerTeam.teamScore}/100, their flawless auction strategy and balanced Playing XI proved unbeatable.`;
}
