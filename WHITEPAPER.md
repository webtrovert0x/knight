# Knight: Decentralized On-Chain Chess & PvP Wagering Protocol

**Technical Whitepaper v1.0**  
**Network:** BOT Chain (Chain ID: `677`)  
**Contract Address:** `0x32546D587F052e775642390370beE2cE55F327B3`  
**Repository:** [https://github.com/webtrovert0x/knight](https://github.com/webtrovert0x/knight)  

---

## 1. Abstract

Knight is a decentralized, non-custodial chess protocol deployed on BOT Chain that merges the timeless strategy of classical chess with immutable smart contract execution. By integrating escrow-backed peer-to-peer (PvP) wagering, on-chain state verification, anti-griefing timeout enforcement, an AI practice arena, and an on-chain ELO rating and leaderboard system, Knight eliminates trusted intermediaries, payout disputes, and match abandonment in competitive online chess.

---

## 2. Problem Statement

Traditional online chess platforms (Web2) and early Web3 gaming implementations suffer from fundamental limitations:

1. **Custodial Risk & Counterparty Default**: Centralized wagering platforms control user funds, subject players to withdrawal delays, high rake fees, and the risk of platform insolvency.
2. **Player Griefing & Stalling**: In time-controlled matches, losing players often abandon games or stall indefinitely, forcing opponents to wait out long timers without automated on-chain penalty enforcement.
3. **Ephemeral & Fragmented Reputation**: Player ratings and historical records are locked within proprietary walled gardens, preventing players from owning their competitive gaming identity.
4. **Friction in Web3 Onboarding**: Complex wallet interfaces and sluggish transaction finality frequently degrade gameplay responsiveness.

---

## 3. The Knight Solution

Knight addresses these challenges through a modular smart contract architecture paired with an optimized client-side chess engine and universal Web3 wallet integration:

- **Non-Custodial Escrow**: Wagers in native `BOT` tokens are locked in the `ChessGame` smart contract at match initialization and released atomically to the victor upon checkmate or resignation.
- **On-Chain Move & State Tracking**: Board states (FEN notation), move indices, and turn timestamps are verifiable directly on-chain.
- **Deterministic Timeout Enforcement**: If an opponent exceeds the allowable move time limit (default: 5 minutes), the waiting player can trigger an on-chain `claimTimeoutVictory()` function to claim the entire pot.
- **Immutable ELO Rating System**: Every completed match calculates dynamic ELO adjustments directly in Solidity, ranking players on a public global leaderboard.
- **Single-Player Practice with On-Chain Sync**: Players can hone skills offline against an adaptive AI engine and commit verifiable high scores on-chain.

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                       │
│  Next.js App Router (TSX) + Viem / Wagmi v2 + Reown AppKit  │
└──────────────┬───────────────────────────────▲──────────────┘
               │ RPC Requests (Read/Write)     │ Events & Sync
               ▼                               │
┌─────────────────────────────────────────────────────────────┐
│                 BOT Chain (Chain ID: 677)                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           ChessGame Smart Contract (v0.8.24)          │  │
│  │                                                       │  │
│  │  • Match Creation & Wager Escrow                      │  │
│  │  • Turn & Move Verification (FEN State)               │  │
│  │  • Timeout Enforcement & Forfeiture Logic             │  │
│  │  • ELO Calculation & Rating State Machine             │  │
│  │  • Global Leaderboard Registry                        │  │
│  │  • High Score Tracking Engine                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 4.1 Smart Contract Layer (`ChessGame.sol`)

The core contract is built with Solidity `0.8.24` and compiled with optimizer runs set to `200`. It enforces game state integrity, escrow safety, and access control.

#### Core Data Structures

```solidity
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
    uint256 rating;        // Initial baseline: 1200 ELO
    uint256 totalWinnings; // In BOT wei
    uint256 totalGames;
    uint256 highScore;     // Practice high scores
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
    uint256 moveTimeLimit; // Default: 300 seconds (5 min)
    address currentTurn;
    GameState state;
    address winner;
    address drawOfferedBy;
}
```

---

## 5. Protocol Mechanics & Game Flow

### 5.1 Match Creation & Escrow Deposit
1. **Host** calls `createGame(wagerAmount, moveTimeLimit)` with `msg.value == wagerAmount`.
2. Contract assigns match ID, sets state to `WAITING_FOR_OPPONENT`, locks funds in escrow, and registers initial FEN (`rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`).
3. If no opponent joins, the creator can call `cancelGame()` to receive a full refund.

### 5.2 Match Joining
1. **Challenger** calls `joinGame(gameId)` with matching `msg.value == wagerAmount`.
2. Total pot becomes `2 * wagerAmount`.
3. Contract initializes turn clock and marks state as `ACTIVE`.

### 5.3 Move Execution & State Transitions
1. The player whose turn matches `currentTurn` executes moves.
2. The client validates standard chess rules (check, checkmate, stalemate, castling, en passant, pawn promotion) and broadcasts `makeMove(gameId, newFen, moveNotation, isGameOver, isDraw, winner)`.
3. Contract validates caller authorization, updates `fen`, increments `moveCount`, resets `lastMoveTimestamp`, and toggles `currentTurn`.

### 5.4 Resolution & Payout Distribution
- **Checkmate / Resignation**: Contract transfers `totalPot` directly to the `winner` address and executes ELO rating adjustments.
- **Draw (Agreement / Stalemate)**: Both players receive their initial wagers (`wagerAmount`) back in full.
- **Timeout Claim**: If `block.timestamp > lastMoveTimestamp + moveTimeLimit`, the non-stalling player calls `claimTimeoutVictory(gameId)` to receive the entire pot.

---

## 6. On-Chain ELO Rating Model

Knight implements a simplified, gas-efficient on-chain ELO rating algorithm:

- **Baseline Rating**: New players initialize at `1200` ELO points.
- **K-Factor**: Dynamic weighting based on match outcome:
  - **Win**: Victor gains `+25` ELO points; Loser loses `-20` ELO points (with a floor of `100` ELO).
  - **Draw**: Higher rated player loses `5` points, lower rated player gains `5` points, or no change if equal.
- **Leaderboard Indexing**: An address array tracks all unique participants and sorts top-ranking players on-chain.

---

## 7. Security & Risk Mitigation

- **Reentrancy Protection**: All payout mechanisms follow the Checks-Effects-Interactions pattern and incorporate internal reentrancy locks.
- **Strict Turn Enforcement**: Moves and draw agreements can only be signed and submitted by the respective active player addresses.
- **Zero Custodial Escrow**: The smart contract does not hold administrative withdrawal keys; funds can only exit through deterministic game outcomes, cancellations, or timeout claims.
- **Formal Verification & Open Source**: The contract source code is flattened, verified, and publicly auditable on BotScan.

---

## 8. Network & Deployment Specifications

| Specification | Value |
| :--- | :--- |
| **Network Name** | **BOT Chain** |
| **Chain ID** | `677` |
| **RPC Endpoint** | `https://rpc.botchain.ai` |
| **Native Currency** | `BOT` |
| **Block Explorer** | [https://scan.botchain.ai](https://scan.botchain.ai) |
| **Contract Address** | [`0x32546D587F052e775642390370beE2cE55F327B3`](https://scan.botchain.ai/address/0x32546D587F052e775642390370beE2cE55F327B3#code) |
| **Verification Status** | Fully Verified (Solidity `0.8.24`, Optimizer: `200` runs) |

---

## 9. Future Roadmap

- **Phase 1 (Completed)**: Core game contracts, escrow wagering, timeout protection, Next.js frontend, AI arena, BotScan verification on BOT Chain Mainnet.
- **Phase 2**: Gasless meta-transactions (EIP-712 / ERC-4337 Account Abstraction) to allow zero-gas move submissions.
- **Phase 3**: Decentralized Swiss-system tournament bracket contracts with automated prize pool distribution.
- **Phase 4**: Soulbound Achievement Tokens (SBTs) and NFT skins for chess pieces and customized boards.
- **Phase 5**: Spectator Prediction Pools & Decentralized Guild Tournaments.

---

## 10. Conclusion

Knight establishes an open, trustless standard for competitive board games in Web3. By combining deterministic on-chain execution with intuitive user experience, Knight provides chess enthusiasts with verifiable ownership of their ratings, fair wagering conditions, and an un-cheatable gaming arena on BOT Chain.

