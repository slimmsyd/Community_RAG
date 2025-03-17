"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@auth/core/types";
import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";
import { LoadingScreen } from "@/components/LoadingScreen";

interface Workspace {
  workspaceId: {
    _id: string;
    name: string;
  };
  role: string;
}

interface WorkspaceMember {
  userId: string;
  name: string;
  email: string;
  profileImage?: string;
  role: string;
  joinedAt: string;
}

export default function RoleSelectionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [familyRole, setFamilyRole] = useState("");
  const [primaryRelation, setPrimaryRelation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Add session check effect
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      console.log('No session found, redirecting to signup');
      router.push('/signup');
      return;
    }

    console.log('Session found:', session);
    // Fetch user details when session is available
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(
          `/api/users/email/${encodeURIComponent(session.user?.email || '')}`
        );
        const data = await response.json();
        console.log('User details:', data);

        if (data.success) {
          setCurrentUser(data.user);
          // If user already has a valid role, redirect to dashboard
          if (data.user.familyRole && 
              data.user.familyRole !== 'pending' && 
              data.user.familyRole !== 'undefined') {
            router.push('/app/dashboard');
          }
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        setError('Failed to fetch user details');
      }
    };

    fetchUserDetails();
  }, [session, status, router]);

  // Show loading state while checking session
  if (status === 'loading' || !session) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-900">Loading...</p>
        </div>
      </div>
    );
  }

  const fetchWorkspaces = async () => {

console.log("Fetching workspaces...");

    try {
      const response = await fetch(`/api/users/workspaces/${session?.user?.email}`);
      const data = await response.json();


      console.log("Workspaces data:", data);
      if (data.success) {
        setWorkspaces(data.workspaces);
        if (data.workspaces.length > 0) {
          fetchWorkspaceMembers(data.workspaces[0].workspaceId._id);
        }
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError("Failed to fetch workspaces");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkspaceCreated = () => {
    fetchWorkspaces();
  };

  const fetchWorkspaceMembers = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      const data = await response.json();
      
      if (data.success) {
        const filteredMembers = data.workspace.members.filter(
          (member: WorkspaceMember) => member.userId !== currentUser?.id
        );
        setWorkspaceMembers(filteredMembers);
      } else {
        console.error('Failed to fetch workspace members:', data.error);
      }
    } catch (error) {
      console.error('Error fetching workspace members:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form...");
    if (!session?.user?.email) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/email/${session.user.email}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          familyRole: "archivist",
          familyRelation: familyRole,
          primaryRelation: primaryRelation,
        }),
      });

      if (response.ok) {
        setIsRedirecting(true);
        router.push("/app/dashboard");
      } else {
        console.error("Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isRedirecting && <LoadingScreen />}
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <div className="w-full max-w-[1200px] h-[700px] gap-[20px] flex rounded-3xl overflow-hidden bg-white">
          {/* Left side - Form */}
          <div className="w-full md:w-1/2 bg-[#f3f3f38e] p-8 md:p-12 flex flex-col justify-center rounded-3xl">
            <div className="mb-8">
              <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mb-6 border border-gray-200">
                <Image
                  src="/assets/HomeLogo.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Create Your Family Tree
              </h1>
              <p className="text-[#6366F1]">
                Start your family legacy as an archivist
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="w-full">
                <Button
                  type="button"
                  className="w-full h-[120px] flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-[#3B35C3] bg-[#F0EFFF] text-[#3B35C3]"
                >
                  Family Archivist
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-4 text-black">
                  <div>
                    <Label htmlFor="familyRole">
                      What's your role? (Mother, Father, Son)
                    </Label>
                    <Input
                      id="familyRole"
                      placeholder="Enter your family role"
                      value={familyRole}
                      onChange={(e) => setFamilyRole(e.target.value)}
                      className="mt-1.5 bg-white border-gray-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="primaryRelation">
                      Primary Relationship (Son Father?)
                    </Label>
                    <Input
                      id="primaryRelation"
                      placeholder="Enter your primary relationship"
                      value={primaryRelation}
                      onChange={(e) => setPrimaryRelation(e.target.value)}
                      className="mt-1.5 bg-white border-gray-200"
                    />
                  </div>

                  <div className="pt-4">
                    <CreateWorkspaceDialog 
                      onWorkspaceCreated={handleWorkspaceCreated}
                      triggerButton={
                        <Button className="w-full bg-[#3B35C3] text-white hover:bg-[#3B35C3]/90">
                          Create Family Workspace
                        </Button>
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!familyRole || !primaryRelation || isLoading}
                className="w-full bg-[#3B35C3] text-white hover:bg-[#2D2A9C] h-12 rounded-xl font-medium transition-all duration-200"
              >
                {isLoading ? "Creating..." : "CONTINUE"}
              </Button>
            </form>
          </div>

          {/* Right side - Illustration */}
          <div className="hidden md:block w-1/2 relative bg-[#F0EFFF] rounded-3xl">
            <div className="absolute inset-0">
              {/* Clouds */}
              <div className="absolute top-[10%] left-[20%] w-16 h-8 bg-white/10 rounded-full blur-lg"></div>
              <div className="absolute top-[30%] right-[15%] w-20 h-10 bg-white/10 rounded-full blur-lg"></div>
              <div className="absolute bottom-[20%] left-[30%] w-24 h-12 bg-white/10 rounded-full blur-lg"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <Image
                src="/assets/AiRobotNo.png"
                alt="Decorative illustration"
                width={400}
                height={400}
                className="object-contain transform hover:scale-105 transition-transform duration-300"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
