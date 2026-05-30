"use client";

import { useMemo, useState } from "react";
import { Button, Field, Input, Stack, Text } from "@chakra-ui/react";

import { PaymentSummaryCard } from "@/components/payment/PaymentSummaryCard";
import { calculateTicket } from "@/lib/api/tickets";
import type {
  DiscountRequest,
  DiscountType,
  TicketCalculation,
  TicketResponse,
} from "@/lib/api/types";

type PaymentSummaryClientProps = {
  ticketCode: string;
  ticket: TicketResponse;
  initialCalculation: TicketCalculation;
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
  const [seniorAge, setSeniorAge] = useState("");
  const [seniorDocumentType, setSeniorDocumentType] = useState("INAPAM");
  const [seniorDocumentLast4, setSeniorDocumentLast4] = useState("");
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
      if (seniorAge.trim()) params.set("senior_age", seniorAge.trim());
      if (seniorDocumentType.trim()) {
        params.set("senior_document_type", seniorDocumentType.trim());
      }
      if (seniorDocumentLast4.trim()) {
        params.set("senior_document_last4", seniorDocumentLast4.trim());
      }
    }

    return `/pagar/${ticketCode}/checkout?${params.toString()}`;
  }, [
    discountType,
    seniorAge,
    seniorDocumentLast4,
    seniorDocumentType,
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
        senior_age: Number.parseInt(seniorAge, 10),
        senior_document_type: seniorDocumentType.trim(),
        senior_document_last4: seniorDocumentLast4.trim(),
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
        gap="5"
        p={{ base: "5", md: "6" }}
        transition="all 0.3s ease-in-out"
      >
        <Text
          color="opsCyan"
          fontFamily="var(--font-orbitron)"
          fontWeight="900"
          fontSize="sm"
          letterSpacing="0.05em"
          textTransform="uppercase"
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
              bg="rgba(13, 21, 39, 0.4)"
              borderColor="opsBorder"
              _focus={{ borderColor: "opsCyan", boxShadow: "0 0 10px rgba(6, 182, 212, 0.2)" }}
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
                Edad
              </Field.Label>
              <Input
                type="number"
                bg="rgba(13, 21, 39, 0.4)"
                borderColor="opsBorder"
                _focus={{ borderColor: "opsCyan", boxShadow: "0 0 10px rgba(6, 182, 212, 0.2)" }}
                placeholder="60 o más"
                value={seniorAge}
                onChange={(event) => setSeniorAge(event.target.value)}
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                Tipo de documento
              </Field.Label>
              <Input
                bg="rgba(13, 21, 39, 0.4)"
                borderColor="opsBorder"
                _focus={{ borderColor: "opsCyan", boxShadow: "0 0 10px rgba(6, 182, 212, 0.2)" }}
                placeholder="INAPAM"
                value={seniorDocumentType}
                onChange={(event) => setSeniorDocumentType(event.target.value)}
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                Últimos 4 caracteres del documento
              </Field.Label>
              <Input
                maxLength={4}
                bg="rgba(13, 21, 39, 0.4)"
                borderColor="opsBorder"
                _focus={{ borderColor: "opsCyan", boxShadow: "0 0 10px rgba(6, 182, 212, 0.2)" }}
                placeholder="123A"
                value={seniorDocumentLast4}
                onChange={(event) => setSeniorDocumentLast4(event.target.value)}
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
          fontFamily="var(--font-orbitron)"
          fontWeight="bold"
          letterSpacing="0.05em"
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
