import { NextResponse, type NextRequest } from "next/server";
import { personById } from "@/config/people";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

// Every page needs a valid session except the sign-in page.
export function proxy(request: NextRequest) {
  const session = verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const signedIn = Boolean(session && personById(session.uid));
  const path = request.nextUrl.pathname;

  if (path === "/sign-in") {
    return signedIn ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (signedIn) return NextResponse.next();

  if (path.startsWith("/api/")) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const to = request.nextUrl.clone();
  to.pathname = "/sign-in";
  to.search = "";
  return NextResponse.redirect(to);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
