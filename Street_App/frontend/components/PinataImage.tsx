'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface PinataImageProps {
  src: string;
  alt: string;
  className?: string;
  initialAuthUrl?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}

export function PinataImage({ 
  src, 
  alt, 
  className, 
  initialAuthUrl,
  width = 80,
  height = 80,
  priority = false,
  onLoadingChange
}: PinataImageProps) {
  const [imageUrl, setImageUrl] = useState<string>(initialAuthUrl || src);
  const [isLoading, setIsLoading] = useState(!initialAuthUrl);
  const [retryCount, setRetryCount] = useState(0);

  // Function to get a new authenticated URL
  const refreshUrl = async () => {
    try {
      setIsLoading(true);
      onLoadingChange?.(true);

      // Extract CID from either /files/ or /ipfs/ path
      const cid = src.split('/files/')[1] || src.split('/ipfs/')[1];
      if (!cid) {
        console.warn('No CID found in URL:', src);
        return false;
      }

      const response = await fetch(`/api/pinata/authenticate?cid=${cid}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get authenticated URL');
      }

      const data = await response.json();
      
      if (data.success && data.url) {
        setImageUrl(data.url);
        setRetryCount(0);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Error refreshing URL:', error);
      return false;
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  // Initial URL fetch and periodic refresh (every 45 minutes)
  useEffect(() => {
    if (!initialAuthUrl) {
      refreshUrl();
    }

    // Set up refresh interval (45 minutes)
    const intervalId = setInterval(refreshUrl, 45 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [src, initialAuthUrl]);

  // Handle retry logic with exponential backoff
  useEffect(() => {
    if (retryCount > 0 && retryCount < 3) {
      const timeoutId = setTimeout(() => {
        refreshUrl();
      }, Math.pow(2, retryCount) * 1000); // Exponential backoff: 2s, 4s, 8s

      return () => clearTimeout(timeoutId);
    }
  }, [retryCount]);

  if (isLoading && !imageUrl) {
    console.log('isLoading', isLoading);
    console.log('imageUrl', imageUrl);
    return (
      <div 
        className={`${className} animate-pulse bg-gray-200`}
        style={{ width: width + 'px', height: height + 'px' }}
      />
    );
  }

  return (
    <div className="relative" style={{ width: width + 'px', height: height + 'px' }}>
      <Image
        src={imageUrl}
        alt={alt}
        className={`${className} object-cover transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={priority}
        onLoadingComplete={() => {
          setIsLoading(false);
          onLoadingChange?.(false);
        }}
        onError={() => {
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
          }
        }}
        unoptimized
      />
    </div>
  );
} 