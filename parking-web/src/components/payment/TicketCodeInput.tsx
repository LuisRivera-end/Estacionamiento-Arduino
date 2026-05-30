"use client";

import { Button, Field, Input, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { getTicket } from "@/lib/api/tickets";
import { normalizeTicketCode } from "@/lib/formatters";

export function TicketCodeInput() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Stack
      as="form"
      gap="3"
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);
        const normalized = normalizeTicketCode(code);

        if (!normalized) {
          setErrorMessage("Ingresa un codigo de ticket valido.");
          setIsSubmitting(false);
          return;
        }

        try {
          await getTicket(normalized);
          router.push(`/pagar/${normalized}`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message.toLowerCase() : "";
          if (message.includes("ticket no encontrado")) {
            setErrorMessage("No encontramos ese ticket. Verifica el codigo e intenta de nuevo.");
          } else {
            setErrorMessage("No se pudo consultar el ticket en este momento.");
          }
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <Field.Root required>
        <Field.Label>Codigo de ticket</Field.Label>
        <Input
          aria-describedby="ticket-code-help"
          autoComplete="off"
          fontFamily="var(--font-geist-mono)"
          letterSpacing="0.08em"
          onChange={(event) => {
            setCode(event.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          textTransform="uppercase"
          value={code}
        />
        <Field.HelperText id="ticket-code-help">
          Usa el codigo alfanumerico del ticket. Ejemplo: A1B2C.
        </Field.HelperText>
      </Field.Root>
      {errorMessage ? <Text color="red.300">{errorMessage}</Text> : null}
      <Button colorPalette="cyan" loading={isSubmitting} type="submit">
        Consultar ticket
      </Button>
    </Stack>
  );
}
