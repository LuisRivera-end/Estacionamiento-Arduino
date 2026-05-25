import { Grid, Heading } from "@chakra-ui/react";

import { DataTable } from "@/components/dashboard/DataTable";

export default function SettingsPage() {
  return (
    <Grid gap="5">
      <Heading color="opsText">Configuracion</Heading>
      <DataTable
        headers={["Parametro", "Valor"]}
        rows={[
          ["Capacidad", "40"],
          ["Zona horaria", "America/Mexico_City"],
          ["Moneda", "MXN"],
          ["Entrada", "entrada-01"],
          ["Salida", "salida-01"],
        ]}
      />
    </Grid>
  );
}
