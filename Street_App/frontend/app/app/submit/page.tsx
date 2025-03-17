"use client";

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Info, Twitter, Sparkles, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { RightDashboard } from "@/components/RightDashboard";
import { motion, AnimatePresence } from "framer-motion";

export default function CryptoSubmitPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { userProfile, isLoading: profileLoading } = useUserProfile();
  const [formData, setFormData] = useState({
    twitterHandle: '',
    specialty: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/crypto-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          submittedBy: userProfile?.user ? {
            id: userProfile.user.id,
            name: userProfile.user.name,
            email: userProfile.user.email
          } : undefined
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Submission failed');
      }

      setSubmitted(true);
      
      if (session?.user) {
        toast.success('Expert added! You earned 10 points for contributing! 🎉');
      } else {
        toast.success('Expert added! Sign in to earn points for your contributions! 🎉');
      }
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({ twitterHandle: '', specialty: '' });
        setSubmitted(false);
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <DashboardSidebar 
        activePage="submit" 
        onNavigate={handleNavigation}
        userName={userProfile?.user?.name?.split(" ")[0] || "User"}
        userAvatar={userProfile?.user?.profileImage || ""}
        rewardPoints={10}
      />
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={80} minSize={30} className="flex-1">
          <main className="flex-1 overflow-y-auto bg-[#F0EFFF]/10">
            <div className="container max-w-2xl mx-auto py-10 px-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-zinc-800">Submit Crypto Expert</h2>
                  <p className="text-sm text-zinc-600 mt-2">
                    Help us build a directory of crypto experts and thought leaders on Twitter.
                  </p>
                </div>

                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex gap-4 items-start">
                      <div className="p-3 bg-blue-500 text-white rounded-xl">
                        <Info className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-1">Why submit experts?</h3>
                        <p className="text-sm text-blue-700 leading-relaxed">
                          We're building a curated list of crypto experts to train our AI model and monitor market insights. 
                          Your contributions help improve our AI's ability to identify valuable crypto signals and knowledge.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                      <AnimatePresence mode="wait">
                        {!submitted ? (
                          <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                          >
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-800 flex items-center gap-2">
                                  <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                                  <span className="text-white">Expert's Twitter Handle</span>
                                </label>
                                <div className="relative">
                                  <Input
                                    value={formData.twitterHandle}
                                    onChange={(e) => setFormData({...formData, twitterHandle: e.target.value})}
                                    placeholder="@cryptoexpert"
                                    className="pl-8 bg-white border-zinc-200 focus:ring-[#3B35C3] focus:border-[#3B35C3]"
                                    required
                                  />
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">@</span>
                                </div>
                                <p className="text-[0.8rem] text-zinc-500">
                                  The Twitter handle of a notable crypto expert or influencer
                                </p>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-800 flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-yellow-500" />
                                  <span className="text-white">Area of Expertise</span>
                                </label>
                                <Input
                                  value={formData.specialty}
                                  onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                                  placeholder="Trading, DeFi, NFTs, Market Analysis..."
                                  className="bg-white border-zinc-200 focus:ring-[#3B35C3] focus:border-[#3B35C3]"
                                  required
                                />
                                <p className="text-[0.8rem] text-zinc-500">
                                  Their primary focus or expertise in the crypto space
                                </p>
                              </div>
                            </div>
                            {error && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 text-red-600 text-sm p-4 rounded-lg flex items-center gap-2"
                              >
                                <Info className="h-4 w-4 flex-shrink-0" />
                                {error}
                              </motion.div>
                            )}
                            <Button
                              type="submit"
                              className="w-full bg-[#3B35C3] hover:bg-[#2D2A9C] text-white font-medium py-6"
                              disabled={loading}
                            >
                              {loading ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Submitting...
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  Submit Expert
                                  <ArrowRight className="h-4 w-4" />
                                </div>
                              )}
                            </Button>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-8"
                          >
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                              <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-zinc-800 mb-2">Successfully Submitted!</h3>
                            <p className="text-zinc-600 text-center max-w-sm">
                              Thank you for contributing to our crypto expert directory. Your submission helps the community grow!
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </main>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="hidden md:flex bg-zinc-100 border-l border-r border-zinc-200" />
        
        <ResizablePanel defaultSize={20} minSize={25} maxSize={30} className="hidden md:block">
          <RightDashboard
            userName={userProfile?.user?.name?.split(" ")[0] || "User"}
            userAvatar={userProfile?.user?.profileImage || ""}
            userRole={userProfile?.user?.familyRole || "Member"}
            familyMemberCount={0}
            onInvite={() => {}}
            onSendMessage={() => {}}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
} 