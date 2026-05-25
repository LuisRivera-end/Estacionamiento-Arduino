import { redirect } from "next/navigation";

import { AppShell } from "@/components/dashboard/AppShell";
import { createSupabaseServerClient } from "@/lib/auth/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "fixture") {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      redirect("/login");
    }
  }

  return <AppShell>{children}</AppShell>;
}
