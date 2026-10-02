'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { Navbar } from '../components/Navbar';
import { GameLobby } from '../components/GameLobby';
import { GamePanel } from '../components/GamePanel';
import { PracticeGame } from '../components/PracticeGame';
import { LeaderboardView } from '../components/LeaderboardView';
import { useChessContract } from '../hooks/useChessContract';
import { ExternalLink, Sparkles, Trophy, Flame } from 'lucide-react';

export default function Home() {
  const [view, setView] = useState<'lobby' | 'game' | 'practice' | 'leaderboard'>('lobby');
  const { address } = useAccount();

  const {
    games,
    activeGame,
    setActiveGame,
    leaderboard,
    userStats,
    isLoading,
    isSubmitting,
    statusMessage,
    fetchGames,
    fetchGameById,
    fetchLeaderboard,
    createGame,
    joinGame,
    makeMove,
    recordPracticeScore,
    resign,
    offerDraw,
    acceptDraw,
    claimTimeout,
    cancelGame,
  } = useChessContract();

  const handleSelectGame = async (gameId: bigint) => {
    const game = await fetchGameById(gameId);
    if (game) {
      setActiveGame(game);
      setView('game');
    }
  };

  const handleCreateGame = async (playAsWhite: boolean, timePerMove: number, wager: string) => {
    await createGame(playAsWhite, timePerMove, wager);
    await fetchGames();
  };

  const handleRefreshGame = async (gameId: bigint) => {
    await fetchGameById(gameId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambience Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Navigation Header with AppKit Connect Button */}
      <Navbar
        onPracticeClick={() => setView('practice')}
        onLobbyClick={() => {
          setActiveGame(null);
          setView('lobby');
        }}
        onLeaderboardClick={() => setView('leaderboard')}
        currentView={view}
        userStats={userStats}
      />

      {/* Global Status Toast Notification */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-indigo-950/90 border border-indigo-500/40 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />
          <span className="text-xs font-semibold text-indigo-100">{statusMessage}</span>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 relative z-10">
        {view === 'practice' ? (
          <PracticeGame
            onBackToLobby={() => setView('lobby')}
            onRecordScore={recordPracticeScore}
            isRecordingScore={isSubmitting}
          />
        ) : view === 'leaderboard' ? (
          <LeaderboardView
            leaderboard={leaderboard}
            isLoading={isLoading}
            onRefresh={fetchLeaderboard}
            currentUserAddress={address}
          />
        ) : view === 'game' && activeGame ? (
          <GamePanel
            gameData={activeGame}
            onBackToLobby={() => {
              setActiveGame(null);
              setView('lobby');
            }}
            onMakeMove={makeMove}
            onResign={resign}
            onOfferDraw={offerDraw}
            onAcceptDraw={acceptDraw}
            onClaimTimeout={claimTimeout}
            onCancelGame={cancelGame}
            onRefreshGame={handleRefreshGame}
            isSubmittingMove={isSubmitting}
          />
        ) : (
          <GameLobby
            games={games}
            isLoading={isLoading}
            onRefresh={fetchGames}
            onCreateGame={handleCreateGame}
            onJoinGame={joinGame}
            onSelectGame={handleSelectGame}
            onStartPractice={() => setView('practice')}
            isCreating={isSubmitting}
            isJoining={isSubmitting}
          />
        )}
      </main>

      {/* Footer / Ecosystem Section */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/90 backdrop-blur-md py-6 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 font-semibold transition-all group"
            >
              <img
                src="/botchain.jpeg"
                alt="BOT Chain Logo"
                className="w-4 h-4 rounded-full object-cover group-hover:scale-110 transition-transform shadow-sm"
              />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>BOT Chain Mainnet (Chain ID: 677)</span>
            </a>
            <span>•</span>
            <a
              href="https://botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="text-slate-300 hover:text-white hover:underline font-medium transition-colors"
            >
              Official Website
            </a>
            <span>•</span>
            <a
              href="https://scan.botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="text-slate-300 hover:text-white hover:underline font-medium transition-colors"
            >
              BotScan Explorer
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://scan.botchain.ai/address/0x32546D587F052e775642390370beE2cE55F327B3#code"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all shadow-sm"
            >
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Verified Contract on BotScan</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
