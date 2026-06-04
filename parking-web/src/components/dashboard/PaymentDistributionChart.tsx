"use client";

import { Box, Flex, Text, Stack } from "@chakra-ui/react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useChart, ChartRoot, ChartTooltip } from "@chakra-ui/charts";

type PaymentDistributionChartProps = {
  paidTickets: number;
  discountedPaymentsSenior: number;
  discountedPaymentsStudent: number;
};

export function PaymentDistributionChart({
  paidTickets,
  discountedPaymentsSenior,
  discountedPaymentsStudent,
}: PaymentDistributionChartProps) {
  const standardPayments = Math.max(
    0,
    paidTickets - discountedPaymentsSenior - discountedPaymentsStudent
  );
  const totalPayments = standardPayments + discountedPaymentsSenior + discountedPaymentsStudent;

  const hasData = totalPayments > 0;

  const data = hasData
    ? [
        { name: "Estándar", value: standardPayments, color: "opsCyan" },
        { name: "Adulto Mayor", value: discountedPaymentsSenior, color: "opsGreen" },
        { name: "Estudiante", value: discountedPaymentsStudent, color: "opsYellow" },
      ].filter((item) => item.value > 0)
    : [{ name: "Sin pagos", value: 1, color: "opsBorder" }];

  const chart = useChart({
    data,
    series: [
      { name: "value", label: "Pagos" },
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
            {hasData ? totalPayments : 0}
          </Text>
          <Text fontSize="xs" color="opsMuted">
            pagos registrados
          </Text>
        </Flex>

        <ChartRoot chart={chart} height="100%" width="100%">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {hasData && <Tooltip content={<ChartTooltip nameKey="name" />} />}
              <Pie
                data={chart.data}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={hasData ? 4 : 0}
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

      {/* Legend */}
      <Flex gap="5" justify="center" wrap="wrap" width="100%" mt="-2">
        {hasData ? (
          <>
            {standardPayments > 0 && (
              <Flex align="center" gap="1.5">
                <Box w="2.5" h="2.5" rounded="full" bg="opsCyan" />
                <Text fontSize="2xs" color="opsMuted">
                  Estándar ({standardPayments})
                </Text>
              </Flex>
            )}
            {discountedPaymentsSenior > 0 && (
              <Flex align="center" gap="1.5">
                <Box w="2.5" h="2.5" rounded="full" bg="opsGreen" />
                <Text fontSize="2xs" color="opsMuted">
                  A. Mayor ({discountedPaymentsSenior})
                </Text>
              </Flex>
            )}
            {discountedPaymentsStudent > 0 && (
              <Flex align="center" gap="1.5">
                <Box w="2.5" h="2.5" rounded="full" bg="opsYellow" />
                <Text fontSize="2xs" color="opsMuted">
                  Estudiante ({discountedPaymentsStudent})
                </Text>
              </Flex>
            )}
          </>
        ) : (
          <Text fontSize="2xs" color="opsMuted">
            No se han registrado pagos con o sin descuento el día de hoy.
          </Text>
        )}
      </Flex>
    </Stack>
  );
}
