import { Box, Heading, Text } from "@chakra-ui/react";

type ErrorStateProps = {
  title?: string;
  description: string;
};

export function ErrorState({
  title = "No se pudo cargar la informacion",
  description,
}: ErrorStateProps) {
  return (
    <Box
      bg="rgba(248,113,113,0.12)"
      borderColor="opsRed"
      borderRadius="xl"
      borderWidth="1px"
      p={{ base: "5", md: "6" }}
    >
      <Heading color="opsText" size="md">
        {title}
      </Heading>
      <Text color="opsMuted" mt="2">
        {description}
      </Text>
    </Box>
  );
}
