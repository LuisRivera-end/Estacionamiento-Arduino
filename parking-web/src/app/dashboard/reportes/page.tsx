import { Grid, Heading, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { getSummary } from "@/lib/api/reports";
import { getServerAccessToken } from "@/lib/auth/server";
import { formatCurrency } from "@/lib/formatters";

export default async function ReportsPage() {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  const summary = await getSummary(accessToken);

  return (
    <Grid gap="5">
      <Heading color="opsText">Reportes</Heading>
      <ChartCard title="Resumen diario">
        <Text color="opsMuted">
          Datos obtenidos en tiempo real desde base de datos via `/admin/reports/summary`.
        </Text>
      </ChartCard>
      <DataTable
        headers={["Indicador", "Valor"]}
        rows={[
          ["Entradas hoy", summary.entries_today],
          ["Salidas hoy", summary.exits_today],
          ["Tickets pagados", summary.paid_tickets],
          ["Tickets extraviados", summary.lost_tickets],
          [
            "Ingresos simulados",
            formatCurrency(summary.simulated_revenue_today, "MXN"),
          ],
        ]}
      />
    </Grid>
  );
}
