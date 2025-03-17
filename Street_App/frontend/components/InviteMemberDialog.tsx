'use client';

import { useState } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2 } from "lucide-react";

interface InviteMemberDialogProps {
  workspaceId: string;
  onInviteSent?: (workspaceId: string) => void;
  triggerButton?: React.ReactNode;
}

export function InviteMemberDialog({ 
  workspaceId,
  onInviteSent,
  triggerButton 
}: InviteMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInvite = async () => {
    if (!email.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/workspaces/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          email: email.trim(),
          message: message.trim()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setShowSuccess(true);
        onInviteSent?.(workspaceId);
      } else {
        throw new Error(data.error || 'Failed to send invitation');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to send invitation',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowSuccess(false);
    setEmail('');
    setMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline">
            Invite Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-r from-indigo-950 to-purple-950 border border-purple-400/10 backdrop-blur-sm">
        {!showSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-white">Invite Family Member</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Send an invitation to join your family workspace. They'll receive an email with instructions to join.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black/20 border-purple-400/20 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="grid gap-2">
                <Textarea
                  placeholder="Add a personal message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-black/20 border-purple-400/20 text-white placeholder:text-zinc-500 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleInvite}
                disabled={!email.trim() || isLoading}
                className={`w-full ${
                  email.trim() && !isLoading
                    ? 'bg-[#3B35C3] hover:bg-[#3B35C3]/90'
                    : 'bg-gray-300 cursor-not-allowed'
                } text-white transition-colors duration-200`}
              >
                {isLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-6 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <DialogTitle className="text-white mb-2">Invitation Sent!</DialogTitle>
            <DialogDescription className="text-zinc-400 mb-6">
              We've sent an invitation email to {email}
            </DialogDescription>
            <Button
              onClick={handleClose}
              className="bg-[#3B35C3] hover:bg-[#3B35C3]/90 text-white"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 