'use client';

import { DashboardSidebar } from '@/components/DashboardSidebar';
import { RightDashboard } from '@/components/RightDashboard';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Wallet, Share2, Users, Sparkles, ChevronRight } from 'lucide-react';
import { useRouter, usePathname } from "next/navigation";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useState, useEffect, useCallback } from 'react';    
import '@solana/wallet-adapter-react-ui/styles.css';
import Image from 'next/image';
import { useMintNFT } from '@/hooks/useMintNFT';
import { fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { COLLECTION_CONFIG } from "../../config/collection";
import { PublicKey } from '@solana/web3.js';

interface RecentMint {
  signature: string;
  wallet: string;
  timestamp: Date;
  mintNumber: number;
}

interface TransactionCost {
  feeInSOL: number | null;
  feeInUSD: string | null;
  solPrice: string | null;
}

// Add RPC endpoint constant at the top of the file after imports
const RPC_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=49c9ead2-a254-4550-b629-16a400348768';  // Replace with your Helius API key

export default function NFTMintPage() {
  const { data: session } = useSession();
  const [recentMints, setRecentMints] = useState<RecentMint[]>([]);
  const [collectionData, setCollectionData] = useState({
    totalSupply: 144000,
    mintedCount: 0,
    mintPrice: 0, // in SOL
    remainingSupply: 144000,
    uniqueHolders: 0,
    isLoading: false,
  });
  const [isMinting, setIsMinting] = useState(false);
  const [transactionCost, setTransactionCost] = useState<TransactionCost>({
    feeInSOL: null,
    feeInUSD: null,
    solPrice: null
  });

  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey: walletPublicKey, connected, disconnect } = wallet;
  const [mounted, setMounted] = useState(false);
  const { mintNFT, executeMint } = useMintNFT();

  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };

  const fetchCollectionData = useCallback(async () => {
    try {
      const umi = createUmi(RPC_ENDPOINT);
      const collectionMintKey = COLLECTION_CONFIG.address;
      
      console.log('Checking collection:', collectionMintKey);

      // First, let's check the collection NFT
      const collectionNft = await fetchDigitalAsset(umi, publicKey(collectionMintKey))
        .catch((error) => {
          console.error('Error fetching collection NFT:', error);
          return null;
        });

      if (!collectionNft) {
        console.log('No collection NFT found, showing default state');
        setCollectionData({
          totalSupply: COLLECTION_CONFIG.totalSupply,
          mintedCount: 0,
          mintPrice: 0,
          remainingSupply: COLLECTION_CONFIG.totalSupply,
          uniqueHolders: 0,
          isLoading: false,
        });
        return;
      }

      // Get all metadata accounts that match our collection
      const metadataProgramId = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
      let allMetadataAccounts = null;
      
      try {
        allMetadataAccounts = await connection.getProgramAccounts(
          metadataProgramId,
          {
            filters: [
              {
                memcmp: {
                  offset: 326,
                  bytes: collectionMintKey
                }
              },
              {
                dataSize: 679,
              }
            ]
          }
        );
      } catch (error) {
        console.error('Error fetching metadata accounts:', error);
      }

      if (!allMetadataAccounts) {
        setCollectionData({
          totalSupply: COLLECTION_CONFIG.totalSupply,
          mintedCount: 0,
          mintPrice: 0,
          remainingSupply: COLLECTION_CONFIG.totalSupply,
          uniqueHolders: 0,
          isLoading: false,
        });
        return;
      }

      console.log(`Found ${allMetadataAccounts.length} metadata accounts in collection`);

      const uniqueNFTs = new Set();
      const uniqueOwners = new Set();
      const nftDetails = [];

      // Process all metadata accounts
      for (const account of allMetadataAccounts) {
        try {
          const metadata = account.account.data;
          const name = new TextDecoder().decode(metadata.slice(66, 98)).replace(/\0/g, '').trim();
          const mintAddress = new PublicKey(metadata.slice(1, 33));
          
          // Get all token accounts for this mint
          let tokenAccounts = null;
          try {
            tokenAccounts = await connection.getTokenLargestAccounts(mintAddress);
          } catch (error) {
            console.error('Error fetching token accounts:', error);
            continue;
          }

          if (!tokenAccounts) continue;
          
          for (const tokenAccount of tokenAccounts.value) {
            let accountInfo = null;
            try {
              accountInfo = await connection.getParsedAccountInfo(tokenAccount.address);
            } catch (error) {
              console.error('Error fetching account info:', error);
              continue;
            }

            if (!accountInfo || !accountInfo.value || !('parsed' in accountInfo.value.data)) continue;

            const owner = accountInfo.value.data.parsed.info.owner;
            const amount = accountInfo.value.data.parsed.info.tokenAmount.amount;
            
            if (amount === '1') {
              uniqueOwners.add(owner);
              uniqueNFTs.add(mintAddress.toString());
              nftDetails.push({
                name,
                mint: mintAddress.toString(),
                owner,
                tokenAccount: tokenAccount.address.toString()
              });
            }
          }
        } catch (error) {
          console.error('Error processing metadata account:', error);
          continue;
        }
      }

      const mintedCount = uniqueNFTs.size;
      const remainingSupply = COLLECTION_CONFIG.totalSupply - mintedCount;
      const uniqueHoldersCount = uniqueOwners.size;
      
      console.log('Collection Stats:', {
        totalSupply: COLLECTION_CONFIG.totalSupply,
        mintedCount,
        remainingSupply,
        uniqueHoldersCount,
        uniqueOwners: Array.from(uniqueOwners),
        nftDetails
      });
      
      setCollectionData({
        totalSupply: COLLECTION_CONFIG.totalSupply,
        mintedCount,
        mintPrice: 0,
        remainingSupply,
        uniqueHolders: uniqueHoldersCount,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching collection data:', error);
      // Set default state on error
      setCollectionData({
        totalSupply: COLLECTION_CONFIG.totalSupply,
        mintedCount: 0,
        mintPrice: 0,
        remainingSupply: COLLECTION_CONFIG.totalSupply,
        uniqueHolders: 0,
        isLoading: false,
      });
    }
  }, [connection]);

  const fetchRecentMints = useCallback(async () => {
    try {
      // Get recent signatures for the collection on mainnet
      const signatures = await connection.getSignaturesForAddress(
        new PublicKey(COLLECTION_CONFIG.address),
        { limit: 5 }
      );

      console.log('Recent signatures from mainnet:', signatures);

      const recentMintsData = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0
            });
            
            if (!tx || !tx.blockTime) return null;

            // Get the sender's public key from the transaction
            const sender = tx.transaction.message.staticAccountKeys[0].toString();

            // Get more detailed information about the transaction
            console.log('Transaction details from mainnet:', {
              signature: sig.signature,
              blockTime: new Date(tx.blockTime * 1000),
              sender,
            });

            return {
              signature: sig.signature,
              wallet: sender,
              timestamp: new Date(tx.blockTime * 1000),
              mintNumber: collectionData.mintedCount - signatures.indexOf(sig)
            };
          } catch (error) {
            console.error('Error processing mainnet transaction:', sig.signature, error);
            return null;
          }
        })
      );

      const validMints = recentMintsData.filter((mint): mint is RecentMint => mint !== null);
      console.log('Valid recent mints from mainnet:', validMints);
      
      setRecentMints(validMints);
    } catch (error) {
      console.error('Error fetching recent mints from mainnet:', error);
    }
  }, [connection, collectionData.mintedCount]);

  // Helper function to format wallet address
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Initialize mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize data fetching
  const fetchData = useCallback(async () => {
    if (!mounted || !connection) return;

    try {
      console.log('Initializing data fetch...');
      setCollectionData(prev => ({ ...prev, isLoading: false }));
      
      await Promise.all([
        fetchCollectionData(),
        fetchRecentMints()
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
      setCollectionData(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  }, [mounted, connection, fetchCollectionData, fetchRecentMints]);

  // Set up data fetching and interval
  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const handleMint = async () => {
    if (!walletPublicKey) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // First get cost estimation
      const costEstimate = await mintNFT(wallet);

      if (!costEstimate.success) {
        throw costEstimate.error;
      }

      if (costEstimate.requiresConfirmation && costEstimate.costs) {
        const costs = costEstimate.costs;
        const confirmMessage = 
          `Transaction Cost Breakdown:\n\n` +
          `Network Fee: ${costs.networkFee} SOL\n` +
          `Rent Exemption: ${costs.rentExemption} SOL\n` +
          `Total Cost: ${costs.totalCostSOL} SOL` +
          (costs.totalCostUSD ? ` ($${costs.totalCostUSD})` : '') + '\n\n' +
          `Would you like to proceed with minting?`;

        const userConfirmed = window.confirm(confirmMessage);
        if (!userConfirmed) {
          console.log('Minting cancelled by user');
          return;
        }
      }

      // Proceed with actual minting
      setIsMinting(true);
      const mintResult = await executeMint(wallet);
      
      if (mintResult.success) {
        console.log('Mint successful:', {
          signature: mintResult.signature,
          mintAddress: mintResult.mintAddress
        });
        
        // Refresh data
        fetchCollectionData();
      } else {
        throw mintResult.error || new Error('Minting failed');
      }
    } catch (error: any) {
      console.error('Error minting NFT:', error);
      alert(error.message || 'Failed to mint NFT. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  // Add mounted check to the render
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2B6CB0]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA]">


        <DashboardSidebar 
        activePage="nftMint"
        userName={session?.user?.name || 'Guest'}
        onNavigate={handleNavigation}
        userAvatar={session?.user?.image || ''}
      />
    
      
      <main className="flex-1 overflow-y-auto">
        {collectionData.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2B6CB0]"></div>
          </div>
        ) : (
          <div className="container max-w-8xl mx-auto px-4 py-8">
            {/* Hero Section */}
            <div className="flex flex-col gap-4 mb-12">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-zinc-900 tracking-tight mb-2">SE The Last Supper</h1>
                  <p className="text-zinc-500">Proof Of Access</p>
                </div>
                <div className="flex gap-4 items-center">
                  <WalletMultiButton className="bg-[#2B6CB0] text-white hover:bg-[#2B6CB0]/90" />
                  {connected && (
                    <Button 
                      className="bg-[#2B6CB0] hover:bg-[#2C5282] text-white px-6 py-5 rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-105"
                      onClick={handleMint}
                    >
                      {isMinting ? 'Minting...' : 'Mint NFT'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Left Column */}
              <div className="space-y-6">
                <Card className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-square rounded-xl bg-[#EBF8FF] flex items-center justify-center mb-4">
                      <Image
                      src="/assets/StreeEconomics.png"
                      alt="NFT"
                      width={500}
                      height={500}
                      className="w-full h-full object-cover text-[#2B6CB0]" />
                    </div>
                    <div className="space-y-4 p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Price</span>
                        <span className="text-lg font-semibold text-zinc-900">
                          {collectionData.mintPrice === 0 ? 'FREE' : `${collectionData.mintPrice} SOL`}
                        </span>
                      </div>
                      {transactionCost.feeInSOL && (
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">Network Fee</span>
                          <span className="text-sm text-zinc-900">
                            {transactionCost.feeInSOL} SOL (${transactionCost.feeInUSD})
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Supply</span>
                        <span className="text-lg font-semibold text-zinc-900">{collectionData.totalSupply}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Remaining</span>
                        <span className="text-lg font-semibold text-zinc-900">{collectionData.remainingSupply}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#2B6CB0] to-[#4299E1] p-6 rounded-2xl border-0 text-white">
                  <h2 className="text-2xl font-semibold mb-4">Collection Benefits</h2>
                  <p className="text-white/90 leading-relaxed mb-4">
                    Each NFT represents proof of access to Street Economcis community.
                  </p>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Sparkles className="h-4 w-4" />
                    <span>Welcome To The Mob</span>
                  </div>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-[#EBF4FF] to-white p-6 rounded-2xl border-0">
                  <h2 className="text-2xl font-semibold text-zinc-900 mb-4">About This Collection</h2>
                  <p className="text-zinc-600 leading-relaxed mb-6">
                    Our NFT collection represents proof off access, proof of life, and proof of supprot to the Street Economics community. We welcome you for or Black history Month NFT collection gift to you. The goal is for new members who join to onboard in the ease of use to the blockchain ecosystem. We must be techno literate, in the new paradigm of financial and energetic movements.
                  </p>
                  <div className="flex items-center justify-between text-sm text-zinc-500 border-t border-zinc-100 pt-4">
                    <span>Current Holders: {collectionData.mintedCount}</span>
                    <span>Remaining: {collectionData.remainingSupply}</span>
                  </div>
                </Card>

                <div className="grid grid-cols-3 gap-4">
                  <Card className="group p-4 rounded-xl border-0 bg-white hover:shadow-md transition-all cursor-pointer">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-full bg-[#EBF8FF] mb-3 group-hover:bg-[#2B6CB0] transition-colors">
                        <Share2 className="h-5 w-5 text-[#2B6CB0] group-hover:text-white" />
                      </div>
                      <span className="text-sm font-medium text-zinc-900">Share</span>
                    </div>
                  </Card>
                  <Card className="group p-4 rounded-xl border-0 bg-white hover:shadow-md transition-all cursor-pointer">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-full bg-[#EBF8FF] mb-3 group-hover:bg-[#2B6CB0] transition-colors">
                        <Users className="h-5 w-5 text-[#2B6CB0] group-hover:text-white" />
                      </div>
                      <a href="https://discord.gg/W6JBgUVB" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-zinc-900 hover:text-[#2B6CB0] transition-colors">Join Discord</a>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* Bottom Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white rounded-xl border-0 p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-zinc-900">Recent Mints</h3>
                  <Button variant="ghost" size="sm" className="text-[#3B35C3]">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-4">
                  {recentMints.length > 0 ? (
                    recentMints.map((mint, index) => (
                      <div key={mint.signature} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F0EFFF] flex items-center justify-center">
                          <Users className="h-4 w-4 text-[#3B35C3]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-zinc-900">
                              {formatAddress(mint.wallet)}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {mint.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          <p className="text-xs text-zinc-500">
                            Minted #{mint.mintNumber}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-zinc-500 text-sm">
                      No recent mints
                    </div>
                  )}
                </div>
              </Card>

              <Card className="bg-white rounded-xl border-0 p-6 hover:shadow-md transition-all">
                
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Collection Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded bg-[#EBF8FF]/50">
                    <span className="text-sm text-zinc-600">Total Supply</span>
                    <span className="text-sm font-medium text-[#2B6CB0]">{collectionData.totalSupply}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#EBF8FF]/50">
                    <span className="text-sm text-zinc-600">Minted</span>
                    <span className="text-sm font-medium text-[#2B6CB0]">{collectionData.mintedCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#EBF8FF]/50">
                    <span className="text-sm text-zinc-600">Unique Holders</span>
                    <span className="text-sm font-medium text-[#2B6CB0]">{collectionData.uniqueHolders}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#EBF8FF]/50">
                    <span className="text-sm text-zinc-600">Floor Price</span>
                    <span className="text-sm font-medium text-[#2B6CB0]">FREE SOL</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-white rounded-xl border-0 p-6 hover:shadow-md transition-all">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">NFT Features</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded bg-[#EBF8FF]/50">
                    <div className="w-2 h-2 rounded-full bg-[#2B6CB0]" />
                    <p className="text-sm text-zinc-600">Acess to Street Economics</p>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded bg-[#EBF8FF]/50">
                    <div className="w-2 h-2 rounded-full bg-[#2B6CB0]" />
                    <p className="text-sm text-zinc-600">Proof of Support for future features</p>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded bg-[#EBF8FF]/50">
                    <div className="w-2 h-2 rounded-full bg-[#2B6CB0]" />
                    <p className="text-sm text-zinc-600">Early Access to digital products</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* <RightDashboard
        userName={session?.user?.name || 'Guest'}
        userAvatar={session?.user?.image || ''}
        userRole="Community Member"
        familyMemberCount={0}
        onInvite={() => {}}
        onSendMessage={() => {}}
      /> */}
    </div>
  );
} 