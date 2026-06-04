import { Grid, Heading, SimpleGrid } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import { OperationalSummaryChart } from "@/components/dashboard/OperationalSummaryChart";
import { getStatus, getSummary } from "@/lib/api/reports";
import { getServerAccessToken } from "@/lib/auth/server";
import { formatCurrency } from "@/lib/formatters";

export default async function DashboardPage() {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  const [status, summary] = await Promise.all([
    getStatus(accessToken),
    getSummary(accessToken),
  ]);

  return (
    <Grid gap="6">
      <Heading color="opsText">Resumen operativo</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="4">
        <MetricCard
          label="Disponibles"
          tone="green"
          value={status.available_spaces}
        />
        <MetricCard
          label="Ocupados"
          tone="cyan"
          value={status.occupied_spaces}
        />
        <MetricCard label="Tickets activos" value={status.active_tickets} />
        <MetricCard
          label="Ingresos hoy"
          tone="yellow"
          value={formatCurrency(summary.simulated_revenue_today, "MXN")}
        />
        <MetricCard label="Entradas hoy" value={summary.entries_today} />
        <MetricCard label="Salidas hoy" value={summary.exits_today} />
        <MetricCard
          label="Tickets pagados"
          tone="green"
          value={summary.paid_tickets}
        />
        <MetricCard
          label="Extraviados"
          tone="red"
          value={summary.lost_tickets}
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
        <ChartCard title="Ocupación de espacios">
          <OccupancyChart
            capacityTotal={status.capacity_total}
            occupiedSpaces={status.occupied_spaces}
            availableSpaces={status.available_spaces}
            lastEntryAt={status.last_entry_at}
            lastExitAt={status.last_exit_at}
          />
        </ChartCard>
        <ChartCard title="Actividad del día">
          <OperationalSummaryChart
            entriesToday={summary.entries_today}
            exitsToday={summary.exits_today}
            paidTickets={summary.paid_tickets}
            lostTickets={summary.lost_tickets}
          />
        </ChartCard>
      </SimpleGrid>
    </Grid>
  );
}

