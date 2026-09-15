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

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-6 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>BOT Chain Testnet (Chain ID: 968)</span>
            <span>•</span>
            <a
              href="https://rpc.bohr.life"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:underline"
            >
              RPC Endpoint
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://scan.bohr.life/address/0xB20D0159A7310370cB2E022b130fcC7DCD6D98DA"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            >
              <span>ChessGame Contract on BohrScan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
