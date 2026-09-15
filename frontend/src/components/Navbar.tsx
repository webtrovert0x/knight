'use client';

import React from 'react';
import { useAccount, useBalance } from 'wagmi';
import { ExternalLink, Flame, Shield, Coins, Sparkles, Trophy } from 'lucide-react';
import { botchainTestnet } from '../config/chains';
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
    chainId: botchainTestnet.id,
  });

  const isWrongNetwork = isConnected && chainId !== botchainTestnet.id;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-indigo-500/20 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div
          onClick={onLobbyClick}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative w-10 h-10 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
            <img
              src="/logo.png"
              alt="Knight Logo"
              className="w-full h-full object-cover rounded-[10px]"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold bg-gradient-to-r from-white via-indigo-100 to-cyan-300 bg-clip-text text-transparent">
                Knight
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                BOT Chain
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              On-Chain PvP & AI Grandmaster Arena
            </p>
          </div>
        </div>

        {/* Navigation / Mode Switcher */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={onLobbyClick}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentView === 'lobby' || currentView === 'game'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            🎮 PvP Arena
          </button>
          <button
            onClick={onLeaderboardClick}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
              currentView === 'leaderboard'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            Leaderboard
          </button>
          <button
            onClick={onPracticeClick}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
              currentView === 'practice'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            AI Bot
          </button>
        </div>

        {/* Right Section: Stats, BohrScan, Connect Wallet */}
        <div className="flex items-center gap-3">
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
            <div className="hidden lg:flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-indigo-200">
                {parseFloat(balanceData.formatted).toFixed(3)} {balanceData.symbol}
              </span>
            </div>
          )}

          {/* Faucet / Explorer Link */}
          <a
            href="https://scan.bohr.life/"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-indigo-500/50 transition-all shadow-sm"
          >
            <span>BohrScan</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Network Alert if wrong network */}
          {isWrongNetwork && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium animate-pulse">
              <Shield className="w-3.5 h-3.5" />
              <span>Switch Network</span>
            </div>
          )}

          {/* Reown AppKit Pre-built Connect Button */}
          <div className="appkit-button-wrapper">
            <appkit-button />
          </div>
        </div>
      </div>
    </header>
  );
};
