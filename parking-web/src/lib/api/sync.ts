import { apiGet, apiPost } from "./client";
import type { SyncPushResult, SyncStatus } from "./types";

export async function pushSync(accessToken: string): Promise<SyncPushResult> {
  return apiPost<SyncPushResult>(
    "/api/v1/admin/sync/push",
    { full: false },
    { accessToken },
  );
}

export async function getSyncStatus(accessToken: string): Promise<SyncStatus> {
  return apiGet<SyncStatus>("/api/v1/admin/sync/status", { accessToken });
}
