import { expect, test } from "@playwright/test";

test("public user can complete simulated payment flow", async ({ page }) => {
  await page.goto("/pagar");
  await page.getByLabel("Codigo de ticket").fill("a1b2c");
  await page.waitForTimeout(1_000);
  await page.getByRole("button", { name: "Consultar ticket" }).click();

  await expect(page).toHaveURL(/\/pagar\/A1B2C$/, { timeout: 30_000 });
  await expect(page.getByText("A1B2C")).toBeVisible();
  await page
    .getByRole("link", { name: "Continuar a checkout simulado" })
    .click();

  await expect(page).toHaveURL(/\/pagar\/A1B2C\/checkout$/, { timeout: 30_000 });
  await page.waitForTimeout(1_000);
  await page.getByRole("button", { name: "Confirmar pago simulado" }).click();

  await expect(page).toHaveURL(/\/pagar\/A1B2C\/confirmacion$/, {
    timeout: 30_000,
  });
  await expect(page.getByText(/pago simulado registrado/i)).toBeVisible();
});
