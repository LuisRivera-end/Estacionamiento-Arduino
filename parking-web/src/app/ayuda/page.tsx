import { Box, Heading, Stack, Text } from "@chakra-ui/react";

import { PaymentShell } from "@/components/payment/PaymentShell";

const faqItems = [
  {
    question: "Que es un pago simulado?",
    answer:
      "Es un registro interno que marca el ticket como pagado sin hacer un cargo real. No se usan tarjetas ni bancos.",
  },
  {
    question: "Que necesito para pagar?",
    answer: "Solo el codigo del ticket entregado en la entrada.",
  },
  {
    question: "Que pasa si cancelo el pago?",
    answer: "No se registra ningun pago y el ticket sigue pendiente.",
  },
  {
    question: "Como funciona el descuento de adulto mayor?",
    answer:
      "Debes declarar edad de 65+ y capturar referencia parcial de INAPAM. El backend valida y aplica el porcentaje configurado.",
  },
  {
    question: "Como funciona el descuento de estudiante?",
    answer:
      "Debes capturar un correo escolar. El backend valida que el dominio este en la lista permitida.",
  },
  {
    question: "Puedo usar dos descuentos?",
    answer: "No. Solo se aplica un descuento por pago.",
  },
  {
    question: "Que hago despues de pagar?",
    answer: "Ingresa el mismo codigo de ticket en la caseta de salida.",
  },
];

export default function HelpPage() {
  return (
    <PaymentShell>
      <Stack gap="6">
        <Heading>Ayuda</Heading>
        <Text color="opsMuted">
          Preguntas frecuentes del flujo de pago simulado y descuentos.
        </Text>

        {faqItems.map((item) => (
          <Box
            key={item.question}
            bg="opsPanel"
            borderColor="opsBorder"
            borderRadius="xl"
            borderWidth="1px"
            p="5"
          >
            <Heading size="sm">{item.question}</Heading>
            <Text color="opsMuted" mt="2">
              {item.answer}
            </Text>
          </Box>
        ))}
      </Stack>
    </PaymentShell>
  );
}
