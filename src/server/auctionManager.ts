import { PLAYERS_DATABASE } from '../data/players';
import { TEAMS_BY_ID } from '../data/teams';
import {
  AuctionEvent,
  AuctionState,
  BoughtPlayer,
  Player,
  PlayingXI,
  Room,
  RoomPlayer,
  RoomSettings,
  Squad,
} from '../types/auction';
import { generateTeamAIExplanation, generateTournamentChampionSpeech } from './aiService';
import { calculateDeterministicTeamScore } from './scoringEngine';

export class AuctionManager {
  private rooms: Map<string, Room> = new Map();
  private timerHandles: Map<string, NodeJS.Timeout> = new Map();
  private broadcastCallbacks: Map<string, (room: Room, event?: AuctionEvent) => void> = new Map();

  constructor() {
    // Seed default sample public rooms for instant exploration
    this.createInitialPublicRoom();
  }

  public registerBroadcast(roomId: string, cb: (room: Room, event?: AuctionEvent) => void) {
    this.broadcastCallbacks.set(roomId, cb);
  }

  public unregisterBroadcast(roomId: string) {
    this.broadcastCallbacks.delete(roomId);
  }

  private broadcast(roomId: string, event?: AuctionEvent) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const cb = this.broadcastCallbacks.get(roomId);
    if (cb) {
      cb(room, event);
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return this.rooms.has(code) ? this.generateRoomCode() : code;
  }

  public createRoom(
    hostName: string,
    hostSessionId: string,
    settingsPartial?: Partial<RoomSettings>,
    selectedTeamId?: string,
    customRoomId?: string
  ): Room {
    const id = customRoomId ? customRoomId.toUpperCase().trim() : this.generateRoomCode();
    const settings: RoomSettings = {
      startingPurseLakhs: 12000, // 120 Cr
      maxSquadSize: 15, // STRICT 15 Players max
      timerDurationSeconds: 10,
      bidResetDurationSeconds: 5,
      maxOverseasInSquad: 8,
      maxOverseasInPlayingXI: 4,
      isPublic: true,
      spectatorMode: true,
      auctionMode: 'MEGA',
      reauctionUnsold: true,
      autoProgressSeconds: 3,
      ...settingsPartial,
    };

    // Filter player pool based on mode
    let pool: Player[] = [...PLAYERS_DATABASE];
    if (settings.auctionMode === 'QUICK') {
      // Pick top 25 marquee players
      pool = pool.slice(0, 25);
    }

    const hostPlayer: RoomPlayer = {
      id: hostSessionId,
      name: hostName || 'Host Owner',
      teamId: selectedTeamId || null,
      isHost: true,
      isSpectator: false,
      isConnected: true,
      joinedAt: Date.now(),
    };

    const initialSquads: Record<string, Squad> = {};
    if (selectedTeamId && TEAMS_BY_ID[selectedTeamId]) {
      initialSquads[selectedTeamId] = {
        teamId: selectedTeamId,
        ownerId: hostSessionId,
        ownerName: hostPlayer.name,
        startingPurseLakhs: settings.startingPurseLakhs,
        currentPurseLakhs: settings.startingPurseLakhs,
        spentPurseLakhs: 0,
        players: [],
      };
    }

    const auctionState: AuctionState = {
      status: 'WAITING',
      currentPoolIndex: -1,
      currentPlayerId: null,
      currentBidLakhs: 0,
      highestBidderTeamId: null,
      highestBidderPlayerId: null,
      timerSeconds: settings.timerDurationSeconds,
      isTimerRunning: false,
      lastBidTimestamp: Date.now(),
      soldPlayerIds: [],
      unsoldPlayerIds: [],
    };

    const createdEvent: AuctionEvent = {
      id: `ev-${Date.now()}-1`,
      roomId: id,
      timestamp: Date.now(),
      type: 'ROOM_CREATED',
      message: `Room created by ${hostPlayer.name} with ₹${(settings.startingPurseLakhs / 100).toFixed(0)} Cr starting purse.`,
    };

    const room: Room = {
      id,
      name: `${hostPlayer.name}'s Mega Auction`,
      hostId: hostSessionId,
      settings,
      players: { [hostSessionId]: hostPlayer },
      squads: initialSquads,
      playingXIs: {},
      analyses: {},
      auction: auctionState,
      events: [createdEvent],
      playerPool: pool,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.rooms.set(id, room);
    return room;
  }

  public getRoom(id: string): Room | undefined {
    if (!id) return undefined;
    return this.rooms.get(id.toUpperCase().trim());
  }

  public getOrCreateRoom(
    id: string,
    defaultHostSessionId?: string,
    defaultHostName?: string
  ): Room {
    const code = id ? id.toUpperCase().trim() : this.generateRoomCode();
    let existing = this.rooms.get(code);
    if (!existing) {
      existing = this.createRoom(
        defaultHostName || 'Auction Host',
        defaultHostSessionId || 'usr-' + Math.random().toString(36).substring(2, 9),
        { startingPurseLakhs: 12000, maxSquadSize: 15 },
        'RCB',
        code
      );
    }
    return existing;
  }

  public getAllPublicRooms(): Array<{
    id: string;
    name: string;
    hostName: string;
    teamsCount: number;
    maxTeams: number;
    status: string;
    mode: string;
    purseCr: number;
  }> {
    const list = [];
    for (const room of this.rooms.values()) {
      if (room.settings.isPublic) {
        const host = room.players[room.hostId];
        list.push({
          id: room.id,
          name: room.name,
          hostName: host ? host.name : 'Unknown Host',
          teamsCount: Object.keys(room.squads).length,
          maxTeams: 10,
          status: room.auction.status,
          mode: room.settings.auctionMode,
          purseCr: room.settings.startingPurseLakhs / 100,
        });
      }
    }
    return list;
  }

  public joinRoom(
    roomId: string,
    playerSessionId: string,
    playerName: string,
    teamId?: string,
    isSpectator?: boolean
  ): { success: boolean; error?: string; room?: Room } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found.' };

    const existingPlayer = room.players[playerSessionId];
    if (existingPlayer) {
      // Reconnection
      existingPlayer.isConnected = true;
      if (playerName) existingPlayer.name = playerName;
      room.updatedAt = Date.now();
      this.broadcast(roomId);
      return { success: true, room };
    }

    // Verify team availability if requested
    if (teamId) {
      const takenBy = Object.values(room.players).find((p) => p.teamId === teamId);
      if (takenBy && takenBy.id !== playerSessionId) {
        return { success: false, error: `Team ${teamId} is already taken by ${takenBy.name}.` };
      }
    }

    const isSpectating = !!isSpectator && room.settings.spectatorMode;
    const newPlayer: RoomPlayer = {
      id: playerSessionId,
      name: playerName || `Player ${Object.keys(room.players).length + 1}`,
      teamId: isSpectating ? null : teamId || null,
      isHost: false,
      isSpectator: isSpectating,
      isConnected: true,
      joinedAt: Date.now(),
    };

    room.players[playerSessionId] = newPlayer;

    if (teamId && !isSpectating && !room.squads[teamId]) {
      room.squads[teamId] = {
        teamId,
        ownerId: playerSessionId,
        ownerName: newPlayer.name,
        startingPurseLakhs: room.settings.startingPurseLakhs,
        currentPurseLakhs: room.settings.startingPurseLakhs,
        spentPurseLakhs: 0,
        players: [],
      };
    }

    const joinEvent: AuctionEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      roomId,
      timestamp: Date.now(),
      type: 'PLAYER_JOINED',
      message: `${newPlayer.name} joined the room${teamId ? ` managing ${teamId}` : ''}.`,
    };
    room.events.unshift(joinEvent);
    room.updatedAt = Date.now();

