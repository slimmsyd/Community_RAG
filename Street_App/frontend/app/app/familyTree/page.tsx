"use client"

import { useRouter, usePathname } from 'next/navigation';
import { FamilyTree } from '@/components/FamilyTree';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { RightDashboard } from '@/components/RightDashboard';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Input } from '@/components/ui/input';
import { Search, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
export default function FamilyTreePage() {
  const { data: session } = useSession();
  
  const router = useRouter();
  const pathname = usePathname();
  const currentMember = pathname.split('/').pop() || 'me';
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTotalUsers = useCallback(async () => {
    try {
      // Add timestamp to URL to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/users/all?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        console.log('Total users fetched:', data.users.length);
        setTotalUsers(data.users.length);
      } else {
        console.error('Failed to fetch users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching total users:', error);
    }
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchTotalUsers();
    await fetchUserDetails();
    setIsRefreshing(false);
  };
  useEffect(() => {
    refreshData();
  }, []);

  const fetchUserDetails = async () => {
    console.log("Fetching user details");
    setIsLoading(true);
    try {
      const email = session?.user?.email;
        const walletAddress = session?.user?.walletAddress; // Using address from useAccount
      
      console.log("User auth details:", { email, walletAddress });
      
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

      console.log("User details response:", data);

      if (data.success) {
        setUserDetails(data);
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
            setUserDetails(updateData);
          }
        }
      } else {
        console.error("Failed to fetch user:", data.error);
        // Create a minimal user object for new users
        setUserDetails({
          exists: false,
          user: {
            id: "",
            email: email || "",
            walletAddress: walletAddress || "",
            name: "User",
            milestones: [],
          },
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUserDetails(null);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchTotalUsers();
    if (session?.user?.email) {
      fetchUserDetails();
    }

    // Poll more frequently (every 10 seconds) to keep counts in sync
    const intervalId = setInterval(fetchTotalUsers, 10000);

    return () => clearInterval(intervalId);
  }, [session, fetchTotalUsers]);

  const handleNodeClick = (nodeId: string) => {
    router.push(`/app/familyTree/${nodeId}`);
  };

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };

  const handleInvite = () => {
    // Handle invite functionality
    console.log('Invite clicked');
  };

  const handleSendMessage = () => {
    // Handle sending message
    console.log('Message clicked');
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <DashboardSidebar
        activePage="familyTree"
        onNavigate={handleNavigation}
        userName={userDetails?.user?.name?.split(" ")[0] || "User"}
        userAvatar={userDetails?.user?.profileImage || ""}
        rewardPoints={10}
      />
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={80} minSize={30} className="flex-1">
          <div className="container mx-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-violet-50 to-white p-6 rounded-2xl shadow-sm border border-violet-100/20 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-zinc-600 text-sm font-medium">Street Members</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshData}
                    disabled={isRefreshing}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className={`h-4 w-4 text-zinc-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-violet-600">{totalUsers}</span>
                  <span className="text-green-500 text-sm">Active</span>
                </div>
                <p className="text-zinc-500 text-xs mt-2">Active members in the network</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-white shadow-lg" style={{ height: 'calc(100vh - 280px)' }}>
              <FamilyTree 
                currentPage={currentMember}
                onNodeClick={handleNodeClick}
                className="w-full h-full"
                userProfileImage={userDetails?.user?.profileImage}
              />
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="hidden md:flex bg-zinc-100 border-l border-r border-zinc-200" />
        
        <ResizablePanel defaultSize={20} minSize={25} maxSize={30} className="hidden md:block">
          <RightDashboard
            userName={userDetails?.user?.name?.split(' ')[0] || "User"}
            userAvatar={userDetails?.user?.profileImage || ""}
            userRole={userDetails?.user?.familyRole || "Member"}
            familyMemberCount={totalUsers}
            onInvite={handleInvite}
            onSendMessage={handleSendMessage}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
} 