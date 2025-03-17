import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { DashboardSidebar } from "@/components/DashboardSidebar"
import {
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

interface SettingsLayoutProps {
  isCurrentUser: boolean;
  userName: string;
  isEditMode: boolean;
  isLoading: boolean;
  hasChanges: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export function SettingsLayout({
  isCurrentUser,
  userName,
  isEditMode,
  isLoading,
  hasChanges,
  onEdit,
  onCancel,
  onSave,
  onNavigate,
  children
}: SettingsLayoutProps) {
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <DashboardSidebar 
        activePage="settings"
        onNavigate={onNavigate}
        userName={userName}
        rewardPoints={10}
      />
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={80} minSize={30}>
          <div className="flex-1 flex flex-col bg-white h-screen overflow-y-auto">
            <div className="p-6 border-b border-[#DDDDDD] bg-white flex justify-between items-center sticky top-0 z-10">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-800">
                  {isCurrentUser ? 'Account Settings' : `${userName}'s Profile`}
                </h1>
                <p className="text-sm text-zinc-500">
                  {isCurrentUser 
                    ? 'Manage your personal information and preferences'
                    : 'View family member information'}
                </p>
              </div>
              {isCurrentUser && !isEditMode ? (
                <Button 
                  onClick={onEdit}
                  className="bg-[#3B35C3] text-white hover:bg-[#3B35C3]/90 transition-colors duration-200"
                >
                  Edit Profile
                </Button>
              ) : isEditMode ? (
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={onCancel}
                    className="border-none text-[#3B35C3] bg-transparent"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={onSave}
                    disabled={!hasChanges || isLoading}
                    className={`${
                      hasChanges && !isLoading
                        ? 'bg-[#3B35C3] hover:bg-[#3B35C3]/90' 
                        : 'bg-gray-300 cursor-not-allowed'
                    } text-white transition-colors duration-200`}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              ) : null}
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8 pb-10">
                {children}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
} 