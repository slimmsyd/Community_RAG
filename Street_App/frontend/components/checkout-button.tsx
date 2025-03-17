'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";


interface CheckoutButtonProps {
  userId: string;
  email: string;
  planType: 'STANDARD' | 'PRO';
}

export function CheckoutButton({ userId, email, planType }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    try {

  

      
      setLoading(true);
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
          planType: planType,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const { url } = await response.json();
      window.location.href = url;
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleCheckout}
      disabled={loading}
      className="bg-[#38D479]/[0.48] w-fit border border-[#38D479] border-[0.5px] hover:bg-[#38D479]/80 rounded-[40px]"
    >
      {loading ? <Spinner size={16} /> : `Subscribe to ${planType}`}
    </Button>
  );
}