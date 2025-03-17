"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

interface CryptoUser {
  _id: string;
  twitterHandle: string;
  specialty: string;
  createdAt: string;
  submittedBy?: {
    name: string;
    email: string;
  };
}

export default function CryptoListPage() {
  const router = useRouter();
  const { userProfile, isLoading: profileLoading } = useUserProfile();
  const [users, setUsers] = useState<CryptoUser[]>([]);
  const [loading, setLoading] = useState(true);

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/crypto-users');
        const data = await response.json();
        
        if (data.success) {
          setUsers(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex h-screen bg-white">
      <DashboardSidebar 
        activePage="list" 
        onNavigate={handleNavigation}
        userName={userProfile?.user?.name?.split(" ")[0] || "User"}
        userAvatar={userProfile?.user?.profileImage || ""}
        rewardPoints={10}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto py-10">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Crypto Expert Directory</h2>
              <p className="text-sm text-muted-foreground">
                A curated list of crypto experts and their specialties.
              </p>
            </div>
            <Card className="border-border shadow-sm">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[200px] font-medium">Twitter Handle</TableHead>
                      <TableHead className="font-medium">Specialty</TableHead>
                      <TableHead className="font-medium">Submitted By</TableHead>
                      <TableHead className="text-right font-medium">Added On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          <div className="flex items-center justify-center text-sm text-muted-foreground">
                            Loading experts...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <p className="text-sm text-muted-foreground">No experts found</p>
                            <p className="text-xs text-muted-foreground">Be the first to add a crypto expert!</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user._id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <a 
                              href={`https://twitter.com/${user.twitterHandle.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary"
                            >
                              {user.twitterHandle}
                            </a>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.specialty}</TableCell>
                          <TableCell>
                            {user.submittedBy ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{user.submittedBy.name}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Anonymous</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 