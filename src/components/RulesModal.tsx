import React from 'react';
import { X, ShieldCheck, Scale, Award, Users, AlertTriangle } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Cricket Auction Arena Regulations</h2>
            <p className="text-xs text-slate-400">Official tournament constitution and mechanics.</p>
          </div>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Section 1: Squad Limits */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <h3 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
              <span className="text-amber-400">1.</span>
              <span>The 15-Player Squad Maximum Rule</span>
            </h3>
            <p className="mb-2">
              Unlike traditional IPL auctions with up to 25 players, <strong>Cricket Auction Arena enforces a strict maximum of 15 players per franchise</strong>.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Once your franchise purchases 15 players, your bidding button is permanently disabled.</li>
              <li>Malicious client bids are rejected authoritatively by the backend server.</li>
              <li>You must budget carefully so that your purse covers all required player roles.</li>
            </ul>
          </div>

          {/* Section 2: Playing XI Selection */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <h3 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
              <span className="text-amber-400">2.</span>
              <span>Playing XI & Batting Order</span>
            </h3>
            <p className="mb-2">
              Following the hammer auction, all franchises transition to the <strong>Playing XI Studio</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>You must select <strong>exactly 11 players</strong> from your 15-player squad (the other 4 become reserves/bench).</li>
              <li>Arrange the batting order from #1 (Opening Batter) to #11 (Tail-ender).</li>
              <li>Nominate one <strong>Captain [C]</strong> and one <strong>Vice Captain [VC]</strong>.</li>
              <li>A maximum of <strong>4 overseas players</strong> may be selected in the Playing XI.</li>
            </ul>
          </div>

          {/* Section 3: Bidding & Increments */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <h3 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
              <span className="text-amber-400">3.</span>
              <span>Bidding & Authoritative Timer</span>
            </h3>
            <p className="mb-2">
              The server controls an authoritative countdown timer (default 10s). When any valid counter-bid is placed, the timer automatically resets to 5s.
            </p>
            <div className="grid grid-cols-3 gap-2 font-mono text-center pt-2">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500">Below ₹1 Cr</span>
                <p className="font-bold text-white mt-0.5">+₹5 Lakh</p>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500">₹1 Cr - ₹5 Cr</span>
                <p className="font-bold text-white mt-0.5">+₹10 Lakh</p>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500">Above ₹5 Cr</span>
                <p className="font-bold text-white mt-0.5">+₹25 Lakh</p>
              </div>
            </div>
          </div>

          {/* Section 4: AI & Deterministic Scoring Engine */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <h3 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
              <span className="text-amber-400">4.</span>
              <span>AI Evaluation & Tournament Champions</span>
            </h3>
            <p className="mb-2">
              The winner is determined by a <strong>100% deterministic mathematical model</strong> using actual player ratings:
            </p>
            <p className="text-slate-400">
              Batting (25%) + Bowling (25%) + All-Round Balance (15%) + Role Composition (10%) + Powerplay (5%) + Middle Overs (5%) + Death Overs (5%) + Fielding (5%) + Bench Strength (5%).
            </p>
            <p className="text-slate-400 mt-2">
              Gemini AI generates detailed scouting reports and tournament commentary explaining the results.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
          >
            I Understand the Rules
          </button>
        </div>
      </div>
    </div>
  );
};
