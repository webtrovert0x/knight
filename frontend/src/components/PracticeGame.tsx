'use client';

import React, { useState } from 'react';
import { Chess } from 'chess.js';
import type { Square, PieceSymbol } from 'chess.js';
import { ChessboardView } from './ChessboardView';
import { ArrowLeft, RotateCcw, Sparkles, Cpu, UploadCloud, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/chessAudio';

interface PracticeGameProps {
  onBackToLobby: () => void;
  onRecordScore: (score: number, difficulty: number) => Promise<void>;
  isRecordingScore: boolean;
}

export const PracticeGame: React.FC<PracticeGameProps> = ({
  onBackToLobby,
  onRecordScore,
  isRecordingScore,
}) => {
  const [chessInstance, setChessInstance] = useState<Chess>(new Chess());
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [scoreRecorded, setScoreRecorded] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState<number>(0);
  const [lastMoveCoords, setLastMoveCoords] = useState<{ from: string; to: string } | null>(null);

  const resetGame = (color = playerColor) => {
    const newGame = new Chess();
    setChessInstance(newGame);
    setGameResult(null);
    setScoreRecorded(false);
    setCalculatedScore(0);
    setLastMoveCoords(null);
    setIsBotThinking(false);

    if (color === 'black') {
      setTimeout(() => makeBotMove(newGame), 400);
    }
  };

  const handleColorChange = (newColor: 'white' | 'black') => {
    setPlayerColor(newColor);
    resetGame(newColor);
  };

  // Bot move generation
  const makeBotMove = (currentGame: Chess) => {
    if (currentGame.isGameOver()) return;

    setIsBotThinking(true);
    setTimeout(() => {
      const moves = currentGame.moves({ verbose: true });
      if (moves.length === 0) {
        setIsBotThinking(false);
        return;
      }

      let chosenMove = moves[0];

      if (difficulty === 'easy') {
        chosenMove = moves[Math.floor(Math.random() * moves.length)];
      } else if (difficulty === 'medium') {
        const captureMoves = moves.filter((m) => m.captured);
        const checkMoves = moves.filter((m) => {
          const test = new Chess(currentGame.fen());
          test.move(m);
          return test.inCheck();
        });

        if (captureMoves.length > 0 && Math.random() > 0.3) {
          chosenMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
        } else if (checkMoves.length > 0 && Math.random() > 0.4) {
          chosenMove = checkMoves[Math.floor(Math.random() * checkMoves.length)];
        } else {
          chosenMove = moves[Math.floor(Math.random() * moves.length)];
        }
      } else {
        const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 0 };
        let bestScore = -9999;
        for (const m of moves) {
          const test = new Chess(currentGame.fen());
          test.move(m);
          let score = 0;
          if (m.captured) {
            score += (pieceValues[m.captured] || 1) * 10;
          }
          if (test.inCheck()) score += 5;
          if (test.isCheckmate()) score += 1000;

          if (score > bestScore) {
            bestScore = score;
            chosenMove = m;
          }
        }
      }

      currentGame.move(chosenMove);
      setChessInstance(new Chess(currentGame.fen()));
      setLastMoveCoords({ from: chosenMove.from, to: chosenMove.to });
      setIsBotThinking(false);

      if (chosenMove.captured) {
        sounds.playCapture();
      } else {
        sounds.playMove();
      }

      if (currentGame.inCheck()) {
        sounds.playCheck();
      }

      checkGameOver(currentGame);
    }, 450);
  };

  const handlePlayerMove = (from: Square, to: Square, promo?: PieceSymbol) => {
    if (isBotThinking || gameResult) return;

    try {
      const newGame = new Chess(chessInstance.fen());
      const move = newGame.move({ from, to, promotion: promo || 'q' });

      if (move) {
        setChessInstance(newGame);
        setLastMoveCoords({ from, to });

        if (!checkGameOver(newGame)) {
          makeBotMove(newGame);
        }
      }
    } catch (err) {
      console.error('Player move error:', err);
    }
  };

  const checkGameOver = (game: Chess) => {
    const diffMultiplier = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;

    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? 'Black' : 'White';
      const playerWon = (winner === 'White' && playerColor === 'white') || (winner === 'Black' && playerColor === 'black');
      setGameResult(playerWon ? 'Victory! You checkmated the AI bot! 🏆' : 'Checkmate! AI bot won.');

      if (playerWon) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        sounds.playWin();
        const finalScore = Math.max(100, 500 * diffMultiplier - game.history().length * 5);
        setCalculatedScore(finalScore);
      } else {
        const finalScore = Math.max(25, 100 * diffMultiplier);
        setCalculatedScore(finalScore);
      }
      return true;
    } else if (game.isDraw() || game.isStalemate()) {
      setGameResult('Game drawn by stalemate or insufficient material. 🤝');
      const finalScore = Math.max(50, 250 * diffMultiplier - game.history().length * 2);
      setCalculatedScore(finalScore);
      return true;
    }
    return false;
  };

  const handleSaveScoreOnChain = async () => {
    const diffCode = difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1 : 0;
    const scoreToSave = calculatedScore > 0 ? calculatedScore : 200;
    await onRecordScore(scoreToSave, diffCode);
    setScoreRecorded(true);
  };

  const isPlayerTurn =
    !isBotThinking &&
    !gameResult &&
    ((playerColor === 'white' && chessInstance.turn() === 'w') ||
      (playerColor === 'black' && chessInstance.turn() === 'b'));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <button
          onClick={onBackToLobby}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lobby</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
            <Cpu className="w-4 h-4 text-yellow-400" />
            <span>AI Practice Arena</span>
          </div>

          <button
            onClick={() => resetGame()}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Game</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Cols: Chessboard */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* AI Card (Top) */}
          <div className="w-full max-w-[520px] flex items-center justify-between bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl mb-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3.5 h-3.5 rounded-full ring-2 ${
                  playerColor === 'white' ? 'bg-slate-950 ring-slate-600' : 'bg-white ring-slate-400'
                }`}
              />
              <div>
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span>BOT AI Engine</span>
                  <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/20">
                    {difficulty}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {isBotThinking ? 'Thinking next move...' : 'Waiting for turn'}
                </div>
              </div>
            </div>

            {isBotThinking && (
              <div className="text-xs font-bold text-purple-400 animate-pulse flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Computing...</span>
              </div>
            )}
          </div>

          {/* Interactive Board */}
          <ChessboardView
            game={chessInstance}
            orientation={playerColor}
            isInteractive={isPlayerTurn}
            onMove={handlePlayerMove}
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
                <div className="text-[10px] text-slate-400">
                  {isPlayerTurn ? 'Your turn to move' : 'Waiting...'}
                </div>
              </div>
            </div>

            {isPlayerTurn && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/20 animate-pulse">
                Your Turn
              </span>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Config & On-Chain Score Submission */}
        <div className="lg:col-span-5 space-y-5">
          {/* Game Result & On-Chain Storage Card */}
          {gameResult ? (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-purple-950/90 border border-indigo-500/40 text-center shadow-2xl space-y-4">
              <div className="text-3xl">
                {gameResult.includes('Victory') ? '🏆' : gameResult.includes('drawn') ? '🤝' : '⚔️'}
              </div>
              <div className="text-base font-bold text-white">{gameResult}</div>

              {/* On-Chain Storage Section */}
              <div className="bg-slate-950/80 border border-indigo-500/30 p-5 rounded-2xl text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    On-Chain Score Storage
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                    +{calculatedScore > 0 ? calculatedScore : 200} pts
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Store this match result and score on the BOT Chain smart contract to update your Grandmaster Leaderboard ranking.
                </p>

                {!scoreRecorded ? (
                  <button
                    onClick={handleSaveScoreOnChain}
                    disabled={isRecordingScore}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    {isRecordingScore ? 'Saving to BOT Chain (Confirm in Wallet)...' : '⚡ Save Score to Blockchain'}
                  </button>
                ) : (
                  <div className="py-2.5 px-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Saved to Blockchain Successfully!</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => resetGame()}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all"
              >
                Play Again
              </button>
            </div>
          ) : (
            /* Ongoing Game Status Card */
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Practice Match Status
                </span>
                <span className="text-xs font-mono text-purple-300">
                  {chessInstance.history().length} moves played
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Play against the AI engine to sharpen your tactics. When the match completes (checkmate or draw), you can store your score on-chain to climb the leaderboard.
              </p>
            </div>
          )}

          {/* Practice Settings */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Practice Configuration
            </h3>

            {/* Color Switcher */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Play As:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleColorChange('white')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    playerColor === 'white'
                      ? 'bg-white text-slate-950 border-white shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  White (First)
                </button>
                <button
                  type="button"
                  onClick={() => handleColorChange('black')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    playerColor === 'black'
                      ? 'bg-slate-950 text-white border-indigo-500 ring-2 ring-indigo-500 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  Black (Second)
                </button>
              </div>
            </div>

            {/* AI Difficulty */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                AI Difficulty:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                      difficulty === diff
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
