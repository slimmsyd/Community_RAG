'use client';

import { FundingProgress } from '@/components/FundingProgress';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { RightDashboard } from '@/components/RightDashboard';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Wallet, Share2, Users, Calculator, Target, ChevronRight } from 'lucide-react';
import { useRouter, usePathname } from "next/navigation";


export default function FundingPage() {
  const { data: session } = useSession();
  //We will pull funding from our Solana Wallet
  const currentFunding = 0;
  const memberCount = 180;
  const targetPerMember = 1000;
  const potentialFunding = memberCount * targetPerMember;
  const remainingToGoal = 170000 - currentFunding;

  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      <DashboardSidebar 
        activePage="funding"
        userName={session?.user?.name || 'Guest'}
        onNavigate={handleNavigation}
        userAvatar={session?.user?.image || ''}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto px-6 py-8">
          {/* Hero Section */}
          <div className="flex flex-col gap-4 mb-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-zinc-900 tracking-tight mb-2">Land Acquisition Fund</h1>
                <p className="text-zinc-500">Together we can preserve our heritage</p>
              </div>
              <Button className="bg-[#3B35C3] hover:bg-[#2D2A9C] text-white px-6 py-5 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-105">
                Contribute Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Left Column */}
            <div className="space-y-6">
              <Card className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
                <CardContent className="p-0">
                  <FundingProgress currentAmount={currentFunding} />
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#3B35C3] to-[#5B56D7] p-6 rounded-2xl border-0 text-white">
                <h2 className="text-2xl font-semibold mb-4">Community Power</h2>
                <p className="text-white/90 leading-relaxed mb-4">
                  With our {memberCount} members each contributing ${targetPerMember}, 
                  we can raise ${potentialFunding.toLocaleString()}. That's more than 
                  enough to reach our goal!
                </p>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Calculator className="h-4 w-4" />
                  <span>Only ${(remainingToGoal / memberCount).toFixed(2)} needed per member to reach our goal</span>
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-[#F0EFFF] to-white p-6 rounded-2xl border-0">
                <h2 className="text-2xl font-semibold text-zinc-900 mb-4">About This Initiative</h2>
                <p className="text-zinc-600 leading-relaxed mb-6">
                  We're on a mission to preserve historically significant land that holds 
                  deep cultural value for our community. Every contribution helps secure 
                  these important spaces for future generations.
                </p>
                <div className="flex items-center justify-between text-sm text-zinc-500 border-t border-zinc-100 pt-4">
                  <span>Current Contributors: {memberCount}</span>
                  <span>Goal: ${remainingToGoal.toLocaleString()} remaining</span>
                </div>
              </Card>

              <div className="grid grid-cols-3 gap-4">
                <Card className="group p-4 rounded-xl border-0 bg-white hover:shadow-md transition-all cursor-pointer">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-[#F0EFFF] mb-3 group-hover:bg-[#3B35C3] transition-colors">
                      <Wallet className="h-5 w-5 text-[#3B35C3] group-hover:text-white" />
                    </div>
                    <span className="text-sm font-medium text-zinc-900">Donate</span>
                  </div>
                </Card>
                <Card className="group p-4 rounded-xl border-0 bg-white hover:shadow-md transition-all cursor-pointer">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-[#F0EFFF] mb-3 group-hover:bg-[#3B35C3] transition-colors">
                      <Share2 className="h-5 w-5 text-[#3B35C3] group-hover:text-white" />
                    </div>
                    <span className="text-sm font-medium text-zinc-900">Share</span>
                  </div>
                </Card>
                <Card className="group p-4 rounded-xl border-0 bg-white hover:shadow-md transition-all cursor-pointer">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-[#F0EFFF] mb-3 group-hover:bg-[#3B35C3] transition-colors">
                      <Users className="h-5 w-5 text-[#3B35C3] group-hover:text-white" />
                    </div>
                    <span className="text-sm font-medium text-zinc-900">Invite</span>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Bottom Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white rounded-xl border-0 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-900">Recent Supporters</h3>
                <Button variant="ghost" size="sm" className="text-[#3B35C3]">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0EFFF] flex items-center justify-center">
                    <Users className="h-4 w-4 text-[#3B35C3]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Community Pool</p>
                    <p className="text-xs text-zinc-500">Contributed $5,000</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0EFFF] flex items-center justify-center">
                    <Target className="h-4 w-4 text-[#3B35C3]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Anonymous</p>
                    <p className="text-xs text-zinc-500">Contributed $1,000</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white rounded-xl border-0 p-6 hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">Impact Metrics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded bg-[#F0EFFF]/50">
                  <span className="text-sm text-zinc-600">Individual Contributors</span>
                  <span className="text-sm font-medium text-[#3B35C3]">{memberCount}+</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#F0EFFF]/50">
                  <span className="text-sm text-zinc-600">Corporate Sponsors</span>
                  <span className="text-sm font-medium text-[#3B35C3]">5</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#F0EFFF]/50">
                  <span className="text-sm text-zinc-600">Goal Progress</span>
                  <span className="text-sm font-medium text-[#3B35C3]">50%</span>
                </div>
              </div>
            </Card>

            <Card className="bg-white rounded-xl border-0 p-6 hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">Next Milestones</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded bg-[#F0EFFF]/50">
                  <div className="w-2 h-2 rounded-full bg-[#3B35C3]" />
                  <p className="text-sm text-zinc-600">Land Survey Completion</p>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-[#F0EFFF]/50">
                  <div className="w-2 h-2 rounded-full bg-[#3B35C3]" />
                  <p className="text-sm text-zinc-600">Community Consultation</p>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-[#F0EFFF]/50">
                  <div className="w-2 h-2 rounded-full bg-[#3B35C3]" />
                  <p className="text-sm text-zinc-600">Legal Documentation</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* <RightDashboard
        userName={session?.user?.name || 'Guest'}
        userAvatar={session?.user?.image || ''}
        userRole="Community Member"
        familyMemberCount={0}
        onInvite={() => {}}
        onSendMessage={() => {}}
      /> */}
    </div>
  );
}
