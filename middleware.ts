import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define route access rules
const routeAccess: Record<string, string[]> = {
  "/dashboard": ["admin", "manager", "staff_pembelian", "staff_gudang"],
  "/products": ["admin", "manager", "staff_pembelian"],
  "/categories": ["admin"],
  "/units": ["admin"],
  "/suppliers": ["admin", "manager", "staff_pembelian"],
  "/eoq": ["admin", "manager"],
  "/eoq-calculations": ["admin", "manager"],
  "/purchase-orders": ["manager", "staff_pembelian"],
  "/stock": ["admin", "manager", "staff_gudang"],
  "/stock-transactions": ["admin", "manager", "staff_gudang"],
  "/demand-history": ["admin", "manager", "staff_pembelian"],
  "/users": ["admin"],
  "/profile": ["admin", "manager", "staff_pembelian", "staff_gudang"],
  "/notifications": ["admin", "manager", "staff_pembelian", "staff_gudang"],
  "/api/profile": ["admin", "manager", "staff_pembelian", "staff_gudang"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for login, API routes, and static files
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If no token and not login page, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  const userRole = token.role as string;

  // Find matching route pattern
  for (const [route, allowedRoles] of Object.entries(routeAccess)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      if (!allowedRoles.includes(userRole)) {
        // Redirect to unauthorized page
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
