import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import AuthProvider from '@/components/providers/session-provider';
import NavWrapper from '@/components/nav-wrapper';
import FooterWrapper from '@/components/footer-wrapper';
import { GoogleTagManager } from "@next/third-parties/google";
import SessionWrapper from '@/app/ProvidersWrapper';
import { validateEnv } from '@/utils/env';
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ['latin'] });

// Dynamically import the Solana wallet provider to avoid SSR issues
const SolanaWalletProvider = dynamic(
  () => import('@/app/contexts/SolanaWalletProvider'),
  { 
    ssr: false,
    loading: () => null
  }
);

// Validate environment variables
validateEnv();

export const metadata: Metadata = {
  title: 'Street Network',
  description: 'Connect with your community',
};

export default function RootLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <GoogleTagManager gtmId="G-F3F86GSCB4" />
        <SessionWrapper>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <SolanaWalletProvider>
              <div className="flex min-h-screen flex-col">
                <NavWrapper />
                <main className="flex-1">{children}</main>
              </div>
            </SolanaWalletProvider>
          </ThemeProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}