    this.broadcast(roomId, joinEvent);
    return { success: true, room };
  }

  public ensurePlayerInRoom(roomId: string, playerSessionId: string, playerName?: string): RoomPlayer | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    let player = room.players[playerSessionId];
    if (!player) {
      player = {
        id: playerSessionId,
        name: playerName || `Player ${Object.keys(room.players).length + 1}`,
        teamId: null,
        isHost: false,
        isSpectator: false,
        isConnected: true,
        joinedAt: Date.now(),
      };
      room.players[playerSessionId] = player;
      room.updatedAt = Date.now();
      this.broadcast(roomId);
    } else {
      player.isConnected = true;
      if (playerName && (!player.name || player.name.startsWith('Player '))) {
        player.name = playerName;
      }
    }
    return player;
  }

  public selectTeam(
    roomId: string,
    playerSessionId: string,
    teamId: string,
    playerName?: string
  ): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found.' };

    let player = room.players[playerSessionId];
    if (!player) {
      // Auto-enroll player into room
      player = {
        id: playerSessionId,
        name: playerName || `Player ${Object.keys(room.players).length + 1}`,
        teamId: null,
        isHost: false,
        isSpectator: false,
        isConnected: true,
        joinedAt: Date.now(),
      };
      room.players[playerSessionId] = player;
    } else if (playerName) {
      player.name = playerName;
    }

    if (!TEAMS_BY_ID[teamId]) return { success: false, error: 'Invalid franchise team.' };

    const takenBy = Object.values(room.players).find((p) => p.teamId === teamId && p.id !== playerSessionId);
    if (takenBy) return { success: false, error: `Team ${teamId} is already taken by ${takenBy.name}.` };

    // Release old team squad if any and no players bought
    if (player.teamId && room.squads[player.teamId] && room.squads[player.teamId].players.length === 0) {
      delete room.squads[player.teamId];
    }

    player.teamId = teamId;
    player.isSpectator = false;

    if (!room.squads[teamId]) {
      room.squads[teamId] = {
        teamId,
        ownerId: playerSessionId,
        ownerName: player.name,
        startingPurseLakhs: room.settings.startingPurseLakhs,
        currentPurseLakhs: room.settings.startingPurseLakhs,
        spentPurseLakhs: 0,
        players: [],
      };
    } else {
      room.squads[teamId].ownerId = playerSessionId;
      room.squads[teamId].ownerName = player.name;
    }

    const teamEvent: AuctionEvent = {
      id: `ev-${Date.now()}`,
      roomId,
      timestamp: Date.now(),
      type: 'TEAM_SELECTED',
      message: `${player.name} selected ${teamId} (${TEAMS_BY_ID[teamId].name}).`,
      teamId,
    };
    room.events.unshift(teamEvent);
    room.updatedAt = Date.now();

    this.broadcast(roomId, teamEvent);
    return { success: true };
  }

  public startAuction(roomId: string, hostSessionId: string): { success: boolean; error?: string } {
    const cleanRoomId = roomId ? roomId.toUpperCase().trim() : '';
    const room = this.rooms.get(cleanRoomId);
    if (!room) return { success: false, error: 'Room not found.' };

    const caller = room.players[hostSessionId];
    const isOwner =
      room.hostId === hostSessionId ||
      caller?.isHost ||
      Object.keys(room.squads).length === 1 ||
      Object.keys(room.players).length <= 1;

    if (!isOwner) {
      const origHost = room.players[room.hostId];
      if (!origHost || !origHost.isConnected) {
        room.hostId = hostSessionId;
        if (caller) caller.isHost = true;
      } else {
        return { success: false, error: 'Only the host can start the auction.' };
      }
    }

    const teamsCount = Object.keys(room.squads).length;
    if (teamsCount < 1) {
      return { success: false, error: 'At least 1 team must be selected to start the auction.' };
    }

    room.auction.status = 'AUCTION_RUNNING';
    room.auction.currentPoolIndex = 0;
    room.updatedAt = Date.now();

    const startEvent: AuctionEvent = {
      id: `ev-${Date.now()}`,
      roomId: cleanRoomId,
      timestamp: Date.now(),
      type: 'AUCTION_STARTED',
      message: `The live auction has officially started with ${teamsCount} franchises competing!`,
    };
    room.events.unshift(startEvent);

    this.presentNextPlayer(room);
    this.broadcast(cleanRoomId, startEvent);
    return { success: true };
  }

  private areAllActiveSquadsComplete(room: Room): boolean {
    // Only consider squads with at least 1 player drafted or with a connected human player
    const activeSquads = Object.values(room.squads).filter(
      (s) => s.players.length > 0 || (room.players[s.ownerId] && !room.players[s.ownerId].isSpectator)
    );
    if (activeSquads.length === 0) return false;

    // Check if every active squad has reached max squad size (e.g. 15 players)
    const allReachedMax = activeSquads.every((s) => s.players.length >= room.settings.maxSquadSize);
    if (allReachedMax) return true;

    // Also check: can any squad still place a legal bid?
    // A squad can bid only if: squad.players.length < maxSquadSize AND squad.currentPurseLakhs >= 20L
    const anySquadCanBid = activeSquads.some(
      (s) => s.players.length < room.settings.maxSquadSize && s.currentPurseLakhs >= 20
    );

    // If no active squad can bid anymore, and all squads with players have at least 11 players for an XI
    if (!anySquadCanBid && activeSquads.some((s) => s.players.length >= 11)) {
      return true;
    }

    return false;
  }

  private presentNextPlayer(room: Room) {
    this.stopTimer(room.id);

    // Check if all participating franchises have reached max squad size or cannot bid
    if (this.areAllActiveSquadsComplete(room)) {
      const fullEv: AuctionEvent = {
        id: `ev-${Date.now()}-allfull`,
        roomId: room.id,
        timestamp: Date.now(),
        type: 'AUCTION_COMPLETED',
        message: '🎉 All participating franchises have completed their 15-player squads! Proceeding to Playing XI selection.',
      };
      room.events.unshift(fullEv);
      this.completeAuction(room);
      return;
    }

    // Find next available player in pool
    const idx = room.auction.currentPoolIndex;
    if (idx >= room.playerPool.length) {
      // Completed pool
      this.completeAuction(room);
      return;
    }

    const player = room.playerPool[idx];
    room.auction.currentPlayerId = player.id;
    room.auction.currentBidLakhs = player.basePriceLakhs;
    room.auction.highestBidderTeamId = null;
    room.auction.highestBidderPlayerId = null;
    room.auction.timerSeconds = room.settings.timerDurationSeconds;
    room.auction.isTimerRunning = true;
    room.auction.lastBidTimestamp = Date.now();

    const upEvent: AuctionEvent = {
      id: `ev-${Date.now()}-${idx}`,
      roomId: room.id,
      timestamp: Date.now(),
      type: 'PLAYER_UP',
      message: `🔨 Now on the block: ${player.fullName} (${player.role}) from ${player.country}. Base Price: ₹${(player.basePriceLakhs / 100).toFixed(2)} Cr.`,
      playerId: player.id,
      amountLakhs: player.basePriceLakhs,
    };
    room.events.unshift(upEvent);
    room.updatedAt = Date.now();

    this.broadcast(room.id, upEvent);
    this.startTimer(room.id);
  }

  private startTimer(roomId: string) {
    this.stopTimer(roomId);
    const interval = setInterval(() => {
      const room = this.rooms.get(roomId);
      if (!room || room.auction.status !== 'AUCTION_RUNNING' || !room.auction.isTimerRunning) {
        this.stopTimer(roomId);
        return;
      }

      room.auction.timerSeconds -= 1;

      if (room.auction.timerSeconds <= 0) {
        this.stopTimer(roomId);
        this.resolveCurrentPlayer(room);
      } else {
        this.broadcast(roomId);
      }
    }, 1000);

    interval.unref();
    this.timerHandles.set(roomId, interval);
  }

  private stopTimer(roomId: string) {
    const handle = this.timerHandles.get(roomId);
    if (handle) {
      clearInterval(handle);
      this.timerHandles.delete(roomId);
    }
  }

  private resolveCurrentPlayer(room: Room) {
    const currentId = room.auction.currentPlayerId;
    if (!currentId) return;

    const player = room.playerPool.find((p) => p.id === currentId);
    if (!player) return;

    if (room.auction.highestBidderTeamId) {
      // SOLD!
      const teamId = room.auction.highestBidderTeamId;
      const squad = room.squads[teamId];
      const winningAmount = room.auction.currentBidLakhs;

      if (squad) {
        squad.currentPurseLakhs -= winningAmount;
        squad.spentPurseLakhs += winningAmount;
        const bought: BoughtPlayer = {
          player,
          purchasePriceLakhs: winningAmount,
          boughtAt: Date.now(),
        };
        squad.players.push(bought);
      }

      player.status = 'SOLD';
      room.auction.soldPlayerIds.push(player.id);

      const soldEvent: AuctionEvent = {
        id: `ev-${Date.now()}-sold`,
        roomId: room.id,
        timestamp: Date.now(),
        type: 'PLAYER_SOLD',
        message: `🔨 SOLD! ${player.fullName} bought by ${teamId} for ₹${(winningAmount / 100).toFixed(2)} Cr!`,
        playerId: player.id,
        teamId,
        amountLakhs: winningAmount,
      };
      room.events.unshift(soldEvent);
      room.updatedAt = Date.now();
      this.broadcast(room.id, soldEvent);

      // Immediately check if all participating squads have completed their squads or cannot bid
      if (this.areAllActiveSquadsComplete(room)) {
        setTimeout(() => {
          const activeRoom = this.rooms.get(room.id);
          if (activeRoom && activeRoom.auction.status === 'AUCTION_RUNNING') {
            const fullEv: AuctionEvent = {
              id: `ev-${Date.now()}-allfull`,
              roomId: activeRoom.id,
              timestamp: Date.now(),
              type: 'AUCTION_COMPLETED',
              message: '🎉 All participating franchises have completed their 15-player squads! Proceeding to Playing XI selection.',
            };
            activeRoom.events.unshift(fullEv);
            this.completeAuction(activeRoom);
          }
        }, 1000);
        return;
      }
    } else {
      // UNSOLD
      player.status = 'UNSOLD';
      room.auction.unsoldPlayerIds.push(player.id);

      const unsoldEvent: AuctionEvent = {
        id: `ev-${Date.now()}-unsold`,
        roomId: room.id,
        timestamp: Date.now(),
        type: 'PLAYER_UNSOLD',
        message: `❌ ${player.fullName} goes UNSOLD at base price ₹${(player.basePriceLakhs / 100).toFixed(2)} Cr.`,
        playerId: player.id,
        amountLakhs: player.basePriceLakhs,
      };
      room.events.unshift(unsoldEvent);
      room.updatedAt = Date.now();
      this.broadcast(room.id, unsoldEvent);

      // Also check on UNSOLD if all participating squads are full or cannot bid anymore
      if (this.areAllActiveSquadsComplete(room)) {
        setTimeout(() => {
          const activeRoom = this.rooms.get(room.id);
          if (activeRoom && activeRoom.auction.status === 'AUCTION_RUNNING') {
            const fullEv: AuctionEvent = {
              id: `ev-${Date.now()}-allfull`,
              roomId: activeRoom.id,
              timestamp: Date.now(),
              type: 'AUCTION_COMPLETED',
              message: '🎉 All participating franchises have completed their squads! Proceeding to Playing XI selection.',
            };
            activeRoom.events.unshift(fullEv);
            this.completeAuction(activeRoom);
          }
        }, 1000);
        return;
      }
    }

    // Auto-advance to next player after intermission
    setTimeout(() => {
      const activeRoom = this.rooms.get(room.id);
      if (activeRoom && activeRoom.auction.status === 'AUCTION_RUNNING') {
        activeRoom.auction.currentPoolIndex += 1;
        this.presentNextPlayer(activeRoom);
      }
    }, room.settings.autoProgressSeconds * 1000);
  }

  public placeBid(
    roomId: string,
    playerSessionId: string,
    bidAmountLakhs: number
  ): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found.' };

    if (room.auction.status !== 'AUCTION_RUNNING') {
      return { success: false, error: 'Auction is not currently running.' };
    }

    const player = room.players[playerSessionId];
    if (!player || !player.teamId) {
      return { success: false, error: 'You must have an assigned team to bid.' };
    }

    const teamId = player.teamId;
    const squad = room.squads[teamId];
    if (!squad) {
      return { success: false, error: 'Squad not found.' };
    }

    // 15-PLAYER SQUAD MAXIMUM RULE (SERVER-AUTHORITATIVE)
    if (squad.players.length >= room.settings.maxSquadSize) {
      return {
        success: false,
        error: `Your squad is full (${room.settings.maxSquadSize}/${room.settings.maxSquadSize} players). You cannot bid on any more players.`,
      };
    }

    // Verify current player up
    const currentId = room.auction.currentPlayerId;
    if (!currentId) {
      return { success: false, error: 'No player is currently on the auction block.' };
    }

    // Cannot outbid oneself if already highest bidder
    if (room.auction.highestBidderTeamId === teamId) {
      return { success: false, error: 'Your team is already the highest bidder.' };
    }

    // Validate bid amount
    const minValidBid = room.auction.highestBidderTeamId === null
      ? room.auction.currentBidLakhs
      : this.calculateNextValidBid(room.auction.currentBidLakhs);

    if (bidAmountLakhs < minValidBid) {
      return {
        success: false,
        error: `Bid must be at least ₹${(minValidBid / 100).toFixed(2)} Cr.`,
      };
    }

    // Validate sufficient purse
    if (squad.currentPurseLakhs < bidAmountLakhs) {
      return {
        success: false,
        error: `Insufficient purse! Remaining purse: ₹${(squad.currentPurseLakhs / 100).toFixed(2)} Cr.`,
      };
    }

    // Overseas squad check
    const currentPlayer = room.playerPool.find((p) => p.id === currentId);
    if (currentPlayer && currentPlayer.isOverseas) {
      const overseasInSquad = squad.players.filter((bp) => bp.player.isOverseas).length;
      if (overseasInSquad >= room.settings.maxOverseasInSquad) {
        return {
          success: false,
          error: `You already have reached the maximum allowed overseas players (${room.settings.maxOverseasInSquad}).`,
        };
      }
    }

    // Accept bid!
    room.auction.currentBidLakhs = bidAmountLakhs;
    room.auction.highestBidderTeamId = teamId;
    room.auction.highestBidderPlayerId = playerSessionId;
    room.auction.lastBidTimestamp = Date.now();

    // Reset timer to configurable reset duration (e.g. 5s)
    room.auction.timerSeconds = room.settings.bidResetDurationSeconds;
    room.auction.isTimerRunning = true;

    const bidEvent: AuctionEvent = {
      id: `ev-${Date.now()}-bid`,
      roomId,
      timestamp: Date.now(),
      type: 'BID_PLACED',
      message: `🔥 ${teamId} (${player.name}) bid ₹${(bidAmountLakhs / 100).toFixed(2)} Cr!`,
      playerId: currentId,
      teamId,
      amountLakhs: bidAmountLakhs,
    };
    room.events.unshift(bidEvent);
    room.updatedAt = Date.now();

    this.broadcast(roomId, bidEvent);
    this.startTimer(roomId);
    return { success: true };
  }

  public calculateNextValidBid(currentBidLakhs: number): number {
    if (currentBidLakhs < 100) {
      return currentBidLakhs + 5; // +5L
    } else if (currentBidLakhs < 500) {
      return currentBidLakhs + 10; // +10L
    } else {
      return currentBidLakhs + 25; // +25L
    }
  }

  public pauseAuction(roomId: string, hostSessionId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== hostSessionId) return { success: false, error: 'Unauthorized.' };

    room.auction.status = 'AUCTION_PAUSED';
    room.auction.isTimerRunning = false;
    this.stopTimer(roomId);

    const ev: AuctionEvent = {
      id: `ev-${Date.now()}`,
      roomId,
      timestamp: Date.now(),
      type: 'AUCTION_PAUSED',
      message: 'Auction paused by host.',
    };
    room.events.unshift(ev);
    room.updatedAt = Date.now();
    this.broadcast(roomId, ev);
    return { success: true };
  }

  public resumeAuction(roomId: string, hostSessionId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== hostSessionId) return { success: false, error: 'Unauthorized.' };

    room.auction.status = 'AUCTION_RUNNING';
    room.auction.isTimerRunning = true;
    this.startTimer(roomId);

    const ev: AuctionEvent = {
      id: `ev-${Date.now()}`,
      roomId,
      timestamp: Date.now(),
      type: 'AUCTION_RESUMED',
      message: 'Auction resumed by host.',
    };
    room.events.unshift(ev);
    room.updatedAt = Date.now();
    this.broadcast(roomId, ev);
    return { success: true };
  }

  public skipPlayer(roomId: string, hostSessionId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== hostSessionId) return { success: false, error: 'Unauthorized.' };

    this.stopTimer(roomId);
    room.auction.currentPoolIndex += 1;
    this.presentNextPlayer(room);
    return { success: true };
  }

  public endAuctionManually(roomId: string, sessionId?: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found.' };

    this.stopTimer(roomId);
    this.completeAuction(room);
    return { success: true };
  }

  public returnToPlayingXI(roomId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found.' };

    this.stopTimer(roomId);
    room.auction.status = 'PLAYING_XI_SELECTION';
    room.updatedAt = Date.now();

    const ev: AuctionEvent = {
      id: `ev-${Date.now()}-editxi`,
      roomId: room.id,
      timestamp: Date.now(),
      type: 'ROOM_CREATED',
      message: '🔄 Playing XI selection reopened for lineup and batting order rearrangements.',
    };
    room.events.unshift(ev);
    this.broadcast(room.id, ev);
    return { success: true };
  }

  private completeAuction(room: Room) {
    this.stopTimer(room.id);
    room.auction.status = 'PLAYING_XI_SELECTION';
    room.auction.isTimerRunning = false;
    room.auction.currentPlayerId = null;

    // Build player map
    const playerMap: Record<string, Player> = {};
    for (const p of room.playerPool) {
      playerMap[p.id] = p;
    }

    // Auto-construct a starting balanced Playing 11 for each squad with drafted players
    // So both teams immediately have a valid 11 ready on the pitch that they can rearrange!
    for (const [teamId, squad] of Object.entries(room.squads)) {
      if (!room.playingXIs[teamId] && squad.players.length > 0) {
        room.playingXIs[teamId] = this.autoConstructPlayingXI(squad, playerMap);
      }
    }

    const ev: AuctionEvent = {
      id: `ev-${Date.now()}-completed`,
      roomId: room.id,
      timestamp: Date.now(),
      type: 'AUCTION_COMPLETED',
      message: '🎉 The auction stage is complete! All franchises can now inspect and rearrange their Playing XI and batting order.',
    };
    room.events.unshift(ev);
    room.updatedAt = Date.now();
    this.broadcast(room.id, ev);
  }

  public submitPlayingXI(
    roomId: string,
    playerSessionId: string,
    playingXI: {
      teamId: string;
      playerIds: string[];
      battingOrder: string[];
      captainId: string;
      viceCaptainId: string;
    }
  ): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found.' };

    const squad = room.squads[playingXI.teamId];
    if (!squad) return { success: false, error: 'Squad not found.' };

    const targetCount = Math.min(11, squad.players.length);

    // Validation: exactly 11 players (or full squad if less than 11)
    if (playingXI.playerIds.length !== targetCount) {
      return { success: false, error: `Playing XI must contain ${targetCount} players (currently ${playingXI.playerIds.length}).` };
    }

    if (playingXI.battingOrder.length !== targetCount) {
      return { success: false, error: `Batting order must contain all ${targetCount} players.` };
    }

    if (targetCount >= 2 && (!playingXI.captainId || !playingXI.viceCaptainId)) {
      return { success: false, error: 'Captain and Vice-Captain must be selected.' };
    }

    if (playingXI.captainId && playingXI.viceCaptainId && playingXI.captainId === playingXI.viceCaptainId) {
      return { success: false, error: 'Captain and Vice-Captain cannot be the same player.' };
    }

    // Verify all players are in squad
    const squadPlayerIds = new Set(squad.players.map((bp) => bp.player.id));
    for (const pId of playingXI.playerIds) {
      if (!squadPlayerIds.has(pId)) {
        return { success: false, error: `Selected player ${pId} is not in your squad.` };
      }
    }

    // Overseas rule check (max 4 overseas in XI)
    const overseasInXI = squad.players.filter(
      (bp) => playingXI.playerIds.includes(bp.player.id) && bp.player.isOverseas
    ).length;
    if (overseasInXI > room.settings.maxOverseasInPlayingXI) {
      return {
        success: false,
        error: `Maximum ${room.settings.maxOverseasInPlayingXI} overseas players allowed in Playing XI (${overseasInXI} selected).`,
      };
    }

    const savedXI: PlayingXI = {
      teamId: playingXI.teamId,
      playerIds: playingXI.playerIds,
      battingOrder: playingXI.battingOrder,
      captainId: playingXI.captainId,
      viceCaptainId: playingXI.viceCaptainId,
      submittedAt: Date.now(),
    };

    room.playingXIs[playingXI.teamId] = savedXI;

    const ev: AuctionEvent = {
      id: `ev-${Date.now()}-xi`,
      roomId,
      timestamp: Date.now(),
      type: 'PLAYING_XI_SUBMITTED',
      message: `📋 ${playingXI.teamId} submitted their final Playing XI!`,
      teamId: playingXI.teamId,
    };
    room.events.unshift(ev);
    room.updatedAt = Date.now();
    this.broadcast(roomId, ev);

    // If all squads submitted their Playing XI, trigger analysis!
    const allSquadsSubmitted = Object.keys(room.squads).every((tId) => !!room.playingXIs[tId]);
    if (allSquadsSubmitted && Object.keys(room.squads).length > 0) {
      this.runTournamentAnalysis(roomId);
    }

    return { success: true };
  }

  public autoConstructPlayingXI(squad: Squad, playerMap: Record<string, Player>): PlayingXI {
    const pool = squad.players.map((bp) => bp.player);
    const keepers = pool.filter((p) => p.isWicketkeeper).sort((a, b) => b.battingRating - a.battingRating);
    const keeper = keepers[0];

    const openers = pool.filter((p) => p.role === 'BATTER').sort((a, b) => b.powerplayBatting - a.powerplayBatting);
    const bowlers = pool.filter((p) => p.role === 'BOWLER').sort((a, b) => b.bowlingRating - a.bowlingRating);
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

    // Fill remaining up to 11
    pool.sort((a, b) => b.rating - a.rating).forEach((p) => {
      if (order.length < 11 && !pickedSet.has(p.id)) {
        order.push(p.id);
        pickedSet.add(p.id);
      }
    });

    const captainId = order[0] || pool[0]?.id || '';
    const viceCaptainId = order[1] || pool[1]?.id || order[0] || '';

    return {
      teamId: squad.teamId,
      playerIds: order,
      battingOrder: order,
      captainId,
      viceCaptainId,
      submittedAt: Date.now(),
    };
  }

  public async runTournamentAnalysis(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.auction.status = 'ANALYSIS';
    this.broadcast(roomId);

    const playerMap: Record<string, Player> = {};
    for (const p of room.playerPool) {
      playerMap[p.id] = p;
    }

    // 1. Calculate deterministic scores for all teams (auto-construct XI if not submitted yet)
    const analyses: Record<string, any> = {};
    for (const [teamId, squad] of Object.entries(room.squads)) {
      let playingXI = room.playingXIs[teamId];
      if (!playingXI && squad.players.length > 0) {
        playingXI = this.autoConstructPlayingXI(squad, playerMap);
        room.playingXIs[teamId] = playingXI;
      }
      if (playingXI) {
        const analysis = calculateDeterministicTeamScore(squad, playingXI, playerMap);
        analyses[teamId] = analysis;
      }
    }

    // 2. Generate AI commentary & explanation using Gemini in parallel
    const analysisPromises = Object.entries(analyses).map(async ([teamId, analysis]) => {
      const squad = room.squads[teamId];
      const playingXI = room.playingXIs[teamId];
      const teamMeta = TEAMS_BY_ID[teamId];
      const teamName = teamMeta ? teamMeta.name : teamId;

      try {
        const aiExplanation = await generateTeamAIExplanation(
          analysis,
          squad,
          playingXI,
          playerMap,
          teamName
        );
        analysis.aiExplanation = aiExplanation;
      } catch (err) {
        console.error(`AI analysis failed for ${teamId}:`, err);
      }
    });

    await Promise.all(analysisPromises);

    room.analyses = analyses;
    room.auction.status = 'COMPLETED';

    // Find tournament champion
    const sorted = Object.values(analyses).sort((a, b) => b.teamScore - a.teamScore);
    const champion = sorted[0];
    const runnerUp = sorted[1];

    if (champion) {
      const winnerMeta = TEAMS_BY_ID[champion.teamId];
      const winnerName = winnerMeta ? winnerMeta.name : champion.teamId;
      const ownerName = room.squads[champion.teamId]?.ownerName || 'Unknown Owner';
      const runnerUpName = runnerUp ? (TEAMS_BY_ID[runnerUp.teamId]?.name || runnerUp.teamId) : 'Runner Up';

      const speech = await generateTournamentChampionSpeech(
        champion,
        winnerName,
        ownerName,
        runnerUpName
      );

      const winEvent: AuctionEvent = {
        id: `ev-${Date.now()}-champ`,
        roomId,
        timestamp: Date.now(),
        type: 'ANALYSIS_COMPLETED',
        message: speech,
        teamId: champion.teamId,
      };
      room.events.unshift(winEvent);
    }

    room.updatedAt = Date.now();
    this.broadcast(roomId);
  }

  private createInitialPublicRoom() {
    // Pre-populate an active demo room so users can immediately join, inspect squads, or test
    const demoRoom = this.createRoom('Jeevan (Admin)', 'host-demo-01', {
      auctionMode: 'MEGA',
      isPublic: true,
    }, 'RCB');

    // Add a couple of simulated draft squads to make it realistic immediately
    const rcbSquad = demoRoom.squads['RCB'];
    if (rcbSquad) {
      const p1 = PLAYERS_DATABASE.find((p) => p.id === 'p-01'); // Kohli
      const p2 = PLAYERS_DATABASE.find((p) => p.id === 'p-26'); // Hazlewood
      const p3 = PLAYERS_DATABASE.find((p) => p.id === 'p-43'); // Livingstone
      if (p1) {
        rcbSquad.players.push({ player: p1, purchasePriceLakhs: 2100, boughtAt: Date.now() - 300000 });
        rcbSquad.currentPurseLakhs -= 2100;
        rcbSquad.spentPurseLakhs += 2100;
        p1.status = 'SOLD';
        demoRoom.auction.soldPlayerIds.push(p1.id);
      }
      if (p2) {
        rcbSquad.players.push({ player: p2, purchasePriceLakhs: 1250, boughtAt: Date.now() - 200000 });
        rcbSquad.currentPurseLakhs -= 1250;
        rcbSquad.spentPurseLakhs += 1250;
        p2.status = 'SOLD';
        demoRoom.auction.soldPlayerIds.push(p2.id);
      }
      if (p3) {
        rcbSquad.players.push({ player: p3, purchasePriceLakhs: 850, boughtAt: Date.now() - 100000 });
        rcbSquad.currentPurseLakhs -= 850;
        rcbSquad.spentPurseLakhs += 850;
        p3.status = 'SOLD';
        demoRoom.auction.soldPlayerIds.push(p3.id);
      }
    }

    // Add another team CSK
    this.joinRoom(demoRoom.id, 'player-demo-csk', 'Rahul Dravid', 'CSK');
    const cskSquad = demoRoom.squads['CSK'];
    if (cskSquad) {
      const pJadeja = PLAYERS_DATABASE.find((p) => p.id === 'p-13'); // Jadeja
      const pGaikwad = PLAYERS_DATABASE.find((p) => p.id === 'p-40'); // Gaikwad
      if (pJadeja) {
        cskSquad.players.push({ player: pJadeja, purchasePriceLakhs: 1800, boughtAt: Date.now() - 250000 });
        cskSquad.currentPurseLakhs -= 1800;
        cskSquad.spentPurseLakhs += 1800;
        pJadeja.status = 'SOLD';
        demoRoom.auction.soldPlayerIds.push(pJadeja.id);
      }
      if (pGaikwad) {
        cskSquad.players.push({ player: pGaikwad, purchasePriceLakhs: 1400, boughtAt: Date.now() - 150000 });
        cskSquad.currentPurseLakhs -= 1400;
        cskSquad.spentPurseLakhs += 1400;
        pGaikwad.status = 'SOLD';
        demoRoom.auction.soldPlayerIds.push(pGaikwad.id);
      }
    }
  }
}

export const auctionManager = new AuctionManager();
