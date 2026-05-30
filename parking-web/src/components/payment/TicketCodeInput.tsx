"use client";

import { Button, Field, Heading, Input, Stack, Text } from "@chakra-ui/react";
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
      className="glass-panel neon-glow-cyan"
      borderRadius="2xl"
      p="6"
      gap="5"
      transition="all 0.3s ease-in-out"
      onSubmit={async (event) => {
        event.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);
        const normalized = normalizeTicketCode(code);

        if (!normalized) {
          setErrorMessage("Ingresa un código de ticket válido.");
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
            setErrorMessage("No encontramos ese ticket. Verifica el código e intenta de nuevo.");
          } else {
            setErrorMessage("No se pudo consultar el ticket en este momento.");
          }
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <Heading
        size="md"
        fontFamily="var(--font-orbitron)"
        letterSpacing="0.05em"
        color="opsCyan"
        textShadow="0 0 8px rgba(6, 182, 212, 0.3)"
      >
        Consulta de Ticket
      </Heading>
      
      <Field.Root required>
        <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
          Código de Boleto
        </Field.Label>
        <Input
          aria-describedby="ticket-code-help"
          autoComplete="off"
          bg="rgba(13, 21, 39, 0.4)"
          borderColor="opsBorder"
          borderRadius="lg"
          h="12"
          fontSize="lg"
          fontWeight="bold"
          fontFamily="var(--font-orbitron)"
          letterSpacing="0.15em"
          textAlign="center"
          _focus={{
            borderColor: "opsCyan",
            boxShadow: "0 0 12px rgba(6, 182, 212, 0.35)",
            bg: "rgba(13, 21, 39, 0.6)",
          }}
          onChange={(event) => {
            setCode(event.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          textTransform="uppercase"
          value={code}
        />
        <Field.HelperText id="ticket-code-help" color="opsMuted" fontSize="xs" mt="1.5">
          Ingresa el identificador alfanumérico impreso. Ejemplo: A1B2C.
        </Field.HelperText>
      </Field.Root>

      {errorMessage ? (
        <Text color="opsRed" fontSize="xs" fontWeight="bold" mt="1">
          {errorMessage}
        </Text>
      ) : null}

      <Button
        colorPalette="cyan"
        loading={isSubmitting}
        type="submit"
        h="12"
        fontFamily="var(--font-orbitron)"
        fontWeight="bold"
        letterSpacing="0.08em"
        textTransform="uppercase"
        bg="opsCyan"
        color="black"
        _hover={{
          bg: "cyan.300",
          transform: "translateY(-2px)",
          boxShadow: "0 4px 15px rgba(6, 182, 212, 0.4)",
        }}
        transition="all 0.2s"
      >
        Consultar ticket
      </Button>
    </Stack>
  );
}

