import NextLink from "next/link";
import { Button, Grid, Heading, HStack, Input, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { DataTable } from "@/components/dashboard/DataTable";
import { getAdminEvents } from "@/lib/api/reports";
import { getServerAccessToken } from "@/lib/auth/server";
import { formatDateTime } from "@/lib/formatters";

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
  return `/dashboard/eventos?${params.toString()}`;
}

export default async function EventsPage({
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
  const eventTypeRaw = firstParam(resolvedSearchParams.event_type) ?? "";
  const deviceId = firstParam(resolvedSearchParams.device_id) ?? "";
  const lostTicketRaw = firstParam(resolvedSearchParams.lost_ticket) ?? "";
  const page = positiveInteger(firstParam(resolvedSearchParams.page), 1);
  const pageSize = positiveInteger(firstParam(resolvedSearchParams.page_size), 25);
  const eventType =
    eventTypeRaw === "entry" || eventTypeRaw === "exit" ? eventTypeRaw : undefined;
  const lostTicket =
    lostTicketRaw === "true"
      ? true
      : lostTicketRaw === "false"
        ? false
        : undefined;

  const eventsPage = await getAdminEvents(accessToken, {
    page,
    pageSize,
    ticketCode: ticketCode || undefined,
    eventType,
    deviceId: deviceId || undefined,
    lostTicket,
  });

  const totalPages = Math.max(1, Math.ceil(eventsPage.total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const firstItem = eventsPage.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, eventsPage.total);
  const baseQuery = {
    ticket_code: ticketCode || undefined,
    event_type: eventTypeRaw || undefined,
    device_id: deviceId || undefined,
    lost_ticket: lostTicketRaw || undefined,
    page_size: String(pageSize),
  };

  return (
    <Grid gap="5">
      <Heading color="opsText">Entradas y salidas</Heading>

      <form method="get">
        <HStack align="end" flexWrap="wrap" gap="3">
          <Input
            defaultValue={ticketCode}
            name="ticket_code"
            placeholder="Codigo ticket"
            w="220px"
          />
          <select defaultValue={eventTypeRaw} name="event_type">
            <option value="">Tipo: todos</option>
            <option value="entry">Entrada</option>
            <option value="exit">Salida</option>
          </select>
          <Input defaultValue={deviceId} name="device_id" placeholder="Dispositivo" w="220px" />
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
        Mostrando {firstItem}-{lastItem} de {eventsPage.total}
      </Text>

      <DataTable
        headers={["Fecha", "Tipo", "Ticket", "Dispositivo", "Resultado"]}
        rows={eventsPage.items.map((event) => [
          formatDateTime(event.event_at),
          event.event_type === "entry" ? "Entrada" : "Salida",
          event.ticket_code,
          event.device_id ?? "-",
          event.result,
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
