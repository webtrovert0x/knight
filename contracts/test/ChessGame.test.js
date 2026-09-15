const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChessGame Smart Contract with On-Chain Scores", function () {
  let ChessGame;
  let chess;
  let owner;
  let player1;
  let player2;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();
    ChessGame = await ethers.getContractFactory("ChessGame");
    chess = await ChessGame.deploy();
    await chess.waitForDeployment();
  });

  describe("Game Creation & Matchmaking", function () {
    it("Should allow a player to create a game with 0 wager", async function () {
      const tx = await chess.connect(player1).createGame(true, 180);
      await tx.wait();

      const game = await chess.getGame(1);
      expect(game.id).to.equal(1);
      expect(game.whitePlayer).to.equal(player1.address);
      expect(game.blackPlayer).to.equal(ethers.ZeroAddress);
      expect(game.wager).to.equal(0);
      expect(game.state).to.equal(0);
    });

    it("Should allow player2 to join and activate the game", async function () {
      const wager = ethers.parseEther("0.5");
      await chess.connect(player1).createGame(true, 300, { value: wager });
      await chess.connect(player2).joinGame(1, { value: wager });

      const game = await chess.getGame(1);
      expect(game.state).to.equal(1);
      expect(game.blackPlayer).to.equal(player2.address);
      expect(game.totalPot).to.equal(ethers.parseEther("1.0"));
    });
  });

  describe("Player Ratings, Scores & Leaderboard", function () {
    it("Should update winner rating, wins, and winnings upon resignation", async function () {
      const wager = ethers.parseEther("1.0");
      await chess.connect(player1).createGame(true, 300, { value: wager });
      await chess.connect(player2).joinGame(1, { value: wager });

      // Initial stats check
      const statsP2Before = await chess.getPlayerStats(player2.address);
      expect(statsP2Before.rating).to.equal(1200);

      // Player 1 resigns -> Player 2 wins
      await chess.connect(player1).resign(1);

      const statsP2After = await chess.getPlayerStats(player2.address);
      expect(statsP2After.wins).to.equal(1);
      expect(statsP2After.rating).to.equal(1225); // 1200 + 25
      expect(statsP2After.totalWinnings).to.equal(ethers.parseEther("2.0"));

      const statsP1After = await chess.getPlayerStats(player1.address);
      expect(statsP1After.losses).to.equal(1);
      expect(statsP1After.rating).to.equal(1180); // 1200 - 20
    });

    it("Should record solo practice high scores on-chain", async function () {
      await chess.connect(player1).recordPracticeScore(850, 2); // score 850, hard difficulty
      const stats = await chess.getPlayerStats(player1.address);
      expect(stats.highScore).to.equal(850);
      expect(stats.totalGames).to.equal(1);
    });

    it("Should return leaderboard of registered players", async function () {
      await chess.connect(player1).createGame(true, 300);
      await chess.connect(player2).joinGame(1);
      await chess.connect(player1).resign(1);

      const leaderboard = await chess.getLeaderboard(10);
      expect(leaderboard.length).to.be.gte(2);
    });
  });
});
