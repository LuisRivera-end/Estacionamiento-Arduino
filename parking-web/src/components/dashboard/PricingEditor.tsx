"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input, Stack, Text } from "@chakra-ui/react";

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
  | "lostTicketFee";

type NumberFields = Record<NumberFieldKey, string>;

export function PricingEditor({ initialPricing }: PricingEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(initialPricing.name);
  const [numbers, setNumbers] = useState<NumberFields>({
    freeToleranceMinutes: String(initialPricing.free_tolerance_minutes),
    blockMinutes: String(initialPricing.block_minutes),
    blockAmount: String(initialPricing.block_amount),
    lostTicketFee: String(initialPricing.lost_ticket_fee),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function setNumberField(key: NumberFieldKey, value: string) {
    setNumbers((current) => ({ ...current, [key]: value }));
  }

  function parseNumberField(key: NumberFieldKey): number | null {
    const parsed = Number.parseInt(numbers[key], 10);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return parsed;
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

    const freeToleranceMinutes = parseNumberField("freeToleranceMinutes");
    const blockMinutes = parseNumberField("blockMinutes");
    const blockAmount = parseNumberField("blockAmount");
    const lostTicketFee = parseNumberField("lostTicketFee");

    if (
      freeToleranceMinutes === null ||
      blockMinutes === null ||
      blockAmount === null ||
      lostTicketFee === null ||
      blockMinutes < 1
    ) {
      setError("Los valores numericos deben ser validos y positivos.");
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
        },
        accessToken,
      );
      setSuccess("Tarifas guardadas en base de datos.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "No se pudo guardar tarifas.",
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
      gap="4"
      p="5"
    >
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
      {error ? <Text color="red.300">{error}</Text> : null}
      {success ? <Text color="green.300">{success}</Text> : null}
      <Button colorPalette="cyan" loading={isSaving} onClick={onSave} w="fit-content">
        Guardar tarifas
      </Button>
    </Stack>
  );
}
