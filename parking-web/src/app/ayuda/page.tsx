import { Box, Flex, Grid, Heading, Stack, Text } from "@chakra-ui/react";

import { PaymentShell } from "@/components/payment/PaymentShell";

const helpSections = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: "Consultar boleto",
    description:
      "Ingresa el código de 5 caracteres de tu boleto en la pantalla principal para ver su estado actual y el monto a pagar.",
    steps: ["Dirígete a la sección de Pago", "Ingresa el código impreso en tu boleto", "Revisa el estado y monto calculado"],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    title: "Pagar boleto",
    description:
      "El pago se registra de forma digital e instantánea. No se requiere tarjeta ni efectivo en el sistema de simulación.",
    steps: ["Consulta tu boleto", "Verifica el monto calculado", "Presiona Confirmar pago", "Presenta tu código en la salida"],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: "Descuento adulto mayor",
    description:
      "Si eres adulto mayor, puedes aplicar un descuento presentando tu código INAPAM, número de placa o documento de identidad.",
    steps: [
      "Selecciona \"Adulto mayor\" en tipo de descuento",
      "Elige tu tipo de identificación: código, placa o documento",
      "Ingresa el valor correspondiente",
      "Presiona Recalcular monto",
    ],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 12 3 12 0v-5" />
      </svg>
    ),
    title: "Descuento estudiante",
    description:
      "Los estudiantes pueden obtener un descuento ingresando su correo institucional. El dominio debe estar en la lista permitida por el estacionamiento.",
    steps: [
      "Selecciona \"Estudiante\" en tipo de descuento",
      "Ingresa tu correo escolar (ejemplo: alumno@universidad.edu.mx)",
      "Presiona Recalcular monto",
    ],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Ticket extraviado",
    description:
      "Si perdiste tu boleto, utiliza la opción de ticket extraviado. Se aplicará una tarifa fija especial configurada por el estacionamiento.",
    steps: [
      "Dirígete a la sección Ticket Extraviado",
      "Confirma que el boleto fue extraviado",
      "Se calculará la tarifa fija de ticket perdido",
      "Realiza el pago y acude a caseta para salir",
    ],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    title: "¿Boleto no encontrado?",
    description:
      "Si el sistema indica que tu boleto no fue encontrado, puede haberse vencido por tiempo o no existir en el registro. En cualquier caso, acude directamente a la caseta de control para asistencia.",
    steps: [
      "Verifica que ingresaste el código correctamente",
      "Confirma que el boleto no está vencido",
      "Acude a la caseta de control con tu boleto físico",
    ],
  },
];

export default function HelpPage() {
  return (
    <PaymentShell>
      <Stack gap="8">
        <Box textAlign="center">
          <Heading
            fontFamily="var(--font-orbitron)"
            letterSpacing="0.05em"
            color="opsCyan"
            textShadow="0 0 8px rgba(6, 182, 212, 0.3)"
            mb="3"
          >
            Ayuda y Soporte
          </Heading>
          <Text color="opsMuted" fontSize="sm" maxW="400px" mx="auto">
            Guía paso a paso para usar el sistema de pago, descuentos y resolver situaciones comunes.
          </Text>
        </Box>

        <Grid gap="5">
          {helpSections.map((section) => (
            <Box
              key={section.title}
              className="glass-panel"
              borderRadius="xl"
              p="6"
              transition="all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
              _hover={{
                borderColor: "opsCyan",
                transform: "translateY(-3px)",
                boxShadow: "0 8px 25px rgba(6, 182, 212, 0.12)",
              }}
            >
              <Flex gap="4" align="flex-start">
                <Flex
                  align="center"
                  justify="center"
                  w="12"
                  h="12"
                  borderRadius="lg"
                  bg="rgba(6, 182, 212, 0.08)"
                  border="1px solid rgba(6, 182, 212, 0.2)"
                  color="opsCyan"
                  flexShrink={0}
                >
                  {section.icon}
                </Flex>
                <Stack gap="3" flex="1">
                  <Heading
                    size="sm"
                    fontFamily="var(--font-orbitron)"
                    letterSpacing="0.03em"
                    color="opsCyan"
                  >
                    {section.title}
                  </Heading>
                  <Text color="opsMuted" fontSize="sm" lineHeight="1.6">
                    {section.description}
                  </Text>
                  <Stack gap="1.5" mt="1">
                    {section.steps.map((step, index) => (
                      <Flex key={step} gap="2.5" align="center">
                        <Flex
                          align="center"
                          justify="center"
                          w="5"
                          h="5"
                          borderRadius="full"
                          bg="rgba(6, 182, 212, 0.12)"
                          flexShrink={0}
                        >
                          <Text
                            fontSize="2xs"
                            fontWeight="bold"
                            color="opsCyan"
                            fontFamily="var(--font-orbitron)"
                          >
                            {index + 1}
                          </Text>
                        </Flex>
                        <Text color="opsText" fontSize="xs" opacity={0.85}>
                          {step}
                        </Text>
                      </Flex>
                    ))}
                  </Stack>
                </Stack>
              </Flex>
            </Box>
          ))}
        </Grid>
      </Stack>
    </PaymentShell>
  );
}
