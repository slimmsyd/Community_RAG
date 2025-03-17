import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus } from 'lucide-react';
import { useSession } from "next-auth/react";





interface CreateWorkspaceDialogProps {
  onWorkspaceCreated?: () => void;
  triggerButton?: React.ReactNode;
}

export function CreateWorkspaceDialog({ 
  onWorkspaceCreated,
  triggerButton 
}: CreateWorkspaceDialogProps) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDetails = async () => {
    if (!session?.user?.email) {
      throw new Error('No user session found');
    }
    
    try {
      const response = await fetch(`/api/users/email/${encodeURIComponent(session.user.email)}`);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (data.success) {
        if (!data.user?._id && data.user?.id) {
          data.user._id = data.user.id;
        }
        return data;
      } else {
        throw new Error(data.error || 'Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error in fetchUserDetails:', error);
      throw new Error('Error fetching user details');
    }
  };

  const handleCreate = async () => {
    if (!workspaceName.trim()) return;
    if (!session?.user?.email) {
      setError('Please sign in to create a workspace');
      return;
    }

    console.log("Creating workspace...");
    setIsLoading(true);
    setError(null);

    try {
      // Get current user's details
      const userData = await fetchUserDetails();
      console.log('User Data for workspace creation:', userData);
      
      // Check both _id and id fields
      const userId = userData?.user?._id || userData?.user?.id;
      if (!userId) {
        console.error('User data structure:', userData);
        throw new Error('Failed to get user data - No user ID found');
      }

      // Create workspace with the user's ID
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workspaceName,
          ownerId: userId,
          members: [{
            userId: userId,
            role: 'admin'
          }]
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsOpen(false);
        setWorkspaceName('');
        onWorkspaceCreated?.();
      } else {
        setError(data.error || 'Failed to create workspace');
      }
    } catch (error: any) {
      setError(error.message || 'Error creating workspace');
      console.error('Error creating workspace:', error);
    } finally {
      setIsLoading(false);
    }
  };  

  // Disable the dialog trigger if no session
  const isDisabled = status === 'loading' || !session;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild disabled={isDisabled}>
        {triggerButton || (
          <Button 
            variant="ghost" 
            size="icon" 
            className={`text-zinc-800 rounded-full bg-white border border-[#D6D6D6] border-[0.5px] ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Plus size={16} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Family Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to connect and share with your family members.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              placeholder="Enter family workspace name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="border-[#DDDDDD] bg-white text-black"
            />
          </div>
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={!workspaceName.trim() || isLoading}
            className={`${
              workspaceName.trim() && !isLoading
                ? 'bg-[#3B35C3] hover:bg-[#3B35C3]/90'
                : 'bg-gray-300 cursor-not-allowed'
            } text-white transition-colors duration-200`}
          >
            {isLoading ? 'Creating...' : 'Create Workspace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 