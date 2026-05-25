import { Badge } from "@chakra-ui/react";

type StatusBadgeProps = {
  label: string;
  tone: "success" | "warning" | "danger" | "info" | "muted";
};

const paletteByTone: Record<StatusBadgeProps["tone"], string> = {
  success: "green",
  warning: "yellow",
  danger: "red",
  info: "cyan",
  muted: "gray",
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return <Badge colorPalette={paletteByTone[tone]}>{label}</Badge>;
}
