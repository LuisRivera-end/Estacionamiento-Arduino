"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Box, Button, Field, Heading, Input, Stack, Text } from "@chakra-ui/react";

import { createSupabaseBrowserClient } from "@/lib/auth/client";

type LoginPageClientProps = {
  allowInitialAccountCreation: boolean;
};

export function LoginPageClient({
  allowInitialAccountCreation,
}: LoginPageClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    startTransition(() => {
      router.replace("/dashboard");
      router.refresh();
    });
  }

  async function handleCreateInitialAccount() {
    setIsCreatingAccount(true);
    setError(null);
    setNotice(null);

    const supabase = createSupabaseBrowserClient();
    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/confirm`
        : undefined;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsCreatingAccount(false);
      return;
    }

    if (data.session) {
      startTransition(() => {
        router.replace("/dashboard");
        router.refresh();
      });
      return;
    }

    setNotice(
      "Cuenta creada. Revisa tu correo para confirmar el acceso y luego inicia sesion.",
    );
    setIsCreatingAccount(false);
  }

  return (
    <Box
      bg="opsBg"
      color="opsText"
      display="grid"
      minH="100vh"
      p="6"
      placeItems="center"
    >
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "420px" }}>
        <Stack
          bg="opsPanel"
          borderColor="opsBorder"
          borderRadius="2xl"
          borderWidth="1px"
          gap="4"
          p="6"
          w="full"
        >
          <Heading size="lg">Inicio de sesion</Heading>
          <Text color="opsMuted">
            {allowInitialAccountCreation
              ? "Inicia sesion con tu cuenta para acceder al panel. Si todavia no existe un usuario, primero crea la cuenta inicial."
              : "Inicia sesion con tu cuenta para acceder al panel."}
          </Text>
          <Field.Root required>
            <Field.Label>Correo</Field.Label>
            <Input
              type="email"
              placeholder="correo@dominio.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field.Root>
          <Field.Root required>
            <Field.Label>Contrasena</Field.Label>
            <Input
              type="password"
              placeholder="Ingresa tu contrasena"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field.Root>
          {error ? <Text color="red.300">{error}</Text> : null}
          {notice ? <Text color="green.300">{notice}</Text> : null}
          <Button colorPalette="cyan" loading={isSubmitting} type="submit">
            Entrar
          </Button>
          {allowInitialAccountCreation ? (
            <Button
              loading={isCreatingAccount}
              onClick={handleCreateInitialAccount}
              type="button"
              variant="outline"
            >
              Crear cuenta inicial
            </Button>
          ) : null}
        </Stack>
      </form>
    </Box>
  );
}
