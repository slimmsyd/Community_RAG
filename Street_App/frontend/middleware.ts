import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Allow all routes to be accessed without authentication
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true // Always authorize
    }
  }
);

// Only protect settings routes
export const config = {
  matcher: [
    '/settings/:path*'
  ]
}; 