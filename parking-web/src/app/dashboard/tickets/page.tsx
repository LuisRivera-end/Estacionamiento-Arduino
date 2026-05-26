import NextLink from "next/link";
import { Button, Grid, Heading, HStack, Input, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { DataTable } from "@/components/dashboard/DataTable";
import { getAdminTickets } from "@/lib/api/reports";
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
  return `/dashboard/tickets?${params.toString()}`;
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const code = firstParam(resolvedSearchParams.code) ?? "";
  const status = firstParam(resolvedSearchParams.status) ?? "";
  const paymentStatus = firstParam(resolvedSearchParams.payment_status) ?? "";
  const lostTicketRaw = firstParam(resolvedSearchParams.lost_ticket) ?? "";
  const page = positiveInteger(firstParam(resolvedSearchParams.page), 1);
  const pageSize = positiveInteger(firstParam(resolvedSearchParams.page_size), 25);
  const lostTicket =
    lostTicketRaw === "true"
      ? true
      : lostTicketRaw === "false"
        ? false
        : undefined;

  const ticketsPage = await getAdminTickets(accessToken, {
    page,
    pageSize,
    code: code || undefined,
    status: status || undefined,
    paymentStatus: paymentStatus || undefined,
    lostTicket,
  });

  const totalPages = Math.max(1, Math.ceil(ticketsPage.total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const firstItem = ticketsPage.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, ticketsPage.total);
  const baseQuery = {
    code: code || undefined,
    status: status || undefined,
    payment_status: paymentStatus || undefined,
    lost_ticket: lostTicketRaw || undefined,
    page_size: String(pageSize),
  };

  return (
    <Grid gap="5">
      <Heading color="opsText">Tickets</Heading>

      <form method="get">
        <HStack align="end" flexWrap="wrap" gap="3">
          <Input defaultValue={code} name="code" placeholder="Codigo ticket" w="220px" />
          <Input
            defaultValue={status}
            name="status"
            placeholder="status (active/exited/cancelled)"
            w="260px"
          />
          <Input
            defaultValue={paymentStatus}
            name="payment_status"
            placeholder="payment_status (unpaid/paid/refunded)"
            w="280px"
          />
          <select defaultValue={lostTicketRaw} name="lost_ticket">
            <option value="">Extraviado: todos</option>
            <option value="true">Extraviado: si</option>
            <option value="false">Extraviado: no</option>
          </select>
          <Input defaultValue={String(pageSize)} name="page_size" type="number" w="120px" />
          <input name="page" type="hidden" value="1" />
          <Button colorPalette="cyan" type="submit">
            Filtrar
          </Button>
        </HStack>
      </form>

      <Text color="opsMuted">
        Mostrando {firstItem}-{lastItem} de {ticketsPage.total}
      </Text>

      <DataTable
        headers={["Codigo", "Estado", "Pago", "Entrada", "Monto", "Extraviado"]}
        rows={ticketsPage.items.map((ticket) => [
          ticket.ticket_code,
          ticket.status,
          ticket.payment_status,
          formatDateTime(ticket.entry_at),
          formatCurrency(ticket.calculated_amount, "MXN"),
          ticket.lost_ticket ? "Si" : "No",
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
