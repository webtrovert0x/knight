import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { botchainMainnet } from './chains';

// 1. Get projectId from environment or fallback
export const projectId =
  process.env.NEXT_PUBLIC_PROJECT_ID ||
  process.env.VITE_PROJECT_ID ||
  'c4f79cc821944d9680842e34466bfbd';

// 2. Metadata for Reown AppKit
const metadata = {
  name: 'Knight',
  description: 'Decentralized PvP Chess with On-Chain Scores & BOT Token Wagers on BOT Chain',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://botchain.ai',
  icons: ['/logo.png'],
};

// 3. Supported Networks
export const networks = [botchainMainnet] as const;

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks: [botchainMainnet],
  projectId,
  ssr: true,
});

// 5. Initialize AppKit Modal if on client side
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [botchainMainnet],
  defaultNetwork: botchainMainnet,
  metadata,
  projectId,
  features: {
    analytics: true,
    email: false,
    socials: [],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6366f1',
    '--w3m-border-radius-master': '12px',
  },
});

