import { useState, useCallback, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther } from 'viem';
import { CHESS_ABI, CHESS_CONTRACT_ADDRESS } from '../contracts/ChessGame';
import type { GameItem } from '../components/GameLobby';

export interface PlayerStats {
  playerAddress: string;
  wins: bigint;
  losses: bigint;
  draws: bigint;
  rating: bigint;
  totalWinnings: bigint;
  totalGames: bigint;
  highScore: bigint;
}

export function useChessContract() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [games, setGames] = useState<GameItem[]>([]);
  const [activeGame, setActiveGame] = useState<GameItem | null>(null);
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [userStats, setUserStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch recent games list
  const fetchGames = useCallback(async () => {
    if (!publicClient) return;
    setIsLoading(true);
    try {
      const data = await publicClient.readContract({
        address: CHESS_CONTRACT_ADDRESS,
        abi: CHESS_ABI,
        functionName: 'getRecentGames',
        args: [BigInt(30)],
      });

      if (data) {
        setGames(data as unknown as GameItem[]);
      }
    } catch (error) {
      console.warn('Could not read from contract:', error);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    if (!publicClient) return;
    try {
      const data = await publicClient.readContract({
        address: CHESS_CONTRACT_ADDRESS,
        abi: CHESS_ABI,
        functionName: 'getLeaderboard',
        args: [BigInt(50)],
      });

      if (data) {
        setLeaderboard(data as unknown as PlayerStats[]);
      }
    } catch (err) {
      console.warn('Leaderboard fetch error:', err);
    }
  }, [publicClient]);

  // Fetch user stats
  const fetchUserStats = useCallback(async () => {
    if (!publicClient || !address) return;
    try {
      const data = await publicClient.readContract({
        address: CHESS_CONTRACT_ADDRESS,
        abi: CHESS_ABI,
        functionName: 'getPlayerStats',
        args: [address],
      });

      if (data) {
        setUserStats(data as unknown as PlayerStats);
      }
    } catch (err) {
      console.warn('User stats fetch error:', err);
    }
  }, [publicClient, address]);

  // Fetch a single game by ID
  const fetchGameById = useCallback(
    async (gameId: bigint) => {
      if (!publicClient) return null;
      try {
        const game = await publicClient.readContract({
          address: CHESS_CONTRACT_ADDRESS,
          abi: CHESS_ABI,
          functionName: 'getGame',
          args: [gameId],
        });
        if (game) {
          const item = game as unknown as GameItem;
          setActiveGame(item);
          return item;
        }
      } catch (err) {
        console.error('Error fetching game:', err);
      }
      return null;
    },
    [publicClient]
  );

  // Initial fetch and auto-polling
  useEffect(() => {
    fetchGames();
    fetchLeaderboard();
    if (address) fetchUserStats();

    const interval = setInterval(() => {
      fetchGames();
      fetchLeaderboard();
      if (address) fetchUserStats();
      if (activeGame) {
        fetchGameById(activeGame.id);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchGames, fetchLeaderboard, fetchUserStats, activeGame, fetchGameById, address]);

  // Create match
  const createGame = async (playAsWhite: boolean, timePerMove: number, wagerEth: string) => {
    if (!walletClient || !publicClient) throw new Error('Wallet not connected');

    setIsSubmitting(true);
    setStatusMessage('Submitting create match transaction to BOT Chain...');
    try {
      const value = parseEther(wagerEth || '0');
      const hash = await walletClient.writeContract({
        address: CHESS_CONTRACT_ADDRESS,
        abi: CHESS_ABI,
        functionName: 'createGame',
        args: [playAsWhite, BigInt(timePerMove)],
        value,
      });

      setStatusMessage('Waiting for transaction confirmation on BohrScan...');
      await publicClient.waitForTransactionReceipt({ hash });
      setStatusMessage('Match created successfully on-chain!');
      setTimeout(() => setStatusMessage(null), 3500);
      await fetchGames();
      await fetchLeaderboard();
    } catch (err: unknown) {
      console.error(err);
      setStatusMessage(null);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Join match
  const joinGame = async (gameId: bigint, wager: bigint) => {
    if (!walletClient || !publicClient) throw new Error('Wallet not connected');

    setIsSubmitting(true);
    setStatusMessage('Joining match and locking pot...');
    try {
      const hash = await walletClient.writeContract({
        address: CHESS_CONTRACT_ADDRESS,
        abi: CHESS_ABI,
        functionName: 'joinGame',
        args: [gameId],
        value: wager,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setStatusMessage('Joined match successfully!');
      setTimeout(() => setStatusMessage(null), 3500);
      const updated = await fetchGameById(gameId);
      if (updated) setActiveGame(updated);
      await fetchGames();
      await fetchLeaderboard();
    } catch (err) {
      console.error(err);
      setStatusMessage(null);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Make move
  const makeMove = async (
    gameId: bigint,
    moveNotation: string,
    newFen: string,
    isCheckmate: boolean,
    isDraw: boolean
  ) => {
    if (!walletClient || !publicClient) throw new Error('Wallet not connected');

    setIsSubmitting(true);
    try {
      const hash = await walletClient.writeContract({
        address: CHESS_CONTRACT_ADDRESS,
        abi: CHESS_ABI,
        functionName: 'makeMove',
        args: [gameId, moveNotation, newFen, isCheckmate, isDraw],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await fetchGameById(gameId);
      await fetchGames();
      await fetchLeaderboard();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Record practice solo score on-chain
  const recordPracticeScore = async (score: number, difficulty: number) => {
    if (!walletClient || !publicClient) throw new Error('Wallet not connected. Please connect with MetaMask or another wallet.');

    setIsSubmitting(true);
    setStatusMessage('Recording practice score to BOT Chain smart contract...');
    try {
      const hash = await walletClient.writeContract({
        address: CHESS_CONTRACT_ADDRESS,
        abi: CHESS_ABI,
        functionName: 'recordPracticeScore',
        args: [BigInt(score), difficulty],
      });

      setStatusMessage('Transaction submitted. Confirming on BohrScan...');
      await publicClient.waitForTransactionReceipt({ hash });
      setStatusMessage('🎉 Score successfully recorded on BOT Chain!');
      setTimeout(() => setStatusMessage(null), 4000);
      await fetchUserStats();
      await fetchLeaderboard();
    } catch (err) {
      console.error(err);
      setStatusMessage(null);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resign
  const resign = async (gameId: bigint) => {
    if (!walletClient || !publicClient) return;
    setIsSubmitting(true);
    try {
      const hash = await walletClient.writeContract({
        address: CHESS_CONTRACT_ADDRESS,
        abi: CHESS_ABI,
        functionName: 'resign',
        args: [gameId],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await fetchGameById(gameId);
      await fetchGames();
      await fetchLeaderboard();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Offer draw
  const offerDraw = async (gameId: bigint) => {
    if (!walletClient || !publicClient) return;
    setIsSubmitting(true);
    try {
      const hash = await walletClient.writeContract({
        address: CHESS_CONTRACT_ADDRESS,
        abi: CHESS_ABI,
        functionName: 'offerDraw',
        args: [gameId],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await fetchGameById(gameId);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Accept draw
  const acceptDraw = async (gameId: bigint) => {
    if (!walletClient || !publicClient) return;
    setIsSubmitting(true);
    try {
      const hash = await walletClient.writeContract({
        address: CHESS_CONTRACT_ADDRESS,
        abi: CHESS_ABI,
        functionName: 'acceptDraw',
        args: [gameId],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await fetchGameById(gameId);
      await fetchGames();
      await fetchLeaderboard();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Claim timeout
  const claimTimeout = async (gameId: bigint) => {
    if (!walletClient || !publicClient) return;
    setIsSubmitting(true);
    try {
      const hash = await walletClient.writeContract({
        address: CHESS_CONTRACT_ADDRESS,
        abi: CHESS_ABI,
        functionName: 'claimTimeout',
        args: [gameId],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await fetchGameById(gameId);
      await fetchGames();
      await fetchLeaderboard();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel game
  const cancelGame = async (gameId: bigint) => {
    if (!walletClient || !publicClient) return;
    setIsSubmitting(true);
    try {
      const hash = await walletClient.writeContract({
        address: CHESS_CONTRACT_ADDRESS,
        abi: CHESS_ABI,
        functionName: 'cancelGame',
        args: [gameId],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setActiveGame(null);
      await fetchGames();
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
    fetchUserStats,
    createGame,
    joinGame,
    makeMove,
    recordPracticeScore,
    resign,
    offerDraw,
    acceptDraw,
    claimTimeout,
    cancelGame,
  };
}
