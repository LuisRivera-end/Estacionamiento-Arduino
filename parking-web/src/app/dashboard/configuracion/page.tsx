import { Grid, Heading } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { DataTable } from "@/components/dashboard/DataTable";
import { SettingsEditor } from "@/components/dashboard/SettingsEditor";
import { getParkingSettings } from "@/lib/api/admin-settings";
import { getServerAccessToken } from "@/lib/auth/server";

export default async function SettingsPage() {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  const settings = await getParkingSettings(accessToken);

  return (
    <Grid gap="5">
      <Heading color="opsText">Configuracion</Heading>
      <SettingsEditor initialSettings={settings} />
      <DataTable
        headers={["Parametro", "Valor"]}
        rows={[
          ["Capacidad", settings.capacity_total],
          ["Zona horaria", settings.timezone],
          ["Moneda", settings.currency],
        ]}
      />
    </Grid>
  );
}
