"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Text } from "@chakra-ui/react";

import { pushSync } from "@/lib/api/sync";
import { getBrowserAccessToken } from "@/lib/auth/client";

export function SyncPushButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSync() {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    const accessToken = await getBrowserAccessToken();

    if (!accessToken) {
      setError("Sesión no válida. Vuelve a iniciar sesión.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await pushSync(accessToken);
      const tableCount = Object.keys(result.tables).length;
      setSuccess(
        `Sincronización completa: ${result.total_pushed} filas en ${tableCount} tablas (${result.duration_ms} ms).`,
      );
      router.refresh();
    } catch (syncError) {
      // El backend devuelve mensajes legibles (p.ej. "sin internet") vía AppError.
      setError(
        syncError instanceof Error ? syncError.message : "No se pudo sincronizar.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button
        colorPalette="cyan"
        loading={isSubmitting}
        onClick={onSync}
        w="fit-content"
      >
        Sincronizar ahora
      </Button>
      {error ? <Text color="red.300">{error}</Text> : null}
      {success ? <Text color="green.300">{success}</Text> : null}
    </>
  );
}
