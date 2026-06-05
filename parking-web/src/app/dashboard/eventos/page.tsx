import NextLink from "next/link";
import { Box, Button, Grid, Heading, HStack, Input, Text } from "@chakra-ui/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SelectBox = Box as any;

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
  const pageSize = positiveInteger(firstParam(resolvedSearchParams.page_size), 15);
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
            placeholder="Código ticket"
            w="220px"
            bg="opsPanel"
            borderColor="opsBorder"
            color="opsText"
          />
          <SelectBox as="select" defaultValue={eventTypeRaw} name="event_type" h="10" bg="opsPanel" color="opsText" borderColor="opsBorder" borderWidth="1px" borderRadius="md" px="3" outline="none" _focus={{ borderColor: "opsCyan" }}>
            <option value="">Tipo: todos</option>
            <option value="entry">Entrada</option>
            <option value="exit">Salida</option>
          </SelectBox>
          <Input defaultValue={deviceId} name="device_id" placeholder="Dispositivo" w="220px" bg="opsPanel" borderColor="opsBorder" color="opsText" />
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
