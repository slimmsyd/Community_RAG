import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useAccount } from 'wagmi';

export interface UserProfile {
  exists: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    profileImage?: string;
    profileImageId?: string;
    occupation?: string;
    phoneNumber?: string;
    birthDay?: string;
    maritalStatus?: string;
    location?: string;
    gender?: string;
    bio?: string;
    interests?: string[];
    milestones?: any[];
    familyRole?: string;
    contributions?: string[];
    walletAddress?: string;
    discordTag?: string;
  };
}

export function useUserProfile() {
  const { data: session } = useSession();
  const { address, isConnected } = useAccount();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const email = session?.user?.email;
      const walletAddress = address;

      if (!email && !walletAddress) {
        console.log("No email or wallet address found");
        return;
      }

      // Determine which endpoint to use based on available credentials
      let endpoint;
      if (walletAddress) {
        endpoint = `/api/users/wallet/${encodeURIComponent(walletAddress)}`;
      } else if (email) {
        endpoint = `/api/users/email/${encodeURIComponent(email)}`;
      } else {
        throw new Error("No authentication method available");
      }

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        setUserProfile(data);
        // If we found a user by wallet but they don't have a wallet address saved, update it
        if (walletAddress && !data.user.walletAddress) {
          const updateResponse = await fetch(endpoint, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress,
            }),
          });
          const updateData = await updateResponse.json();
          if (updateData.success) {
            setUserProfile(updateData);
          }
        }
      } else {
        // Create minimal profile for new users
        setUserProfile({
          exists: false,
          user: {
            id: "",
            email: email || "",
            walletAddress: walletAddress || "",
            name: session?.user?.name || "User",
            milestones: [],
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user profile");
      console.error("Error fetching user profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.email || isConnected) {
      fetchUserProfile();
    }
  }, [session, isConnected]);

  return {
    userProfile,
    isLoading,
    error,
    refreshProfile: fetchUserProfile,
  };
} 