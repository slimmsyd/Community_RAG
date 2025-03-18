"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Home,
  Share2,
  Clock,
  Star,
  Trash2,
  Settings,
  Plus,
  Search,
  FileText,
  Users,
  Calendar,
  ChevronDown,
  Folder,
  GitBranch,
  Crown,
  FileImage,
  FileVideo,
  Upload,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useArweaveUpload } from "@/hooks/useArweaveUpload";
import { useRouter, usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useUserImages } from "@/hooks/useUserImages";
import { RightDashboard } from "@/components/RightDashboard";
import { useSession } from "next-auth/react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import { Badge } from '@/components/ui/badge';

interface TransactionDetails {
  id: string;
  status: string;
  timestamp: string;
  size: number;
  type: string;
}

interface UserInteraction {
  type: string;
  timestamp: string;
  channel_id: string;
  channel_name: string;
  guild_id: string;
  guild_name: string;
  command: string | null;
  message: string;
}

interface UserDetails {
  last_channel: string;
  last_guild: string;
  last_interaction: string;
  last_message: string;
  total_interactions: number;
  username: string;
}

interface UserData {
  _id: string;
  user_id: string;
  first_interaction: string;
  interactions: UserInteraction[];
  details: UserDetails;
  username: string;
  avatar: string;
  total_interactions: number;
}

interface FocusDataPoint {
  name: string;
  interactions: number;
  channels: number;
}

interface DevelopedArea {
  name: string;
  progress: number;
}

interface Meeting {
  time: string;
  title: string;
  platform: string;
  date: string;
}

interface Member {
  user_id: string;
  username: string;
  avatar?: string;
  total_interactions: number;
  last_active: string;
}

interface UserReport {
  userSummary: {
    username: string;
    totalInteractions: number;
    activeChannels: number;
    daysActive: number;
    firstInteraction: string;
    lastInteraction: string;
  };
  channelActivity: {
    channelName: string;
    interactions: number;
    percentage: number;
  }[];
  monthlyActivity: {
    month: string;
    interactions: number;
    channels: number;
  }[];
  recentActivity: {
    timestamp: string;
    channelName: string;
    message: string;
  }[];
}

interface TimeBasedStats {
  daily: {
    date: string;
    count: number;
  }[];
  weekly: {
    week: string;
    count: number;
  }[];
  growth: {
    daily: number;
    weekly: number;
  };
}

