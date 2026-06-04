"use client";

import { Box, Flex, Text, Stack } from "@chakra-ui/react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useChart, ChartRoot, ChartTooltip } from "@chakra-ui/charts";
import { formatDateTime } from "@/lib/formatters";

type OccupancyChartProps = {
  capacityTotal: number;
  occupiedSpaces: number;
  availableSpaces: number;
  lastEntryAt: string | null;
  lastExitAt: string | null;
};

export function OccupancyChart({
  capacityTotal,
  occupiedSpaces,
  availableSpaces,
  lastEntryAt,
  lastExitAt,
}: OccupancyChartProps) {
  const data = [
    { name: "Ocupados", value: occupiedSpaces, color: "opsCyan" },
    { name: "Disponibles", value: availableSpaces, color: "opsGreen" },
  ];

  const chart = useChart({
    data,
    series: [
      { name: "value", label: "Cantidad" },
    ],
  });

  return (
    <Stack gap="5" align="center" width="100%">
      <Box position="relative" width="100%" height="220px">
        {/* Central Overlay Text */}
        <Flex
          direction="column"
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          align="center"
          justify="center"
          pointerEvents="none"
        >
          <Text
            fontSize="3xl"
            fontWeight="bold"
            fontFamily="heading"
            color="opsText"
            lineHeight="shorter"
          >
            {occupiedSpaces}
          </Text>
          <Text fontSize="xs" color="opsMuted">
            de {capacityTotal} lugares
          </Text>
        </Flex>

        <ChartRoot chart={chart} height="100%" width="100%">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<ChartTooltip nameKey="name" />} />
              <Pie
                data={chart.data}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
              >
                {chart.data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={chart.color(entry.color)}
                    style={{ outline: "none" }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartRoot>
      </Box>

      {/* Custom Legend */}
      <Flex gap="6" justify="center" wrap="wrap" width="100%" mt="-2">
        <Flex align="center" gap="2">
          <Box w="3" h="3" rounded="full" bg="opsCyan" />
          <Text fontSize="xs" color="opsMuted">
            Ocupados ({occupiedSpaces})
          </Text>
        </Flex>
        <Flex align="center" gap="2">
          <Box w="3" h="3" rounded="full" bg="opsGreen" />
          <Text fontSize="xs" color="opsMuted">
            Disponibles ({availableSpaces})
          </Text>
        </Flex>
      </Flex>

      {/* Last Activity Section */}
      <Box
        width="100%"
        borderTopWidth="1px"
        borderColor="opsBorder"
        pt="3"
        display="grid"
        gridTemplateColumns={{ base: "1fr", sm: "1fr 1fr" }}
        gap="3"
        textAlign="center"
      >
        <Box>
          <Text fontSize="2xs" color="opsMuted" textTransform="uppercase" fontWeight="bold">
            Última entrada
          </Text>
          <Text fontSize="xs" color="opsText" fontWeight="medium">
            {lastEntryAt ? formatDateTime(lastEntryAt) : "Sin registro"}
          </Text>
        </Box>
        <Box>
          <Text fontSize="2xs" color="opsMuted" textTransform="uppercase" fontWeight="bold">
            Última salida
          </Text>
          <Text fontSize="xs" color="opsText" fontWeight="medium">
            {lastExitAt ? formatDateTime(lastExitAt) : "Sin registro"}
          </Text>
        </Box>
      </Box>
    </Stack>
  );
}
