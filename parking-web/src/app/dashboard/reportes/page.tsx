import { Grid, Heading } from "@chakra-ui/react";
import { redirect } from "next/navigation";

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
      <Heading color="opsText" size="md" mt="2">
        Resumen diario
      </Heading>
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
          [
            "Total descontado",
            formatCurrency(summary.total_discount_today, "MXN"),
          ],
          ["Pagos con descuento adulto mayor", summary.discounted_payments_senior],
          ["Pagos con descuento estudiante", summary.discounted_payments_student],
        ]}
      />
    </Grid>
  );
}
