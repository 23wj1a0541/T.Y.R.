import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const internalPath = pathname.replace(/^\/app/, "") || "/dashboard";

  const url = request.nextUrl.clone();
  url.pathname = internalPath;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/app", "/app/:path*"],
};
