import { Grid, Heading, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { BackupRequestButton } from "@/components/dashboard/BackupRequestButton";
import { DataTable } from "@/components/dashboard/DataTable";
import { SyncPushButton } from "@/components/dashboard/SyncPushButton";
import { getBackups } from "@/lib/api/backups";
import { getSyncStatus } from "@/lib/api/sync";
import type { SyncStatus } from "@/lib/api/types";
import { getServerAccessToken } from "@/lib/auth/server";
import { formatDateTime } from "@/lib/formatters";

export default async function BackupsPage() {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  const backups = await getBackups(accessToken);

  // El estado de sync es informativo: si falla (p.ej. backend reiniciando) la
  // página no debe romperse, solo ocultar la tabla de estado.
  let syncStatus: SyncStatus | null = null;
  try {
    syncStatus = await getSyncStatus(accessToken);
  } catch {
    syncStatus = null;
  }

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

      <Heading color="opsText" size="md">
        Sincronización a la nube
      </Heading>
      {syncStatus && !syncStatus.configured ? (
        <Text color="opsMuted">
          La sincronización no está configurada. Define REMOTE_DB_URL en el modo
          local para habilitar el envío a Supabase/Render.
        </Text>
      ) : null}
      {syncStatus?.last_error ? (
        <Text color="red.300">Último error: {syncStatus.last_error}</Text>
      ) : null}
      <SyncPushButton />
      {syncStatus ? (
        <DataTable
          headers={["Tabla", "Última sincronización", "Pendientes", "Estado"]}
          rows={syncStatus.tables.map((table) => [
            table.table_name,
            table.last_synced_at ? formatDateTime(table.last_synced_at) : "—",
            String(table.pending_estimate),
            table.last_status ?? "—",
          ])}
        />
      ) : (
        <Text color="opsMuted">
          No se pudo obtener el estado de sincronización.
        </Text>
      )}
    </Grid>
  );
}
