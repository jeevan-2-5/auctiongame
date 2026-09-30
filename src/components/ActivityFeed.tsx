import React from 'react';
import { AuctionEvent } from '../types/auction';
import { Activity, Flame, Gavel, XCircle, UserPlus, CheckCircle2 } from 'lucide-react';

interface ActivityFeedProps {
  events: AuctionEvent[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ events }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'BID_PLACED':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case 'PLAYER_SOLD':
        return <Gavel className="w-3.5 h-3.5 text-emerald-400" />;
      case 'PLAYER_UNSOLD':
        return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
      case 'PLAYER_JOINED':
      case 'TEAM_SELECTED':
        return <UserPlus className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Live Arena Wire</span>
        </h4>
        <span className="text-[10px] text-slate-500 font-mono">Real-Time</span>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">No bids or events yet.</p>
        ) : (
          events.slice(0, 30).map((ev) => {
            const timeStr = new Date(ev.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={ev.id}
                className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs"
              >
                <div className="mt-0.5 shrink-0">{getEventIcon(ev.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 leading-snug break-words">{ev.message}</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">{timeStr}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
