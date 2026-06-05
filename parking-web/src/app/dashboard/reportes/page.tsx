import { Box, Button, Grid, Heading, HStack, Input, SimpleGrid, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { redirect } from "next/navigation";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { FinancialSummaryChart } from "@/components/dashboard/FinancialSummaryChart";
import { PaymentDistributionChart } from "@/components/dashboard/PaymentDistributionChart";
import { getSummary } from "@/lib/api/reports";
import { getServerAccessToken } from "@/lib/auth/server";
import { formatCurrency } from "@/lib/formatters";

type DashboardSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const startDate = firstParam(resolvedSearchParams.start_date) ?? "";
  const endDate = firstParam(resolvedSearchParams.end_date) ?? "";

  const summary = await getSummary(accessToken, {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const isFiltered = !!(startDate || endDate);

  return (
    <Grid gap="5">
      <Heading color="opsText">Reportes</Heading>

      <form method="get">
        <HStack align="end" flexWrap="wrap" gap="3">
          <Box>
            <Text color="opsMuted" fontSize="xs" mb="1" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
              Fecha inicio
            </Text>
            <Input
              type="date"
              name="start_date"
              defaultValue={startDate}
              bg="opsPanel"
              borderColor="opsBorder"
              color="opsText"
              w="180px"
              outline="none"
              _focus={{ borderColor: "opsCyan" }}
            />
          </Box>
          <Box>
            <Text color="opsMuted" fontSize="xs" mb="1" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
              Fecha fin
            </Text>
            <Input
              type="date"
              name="end_date"
              defaultValue={endDate}
              bg="opsPanel"
              borderColor="opsBorder"
              color="opsText"
              w="180px"
              outline="none"
              _focus={{ borderColor: "opsCyan" }}
            />
          </Box>
          <Button colorPalette="cyan" type="submit">
            Filtrar
          </Button>
          {isFiltered && (
            <Button
              asChild
              variant="outline"
              borderColor="opsBorder"
              color="opsText"
              _hover={{ bg: "rgba(255, 255, 255, 0.06)" }}
            >
              <NextLink href="/dashboard/reportes">
                Limpiar
              </NextLink>
            </Button>
          )}
        </HStack>
      </form>
      
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6" alignItems="start">
        <Grid gap="3">
          <Heading color="opsText" size="md">
            {isFiltered ? "Resumen del período" : "Resumen diario"}
          </Heading>
          <DataTable
            headers={["Indicador", "Valor"]}
            rows={[
              [isFiltered ? "Entradas" : "Entradas hoy", summary.entries_today],
              [isFiltered ? "Salidas" : "Salidas hoy", summary.exits_today],
              ["Tickets pagados", summary.paid_tickets],
              ["Tickets extraviados", summary.lost_tickets],
              [
                isFiltered ? "Ingresos del período" : "Ingresos del día",
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


