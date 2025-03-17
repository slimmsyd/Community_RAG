"use client" 


import { SessionProvider } from "next-auth/react"
import Web3ModalProvider from "./contexts/Web3Modal"
import React from 'react'

const SessionWrapper = ({children}: {children: React.ReactNode}) => { 
  
  return (
    <SessionProvider>
      <Web3ModalProvider>
        {children}
      </Web3ModalProvider>
    </SessionProvider>
  )


};

export default SessionWrapper