import { Grid, Heading } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { DataTable } from "@/components/dashboard/DataTable";
import { PricingEditor } from "@/components/dashboard/PricingEditor";
import { getPricingRule } from "@/lib/api/admin-settings";
import { getServerAccessToken } from "@/lib/auth/server";
import { formatCurrency } from "@/lib/formatters";

export default async function PricingPage() {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  const pricing = await getPricingRule(accessToken);

  return (
    <Grid gap="5">
      <Heading color="opsText">Tarifas</Heading>
      <PricingEditor initialPricing={pricing} />
      <DataTable
        headers={["Regla", "Valor"]}
        rows={[
          ["Nombre", pricing.name],
          ["Tolerancia", `${pricing.free_tolerance_minutes} minutos`],
          ["Bloque", `${pricing.block_minutes} minutos`],
          ["Monto por bloque", formatCurrency(pricing.block_amount, "MXN")],
          ["Extravio", formatCurrency(pricing.lost_ticket_fee, "MXN")],
          ["Descuento adulto mayor", `${pricing.senior_discount_percent}%`],
          ["Descuento estudiante", `${pricing.student_discount_percent}%`],
          ["Dominios estudiante", pricing.student_allowed_domains.join(", ")],
          [
            "Adulto mayor aplica a extravio",
            pricing.senior_discount_applies_to_lost_ticket ? "Si" : "No",
          ],
          [
            "Estudiante aplica a extravio",
            pricing.student_discount_applies_to_lost_ticket ? "Si" : "No",
          ],
          ["Activa", pricing.is_active ? "Si" : "No"],
        ]}
      />
    </Grid>
  );
}
