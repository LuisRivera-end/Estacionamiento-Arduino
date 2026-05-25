import { Button, Grid, Heading } from "@chakra-ui/react";

import { DataTable } from "@/components/dashboard/DataTable";

export default function BackupsPage() {
  return (
    <Grid gap="5">
      <Heading color="opsText">Backups</Heading>
      <Button colorPalette="cyan" w="fit-content">
        Solicitar backup manual
      </Button>
      <DataTable
        headers={["Fecha", "Estado", "Solicitante"]}
        rows={[["2026-05-23", "Solicitado", "admin"]]}
      />
    </Grid>
  );
}
