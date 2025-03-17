"use client";

import Image from "next/image";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex flex-col items-center justify-center">
      <div className="relative w-32 h-32 mb-4">
        <Image
          src="/assets/HomeLogo.png"
          alt="Logo"
          fill
          className="object-contain animate-pulse"
        />
      </div>
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Setting up your family space</h2>
        <p className="text-gray-600">Just a moment while we get everything ready...</p>
        <div className="mt-4 flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#3B35C3] animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 rounded-full bg-[#3B35C3] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 rounded-full bg-[#3B35C3] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
} 