import { apiGet, apiPost } from "./client";
import type { AuthSetupStatus, BootstrapResponse, StaffProfile } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

export async function bootstrapStaff(accessToken: string): Promise<BootstrapResponse> {
  if (useFixtures) {
    return {
      created: false,
      first_login: false,
      profile: {
        user_id: "fixture-user",
        email: "fixture@example.com",
        display_name: "Fixture User",
        role: "admin",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  return apiPost<BootstrapResponse>("/api/v1/auth/bootstrap", {}, { accessToken });
}

export async function getAuthSetupStatus(): Promise<AuthSetupStatus> {
  if (useFixtures) {
    return {
      allow_initial_account_creation: true,
    };
  }

  return apiGet<AuthSetupStatus>("/api/v1/auth/setup-status");
}

export async function getStaffProfile(accessToken: string): Promise<StaffProfile> {
  if (useFixtures) {
    return {
      user_id: "fixture-user",
      email: "fixture@example.com",
      display_name: "Fixture User",
      role: "admin",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return apiGet<StaffProfile>("/api/v1/auth/me", { accessToken });
}
