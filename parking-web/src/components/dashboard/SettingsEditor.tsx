"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input, Stack, Text } from "@chakra-ui/react";

import { updateParkingSettings } from "@/lib/api/admin-settings";
import type { ParkingSettings } from "@/lib/api/types";
import { getBrowserAccessToken } from "@/lib/auth/client";

type SettingsEditorProps = {
  initialSettings: ParkingSettings;
};

export function SettingsEditor({ initialSettings }: SettingsEditorProps) {
  const router = useRouter();
  const [capacity, setCapacity] = useState(String(initialSettings.capacity_total));
  const [timezone, setTimezone] = useState(initialSettings.timezone);
  const [currency, setCurrency] = useState(initialSettings.currency);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    const accessToken = await getBrowserAccessToken();

    if (!accessToken) {
      setError("Sesión no válida. Vuelve a iniciar sesión.");
      setIsSaving(false);
      return;
    }

    const parsedCapacity = Number.parseInt(capacity, 10);
    if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
      setError("La capacidad debe ser un entero mayor a cero.");
      setIsSaving(false);
      return;
    }

    try {
      await updateParkingSettings(
        {
          capacity_total: parsedCapacity,
          timezone: timezone.trim(),
          currency: currency.trim().toUpperCase(),
        },
        accessToken,
      );
      setSuccess("Configuración guardada en base de datos.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar la configuración.",
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
        <Field.Label>Capacidad total</Field.Label>
        <Input
          type="number"
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
        />
      </Field.Root>
      <Field.Root required>
        <Field.Label>Zona horaria</Field.Label>
        <Input
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
        />
      </Field.Root>
      <Field.Root required>
        <Field.Label>Moneda</Field.Label>
        <Input
          disabled
          maxLength={3}
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
        />
      </Field.Root>
      {error ? <Text color="red.300">{error}</Text> : null}
      {success ? <Text color="green.300">{success}</Text> : null}
      <Button colorPalette="cyan" loading={isSaving} onClick={onSave} w="fit-content">
        Guardar configuración
      </Button>
    </Stack>
  );
}
