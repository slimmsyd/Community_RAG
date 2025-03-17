"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Check, RefreshCw, ChevronRight, User, Wallet, Key } from "lucide-react";
import { useAccount, useDisconnect } from 'wagmi';
import { useWeb3Modal } from "@web3modal/wagmi/react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

interface UserDetails {
  exists: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    profileImage?: string;
    apiKey?: string;
    walletAddress?: string;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    walletAddress: "",
  });

  useEffect(() => {
    setMounted(true);
    fetchUserDetails();
  }, []);

  useEffect(() => {
    if (userDetails) {
      setFormData({
        name: userDetails.user.name || "",
        email: userDetails.user.email || "",
        walletAddress: userDetails.user.walletAddress || "",
      });
    }
  }, [userDetails]);

  const fetchUserDetails = async () => {
    try {
      // In a real implementation, this would be an API call
      // For now, we'll use mock data
      const mockUserDetails: UserDetails = {
        exists: true,
        user: {
          id: "user123",
          email: session?.user?.email || "user@example.com",
          name: session?.user?.name || "User Name",
          profileImage: session?.user?.image || undefined,
          apiKey: "sk_live_51NXhGkDJ7xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          walletAddress: address || "",
        },
      };
      
      setUserDetails(mockUserDetails);
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details");
    }
  };

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real implementation, this would be an API call
      // For now, we'll just update the local state
      setUserDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          user: {
            ...prev.user,
            name: formData.name,
            email: formData.email,
            walletAddress: formData.walletAddress,
          },
        };
      });
      
      setIsEditMode(false);
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Error saving user details:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to current user details
    if (userDetails) {
      setFormData({
        name: userDetails.user.name || "",
        email: userDetails.user.email || "",
        walletAddress: userDetails.user.walletAddress || "",
      });
    }
    setIsEditMode(false);
  };

  const handleGenerateNewApiKey = async () => {
    setIsGeneratingKey(true);
    try {
      // In a real implementation, this would be an API call
      // For now, we'll just generate a mock key
      const newApiKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      setUserDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          user: {
            ...prev.user,
            apiKey: newApiKey,
          },
        };
      });
      
      toast.success("New API key generated");
    } catch (error) {
      console.error("Error generating API key:", error);
      toast.error("Failed to generate new API key");
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const copyApiKey = () => {
    if (userDetails?.user.apiKey) {
      navigator.clipboard.writeText(userDetails.user.apiKey);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
      toast.success("API key copied to clipboard");
    }
  };

  const handleConnectWallet = async () => {
    try {
      await open();
    } catch (error) {
      console.error('Failed to open Web3Modal:', error);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <DashboardSidebar
        activePage="settings"
        onNavigate={handleNavigation}
        userName={userDetails?.user?.name?.split(" ")[0] || "User"}
        userAvatar={userDetails?.user?.profileImage || ""}
        rewardPoints={10}
      />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col space-y-2 mb-10">
            <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
            <p className="text-gray-500">
              Manage your account preferences and API access
            </p>
          </div>
          
          {/* Profile Section */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <User className="h-5 w-5 text-[#2BAC3E] mr-2" />
              <h2 className="text-xl font-medium text-gray-900">Profile</h2>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16 border-2 border-[#2BAC3E]/10">
                    {userDetails?.user?.profileImage ? (
                      <AvatarImage 
                        src={userDetails.user.profileImage} 
                        alt={userDetails.user.name} 
                      />
                    ) : (
                      <AvatarFallback className="bg-[#2BAC3E]/10 text-[#2BAC3E]">
                        {userDetails?.user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {userDetails?.user?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {userDetails?.user?.email}
                    </p>
                  </div>
                </div>
                
                {!isEditMode ? (
                  <Button
                    onClick={() => setIsEditMode(true)}
                    variant="outline"
                    className="text-[#2BAC3E] border-[#2BAC3E] hover:bg-[#2BAC3E]/5"
                  >
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="text-gray-500"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-[#2BAC3E] hover:bg-[#1F8A2F] text-white"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="p-6 space-y-6">
                <div className="grid gap-4">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={!isEditMode}
                    className={`bg-white border ${isEditMode ? 'border-gray-300' : 'border-transparent bg-gray-50'} rounded-lg`}
                  />
                </div>
                
                <div className="grid gap-4">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={!isEditMode}
                    className={`bg-white border ${isEditMode ? 'border-gray-300' : 'border-transparent bg-gray-50'} rounded-lg`}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Wallet Section */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Wallet className="h-5 w-5 text-[#2BAC3E] mr-2" />
              <h2 className="text-xl font-medium text-gray-900">Wallet</h2>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">Connected Wallet</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Connect your wallet to interact with blockchain features
                    </p>
                  </div>
                  
                  <Button
                    variant={isConnected ? "outline" : "default"}
                    onClick={isConnected ? handleDisconnectWallet : handleConnectWallet}
                    className={isConnected 
                      ? "text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50" 
                      : "bg-[#2BAC3E] hover:bg-[#1F8A2F] text-white"}
                  >
                    {isConnected ? "Disconnect" : "Connect Wallet"}
                  </Button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="text-sm font-mono text-gray-700 truncate max-w-md">
                    {isConnected 
                      ? `${address?.slice(0, 10)}...${address?.slice(-8)}` 
                      : "No wallet connected"}
                  </div>
                  
                  {isConnected && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-xs text-green-600 font-medium">Connected</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-base font-medium text-gray-900">Primary Wallet Address</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    This address will be used for transactions and verifications
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Input
                    id="walletAddress"
                    value={formData.walletAddress}
                    onChange={(e) => handleInputChange("walletAddress", e.target.value)}
                    disabled={!isEditMode}
                    placeholder="Enter wallet address manually"
                    className={`flex-1 bg-white border ${isEditMode ? 'border-gray-300' : 'border-transparent bg-gray-50'} rounded-lg font-mono text-sm`}
                  />
                  
                  {isEditMode && isConnected && (
                    <Button
                      onClick={() => handleInputChange("walletAddress", address || "")}
                      className="bg-[#2BAC3E] hover:bg-[#1F8A2F] text-white whitespace-nowrap"
                    >
                      Use Connected
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* API Key Section */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Key className="h-5 w-5 text-[#2BAC3E] mr-2" />
              <h2 className="text-xl font-medium text-gray-900">API Access</h2>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">API Key</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Your secret key for accessing the Street Economics API
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showApiKey}
                        onCheckedChange={setShowApiKey}
                        id="show-api-key"
                      />
                      <Label htmlFor="show-api-key" className="text-sm text-gray-600">
                        Show
                      </Label>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={handleGenerateNewApiKey}
                      disabled={isGeneratingKey}
                      className="whitespace-nowrap"
                    >
                      {isGeneratingKey ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate New Key"
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="relative">
                  <Input
                    value={userDetails?.user?.apiKey || "No API key generated"}
                    readOnly
                    type={showApiKey ? "text" : "password"}
                    className="pr-10 font-mono text-sm bg-gray-50 border-transparent"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
                    onClick={copyApiKey}
                    disabled={!userDetails?.user?.apiKey}
                  >
                    {hasCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="mt-6 bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">Important</h3>
                      <div className="mt-2 text-sm text-amber-700">
                        <p>
                          Generating a new API key will invalidate your existing key. Any applications using the old key will stop working immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Account Actions */}
          <div className="mb-6">
            <div className="flex items-center mb-6">
              <h2 className="text-xl font-medium text-gray-900">Account</h2>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <Button
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full justify-center text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}