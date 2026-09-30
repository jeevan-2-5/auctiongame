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
import { RoomSettings, Squad } from './types/auction';
import { setServerAppUrl } from './utils/shareUrl';

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
      const code = roomParam.toUpperCase();
      setActiveRoomId(code);
      setJoinModalCode(code);
      setCurrentView('room');
    }
  }, []);

  // When room state loads, if player is new to room and has no team, prompt them to join!
  useEffect(() => {
    if (room && activeRoomId) {
      const myPlayer = room.players[session.sessionId];
      if (!myPlayer || (!myPlayer.teamId && !myPlayer.isSpectator)) {
        // If not already set, prompt join modal pre-filled
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
      const data = await res.json();
      if (data.room) {
        setActiveRoomId(data.room.id);
        saveLastRoom(data.room.id);
        setIsCreateModalOpen(false);
        setCurrentView('room');
        // Update URL without reload
        const newUrl = `${window.location.pathname}?room=${data.room.id}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      }
    } catch (e) {
      console.error('Failed to create room', e);
    }
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
        setActiveRoomId(data.room.id);
        saveLastRoom(data.room.id);
        setIsJoinModalOpen(false);
        setCurrentView('room');
        const newUrl = `${window.location.pathname}?room=${data.room.id}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      }
    } catch (e) {
      console.error('Failed to join room', e);
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
