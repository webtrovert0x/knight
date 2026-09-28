# ♟️ Knight (BOT Chain)

Decentralized, trustless PvP Chess game powered by smart contracts on **BOT Chain** (Chain ID: `677`, Native Token: `BOT`).

---

## 📁 Project Structure

```
onchain-chess/
├── contracts/               # Solidity Smart Contracts & Hardhat suite
│   ├── contracts/
│   │   └── ChessGame.sol   # Wager escrow, matchmaking, move tracker, timeouts & payouts
│   ├── scripts/
│   │   └── deploy.js       # Deploy script targeting BOT Chain Mainnet
│   ├── test/
│   │   └── ChessGame.test.js # Comprehensive unit tests
│   ├── hardhat.config.js   # BOT Chain Mainnet RPC & Network config
│   └── package.json
│
└── frontend/                # Web3 Chess DApp (Next.js App Router + TypeScript + TailwindCSS)
    ├── src/
    │   ├── config/         # BOT Chain viem definition & Reown AppKit setup
    │   ├── components/     # ChessboardView, GameLobby, GamePanel, PracticeGame, Navbar
    │   ├── hooks/          # useChessContract for real-time state sync & tx handling
    │   ├── utils/          # Web Audio synthesized sound effects
    │   └── contracts/      # ABI and contract interfaces
    ├── package.json
    └── next.config.mjs
```

---

## ⚙️ Network Details

- **Network Name**: BOT Chain
- **Chain ID**: `677`
- **RPC Endpoint**: `https://rpc.botchain.ai`
- **Native Token Symbol**: `BOT`
- **Block Explorer**: [https://scan.botchain.ai/](https://scan.botchain.ai/)
- **Deployed Contract**: `0x32546D587F052e775642390370beE2cE55F327B3` ([Verified on BotScan](https://scan.botchain.ai/address/0x32546D587F052e775642390370beE2cE55F327B3#code))

---

## 🚀 Quick Start

### 1. Smart Contracts

```bash
cd contracts
npm install

# Run unit tests
npx hardhat test

# Deploy to BOT Chain Mainnet
# (Requires PRIVATE_KEY with BOT in .env)
npx hardhat run scripts/deploy.js --network botchain_mainnet
```

### 2. Frontend Application

```bash
cd frontend
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

---

## 🌟 Key Features

1. **On-Chain Matchmaking & Wagers**: Create custom matches with native BOT token wagers locked in escrow. Winner takes the pot!
2. **Interactive SVG Board**: Zero-lag drag & drop / click-to-move, legal move highlights, check indicators, pawn promotions, and sound effects.
3. **Reown AppKit + Wagmi v2**: Connect with MetaMask, Rabby, Coinbase Wallet, WalletConnect, and all EVM wallets.
4. **Anti-Griefing Timers**: Claim timeout victories if the opponent abandons the game or exceeds the move limit.
5. **Offline AI Practice Arena**: Play against built-in AI bot engine with multiple difficulty levels (Easy, Medium, Hard).
