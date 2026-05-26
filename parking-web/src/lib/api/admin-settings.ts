import { apiGet, apiPut } from "./client";
import type { ParkingSettings, PricingRule } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

const settingsFixture: ParkingSettings = {
  capacity_total: 40,
  timezone: "America/Mexico_City",
  currency: "MXN",
};

const pricingFixture: PricingRule = {
  name: "MVP default",
  free_tolerance_minutes: 5,
  block_minutes: 30,
  block_amount: 10,
  lost_ticket_fee: 150,
  is_active: true,
};

export async function getParkingSettings(
  accessToken: string,
): Promise<ParkingSettings> {
  if (useFixtures) return settingsFixture;

  return apiGet<ParkingSettings>("/api/v1/admin/settings", { accessToken });
}

export async function updateParkingSettings(
  payload: ParkingSettings,
  accessToken: string,
): Promise<ParkingSettings> {
  if (useFixtures) return payload;

  return apiPut<ParkingSettings>("/api/v1/admin/settings", payload, { accessToken });
}

export async function getPricingRule(accessToken: string): Promise<PricingRule> {
  if (useFixtures) return pricingFixture;

  return apiGet<PricingRule>("/api/v1/admin/pricing", { accessToken });
}

export async function updatePricingRule(
  payload: Omit<PricingRule, "is_active">,
  accessToken: string,
): Promise<PricingRule> {
  if (useFixtures) return { ...payload, is_active: true };

  return apiPut<PricingRule>("/api/v1/admin/pricing", payload, { accessToken });
}
