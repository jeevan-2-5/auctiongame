export type PlayerRole = 'BATTER' | 'WICKETKEEPER' | 'ALL_ROUNDER' | 'BOWLER';

export type BattingStyle = 'RIGHT_HAND' | 'LEFT_HAND';

export type BowlingStyle =
  | 'FAST'
  | 'FAST_MEDIUM'
  | 'MEDIUM'
  | 'LEG_SPIN'
  | 'OFF_SPIN'
  | 'LEFT_ARM_ORTHODOX'
  | 'LEFT_ARM_WRIST_SPIN'
  | 'NONE';

export type AuctionCategory =
  | 'MARQUEE_BATTERS'
  | 'MARQUEE_BOWLERS'
  | 'PREMIER_ALL_ROUNDERS'
  | 'WICKETKEEPERS'
  | 'FAST_BOWLERS'
  | 'SPINNERS'
  | 'UNCAPPED_TALENTS';

export interface Player {
  id: string;
  fullName: string;
  shortName: string;
  photoUrl: string;
  country: string;
  countryCode: string;
  nationality: string;
  isIndian: boolean;
  isOverseas: boolean;
  dateOfBirth: string;
  role: PlayerRole;
  primaryRole: PlayerRole;
  secondaryRole?: PlayerRole;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  isWicketkeeper: boolean;
  isCapped: boolean;
  basePriceLakhs: number; // in integer Lakhs (e.g. 200 = 2.00 Cr)
  auctionCategory: AuctionCategory;
  auctionSet: string;
  rating: number; // 50 - 99
  battingRating: number;
  bowlingRating: number;
  fieldingRating: number;
  wicketkeepingRating: number;
  powerplayBatting: number;
  middleOversBatting: number;
  deathBatting: number;
  powerplayBowling: number;
  middleOversBowling: number;
  deathBowling: number;
  spinRating: number;
  paceRating: number;
  experienceRating: number;
  currentRealTeam: string;
  status: 'AVAILABLE' | 'SOLD' | 'UNSOLD';
}

export interface FranchiseTeam {
  id: string;
  name: string;
  shortName: string;
  city: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  badgeText: string;
  tagline: string;
}

export interface RoomPlayer {
  id: string; // unique anonymous session id
  name: string;
  teamId: string | null;
  isHost: boolean;
  isSpectator: boolean;
  isConnected: boolean;
  joinedAt: number;
}

export interface BoughtPlayer {
  player: Player;
  purchasePriceLakhs: number;
  boughtAt: number;
}

export interface Squad {
  teamId: string;
  ownerId: string;
  ownerName: string;
  startingPurseLakhs: number;
  currentPurseLakhs: number;
  spentPurseLakhs: number;
  players: BoughtPlayer[];
}

export interface PlayingXI {
  teamId: string;
  playerIds: string[]; // exactly 11 player IDs
  battingOrder: string[]; // 1 to 11
  captainId: string;
  viceCaptainId: string;
  submittedAt: number;
}

export type RoomStatus =
  | 'WAITING'
  | 'READY'
  | 'AUCTION_RUNNING'
  | 'AUCTION_PAUSED'
  | 'AUCTION_COMPLETED'
  | 'PLAYING_XI_SELECTION'
  | 'ANALYSIS'
  | 'COMPLETED';

export interface RoomSettings {
  startingPurseLakhs: number; // default 12,000 (₹120 Cr)
  maxSquadSize: number; // FIXED 15
  timerDurationSeconds: number; // default 10s
  bidResetDurationSeconds: number; // default 5s
  maxOverseasInSquad: number; // default 8
  maxOverseasInPlayingXI: number; // default 4
  isPublic: boolean;
  spectatorMode: boolean;
  auctionMode: 'MEGA' | 'QUICK' | 'FULL';
  reauctionUnsold: boolean;
  autoProgressSeconds: number; // default 3s pause after hammer
}

export interface AuctionState {
  status: RoomStatus;
  currentPoolIndex: number;
  currentPlayerId: string | null;
  currentBidLakhs: number;
  highestBidderTeamId: string | null;
  highestBidderPlayerId: string | null;
  timerSeconds: number;
  isTimerRunning: boolean;
  lastBidTimestamp: number;
  soldPlayerIds: string[];
  unsoldPlayerIds: string[];
}

export interface TeamAnalysis {
  teamId: string;
  teamScore: number;
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
  strengths: string[];
  weaknesses: string[];
  bestFeature: string;
  tacticalAdvice: string;
  aiExplanation: string;
  calculatedMetrics: Record<string, number>;
}

export type AuctionEventType =
  | 'ROOM_CREATED'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'TEAM_SELECTED'
  | 'AUCTION_STARTED'
  | 'PLAYER_UP'
  | 'BID_PLACED'
  | 'TIMER_RESET'
  | 'PLAYER_SOLD'
  | 'PLAYER_UNSOLD'
  | 'PLAYER_REAUCTIONED'
  | 'AUCTION_PAUSED'
  | 'AUCTION_RESUMED'
  | 'AUCTION_COMPLETED'
  | 'PLAYING_XI_SUBMITTED'
  | 'ANALYSIS_COMPLETED';

export interface AuctionEvent {
  id: string;
  roomId: string;
  timestamp: number;
  type: AuctionEventType;
  message: string;
  playerId?: string;
  teamId?: string;
  amountLakhs?: number;
  metadata?: any;
}

export interface Room {
  id: string; // 6-char code
  name: string;
  hostId: string;
  settings: RoomSettings;
  players: Record<string, RoomPlayer>;
  squads: Record<string, Squad>;
  playingXIs: Record<string, PlayingXI>;
  analyses: Record<string, TeamAnalysis>;
  auction: AuctionState;
  events: AuctionEvent[];
  playerPool: Player[];
  createdAt: number;
  updatedAt: number;
}
