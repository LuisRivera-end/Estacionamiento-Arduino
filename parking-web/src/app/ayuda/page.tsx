"use client";

import { useState } from "react";
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
  const [selectedSection, setSelectedSection] = useState<typeof helpSections[0] | null>(null);

  return (
    <PaymentShell>
      <Stack gap="8">
        <Box textAlign="center">
          <Heading
            fontFamily="var(--font-outfit), var(--font-outfit)"
            letterSpacing="0.02em"
            color="opsCyan"
            mb="3"
            fontWeight="bold"
          >
            Ayuda y Soporte
          </Heading>
          <Text color="opsMuted" fontSize="sm" maxW="400px" mx="auto" fontFamily="var(--font-outfit)">
            Selecciona un tema para ver más detalles y aprender cómo usar el sistema paso a paso.
          </Text>
        </Box>

        <Grid gap="5" templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }}>
          {helpSections.map((section) => (
            <Box
              key={section.title}
              as="button"
              textAlign="left"
              onClick={() => setSelectedSection(section)}
              className="glass-panel"
              borderRadius="xl"
              p="6"
              transition="all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
              _hover={{
                borderColor: "opsCyan",
                transform: "translateY(-3px)",
                boxShadow: "0 8px 25px rgba(6, 182, 212, 0.12)",
                bg: "rgba(6, 182, 212, 0.05)"
              }}
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap="4"
            >
              <Flex
                align="center"
                justify="center"
                w="16"
                h="16"
                borderRadius="full"
                bg="rgba(6, 182, 212, 0.1)"
                border="1px solid rgba(6, 182, 212, 0.2)"
                color="opsCyan"
                mb="2"
              >
                {section.icon}
              </Flex>
              <Heading
                size="md"
                fontFamily="var(--font-outfit), var(--font-outfit)"
                letterSpacing="0.02em"
                color="opsCyan"
                textAlign="center"
              >
                {section.title}
              </Heading>
              <Text color="opsMuted" fontSize="sm" textAlign="center" lineClamp="2" fontFamily="var(--font-outfit)">
                {section.description}
              </Text>
              <Text color="opsCyan" fontSize="xs" fontWeight="bold" mt="auto" textTransform="uppercase" letterSpacing="0.05em">
                Ver más →
              </Text>
            </Box>
          ))}
        </Grid>
      </Stack>

      {/* Custom Modal Overlay */}
      {selectedSection && (
        <Box
          position="fixed"
          inset="0"
          bg="blackAlpha.800"
          backdropFilter="blur(6px)"
          zIndex={1400}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="4"
          animation="fade-in 0.2s ease-out"
          onClick={() => setSelectedSection(null)}
        >
          <Box
            bg="opsBg"
            border="1px solid"
            borderColor="opsBorder"
            borderRadius="2xl"
            p={{ base: 6, md: 8 }}
            maxW="md"
            w="full"
            position="relative"
            onClick={(e) => e.stopPropagation()}
            boxShadow="0 25px 50px -12px rgba(6, 182, 212, 0.25)"
            className="glass-panel"
            animation="fade-in 0.3s ease-out"
          >
            <Box
              position="absolute"
              top="4"
              right="4"
              as="button"
              onClick={() => setSelectedSection(null)}
              color="opsMuted"
              _hover={{ color: "opsCyan" }}
              p="2"
              borderRadius="full"
              transition="all 0.2s"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Box>

            <Flex
              align="center"
              justify="center"
              w="16"
              h="16"
              borderRadius="full"
              bg="rgba(6, 182, 212, 0.1)"
              border="1px solid rgba(6, 182, 212, 0.2)"
              color="opsCyan"
              mb="6"
              mx="auto"
            >
              {selectedSection.icon}
            </Flex>

            <Heading
              size="lg"
              fontFamily="var(--font-outfit), var(--font-outfit)"
              color="opsCyan"
              textAlign="center"
              mb="4"
            >
              {selectedSection.title}
            </Heading>

            <Text color="opsText" fontSize="md" lineHeight="1.6" textAlign="center" mb="8" fontFamily="var(--font-outfit)">
              {selectedSection.description}
            </Text>

            <Box bg="rgba(6, 182, 212, 0.05)" p="5" borderRadius="xl" border="1px solid" borderColor="opsBorder">
              <Heading size="sm" color="opsText" mb="4" fontFamily="var(--font-outfit)">
                Pasos a seguir:
              </Heading>
              <Stack gap="4">
                {selectedSection.steps.map((step, index) => (
                  <Flex key={step} gap="3" align="flex-start">
                    <Flex
                      align="center"
                      justify="center"
                      w="6"
                      h="6"
                      borderRadius="full"
                      bg="rgba(6, 182, 212, 0.15)"
                      flexShrink={0}
                      mt="0.5"
                    >
                      <Text
                        fontSize="xs"
                        fontWeight="bold"
                        color="opsCyan"
                        fontFamily="var(--font-outfit)"
                      >
                        {index + 1}
                      </Text>
                    </Flex>
                    <Text color="opsText" fontSize="sm" opacity={0.9} fontFamily="var(--font-outfit)">
                      {step}
                    </Text>
                  </Flex>
                ))}
              </Stack>
            </Box>

            <Box mt="8" textAlign="center">
              <Box
                as="button"
                onClick={() => setSelectedSection(null)}
                bg="opsCyan"
                color="white"
                px="8"
                py="3"
                borderRadius="full"
                fontWeight="bold"
                fontFamily="var(--font-outfit)"
                _hover={{ bg: "cyan.400", transform: "scale(1.02)" }}
                transition="all 0.2s"
                w="full"
              >
                Entendido
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </PaymentShell>
  );
}
