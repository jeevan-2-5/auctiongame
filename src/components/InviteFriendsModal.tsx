import React, { useState } from 'react';
import { X, Copy, Check, Share2, Globe, AlertTriangle, ExternalLink, Server, Sparkles } from 'lucide-react';
import { getShareableRoomLink, getDirectRoomLink, isAiStudioDevHost, isAiStudioHost } from '../utils/shareUrl';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  roomName: string;
}

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  roomName,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDirectLink, setCopiedDirectLink] = useState(false);

  if (!isOpen) return null;

  const publicLink = getShareableRoomLink(roomCode);
  const directLink = getDirectRoomLink(roomCode);
  const isDev = isAiStudioDevHost();
  const isAiStudio = isAiStudioHost();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Join ${roomName} · Cricket Auction Arena`,
          text: `Join our live IPL cricket auction room! Enter Room Code: ${roomCode}`,
          url: publicLink,
        });
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        return;
      }
    } catch (e) {
      // Fallback
    }

    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyDirectLink = () => {
    navigator.clipboard.writeText(directLink);
    setCopiedDirectLink(true);
    setTimeout(() => setCopiedDirectLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
            🏏
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Invite Friends to Auction</h2>
            <p className="text-xs text-slate-400">Share your live auction room with friends and co-hosts.</p>
          </div>
        </div>

        {/* 1. ROOM CODE SECTION (Guaranteed to work on any device) */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Method 1: Direct Room Code (Easiest & Most Reliable)
            </span>
            <span className="text-[10px] text-slate-400">Works everywhere</span>
          </div>

          <div className="flex items-center justify-between gap-4 mt-3">
            <div>
              <p className="text-3xl font-mono font-black text-white tracking-widest">{roomCode}</p>
              <p className="text-xs text-slate-400 mt-1">
                Tell friends to open this website and click <span className="text-amber-400 font-semibold">"Join Room"</span> with this code.
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20 shrink-0"
            >
              {copiedCode ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* 2. DIRECT PUBLIC LINK SECTION */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              Method 2: One-Click Join Link
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 break-all select-all">
            {publicLink}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleCopyLink}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Public Invite Link'}</span>
            </button>

            {isDev && (
              <button
                onClick={handleCopyDirectLink}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors flex items-center gap-1.5"
                title="Copies current dev URL"
              >
                {copiedDirectLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Dev Link</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. AI STUDIO / HOSTING EXPLANATION BOX */}
        {isDev && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 mb-6">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-bold text-white text-xs">
                  Why does a friend see "403 Forbidden" or "404 Not Found"?
                </p>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  • <strong className="text-amber-300">403 Forbidden:</strong> happens if someone clicks the private development link without being signed into your Google account.
                </p>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  • <strong className="text-amber-300">404 Not Found:</strong> happens if you haven't clicked the <span className="bg-amber-400/20 px-1.5 py-0.5 rounded text-amber-300 font-semibold">Share</span> button at the top-right of Google AI Studio yet. Once you click Share, AI Studio creates the live public link!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. HOSTING ADVICE */}
        <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/40 flex items-start gap-3">
          <Server className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-white">Want to host this on your own website?</p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Yes, hosting gives you a permanent URL (e.g. on <strong>Render</strong>, <strong>Railway</strong>, or <strong>Vercel</strong>) where any friend can join anytime with zero login errors! Check the included <code className="text-blue-300 font-mono">DEPLOYMENT.md</code> file for 2-minute step-by-step instructions.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
