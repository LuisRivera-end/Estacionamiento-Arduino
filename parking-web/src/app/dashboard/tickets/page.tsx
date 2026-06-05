import NextLink from "next/link";
import { Box, Button, Grid, Heading, HStack, Input, Text } from "@chakra-ui/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SelectBox = Box as any;

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
  const pageSize = positiveInteger(firstParam(resolvedSearchParams.page_size), 15);
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
          <Input defaultValue={code} name="code" placeholder="Código ticket" w="220px" bg="opsPanel" borderColor="opsBorder" color="opsText" />
          <SelectBox as="select" defaultValue={status} name="status" h="10" bg="opsPanel" color="opsText" borderColor="opsBorder" borderWidth="1px" borderRadius="md" px="3" outline="none" _focus={{ borderColor: "opsCyan" }}>
            <option value="">Estado: todos</option>
            <option value="active">Activo</option>
            <option value="exited">Salido</option>
            <option value="cancelled">Cancelado</option>
          </SelectBox>
          <SelectBox as="select" defaultValue={paymentStatus} name="payment_status" h="10" bg="opsPanel" color="opsText" borderColor="opsBorder" borderWidth="1px" borderRadius="md" px="3" outline="none" _focus={{ borderColor: "opsCyan" }}>
            <option value="">Pago: todos</option>
            <option value="unpaid">No pagado</option>
            <option value="paid">Pagado</option>
            <option value="refunded">Reembolsado</option>
          </SelectBox>
          <SelectBox as="select" defaultValue={lostTicketRaw} name="lost_ticket" h="10" bg="opsPanel" color="opsText" borderColor="opsBorder" borderWidth="1px" borderRadius="md" px="3" outline="none" _focus={{ borderColor: "opsCyan" }}>
            <option value="">Extraviado: todos</option>
            <option value="true">Extraviado: sí</option>
            <option value="false">Extraviado: no</option>
          </SelectBox>
          <Input defaultValue={String(pageSize)} name="page_size" type="number" w="120px" bg="opsPanel" borderColor="opsBorder" color="opsText" />
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
        headers={["Código", "Estado", "Pago", "Entrada", "Monto", "Extraviado"]}
        rows={ticketsPage.items.map((ticket) => [
          ticket.ticket_code,
          ticket.status,
          ticket.payment_status,
          formatDateTime(ticket.entry_at),
          formatCurrency(ticket.calculated_amount, "MXN"),
          ticket.lost_ticket ? "Sí" : "No",
        ])}
      />

      <HStack justify="space-between">
        {currentPage > 1 ? (
          <Button asChild variant="outline" borderColor="opsBorder" color="opsText" _hover={{ bg: "rgba(255, 255, 255, 0.06)", borderColor: "opsText" }}>
            <NextLink href={buildPageHref(currentPage - 1, baseQuery)}>
              Anterior
            </NextLink>
          </Button>
        ) : (
          <Button disabled variant="outline" borderColor="rgba(30, 46, 74, 0.6)" color="opsMuted" opacity={0.35}>
            Anterior
          </Button>
        )}
        <Text color="opsMuted">
          Página {currentPage} de {totalPages}
        </Text>
        {currentPage < totalPages ? (
          <Button asChild colorPalette="cyan" variant="outline" borderColor="opsCyan" color="opsCyan" _hover={{ bg: "rgba(6, 182, 212, 0.12)" }}>
            <NextLink href={buildPageHref(currentPage + 1, baseQuery)}>
              Siguiente
            </NextLink>
          </Button>
        ) : (
          <Button disabled colorPalette="cyan" variant="outline" borderColor="rgba(6, 182, 212, 0.3)" color="opsMuted" opacity={0.35}>
            Siguiente
          </Button>
        )}
      </HStack>
    </Grid>
  );
}
