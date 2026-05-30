import NextLink from "next/link";
import { Button, Grid, Heading, HStack, Input, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { DataTable } from "@/components/dashboard/DataTable";
import { SimulationNotice } from "@/components/shared/SimulationNotice";
import { getAdminPayments } from "@/lib/api/reports";
import { getServerAccessToken } from "@/lib/auth/server";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

type DashboardSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

function buildPageHref(
  targetPage: number,
  query: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (!value) continue;
    params.set(key, value);
  }
  params.set("page", String(targetPage));
  return `/dashboard/pagos?${params.toString()}`;
}

function formatPaymentMethod(method: string): string {
  if (method === "simulated_payment") return "Pago simulado";
  if (method === "simulated_stripe") return "Pago simulado legado";
  if (method === "lost_ticket") return "Ticket extraviado";
  if (method === "manual_admin") return "Manual admin";
  return method;
}

function formatDiscountType(discountType: string): string {
  if (discountType === "senior") return "Adulto mayor";
  if (discountType === "student") return "Estudiante";
  return "Sin descuento";
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const ticketCode = firstParam(resolvedSearchParams.ticket_code) ?? "";
  const method = firstParam(resolvedSearchParams.method) ?? "";
  const status = firstParam(resolvedSearchParams.status) ?? "";
  const page = positiveInteger(firstParam(resolvedSearchParams.page), 1);
  const pageSize = positiveInteger(firstParam(resolvedSearchParams.page_size), 25);

  const paymentsPage = await getAdminPayments(accessToken, {
    page,
    pageSize,
    ticketCode: ticketCode || undefined,
    method: method || undefined,
    status: status || undefined,
  });

  const totalPages = Math.max(1, Math.ceil(paymentsPage.total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const firstItem = paymentsPage.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, paymentsPage.total);
  const baseQuery = {
    ticket_code: ticketCode || undefined,
    method: method || undefined,
    status: status || undefined,
    page_size: String(pageSize),
  };

  return (
    <Grid gap="5">
      <Heading color="opsText">Pagos simulados</Heading>
      <SimulationNotice />

      <form method="get">
        <HStack align="end" flexWrap="wrap" gap="3">
          <Input
            defaultValue={ticketCode}
            name="ticket_code"
            placeholder="Codigo ticket"
            w="220px"
          />
          <select defaultValue={method} name="method">
            <option value="">Metodo: todos</option>
            <option value="simulated_payment">Pago simulado</option>
            <option value="simulated_stripe">Pago simulado legado</option>
            <option value="lost_ticket">Ticket extraviado</option>
          </select>
          <select defaultValue={status} name="status">
            <option value="">Estado: todos</option>
            <option value="simulated">Simulado</option>
            <option value="succeeded">Exitoso</option>
            <option value="failed">Fallido</option>
          </select>
          <Input defaultValue={String(pageSize)} name="page_size" type="number" w="120px" />
          <input name="page" type="hidden" value="1" />
          <Button colorPalette="cyan" type="submit">
            Filtrar
          </Button>
        </HStack>
      </form>

      <Text color="opsMuted">
        Mostrando {firstItem}-{lastItem} de {paymentsPage.total}
      </Text>

      <DataTable
        headers={[
          "Fecha",
          "Ticket",
          "Subtotal",
          "Descuento",
          "Total",
          "Metodo",
          "Estado",
          "Referencia",
        ]}
        rows={paymentsPage.items.map((payment) => [
          formatDateTime(payment.created_at),
          payment.ticket_code,
          formatCurrency(payment.subtotal_amount, "MXN"),
          `${formatDiscountType(payment.discount_type)} (-${formatCurrency(payment.discount_amount, "MXN")})`,
          formatCurrency(payment.amount, "MXN"),
          formatPaymentMethod(payment.method),
          payment.status,
          payment.simulation_reference ?? payment.provider_reference ?? "-",
        ])}
      />

      <HStack justify="space-between">
        {currentPage > 1 ? (
          <Button asChild variant="outline">
            <NextLink href={buildPageHref(currentPage - 1, baseQuery)}>
              Anterior
            </NextLink>
          </Button>
        ) : (
          <Button disabled variant="outline">
            Anterior
          </Button>
        )}
        <Text color="opsMuted">
          Pagina {currentPage} de {totalPages}
        </Text>
        {currentPage < totalPages ? (
          <Button asChild colorPalette="cyan" variant="outline">
            <NextLink href={buildPageHref(currentPage + 1, baseQuery)}>
              Siguiente
            </NextLink>
          </Button>
        ) : (
          <Button disabled colorPalette="cyan" variant="outline">
            Siguiente
          </Button>
        )}
      </HStack>
    </Grid>
  );
}