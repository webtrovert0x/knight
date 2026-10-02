'use client';

import React from 'react';
import { useAccount, useBalance } from 'wagmi';
import { ExternalLink, Flame, Shield, Coins, Sparkles, Trophy, Globe, Swords, Activity } from 'lucide-react';
import { botchainMainnet } from '../config/chains';
import type { PlayerStats } from '../hooks/useChessContract';

interface NavbarProps {
  onPracticeClick: () => void;
  onLobbyClick: () => void;
  onLeaderboardClick: () => void;
  currentView: 'lobby' | 'game' | 'practice' | 'leaderboard';
  userStats: PlayerStats | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onPracticeClick,
  onLobbyClick,
  onLeaderboardClick,
  currentView,
  userStats,
}) => {
  const { address, isConnected, chainId } = useAccount();
  const { data: balanceData } = useBalance({
    address,
    chainId: botchainMainnet.id,
  });

  const isWrongNetwork = isConnected && chainId !== botchainMainnet.id;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/90 border-b border-indigo-500/20 shadow-xl transition-all">
      {/* ================= TOP TIER ================= */}
      <div className="border-b border-slate-800/80 px-4 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div
            onClick={onLobbyClick}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative w-9 h-9 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
              <img
                src="/logo.png"
                alt="Knight Logo"
                className="w-full h-full object-cover rounded-[10px]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold bg-gradient-to-r from-white via-indigo-100 to-cyan-300 bg-clip-text text-transparent">
                  Knight
                </span>
                <span className="hidden sm:flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <img src="/botchain.jpeg" alt="BOT Chain" className="w-3 h-3 rounded-full object-cover" />
                  Mainnet
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden md:block">
                On-Chain PvP & AI Grandmaster Chess
              </p>
            </div>
          </div>

          {/* Center Links: Official BOT Chain Website & Explorer */}
          <div className="hidden lg:flex items-center gap-2">
            <a
              href="https://www.botchain.ai/en/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 text-slate-200 text-xs font-semibold transition-all shadow-sm group"
            >
              <img
                src="/botchain.jpeg"
                alt="BOT Chain"
                className="w-4 h-4 rounded-full object-cover group-hover:scale-110 transition-transform"
              />
              <span>botchain.ai</span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-300 transition-colors" />
            </a>

            <a
              href="https://scan.botchain.ai/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 text-slate-200 text-xs font-semibold transition-all shadow-sm group"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-45 transition-transform" />
              <span>BotScan Explorer</span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-cyan-300 transition-colors" />
            </a>
          </div>

          {/* Right Controls: Stats, Balance, AppKit Connect */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* User On-Chain ELO Rating */}
            {isConnected && userStats && (
              <div className="hidden xl:flex items-center gap-1.5 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-amber-300 font-bold font-mono">
                  {userStats.rating.toString()} ELO
                </span>
                <span className="text-[10px] text-slate-400">
                  ({userStats.wins.toString()}W - {userStats.losses.toString()}L)
                </span>
              </div>
            )}

            {/* User Balance */}
            {isConnected && balanceData && (
              <div className="hidden sm:flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold text-indigo-200">
                  {parseFloat(balanceData.formatted).toFixed(3)} {balanceData.symbol}
                </span>
              </div>
            )}

            {/* Network Alert if wrong network */}
            {isWrongNetwork && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium animate-pulse">
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Switch Network</span>
              </div>
            )}

            {/* Reown AppKit Pre-built Connect Button */}
            <div className="appkit-button-wrapper">
              <appkit-button />
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM TIER: GAME MODES & NETWORK ================= */}
      <div className="bg-slate-900/60 backdrop-blur-md px-4 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Game Mode Switcher */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onLobbyClick}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentView === 'lobby' || currentView === 'game'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-indigo-300" />
              <span>PvP Arena</span>
            </button>

            <button
              onClick={onLeaderboardClick}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentView === 'leaderboard'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={onPracticeClick}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentView === 'practice'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>AI Bot Practice</span>
            </button>
          </div>

          {/* Bottom Right: Live Network Badge & Mobile Links */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium font-mono text-emerald-300">
                BOT Chain (677)
              </span>
            </div>

            <a
              href="https://www.botchain.ai/en/"
              target="_blank"
              rel="noreferrer"
              className="lg:hidden flex items-center gap-1 text-[11px] text-indigo-300 hover:underline"
            >
              <span>botchain.ai</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

