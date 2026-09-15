import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { PlusCircle, Swords, Clock, Trophy, RefreshCw, Sparkles } from 'lucide-react';
import { formatEther } from 'viem';

export interface GameItem {
  id: bigint;
  whitePlayer: string;
  blackPlayer: string;
  wager: bigint;
  totalPot: bigint;
  fen: string;
  lastMoveNotation: string;
  moveCount: bigint;
  lastMoveTimestamp: bigint;
  timePerMove: bigint;
  currentTurn: string;
  state: number;
  drawOfferFrom: string;
  creator: string;
}

interface GameLobbyProps {
  games: GameItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateGame: (playAsWhite: boolean, timePerMove: number, wagerEth: string) => Promise<void>;
  onJoinGame: (gameId: bigint, wager: bigint) => Promise<void>;
  onSelectGame: (gameId: bigint) => void;
  onStartPractice: () => void;
  isCreating: boolean;
  isJoining: boolean;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  games,
  isLoading,
  onRefresh,
  onCreateGame,
  onJoinGame,
  onSelectGame,
  onStartPractice,
  isCreating,
  isJoining,
}) => {
  const { address, isConnected } = useAccount();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [colorPref, setColorPref] = useState<'white' | 'black'>('white');
  const [timeControl, setTimeControl] = useState<number>(300); // 5 mins default
  const [wagerInput, setWagerInput] = useState<string>('0');
  const [filter, setFilter] = useState<'open' | 'my' | 'all'>('open');

  const openGames = games.filter((g) => g.state === 0);
  const myGames = games.filter(
    (g) =>
      address &&
      (g.whitePlayer.toLowerCase() === address.toLowerCase() ||
        g.blackPlayer.toLowerCase() === address.toLowerCase() ||
        g.creator.toLowerCase() === address.toLowerCase())
  );

  const displayedGames =
    filter === 'open' ? openGames : filter === 'my' ? myGames : games;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateGame(colorPref === 'white', timeControl, wagerInput);
    setShowCreateModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 p-8 mb-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Live on BOT Chain Testnet (Chain ID 968)
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Knight</span> On-Chain Chess
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Challenge players worldwide in trustless on-chain chess matches. Stake native <span className="font-semibold text-indigo-300">BOT tokens</span> in escrow, prove your chess mastery, and claim the victor's pot.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!isConnected || isCreating}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <PlusCircle className="w-5 h-5" />
              {isCreating ? 'Creating Match...' : 'Create Match'}
            </button>
            <button
              onClick={onStartPractice}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold text-sm hover:border-purple-500/50 transition-all"
            >
              <Swords className="w-4 h-4 text-purple-400" />
              Play vs AI Bot
            </button>
          </div>
        </div>

        {/* Decorative Grid Glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Lobby Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setFilter('open')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              filter === 'open'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Open Matches ({openGames.length})
          </button>
          <button
            onClick={() => setFilter('my')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              filter === 'my'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Games ({myGames.length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Matches ({games.length})
          </button>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition-all self-end sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Lobby</span>
        </button>
      </div>

      {/* Matches Grid */}
      {displayedGames.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-slate-800/80">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center mb-4">
            <Swords className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No matches found in this view</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            {filter === 'open'
              ? 'Be the first to host a game and invite an opponent or test with your secondary wallet!'
              : 'You have no active matches yet. Join an open match or create one above.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!isConnected}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
          >
            Create New Match
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedGames.map((game) => {
            const isCreator =
              address && game.creator.toLowerCase() === address.toLowerCase();
            const isOpen = game.state === 0;
            const isActive = game.state === 1;
            const wagerFormatted = formatEther(game.wager);

            return (
              <div
                key={game.id.toString()}
                className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                      Game #{game.id.toString()}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isOpen
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse'
                          : isActive
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isOpen
                        ? '⏳ Waiting Opponent'
                        : isActive
                        ? '⚔️ Match In Progress'
                        : game.state === 2
                        ? '👑 White Won'
                        : game.state === 3
                        ? '👑 Black Won'
                        : game.state === 4
                        ? '🤝 Draw'
                        : '🚫 Cancelled'}
                    </span>
                  </div>

                  {/* Wager & Pot Info */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        Wager per Player:
                      </span>
                      <span className="font-bold text-white">
                        {wagerFormatted} BOT
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        Time Control:
                      </span>
                      <span className="font-medium text-slate-300">
                        {game.timePerMove > 0n
                          ? `${Number(game.timePerMove) / 60} min/move`
                          : 'Untimed'}
                      </span>
                    </div>
                  </div>

                  {/* Players Info */}
                  <div className="space-y-1.5 text-xs mb-4">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-white ring-1 ring-slate-400" />
                        White:
                      </span>
                      <span className="font-mono text-slate-400">
                        {game.whitePlayer !== '0x0000000000000000000000000000000000000000'
                          ? `${game.whitePlayer.slice(0, 6)}...${game.whitePlayer.slice(-4)}`
                          : '(Open Slot)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-600" />
                        Black:
                      </span>
                      <span className="font-mono text-slate-400">
                        {game.blackPlayer !== '0x0000000000000000000000000000000000000000'
                          ? `${game.blackPlayer.slice(0, 6)}...${game.blackPlayer.slice(-4)}`
                          : '(Open Slot)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-800/80">
                  {isOpen ? (
                    isCreator ? (
                      <button
                        onClick={() => onSelectGame(game.id)}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-xs transition-all"
                      >
                        View Game Room (Your Match)
                      </button>
                    ) : (
                      <button
                        onClick={() => onJoinGame(game.id, game.wager)}
                        disabled={!isConnected || isJoining}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                      >
                        {isJoining ? 'Joining Match...' : `Join Match (${wagerFormatted} BOT)`}
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => onSelectGame(game.id)}
                      className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 font-semibold text-xs transition-all"
                    >
                      {isActive ? 'Enter Game Room ⚔️' : 'View Replay ♟️'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Match Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-1">Create On-Chain Match</h2>
            <p className="text-xs text-slate-400 mb-6">
              Set your stake, choose piece color, and select time control.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              {/* Color preference */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Select Piece Color:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setColorPref('white')}
                    className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      colorPref === 'white'
                        ? 'bg-white text-slate-950 border-white shadow-lg'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-white border border-slate-400" />
                    White (Moves First)
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorPref('black')}
                    className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      colorPref === 'black'
                        ? 'bg-slate-950 text-white border-indigo-500 ring-2 ring-indigo-500 shadow-lg'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-slate-950 border border-slate-600" />
                    Black (Second)
                  </button>
                </div>
              </div>

              {/* BOT Wager Amount */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Wager Amount (BOT):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={wagerInput}
                    onChange={(e) => setWagerInput(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-indigo-400">
                    BOT
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  {['0', '0.1', '0.5', '1.0'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWagerInput(amt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-all"
                    >
                      {amt === '0' ? 'Free' : `${amt} BOT`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Control */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Time Control per Move:
                </label>
                <select
                  value={timeControl}
                  onChange={(e) => setTimeControl(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value={60}>1 Minute / Move (Blitz)</option>
                  <option value={180}>3 Minutes / Move (Rapid)</option>
                  <option value={300}>5 Minutes / Move (Standard)</option>
                  <option value={600}>10 Minutes / Move (Classical)</option>
                  <option value={0}>Untimed (Casual)</option>
                </select>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Broadcasting Tx...' : 'Create & Lock Pot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
