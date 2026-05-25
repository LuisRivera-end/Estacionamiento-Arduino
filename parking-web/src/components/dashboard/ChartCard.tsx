import { Box, Heading } from "@chakra-ui/react";

export function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      bg="opsPanel"
      borderColor="opsBorder"
      borderRadius="xl"
      borderWidth="1px"
      p="5"
    >
      <Heading color="opsText" mb="4" size="md">
        {title}
      </Heading>
      {children}
    </Box>
  );
}
