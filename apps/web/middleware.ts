import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication
const PROTECTED_PATHS = ["/dashboard", "/onboarding"]

// Routes that are always public
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/invite",
]

export default auth((req: NextRequest & { auth: { user?: { empresaId?: string | null; onboardingStep?: number } } | null }) => {
  const { nextUrl, auth: session } = req
  const pathname = nextUrl.pathname

  const isProtected = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  )
  const isOnboarding = pathname.startsWith("/onboarding")
  const isDashboard = pathname.startsWith("/dashboard")
  const isPublicApiAuth = pathname.startsWith("/api/auth")

  // Allow API auth routes without session check
  if (isPublicApiAuth) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login for protected routes
  if (!session && isProtected) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated but no empresa, redirect to onboarding (unless already there)
  if (session && !session.user?.empresaId && isDashboard) {
    return NextResponse.redirect(new URL("/onboarding/empresa", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
