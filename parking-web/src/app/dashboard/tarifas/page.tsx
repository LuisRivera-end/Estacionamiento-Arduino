import { Grid, Heading } from "@chakra-ui/react";

import { DataTable } from "@/components/dashboard/DataTable";

export default function PricingPage() {
  return (
    <Grid gap="5">
      <Heading color="opsText">Tarifas</Heading>
      <DataTable
        headers={["Regla", "Valor"]}
        rows={[
          ["Tolerancia", "5 minutos"],
          ["Bloque", "30 minutos"],
          ["Monto", "$3.00 MXN"],
          ["Extravio", "Configurable"],
        ]}
      />
    </Grid>
  );
}
