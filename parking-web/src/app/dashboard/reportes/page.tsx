import { Grid, Heading, Text } from "@chakra-ui/react";

import { ChartCard } from "@/components/dashboard/ChartCard";

export default function ReportsPage() {
  return (
    <Grid gap="5">
      <Heading color="opsText">Reportes</Heading>
      <ChartCard title="Ingresos, tickets y actividad">
        <Text color="opsMuted">
          Las graficas se conectaran a `/reports/summary`, `/reports/revenue` y
          `/reports/tickets`.
        </Text>
      </ChartCard>
    </Grid>
  );
}
