import { Box, Heading, Text } from "@chakra-ui/react";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Box
      bg="opsPanel"
      borderColor="opsBorder"
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
