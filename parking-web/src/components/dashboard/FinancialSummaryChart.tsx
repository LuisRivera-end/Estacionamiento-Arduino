"use client";

import { Box } from "@chakra-ui/react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChart, ChartRoot, ChartTooltip } from "@chakra-ui/charts";
import { formatCurrency } from "@/lib/formatters";

type FinancialSummaryChartProps = {
  simulatedRevenueToday: number;
  totalDiscountToday: number;
};

export function FinancialSummaryChart({
  simulatedRevenueToday,
  totalDiscountToday,
}: FinancialSummaryChartProps) {
  const data = [
    { name: "Ingresos", value: simulatedRevenueToday, color: "opsYellow" },
    { name: "Descuentos", value: totalDiscountToday, color: "opsRed" },
  ];

  const chart = useChart({
    data,
    series: [
      { name: "value", label: "Monto" },
    ],
  });

  return (
    <Box width="100%" height="220px">
      <ChartRoot chart={chart} height="100%" width="100%">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chart.data}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chart.color("opsBorder")}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke={chart.color("opsMuted")}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={chart.color("opsMuted")}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              cursor={{ fill: chart.color("opsPanelMuted"), opacity: 0.3 }}
              content={
                <ChartTooltip
                  nameKey="name"
                  formatter={(value) => formatCurrency(Number(value), "MXN")}
                />
              }
            />
            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            >
              {chart.data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chart.color(entry.color)}
                  style={{ outline: "none" }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartRoot>
    </Box>
  );
}
