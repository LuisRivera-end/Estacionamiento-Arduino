"use client";

import { useState } from "react";
import {
  Box, Button, Field, Flex, Grid, Heading, HStack, Input, Stack, Text,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";

import { simulatePayment } from "@/lib/api/payments";
import type { DiscountRequest } from "@/lib/api/types";

// ─── SVG Icon Components ───────────────────────────────────────────────────

type IconProps = { size?: number };

const IconCreditCard = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="22" height="16" x="1" y="4" rx="2" />
    <path d="M1 10h22" />
  </svg>
);

const IconGlobe = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    <path d="M2 12h20" />
  </svg>
);

const IconBanknote = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="12" x="2" y="6" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

const IconWifi = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <circle cx="12" cy="20" r=".5" fill="currentColor" />
  </svg>
);

const IconApple = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const IconGoogleG = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const IconLock = ({ size = 13 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// ─── Visual Card Sub-components ───────────────────────────────────────────

const CardChip = () => (
  <Box
    w="10" h="7.5" borderRadius="md"
    bg="linear-gradient(135deg, #fef08a, #eab308)"
    position="relative" overflow="hidden"
    border="1px solid" borderColor="#ca8a04" boxShadow="inner"
  >
    <Box position="absolute" top="2.5" left="0" right="0" h="0.5" bg="yellow.700" opacity={0.4} />
    <Box position="absolute" bottom="2.5" left="0" right="0" h="0.5" bg="yellow.700" opacity={0.4} />
    <Box position="absolute" top="0" bottom="0" left="3.5" w="0.5" bg="yellow.700" opacity={0.4} />
    <Box position="absolute" top="0" bottom="0" right="3.5" w="0.5" bg="yellow.700" opacity={0.4} />
  </Box>
);

const MastercardLogo = () => (
  <HStack gap="0" align="center" position="relative" w="10" h="6">
    <Box w="6" h="6" borderRadius="full" bg="#EB001B" />
    <Box w="6" h="6" borderRadius="full" bg="#F79E1B" opacity={0.85} position="absolute" left="4" />
  </HStack>
);

const VisaLogo = () => (
  <Text
    fontFamily="var(--font-outfit)" fontStyle="italic" fontWeight="black"
    fontSize="lg" color="#1A1FFF" bg="white" px="2" py="0.5"
    borderRadius="md" letterSpacing="0.05em" boxShadow="sm" lineHeight="1"
  >
    VISA
  </Text>
);

// ─── Payment method data ───────────────────────────────────────────────────

type PaymentMethodId = "card" | "paypal" | "cash" | "contactless" | "apple_pay" | "google_pay";

const PAYMENT_METHODS = [
  { id: "card"        as PaymentMethodId, icon: <IconCreditCard size={15} />, label: "Tarjeta",    short: "Tarjeta"  },
  { id: "paypal"      as PaymentMethodId, icon: <IconGlobe      size={15} />, label: "PayPal",     short: "PayPal"   },
  { id: "cash"        as PaymentMethodId, icon: <IconBanknote   size={15} />, label: "Efectivo",   short: "Efectivo" },
  { id: "contactless" as PaymentMethodId, icon: <IconWifi       size={15} />, label: "NFC",        short: "NFC"      },
  { id: "apple_pay"   as PaymentMethodId, icon: <IconApple      size={15} />, label: "Apple Pay",  short: "Apple"    },
  { id: "google_pay"  as PaymentMethodId, icon: <IconGoogleG    size={15} />, label: "Google Pay", short: "Google"   },
];

// ─── Component ─────────────────────────────────────────────────────────────

export function SimulatedCheckoutCard({
  ticketCode,
  discount,
}: {
  ticketCode: string;
  discount: DiscountRequest;
}) {
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("card");
  const [isContactlessScanning, setIsContactlessScanning] = useState(false);

  // Card form state
  const [rawCardNumber, setRawCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);

  // PayPal form state
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalPassword, setPaypalPassword] = useState("");

  // Validation & loading
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Masked card number ──
  const maskedCardNumber = (() => {
    if (!rawCardNumber) return "";
    let masked = "";
    for (let i = 0; i < rawCardNumber.length; i++) {
      masked += i < rawCardNumber.length - 4 ? "•" : rawCardNumber[i];
    }
    return masked.replace(/(.{4})/g, "$1 ").trim();
  })();

  // ── Formatters ──
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (errorMessage) setErrorMessage(null);
    const val = e.target.value;
    const nativeEvent = e.nativeEvent as InputEvent;

    if (!val.includes("•")) {
      setRawCardNumber(val.replace(/\D/g, "").slice(0, 16));
      return;
    }
    if (nativeEvent.inputType === "deleteContentBackward" || nativeEvent.inputType === "deleteContentForward") {
      setRawCardNumber(rawCardNumber.slice(0, -1));
      return;
    }
    if (nativeEvent.data && /\d/.test(nativeEvent.data)) {
      if (rawCardNumber.length < 16) setRawCardNumber(rawCardNumber + nativeEvent.data);
      return;
    }
    const cleanVal = val.replace(/\s/g, "");
    if (cleanVal.length < rawCardNumber.length) {
      setRawCardNumber(rawCardNumber.slice(0, cleanVal.length));
    } else if (cleanVal.length > rawCardNumber.length) {
      const addedChars = cleanVal.length - rawCardNumber.length;
      const newChars = cleanVal.slice(-addedChars).replace(/\D/g, "");
      setRawCardNumber((rawCardNumber + newChars).slice(0, 16));
    }
  };

  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    setCardExpiry(formatted.slice(0, 5));
    if (errorMessage) setErrorMessage(null);
  };

  const handleCvcChange = (value: string) => {
    setCardCvc(value.replace(/\D/g, "").slice(0, 4));
    if (errorMessage) setErrorMessage(null);
  };

  const handleNameChange = (value: string) => {
    setCardName(value.slice(0, 30));
    if (errorMessage) setErrorMessage(null);
  };

  // ── Card network detection ──
  const cardType = (() => {
    if (rawCardNumber.startsWith("4")) return "visa";
    if (rawCardNumber.startsWith("5")) return "mastercard";
    return "generic";
  })();

  // ── Payment submission ──
  const handlePayment = async () => {
    if (paymentMethod === "card") {
      if (rawCardNumber.length < 16) {
        setErrorMessage("Por favor ingresa un número de tarjeta válido (16 dígitos)."); return;
      }
      if (!cardName.trim()) {
        setErrorMessage("Por favor ingresa el nombre del titular."); return;
      }
      if (cardExpiry.length < 5) {
        setErrorMessage("Por favor ingresa la fecha de vencimiento (MM/AA)."); return;
      }
      const [monthStr] = cardExpiry.split("/");
      const month = parseInt(monthStr, 10);
      if (isNaN(month) || month < 1 || month > 12) {
        setErrorMessage("Mes de vencimiento inválido. Debe estar entre 01 y 12."); return;
      }
      if (cardCvc.length < 3) {
        setErrorMessage("Por favor ingresa un CVC válido (3 o 4 dígitos)."); return;
      }
    } else if (paymentMethod === "paypal") {
      if (!paypalEmail.trim()) {
        setErrorMessage("Por favor ingresa tu correo electrónico de PayPal."); return;
      }
      if (!paypalPassword.trim()) {
        setErrorMessage("Por favor ingresa tu contraseña de PayPal."); return;
      }
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

  const handleContactlessScan = () => {
    setIsContactlessScanning(true);
    setErrorMessage(null);
    setTimeout(() => {
      setIsContactlessScanning(false);
      handlePayment();
    }, 5000);
  };

  const isCard = paymentMethod === "card";

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <Grid
      templateColumns={isCard ? { base: "1fr", lg: "1.2fr 1fr" } : "1fr"}
      gap="8"
      alignItems="start"
    >
      {/* ── Left: Checkout Form ── */}
      <Stack
        className="glass-panel neon-glow-cyan"
        borderRadius="2xl"
        p={{ base: "6", md: "10" }}
        gap="6"
        transition="all 0.3s ease-in-out"
        // In single-column mode, cap width so the form stays compact and centred
        maxW={isCard ? undefined : "620px"}
        mx={isCard ? undefined : "auto"}
        w="full"
      >
        <Heading size="xl" fontFamily="var(--font-outfit)" letterSpacing="0.06em" color="opsCyan">
          Pasarela de Pago
        </Heading>

        {/* Payment method selector */}
        <Flex gap="2.5" wrap="wrap" justify="space-between">
          {PAYMENT_METHODS.map((method) => {
            const isSelected = paymentMethod === method.id;
            return (
              <Button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                variant={isSelected ? "solid" : "outline"}
                borderColor={isSelected ? "opsCyan" : "opsBorder"}
                bg={isSelected ? "rgba(14, 165, 233, 0.1)" : "transparent"}
                color={isSelected ? "opsText" : "opsMuted"}
                h="12"
                flex={{ base: "1 1 45%", md: "1 1 30%" }}
                borderRadius="lg"
                fontSize={{ base: "xs", md: "sm" }}
                fontWeight="bold"
                letterSpacing="0.05em"
                textTransform="uppercase"
                fontFamily="var(--font-outfit)"
                display="flex"
                gap="2"
                _hover={{ bg: "rgba(14, 165, 233, 0.08)" }}
                px="2"
              >
                <Box as="span" display="inline-flex" flexShrink={0}>{method.icon}</Box>
                <Text display={{ base: "none", sm: "block" }}>{method.label}</Text>
                <Text display={{ base: "block", sm: "none" }}>{method.short}</Text>
              </Button>
            );
          })}
        </Flex>

        {/* ── Card form ── */}
        {paymentMethod === "card" ? (
          <Stack gap="5">
            <Field.Root required>
              <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
                Nombre del Titular
              </Field.Label>
              <Input
                bg="opsPanelMuted" borderColor="opsBorder" borderRadius="xl" h="12"
                placeholder="Juan Pérez" value={cardName}
                onChange={(e) => handleNameChange(e.target.value)}
                _focus={{ borderColor: "opsCyan", bg: "opsPanel" }}
              />
            </Field.Root>

            <Field.Root required>
              <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
                Número de Tarjeta
              </Field.Label>
              <Input
                type="text" bg="opsPanelMuted" borderColor="opsBorder" borderRadius="xl" h="12"
                placeholder="•••• •••• •••• ••••" value={maskedCardNumber}
                onChange={handleCardNumberChange}
                _focus={{ borderColor: "opsCyan", bg: "opsPanel" }}
                autoComplete="cc-number"
              />
            </Field.Root>

            <Grid templateColumns="1fr 1fr" gap="4">
              <Field.Root required>
                <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
                  Vencimiento (MM/AA)
                </Field.Label>
                <Input
                  bg="opsPanelMuted" borderColor="opsBorder" borderRadius="xl" h="12"
                  placeholder="12/29" value={cardExpiry}
                  onChange={(e) => handleExpiryChange(e.target.value)}
                  _focus={{ borderColor: "opsCyan", bg: "opsPanel" }}
                  autoComplete="cc-exp"
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
                  Código CVC
                </Field.Label>
                <Input
                  type="password" bg="opsPanelMuted" borderColor="opsBorder" borderRadius="xl" h="12"
                  placeholder="•••" value={cardCvc}
                  onChange={(e) => handleCvcChange(e.target.value)}
                  onFocus={() => setIsFlipped(true)}
                  onBlur={() => setIsFlipped(false)}
                  _focus={{ borderColor: "opsCyan", bg: "opsPanel" }}
                  autoComplete="cc-csc"
                />
              </Field.Root>
            </Grid>
          </Stack>

        ) : paymentMethod === "paypal" ? (
          /* ── PayPal form ── */
          <Stack gap="5">
            <Box
              bg="linear-gradient(135deg, #003087 0%, #009cde 100%)"
              borderRadius="xl" p="5" textAlign="center"
            >
              <HStack justify="center" gap="2" mb="1" color="white">
                <IconGlobe size={22} />
                <Text
                  color="white" fontSize="xl" fontWeight="black"
                  fontFamily="var(--font-outfit)" letterSpacing="0.06em"
                >
                  PayPal
                </Text>
              </HStack>
              <Text color="rgba(255,255,255,0.65)" fontSize="xs">
                Simulación de inicio de sesión
              </Text>
            </Box>

            <Field.Root required>
              <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
                Correo electrónico
              </Field.Label>
              <Input
                type="email" bg="opsPanelMuted" borderColor="opsBorder" borderRadius="xl" h="12"
                placeholder="correo@ejemplo.com" value={paypalEmail}
                onChange={(e) => { setPaypalEmail(e.target.value); if (errorMessage) setErrorMessage(null); }}
                _focus={{ borderColor: "opsCyan", bg: "opsPanel" }}
                autoComplete="email"
              />
            </Field.Root>

            <Field.Root required>
              <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
                Contraseña
              </Field.Label>
              <Input
                type="password" bg="opsPanelMuted" borderColor="opsBorder" borderRadius="xl" h="12"
                placeholder="••••••••" value={paypalPassword}
                onChange={(e) => { setPaypalPassword(e.target.value); if (errorMessage) setErrorMessage(null); }}
                _focus={{ borderColor: "opsCyan", bg: "opsPanel" }}
                autoComplete="current-password"
              />
            </Field.Root>

            <Button
              bg="#003087" color="white" h="12" borderRadius="xl"
              fontWeight="bold" fontFamily="var(--font-outfit)"
              letterSpacing="0.06em" textTransform="uppercase"
              _hover={{ bg: "#00246e", transform: "translateY(-1px)" }}
              transition="all 0.2s"
              onClick={handlePayment} loading={isLoading}
            >
              Continuar con PayPal
            </Button>
          </Stack>

        ) : paymentMethod === "cash" ? (
          /* ── Cash panel ── */
          <Stack
            bg="opsPanelMuted" border="1px dashed" borderColor="opsBorder"
            p="10" borderRadius="xl" align="center" gap="6"
          >
            <Text color="opsMuted" fontSize="sm" textAlign="center">
              Inserta tus billetes o monedas en la ranura simulada.
            </Text>
            <Button
              bg="green.500" color="white"
              _hover={{ bg: "green.600" }}
              onClick={handlePayment} loading={isLoading}
            >
              Simular Ingreso de Efectivo
            </Button>
          </Stack>

        ) : paymentMethod === "contactless" ? (
          /* ── NFC / Contactless panel ── */
          <Stack
            bg="opsPanelMuted" border="1px dashed" borderColor="opsBorder"
            p="10" borderRadius="xl" align="center" gap="6"
          >
            <Box
              position="relative" w="24" h="24"
              display="flex" alignItems="center" justifyContent="center"
              borderRadius="full"
              bg={isContactlessScanning ? "rgba(14, 165, 233, 0.2)" : "opsPanel"}
              transition="all 0.3s"
              border="2px solid"
              borderColor={isContactlessScanning ? "opsCyan" : "opsBorder"}
              className={isContactlessScanning ? "pulse-glow" : ""}
              color={isContactlessScanning ? "opsCyan" : "opsMuted"}
            >
              <IconWifi size={42} />
            </Box>
            <Text color="opsMuted" fontSize="sm" textAlign="center">
              Acerca tu tarjeta o dispositivo NFC a la terminal.
            </Text>
            <Button
              bg="opsCyan" color="white" _hover={{ bg: "blue.600" }}
              onClick={handleContactlessScan}
              loading={isContactlessScanning || isLoading}
              loadingText="Procesando 5s..."
            >
              Acercar Dispositivo
            </Button>
          </Stack>

        ) : paymentMethod === "apple_pay" || paymentMethod === "google_pay" ? (
          /* ── Apple Pay / Google Pay panel ── */
          <Stack
            bg={paymentMethod === "apple_pay" ? "black" : "white"}
            border="1px dashed" borderColor="opsBorder"
            p="10" borderRadius="xl" align="center" gap="6"
          >
            <HStack gap="2.5" align="center">
              {paymentMethod === "apple_pay" ? (
                <Box color="white"><IconApple size={30} /></Box>
              ) : (
                <IconGoogleG size={30} />
              )}
              <Text
                color={paymentMethod === "apple_pay" ? "white" : "black"}
                fontSize="2xl" fontWeight="bold"
              >
                {paymentMethod === "apple_pay" ? "Apple Pay" : "Google Pay"}
              </Text>
            </HStack>

            <Box bg="white" p="4" borderRadius="lg">
              <QRCode value={`payment-${ticketCode}`} size={160} />
            </Box>

            <Text
              color={paymentMethod === "apple_pay" ? "gray.400" : "gray.600"}
              fontSize="sm" textAlign="center"
            >
              Escanea el código QR desde tu celular para simular el pago con{" "}
              {paymentMethod === "apple_pay" ? "Apple Pay" : "Google Pay"}.
            </Text>

            <Button
              bg={paymentMethod === "apple_pay" ? "white" : "blue.500"}
              color={paymentMethod === "apple_pay" ? "black" : "white"}
              _hover={{ bg: paymentMethod === "apple_pay" ? "gray.200" : "blue.600" }}
              onClick={handlePayment} loading={isLoading}
            >
              Simular Escaneo
            </Button>
          </Stack>
        ) : null}

        {/* ── SSL badge ── */}
        <Box
          bg="rgba(14, 165, 233, 0.03)"
          border="1px solid" borderColor="opsBorder"
          p="4" borderRadius="xl"
        >
          <Flex align="center" gap="2.5" mb="1.5">
            <Box className="pulse-glow" w="2" h="2" bg="opsCyan" borderRadius="full" />
            <HStack gap="1.5" align="center" color="opsCyan">
              <IconLock size={13} />
              <Text
                fontFamily="var(--font-outfit)"
                fontSize="xxs" fontWeight="black"
                letterSpacing="0.1em" textTransform="uppercase"
              >
                Pago Encriptado SSL
              </Text>
            </HStack>
          </Flex>
          <Text color="opsMuted" fontSize="xs" lineHeight="1.5">
            Esta es una pasarela simulada. Tu pago para el boleto{" "}
            <Text as="span" fontWeight="bold" color="opsText">{ticketCode}</Text>{" "}
            se registrará instantáneamente en el sistema de demostración sin cargos reales.
          </Text>
        </Box>

        {/* ── Action buttons ── */}
        <Stack gap="3" mt="2">
          {errorMessage && (
            <Text color="opsRed" fontSize="xs" fontWeight="bold">{errorMessage}</Text>
          )}

          {paymentMethod === "card" && (
            <Button
              bg="opsCyan" color="white" h="14"
              fontFamily="var(--font-outfit)" fontWeight="bold"
              letterSpacing="0.08em" textTransform="uppercase" borderRadius="xl"
              _hover={{ bg: "blue.700", transform: "translateY(-2px)" }}
              transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
              loading={isLoading} onClick={handlePayment}
            >
              Pagar boleto
            </Button>
          )}

          <Button
            variant="outline" borderColor="opsBorder" h="14"
            fontFamily="var(--font-outfit)" fontWeight="bold"
            letterSpacing="0.08em" textTransform="uppercase" borderRadius="xl"
            _hover={{ bg: "rgba(229, 237, 247, 0.04)" }}
            onClick={() => router.push(`/pagar/${ticketCode}`)}
            transition="all 0.25s"
            disabled={isLoading || isContactlessScanning}
          >
            Volver
          </Button>
        </Stack>
      </Stack>

      {/* ── Right: Credit Card Preview (only for card method) ── */}
      {isCard && (
      <Box
        position={{ lg: "sticky" }}
        top={{ lg: "24px" }}
        w="full" maxW="340px" mx="auto"
        style={{ perspective: "1000px" }}
        animation="fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
      >
        <Box
          w="full" h="215px"
          position="relative"
          style={{ transformStyle: "preserve-3d" }}
          transition="transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
          transform={isFlipped ? "rotateY(180deg)" : "none"}
        >
          {/* Card Front */}
          <Box
            position="absolute" w="full" h="full"
            style={{ backfaceVisibility: "hidden" }}
            borderRadius="2xl" p="6"
            bg="linear-gradient(135deg, #0b0f19 0%, #1e293b 50%, #0ea5e9 100%)"
            border="1px solid" borderColor="rgba(255,255,255,0.15)"
            boxShadow="0 20px 40px rgba(0,0,0,0.4)"
            display="flex" flexDirection="column" justifyContent="space-between"
          >
            <Flex justify="space-between" align="center">
              <CardChip />
              {cardType === "visa" && <VisaLogo />}
              {cardType === "mastercard" && <MastercardLogo />}
              {cardType === "generic" && (
                <Text color="whiteAlpha.600" fontSize="xs" fontWeight="bold">CARD</Text>
              )}
            </Flex>

            <Text
              fontFamily="var(--font-outfit)" fontSize="2xl" fontWeight="bold"
              letterSpacing="0.12em" color="white"
              textShadow="0 2px 4px rgba(0,0,0,0.5)" my="4"
            >
              {maskedCardNumber || "•••• •••• •••• ••••"}
            </Text>

            <Flex justify="space-between" align="flex-end">
              <Stack gap="0">
                <Text fontSize="8px" color="whiteAlpha.600" textTransform="uppercase" letterSpacing="0.05em">
                  Titular
                </Text>
                <Text
                  fontFamily="var(--font-outfit)" fontSize="sm" fontWeight="bold"
                  color="white" textTransform="uppercase" lineClamp="1"
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

          {/* Card Back */}
          <Box
            position="absolute" w="full" h="full"
            style={{ backfaceVisibility: "hidden" }}
            transform="rotateY(180deg)"
            borderRadius="2xl" py="6"
            bg="linear-gradient(135deg, #1e293b 0%, #0b0f19 100%)"
            border="1px solid" borderColor="rgba(255,255,255,0.15)"
            boxShadow="0 20px 40px rgba(0,0,0,0.4)"
            display="flex" flexDirection="column" justifyContent="space-between"
          >
            <Box w="full" h="10" bg="black" mt="1" />

            <Stack gap="2" px="6" mt="4">
              <Text fontSize="8px" color="whiteAlpha.600" textTransform="uppercase" letterSpacing="0.05em" textAlign="right">
                CVC / CVV
              </Text>
              <Flex bg="white" h="9" borderRadius="md" align="center" justify="flex-end" px="3.5" boxShadow="inner">
                <Text
                  fontFamily="monospace" fontStyle="italic" fontWeight="bold"
                  fontSize="md" color="black" letterSpacing="0.05em"
                >
                  {cardCvc ? cardCvc.replace(/./g, "•") : "•••"}
                </Text>
              </Flex>
            </Stack>

            <Text fontSize="8px" color="whiteAlpha.500" px="6" textAlign="center" mt="2">
              Pasarela de demostración simulada. No comparta información financiera real en este formulario.
            </Text>
          </Box>
        </Box>
      </Box>
      )}
    </Grid>
  );
}
