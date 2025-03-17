'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import dynamic from 'next/dynamic';

require('@solana/wallet-adapter-react-ui/styles.css');

const WalletComponent: FC<{ children: ReactNode }> = ({ children }) => {
    // You can also provide a custom RPC endpoint
    const endpoint = useMemo(() => clusterApiUrl('devnet'), []);

    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

// Dynamically import the wallet component to avoid SSR issues
const SolanaWalletProvider = dynamic(
    () => Promise.resolve(WalletComponent),
    { ssr: false }
);

export default SolanaWalletProvider; 