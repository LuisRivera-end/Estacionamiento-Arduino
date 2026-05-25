import { Box, Button, Field, Heading, Input, Stack, Text } from "@chakra-ui/react";

export default function LoginPage() {
  return (
    <Box
      bg="opsBg"
      color="opsText"
      display="grid"
      minH="100vh"
      p="6"
      placeItems="center"
    >
      <Stack
        bg="opsPanel"
        borderColor="opsBorder"
        borderRadius="2xl"
        borderWidth="1px"
        gap="4"
        maxW="420px"
        p="6"
        w="full"
      >
        <Heading size="lg">Acceso operativo</Heading>
        <Text color="opsMuted">
          Ingresa con una cuenta administrativa de Supabase.
        </Text>
        <Field.Root required>
          <Field.Label>Correo</Field.Label>
          <Input type="email" />
        </Field.Root>
        <Field.Root required>
          <Field.Label>Contrasena</Field.Label>
          <Input type="password" />
        </Field.Root>
        <Button colorPalette="cyan">Entrar</Button>
      </Stack>
    </Box>
  );
}
