"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Checkbox, Field, Grid, Input, Stack, Text } from "@chakra-ui/react";

import { updatePricingRule } from "@/lib/api/admin-settings";
import type { PricingRule } from "@/lib/api/types";
import { getBrowserAccessToken } from "@/lib/auth/client";

type PricingEditorProps = {
  initialPricing: PricingRule;
};

type NumberFieldKey =
  | "freeToleranceMinutes"
  | "blockMinutes"
  | "blockAmount"
  | "lostTicketFee"
  | "seniorDiscountPercent"
  | "studentDiscountPercent";

type NumberFields = Record<NumberFieldKey, string>;

export function PricingEditor({ initialPricing }: PricingEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(initialPricing.name);
  const [numbers, setNumbers] = useState<NumberFields>({
    freeToleranceMinutes: String(initialPricing.free_tolerance_minutes),
    blockMinutes: String(initialPricing.block_minutes),
    blockAmount: String(initialPricing.block_amount),
    lostTicketFee: String(initialPricing.lost_ticket_fee),
    seniorDiscountPercent: String(initialPricing.senior_discount_percent),
    studentDiscountPercent: String(initialPricing.student_discount_percent),
  });
  const [studentAllowedDomains, setStudentAllowedDomains] = useState(
    initialPricing.student_allowed_domains.join(", "),
  );
  const [seniorLostTicketEnabled, setSeniorLostTicketEnabled] = useState(
    initialPricing.senior_discount_applies_to_lost_ticket,
  );
  const [studentLostTicketEnabled, setStudentLostTicketEnabled] = useState(
    initialPricing.student_discount_applies_to_lost_ticket,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function setNumberField(key: NumberFieldKey, value: string) {
    setNumbers((current) => ({ ...current, [key]: value }));
  }

  function parseNumberField(
    key: NumberFieldKey,
    min: number,
    max: number,
  ): number | null {
    const parsed = Number.parseInt(numbers[key], 10);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
    return parsed;
  }

  function parseDomains(rawDomains: string): string[] {
    const domains = rawDomains
      .split(",")
      .map((domain) => domain.trim().toLowerCase())
      .filter((domain) => domain.length > 0);

    return Array.from(new Set(domains));
  }

  async function onSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    const accessToken = await getBrowserAccessToken();

    if (!accessToken) {
      setError("Sesion no valida. Vuelve a iniciar sesion.");
      setIsSaving(false);
      return;
    }

    const freeToleranceMinutes = parseNumberField("freeToleranceMinutes", 0, 1200);
    const blockMinutes = parseNumberField("blockMinutes", 1, 1200);
    const blockAmount = parseNumberField("blockAmount", 0, 100000);
    const lostTicketFee = parseNumberField("lostTicketFee", 0, 100000);
    const seniorDiscountPercent = parseNumberField("seniorDiscountPercent", 0, 100);
    const studentDiscountPercent = parseNumberField("studentDiscountPercent", 0, 100);
    const domains = parseDomains(studentAllowedDomains);

    if (
      freeToleranceMinutes === null ||
      blockMinutes === null ||
      blockAmount === null ||
      lostTicketFee === null ||
      seniorDiscountPercent === null ||
      studentDiscountPercent === null ||
      domains.length === 0
    ) {
      setError("Verifica valores numericos, porcentajes y dominios permitidos.");
      setIsSaving(false);
      return;
    }

    try {
      await updatePricingRule(
        {
          name: name.trim(),
          free_tolerance_minutes: freeToleranceMinutes,
          block_minutes: blockMinutes,
          block_amount: blockAmount,
          lost_ticket_fee: lostTicketFee,
          senior_discount_percent: seniorDiscountPercent,
          student_discount_percent: studentDiscountPercent,
          student_allowed_domains: domains,
          senior_discount_applies_to_lost_ticket: seniorLostTicketEnabled,
          student_discount_applies_to_lost_ticket: studentLostTicketEnabled,
        },
        accessToken,
      );
      setSuccess("Tarifas y descuentos guardados en base de datos.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar tarifas y descuentos.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Stack
      bg="opsPanel"
      borderColor="opsBorder"
      borderRadius="xl"
      borderWidth="1px"
      gap="6"
      p="6"
      maxW="4xl"
      w="full"
    >
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="5">
        <Field.Root required>
          <Field.Label>Nombre de regla</Field.Label>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </Field.Root>
        <Field.Root required>
          <Field.Label>Tolerancia gratis (min)</Field.Label>
          <Input
            type="number"
            value={numbers.freeToleranceMinutes}
            onChange={(event) => setNumberField("freeToleranceMinutes", event.target.value)}
          />
        </Field.Root>
        <Field.Root required>
          <Field.Label>Duracion por bloque (min)</Field.Label>
          <Input
            type="number"
            value={numbers.blockMinutes}
            onChange={(event) => setNumberField("blockMinutes", event.target.value)}
          />
        </Field.Root>
        <Field.Root required>
          <Field.Label>Monto por bloque (MXN)</Field.Label>
          <Input
            type="number"
            value={numbers.blockAmount}
            onChange={(event) => setNumberField("blockAmount", event.target.value)}
          />
        </Field.Root>
        <Field.Root required>
          <Field.Label>Cuota ticket extraviado (MXN)</Field.Label>
          <Input
            type="number"
            value={numbers.lostTicketFee}
            onChange={(event) => setNumberField("lostTicketFee", event.target.value)}
          />
        </Field.Root>
        <Field.Root required>
          <Field.Label>Descuento adulto mayor (%)</Field.Label>
          <Input
            type="number"
            value={numbers.seniorDiscountPercent}
            onChange={(event) => setNumberField("seniorDiscountPercent", event.target.value)}
          />
        </Field.Root>
        <Field.Root required>
          <Field.Label>Descuento estudiante (%)</Field.Label>
          <Input
            type="number"
            value={numbers.studentDiscountPercent}
            onChange={(event) => setNumberField("studentDiscountPercent", event.target.value)}
          />
        </Field.Root>
        <Field.Root required gridColumn={{ md: "span 2" }}>
          <Field.Label>Dominios escolares permitidos (coma separada)</Field.Label>
          <Input
            value={studentAllowedDomains}
            onChange={(event) => setStudentAllowedDomains(event.target.value)}
          />
        </Field.Root>
      </Grid>

      <Stack gap="3" mt="2">
        <Checkbox.Root
          checked={seniorLostTicketEnabled}
          onCheckedChange={(details) =>
            setSeniorLostTicketEnabled(details.checked === true)
          }
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>
            Permitir descuento adulto mayor en ticket extraviado
          </Checkbox.Label>
        </Checkbox.Root>
        <Checkbox.Root
          checked={studentLostTicketEnabled}
          onCheckedChange={(details) =>
            setStudentLostTicketEnabled(details.checked === true)
          }
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>
            Permitir descuento estudiante en ticket extraviado
          </Checkbox.Label>
        </Checkbox.Root>
      </Stack>

      {error ? <Text color="red.300">{error}</Text> : null}
      {success ? <Text color="green.300">{success}</Text> : null}
      <Button colorPalette="cyan" loading={isSaving} onClick={onSave} w="fit-content">
        Guardar tarifas
      </Button>
    </Stack>
  );
}
