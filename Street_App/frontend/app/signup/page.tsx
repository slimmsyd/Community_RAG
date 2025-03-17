"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, User } from "lucide-react";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { UserDetails } from "@/types/user";
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';

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
}

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('signup');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    walletAddress: ''
  });

  // Fetch invitation data if token exists
  useEffect(() => {
    const invitationToken = searchParams.get('invitation');
    if (invitationToken) {
      fetchInvitationData(invitationToken);
    }
  }, [searchParams]);

  const fetchInvitationData = async (token: string) => {
    try {
      const response = await fetch(`/api/invitations/validate/${token}`);
      const data = await response.json();
      if (data.success) {
        setInvitation(data.invitation);
        setFormData(prev => ({ ...prev, email: data.invitation.email }));
      }
    } catch (error) {
      console.error('Error fetching invitation:', error);
    }
  };

  useEffect(() => {
    if (session) {
      console.log("Fetching user details");
      fetchUserDetails();
    }
  }, [session]);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      const email = session?.user?.email;
      if (!email) {
        console.log("No email found in session");
        return;
      }
      const response = await fetch(`/api/users/email/${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.success) {
        setUserDetails(data);
      } else {
        setUserDetails({
          exists: false,
          user: {
            id: "",
            email: email as string,
            name: "User",
            milestones: [],
          },
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUserDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Update form data when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      setFormData(prev => ({
        ...prev,
        walletAddress: address
      }));
    }
  }, [isConnected, address]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("Handling submit");
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // For wallet-only signup, we don't need email/password validation
      if (!formData.walletAddress && formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      // Validate that either email/password or wallet is provided
      if (!formData.walletAddress && (!formData.email || !formData.password)) {
        setError("Please provide either email/password or connect your wallet");
        setIsLoading(false);
        return;
      }

      // Create user account
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || null,
          password: formData.password || null,
          walletAddress: formData.walletAddress || null
        })
      });

      const signupData = await signupResponse.json();
      console.log("Signup data received:", signupData);

      if (!signupData.success) {
        setError(signupData.error || 'Failed to create account');
        setIsLoading(false);
        return;
      }

      // If there's an invitation, accept it
      if (invitation) {
        try {
          const acceptResponse = await fetch(`/api/invitations/accept/${searchParams.get('invitation')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: signupData.user.id })
          });

          const acceptData = await acceptResponse.json();
          if (!acceptData.success) {
            console.error('Failed to accept invitation:', acceptData.error);
          }
        } catch (inviteError) {
          console.error("Error during invitation acceptance:", inviteError);
        }
      }

      // Sign in the user
      const signInResult = await signIn('credentials', {
        ...(formData.walletAddress ? { walletAddress: formData.walletAddress } : { email: formData.email, password: formData.password }),
        redirect: false,
        callbackUrl: '/app/dashboard'
      });

      if (signInResult?.error) {
        setError(signInResult.error);
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard
      if (signInResult?.url) {
        router.push(signInResult.url);
      } else {
        router.push('/app/dashboard');
      }

    } catch (error: any) {
      console.error("Error during signup:", error);
      setError(error.message || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    setIsRedirecting(true);

    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/app/dashboard'
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.url) {
        router.push(result.url);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsRedirecting(false);
    } finally {
      setIsLoading(false);
    }
  };

  const skipToApp = () => {
    router.push('/app/dashboard');
  };

  if (isRedirecting) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-900">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="w-full max-w-[1200px] h-[700px] gap-[20px] flex rounded-3xl overflow-hidden bg-white">
        {/* Left side - Form */}
        <div className="w-full md:w-1/2 bg-[#f3f3f38e] p-8 md:p-12 flex flex-col justify-center rounded-3xl">
          <div className="mb-8">
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mb-6 border border-gray-200">
              <Image
                src="/assets/KinnectLogo.png"
                alt="Logo"
                width={68}
                height={68}
                className="object-contain"
              />
            </div>
            
            {/* Skip button */}
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                onClick={skipToApp}
                className="text-gray-600 hover:text-gray-900"
              >
                Skip Sign Up →
              </Button>
            </div>

            {/* Tab Switching */}
            <div className="flex space-x-4 mb-8 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('login')}
                className={`pb-2 px-4 ${
                  activeTab === 'login'
                    ? 'border-b-2 border-gray-900 text-gray-900 font-medium'
                    : 'text-gray-500'
                }`}
              >
                Log in
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`pb-2 px-4 ${
                  activeTab === 'signup'
                    ? 'border-b-2 border-gray-900 text-gray-900 font-medium'
                    : 'text-gray-500'
                }`}
              >
                Sign up
              </button>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {activeTab === 'signup' 
                ? (invitation 
                    ? `Join ${invitation.workspace.name}`
                    : 'Create an account')
                : 'Welcome back'}
            </h1>
            <p className="text-gray-500">
              {activeTab === 'signup'
                ? (invitation 
                    ? `Invited by ${invitation.inviter.name}`
                    : 'Start preserving your family history today!')
                : 'Sign in to continue your journey'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'signup' && (
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-white border-gray-200 h-12 pl-4 pr-10 text-gray-900 placeholder:text-gray-400 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <User className="absolute right-3 top-3 h-6 w-6 text-gray-400" />
              </div>
            )}

            {!formData.walletAddress && (
              <>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required={!formData.walletAddress}
                    disabled={!!invitation}
                    className="bg-white border-gray-200 h-12 pl-4 pr-10 text-gray-900 placeholder:text-gray-400 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <Mail className="absolute right-3 top-3 h-6 w-6 text-gray-400" />
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!formData.walletAddress}
                    className="bg-white border-gray-200 h-12 pl-4 pr-10 text-gray-900 placeholder:text-gray-400 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-6 w-6 text-gray-400" />
                    ) : (
                      <Eye className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>

                {activeTab === 'signup' && (
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required={!formData.walletAddress}
                      className="bg-white border-gray-200 h-12 pl-4 pr-10 text-gray-900 placeholder:text-gray-400 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-6 w-6 text-gray-400" />
                      ) : (
                        <Eye className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Wallet Connection Button */}
            <div className="relative">
              {isConnected ? (
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
                  <span className="text-sm text-gray-600">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  <Button
                    type="button"
                    onClick={() => disconnect()}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-200"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={() => open()}
                  className="w-full bg-[#3B35C3] hover:bg-[#3B35C3]/90 text-white h-12 rounded-xl font-medium"
                >
                  Connect Wallet
                </Button>
              )}
            </div>

            {activeTab === 'login' && (
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm text-gray-900 hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || 
                (!formData.walletAddress && (!formData.email || !formData.password || (activeTab === 'signup' && (!formData.name || !formData.confirmPassword))))}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 rounded-xl font-medium transition-all duration-200 border border-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {activeTab === 'signup' ? 'Signing up...' : 'Logging in...'}
                </span>
              ) : (
                activeTab === 'signup' ? (invitation ? 'Create Account & Join' : 'Sign Up') : 'Log In'
              )}
            </Button>

            {!searchParams.get('invitation') && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-[#f3f3f38e] px-2 text-gray-500">or</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  type="button"
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-900 h-12 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="41" fill="none" viewBox="0 0 40 41">
                    <rect width="40" height="40" y="0.5" fill="#fff" rx="4"></rect>
                    <g clipPath="url(#googleLogo_svg__a)">
                      <path fill="#4285F4" d="M31.766 20.776c0-.815-.066-1.635-.207-2.438H20.24v4.621h6.482a5.554 5.554 0 0 1-2.399 3.647v2.998h3.867c2.271-2.09 3.576-5.177 3.576-8.828Z"></path>
                      <path fill="#34A853" d="M20.24 32.5c3.237 0 5.966-1.062 7.955-2.896l-3.867-2.998c-1.076.731-2.465 1.146-4.084 1.146-3.13 0-5.784-2.112-6.737-4.952h-3.99v3.091a12.002 12.002 0 0 0 10.723 6.61Z"></path>
                      <path fill="#FBBC04" d="M13.503 22.8a7.187 7.187 0 0 1 0-4.594v-3.091H9.517a12.01 12.01 0 0 0 0 10.776l3.986-3.09Z"></path>
                      <path fill="#EA4335" d="M20.24 13.25a6.52 6.52 0 0 1 4.603 1.799l3.427-3.426A11.533 11.533 0 0 0 20.24 8.5a11.998 11.998 0 0 0-10.723 6.614l3.986 3.09c.948-2.843 3.607-4.955 6.737-4.955Z"></path>
                    </g>
                    <defs>
                      <clipPath id="googleLogo_svg__a">
                        <path fill="#fff" d="M8 8.5h24v24H8z"></path>
                      </clipPath>
                    </defs>
                  </svg>
                  Continue with Google
                </button>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-gray-500">
            {activeTab === 'signup' ? (
              <>
                Already have an account?{" "}
                <button onClick={() => setActiveTab('login')} className="text-gray-900 hover:underline font-medium">
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button onClick={() => setActiveTab('signup')} className="text-gray-900 hover:underline font-medium">
                  Sign up
                </button>
              </>
            )}
          </p>
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
              src="/assets/Earth.png"
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
  );
}