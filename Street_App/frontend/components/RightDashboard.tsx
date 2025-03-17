'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, MessageSquare, BookOpen, Brain, Coins, Zap } from "lucide-react";
import { RightDashboardProps } from '@/types/user';

export function RightDashboard({ userName, userAvatar, userRole, familyMemberCount, onInvite, onSendMessage }: RightDashboardProps) {
  const { data: session } = useSession();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{id: string; sender: string; text: string; isAI?: boolean}>>([
    {
      id: '1',
      sender: 'Street Orcale',
      text: "Currently down for beta",
      isAI: true
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`/api/users/email/${encodeURIComponent(session?.user?.email || '')}`);
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchCurrentUser();
    }
  }, [session]);

  const getInitials = (name: string | undefined) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      sender: userName || 'You',
      text: newMessage
    };
    setMessages(prev => [...prev, userMessage]);

    // Add AI response
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'Street Network AI',
        text: "Currently down for beta",
        isAI: true
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);

    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full border-l border-[#DDDDDD]">
      {/* User Profile Section */}
      <div className="p-6 border-b border-[#DDDDDD]">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback>{userName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-zinc-800">{userName}</h3>
            <p className="text-sm text-zinc-500">{userRole}</p>
          </div>
        </div>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-zinc-600 hover:text-[#3B35C3] hover:bg-[#F0EFFF]"
            onClick={onInvite}
          >
            <UserPlus className="h-4 w-4" />
            Invite Members
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-zinc-600 hover:text-[#3B35C3] hover:bg-[#F0EFFF]"
            onClick={onSendMessage}
          >
            <MessageSquare className="h-4 w-4" />
            Send Message
          </Button>
        </div>
      </div>

      {/* Resource List Section */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-zinc-800 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#3B35C3]" />
            Resource List
          </h3>
        </div>
        
        <Tabs defaultValue="defi" className="w-full">
          <TabsList className="w-full mb-4 bg-zinc-100/50">
            <TabsTrigger value="defi" className="flex-1 data-[state=active]:bg-white">
              <div className="flex items-center gap-1">
                <Coins className="h-3 w-3" />
                <span>DeFi</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex-1 data-[state=active]:bg-white">
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                <span>AI</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="mem" className="flex-1 data-[state=active]:bg-white">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>MEM</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="defi" className="mt-0">
            <Card className="p-4 space-y-4">
              <div className="space-y-3">
                <ResourceItem
                  title="Uniswap Guide"
                  description="Complete guide to using Uniswap DEX"
                  link="#"
                />
                <ResourceItem
                  title="DeFi Security"
                  description="Best practices for DeFi security"
                  link="#"
                />
                <ResourceItem
                  title="Yield Farming"
                  description="Introduction to yield farming strategies"
                  link="#"
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="mt-0">
            <Card className="p-4 space-y-4">
              <div className="space-y-3">
                <ResourceItem
                  title="AI Agents Guide"
                  description="Understanding autonomous AI agents"
                  link="#"
                />
                <ResourceItem
                  title="LLM Development"
                  description="Building with language models"
                  link="#"
                />
                <ResourceItem
                  title="AI Safety"
                  description="Best practices for AI development"
                  link="#"
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="mem" className="mt-0">
            <Card className="p-4 space-y-4">
              <div className="space-y-3">
                <ResourceItem
                  title="Meme Creation"
                  description="Guide to creating viral memes"
                  link="#"
                />
                <ResourceItem
                  title="Community Building"
                  description="Building engaged communities"
                  link="#"
                />
                <ResourceItem
                  title="Content Strategy"
                  description="Effective content distribution"
                  link="#"
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface ResourceItemProps {
  title: string;
  description: string;
  link: string;
}

function ResourceItem({ title, description, link }: ResourceItemProps) {
  return (
    <a 
      href={link}
      className="block p-3 rounded-lg hover:bg-[#F0EFFF] transition-colors duration-200"
    >
      <h4 className="text-sm font-medium text-zinc-800">{title}</h4>
      <p className="text-xs text-zinc-500 mt-1">{description}</p>
    </a>
  );
}