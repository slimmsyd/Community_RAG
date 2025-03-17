import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WalletUtils, ArweaveKeyfile } from '@/lib/arweave/walletUtils';

interface ArweaveWalletConnectProps {
    onConnect: (wallet: { address: string; key: ArweaveKeyfile }) => void;
}

export function ArweaveWalletConnect({ onConnect }: ArweaveWalletConnectProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsConnecting(true);
        setError(null);

        try {
            const fileContent = await file.text();
            const key = JSON.parse(fileContent) as ArweaveKeyfile;
            const address = await WalletUtils.getWalletAddress(key);
            
            onConnect({ address, key });
        } catch (err) {
            setError('Invalid wallet file');
            console.error('Wallet connection error:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleCreateWallet = async () => {
        setIsConnecting(true);
        setError(null);

        try {
            const wallet = await WalletUtils.generateWallet();
            
            // Create a download link for the wallet file
            const blob = new Blob([JSON.stringify(wallet.key)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'arweave-wallet.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            onConnect(wallet);
        } catch (err) {
            setError('Failed to create wallet');
            console.error('Wallet creation error:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
                <Button
                    onClick={() => document.getElementById('wallet-file')?.click()}
                    disabled={isConnecting}
                >
                    Connect Existing Wallet
                </Button>
                <input
                    id="wallet-file"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                />
                <Button
                    onClick={handleCreateWallet}
                    disabled={isConnecting}
                >
                    Create New Wallet
                </Button>
            </div>
            {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            <p className="text-xs text-zinc-500 text-center">
                Your wallet file contains your private key. Never share it with anyone.
            </p>
        </div>
    );
} 