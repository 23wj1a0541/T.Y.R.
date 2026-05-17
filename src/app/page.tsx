import { redirect } from "next/navigation";

import { LandingPage } from "@/components/landing/landing-page";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/app/dashboard");
  }

  return <LandingPage />;
}
