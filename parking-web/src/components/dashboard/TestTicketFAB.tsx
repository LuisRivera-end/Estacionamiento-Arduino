"use client";

import { useState } from "react";
import { Box, Button } from "@chakra-ui/react";

import { createTestTicket } from "@/lib/api/dev";
import { getBrowserAccessToken } from "@/lib/auth/client";

export function TestTicketFAB() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Chakra v3 toast hook usage - we mock it or use standard DOM if standard chakra toast isn't available
  // To avoid breaking, I'll use a standard alert for now, but in a real app we'd use the correct toast from context.
  
  async function handleCreateTicket() {
    setIsSubmitting(true);
    const accessToken = await getBrowserAccessToken();

    if (!accessToken) {
      alert("Sesión no válida. Vuelve a iniciar sesión.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await createTestTicket(accessToken);
      alert(`✅ Ticket de prueba creado: ${result.ticket_code}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al crear ticket");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box position="fixed" bottom="6" right="6" zIndex="tooltip">
      <Button
        colorPalette="cyan"
        onClick={handleCreateTicket}
        loading={isSubmitting}
        size="lg"
        borderRadius="full"
        boxShadow="lg"
        _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
        transition="all 0.2s"
        px="6"
      >
        <Box as="span" mr="2" display="inline-flex">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </Box>
        Generar Ticket Prueba
      </Button>
    </Box>
  );
}
