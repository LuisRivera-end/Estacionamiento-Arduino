"use client";

import { Button, Field, Input, Stack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { normalizeTicketCode } from "@/lib/formatters";

export function TicketCodeInput() {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <Stack
      as="form"
      gap="3"
      onSubmit={(event) => {
        event.preventDefault();
        const normalized = normalizeTicketCode(code);

        if (normalized) router.push(`/pagar/${normalized}`);
      }}
    >
      <Field.Root required>
        <Field.Label>Codigo de ticket</Field.Label>
        <Input
          aria-describedby="ticket-code-help"
          autoComplete="off"
          fontFamily="var(--font-geist-mono)"
          letterSpacing="0.08em"
          onChange={(event) => setCode(event.target.value)}
          textTransform="uppercase"
          value={code}
        />
        <Field.HelperText id="ticket-code-help">
          Usa el codigo alfanumerico del ticket. Ejemplo: A1B2C.
        </Field.HelperText>
      </Field.Root>
      <Button colorPalette="cyan" type="submit">
        Consultar ticket
      </Button>
    </Stack>
  );
}
