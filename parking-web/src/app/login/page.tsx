import { LoginPageClient } from "./LoginPageClient";

import { getAuthSetupStatus } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const setupStatus = await getAuthSetupStatus();

  return (
    <LoginPageClient
      allowInitialAccountCreation={setupStatus.allow_initial_account_creation}
    />
  );
}
