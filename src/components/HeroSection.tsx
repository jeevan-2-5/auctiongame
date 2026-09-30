import React from 'react';
import { Gavel, Users, Sparkles, Trophy, ArrowRight, ShieldCheck, Zap, BarChart3 } from 'lucide-react';

interface HeroSectionProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onBrowseRooms: () => void;
  onExplorePlayers: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onCreateRoom,
  onJoinRoom,
  onBrowseRooms,
  onExplorePlayers,
}) => {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Banner with Stadium Image */}
      <div className="relative min-h-[580px] sm:min-h-[640px] flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/hero_cricket_stadium_1790682643200.jpg"
            alt="Cricket Stadium floodlit night arena"
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          {/* Measured Dark Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
          <div className="absolute inset-0 bg-radial from-transparent via-slate-950/50 to-slate-950" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Live Multiplayer Cricket Draft & Auction
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 text-balance">
            Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Dream XI</span>.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-300 mb-10 leading-relaxed font-normal">
            Create a live auction room, draft authentic cricket stars against your friends, build a 15-player squad, and let our deterministic AI engine crown the champion.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onCreateRoom}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <Gavel className="w-5 h-5" />
              <span>Create Auction Room</span>
            </button>

            <button
              onClick={onJoinRoom}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-base border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5 text-amber-400" />
              <span>Join with Room Code</span>
            </button>

            <button
              onClick={onBrowseRooms}
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-transparent hover:bg-slate-900/50 text-slate-300 hover:text-white font-medium text-base border border-slate-800 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Browse Public Rooms</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white font-mono">15 Players</p>
              <p className="text-xs text-slate-400 mt-1">Strict Squad Limit Per Team</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white font-mono">₹120 Cr</p>
              <p className="text-xs text-slate-400 mt-1">Configurable Starting Purse</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white font-mono">Real-Time</p>
              <p className="text-xs text-slate-400 mt-1">WebSockets & Server Timer</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white font-mono">AI Analysis</p>
              <p className="text-xs text-slate-400 mt-1">Deterministic Model + Gemini</p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Features Grid */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white tracking-tight mb-4">
            Engineered for Authentic Cricket Thrills
          </h2>
          <p className="text-slate-400 text-base">
            Every bid, squad limit, and countdown is validated authoritatively on the server to prevent cheating and simulate high-stakes franchise auctions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Live Bidding Battles</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Instantaneous real-time bidding with dynamic increments (+5L, +10L, +25L). The authoritative countdown timer resets when counter-bids fly in.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">15-Player Squad Cap</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every team is capped at exactly 15 players. Once your 15 slots are filled, the bid button disables immediately, forcing strategic budget planning.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI & Tactical Analysis</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              After selecting your Playing XI, our 10-point weighted cricket engine and Gemini AI evaluate powerplay strength, death overs, bench depth, and declare the champion.
            </p>
          </div>
        </div>
      </section>

      {/* How To Play Section */}
      <section className="py-16 px-4 sm:px-6 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Step-by-Step</span>
            <h2 className="text-3xl font-bold text-white tracking-tight mt-1">How The Arena Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-3xl font-extrabold text-amber-500 font-mono">01</span>
              <h4 className="text-lg font-bold text-white mt-3 mb-2">Create or Join</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Host sets purse and timer, picks a franchise (RCB, CSK, MI, KKR etc.). Friends join remotely via 6-character room code.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-3xl font-extrabold text-amber-500 font-mono">02</span>
              <h4 className="text-lg font-bold text-white mt-3 mb-2">Live Hammer Auction</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Players enter one by one. Bid in real time within the timer. Win players, manage your remaining purse, and build up to 15 players.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-3xl font-extrabold text-amber-500 font-mono">03</span>
              <h4 className="text-lg font-bold text-white mt-3 mb-2">Pick Playing XI</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Draft exactly 11 players from your squad. Set batting order 1-11, nominate Captain [C] and Vice Captain [VC]. Max 4 overseas players.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-3xl font-extrabold text-amber-500 font-mono">04</span>
              <h4 className="text-lg font-bold text-white mt-3 mb-2">AI Crowns Champion</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Our mathematical model grades batting, bowling, powerplay, and death overs. Gemini AI produces scouting reports and crowns the winner.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
