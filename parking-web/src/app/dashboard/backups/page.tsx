import { Grid, Heading } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { BackupRequestButton } from "@/components/dashboard/BackupRequestButton";
import { DataTable } from "@/components/dashboard/DataTable";
import { getBackups } from "@/lib/api/backups";
import { getServerAccessToken } from "@/lib/auth/server";
import { formatDateTime } from "@/lib/formatters";

export default async function BackupsPage() {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  const backups = await getBackups(accessToken);

  return (
    <Grid gap="5">
      <Heading color="opsText">Backups</Heading>
      <BackupRequestButton />
      <DataTable
        headers={["Fecha", "Estado", "Solicitante"]}
        rows={backups.map((backup) => [
          formatDateTime(backup.created_at),
          backup.status,
          backup.requested_by ?? "sistema",
        ])}
      />
    </Grid>
  );
}
