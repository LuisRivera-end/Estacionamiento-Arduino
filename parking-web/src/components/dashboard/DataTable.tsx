import { Box, Table } from "@chakra-ui/react";

type DataTableProps = {
  headers: string[];
  rows: Array<Array<string | number>>;
};

export function DataTable({ headers, rows }: DataTableProps) {
  return (
    <Box
      bg="opsPanel"
      borderColor="opsBorder"
      borderRadius="xl"
      borderWidth="1px"
      overflowX="auto"
    >
      <Table.Root size="sm" variant="outline">
        <Table.Header bg="opsPanelMuted">
          <Table.Row bg="opsPanelMuted">
            {headers.map((header) => (
              <Table.ColumnHeader
                bg="opsPanelMuted"
                borderColor="opsBorder"
                color="opsText"
                fontWeight="semibold"
                key={header}
              >
                {header}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body bg="opsPanel">
          {rows.map((row, index) => (
            <Table.Row
              _hover={{ bg: "opsPanelMuted" }}
              bg="opsPanel"
              borderColor="opsBorder"
              key={index}
            >
              {row.map((cell, cellIndex) => (
                <Table.Cell
                  bg="transparent"
                  borderColor="opsBorder"
                  color="opsText"
                  key={cellIndex}
                >
                  {cell}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
