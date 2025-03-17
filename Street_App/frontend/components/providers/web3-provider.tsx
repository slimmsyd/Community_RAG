'use client';

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { mainnet } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID) {
  throw new Error('You need to provide NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID env variable');
}

// 1. Get projectId
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!;

// 2. Create wagmiConfig
const metadata = {
  name: 'Street Network',
  description: 'Street Network Web3 App',
  url: 'https://streetnetwork.vercel.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const wagmiConfig = defaultWagmiConfig({
  chains: [mainnet],
  projectId,
  metadata
});

// 4. Create a client
const queryClient = new QueryClient();

function ClientWeb3Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    createWeb3Modal({
      wagmiConfig,
      projectId,
      defaultChain: mainnet,
      themeMode: 'dark'
    });
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return children;
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ClientWeb3Provider>
          {children}
        </ClientWeb3Provider>
      </QueryClientProvider>
    </WagmiConfig>
  );
} 