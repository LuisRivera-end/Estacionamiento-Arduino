"use client";

import { useState } from "react";
import { Box, Button, Field, Flex, Grid, Heading, HStack, Input, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import { simulatePayment } from "@/lib/api/payments";
import type { DiscountRequest } from "@/lib/api/types";

// Visual Chip representation
const CardChip = () => (
  <Box
    w="10"
    h="7.5"
    borderRadius="md"
    bg="linear-gradient(135deg, #fef08a, #eab308)"
    position="relative"
    overflow="hidden"
    border="1px solid"
    borderColor="#ca8a04"
    boxShadow="inner"
  >
    <Box position="absolute" top="2.5" left="0" right="0" h="0.5" bg="yellow.700" opacity={0.4} />
    <Box position="absolute" bottom="2.5" left="0" right="0" h="0.5" bg="yellow.700" opacity={0.4} />
    <Box position="absolute" top="0" bottom="0" left="3.5" w="0.5" bg="yellow.700" opacity={0.4} />
    <Box position="absolute" top="0" bottom="0" right="3.5" w="0.5" bg="yellow.700" opacity={0.4} />
  </Box>
);

// Visual Mastercard circles
const MastercardLogo = () => (
  <HStack gap="0" align="center" position="relative" w="10" h="6">
    <Box w="6" h="6" borderRadius="full" bg="#EB001B" />
    <Box w="6" h="6" borderRadius="full" bg="#F79E1B" opacity={0.85} position="absolute" left="4" />
  </HStack>
);

// Visual Visa wordmark
const VisaLogo = () => (
  <Text
    fontFamily="var(--font-outfit)"
    fontStyle="italic"
    fontWeight="black"
    fontSize="lg"
    color="#1A1FFF"
    bg="white"
    px="2"
    py="0.5"
    borderRadius="md"
    letterSpacing="0.05em"
    boxShadow="sm"
    lineHeight="1"
  >
    VISA
  </Text>
);

export function SimulatedCheckoutCard({
  ticketCode,
  discount,
}: {
  ticketCode: string;
  discount: DiscountRequest;
}) {
  const router = useRouter();

  // Local state for payment method
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");

  // Local state for credit card form
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);

  // Validation & Loading
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Formatters
  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const formatted = cleaned.slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
    if (errorMessage) setErrorMessage(null);
  };

  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    setCardExpiry(formatted.slice(0, 5));
    if (errorMessage) setErrorMessage(null);
  };

  const handleCvcChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    setCardCvc(cleaned.slice(0, 4));
    if (errorMessage) setErrorMessage(null);
  };

  const handleNameChange = (value: string) => {
    setCardName(value.slice(0, 30));
    if (errorMessage) setErrorMessage(null);
  };

  // Card Network detection
  const getCardType = () => {
    const cleanNumber = cardNumber.replace(/\s/g, "");
    if (cleanNumber.startsWith("4")) return "visa";
    if (cleanNumber.startsWith("5")) return "mastercard";
    return "generic";
  };

  const cardType = getCardType();

  // Form submission handler
  const handlePayment = async () => {
    if (paymentMethod !== "card") {
      setErrorMessage("Solo está disponible el pago simulado con tarjeta.");
      return;
    }

    const cleanNum = cardNumber.replace(/\s/g, "");
    if (cleanNum.length < 16) {
      setErrorMessage("Por favor ingresa un número de tarjeta válido (16 dígitos).");
      return;
    }

    if (!cardName.trim()) {
      setErrorMessage("Por favor ingresa el nombre del titular.");
      return;
    }

    if (cardExpiry.length < 5) {
      setErrorMessage("Por favor ingresa la fecha de vencimiento (MM/AA).");
      return;
    }

    const [monthStr, yearStr] = cardExpiry.split("/");
    const month = parseInt(monthStr, 10);
    if (isNaN(month) || month < 1 || month > 12) {
      setErrorMessage("Mes de vencimiento inválido. Debe estar entre 01 y 12.");
      return;
    }

    if (cardCvc.length < 3) {
      setErrorMessage("Por favor ingresa un CVC válido (3 o 4 dígitos).");
      return;
    }

    setIsLoading(true);
    try {
      await simulatePayment(ticketCode, { discount });
      router.push(`/pagar/${ticketCode}/confirmacion`);
    } catch {
      setErrorMessage("Error al procesar el pago. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Grid templateColumns={{ base: "1fr", lg: "1.2fr 1fr" }} gap="8" alignItems="start">
      {/* Checkout Form Card */}
      <Stack
        className="glass-panel neon-glow-cyan"
        borderRadius="2xl"
        p={{ base: "6", md: "10" }}
        gap="6"
        transition="all 0.3s ease-in-out"
      >
        <Heading
          size="xl"
          fontFamily="var(--font-outfit)"
          letterSpacing="0.06em"
          color="opsCyan"
        >
          Pasarela de Pago
        </Heading>

        {/* Payment Methods Selector (Stripe-like) */}
        <Grid templateColumns="repeat(2, 1fr)" gap="2.5">
          <Button
            onClick={() => setPaymentMethod("card")}
            variant={paymentMethod === "card" ? "solid" : "outline"}
            borderColor={paymentMethod === "card" ? "opsCyan" : "opsBorder"}
            bg={paymentMethod === "card" ? "rgba(14, 165, 233, 0.1)" : "transparent"}
            color={paymentMethod === "card" ? "opsText" : "opsMuted"}
            h="12"
            borderRadius="lg"
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.05em"
            textTransform="uppercase"
            fontFamily="var(--font-outfit)"
            display="flex"
            gap="2"
            _hover={{ bg: "rgba(14, 165, 233, 0.08)" }}
          >
            💳 Tarjeta
          </Button>
          <Button
            onClick={() => setPaymentMethod("paypal")}
            variant={paymentMethod === "paypal" ? "solid" : "outline"}
            borderColor={paymentMethod === "paypal" ? "opsCyan" : "opsBorder"}
            bg={paymentMethod === "paypal" ? "rgba(14, 165, 233, 0.1)" : "transparent"}
            color={paymentMethod === "paypal" ? "opsText" : "opsMuted"}
            h="12"
            borderRadius="lg"
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.05em"
            textTransform="uppercase"
            fontFamily="var(--font-outfit)"
            display="flex"
            gap="2"
            _hover={{ bg: "rgba(14, 165, 233, 0.08)" }}
          >
            🌐 PayPal
          </Button>
        </Grid>

        {paymentMethod === "card" ? (
          <Stack gap="5">
            {/* Cardholder Name */}
            <Field.Root required>
              <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
                Nombre del Titular
              </Field.Label>
              <Input
                bg="opsPanelMuted"
                borderColor="opsBorder"
                borderRadius="xl"
                h="12"
                placeholder="Juan Pérez"
                value={cardName}
                onChange={(e) => handleNameChange(e.target.value)}
                _focus={{ borderColor: "opsCyan", bg: "opsPanel" }}
              />
            </Field.Root>

            {/* Card Number */}
            <Field.Root required>
              <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
                Número de Tarjeta
              </Field.Label>
              <Input
                bg="opsPanelMuted"
                borderColor="opsBorder"
                borderRadius="xl"
                h="12"
                placeholder="4000 1234 5678 9010"
                value={cardNumber}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                _focus={{ borderColor: "opsCyan", bg: "opsPanel" }}
              />
            </Field.Root>

            {/* Expiry and CVC Inline */}
            <Grid templateColumns="1fr 1fr" gap="4">
              <Field.Root required>
                <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
                  Vencimiento (MM/AA)
                </Field.Label>
                <Input
                  bg="opsPanelMuted"
                  borderColor="opsBorder"
                  borderRadius="xl"
                  h="12"
                  placeholder="12/29"
                  value={cardExpiry}
                  onChange={(e) => handleExpiryChange(e.target.value)}
                  _focus={{ borderColor: "opsCyan", bg: "opsPanel" }}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
                  Código CVC
                </Field.Label>
                <Input
                  bg="opsPanelMuted"
                  borderColor="opsBorder"
                  borderRadius="xl"
                  h="12"
                  placeholder="123"
                  value={cardCvc}
                  onChange={(e) => handleCvcChange(e.target.value)}
                  onFocus={() => setIsFlipped(true)}
                  onBlur={() => setIsFlipped(false)}
                  _focus={{ borderColor: "opsCyan", bg: "opsPanel" }}
                />
              </Field.Root>
            </Grid>
          </Stack>
        ) : (
          <Box
            bg="opsPanelMuted"
            border="1px dashed"
            borderColor="opsBorder"
            p="10"
            borderRadius="xl"
            textAlign="center"
          >
            <Text color="opsMuted" fontSize="sm">
              Método de pago no disponible en la simulación. Selecciona 💳 Tarjeta para continuar.
            </Text>
          </Box>
        )}

        {/* Secure connection details */}
        <Box
          bg="rgba(14, 165, 233, 0.03)"
          border="1px solid"
          borderColor="opsBorder"
          p="4"
          borderRadius="xl"
        >
          <Flex align="center" gap="2.5" mb="1.5">
            <Box className="pulse-glow" w="2" h="2" bg="opsCyan" borderRadius="full" />
            <Text
              fontFamily="var(--font-outfit)"
              fontSize="xxs"
              fontWeight="black"
              letterSpacing="0.1em"
              color="opsCyan"
              textTransform="uppercase"
            >
              🔒 Pago Encriptado SSL
            </Text>
          </Flex>
          <Text color="opsMuted" fontSize="xs" lineHeight="1.5">
            Esta es una pasarela simulada. Tu pago para el boleto{" "}
            <Text as="span" fontWeight="bold" color="opsText">
              {ticketCode}
            </Text>{" "}
            se registrará instantáneamente en el sistema de demostración sin cargos reales.
          </Text>
        </Box>

        {/* Action Buttons */}
        <Stack gap="3" mt="2">
          {errorMessage ? (
            <Text color="opsRed" fontSize="xs" fontWeight="bold">
              {errorMessage}
            </Text>
          ) : null}

          <Button
            bg="opsCyan"
            color="white"
            h="14"
            fontFamily="var(--font-outfit)"
            fontWeight="bold"
            letterSpacing="0.08em"
            textTransform="uppercase"
            borderRadius="xl"
            _hover={{
              bg: "blue.700",
              transform: "translateY(-2px)",
            }}
            transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
            loading={isLoading}
            onClick={handlePayment}
          >
            Pagar boleto
          </Button>
          <Button
            variant="outline"
            borderColor="opsBorder"
            h="14"
            fontFamily="var(--font-outfit)"
            fontWeight="bold"
            letterSpacing="0.08em"
            textTransform="uppercase"
            borderRadius="xl"
            _hover={{ bg: "rgba(229, 237, 247, 0.04)" }}
            onClick={() => router.push(`/pagar/${ticketCode}`)}
            transition="all 0.25s"
          >
            Volver
          </Button>
        </Stack>
      </Stack>

      {/* Credit Card Preview Container (Sticky on Right) */}
      <Box
        position={{ lg: "sticky" }}
        top={{ lg: "24px" }}
        w="full"
        maxW="340px"
        mx="auto"
        style={{ perspective: "1000px" }}
      >
        {/* Animated Flipping Card */}
        <Box
          w="full"
          h="215px"
          position="relative"
          style={{ transformStyle: "preserve-3d" }}
          transition="transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
          transform={isFlipped ? "rotateY(180deg)" : "none"}
        >
          {/* Card Front Face */}
          <Box
            position="absolute"
            w="full"
            h="full"
            style={{ backfaceVisibility: "hidden" }}
            borderRadius="2xl"
            p="6"
            bg="linear-gradient(135deg, #0b0f19 0%, #1e293b 50%, #0ea5e9 100%)"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.15)"
            boxShadow="0 20px 40px rgba(0, 0, 0, 0.4)"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
          >
            <Flex justify="space-between" align="center">
              <CardChip />
              {cardType === "visa" && <VisaLogo />}
              {cardType === "mastercard" && <MastercardLogo />}
              {cardType === "generic" && (
                <Text color="whiteAlpha.600" fontSize="xs" fontWeight="bold">
                  CARD
                </Text>
              )}
            </Flex>

            {/* Spaced card number */}
            <Text
              fontFamily="var(--font-outfit)"
              fontSize="2xl"
              fontWeight="bold"
              letterSpacing="0.12em"
              color="white"
              textShadow="0 2px 4px rgba(0,0,0,0.5)"
              my="4"
            >
              {cardNumber || "•••• •••• •••• ••••"}
            </Text>

            <Flex justify="space-between" align="flex-end">
              <Stack gap="0">
                <Text fontSize="8px" color="whiteAlpha.600" textTransform="uppercase" letterSpacing="0.05em">
                  Titular
                </Text>
                <Text
                  fontFamily="var(--font-outfit)"
                  fontSize="sm"
                  fontWeight="bold"
                  color="white"
                  textTransform="uppercase"
                  lineClamp="1"
                >
                  {cardName || "NOM DEL TITULAR"}
                </Text>
              </Stack>
              <Stack gap="0" align="flex-end">
                <Text fontSize="8px" color="whiteAlpha.600" textTransform="uppercase" letterSpacing="0.05em">
                  Vence
                </Text>
                <Text fontFamily="var(--font-outfit)" fontSize="sm" fontWeight="bold" color="white">
                  {cardExpiry || "MM/AA"}
                </Text>
              </Stack>
            </Flex>
          </Box>

          {/* Card Back Face */}
          <Box
            position="absolute"
            w="full"
            h="full"
            style={{ backfaceVisibility: "hidden" }}
            transform="rotateY(180deg)"
            borderRadius="2xl"
            py="6"
            bg="linear-gradient(135deg, #1e293b 0%, #0b0f19 100%)"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.15)"
            boxShadow="0 20px 40px rgba(0, 0, 0, 0.4)"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
          >
            {/* Magnetic Stripe */}
            <Box w="full" h="10" bg="black" mt="1" />

            <Stack gap="2" px="6" mt="4">
              <Text fontSize="8px" color="whiteAlpha.600" textTransform="uppercase" letterSpacing="0.05em" textAlign="right">
                CVC / CVV
              </Text>
              {/* Signature field with CVC */}
              <Flex
                bg="white"
                h="9"
                borderRadius="md"
                align="center"
                justify="flex-end"
                px="3.5"
                boxShadow="inner"
              >
                <Text
                  fontFamily="monospace"
                  fontStyle="italic"
                  fontWeight="bold"
                  fontSize="md"
                  color="black"
                  letterSpacing="0.05em"
                >
                  {cardCvc || "•••"}
                </Text>
              </Flex>
            </Stack>

            <Text fontSize="8px" color="whiteAlpha.500" px="6" textAlign="center" mt="2">
              Pasarela de demostración simulada. No comparta información financiera real en este formulario.
            </Text>
          </Box>
        </Box>
      </Box>
    </Grid>
  );
}
