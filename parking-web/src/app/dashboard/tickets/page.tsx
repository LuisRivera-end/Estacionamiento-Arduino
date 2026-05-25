import { Grid, Heading } from "@chakra-ui/react";

import { DataTable } from "@/components/dashboard/DataTable";

export default function TicketsPage() {
  return (
    <Grid gap="5">
      <Heading color="opsText">Tickets</Heading>
      <DataTable
        headers={["Codigo", "Estado", "Pago", "Entrada", "Monto"]}
        rows={[["A1B2C", "Activo", "Pendiente", "09:10", "$3.00 MXN"]]}
      />
    </Grid>
  );
}
