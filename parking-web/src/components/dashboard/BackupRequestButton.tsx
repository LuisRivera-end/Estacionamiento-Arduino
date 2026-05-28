"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Text } from "@chakra-ui/react";

import { requestBackup } from "@/lib/api/backups";
import { getStaffProfile } from "@/lib/api/auth";
import { getBrowserAccessToken } from "@/lib/auth/client";

export function BackupRequestButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onRequestBackup() {
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
      const profile = await getStaffProfile(accessToken);
      await requestBackup(profile.email, accessToken);
      setSuccess("Backup solicitado y persistido en base de datos.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo solicitar backup.",
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
        onClick={onRequestBackup}
        w="fit-content"
      >
        Solicitar backup manual
      </Button>
      {error ? <Text color="red.300">{error}</Text> : null}
      {success ? <Text color="green.300">{success}</Text> : null}
    </>
  );
}
