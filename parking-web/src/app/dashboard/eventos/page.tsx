import { Grid, Heading } from "@chakra-ui/react";

import { DataTable } from "@/components/dashboard/DataTable";

export default function EventsPage() {
  return (
    <Grid gap="5">
      <Heading color="opsText">Entradas y salidas</Heading>
      <DataTable
        headers={["Fecha", "Tipo", "Ticket", "Dispositivo", "Resultado"]}
        rows={[
          ["2026-05-23 09:10", "Entrada", "A1B2C", "entrada-01", "Autorizada"],
          ["2026-05-23 10:20", "Salida", "A1B2C", "salida-01", "Pago pendiente"],
        ]}
      />
    </Grid>
  );
}
