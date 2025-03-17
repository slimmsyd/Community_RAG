import { useState, useEffect } from "react";
import { UserDetails } from "@/app/dashboard/types";
import { useSession } from "next-auth/react";

export const useUserDetails = () => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/fetchUserDetails?email=${session?.user?.email}`
      );
      if (response.ok) {
        const data = await response.json();
        setUserDetails(data);
      } else {
        setError("Failed to fetch user details");
      }
    } catch (err) {
      setError("An error occurred while fetching user details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchUserDetails();
    }
  }, [session]);

  return { userDetails, isLoading, error, fetchUserDetails };
}; 