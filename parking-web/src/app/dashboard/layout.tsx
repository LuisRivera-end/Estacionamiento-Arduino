import { redirect } from "next/navigation";

import { AppShell } from "@/components/dashboard/AppShell";
import { bootstrapStaff } from "@/lib/api/auth";
import { createSupabaseServerClient } from "@/lib/auth/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "fixture") {
    const supabase = await createSupabaseServerClient();
    const [{ data: userData }, { data: sessionData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]);

    if (!userData.user || !sessionData.session?.access_token) {
      redirect("/login");
    }

    await bootstrapStaff(sessionData.session.access_token);
  }

  return <AppShell>{children}</AppShell>;
}
