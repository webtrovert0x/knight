import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { Square, PieceSymbol } from 'chess.js';
import { sounds } from '../utils/chessAudio';

// High-fidelity SVG Chess pieces
const PIECE_SVGS: Record<string, string> = {
  wP: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  wN: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  wB: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  wR: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  wQ: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  wK: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  bP: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  bN: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  bB: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  bR: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  bQ: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  bK: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
};

interface ChessboardViewProps {
  game: Chess;
  orientation?: 'white' | 'black';
  isInteractive: boolean;
  onMove: (from: Square, to: Square, promotion?: PieceSymbol) => void;
  lastMove?: { from: string; to: string } | null;
}

export const ChessboardView: React.FC<ChessboardViewProps> = ({
  game,
  orientation = 'white',
  isInteractive,
  onMove,
  lastMove,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = orientation === 'black' ? [...files].reverse() : files;
  const displayRanks = orientation === 'black' ? [...ranks].reverse() : ranks;

  // Clear selection when turn or FEN changes
  useEffect(() => {
    setSelectedSquare(null);
    setValidMoves([]);
  }, [game.fen()]);

  const handleSquareClick = (square: Square) => {
    if (!isInteractive) return;

    // If already clicked a piece and clicking a valid target square
    if (selectedSquare) {
      if (validMoves.includes(square)) {
        attemptMove(selectedSquare, square);
        return;
      }
    }

    // Otherwise selecting a new piece
    const piece = game.get(square);
    const turnColor = game.turn();
    const playerColor = orientation === 'white' ? 'w' : 'b';

    if (piece && piece.color === playerColor && turnColor === playerColor) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setValidMoves(moves.map((m) => m.to as Square));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const attemptMove = (from: Square, to: Square, promoChoice?: PieceSymbol) => {
    const piece = game.get(from);
    if (!piece) return;

    // Check if promotion is required
    const isPawn = piece.type === 'p';
    const isPromoting =
      isPawn &&
      ((piece.color === 'w' && to.endsWith('8')) ||
        (piece.color === 'b' && to.endsWith('1')));

    if (isPromoting && !promoChoice) {
      setPendingPromotion({ from, to });
      return;
    }

    try {
      // Test if move is legal
      const tempGame = new Chess(game.fen());
      const moveResult = tempGame.move({
        from,
        to,
        promotion: promoChoice || 'q',
      });

      if (moveResult) {
        if (moveResult.captured) {
          sounds.playCapture();
        } else {
          sounds.playMove();
        }

        if (tempGame.inCheck()) {
          sounds.playCheck();
        }

        setSelectedSquare(null);
        setValidMoves([]);
        setPendingPromotion(null);
        onMove(from, to, promoChoice || (isPromoting ? 'q' : undefined));
      }
    } catch {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (!isInteractive) {
      e.preventDefault();
      return;
    }
    const piece = game.get(square);
    const playerColor = orientation === 'white' ? 'w' : 'b';
    if (!piece || piece.color !== playerColor || game.turn() !== playerColor) {
      e.preventDefault();
      return;
    }

    setDraggedSquare(square);
    setSelectedSquare(square);
    const moves = game.moves({ square, verbose: true });
    setValidMoves(moves.map((m) => m.to as Square));
    e.dataTransfer.setData('text/plain', square);
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    const fromSquare = draggedSquare || selectedSquare;
    if (fromSquare && validMoves.includes(targetSquare)) {
      attemptMove(fromSquare, targetSquare);
    }
    setDraggedSquare(null);
  };

  const isKingInCheck = (square: Square) => {
    if (!game.inCheck()) return false;
    const piece = game.get(square);
    return piece && piece.type === 'k' && piece.color === game.turn();
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Promotion Dialog Modal */}
      {pendingPromotion && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-md rounded-2xl p-4">
          <div className="bg-slate-900 border border-indigo-500/40 p-6 rounded-2xl shadow-2xl text-center max-w-sm">
            <h3 className="text-lg font-bold text-white mb-2">Promote Pawn</h3>
            <p className="text-xs text-slate-400 mb-4">Select the piece to promote your pawn to:</p>
            <div className="grid grid-cols-4 gap-3">
              {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((type) => {
                const colorPrefix = orientation === 'white' ? 'w' : 'b';
                const key = `${colorPrefix}${type.toUpperCase()}`;
                return (
                  <button
                    key={type}
                    onClick={() => attemptMove(pendingPromotion.from, pendingPromotion.to, type)}
                    className="p-3 bg-slate-800/80 hover:bg-indigo-600 rounded-xl border border-slate-700 hover:border-indigo-400 transition-all hover:scale-105 group"
                  >
                    <img src={PIECE_SVGS[key]} alt={type} className="w-12 h-12 mx-auto drop-shadow" />
                    <span className="text-xs uppercase font-bold text-slate-300 group-hover:text-white mt-1 block">
                      {type === 'q' ? 'Queen' : type === 'r' ? 'Rook' : type === 'b' ? 'Bishop' : 'Knight'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Chess Board */}
      <div className="relative p-2.5 sm:p-3.5 bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-indigo-950/80 rounded-2xl shadow-2xl border border-indigo-500/30">
        <div className="grid grid-cols-8 grid-rows-8 w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] md:w-[520px] md:h-[520px] rounded-xl overflow-hidden border border-slate-800 shadow-inner">
          {displayRanks.map((rank, rankIdx) =>
            displayFiles.map((file, fileIdx) => {
              const square = `${file}${rank}` as Square;
              const isDark = (rankIdx + fileIdx) % 2 === 1;
              const piece = game.get(square);
              const pieceKey = piece ? `${piece.color}${piece.type.toUpperCase()}` : null;
              const isSelected = selectedSquare === square;
              const isValidTarget = validMoves.includes(square);
              const isLastMoveSquare =
                lastMove && (lastMove.from === square || lastMove.to === square);
              const inCheck = isKingInCheck(square);

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, square)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${
                    isDark ? 'bg-[#2b354f]' : 'bg-[#40507a]'
                  } ${
                    isSelected ? 'bg-amber-400/40 ring-2 ring-amber-400 inset-0' : ''
                  } ${
                    isLastMoveSquare ? 'bg-indigo-500/35 ring-1 ring-indigo-400/60' : ''
                  } ${
                    inCheck ? 'bg-red-500/50 ring-4 ring-red-500 animate-pulse' : ''
                  }`}
                >
                  {/* File & Rank Coordinates */}
                  {fileIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[9px] sm:text-[10px] font-bold pointer-events-none ${
                        isDark ? 'text-slate-400/70' : 'text-slate-200/80'
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                  {rankIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[9px] sm:text-[10px] font-bold pointer-events-none ${
                        isDark ? 'text-slate-400/70' : 'text-slate-200/80'
                      }`}
                    >
                      {file}
                    </span>
                  )}

                  {/* Legal Move Dot or Capture Ring */}
                  {isValidTarget && !piece && (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-400/70 shadow-lg shadow-emerald-500/40 pointer-events-none animate-pulse" />
                  )}
                  {isValidTarget && piece && (
                    <div className="absolute inset-0 ring-4 ring-emerald-400/80 rounded-sm pointer-events-none animate-pulse" />
                  )}

                  {/* Piece Vector Graphic */}
                  {piece && pieceKey && (
                    <div
                      draggable={isInteractive}
                      onDragStart={(e) => handleDragStart(e, square)}
                      className={`w-[82%] h-[82%] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
                        isInteractive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                      }`}
                    >
                      <img
                        src={PIECE_SVGS[pieceKey]}
                        alt={pieceKey}
                        className="w-full h-full object-contain filter drop-shadow-md select-none pointer-events-none"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
