import { apiGet, apiPost } from "./client";
import { backupFixture } from "./fixtures";
import type { BackupExport, BackupItem } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

export async function requestBackup(
  requestedBy: string,
  accessToken: string,
): Promise<BackupExport> {
  if (useFixtures) return backupFixture;

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
  if (useFixtures) {
    return [
      {
        backup_id: backupFixture.backup_id,
        status: backupFixture.status,
        requested_by: "fixture-user",
        created_at: new Date().toISOString(),
      },
    ];
  }

  return apiGet<BackupItem[]>("/api/v1/admin/backups", { accessToken });
}
