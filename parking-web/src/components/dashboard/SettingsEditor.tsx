"use client";

import { Button, Field, Input, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateParkingSettings } from "@/lib/api/admin-settings";
import { getBrowserAccessToken } from "@/lib/auth/client";
import type { ParkingSettings } from "@/lib/api/types";

type SettingsEditorProps = {
  initialSettings: ParkingSettings;
};

export function SettingsEditor({ initialSettings }: SettingsEditorProps) {
  const router = useRouter();
  const [capacity, setCapacity] = useState(String(initialSettings.capacity_total));
  const timezone = initialSettings.timezone;
  const [currency, setCurrency] = useState(initialSettings.currency);
  const [parkingName, setParkingName] = useState(initialSettings.parking_name);
  const [expirationHours, setExpirationHours] = useState(
    String(initialSettings.ticket_expiration_hours),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

    const parsedCapacity = Number.parseInt(capacity, 10);
    if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
      setError("La capacidad debe ser un entero mayor a cero.");
      setIsSaving(false);
      return;
    }

    const parsedExpiration = Number.parseInt(expirationHours, 10);
    if (!Number.isFinite(parsedExpiration) || parsedExpiration < 1) {
      setError("La expiracion debe ser al menos 1 hora.");
      setIsSaving(false);
      return;
    }

    const trimmedName = parkingName.trim();
    if (!trimmedName) {
      setError("El nombre del estacionamiento no puede estar vacio.");
      setIsSaving(false);
      return;
    }

    try {
      await updateParkingSettings(
        {
          capacity_total: parsedCapacity,
          timezone: timezone.trim(),
          currency: currency.trim().toUpperCase(),
          parking_name: trimmedName,
          ticket_expiration_hours: parsedExpiration,
        },
        accessToken,
      );
      setSuccess("Configuracion guardada en base de datos.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar la configuracion.",
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
      maxW="md"
    >
      <Field.Root required>
        <Field.Label>Nombre del estacionamiento</Field.Label>
        <Input
          value={parkingName}
          onChange={(event) => setParkingName(event.target.value)}
          maxLength={100}
        />
      </Field.Root>

      <Field.Root required>
        <Field.Label>Capacidad total</Field.Label>
        <Input
          type="number"
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
        />
      </Field.Root>

      <Field.Root required>
        <Field.Label>Expiracion de boletos (horas)</Field.Label>
        <Input
          type="number"
          value={expirationHours}
          onChange={(event) => setExpirationHours(event.target.value)}
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
        Guardar configuracion
      </Button>
    </Stack>
  );
}