export default function Dashboard() {
  const { data: session } = useSession();
  const { userProfile, isLoading: profileLoading } = useUserProfile();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: string }>(
    {}
  );
  const [transactions, setTransactions] = useState<{
    [key: string]: TransactionDetails;
  }>({});
  const [userData, setUserData] = useState<UserData | null>(null);
  const [channelStats, setChannelStats] = useState<{ name: string; count: number }[]>([]);
  const [topUsers, setTopUsers] = useState<{ username: string; interactions: number }[]>([]);
  const [mounted, setMounted] = useState(false);
  const [focusData, setFocusData] = useState<FocusDataPoint[]>([]);
  const [developedAreas, setDevelopedAreas] = useState<DevelopedArea[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [statsData, setStatsData] = useState({
    prioritized: { value: 0, label: '' },
    additional: { value: 0, label: '' }
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'personal' | 'members' | 'global'>('personal');
  const [globalChannelStats, setGlobalChannelStats] = useState<DevelopedArea[]>([]);
  const [timeBasedStats, setTimeBasedStats] = useState<TimeBasedStats | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  const { uploadFile, uploadProgress, isUploading, error } = useArweaveUpload({
    userId: userProfile?.user?.id || "unknown",
    familyId: "family456",
  });

  const {
    images,
    isLoading: imagesLoading,
    error: imagesError,
    refreshImages,
    deleteImage,
    canUploadMore,
  } = useUserImages(userProfile?.user?.id || "");

  const router = useRouter();
  const pathname = usePathname();
  const currentMember = pathname.split("/").pop() || "me";

  useEffect(() => {
    setMounted(true);
    fetchMembers();
    if (selectedUserId) {
      fetchUserData(selectedUserId);
      fetchGlobalChannelStats();
    }
  }, [selectedUserId, selectedMonth]);


  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/discord/members');
      const data = await response.json();
      setMembers(data);
      
      if (!selectedUserId && data.length > 0) {
        setSelectedUserId(data[0].user_id);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchUserData = async (userId?: string) => {
    try {
      if (!userId) {
        console.error('No userId provided');
        return;
      }

      // console.log("Fetching user data for ID:", userId);
      const response = await fetch(`/api/discord/user-data?userId=${userId}`, {
        // Add cache: 'no-store' to prevent caching
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.error('Error response:', response.status);
        const errorData = await response.json();
        console.error('Error details:', errorData);
        return;
      }

      const data = await response.json();
      // console.log("Received user data for ID", userId, ":", data);
      
      if (!data || data.error) {
        console.error('No user data found or error:', data.error);
        return;
      }

      setUserData(data);

      // console.log("Loggin the User Data", data);
      
      // Process interaction data for the focus chart
      const interactionsByMonth: { [key: string]: { count: number, channels: Set<string> } } = {};
      data.interactions?.forEach((interaction: UserInteraction) => {
        const date = new Date(interaction.timestamp);
        // Only process interactions for the selected month
        const [yearStr, monthStr] = selectedMonth.split('-');
        if (
          date.getFullYear() === +yearStr && 
          date.getMonth() === (+monthStr - 1)
        ) {
          const dayKey = date.getDate().toString(); // Use day instead of month for more granular view
          
          if (!interactionsByMonth[dayKey]) {
            interactionsByMonth[dayKey] = { count: 0, channels: new Set() };
          }
          interactionsByMonth[dayKey].count++;
          interactionsByMonth[dayKey].channels.add(interaction.channel_id);
        }
      });

      // Convert to focus chart data
      const focusChartData = Object.entries(interactionsByMonth)
        .sort(([a], [b]) => parseInt(a) - parseInt(b)) // Sort by day
        .map(([day, stats]) => ({
          name: `Day ${day}`,
          interactions: stats.count,
          channels: stats.channels.size,
        }));
      setFocusData(focusChartData);

      // Process personal channel statistics
      const channelCounts = new Map<string, number>();
      data.interactions?.forEach((interaction: UserInteraction) => {
        const channelName = interaction.channel_name || interaction.channel_id;
        const count = channelCounts.get(channelName) || 0;
        channelCounts.set(channelName, count + 1);
      });
      
      // Get top personal channels
      const personalChannels = Array.from(channelCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({
          name: name.replace(/[📚🛠️📝-]/g, '').trim(),
          progress: Math.round((count / (data.total_interactions || 1)) * 100)
        }));
      
      setDevelopedAreas(personalChannels);

      // Fetch global channel statistics
      try {
        const globalResponse = await fetch('/api/discord/global-channel-stats');
        const globalData = await globalResponse.json();
        
        const globalChannels = globalData.channels
          .sort((a: any, b: any) => b.total_interactions - a.total_interactions)
          .slice(0, 5)
          .map((channel: any) => ({
            name: channel.name.replace(/[📚🛠️📝-]/g, '').trim(),
            progress: Math.round((channel.total_interactions / globalData.total_interactions) * 100)
          }));
        
        setGlobalChannelStats(globalChannels);
      } catch (error) {
        console.error('Error fetching global channel stats:', error);
      }

      // Process recent activity for meetings section
      const recentActivity = data.interactions
        ?.sort((a: UserInteraction, b: UserInteraction) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 4)
        .map((interaction: UserInteraction) => ({
          time: new Date(interaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          title: interaction.message || 'Interaction',
          platform: interaction.channel_id,
          date: new Date(interaction.timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
        }));
      setMeetings(recentActivity);

      // Calculate stats for the cards
      const totalMessages = data.interactions?.length || 0;
      const uniqueChannels = new Set(data.interactions?.map((i: UserInteraction) => i.channel_id)).size;
      
      setStatsData({
        prioritized: {
          value: Math.round((totalMessages / (data.total_interactions || 1)) * 100),
          label: 'Message Rate'
        },
        additional: {
          value: Math.round((uniqueChannels / 10) * 100), // Assuming 10 is the total number of channels
          label: 'Channel Activity'
        }
      });

      // Calculate time-based analytics
      const stats = calculateTimeBasedStats(data.interactions || []);
      setTimeBasedStats(stats);

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchGlobalChannelStats = async () => {
    try {
      const response = await fetch('/api/discord/global-channel-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch global channel stats');
      }
      
      const data = await response.json();
      // console.log('Global Channel Stats:', data);

      // Transform the data into the format expected by the UI
      const formattedStats = data.channels
        .sort((a: any, b: any) => parseFloat(b.percentage) - parseFloat(a.percentage))
        .slice(0, 5)
        .map((channel: any) => ({
          name: channel.name,
          progress: parseFloat(channel.percentage)
        }));

      setGlobalChannelStats(formattedStats);
    } catch (error) {
      console.error('Error fetching global channel stats:', error);
    }
  };

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };

  const logChannelStats = () => {
    if (!userData?.interactions) {
      // console.log("No user data or interactions available");
      return;
    }

    // Get all unique channels
    const allChannels = new Set(userData.interactions.map(i => i.channel_name));
      // console.log("\n=== All Channels ===");
    // console.log(Array.from(allChannels));

    // Calculate channel activity
    const channelActivity = userData.interactions.reduce((acc, interaction) => {
      const channelName = interaction.channel_name;
      acc[channelName] = (acc[channelName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sort channels by activity
    const sortedChannels = Object.entries(channelActivity)
      .sort(([, a], [, b]) => b - a)
      .map(([channel, count]) => ({
        channel: channel.replace(/[📚🛠️📝-]/g, '').trim(), // Clean up channel name
        interactions: count,
        percentage: ((count / userData.interactions.length) * 100).toFixed(1) + '%'
      }));

    console.log("\n=== Top Channels by Activity ===");
    console.table(sortedChannels);
  };

  useEffect(() => {
    if (userData) {
      logChannelStats();
    }
  }, [userData]);

  useEffect(() => {
    if (viewMode === 'global') {
      fetchGlobalChannelStats();
    }
  }, [viewMode]);

  function generateUserReport(): UserReport | null {
    if (!userData) return null;

    // Calculate unique days active
    const uniqueDays = new Set(
      userData.interactions?.map(i => new Date(i.timestamp).toDateString())
    );

    // Calculate channel statistics
    const channelStats = userData.interactions?.reduce((acc, interaction) => {
      const channelName = interaction.channel_name;
      acc[channelName] = (acc[channelName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const channelActivity = Object.entries(channelStats || {})
      .map(([channel, count]) => ({
        channelName: channel.replace(/[📚🛠️📝-]/g, '').trim(),
        interactions: count,
        percentage: Number(((count / (userData.total_interactions || 1)) * 100).toFixed(1))
      }))
      .sort((a, b) => b.interactions - a.interactions);

    return {
      userSummary: {
        username: userData.username,
        totalInteractions: userData.total_interactions,
        activeChannels: new Set(userData.interactions?.map(i => i.channel_id)).size,
        daysActive: uniqueDays.size,
        firstInteraction: userData.first_interaction,
        lastInteraction: userData.details?.last_interaction
      },
      channelActivity,
      monthlyActivity: focusData.map(data => ({
        month: data.name,
        interactions: data.interactions,
        channels: data.channels
      })),
      recentActivity: (userData.interactions || [])
        .slice(-10)
        .map(interaction => ({
          timestamp: interaction.timestamp,
          channelName: interaction.channel_name,
          message: interaction.message
        }))
    };
  }

  function downloadReport(format: 'json' | 'csv') {
    const report = generateUserReport();
    if (!report) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `user_report_${report.userSummary.username}_${timestamp}`;

    if (format === 'json') {
      const jsonString = JSON.stringify(report, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.json`;
      link.click();
    } else {
      // Convert to CSV format
      const csvRows = [];
      
      // Add user summary
      csvRows.push(['User Summary']);
      Object.entries(report.userSummary).forEach(([key, value]) => {
        csvRows.push([key, String(value)]);
      });
      
      csvRows.push([]);  // Empty row as separator
      
      // Add channel activity
      csvRows.push(['Channel Activity']);
      csvRows.push(['Channel Name', 'Interactions', 'Percentage']);
      report.channelActivity.forEach(channel => {
        csvRows.push([channel.channelName, String(channel.interactions), `${channel.percentage}%`]);
      });
      
      csvRows.push([]);  // Empty row as separator
      
      // Add monthly activity
      csvRows.push(['Monthly Activity']);
      csvRows.push(['Month', 'Interactions', 'Active Channels']);
      report.monthlyActivity.forEach(month => {
        csvRows.push([month.month, String(month.interactions), String(month.channels)]);
      });
      
      const csvString = csvRows.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.csv`;
      link.click();
    }
  }

  function calculateTimeBasedStats(interactions: UserInteraction[]): TimeBasedStats {
    // Filter interactions for selected month
    const [yearStr, monthStr] = selectedMonth.split('-');
    const monthStart = new Date(+yearStr, +monthStr - 1, 1);
    const monthEnd = new Date(+yearStr, +monthStr, 0);

    const monthlyInteractions = interactions.filter(interaction => {
      const date = new Date(interaction.timestamp);
      return date >= monthStart && date <= monthEnd;
    });

    // Group by days
    const dailyStats = monthlyInteractions.reduce((acc, interaction) => {
      const date = new Date(interaction.timestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by weeks
    const weeklyStats = monthlyInteractions.reduce((acc, interaction) => {
      const date = new Date(interaction.timestamp);
      const weekNum = Math.ceil((date.getDate() + date.getDay()) / 7);
      const week = `${date.getFullYear()}-W${weekNum}`;
      acc[week] = (acc[week] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate growth rates
    const sortedDays = Object.entries(dailyStats)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
    const sortedWeeks = Object.entries(weeklyStats)
      .sort(([a], [b]) => b.localeCompare(a));

    const dailyGrowth = sortedDays.length > 1 
      ? ((sortedDays[0][1] - sortedDays[1][1]) / sortedDays[1][1]) * 100 
      : 0;

    const weeklyGrowth = sortedWeeks.length > 1 
      ? ((sortedWeeks[0][1] - sortedWeeks[1][1]) / sortedWeeks[1][1]) * 100 
      : 0;

    return {
      daily: sortedDays.map(([date, count]) => ({ date, count })),
      weekly: sortedWeeks.map(([week, count]) => ({ week, count })),
      growth: {
        daily: dailyGrowth,
        weekly: weeklyGrowth
      }
    };
  }

  useEffect(() => {
    if (userData?.interactions) {
      const stats = calculateTimeBasedStats(userData.interactions);
      setTimeBasedStats(stats);
    }
  }, [userData, selectedMonth]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#FAFAFA]">
      <DashboardSidebar
        activePage="dashboard"
        onNavigate={handleNavigation}
        userName={userData?.username || "User"}
        userAvatar={userData?.avatar || ""}
        rewardPoints={userData?.total_interactions || 0}
      />
      
      <main className="flex-1 overflow-auto w-full">
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
          {/* Responsive Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-10">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-medium text-gray-900">
                {viewMode === 'global' ? 'Community Analytics' : 'Community Members'}
              </h1>
              <p className="text-sm text-gray-500">
                {viewMode === 'global' 
                  ? 'Overall community engagement metrics' 
                  : 'Individual member activity overview'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Member Selection Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto rounded-xl border-gray-200">
                    <Avatar className="h-5 w-5 mr-2">
                      <AvatarImage src={userData?.avatar || ''} />
                      <AvatarFallback>{userData?.username?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    {userData?.username || 'Select Member'}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  {Array.isArray(members) ? members.map((member) => (
                    <DropdownMenuItem
                      key={member.user_id}
                      onClick={() => {
                        setSelectedUserId(member.user_id);
                        setViewMode('global');
                      }}
                      className="flex items-center gap-2"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.username[0]}</AvatarFallback>
                      </Avatar>
                      {member.username}
                    </DropdownMenuItem>
                  )) : <DropdownMenuItem>No members found</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-full sm:w-auto">
                <Button 
                  variant={viewMode === 'members' ? 'default' : 'ghost'} 
                  onClick={() => setViewMode('members')}
                  className="flex-1 sm:flex-none rounded-lg text-sm px-4 text-black"
                  size="sm"
                >
                  Members
                </Button>
                <Button 
                  variant={viewMode === 'global' ? 'default' : 'ghost'} 
                  onClick={() => setViewMode('global')}
                  className="flex-1 sm:flex-none rounded-lg text-sm px-4 text-black"
                  size="sm"
                >
                  Global
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadReport('json')}
                  className="hidden sm:flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadReport('csv')}
                  className="hidden sm:flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          {viewMode === 'members' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.isArray(members) ? members.map((member) => (
                <Card key={member.user_id} className="bg-white/80 backdrop-blur-xl border-0 shadow-sm rounded-2xl hover:shadow-md transition-all">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                          {member.username}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="secondary" className="rounded-full text-xs">
                            {member.total_interactions} interactions
                          </Badge>
                          <span className="text-xs text-gray-400">
                            Active {new Date(member.last_active).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="rounded-xl hidden sm:flex"
                        onClick={() => {
                          setSelectedUserId(member.user_id);
                          setViewMode('global');
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : <p>No members found</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6">
              {/* Stats Overview - Full width on mobile */}
              <div className="col-span-full grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-purple-50 rounded-xl">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Active Members</p>
                    <h3 className="text-xl sm:text-2xl font-semibold mt-1 text-black">
                      {members.length}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Since Feb 6, 2024</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-blue-50 rounded-xl">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Interactions</p>
                    <h3 className="text-xl sm:text-2xl font-semibold mt-1 text-black">
                      {userData?.total_interactions || 0}
                    </h3>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-green-50 rounded-xl">
                        <GitBranch className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Active Channels</p>
                    <h3 className="text-xl sm:text-2xl font-semibold mt-1 text-black">
                      {new Set(userData?.interactions?.map(i => i.channel_id)).size || 0}
                    </h3>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-purple-50 rounded-xl">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Days Active</p>
                    <h3 className="text-xl sm:text-2xl font-semibold mt-1 text-black">
                      {userData?.interactions?.reduce((uniqueDays, interaction) => {
                        const day = new Date(interaction.timestamp).toDateString();
                        uniqueDays.add(day);
                        return uniqueDays;
                      }, new Set()).size || 0}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Since Feb 6, 2024</p>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Chart - Full width on mobile */}
              <div className="col-span-full lg:col-span-8">
                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-sm sm:text-base font-medium text-gray-900">Activity Overview</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Monthly interaction analytics</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const [yearStr, monthStr] = selectedMonth.split('-');
                            const prevMonth = new Date(+yearStr, +monthStr - 2, 1);
                            if (prevMonth >= new Date('2024-02-06')) {
                              setSelectedMonth(
                                `${prevMonth.getFullYear()}-${(prevMonth.getMonth() + 1).toString().padStart(2, '0')}`
                              );
                            }
                          }}
                          disabled={selectedMonth === '2024-02'}
                          className="h-8 px-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[100px] text-center">
                          {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const [yearStr, monthStr] = selectedMonth.split('-');
                            const nextMonth = new Date(+yearStr, +monthStr, 1);
                            const today = new Date();
                            if (nextMonth <= today) {
                              setSelectedMonth(
                                `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}`
                              );
                            }
                          }}
                          disabled={selectedMonth === new Date().toISOString().slice(0, 7)}
                          className="h-8 px-2"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="h-[250px] sm:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={focusData}>
                          <defs>
                            <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="name" stroke="#9CA3AF" />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ 
                              background: 'rgba(255, 255, 255, 0.8)',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="interactions" 
                            stroke="#4F46E5" 
                            strokeWidth={2}
                            fill="url(#colorInteractions)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Time-based Analytics */}
              <div className="col-span-full">
                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle
                    className="text-lg font-medium text-gray-900"
                    >Interaction Frequency</CardTitle>
                    <CardDescription>Track your daily and weekly message activity patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Daily Stats */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium">Daily Message Count</h4>
                          <Badge variant="outline" className="text-xs text-gray-500">
                            Last 7 Days
                          </Badge>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={timeBasedStats?.daily.slice(-7) || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { 
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })} 
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              label={{ 
                                value: 'Messages', 
                                angle: -90, 
                                position: 'insideLeft',
                                fontSize: 12
                              }}
                            />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-100">
                                      <p className="text-sm font-medium text-gray-900">
                                        {new Date(label).toLocaleDateString(undefined, {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {payload[0].value} messages sent
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar 
                              dataKey="count" 
                              fill="#4F46E5" 
                              radius={[4, 4, 0, 0]} 
                              name="Messages"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-4 flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-600">Daily Growth Rate</span>
                            <p className="text-xs text-gray-500 mt-1">
                              Compared to previous day
                            </p>
                          </div>
                          <Badge variant={timeBasedStats?.growth?.daily !== undefined && timeBasedStats?.growth?.daily > 0 ? "default" : "destructive"}>
                            {timeBasedStats?.growth?.daily?.toFixed(1) ?? '0'}%
                          </Badge>
                        </div>
                      </div>

                      {/* Weekly Stats */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium">Weekly Message Count</h4>
                          <Badge variant="outline" className="text-xs text-gray-500">
                            Last 4 Weeks
                          </Badge>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={timeBasedStats?.weekly.slice(-4) || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                              dataKey="week" 
                              tickFormatter={(week) => {
                                const [year, weekNum] = week.split('-W');
                                return `Week ${weekNum}`;
                              }}
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              label={{ 
                                value: 'Messages', 
                                angle: -90, 
                                position: 'insideLeft',
                                fontSize: 12
                              }}
                            />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  const [year, weekNum] = label.split('-W');
                                  return (
                                    <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-100">
                                      <p className="text-sm font-medium text-gray-900">
                                        Week {weekNum}, {year}
                                      </p>
                                      <p className="text-sm text-gray-900">
                                        {payload[0].value} total messages
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Weekly activity
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar 
                              dataKey="count" 
                              fill="#6366F1" 
                              radius={[4, 4, 0, 0]} 
                              name="Messages"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-4 flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-600">Weekly Growth Rate</span>
                            <p className="text-xs text-gray-500 mt-1">
                              Compared to previous week
                            </p>
                          </div>
                          <Badge variant={timeBasedStats?.growth?.weekly !== undefined && timeBasedStats?.growth?.weekly > 0 ? "default" : "destructive"}>
                            {timeBasedStats?.growth?.weekly?.toFixed(1) ?? '0'}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Side Cards - Stack on mobile */}
              <div className="col-span-full lg:col-span-4 space-y-4 sm:space-y-6">
                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {meetings.slice(0, 3).map((meeting, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 rounded-xl">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {meeting.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{meeting.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-4">Channel Activity</h3>
                    <div className="space-y-4">
                      {developedAreas.slice(0, 4).map((area, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs sm:text-sm text-gray-600">{area.name}</span>
                            <span className="text-xs sm:text-sm text-gray-500">{area.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${area.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* New Channel Rankings Section - Full width */}
              <div className="col-span-full mt-6">
                <Card className="bg-white border-0 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg text-gray-900">Channel Rankings</CardTitle>
                        <CardDescription className="text-sm text-gray-500 mt-1">
                          Engagement distribution across community channels
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-600 bg-blue-50">
                          {new Set(userData?.interactions?.map(i => i.channel_id)).size || 0} Active Channels
                        </Badge>
                        <Badge variant="outline" className="text-xs border-green-200 text-green-600 bg-green-50">
                          {userData?.total_interactions || 0} Total Interactions
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Personal Channel Rankings */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-700">Personal Channel Activity</h4>
                          <Select defaultValue="7">
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <SelectValue placeholder="Time Range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7">Last 7 days</SelectItem>
                              <SelectItem value="30">Last 30 days</SelectItem>
                              <SelectItem value="90">Last 90 days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-4">
                          {developedAreas.map((channel, index) => (
                            <div key={index} className="relative">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                                    {index + 1}
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">{channel.name}</span>
                                </div>
                                <span className="text-sm text-gray-600">{channel.progress}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${channel.progress}%` }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
                                  className={`h-full rounded-full ${
                                    index === 0 ? 'bg-blue-500' :
                                    index === 1 ? 'bg-indigo-500' :
                                    index === 2 ? 'bg-violet-500' :
                                    'bg-purple-500'
                                  }`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Global Channel Rankings */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-700">Global Channel Activity</h4>
                          <Badge variant="secondary" className="text-xs">Community-wide</Badge>
                        </div>
                        <div className="space-y-4">
                          {globalChannelStats.map((channel, index) => (
                            <div key={index} className="relative">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                                    index === 0 ? 'bg-amber-100 text-amber-600' :
                                    index === 1 ? 'bg-gray-100 text-gray-600' :
                                    index === 2 ? 'bg-orange-100 text-orange-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">{channel.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">{channel.progress}%</span>
                                  {index === 0 && (
                                    <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-600 border-amber-100">
                                      Most Active
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${channel.progress}%` }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
                                  className={`h-full rounded-full ${
                                    index === 0 ? 'bg-amber-500' :
                                    index === 1 ? 'bg-gray-500' :
                                    index === 2 ? 'bg-orange-500' :
                                    'bg-gray-400'
                                  }`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}