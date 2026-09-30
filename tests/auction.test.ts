import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AuctionManager } from '../src/server/auctionManager';
import { calculateDeterministicTeamScore } from '../src/server/scoringEngine';
import { PLAYERS_DATABASE } from '../src/data/players';
import { Squad, PlayingXI, Player } from '../src/types/auction';

describe('Cricket Auction Arena Engine Tests', () => {
  it('should create room with authoritative default settings', () => {
    const manager = new AuctionManager();
    const room = manager.createRoom('Host Alice', 'sess-host-1', {
      startingPurseLakhs: 12000,
      maxSquadSize: 15,
    }, 'RCB');

    assert.strictEqual(room.players['sess-host-1'].name, 'Host Alice');
    assert.strictEqual(room.squads['RCB'].startingPurseLakhs, 12000);
    assert.strictEqual(room.squads['RCB'].currentPurseLakhs, 12000);
    assert.strictEqual(room.settings.maxSquadSize, 15);
  });

  it('should prevent another player from picking already taken team', () => {
    const manager = new AuctionManager();
    const room = manager.createRoom('Host Alice', 'sess-host-1', {}, 'RCB');

    // Attempt to join with RCB
    const joinResult = manager.joinRoom(room.id, 'sess-player-2', 'Bob', 'RCB');
    assert.strictEqual(joinResult.success, false);
    assert.match(joinResult.error || '', /already taken/i);
  });

  it('should calculate valid bid increments dynamically', () => {
    const manager = new AuctionManager();
    assert.strictEqual(manager.calculateNextValidBid(50), 55); // < 100L (+5L)
    assert.strictEqual(manager.calculateNextValidBid(200), 210); // 100-500L (+10L)
    assert.strictEqual(manager.calculateNextValidBid(600), 625); // > 500L (+25L)
  });

  it('should enforce STRICT 15-player squad limit on bids', () => {
    const manager = new AuctionManager();
    const room = manager.createRoom('Host Alice', 'sess-host-1', {}, 'RCB');
    const squad = room.squads['RCB'];

    // Start auction first
    manager.startAuction(room.id, 'sess-host-1');

    // Fill squad with 15 players
    for (let i = 0; i < 15; i++) {
      squad.players.push({
        player: PLAYERS_DATABASE[i],
        purchasePriceLakhs: 100,
        boughtAt: Date.now(),
      });
    }
    assert.strictEqual(squad.players.length, 15);

    // Attempt bid with 15 players already in squad
    const bidResult = manager.placeBid(room.id, 'sess-host-1', 500);
    assert.strictEqual(bidResult.success, false);
    assert.match(bidResult.error || '', /squad is full/i);

    manager.pauseAuction(room.id, 'sess-host-1');
  });

  it('should calculate deterministic score consistently for the same squad', () => {
    const sampleSquad: Squad = {
      teamId: 'RCB',
      ownerId: 'sess-1',
      ownerName: 'Alice',
      startingPurseLakhs: 12000,
      currentPurseLakhs: 2000,
      spentPurseLakhs: 10000,
      players: PLAYERS_DATABASE.slice(0, 15).map((p) => ({
        player: p,
        purchasePriceLakhs: 500,
        boughtAt: Date.now(),
      })),
    };

    const playerMap = PLAYERS_DATABASE.reduce<Record<string, Player>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    const playingXI: PlayingXI = {
      teamId: 'RCB',
      playerIds: PLAYERS_DATABASE.slice(0, 11).map((p) => p.id),
      battingOrder: PLAYERS_DATABASE.slice(0, 11).map((p) => p.id),
      captainId: PLAYERS_DATABASE[0].id,
      viceCaptainId: PLAYERS_DATABASE[1].id,
      submittedAt: Date.now(),
    };

    const score1 = calculateDeterministicTeamScore(sampleSquad, playingXI, playerMap);
    const score2 = calculateDeterministicTeamScore(sampleSquad, playingXI, playerMap);

    assert.strictEqual(score1.teamScore, score2.teamScore);
    assert.strictEqual(score1.battingScore, score2.battingScore);
    assert.strictEqual(score1.bowlingScore, score2.bowlingScore);
    assert.ok(score1.teamScore >= 50 && score1.teamScore <= 100);
  });
});
