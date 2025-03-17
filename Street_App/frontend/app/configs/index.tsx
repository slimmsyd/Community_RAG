"use client";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";

import { cookieStorage, createStorage } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { base } from "viem/chains";

// Get projectId at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;

// Add debug logging
console.log('Project ID:', process.env.NEXT_PUBLIC_PROJECT_ID);
console.log('All env vars:', process.env);

if (!projectId) {
  throw new Error("Project ID is not defined");
}

const metadata = {
  name: "Kinnected",
  description:
    "You Will Remember.You will Never Forget. Kinnected through generations and generations to come.",
  url: "https://web3modal.com", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

const chains = [base] as const;
// Create wagmiConfig
const connectors = [
  coinbaseWallet({
    appName: "Kinnected Forever", // Customize app name for Coinbase Wallet
    
    // Ensure that chains are passed to the connector
  }),
];

export const config = defaultWagmiConfig({
  chains,
  connectors,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
