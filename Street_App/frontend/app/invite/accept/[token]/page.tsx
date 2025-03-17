'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface InvitationData {
  email: string;
  workspace: {
    id: string;
    name: string;
  };
  inviter: {
    name: string;
    email: string;
  };
  expiresAt: string;
}

export default function InviteAcceptPage({
  params
}: {
  params: { token: string };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);

  useEffect(() => {
    const validateInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/validate/${params.token}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error);
          return;
        }

        setInvitation(data.invitation);
      } catch (error) {
        setError('Failed to validate invitation');
      } finally {
        setIsLoading(false);
      }
    };

    validateInvitation();
  }, [params.token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4">
        <Card className="max-w-md w-full p-6 bg-gradient-to-r from-indigo-950 to-purple-950 border border-purple-400/10 backdrop-blur-sm">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Invalid Invitation</h2>
            <p className="text-zinc-400 mb-6">{error}</p>
            <Button
              onClick={() => router.push('/')}
              className="bg-[#3B35C3] hover:bg-[#3B35C3]/90 text-white"
            >
              Return Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4">
      <Card className="max-w-md w-full p-6 bg-gradient-to-r from-indigo-950 to-purple-950 border border-purple-400/10 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-white mb-2">Join {invitation.workspace.name}</h2>
          <p className="text-zinc-400">
            {invitation.inviter.name} ({invitation.inviter.email}) has invited you to join their family workspace
          </p>
        </div>

        {/* Sign-up form will be added here in the next step */}
        <Button
          onClick={() => router.push(`/signup?invitation=${params.token}`)}
          className="w-full bg-[#3B35C3] hover:bg-[#3B35C3]/90 text-white"
        >
          Create Account & Join
        </Button>

        <p className="text-sm text-zinc-500 text-center mt-4">
          Already have an account?{' '}
          <button
            onClick={() => router.push(`/login?invitation=${params.token}`)}
            className="text-purple-400 hover:text-purple-300"
          >
            Log in
          </button>
        </p>
      </Card>
    </div>
  );
} 