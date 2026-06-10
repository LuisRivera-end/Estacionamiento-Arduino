import { Box, Text } from "@chakra-ui/react";

type MetricCardProps = {
  label: string;
  value: string | number;
  tone?: "default" | "green" | "yellow" | "red" | "cyan";
};

const colorByTone: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "opsText",
  green: "opsGreen",
  yellow: "opsYellow",
  red: "opsRed",
  cyan: "opsCyan",
};


export function MetricCard({
  label,
  value,
  tone = "default",
}: MetricCardProps) {
  return (
    <Box
      bg="opsPanel"
      borderWidth="1px"
      borderColor="opsBorder"
      boxShadow="sm"
      borderRadius="xl"
      p="5"
      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: "md",
        borderColor: "opsCyan",
      }}
    >
      <Text
        color="opsMuted"
        fontSize="xs"
        fontWeight="bold"
        textTransform="uppercase"
        letterSpacing="0.05em"
        mb="2"
      >
        {label}
      </Text>
      <Text
        color={colorByTone[tone]}
        fontSize="3xl"
        fontWeight="bold"
      >
        {value}
      </Text>
    </Box>
  );
}

