// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ChessGame
 * @dev On-Chain Chess Game contract deployed on BOT Chain Testnet
 * Handles wager escrow, matchmaking, move recording, on-chain player scores, ratings & leaderboard.
 */
contract ChessGame {
    enum GameState {
        WAITING_FOR_OPPONENT,
        ACTIVE,
        WHITE_WON,
        BLACK_WON,
        DRAW,
        CANCELLED
    }

    struct PlayerStats {
        address playerAddress;
        uint256 wins;
        uint256 losses;
        uint256 draws;
        uint256 rating; // ELO rating, starts at 1200
        uint256 totalWinnings; // in BOT wei
        uint256 totalGames;
        uint256 highScore; // offline/practice high score points
    }

    struct Game {
        uint256 id;
        address whitePlayer;
        address blackPlayer;
        uint256 wager;
        uint256 totalPot;
        string fen;
        string lastMoveNotation;
        uint256 moveCount;
        uint256 lastMoveTimestamp;
        uint256 timePerMove; // in seconds (0 = unlimited)
        address currentTurn;
        GameState state;
        address drawOfferFrom;
        address creator;
    }

    uint256 private _gameIdCounter;
    mapping(uint256 => Game) public games;
    uint256[] public activeGameIds;

    // Player Stats & Leaderboard
    mapping(address => PlayerStats) public playerStats;
    address[] public allPlayers;
    mapping(address => bool) private _isKnownPlayer;

    // Events
    event GameCreated(
        uint256 indexed gameId,
        address indexed creator,
        uint256 wager,
        bool isWhite,
        uint256 timePerMove
    );
    event GameJoined(
        uint256 indexed gameId,
        address indexed opponent,
        address whitePlayer,
        address blackPlayer
    );
    event MoveMade(
        uint256 indexed gameId,
        address indexed player,
        string moveNotation,
        string newFen,
        uint256 moveCount
    );
    event DrawOffered(uint256 indexed gameId, address indexed from);
    event GameOver(
        uint256 indexed gameId,
        address winner,
        GameState state,
        uint256 payout
    );
    event GameCancelled(uint256 indexed gameId, address indexed creator);
    event ScoreRecorded(address indexed player, uint256 score, uint8 difficulty);
    event RatingUpdated(address indexed player, uint256 newRating, uint256 wins, uint256 losses);

    modifier onlyPlayer(uint256 gameId) {
        Game storage game = games[gameId];
        require(
            msg.sender == game.whitePlayer || msg.sender == game.blackPlayer,
            "Not a player in this game"
        );
        _;
    }

    /**
     * @dev Internal helper to register and initialize a player if not already tracked.
     */
    function _initPlayer(address player) internal {
        if (!_isKnownPlayer[player] && player != address(0)) {
            _isKnownPlayer[player] = true;
            allPlayers.push(player);
            playerStats[player] = PlayerStats({
                playerAddress: player,
                wins: 0,
                losses: 0,
                draws: 0,
                rating: 1200,
                totalWinnings: 0,
                totalGames: 0,
                highScore: 0
            });
        }
    }

    /**
     * @notice Creates a new chess match with an optional native BOT wager.
     * @param playAsWhite True if the creator chooses white pieces, false for black.
     * @param timePerMove Maximum seconds per move allowed (0 for unmetered).
     */
    function createGame(bool playAsWhite, uint256 timePerMove)
        external
        payable
        returns (uint256)
    {
        _initPlayer(msg.sender);
        _gameIdCounter++;
        uint256 newGameId = _gameIdCounter;

        Game storage game = games[newGameId];
        game.id = newGameId;
        game.creator = msg.sender;
        game.wager = msg.value;
        game.totalPot = msg.value;
        game.timePerMove = timePerMove;
        game.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        game.state = GameState.WAITING_FOR_OPPONENT;
        game.moveCount = 0;

        if (playAsWhite) {
            game.whitePlayer = msg.sender;
            game.blackPlayer = address(0);
        } else {
            game.blackPlayer = msg.sender;
            game.whitePlayer = address(0);
        }

        activeGameIds.push(newGameId);

        emit GameCreated(
            newGameId,
            msg.sender,
            msg.value,
            playAsWhite,
            timePerMove
        );
        return newGameId;
    }

    /**
     * @notice Joins an open match and deposits the matching wager.
     * @param gameId ID of the match to join.
     */
    function joinGame(uint256 gameId) external payable {
        _initPlayer(msg.sender);
        Game storage game = games[gameId];
        require(game.id != 0, "Game does not exist");
        require(
            game.state == GameState.WAITING_FOR_OPPONENT,
            "Game is not open"
        );
        require(msg.sender != game.creator, "Creator cannot join own game");
        require(msg.value == game.wager, "Must match exact wager amount");

        if (game.whitePlayer == address(0)) {
            game.whitePlayer = msg.sender;
        } else {
            game.blackPlayer = msg.sender;
        }

        game.totalPot += msg.value;
        game.state = GameState.ACTIVE;
        game.currentTurn = game.whitePlayer;
        game.lastMoveTimestamp = block.timestamp;

        emit GameJoined(
            gameId,
            msg.sender,
            game.whitePlayer,
            game.blackPlayer
        );
    }

    /**
     * @notice Submits a move and updates the board FEN.
     */
    function makeMove(
        uint256 gameId,
        string calldata moveNotation,
        string calldata newFen,
        bool isCheckmate,
        bool isDraw
    ) external onlyPlayer(gameId) {
        Game storage game = games[gameId];
        require(game.state == GameState.ACTIVE, "Game is not active");
        require(msg.sender == game.currentTurn, "Not your turn");

        game.fen = newFen;
        game.lastMoveNotation = moveNotation;
        game.moveCount++;
        game.lastMoveTimestamp = block.timestamp;
        game.drawOfferFrom = address(0);

        emit MoveMade(gameId, msg.sender, moveNotation, newFen, game.moveCount);

        if (isCheckmate) {
            _finishGame(
                gameId,
                msg.sender,
                msg.sender == game.whitePlayer
                    ? GameState.WHITE_WON
                    : GameState.BLACK_WON
            );
        } else if (isDraw) {
            _finishGame(gameId, address(0), GameState.DRAW);
        } else {
            game.currentTurn = (msg.sender == game.whitePlayer)
                ? game.blackPlayer
                : game.whitePlayer;
        }
    }

    /**
     * @notice Player resigns, awarding victory and the pot to the opponent.
     */
    function resign(uint256 gameId) external onlyPlayer(gameId) {
        Game storage game = games[gameId];
        require(game.state == GameState.ACTIVE, "Game is not active");

        address winner = (msg.sender == game.whitePlayer)
            ? game.blackPlayer
            : game.whitePlayer;
        GameState endState = (winner == game.whitePlayer)
            ? GameState.WHITE_WON
            : GameState.BLACK_WON;

        _finishGame(gameId, winner, endState);
    }

    /**
     * @notice Offers a draw to the opponent.
     */
    function offerDraw(uint256 gameId) external onlyPlayer(gameId) {
        Game storage game = games[gameId];
        require(game.state == GameState.ACTIVE, "Game is not active");
        require(game.drawOfferFrom == address(0), "Draw already offered");

        game.drawOfferFrom = msg.sender;
        emit DrawOffered(gameId, msg.sender);
    }

    /**
     * @notice Accepts a pending draw offer from the opponent.
     */
    function acceptDraw(uint256 gameId) external onlyPlayer(gameId) {
        Game storage game = games[gameId];
        require(game.state == GameState.ACTIVE, "Game is not active");
        require(game.drawOfferFrom != address(0), "No active draw offer");
        require(
            game.drawOfferFrom != msg.sender,
            "Cannot accept own draw offer"
        );

        _finishGame(gameId, address(0), GameState.DRAW);
    }

    /**
     * @notice Claims victory if the opponent exceeded the allowed time per move.
     */
    function claimTimeout(uint256 gameId) external onlyPlayer(gameId) {
        Game storage game = games[gameId];
        require(game.state == GameState.ACTIVE, "Game is not active");
        require(game.timePerMove > 0, "No timer configured for this game");
        require(msg.sender != game.currentTurn, "Opponent is not timed out");
        require(
            block.timestamp > game.lastMoveTimestamp + game.timePerMove,
            "Move timer has not expired"
        );

        GameState endState = (msg.sender == game.whitePlayer)
            ? GameState.WHITE_WON
            : GameState.BLACK_WON;

        _finishGame(gameId, msg.sender, endState);
    }

    /**
     * @notice Cancels an open game before any opponent joins, refunding the wager.
     */
    function cancelGame(uint256 gameId) external {
        Game storage game = games[gameId];
        require(
            game.state == GameState.WAITING_FOR_OPPONENT,
            "Cannot cancel active/finished game"
        );
        require(msg.sender == game.creator, "Only creator can cancel");

        game.state = GameState.CANCELLED;
        uint256 refund = game.wager;
        game.totalPot = 0;

        if (refund > 0) {
            (bool success, ) = payable(game.creator).call{value: refund}("");
            require(success, "Refund transfer failed");
        }

        emit GameCancelled(gameId, msg.sender);
    }

    /**
     * @notice Allows a player to record their solo practice / AI match score on-chain.
     */
    function recordPracticeScore(uint256 score, uint8 difficulty) external {
        _initPlayer(msg.sender);
        PlayerStats storage stats = playerStats[msg.sender];
        if (score > stats.highScore) {
            stats.highScore = score;
        }
        stats.totalGames++;
        emit ScoreRecorded(msg.sender, score, difficulty);
    }

    /**
     * @dev Internal helper to finalize match state, distribute funds, and update scores/ratings.
     */
    function _finishGame(
        uint256 gameId,
        address winner,
        GameState endState
    ) internal {
        Game storage game = games[gameId];
        game.state = endState;
        uint256 pot = game.totalPot;
        game.totalPot = 0;

        address p1 = game.whitePlayer;
        address p2 = game.blackPlayer;
        _initPlayer(p1);
        _initPlayer(p2);

        PlayerStats storage s1 = playerStats[p1];
        PlayerStats storage s2 = playerStats[p2];

        s1.totalGames++;
        s2.totalGames++;

        if (endState == GameState.DRAW) {
            s1.draws++;
            s2.draws++;
            s1.rating += 5;
            s2.rating += 5;

            uint256 half = pot / 2;
            if (half > 0) {
                (bool res1, ) = payable(p1).call{value: half}("");
                (bool res2, ) = payable(p2).call{value: half}("");
                require(res1 && res2, "Draw payout failed");
            }
            emit GameOver(gameId, address(0), GameState.DRAW, half * 2);
        } else {
            address loser = (winner == p1) ? p2 : p1;
            PlayerStats storage winnerStats = playerStats[winner];
            PlayerStats storage loserStats = playerStats[loser];

            winnerStats.wins++;
            winnerStats.rating += 25;
            winnerStats.totalWinnings += pot;

            loserStats.losses++;
            if (loserStats.rating > 20) {
                loserStats.rating -= 20;
            }

            if (pot > 0 && winner != address(0)) {
                (bool s, ) = payable(winner).call{value: pot}("");
                require(s, "Winner payout failed");
            }

            emit RatingUpdated(winner, winnerStats.rating, winnerStats.wins, winnerStats.losses);
            emit GameOver(gameId, winner, endState, pot);
        }
    }

    // --- VIEW / LEADERBOARD FUNCTIONS ---

    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        if (!_isKnownPlayer[player]) {
            return PlayerStats({
                playerAddress: player,
                wins: 0,
                losses: 0,
                draws: 0,
                rating: 1200,
                totalWinnings: 0,
                totalGames: 0,
                highScore: 0
            });
        }
        return playerStats[player];
    }

    function getTotalPlayers() external view returns (uint256) {
        return allPlayers.length;
    }

    /**
     * @notice Returns player stats for all registered players for the leaderboard.
     */
    function getLeaderboard(uint256 limit)
        external
        view
        returns (PlayerStats[] memory)
    {
        uint256 total = allPlayers.length;
        if (total == 0) {
            return new PlayerStats[](0);
        }

        uint256 count = limit > total ? total : limit;
        PlayerStats[] memory result = new PlayerStats[](count);

        for (uint256 i = 0; i < count; i++) {
            result[i] = playerStats[allPlayers[i]];
        }

        return result;
    }

    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }

    function getGameCount() external view returns (uint256) {
        return _gameIdCounter;
    }

    function getRecentGames(uint256 limit)
        external
        view
        returns (Game[] memory)
    {
        uint256 total = _gameIdCounter;
        if (total == 0) {
            return new Game[](0);
        }

        uint256 count = limit > total ? total : limit;
        Game[] memory result = new Game[](count);

        for (uint256 i = 0; i < count; i++) {
            result[i] = games[total - i];
        }

        return result;
    }
}
