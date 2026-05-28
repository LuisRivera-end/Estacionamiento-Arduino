"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Spinner, Stack, Text } from "@chakra-ui/react";

import { createSupabaseBrowserClient } from "@/lib/auth/client";

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Confirmando acceso...");

  useEffect(() => {
    async function confirmAccess() {
      const code = searchParams.get("code");

      if (!code) {
        setMessage("Enlace inválido. Vuelve a iniciar sesión.");
        router.replace("/login");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setMessage("No se pudo confirmar el acceso. Vuelve a intentarlo.");
        router.replace("/login");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    }

    void confirmAccess();
  }, [router, searchParams]);

  return (
    <Stack align="center" gap="4">
      <Spinner color="cyan.300" size="xl" />
      <Text>{message}</Text>
    </Stack>
  );
}

export default function AuthConfirmPage() {
  return (
    <Box bg="opsBg" color="opsText" display="grid" minH="100vh" placeItems="center" p="6">
      <Suspense
        fallback={
          <Stack align="center" gap="4">
            <Spinner color="cyan.300" size="xl" />
            <Text>Confirmando acceso...</Text>
          </Stack>
        }
      >
        <AuthConfirmContent />
      </Suspense>
    </Box>
  );
}
