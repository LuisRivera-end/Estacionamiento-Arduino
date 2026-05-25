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
      borderColor="opsBorder"
      borderRadius="xl"
      borderWidth="1px"
      p="5"
    >
      <Text color="opsMuted" fontSize="sm">
        {label}
      </Text>
      <Text color={colorByTone[tone]} fontSize="3xl" fontWeight="bold">
        {value}
      </Text>
    </Box>
  );
}
