import React, { useState, useEffect } from 'react';
import { Users, Gavel, ArrowRight, RefreshCw, Shield, Plus } from 'lucide-react';

interface PublicRoomItem {
  id: string;
  name: string;
  hostName: string;
  teamsCount: number;
  maxTeams: number;
  status: string;
  mode: string;
  purseCr: number;
}

interface BrowseRoomsViewProps {
  onJoinRoom: (roomCode: string) => void;
  onCreateRoom: () => void;
}

export const BrowseRoomsView: React.FC<BrowseRoomsViewProps> = ({
  onJoinRoom,
  onCreateRoom,
}) => {
  const [rooms, setRooms] = useState<PublicRoomItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('ALL');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.rooms) {
        setRooms(data.rooms);
      }
    } catch (e) {
      console.error('Failed to load rooms', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filtered = rooms.filter((r) => {
    if (filter === 'ALL') return true;
    if (filter === 'WAITING') return r.status === 'WAITING';
    if (filter === 'LIVE') return r.status === 'AUCTION_RUNNING';
    if (filter === 'DONE') return r.status === 'COMPLETED' || r.status === 'PLAYING_XI_SELECTION';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Active Auction Arenas</h1>
          <p className="text-slate-400 text-sm mt-1">Browse live and upcoming auctions hosted by other owners.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRooms}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onCreateRoom}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Room</span>
          </button>
        </div>
      </div>

      {/* Segmented Filter Control */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-xl w-fit mb-8">
        {[
          { id: 'ALL', label: 'All Rooms' },
          { id: 'WAITING', label: 'Waiting Lobby' },
          { id: 'LIVE', label: 'Live Bidding' },
          { id: 'DONE', label: 'Playing XI / Results' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              filter === tab.id
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Room Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse">
              <div className="h-6 bg-slate-800 rounded w-1/3 mb-4" />
              <div className="h-4 bg-slate-800 rounded w-2/3 mb-6" />
              <div className="h-10 bg-slate-800 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <Gavel className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Live Rooms Found</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            There are currently no public rooms matching your filter. Be the first to create one!
          </p>
          <button
            onClick={onCreateRoom}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all"
          >
            Create An Auction Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((room) => {
            const isLive = room.status === 'AUCTION_RUNNING';
            const isWaiting = room.status === 'WAITING';

            return (
              <div
                key={room.id}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-800 text-amber-400 tracking-wider">
                      {room.id}
                    </span>

                    <span
                      className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                        isLive
                          ? 'text-emerald-400'
                          : isWaiting
                          ? 'text-amber-400'
                          : 'text-blue-400'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isLive
                            ? 'bg-emerald-400 animate-pulse'
                            : isWaiting
                            ? 'bg-amber-400'
                            : 'bg-blue-400'
                        }`}
                      />
                      {room.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{room.name}</h3>
                  <p className="text-xs text-slate-400 mb-4">Host: {room.hostName}</p>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 text-center mb-6">
                    <div>
                      <p className="text-xs text-slate-400">Teams</p>
                      <p className="text-sm font-bold text-white font-mono mt-0.5">
                        {room.teamsCount} / {room.maxTeams}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Purse</p>
                      <p className="text-sm font-bold text-white font-mono mt-0.5">₹{room.purseCr} Cr</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Mode</p>
                      <p className="text-sm font-bold text-amber-400 font-mono mt-0.5">{room.mode}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onJoinRoom(room.id)}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-semibold text-xs tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <span>Enter Auction Room</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
