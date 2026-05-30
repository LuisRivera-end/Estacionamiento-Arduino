import { Box, Heading, Stack, Text } from "@chakra-ui/react";

import { PaymentShell } from "@/components/payment/PaymentShell";

const faqItems = [
  {
    question: "¿Qué es un pago simulado?",
    answer:
      "Es un registro interno que marca el ticket como pagado sin hacer un cargo real. No se usan tarjetas ni bancos.",
  },
  {
    question: "¿Qué necesito para pagar?",
    answer: "Solo el código del ticket entregado en la entrada.",
  },
  {
    question: "¿Qué pasa si cancelo el pago?",
    answer: "No se registra ningún pago y el ticket sigue pendiente.",
  },
  {
    question: "¿Cómo funciona el descuento de adulto mayor?",
    answer:
      "Debes declarar edad de 65+ y capturar referencia parcial de INAPAM. El backend valida y aplica el porcentaje configurado.",
  },
  {
    question: "¿Cómo funciona el descuento de estudiante?",
    answer:
      "Debes capturar un correo escolar. El backend valida que el dominio esté en la lista permitida.",
  },
  {
    question: "¿Puedo usar dos descuentos?",
    answer: "No. Solo se aplica un descuento por pago.",
  },
  {
    question: "¿Qué hago después de pagar?",
    answer: "Ingresa el mismo código de ticket en la caseta de salida.",
  },
];

export default function HelpPage() {
  return (
    <PaymentShell>
      <Stack gap="6">
        <Heading
          fontFamily="var(--font-orbitron)"
          letterSpacing="0.05em"
          color="opsCyan"
          textShadow="0 0 8px rgba(6, 182, 212, 0.3)"
        >
          Ayuda y Soporte
        </Heading>
        <Text color="opsMuted">
          Preguntas frecuentes del flujo de pago simulado y descuentos.
        </Text>

        {faqItems.map((item) => (
          <Box
            key={item.question}
            className="glass-panel"
            borderRadius="xl"
            p="5"
            transition="all 0.25s ease-in-out"
            _hover={{
              borderColor: "opsCyan",
              transform: "translateY(-2px)",
              boxShadow: "0 4px 15px rgba(6, 182, 212, 0.1)",
            }}
          >
            <Heading
              size="sm"
              fontFamily="var(--font-orbitron)"
              letterSpacing="0.03em"
              color="opsCyan"
            >
              {item.question}
            </Heading>
            <Text color="opsMuted" mt="2" fontSize="sm">
              {item.answer}
            </Text>
          </Box>
        ))}
      </Stack>
    </PaymentShell>
  );
}
