import { LoginPageClient } from "./LoginPageClient";

import { getAuthSetupStatus } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  let allowInitialAccountCreation = false;
  let apiError: string | null = null;

  try {
    const setupStatus = await getAuthSetupStatus();
    allowInitialAccountCreation = setupStatus.allow_initial_account_creation;
  } catch (error: any) {
    console.error("Failed to fetch auth setup status:", error);
    apiError = error instanceof Error ? error.message : String(error);
  }

  return (
    <LoginPageClient
      allowInitialAccountCreation={allowInitialAccountCreation}
      apiError={apiError}
    />
  );
}
