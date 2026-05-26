"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Box, Button, Field, Heading, Input, Stack, Text } from "@chakra-ui/react";

import { createSupabaseBrowserClient } from "@/lib/auth/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

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
          <Heading size="lg">Acceso operativo</Heading>
          <Text color="opsMuted">
            Ingresa con una cuenta de Supabase. El primer acceso se registra como
            administrador.
          </Text>
          <Field.Root required>
            <Field.Label>Correo</Field.Label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field.Root>
          <Field.Root required>
            <Field.Label>Contrasena</Field.Label>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field.Root>
          {error ? <Text color="red.300">{error}</Text> : null}
          <Button colorPalette="cyan" loading={isSubmitting} type="submit">
            Entrar
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
