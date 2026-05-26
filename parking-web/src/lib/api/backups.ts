import { apiGet, apiPost } from "./client";
import type { BackupExport, BackupItem } from "./types";

export async function requestBackup(
  requestedBy: string,
  accessToken: string,
): Promise<BackupExport> {
  return apiPost<BackupExport>(
    "/api/v1/admin/backups/export",
    {
      scope: "full",
      requested_by: requestedBy,
    },
    { accessToken },
  );
}

export async function getBackups(accessToken: string): Promise<BackupItem[]> {
  return apiGet<BackupItem[]>("/api/v1/admin/backups", { accessToken });
}
