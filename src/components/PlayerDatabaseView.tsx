import React, { useState, useEffect } from 'react';
import { Player } from '../types/auction';
import { PLAYERS_DATABASE } from '../data/players';
import { Search, Download, Upload, Filter, Check, AlertCircle } from 'lucide-react';

interface PlayerDatabaseViewProps {
  onBack: () => void;
}

export const PlayerDatabaseView: React.FC<PlayerDatabaseViewProps> = ({ onBack }) => {
  const [players, setPlayers] = useState<Player[]>(PLAYERS_DATABASE);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [csvText, setCsvText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const filtered = players.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.country.toLowerCase().includes(search.toLowerCase()) ||
      p.currentRealTeam.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || p.role === roleFilter;
    const matchesCountry = countryFilter === 'ALL' || p.country === countryFilter;
    return matchesSearch && matchesRole && matchesCountry;
  });

  const exportCSV = () => {
    const headers = [
      'id',
      'fullName',
      'country',
      'role',
      'battingStyle',
      'bowlingStyle',
      'isWicketkeeper',
      'isOverseas',
      'basePriceLakhs',
      'rating',
      'battingRating',
      'bowlingRating',
    ];
    const rows = players.map((p) => [
      p.id,
      `"${p.fullName}"`,
      p.country,
      p.role,
      p.battingStyle,
      p.bowlingStyle,
      p.isWicketkeeper,
      p.isOverseas,
      p.basePriceLakhs,
      p.rating,
      p.battingRating,
      p.bowlingRating,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cricket_auction_players.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async () => {
    if (!csvText.trim()) return;
    try {
      const res = await fetch('/api/players/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText }),
      });
      const data = await res.json();
      if (data.success) {
        setImportStatus(`Success! Imported ${data.importedCount} players.`);
        setTimeout(() => {
          setShowImport(false);
          setImportStatus(null);
        }, 2000);
      } else {
        setImportStatus(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setImportStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Cricket Player Database</h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse {players.length} authentic international and franchise cricketers in the auction pool.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by player, country, team..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Roles</option>
            <option value="BATTER">Batters</option>
            <option value="WICKETKEEPER">Wicketkeepers</option>
            <option value="ALL_ROUNDER">All-Rounders</option>
            <option value="BOWLER">Bowlers</option>
          </select>
        </div>

        <div>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Nations</option>
            <option value="India">India</option>
            <option value="Australia">Australia</option>
            <option value="England">England</option>
            <option value="South Africa">South Africa</option>
            <option value="West Indies">West Indies</option>
            <option value="Afghanistan">Afghanistan</option>
            <option value="New Zealand">New Zealand</option>
            <option value="Sri Lanka">Sri Lanka</option>
            <option value="Bangladesh">Bangladesh</option>
          </select>
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((player) => (
          <div
            key={player.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-amber-400 font-mono">
                  {player.auctionCategory.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  Rating {player.rating}
                </span>
              </div>

              <h3 className="font-bold text-base text-white">{player.fullName}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {player.country} · {player.role}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Base Price</span>
                <span className="font-mono font-bold text-slate-200">
                  ₹{(player.basePriceLakhs / 100).toFixed(2)} Cr
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block">Franchise</span>
                <span className="font-mono font-bold text-amber-400">{player.currentRealTeam}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CSV Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Import Custom CSV Players</h3>
            <p className="text-xs text-slate-400 mb-4">
              Paste your comma-separated cricket roster (id, fullName, country, role, basePrice).
            </p>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="id,fullName,country,role,basePrice&#10;p-101,Steve Smith,Australia,BATTER,200"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-400 mb-4"
            />

            {importStatus && (
              <p className="text-xs font-semibold text-amber-400 mb-4">{importStatus}</p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleImportCSV}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Import Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
