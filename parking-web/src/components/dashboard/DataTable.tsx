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
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            {headers.map((header) => (
              <Table.ColumnHeader color="opsMuted" key={header}>
                {header}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row, index) => (
            <Table.Row key={index}>
              {row.map((cell, cellIndex) => (
                <Table.Cell color="opsText" key={cellIndex}>
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
