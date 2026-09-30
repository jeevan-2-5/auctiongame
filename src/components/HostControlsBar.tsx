import React, { useState } from 'react';
import { Pause, Play, SkipForward, CheckSquare, Shield, AlertCircle, X } from 'lucide-react';

interface HostControlsBarProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onEndAuction: () => void;
}

export const HostControlsBar: React.FC<HostControlsBarProps> = ({
  isPaused,
  onPause,
  onResume,
  onSkip,
  onEndAuction,
}) => {
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3">
      <div className="flex items-center gap-2 pr-3 border-r border-slate-800 text-xs text-amber-400 font-bold">
        <Shield className="w-4 h-4" />
        <span className="hidden sm:inline">Host Console</span>
      </div>

      {isPaused ? (
        <button
          onClick={onResume}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5 fill-slate-950" />
          <span>Resume</span>
        </button>
      ) : (
        <button
          onClick={onPause}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
        >
          <Pause className="w-3.5 h-3.5" />
          <span>Pause</span>
        </button>
      )}

      <button
        onClick={onSkip}
        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
      >
        <SkipForward className="w-3.5 h-3.5" />
        <span>Skip Player</span>
      </button>

      {showConfirmEnd ? (
        <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-600/80 rounded-xl px-2 py-1">
          <span className="text-[11px] font-bold text-rose-300 hidden sm:inline">End & select Playing XI?</span>
          <button
            onClick={() => {
              setShowConfirmEnd(false);
              onEndAuction();
            }}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all shadow-md flex items-center gap-1"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Yes, End Auction</span>
          </button>
          <button
            onClick={() => setShowConfirmEnd(false)}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirmEnd(true)}
          className="px-3.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-rose-900/30"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>End Auction & Pick XI</span>
        </button>
      )}
    </div>
  );
};
