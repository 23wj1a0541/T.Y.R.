import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;
      return NextResponse.redirect(new URL(next, appUrl));
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  return NextResponse.redirect(
    new URL("/auth/login?error=auth_callback_error", appUrl),
  );
}
