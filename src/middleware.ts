import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

function applyAppRewrite(request: NextRequest, response: NextResponse) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/app")) {
    return response;
  }

  const internalPath = pathname.replace(/^\/app/, "") || "/dashboard";
  const url = request.nextUrl.clone();
  url.pathname = internalPath;

  const rewriteResponse = NextResponse.rewrite(url, { request });

  response.cookies.getAll().forEach((cookie) => {
    rewriteResponse.cookies.set(cookie);
  });

  return rewriteResponse;
}

export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request);
  return applyAppRewrite(request, sessionResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
