'use client';

import React from 'react';
import { formatEther } from 'viem';
import { Trophy, Medal, Flame, Swords, ExternalLink, RefreshCw } from 'lucide-react';
import type { PlayerStats } from '../hooks/useChessContract';

interface LeaderboardViewProps {
  leaderboard: PlayerStats[];
  isLoading: boolean;
  onRefresh: () => void;
  currentUserAddress?: string;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  leaderboard,
  isLoading,
  onRefresh,
  currentUserAddress,
}) => {
  // Sort by rating descending, then totalWinnings descending
  const sorted = [...leaderboard].sort((a, b) => {
    if (Number(b.rating) !== Number(a.rating)) {
      return Number(b.rating) - Number(a.rating);
    }
    return Number(b.totalWinnings - a.totalWinnings);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border border-amber-500/30 p-8 mb-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              Verified On-Chain Chess Ratings & Scores
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              BOT Chain <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-200 bg-clip-text text-transparent">Grandmaster Leaderboard</span>
            </h1>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              Every match result, rating adjustment (+25 on win / -20 on loss), and pot prize is permanently recorded and calculated on-chain by the smart contract.
            </p>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 hover:border-amber-500/50 text-xs font-semibold transition-all shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Rankings</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold">Rank</th>
                <th className="px-6 py-4 font-bold">Player Address</th>
                <th className="px-6 py-4 font-bold text-center">ELO Rating</th>
                <th className="px-6 py-4 font-bold text-center">W / L / D</th>
                <th className="px-6 py-4 font-bold text-center">Solo High Score</th>
                <th className="px-6 py-4 font-bold text-right">BOT Won</th>
                <th className="px-6 py-4 font-bold text-center">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Swords className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    No player records on-chain yet. Play a match to get ranked!
                  </td>
                </tr>
              ) : (
                sorted.map((player, idx) => {
                  const isCurrent =
                    currentUserAddress &&
                    player.playerAddress.toLowerCase() === currentUserAddress.toLowerCase();
                  const totalPlayed = Number(player.totalGames);
                  const wins = Number(player.wins);
                  const losses = Number(player.losses);
                  const draws = Number(player.draws);
                  const winRate =
                    totalPlayed > 0 ? ((wins / totalPlayed) * 100).toFixed(0) : '0';

                  return (
                    <tr
                      key={player.playerAddress}
                      className={`transition-colors hover:bg-slate-800/40 ${
                        isCurrent ? 'bg-indigo-950/30 font-semibold' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {idx === 0 ? (
                            <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
                              🥇
                            </span>
                          ) : idx === 1 ? (
                            <span className="w-7 h-7 rounded-full bg-slate-300/20 text-slate-300 border border-slate-400/40 flex items-center justify-center font-bold text-xs">
                              🥈
                            </span>
                          ) : idx === 2 ? (
                            <span className="w-7 h-7 rounded-full bg-amber-800/20 text-amber-600 border border-amber-700/40 flex items-center justify-center font-bold text-xs">
                              🥉
                            </span>
                          ) : (
                            <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-mono">
                              #{idx + 1}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Player Address */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-indigo-300">
                            {player.playerAddress.slice(0, 6)}...{player.playerAddress.slice(-4)}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/60 border border-slate-800">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          <span className="font-bold text-white font-mono">
                            {player.rating.toString()}
                          </span>
                        </div>
                      </td>

                      {/* W/L/D and Winrate */}
                      <td className="px-6 py-4 text-center">
                        <div className="text-xs font-mono">
                          <span className="text-emerald-400 font-bold">{wins}W</span>{' '}
                          <span className="text-slate-500">/</span>{' '}
                          <span className="text-red-400 font-bold">{losses}L</span>{' '}
                          <span className="text-slate-500">/</span>{' '}
                          <span className="text-indigo-400">{draws}D</span>
                          <span className="text-slate-500 text-[10px] ml-1.5">
                            ({winRate}% WR)
                          </span>
                        </div>
                      </td>

                      {/* Solo Practice High Score */}
                      <td className="px-6 py-4 text-center font-mono text-xs text-amber-300">
                        {player.highScore > 0n ? `${player.highScore.toString()} pts` : '-'}
                      </td>

                      {/* Total BOT Winnings */}
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400 text-xs">
                        {formatEther(player.totalWinnings)} BOT
                      </td>

                      {/* Explorer Link */}
                      <td className="px-6 py-4 text-center">
                        <a
                          href={`https://scan.bohr.life/address/${player.playerAddress}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
                          title="View on BohrScan"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
