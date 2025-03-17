'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/navbar';
import { useAccount, useDisconnect, useEnsAddress } from "wagmi";
import React, { FC, RefObject } from "react";
import { useWeb3Modal } from "@web3modal/wagmi/react";


export default function NavWrapper() {
  const pathname = usePathname();
  
  if (pathname?.includes('dashboard') || pathname?.includes('readPDF') || pathname?.includes('settings') || pathname?.includes('app')) return null;
  return <Navbar />;
} 