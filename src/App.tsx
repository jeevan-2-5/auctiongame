import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CreateRoomModal } from './components/CreateRoomModal';
import { JoinRoomModal } from './components/JoinRoomModal';
import { BrowseRoomsView } from './components/BrowseRoomsView';
import { PlayerDatabaseView } from './components/PlayerDatabaseView';
import { RulesModal } from './components/RulesModal';
import { WaitingLobby } from './components/WaitingLobby';
import { PlayerCard } from './components/PlayerCard';
import { BidDesk } from './components/BidDesk';
import { Leaderboard } from './components/Leaderboard';
import { ActivityFeed } from './components/ActivityFeed';
import { SquadModal } from './components/SquadModal';
import { HostControlsBar } from './components/HostControlsBar';
import { PlayingXIBuilder } from './components/PlayingXIBuilder';
import { AnalysisView } from './components/AnalysisView';
import { useAuctionSocket } from './hooks/useAuctionSocket';
import { getPlayerSession, savePlayerName, saveLastRoom, getLastRoom } from './utils/session';
import { Room, RoomSettings, Squad, Player, RoomPlayer, AuctionState } from './types/auction';
import { PLAYERS_DATABASE } from './data/players';
import { TEAMS_BY_ID } from './data/teams';
import { setServerAppUrl } from './utils/shareUrl';

