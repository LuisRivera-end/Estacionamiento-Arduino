"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Field,
  Grid,
  Heading,
  Input,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { createStaffUser } from "@/lib/api/users";
import type { StaffProfile, StaffRole } from "@/lib/api/types";

export function UsersManager({
  initialUsers,
  accessToken,
}: {
  initialUsers: StaffProfile[];
  accessToken: string;
}) {
  const [users, setUsers] = useState<StaffProfile[]>(initialUsers);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<StaffRole>("panelist");
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    if (!email || !password) {
      setErrorMessage("El correo y la contraseña son requeridos.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      setIsSubmitting(false);
      return;
    }

    try {
      const newUser = await createStaffUser(
        {
          email,
          password,
          display_name: displayName || null,
          role,
        },
        accessToken
      );
      
      setUsers([newUser, ...users]);
      setEmail("");
      setPassword("");
      setDisplayName("");
      setRole("panelist");
      setSuccessMessage("Usuario creado exitosamente.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error al crear usuario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Grid templateColumns={{ base: "1fr", lg: "1fr 340px" }} gap="6" w="full" alignSelf="start">
      {/* List of Users */}
      <Stack gap="4">
        <Heading size="md" color="opsText" fontFamily="var(--font-orbitron)">
          Usuarios Registrados
        </Heading>
        <Box
          bg="opsPanel"
          borderColor="opsBorder"
          borderRadius="xl"
          borderWidth="1px"
          overflowX="auto"
        >
          <Table.Root size="sm" variant="outline">
            <Table.Header bg="opsPanelMuted">
              <Table.Row bg="opsPanelMuted">
                <Table.ColumnHeader color="opsText" bg="opsPanelMuted" borderColor="opsBorder" fontWeight="bold">Email</Table.ColumnHeader>
                <Table.ColumnHeader color="opsText" bg="opsPanelMuted" borderColor="opsBorder" fontWeight="bold">Nombre</Table.ColumnHeader>
                <Table.ColumnHeader color="opsText" bg="opsPanelMuted" borderColor="opsBorder" fontWeight="bold">Rol</Table.ColumnHeader>
                <Table.ColumnHeader color="opsText" bg="opsPanelMuted" borderColor="opsBorder" fontWeight="bold">Estado</Table.ColumnHeader>
                <Table.ColumnHeader color="opsText" bg="opsPanelMuted" borderColor="opsBorder" fontWeight="bold">Creado el</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body bg="opsPanel">
              {users.map((user) => (
                <Table.Row key={user.user_id} _hover={{ bg: "opsPanelMuted" }} bg="opsPanel" borderColor="opsBorder">
                  <Table.Cell color="opsText" borderColor="opsBorder" fontWeight="medium">{user.email}</Table.Cell>
                  <Table.Cell color="opsText" borderColor="opsBorder">{user.display_name || "-"}</Table.Cell>
                  <Table.Cell borderColor="opsBorder">
                    <Text
                      as="span"
                      px="2.5"
                      py="0.5"
                      borderRadius="full"
                      fontSize="2xs"
                      fontWeight="bold"
                      bg={user.role === "admin" ? "rgba(37, 99, 235, 0.1)" : "rgba(100, 116, 139, 0.1)"}
                      color={user.role === "admin" ? "opsCyan" : "opsMuted"}
                      border="1px solid"
                      borderColor={user.role === "admin" ? "rgba(37, 99, 235, 0.2)" : "rgba(100, 116, 139, 0.2)"}
                    >
                      {user.role.toUpperCase()}
                    </Text>
                  </Table.Cell>
                  <Table.Cell borderColor="opsBorder">
                    <Text
                      as="span"
                      px="2.5"
                      py="0.5"
                      borderRadius="full"
                      fontSize="2xs"
                      fontWeight="bold"
                      bg={user.status === "active" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"}
                      color={user.status === "active" ? "opsGreen" : "opsRed"}
                      border="1px solid"
                      borderColor={user.status === "active" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}
                    >
                      {user.status.toUpperCase()}
                    </Text>
                  </Table.Cell>
                  <Table.Cell color="opsMuted" borderColor="opsBorder" fontSize="xs">
                    {new Date(user.created_at).toLocaleDateString()}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </Stack>

      {/* Creation Form */}
      <Stack gap="4">
        <Heading size="md" color="opsText" fontFamily="var(--font-orbitron)">
          Nuevo Usuario
        </Heading>
        <Stack
          as="form"
          onSubmit={handleCreateUser}
          bg="opsPanel"
          borderColor="opsBorder"
          borderRadius="xl"
          borderWidth="1px"
          p="5"
          gap="4"
        >
          <Field.Root required>
            <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold">Correo Electrónico</Field.Label>
            <Input
              type="email"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              bg="opsPanelMuted"
              borderColor="opsBorder"
              _focus={{ borderColor: "opsCyan" }}
            />
          </Field.Root>

          <Field.Root required>
            <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold">Contraseña</Field.Label>
            <Input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              bg="opsPanelMuted"
              borderColor="opsBorder"
              _focus={{ borderColor: "opsCyan" }}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold">Nombre a Mostrar</Field.Label>
            <Input
              placeholder="Juan Pérez"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              bg="opsPanelMuted"
              borderColor="opsBorder"
              _focus={{ borderColor: "opsCyan" }}
            />
          </Field.Root>

          <Field.Root required>
            <Field.Label color="opsMuted" fontSize="xs" fontWeight="bold">Rol del Usuario</Field.Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              style={{ width: "100%", outline: "none", border: "1px solid var(--chakra-colors-opsBorder)" }}
            >
              <option value="panelist">Panelista (Lectura)</option>
              <option value="admin">Administrador (Total)</option>
            </select>
          </Field.Root>

          {errorMessage && (
            <Text color="opsRed" fontSize="xs" fontWeight="bold">
              {errorMessage}
            </Text>
          )}

          {successMessage && (
            <Text color="opsGreen" fontSize="xs" fontWeight="bold">
              {successMessage}
            </Text>
          )}

          <Button
            type="submit"
            bg="opsCyan"
            color="white"
            loading={isSubmitting}
            w="full"
            mt="2"
            _hover={{ bg: "blue.700" }}
          >
            Crear Usuario
          </Button>
        </Stack>
      </Stack>
    </Grid>
  );
}
