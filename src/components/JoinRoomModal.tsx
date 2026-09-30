import React, { useState } from 'react';
import { X, Users, AlertCircle, Eye } from 'lucide-react';
import { FRANCHISE_TEAMS } from '../data/teams';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roomCode: string, playerName: string, teamId?: string, isSpectator?: boolean) => void;
  defaultPlayerName: string;
  initialRoomCode?: string;
  takenTeams?: string[];
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultPlayerName,
  initialRoomCode = '',
  takenTeams = [],
}) => {
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isSpectator, setIsSpectator] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode.toUpperCase().trim());
    }
  }, [initialRoomCode]);

  React.useEffect(() => {
    if (defaultPlayerName && !playerName) {
      setPlayerName(defaultPlayerName);
    }
  }, [defaultPlayerName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError('Please enter the 6-character room code.');
      return;
    }
    if (!playerName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!isSpectator && !selectedTeamId) {
      setError('Please select an available team or switch to Spectate mode.');
      return;
    }

    onSubmit(
      roomCode.trim().toUpperCase(),
      playerName.trim(),
      isSpectator ? undefined : selectedTeamId,
      isSpectator
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Join Auction Arena</h2>
            <p className="text-xs text-slate-400">Enter room code and draft your franchise squad.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Room Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              6-Character Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="e.g. A7K92P"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono text-center text-xl font-bold tracking-widest uppercase focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Your Name / Owner Alias
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Rahul, Arjun, KohliFan"
              maxLength={24}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-400"
              required
            />
          </div>

          {/* Mode Switch: Team vs Spectator */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-white">Join as Spectator</p>
                <p className="text-[10px] text-slate-400">Watch the bidding without owning a franchise</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSpectator(!isSpectator)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                isSpectator ? 'bg-blue-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  isSpectator ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Franchise Picker (disabled if spectator) */}
          {!isSpectator && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Pick An Available Franchise
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                {FRANCHISE_TEAMS.map((team) => {
                  const isTaken = takenTeams.includes(team.id);
                  const isSelected = selectedTeamId === team.id;
                  return (
                    <button
                      key={team.id}
                      type="button"
                      disabled={isTaken}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isTaken
                          ? 'border-slate-800/40 bg-slate-950/30 opacity-40 cursor-not-allowed'
                          : isSelected
                          ? 'border-blue-400 bg-blue-500/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: team.primaryColor }}
                        />
                        {isTaken && <span className="text-[9px] text-red-400 font-medium">Taken</span>}
                      </div>
                      <p className="font-bold text-xs text-white font-mono">{team.shortName}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <span>Enter Arena</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
