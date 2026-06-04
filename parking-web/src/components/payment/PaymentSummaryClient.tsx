"use client";

import { useMemo, useState } from "react";
import { Button, Field, Input, Stack, Text } from "@chakra-ui/react";

import { PaymentSummaryCard } from "@/components/payment/PaymentSummaryCard";
import { calculateTicket } from "@/lib/api/tickets";
import type {
  DiscountRequest,
  DiscountType,
  SeniorIdentifierType,
  TicketCalculation,
  TicketResponse,
} from "@/lib/api/types";

type PaymentSummaryClientProps = {
  ticketCode: string;
  ticket: TicketResponse;
  initialCalculation: TicketCalculation;
};

const seniorIdentifierLabels: Record<SeniorIdentifierType, string> = {
  code: "Código INAPAM",
  license_plate: "Placa / Matrícula",
  document: "Documento de identidad",
};

export function PaymentSummaryClient({
  ticketCode,
  ticket,
  initialCalculation,
}: PaymentSummaryClientProps) {
  const [discountType, setDiscountType] = useState<DiscountType>(
    initialCalculation.discount_type,
  );
  const [studentEmail, setStudentEmail] = useState("");
  const [seniorIdentifierType, setSeniorIdentifierType] = useState<SeniorIdentifierType>("code");
  const [seniorIdentifierValue, setSeniorIdentifierValue] = useState("");
  const [calculation, setCalculation] = useState<TicketCalculation>(initialCalculation);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkoutHref = useMemo(() => {
    if (discountType === "none") {
      return `/pagar/${ticketCode}/checkout`;
    }

    const params = new URLSearchParams();
    params.set("discount_type", discountType);

    if (discountType === "student" && studentEmail.trim()) {
      params.set("student_email", studentEmail.trim());
    }
    if (discountType === "senior") {
      params.set("senior_identifier_type", seniorIdentifierType);
      if (seniorIdentifierValue.trim()) {
        params.set("senior_identifier_value", seniorIdentifierValue.trim());
      }
    }

    return `/pagar/${ticketCode}/checkout?${params.toString()}`;
  }, [
    discountType,
    seniorIdentifierType,
    seniorIdentifierValue,
    studentEmail,
    ticketCode,
  ]);

  function buildDiscountRequest(): DiscountRequest {
    if (discountType === "student") {
      return {
        type: "student",
        student_email: studentEmail.trim(),
      };
    }

    if (discountType === "senior") {
      return {
        type: "senior",
        senior_identifier_type: seniorIdentifierType,
        senior_identifier_value: seniorIdentifierValue.trim(),
      };
    }

    return { type: "none" };
  }

  async function onRecalculate() {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const updatedCalculation = await calculateTicket(ticketCode, {
        lostTicket: false,
        discount: buildDiscountRequest(),
      });
      setCalculation(updatedCalculation);
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message.toLowerCase() : "";
      if (rawMessage.includes("invalid_discount")) {
        setErrorMessage("Los datos de descuento no son validos.");
      } else {
        setErrorMessage("No se pudo recalcular el monto en este momento.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Stack gap="6">
      <Stack
        className="glass-panel neon-glow-cyan"
        borderRadius="2xl"
        gap="7"
        p={{ base: "6", md: "10" }}
        transition="all 0.3s ease-in-out"
      >
        <Text
          color="opsCyan"
          fontFamily="var(--font-orbitron)"
          fontWeight="900"
          fontSize="sm"
          letterSpacing="0.1em"
          textTransform="uppercase"
          textShadow="0 0 10px rgba(6, 182, 212, 0.35)"
        >
          Aplicar Descuento
        </Text>
        <select
          value={discountType}
          onChange={(event) => {
            setDiscountType(event.target.value as DiscountType);
            setErrorMessage(null);
          }}
        >
          <option value="none">Sin descuento</option>
          <option value="senior">Adulto mayor (INAPAM)</option>
          <option value="student">Estudiante (Escolar)</option>
        </select>

        {discountType === "student" ? (
          <Field.Root required>
            <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase">
              Correo escolar
            </Field.Label>
            <Input
              bg="opsPanelMuted"
              borderColor="opsBorder"
              _focus={{ borderColor: "opsCyan" }}
              placeholder="alumno@escuela.edu.mx"
              value={studentEmail}
              onChange={(event) => setStudentEmail(event.target.value)}
            />
          </Field.Root>
        ) : null}

        {discountType === "senior" ? (
          <Stack gap="4">
            <Field.Root required>
              <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                Tipo de identificación
              </Field.Label>
              <select
                value={seniorIdentifierType}
                onChange={(event) =>
                  setSeniorIdentifierType(event.target.value as SeniorIdentifierType)
                }
              >
                <option value="code">Código INAPAM</option>
                <option value="license_plate">Placa / Matrícula</option>
                <option value="document">Documento de identidad</option>
              </select>
            </Field.Root>
            <Field.Root required>
              <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                {seniorIdentifierLabels[seniorIdentifierType]}
              </Field.Label>
              <Input
                bg="opsPanelMuted"
                borderColor="opsBorder"
                _focus={{ borderColor: "opsCyan" }}
                placeholder="Ingresa tu identificador"
                value={seniorIdentifierValue}
                onChange={(event) => setSeniorIdentifierValue(event.target.value)}
              />
            </Field.Root>
          </Stack>
        ) : null}

        {errorMessage ? <Text color="opsRed" fontSize="sm" fontWeight="bold">{errorMessage}</Text> : null}

        <Button
          colorPalette="cyan"
          loading={isLoading}
          onClick={onRecalculate}
          w="full"
          mt="2"
          h="16"
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
          Recalcular monto
        </Button>
      </Stack>

      <PaymentSummaryCard
        calculation={calculation}
        checkoutHref={checkoutHref}
        ticket={ticket}
      />
    </Stack>
  );
}
