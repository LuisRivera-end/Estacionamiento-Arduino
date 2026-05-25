import { expect, test } from "@playwright/test";

test("public user can complete simulated payment flow", async ({ page }) => {
  await page.goto("/pagar");
  await page.getByLabel("Codigo de ticket").fill("a1b2c");
  await page.getByRole("button", { name: "Consultar ticket" }).click();

  await expect(page).toHaveURL(/\/pagar\/A1B2C$/);
  await expect(page.getByText("A1B2C")).toBeVisible();
  await page
    .getByRole("link", { name: "Continuar a checkout simulado" })
    .click();

  await expect(page).toHaveURL(/\/pagar\/A1B2C\/checkout$/);
  await page.getByRole("button", { name: "Confirmar pago simulado" }).click();

  await expect(page).toHaveURL(/\/pagar\/A1B2C\/confirmacion$/);
  await expect(page.getByText(/pago simulado registrado/i)).toBeVisible();
});
