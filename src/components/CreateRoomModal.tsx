import React, { useState } from 'react';
import { X, Gavel, Sparkles, Check, AlertCircle } from 'lucide-react';
import { FRANCHISE_TEAMS } from '../data/teams';
import { RoomSettings } from '../types/auction';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (hostName: string, selectedTeamId: string, settings: Partial<RoomSettings>) => Promise<void> | void;
  defaultHostName: string;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultHostName,
}) => {
  const [hostName, setHostName] = useState(defaultHostName || '');
  const [selectedTeamId, setSelectedTeamId] = useState('RCB');
  const [startingPurseCr, setStartingPurseCr] = useState(120);
  const [timerSeconds, setTimerSeconds] = useState(10);
  const [bidResetSeconds, setBidResetSeconds] = useState(5);
  const [auctionMode, setAuctionMode] = useState<'MEGA' | 'QUICK' | 'FULL'>('MEGA');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!selectedTeamId) {
      setError('Please select a franchise.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit(hostName.trim(), selectedTeamId, {
        startingPurseLakhs: startingPurseCr * 100,
        maxSquadSize: 15, // STRICT 15
        timerDurationSeconds: timerSeconds,
        bidResetDurationSeconds: bidResetSeconds,
        auctionMode,
        isPublic,
        maxOverseasInSquad: 8,
        maxOverseasInPlayingXI: 4,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create arena. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Gavel className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Create Auction Room</h2>
            <p className="text-xs text-slate-400">Configure rules, choose your franchise, and invite friends.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Host Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Your Name / Owner Alias
            </label>
            <input
              type="text"
              value={hostName}
              onChange={(e) => {
                setHostName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Jeevan, Rahul, Auction Boss"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
              maxLength={24}
              required
            />
          </div>

          {/* Franchise Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Your Franchise
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {FRANCHISE_TEAMS.map((team) => {
                const isSelected = selectedTeamId === team.id;
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 shadow-md shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: team.primaryColor }}
                      />
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <p className="font-bold text-sm text-white font-mono">{team.shortName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{team.city}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auction Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Auction Mode
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'MEGA', label: 'Mega Auction', desc: 'Equal start, 50+ player pool' },
                { id: 'QUICK', label: 'Quick Auction', desc: 'Fast-paced, 25 marquee stars' },
                { id: 'FULL', label: 'Full Auction', desc: 'Complete tournament pool' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAuctionMode(m.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    auctionMode === m.id
                      ? 'border-amber-400 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-semibold text-xs text-white">{m.label}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Configurable Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Starting Purse
              </label>
              <select
                value={startingPurseCr}
                onChange={(e) => setStartingPurseCr(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              >
                <option value={100}>₹100 Cr</option>
                <option value={120}>₹120 Cr (Standard)</option>
                <option value={150}>₹150 Cr (Deep Purse)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Countdown Timer
              </label>
              <select
                value={timerSeconds}
                onChange={(e) => setTimerSeconds(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              >
                <option value={8}>8 Seconds (Speed)</option>
                <option value={10}>10 Seconds (Standard)</option>
                <option value={15}>15 Seconds</option>
                <option value={20}>20 Seconds (Casual)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Squad Cap (Rule)
              </label>
              <div className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 text-xs font-mono font-bold flex items-center justify-between">
                <span>15 Players</span>
                <span className="text-[10px] text-slate-400">Strict Max</span>
              </div>
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div>
              <p className="text-xs font-semibold text-white">Public Room</p>
              <p className="text-[11px] text-slate-400">Allow players to find and join from the browse list</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                isPublic ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  isPublic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Submit CTA */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Creating Arena...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Arena</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
