import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { Chess } from 'chess.js';
import type { Square, PieceSymbol } from 'chess.js';
import { ChessboardView } from './ChessboardView';
import type { GameItem } from './GameLobby';
import { Trophy, Clock, Flag, Handshake, Timer, ArrowLeft, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/chessAudio';

interface GamePanelProps {
  gameData: GameItem;
  onBackToLobby: () => void;
  onMakeMove: (gameId: bigint, moveNotation: string, newFen: string, isCheckmate: boolean, isDraw: boolean) => Promise<void>;
  onResign: (gameId: bigint) => Promise<void>;
  onOfferDraw: (gameId: bigint) => Promise<void>;
  onAcceptDraw: (gameId: bigint) => Promise<void>;
  onClaimTimeout: (gameId: bigint) => Promise<void>;
  onCancelGame: (gameId: bigint) => Promise<void>;
  onRefreshGame: (gameId: bigint) => Promise<void>;
  isSubmittingMove: boolean;
}

export const GamePanel: React.FC<GamePanelProps> = ({
  gameData,
  onBackToLobby,
  onMakeMove,
  onResign,
  onOfferDraw,
  onAcceptDraw,
  onClaimTimeout,
  onCancelGame,
  onRefreshGame,
  isSubmittingMove,
}) => {
  const { address } = useAccount();
  const [chessInstance, setChessInstance] = useState<Chess>(new Chess(gameData.fen || undefined));
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [lastMoveCoords, setLastMoveCoords] = useState<{ from: string; to: string } | null>(null);

  // Sync chess board whenever gameData.fen changes
  useEffect(() => {
    try {
      const updated = new Chess(gameData.fen);
      setChessInstance(updated);

      if (gameData.lastMoveNotation && gameData.lastMoveNotation.length >= 4) {
        setLastMoveCoords({
          from: gameData.lastMoveNotation.slice(0, 2),
          to: gameData.lastMoveNotation.slice(2, 4),
        });
      }

      // Check for win state
      if (gameData.state === 2 || gameData.state === 3) {
        const isWinner =
          (gameData.state === 2 && address && gameData.whitePlayer.toLowerCase() === address.toLowerCase()) ||
          (gameData.state === 3 && address && gameData.blackPlayer.toLowerCase() === address.toLowerCase());
        if (isWinner) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          sounds.playWin();
        }
      }
    } catch (err) {
      console.error('Error loading FEN:', err);
    }
  }, [gameData.fen, gameData.state, address]);

  // Turn timer countdown
  useEffect(() => {
    if (gameData.state !== 1 || gameData.timePerMove === 0n) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - Number(gameData.lastMoveTimestamp);
      const remaining = Number(gameData.timePerMove) - elapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameData.state, gameData.lastMoveTimestamp, gameData.timePerMove]);

  const isWhitePlayer = Boolean(address && gameData.whitePlayer.toLowerCase() === address.toLowerCase());
  const isBlackPlayer = Boolean(address && gameData.blackPlayer.toLowerCase() === address.toLowerCase());
  const isPlayer = isWhitePlayer || isBlackPlayer;

  const playerColor = isWhitePlayer ? 'white' : isBlackPlayer ? 'black' : 'white';
  const currentTurnAddress = gameData.currentTurn;
  const isMyTurn = Boolean(
    address &&
    currentTurnAddress &&
    currentTurnAddress.toLowerCase() === address.toLowerCase() &&
    gameData.state === 1
  );

  const handleBoardMove = async (from: Square, to: Square, promo?: PieceSymbol) => {
    if (!isMyTurn || isSubmittingMove) return;

    try {
      const tempChess = new Chess(chessInstance.fen());
      const move = tempChess.move({ from, to, promotion: promo || 'q' });

      if (move) {
        const moveNotation = `${from}${to}${promo || ''}`;
        const newFen = tempChess.fen();
        const isCheckmate = tempChess.isCheckmate();
        const isDraw = tempChess.isDraw() || tempChess.isStalemate();

        // Optimistically update board locally
        setChessInstance(tempChess);
        setLastMoveCoords({ from, to });

        await onMakeMove(gameData.id, moveNotation, newFen, isCheckmate, isDraw);
      }
    } catch (err) {
      console.error('Move submission error:', err);
    }
  };

  const hasDrawOfferFromOpponent =
    gameData.drawOfferFrom &&
    gameData.drawOfferFrom !== '0x0000000000000000000000000000000000000000' &&
    address &&
    gameData.drawOfferFrom.toLowerCase() !== address.toLowerCase();

  const canClaimTimeout =
    gameData.state === 1 &&
    gameData.timePerMove > 0n &&
    timeLeft === 0 &&
    !isMyTurn &&
    isPlayer;

  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top Bar Navigation & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <button
          onClick={onBackToLobby}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lobby</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/60 px-3 py-1 rounded-lg border border-indigo-500/20">
            Room #{gameData.id.toString()}
          </span>

          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              gameData.state === 0
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : gameData.state === 1
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
            }`}
          >
            {gameData.state === 0
              ? 'Waiting for Opponent...'
              : gameData.state === 1
              ? 'Match Active'
              : gameData.state === 2
              ? 'White Victory 🏆'
              : gameData.state === 3
              ? 'Black Victory 🏆'
              : gameData.state === 4
              ? 'Drawn Game 🤝'
              : 'Match Cancelled'}
          </span>

          <button
            onClick={() => onRefreshGame(gameData.id)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
            title="Sync latest state from BOT Chain"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" />
          </button>
        </div>
      </div>

      {/* Main Game Interface: Board on Left, Match Control & Stats on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Cols: Chessboard & Opponent Bars */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Opponent Card (Top) */}
          <div className="w-full max-w-[520px] flex items-center justify-between bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl mb-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3.5 h-3.5 rounded-full ring-2 ${
                  playerColor === 'white' ? 'bg-slate-950 ring-slate-600' : 'bg-white ring-slate-400'
                }`}
              />
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {playerColor === 'white' ? 'Black Player' : 'White Player'}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {(playerColor === 'white' ? gameData.blackPlayer : gameData.whitePlayer) !== '0x0000000000000000000000000000000000000000'
                    ? `${(playerColor === 'white' ? gameData.blackPlayer : gameData.whitePlayer).slice(0, 8)}...`
                    : 'Awaiting Player...'}
                </div>
              </div>
            </div>

            {gameData.state === 1 && !isMyTurn && gameData.timePerMove > 0n && (
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/20 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimerDisplay(timeLeft)}</span>
              </div>
            )}
          </div>

          {/* Interactive Chess Board */}
          <ChessboardView
            game={chessInstance}
            orientation={playerColor}
            isInteractive={isMyTurn && !isSubmittingMove}
            onMove={handleBoardMove}
            lastMove={lastMoveCoords}
          />

          {/* Player Card (Bottom) */}
          <div className="w-full max-w-[520px] flex items-center justify-between bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl mt-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3.5 h-3.5 rounded-full ring-2 ${
                  playerColor === 'white' ? 'bg-white ring-slate-400' : 'bg-slate-950 ring-slate-600'
                }`}
              />
              <div>
                <div className="text-xs font-bold text-indigo-300">
                  You ({playerColor === 'white' ? 'White' : 'Black'})
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {address ? `${address.slice(0, 8)}...${address.slice(-4)}` : 'Not connected'}
                </div>
              </div>
            </div>

            {gameData.state === 1 && isMyTurn && gameData.timePerMove > 0n && (
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/20 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimerDisplay(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Match Control & Wager Details */}
        <div className="lg:col-span-5 space-y-5">
          {/* Pot & Wager Banner */}
          <div className="bg-gradient-to-br from-indigo-950/90 via-slate-900 to-purple-950/90 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                Escrow Prize Pot
              </span>
              <span className="text-xs font-bold text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                BOT Token
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white mb-1">
              {formatEther(gameData.totalPot)} BOT
            </div>
            <p className="text-xs text-slate-400">
              Wager: {formatEther(gameData.wager)} BOT each • Winner takes all
            </p>
          </div>

          {/* Turn Alert / Action Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Match Status
            </h3>

            {gameData.state === 0 ? (
              <div className="text-center py-4">
                <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 animate-bounce">
                  ⏳
                </div>
                <div className="text-sm font-bold text-white mb-1">Waiting for Opponent</div>
                <p className="text-xs text-slate-400 mb-4">
                  Share this match ID with a friend or test on BOT Chain Testnet.
                </p>
                {address && gameData.creator.toLowerCase() === address.toLowerCase() && (
                  <button
                    onClick={() => onCancelGame(gameData.id)}
                    className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all"
                  >
                    Cancel Match & Refund Wager
                  </button>
                )}
              </div>
            ) : gameData.state === 1 ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border flex items-center gap-3 ${
                    isMyTurn
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isMyTurn ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                    }`}
                  />
                  <div className="text-xs font-semibold">
                    {isMyTurn
                      ? isSubmittingMove
                        ? '⏳ Broadcasting Move to BOT Chain...'
                        : 'Your Turn! Make your move on the board.'
                      : 'Opponent is thinking... waiting for move.'}
                  </div>
                </div>

                {/* Draw Offer Notification */}
                {hasDrawOfferFromOpponent && (
                  <div className="p-3.5 bg-purple-950/40 border border-purple-500/40 rounded-xl">
                    <div className="text-xs font-bold text-purple-200 mb-2 flex items-center gap-1.5">
                      <Handshake className="w-4 h-4 text-purple-400" />
                      Opponent offered a Draw!
                    </div>
                    <button
                      onClick={() => onAcceptDraw(gameData.id)}
                      className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md"
                    >
                      Accept Draw & Split Pot
                    </button>
                  </div>
                )}

                {/* Claim Timeout Button */}
                {canClaimTimeout && (
                  <button
                    onClick={() => onClaimTimeout(gameData.id)}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition-all animate-bounce flex items-center justify-center gap-1.5"
                  >
                    <Timer className="w-4 h-4" />
                    Claim Timeout Victory!
                  </button>
                )}

                {/* In-Game Actions */}
                {isPlayer && (
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button
                      onClick={() => onOfferDraw(gameData.id)}
                      disabled={Boolean(gameData.drawOfferFrom)}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
                    >
                      <Handshake className="w-3.5 h-3.5 text-purple-400" />
                      Offer Draw
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to resign? The pot will be awarded to your opponent.')) {
                          onResign(gameData.id);
                        }
                      }}
                      className="py-2.5 px-3 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Flag className="w-3.5 h-3.5 text-red-400" />
                      Resign
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Match Finished */
              <div className="text-center py-4 space-y-3">
                <div className="text-2xl">
                  {gameData.state === 2 || gameData.state === 3 ? '🏆' : '🤝'}
                </div>
                <div className="text-base font-bold text-white">
                  {gameData.state === 2
                    ? 'White Won the Match!'
                    : gameData.state === 3
                    ? 'Black Won the Match!'
                    : 'Match Ended in a Draw'}
                </div>
                <p className="text-xs text-slate-400">
                  Prize pot has been settled and distributed on BOT Chain.
                </p>
                <button
                  onClick={onBackToLobby}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  Return to Match Lobby
                </button>
              </div>
            )}
          </div>

          {/* Move History / FEN Details */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Move Count
              </span>
              <span className="text-xs font-mono text-indigo-300">
                {gameData.moveCount.toString()} moves
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl text-[11px] font-mono text-slate-400 break-all select-all">
              {gameData.fen || 'Starting Position'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
