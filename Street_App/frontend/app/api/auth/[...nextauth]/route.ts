import NextAuth from "next-auth"
import { authOptions } from "@/utils/auth";
import dbConnect from '@/utils/dbConnect';
import User from '@/utils/models/User';
import { Session } from 'next-auth';

interface DbUser {
  _id: string;
  email: string;
  name: string;
  familyRole: string;
  workspaces: any[];
  walletAddress?: string | null;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      familyRole?: string;
      workspaces?: any[];
      walletAddress?: string | null;
    }
  }
}

const handler = NextAuth({
  ...authOptions,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          await dbConnect();
          
          // Check if user exists
          const existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            // Create new user
            const newUser = await User.create({
              email: user.email,
              name: user.name,
              familyRole: '',
              profileImage: user.image,
            });
            console.log('Created new user:', user.email);
            (user as any).id = newUser._id;
            return true; // Allow sign in
          } else {
            console.log('User exists:', user.email);
            (user as any).id = existingUser._id;
            return true; // Allow sign in
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return true; // Still allow sign in even if DB operation fails
        }
      }
      return true;
    },
    async session({ session, token }): Promise<Session> {
      if (session?.user) {
        // Add the user ID to the session
        (session.user as any).id = token.sub;
        
        try {
          await dbConnect();
          // Fetch fresh user data from database
          const dbUser = await User.findOne({ email: session.user.email }) as DbUser;
          if (dbUser) {
            session.user.id = dbUser._id;
            session.user.familyRole = dbUser.familyRole;
            session.user.workspaces = dbUser.workspaces;
            session.user.walletAddress = dbUser.walletAddress;
          }
        } catch (error) {
          console.error('Error fetching user data in session callback:', error);
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // Add user ID and wallet address to the token when it's first created
        token.sub = (user as any).id;
        token.walletAddress = (user as any).walletAddress;
      }
      return token;
    },
  },
});

export { handler as GET, handler as POST }

