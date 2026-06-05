import { Box, Grid, Heading } from "@chakra-ui/react";
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

      <Grid templateColumns={{ base: "1fr", lg: "1.2fr 1fr" }} gap="6" alignItems="start">
        {/* Table on the left */}
        <Box>
          <DataTable
            headers={["Parametro", "Valor"]}
            rows={[
              ["Nombre", settings.parking_name],
              ["Capacidad", settings.capacity_total],
              ["Zona horaria", settings.timezone],
              ["Expiracion boletos (horas)", settings.ticket_expiration_hours],
            ]}
          />
        </Box>

        {/* Form on the right, sticky */}
        <Box position={{ lg: "sticky" }} top={{ lg: "24px" }} alignSelf="start">
          <SettingsEditor initialSettings={settings} />
        </Box>
      </Grid>
    </Grid>
  );
}
