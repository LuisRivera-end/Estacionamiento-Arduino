import { apiGet } from "./client";
import { statusFixture, summaryFixture } from "./fixtures";
import type { StatusResponse, SummaryReport } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

export async function getStatus(accessToken: string): Promise<StatusResponse> {
  if (useFixtures) return statusFixture;

  return apiGet<StatusResponse>("/api/v1/status", { accessToken });
}

export async function getSummary(accessToken: string): Promise<SummaryReport> {
  if (useFixtures) return summaryFixture;

  return apiGet<SummaryReport>("/api/v1/admin/reports/summary", { accessToken });
}
