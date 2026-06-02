"use client";

import { Button, Field, Heading, HStack, Input, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
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
      p={{ base: "6", md: "10" }}
      gap="7"
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
            setErrorMessage("No encontramos ese ticket. Revisa el código e intenta de nuevo.");
          } else {
            setErrorMessage("No se pudo consultar el ticket en este momento.");
          }
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <Stack gap="2.5">
        <Heading
          size="xl"
          fontFamily="var(--font-orbitron)"
          letterSpacing="0.06em"
          color="opsCyan"
          textShadow="0 0 10px rgba(6, 182, 212, 0.35)"
        >
          Consulta tu ticket
        </Heading>
        <Text color="opsMuted" fontSize="sm" lineHeight="1.6">
          Ingresa el código alfanumérico entregado al entrar al estacionamiento.
        </Text>
      </Stack>
      
      <Field.Root required>
        <Field.Label
          color="opsMuted"
          fontSize="xs"
          fontWeight="900"
          textTransform="uppercase"
          letterSpacing="0.1em"
          mb="3"
        >
          Código de Boleto
        </Field.Label>
        <Input
          aria-describedby="ticket-code-help"
          autoComplete="off"
          bg="opsPanelMuted"
          borderColor="opsBorder"
          borderRadius="xl"
          h="16"
          fontSize="3xl"
          fontWeight="bold"
          fontFamily="var(--font-orbitron)"
          letterSpacing="0.25em"
          textAlign="center"
          _focus={{
            borderColor: "opsCyan",
            bg: "opsPanel",
          }}
          onChange={(event) => {
            setCode(event.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          textTransform="uppercase"
          value={code}
          placeholder="A1B2C"
        />
        <Field.HelperText id="ticket-code-help" color="opsMuted" fontSize="xs" mt="2.5">
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
        h="16"
        fontSize="md"
        fontFamily="var(--font-orbitron)"
        fontWeight="bold"
        letterSpacing="0.08em"
        textTransform="uppercase"
        bg="opsCyan"
        color="white"
        borderRadius="xl"
        _hover={{
          bg: "blue.700",
          transform: "translateY(-2px)",
        }}
        transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
      >
        Consultar ticket
      </Button>

      <HStack justify="space-between" mt="3" borderTop="1px solid" borderColor="opsBorder" pt="5" px="1">
        <Link
          asChild
          color="opsCyan"
          fontSize="sm"
          fontWeight="bold"
          _hover={{ color: "opsText", textShadow: "0 0 8px rgba(6, 182, 212, 0.6)" }}
          transition="all 0.25s"
        >
          <NextLink href="/ticket-extraviado">¿Perdiste tu ticket?</NextLink>
        </Link>
        <Link
          asChild
          color="opsCyan"
          fontSize="sm"
          fontWeight="bold"
          _hover={{ color: "opsText", textShadow: "0 0 8px rgba(6, 182, 212, 0.6)" }}
          transition="all 0.25s"
        >
          <NextLink href="/ayuda">Ayuda y soporte</NextLink>
        </Link>
      </HStack>
    </Stack>
  );
}
