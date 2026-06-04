import { Grid, Heading, SimpleGrid } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { FinancialSummaryChart } from "@/components/dashboard/FinancialSummaryChart";
import { PaymentDistributionChart } from "@/components/dashboard/PaymentDistributionChart";
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
      
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6" alignItems="start">
        <Grid gap="3">
          <Heading color="opsText" size="md">
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
                "Ingresos del día",
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

        <Grid gap="6">
          <ChartCard title="Distribución de tarifas aplicadas">
            <PaymentDistributionChart
              paidTickets={summary.paid_tickets}
              discountedPaymentsSenior={summary.discounted_payments_senior}
              discountedPaymentsStudent={summary.discounted_payments_student}
            />
          </ChartCard>
          
          <ChartCard title="Ingresos vs Descuentos">
            <FinancialSummaryChart
              simulatedRevenueToday={summary.simulated_revenue_today}
              totalDiscountToday={summary.total_discount_today}
            />
          </ChartCard>
        </Grid>
      </SimpleGrid>
    </Grid>
  );
}

