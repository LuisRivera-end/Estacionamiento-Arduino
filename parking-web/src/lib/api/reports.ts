import { apiGet } from "./client";
import { statusFixture, summaryFixture } from "./fixtures";
import type { StatusResponse, SummaryReport } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

export async function getStatus(): Promise<StatusResponse> {
  if (useFixtures) return statusFixture;

  return apiGet<StatusResponse>("/status");
}

export async function getSummary(): Promise<SummaryReport> {
  if (useFixtures) return summaryFixture;

  return apiGet<SummaryReport>("/reports/summary");
}
