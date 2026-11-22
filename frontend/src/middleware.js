import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Role-based redirects on root
    if (pathname === "/dashboard") {
      const role = token?.role;
      if (role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
      if (role === "OFFICER") return NextResponse.redirect(new URL("/officer", req.url));
      if (role === "MAINTENANCE") return NextResponse.redirect(new URL("/maintenance", req.url));
      if (role === "CITIZEN") return NextResponse.redirect(new URL("/citizen", req.url));
      return NextResponse.redirect(new URL("/citizen", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // Public routes
        if (
          pathname === "/" ||
          pathname.startsWith("/login") ||
          pathname.startsWith("/register") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/_next") ||
          pathname.includes(".")
        ) {
          return true;
        }
        // Protected dashboard routes
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/officer",
    "/officer/:path*",
    "/maintenance",
    "/maintenance/:path*",
    "/citizen",
    "/citizen/:path*",
    "/map",
    "/map/:path*",
    "/analytics",
    "/analytics/:path*",
    "/assistant",
    "/assistant/:path*",
    "/notifications",
    "/notifications/:path*",
    "/dashboard",
    "/dashboard/:path*",
  ],
};