function createLocalRoom(
  hostName: string,
  hostSessionId: string,
  selectedTeamId: string,
  settingsPartial?: Partial<RoomSettings>,
  customRoomId?: string
): Room {
  let id = customRoomId ? customRoomId.toUpperCase().trim() : '';
  if (!id) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  const settings: RoomSettings = {
    startingPurseLakhs: 12000,
    maxSquadSize: 15,
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

  let pool: Player[] = [...PLAYERS_DATABASE];
  if (settings.auctionMode === 'QUICK') {
    pool = pool.slice(0, 25);
  }

  const hostPlayer: RoomPlayer = {
    id: hostSessionId,
    name: hostName || 'Host Owner',
    teamId: selectedTeamId || 'RCB',
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

  return {
    id,
    name: `${hostPlayer.name}'s Mega Auction`,
    hostId: hostSessionId,
    settings,
    players: { [hostSessionId]: hostPlayer },
    squads: initialSquads,
    playingXIs: {},
    analyses: {},
    auction: auctionState,
    events: [
      {
        id: `ev-${Date.now()}-1`,
        roomId: id,
        timestamp: Date.now(),
        type: 'ROOM_CREATED',
        message: `Room created by ${hostPlayer.name} with ₹${(settings.startingPurseLakhs / 100).toFixed(0)} Cr starting purse.`,
      },
    ],
    playerPool: pool,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export default function App() {
  const [session, setSession] = useState<{ sessionId: string; name: string }>(getPlayerSession());
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<string>('home'); // 'home' | 'browse' | 'players' | 'rules' | 'room'

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [viewingSquad, setViewingSquad] = useState<Squad | null>(null);
  const [joinModalCode, setJoinModalCode] = useState<string>('');

  // Socket connection to active room
  const {
    room,
    setRoomDirectly,
    isConnected,
    errorMsg,
    placeBid,
    selectTeam,
    startAuction,
    pauseAuction,
    resumeAuction,
    skipPlayer,
    endAuction,
    submitPlayingXI,
    triggerAnalysis,
    returnToPlayingXI,
  } = useAuctionSocket({
    roomId: activeRoomId,
    sessionId: session.sessionId,
    playerName: session.name,
  });

  // Fetch server public URL config & check URL query parameters for ?room=CODE
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.publicUrl) {
          setServerAppUrl(data.publicUrl);
        }
      })
      .catch((e) => console.warn('Could not fetch /api/config', e));

    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const code = roomParam.toUpperCase().trim();
      setActiveRoomId(code);
      setJoinModalCode(code);
      setCurrentView('room');

      // Fetch host's room immediately from server
      fetch(`/api/rooms/${code}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.room) {
            setRoomDirectly(data.room);
          }
        })
        .catch(() => {});
    }
  }, []);

  // When room state loads, if player is new to room and has no team, prompt them to join!
  useEffect(() => {
    if (room && activeRoomId) {
      const myPlayer = room.players[session.sessionId];
      if (!myPlayer || (!myPlayer.teamId && !myPlayer.isSpectator)) {
        // Prompt join modal pre-filled so friend picks their franchise
        setJoinModalCode(room.id);
        setIsJoinModalOpen(true);
      }
    }
  }, [room?.id, activeRoomId]);

  const handleCreateRoomSubmit = async (
    hostName: string,
    selectedTeamId: string,
    settings: Partial<RoomSettings>
  ) => {
    savePlayerName(hostName);
    setSession((prev) => ({ ...prev, name: hostName }));

    let createdRoom: Room | null = null;

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName,
          hostSessionId: session.sessionId,
          selectedTeamId,
          settings,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.room) {
          createdRoom = data.room;
        }
      }
    } catch (e) {
      console.warn('Backend /api/rooms failed, using instant client room fallback:', e);
    }

    // Reliable fallback so creation NEVER fails even on static hosting or offline network
    if (!createdRoom) {
      createdRoom = createLocalRoom(hostName, session.sessionId, selectedTeamId, settings);
    }

    setRoomDirectly(createdRoom);
    setActiveRoomId(createdRoom.id);
    saveLastRoom(createdRoom.id);
    setIsCreateModalOpen(false);
    setCurrentView('room');

    try {
      const newUrl = `${window.location.pathname}?room=${createdRoom.id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    } catch (e) {}
  };

  const handleJoinRoomSubmit = async (
    roomCode: string,
    playerName: string,
    teamId?: string,
    isSpectator?: boolean
  ) => {
    savePlayerName(playerName);
    setSession((prev) => ({ ...prev, name: playerName }));

    try {
      const res = await fetch(`/api/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerSessionId: session.sessionId,
          playerName,
          teamId,
          isSpectator,
        }),
      });
      const data = await res.json();
      if (data.room) {
        setRoomDirectly(data.room);
        setActiveRoomId(data.room.id);
        saveLastRoom(data.room.id);
        setIsJoinModalOpen(false);
        setCurrentView('room');
        const newUrl = `${window.location.pathname}?room=${data.room.id}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      console.error('Failed to join room', e);
      // Fallback: still navigate to room so socket can attempt connecting
      setActiveRoomId(roomCode);
      setIsJoinModalOpen(false);
      setCurrentView('room');
    }
  };

  const handleNavigate = (view: string) => {
    if (view === 'rules') {
      setIsRulesModalOpen(true);
      return;
    }
    if (view === 'home') {
      setActiveRoomId(null);
      window.history.pushState({}, '', window.location.pathname);
    }
    setCurrentView(view);
  };

  const currentPlayer = room?.players[session.sessionId];
  const userTeamId = currentPlayer?.teamId;
  const userSquad = userTeamId && room ? room.squads[userTeamId] : undefined;
  const isHost = room?.hostId === session.sessionId;

  // Find currently active player on block
  const currentPlayerOnBlock =
    room && room.auction.currentPlayerId
      ? room.playerPool.find((p) => p.id === room.auction.currentPlayerId) || null
      : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Bar Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        roomCode={activeRoomId}
        teamId={userTeamId}
        playerName={currentPlayer?.name || session.name}
        isHost={isHost}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Floating Error Toast */}
        {errorMsg && (
          <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-rose-600 text-white font-semibold text-xs shadow-2xl animate-bounce flex items-center gap-2 max-w-sm">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* View 1: Home / Lobby */}
        {currentView === 'home' && !activeRoomId && (
          <HeroSection
            onCreateRoom={() => setIsCreateModalOpen(true)}
            onJoinRoom={() => {
              setJoinModalCode('');
              setIsJoinModalOpen(true);
            }}
            onBrowseRooms={() => setCurrentView('browse')}
            onExplorePlayers={() => setCurrentView('players')}
          />
        )}

        {/* View 2: Browse Public Rooms */}
        {currentView === 'browse' && (
          <BrowseRoomsView
            onJoinRoom={(code) => {
              setJoinModalCode(code);
              setIsJoinModalOpen(true);
            }}
            onCreateRoom={() => setIsCreateModalOpen(true)}
          />
        )}

        {/* View 3: Player Database Explorer */}
        {currentView === 'players' && (
          <PlayerDatabaseView onBack={() => setCurrentView('home')} />
        )}

        {/* View 4: Active Room View */}
        {currentView === 'room' && !room && (
          <div className="max-w-md mx-auto my-24 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 animate-spin text-2xl">
              🏏
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Connecting to Arena {activeRoomId || ''}...</h3>
            <p className="text-xs text-slate-400 mb-6">Setting up auction floor and syncing squad rosters.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (activeRoomId) {
                    fetch(`/api/rooms/${activeRoomId}`)
                      .then((res) => res.json())
                      .then((data) => {
                        if (data?.room) setRoomDirectly(data.room);
                      })
                      .catch(() => {});
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-colors"
              >
                Retry Connect
              </button>
              <button
                onClick={() => {
                  setActiveRoomId(null);
                  setCurrentView('home');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Return to Lobby
              </button>
            </div>
          </div>
        )}

        {currentView === 'room' && room && (
          <>
            {/* Stage A: Waiting in Lobby */}
            {room.auction.status === 'WAITING' && (
              <WaitingLobby
                room={room}
                currentSessionId={session.sessionId}
                onStartAuction={startAuction}
                onSelectTeam={(teamId) => selectTeam(teamId, session.name)}
              />
            )}

            {/* Stage B: Live Auction Floor */}
            {(room.auction.status === 'AUCTION_RUNNING' ||
              room.auction.status === 'AUCTION_PAUSED') && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Responsive 3-Column Desktop Grid / Stack Mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                  {/* Left Column: Player Card (4 Cols) */}
                  <div className="lg:col-span-4">
                    <PlayerCard
                      player={currentPlayerOnBlock}
                      currentBidLakhs={room.auction.currentBidLakhs}
                    />
                  </div>

                  {/* Center Column: Live Bidding Desk (5 Cols) */}
                  <div className="lg:col-span-5">
                    <BidDesk
                      currentBidLakhs={room.auction.currentBidLakhs}
                      highestBidderTeamId={room.auction.highestBidderTeamId}
                      timerSeconds={room.auction.timerSeconds}
                      isTimerRunning={room.auction.isTimerRunning}
                      userSquad={userSquad}
                      userTeamId={userTeamId}
                      isSpectator={currentPlayer?.isSpectator}
                      onBid={placeBid}
                      onClaimTeam={() => {
                        setJoinModalCode(room.id);
                        setIsJoinModalOpen(true);
                      }}
                      onEndAuction={endAuction}
                      currentPlayer={currentPlayerOnBlock}
                    />
                  </div>

                  {/* Right Column: Live Leaderboard (3 Cols) */}
                  <div className="lg:col-span-3">
                    <Leaderboard
                      squads={room.squads}
                      highestBidderTeamId={room.auction.highestBidderTeamId}
                      onViewSquad={(teamId) => {
                        const sq = room.squads[teamId];
                        if (sq) setViewingSquad(sq);
                      }}
                      userTeamId={userTeamId}
                    />
                  </div>
                </div>

                {/* Bottom Row: Live Activity Feed */}
                <div className="mt-8">
                  <ActivityFeed events={room.events} />
                </div>

                {/* Host Control Toolbar (Floating at bottom for Host only) */}
                {isHost && (
                  <HostControlsBar
                    isPaused={room.auction.status === 'AUCTION_PAUSED'}
                    onPause={pauseAuction}
                    onResume={resumeAuction}
                    onSkip={skipPlayer}
                    onEndAuction={endAuction}
                  />
                )}
              </div>
            )}

            {/* Stage C: Playing XI Selection Studio */}
            {room.auction.status === 'PLAYING_XI_SELECTION' && (
              <PlayingXIBuilder
                room={room}
                currentSessionId={session.sessionId}
                onSubmitPlayingXI={submitPlayingXI}
                onTriggerAnalysis={triggerAnalysis}
              />
            )}

            {/* Stage D: Analysis & Championship Podium */}
            {(room.auction.status === 'ANALYSIS' || room.auction.status === 'COMPLETED') && (
              <AnalysisView
                room={room}
                currentSessionId={session.sessionId}
                onRestartLobby={() => handleNavigate('home')}
                onEditLineups={returnToPlayingXI}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateRoomSubmit}
        defaultHostName={session.name}
      />

      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSubmit={handleJoinRoomSubmit}
        defaultPlayerName={session.name}
        initialRoomCode={joinModalCode}
        takenTeams={room ? Object.keys(room.squads) : []}
      />

      <SquadModal
        isOpen={!!viewingSquad}
        onClose={() => setViewingSquad(null)}
        squad={viewingSquad}
      />

      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© Cricket Auction Arena · Real-time multiplayer franchise draft.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setIsRulesModalOpen(true)} className="hover:text-white transition-colors">
              Tournament Rules
            </button>
            <span>·</span>
            <button onClick={() => setCurrentView('players')} className="hover:text-white transition-colors">
              Player Pool
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
