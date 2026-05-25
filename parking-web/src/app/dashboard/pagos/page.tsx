import { Grid, Heading } from "@chakra-ui/react";

import { DataTable } from "@/components/dashboard/DataTable";
import { SimulationNotice } from "@/components/shared/SimulationNotice";

export default function PaymentsPage() {
  return (
    <Grid gap="5">
      <Heading color="opsText">Pagos simulados</Heading>
      <SimulationNotice />
      <DataTable
        headers={["Ticket", "Monto", "Metodo", "Estado", "Referencia"]}
        rows={[
          [
            "A1B2C",
            "$3.00 MXN",
            "Stripe simulado",
            "Simulado",
            "sim_stripe_20260523_001",
          ],
        ]}
      />
    </Grid>
  );
}
