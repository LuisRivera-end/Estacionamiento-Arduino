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

const glowClassByTone: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "neon-glow-cyan",
  cyan: "neon-glow-cyan",
  green: "neon-glow-green",
  yellow: "neon-glow-yellow",
  red: "neon-glow-red",
};

const textShadowByTone: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "0 0 12px rgba(229, 237, 247, 0.2)",
  cyan: "0 0 12px rgba(6, 182, 212, 0.4)",
  green: "0 0 12px rgba(16, 185, 129, 0.4)",
  yellow: "0 0 12px rgba(245, 158, 11, 0.4)",
  red: "0 0 12px rgba(239, 68, 68, 0.4)",
};

export function MetricCard({
  label,
  value,
  tone = "default",
}: MetricCardProps) {
  const glowClass = glowClassByTone[tone];

  return (
    <Box
      className={`glass-panel ${glowClass}`}
      borderRadius="xl"
      p="5"
      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        transform: "translateY(-4px) scale(1.02)",
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
        fontFamily="var(--font-orbitron)"
        fontSize="3xl"
        fontWeight="900"
        letterSpacing="0.02em"
        textShadow={textShadowByTone[tone]}
      >
        {value}
      </Text>
    </Box>
  );
}

