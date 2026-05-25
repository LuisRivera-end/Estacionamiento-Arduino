import { apiPost } from "./client";
import { backupFixture } from "./fixtures";
import type { BackupExport } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

export async function requestBackup(requestedBy: string): Promise<BackupExport> {
  if (useFixtures) return backupFixture;

  return apiPost<BackupExport>("/backups/export", {
    scope: "full",
    requested_by: requestedBy,
  });
}
