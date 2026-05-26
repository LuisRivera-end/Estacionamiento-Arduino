import { apiGet, apiPut } from "./client";
import type { ParkingSettings, PricingRule } from "./types";

export async function getParkingSettings(
  accessToken: string,
): Promise<ParkingSettings> {
  return apiGet<ParkingSettings>("/api/v1/admin/settings", { accessToken });
}

export async function updateParkingSettings(
  payload: ParkingSettings,
  accessToken: string,
): Promise<ParkingSettings> {
  return apiPut<ParkingSettings>("/api/v1/admin/settings", payload, { accessToken });
}

export async function getPricingRule(accessToken: string): Promise<PricingRule> {
  return apiGet<PricingRule>("/api/v1/admin/pricing", { accessToken });
}

export async function updatePricingRule(
  payload: Omit<PricingRule, "is_active">,
  accessToken: string,
): Promise<PricingRule> {
  return apiPut<PricingRule>("/api/v1/admin/pricing", payload, { accessToken });
}
